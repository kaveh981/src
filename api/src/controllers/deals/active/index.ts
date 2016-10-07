'use strict';

import * as express from 'express';
import * as Promise from 'bluebird';

import { Logger } from '../../../lib/logger';
import { Injector } from '../../../lib/injector';
import { ConfigLoader } from '../../../lib/config-loader';
import { RamlTypeValidator } from '../../../lib/raml-type-validator';
import { ProtectedRoute } from '../../../middleware/protected-route';
import { DealManager } from '../../../models/deal/deal-manager';
import { PackageManager } from '../../../models/package/package-manager';
import { PackageModel } from '../../../models/package/package-model';
import { UserManager } from '../../../models/user/user-manager';

const dealManager = Injector.request<DealManager>('DealManager');
const packageManager = Injector.request<PackageManager>('PackageManager');
const userManager = Injector.request<UserManager>('UserManager');
const validator = Injector.request<RamlTypeValidator>('Validator');

const Log: Logger = new Logger('ACTD');

/**
 * Function that takes care of all /deals/active routes
 */
function ActiveDeals(router: express.Router): void {
    /**
     * GET request to get all active deals.
     */
    router.get('/', ProtectedRoute, (req: express.Request, res: express.Response) => {

        // Validate pagination parameters
        let pagination = {
            limit: req.query.limit,
            offset: req.query.offset
        };

        let validationErrors = validator.validateType(pagination, 'Pagination',
                               { fillDefaults: true, forceOnError: ['TYPE_NUMB_TOO_LARGE'] });

        if (validationErrors.length > 0) {
            Log.debug('Request is invalid');
            res.sendValidationError(validationErrors);
            return;
        }

        // Get all active deals for current buyer
        let buyerId = Number(req.ixmBuyerInfo.userID);

        return dealManager.fetchActiveDealsFromBuyerId(buyerId, pagination)
            .then((activeDeals) => {
                if (activeDeals.length === 0) {
                    res.sendError(200, '200_NO_DEALS');
                    return;
                }
                res.sendPayload(activeDeals.map((deal) => { return deal.toPayload(); }), pagination);
            })
            .catch((err: Error) => {
                Log.error(err);
                throw err;
            });

    })
    /**
     * PUT request to accept a deal and insert it into the database to activate it.
     */
    .put('/', ProtectedRoute, (req: express.Request, res: express.Response) => {
        let validationErrors = validator.validateType(req.body, 'AcceptDealRequest');

        if (validationErrors.length > 0) {
            Log.debug('Request is invalid');
            res.sendValidationError(validationErrors);
            return;
        }

        let packageID: number = req.body.packageID;
        let buyerID = Number(req.ixmBuyerInfo.userID);

        Promise.coroutine(function* (): any {
            // Check that package exists
            let thePackage = yield packageManager.fetchPackageFromId(packageID);

            if (!thePackage) {
                Log.debug('Package does not exist');
                res.sendNotFoundError();
                return;
            }

            // Check that the package is available for purchase
            let owner = yield userManager.fetchUserFromId(thePackage.ownerID.toString());

            if (!thePackage.isValidAvailablePackage() || !(owner.status === 'A')) {
                Log.debug('Package is not available for purchase');
                res.sendError(403, '403');
                return;
            }

            // Check that package has not been bought yet by this buyer
            let accepted = yield packageManager.isPackageMappedToBuyer(packageID, buyerID);

            if (accepted) {
                Log.debug('Package has already been accepted');
                res.sendError(403, '403');
                return;
            }

            // Check if the package already has a deal associated with this buyer's DSP
            let existingDeal = yield dealManager.fetchExistingDealWithBuyerDSP(packageID, buyerID);

            if (existingDeal) {
                // If buyer's DSP already accepted this deal, just add a mapping between this buyer and the existing deal
                // and return this deal
                Log.info("Deal for this package already exists with buyer's DSP");
                yield dealManager.insertBuyerDealMapping(buyerID, existingDeal.id);
                res.sendPayload(existingDeal.toPayload());
            } else {
                // If not, create a new deal in the database
                Log.info("New deal will be created");
                let newDeal = yield dealManager.saveDealForBuyer(buyerID, thePackage);
                res.sendPayload(newDeal.toPayload());
            }

        })()
        .catch((err: Error) => {
            Log.error(err);
            throw err;
        });
    });

};

module.exports = ActiveDeals;

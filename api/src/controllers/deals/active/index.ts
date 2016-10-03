'use strict';

import * as express from 'express';
import * as Promise from 'bluebird';

import { Logger } from '../../../lib/logger';
import { Injector } from '../../../lib/injector';
import { ConfigLoader } from '../../../lib/config-loader';
import { RamlTypeValidator } from '../../../lib/raml-type-validator';
import { ProtectedRoute } from '../../../middleware/protected-route';
import { DealManager } from '../../../models/deal/deal-manager';

const dealManager = Injector.request<DealManager>('DealManager');
const validator = Injector.request<RamlTypeValidator>('Validator');

const Log: Logger = new Logger('ACTD');

/**
 * Function that takes care of all /deals/active routes
 */
function ActiveDeals(router: express.Router): void {
    /**
     * GET request to get all active deals. The function first validates pagination query parameters. It then retrieves all
     * active deals from the database and returns them.
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

    });

};

module.exports = ActiveDeals;

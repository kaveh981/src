'use strict';

import * as express from 'express';
import * as Promise from 'bluebird';

import { Logger } from '../../lib/logger';
import { Injector } from '../../lib/injector';
import { ConfigLoader } from '../../lib/config-loader';
import { RamlTypeValidator } from '../../lib/raml-type-validator';
import { ProtectedRoute } from '../../middleware/protected-route';
import { PackageManager } from '../../models/package/package-manager';
import { UserManager } from '../../models/user/user-manager';
import { PackageModel } from '../../models/package/package-model';

const packageManager = Injector.request<PackageManager>('PackageManager');
const userManager = Injector.request<UserManager>('UserManager');
const validator = Injector.request<RamlTypeValidator>('Validator');

const Log: Logger = new Logger('DEAL');

/**
 * Function that takes care of /deals route
 */
function Deals(router: express.Router): void {

    /**
     * GET request to get all available packages. The function first validates pagination query parameters. It then retrieves all
     * packages from the database and filters out all invalid ones, before returning the rest of the them to the requesting entity.
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

        // Get all packages with an 'active' status
        return packageManager.fetchPackagesFromStatus('active', pagination)
            .then((activePackages: PackageModel[]) => {
                return Promise.map(activePackages, (activePackage: PackageModel) => {
                    // Make sure a package is owned by an active user, has valid dates, and has at least one associated deal section
                     return userManager.fetchUserFromId(activePackage.ownerID.toString())
                        .then((user) => {
                            if (activePackage.isValidAvailablePackage() && user.userStatus === 'A') {
                                return activePackage;
                            }
                        });
                });
            })
            .then((availablePackages) => {
                if (availablePackages.length === 0) {
                    res.sendError(200, '200_NO_PACKAGES');
                    return;
                }
                res.sendPayload(availablePackages.map((pack) => { return pack.toPayload(); }), pagination);
            })
            .catch((err: Error) => {
                Log.error(err);
                throw err;
            });

    });

};

module.exports = Deals;

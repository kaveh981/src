'use strict';

import * as express from 'express';
import * as Promise from 'bluebird';

import { Logger } from '../../lib/logger';
import { Injector } from '../../lib/injector';
import { ConfigLoader } from '../../lib/config-loader';
import { Validator } from '../../lib/validator';

import { PackageManager } from '../../models/package/package-manager';
import { UserManager } from '../../models/user/user-manager';

import { PackageModel } from '../../models/package/package-model';

const packageManager = Injector.request<PackageManager>('PackageManager');
const userManager = Injector.request<UserManager>('UserManager');
const config = Injector.request<ConfigLoader>('ConfigLoader');
const validator = Injector.request<Validator>('Validator');

const paginationConfig = config.get('pagination');

const Log: Logger = new Logger('DEAL');

/**
 * Function that takes care of all /deals routes
 */
function Deals(router: express.Router): void {

    /**
     * GET request to get all available packages. The function first validates pagination query parameters. It then retrieves all
     * packages from the database and filters out all invalid ones, before returning the rest of the them to the requesting entity.
     */
    router.get('/', (req: express.Request, res: express.Response) => {
        // Extract pagination details
        if (typeof req.query.limit === 'undefined') {
            Log.trace('Pagination limit not provided');
        }

        if (typeof req.query.offset === 'undefined') {
            Log.trace('Pagination offset not provided');
        }

        let limit: number = (Number(req.query.limit) > paginationConfig['RESULTS_LIMIT'] || typeof req.query.limit === 'undefined')
                ? paginationConfig['RESULTS_LIMIT'] : Number(req.query.limit);
        let offset: number = Number(req.query.offset) || paginationConfig['DEFAULT_OFFSET'];

        let pagination = {
            limit: limit,
            offset: offset
        };

        let validation: any = validator.validate(pagination, 'Pagination');
        if (validation.success === 0) {
            res.sendValidationError(['Some pagination parameters are invalid']);
            Log.error(validation.errors);
            return;
        }

        // Get all packages with an 'active' status
        let availablePackages = [];
        return packageManager.fetchPackagesFromStatus('active', pagination)
            .then((activePackages: PackageModel[]) => {
                return Promise.each(activePackages, (activePackage: PackageModel) => {
                    // Make sure a package is owned by an active user, has valid dates, and has at least one associated deal section
                     return userManager.fetchUserFromId(String(activePackage.ownerID))
                        .then((user) => {
                            if (activePackage.isValidAvailablePackage(user)) {
                                     availablePackages.push(activePackage);
                            }
                        });
                })
                .then(() => {
                    if (availablePackages.length === 0) {
                        res.sendError(200, '200_NO_PACKAGES');
                        return;
                    }
                    res.sendPayload(availablePackages, pagination);
                });
            })
            .catch((err: Error) => {
                Log.error(err);
                throw err;
            });

    });

};

module.exports = Deals;

'use strict';

import * as express from 'express';
import * as Promise from 'bluebird';

import { Logger } from '../../lib/logger';
import { DatabaseManager } from '../../lib/database-manager';
import { Injector } from '../../lib/injector';
import { ConfigLoader } from '../../lib/config-loader';

import { PackageManager } from '../../models/package/package-manager';
import { UserManager } from '../../models/user/user-manager';

const packageManager = Injector.request<PackageManager>('PackageManager');
const userManager = Injector.request<UserManager>('UserManager');

const config = Injector.request<ConfigLoader>('ConfigLoader');
const paginationConfig = config.get('pagination');

const Log: Logger = new Logger('DEAL');

/**
 * Function that takes care of all /deals routes
 */
function Deals(router: express.Router): void {

    /**
     * GET request to get all available Deals
     */
    router.get('/', (req: express.Request, res: express.Response) => {
        // Extract pagination details
        let pagination = {
            limit: (req.query.limit > paginationConfig['RESULTS_LIMIT'] || req.query.limit === undefined)
                ? paginationConfig['RESULTS_LIMIT'] : req.query.limit,
            offset: Number(req.query.offset) || paginationConfig['DEFAULT_OFFSET']
        };
        // Get all packages with an 'active' status
        let availablePackages = [];
        return packageManager.fetchPackagesFromStatus('active', pagination)
            .then((activePackages: any) => {
                return Promise.each(activePackages, (activePackage: any) => {
                    let startDate: Date = new Date(activePackage.startDate);
                    let endDate: Date = new Date(activePackage.endDate);
                    let today: Date = new Date(Date.now());
                    let zeroDate: string = '0000-00-00';
                    // Set all date "hours" to be 0 to be able to just compare the dates alone
                    startDate.setHours(0, 0, 0, 0);
                    endDate.setHours(0, 0, 0, 0);
                    today.setHours(0, 0, 0, 0);
                    // Make sure a package is owned by an active user, has valid dates, and has at least one associated deal section
                     return userManager.fetchUserFromId(activePackage.ownerID)
                        .then((user) => {
                            if (user.userStatus === 'A'
                                && (startDate <= today || activePackage.startDate === zeroDate)
                                && (endDate >= today || activePackage.endDate === zeroDate)
                                && activePackage.sections.length > 0) {
                                     availablePackages.push(activePackage);
                            }
                        });
                })
                .then(() => {
                    if (availablePackages.length === 0) {
                        res.sendError(200, '200_NO_PACKAGES');
                        return;
                    }
                    res.sendPayload(availablePackages);
                });
            })
            .catch((err: Error) => {
                Log.error(err);
                throw err;
            });

    });

};

module.exports = Deals;

'use strict';

import * as express from 'express';
import * as Promise from 'bluebird';

import { Logger } from '../../lib/logger';
import { DatabaseManager } from '../../lib/database-manager';
import { Injector } from '../../lib/injector';

import { PackageManager } from '../../models/package/package-manager';
import { PackageModel } from '../../models//package/package-model';

import { UserManager } from '../../models/user/user-manager';
import { UserModel } from '../../models/user/user-model';

const databaseManager = Injector.request<DatabaseManager>('DatabaseManager');
const packageManager = new PackageManager(databaseManager);
const userManager: UserManager = new UserManager(databaseManager);

const Log: Logger = new Logger('DEAL');

/**
 * Function that takes care of all /deal routes
 */
function Deals(router: express.Router): void {

    /**
     * GET request to get all available Deals
     */
    router.get('/', (req: express.Request, res: express.Response) => {
        let availablePackages = [];
        // Get all packages with an 'active' status
        packageManager.getPackagesFromStatus('active')
            .then((activePackages: any) => {
                Promise.each(activePackages, (activePackage: any) => {
                    let startDate: Date = new Date(activePackage.startDate);
                    let endDate: Date = new Date(activePackage.endDate);
                    let today: Date = new Date(Date.now());
                    let zeroDate: string = '0000-00-00';
                    // Set all date "hours" to be 0 to be able to just compare the dates alone
                    startDate.setHours(0, 0, 0, 0);
                    endDate.setHours(0, 0, 0, 0);
                    today.setHours(0, 0, 0, 0);
                    // Make sure a package is owned by an active user, has valid dates, and has at least one associated deal section
                    userManager.fetchUserFromId(activePackage.ownerID)
                        .then((user: UserModel) => {
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

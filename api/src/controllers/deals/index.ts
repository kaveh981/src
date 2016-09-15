'use strict';

import * as express from 'express';
import * as Promise from 'bluebird';
import { PackageModel } from '../../models/packages';
import { Logger } from '../../lib/logger';
import { UserModel } from '../../models/user';

const Log: Logger = new Logger('DEAL');

function Deals(router: express.Router): void {

    router.get('/', (req: express.Request, res: express.Response) => {
        let availablePackages = [];
        PackageModel.getPackagesFromStatus('active')
            .then((activePackages: any) => {
                Promise.each(activePackages, (activePackage: any) => {
                    let startDate: Date = new Date(activePackage.startDate);
                    let endDate: Date = new Date(activePackage.endDate);
                    let today: Date = new Date(Date.now());
                    let zeroDate: string = '0000-00-00';

                    startDate.setHours(0, 0, 0, 0);
                    endDate.setHours(0, 0, 0, 0);
                    today.setHours(0, 0, 0, 0);

                    return UserModel.isActiveUser(activePackage.ownerID)
                        .then((isUserActive) => {
                            if (isUserActive
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

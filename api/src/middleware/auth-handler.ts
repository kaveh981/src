'use strict';

import * as Promise from 'bluebird';
import * as express from 'express';

import { ConfigLoader } from '../lib/config-loader';
import { Injector } from '../lib/injector';
import { Logger } from '../lib/logger';
import { UserManager } from '../models/user/user-manager';

const userManager = Injector.request<UserManager>('UserManager');
const config = Injector.request<ConfigLoader>('ConfigLoader');

const authConfig = config.get('auth');

const Log = new Logger('AUTH');

/** Verify if the token is legitimate, and is an IXM buyer */
function verifyToken(token: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {

        // Right now the "token" is just the user id.
        userManager.fetchUserFromId(token)
            .then((userInfo) => {
                // User not found or not an IXM buyer
                if (!userInfo || !authConfig.allowedUserTypes.includes(userInfo.userType)) {
                    resolve('401_NOT_IXMBUYER');
                    return;
                } else if (userInfo.status !== 'A') {
                    resolve('401_NOT_ACTIVE');
                    return;
                }

                resolve('OK');
            })
            .catch((err: Error) => {
                Log.error(err);
                throw err;
            });

    });
}

/**
 * Temporary authentication handler, simply extracts userId from the configured header and inserts into ixmBuyerInfo
 * if the userId corresponds to an ixmBuyer.
 */
function AuthHandler(req: express.Request, res: express.Response, next: Function): void {
    let accessToken = req.get(authConfig['header']);

    if (!accessToken) {
        next();
        return;
    }

    verifyToken(accessToken)
        .then((result) => {
            if (result !== 'OK') {
                res.sendError(401, result);
                return;
            }

            req.ixmBuyerInfo = { userID: accessToken };
            next();
        })
        .catch((err: Error) => {
            Log.error(err);
        });
}

module.exports = () => { return AuthHandler; };

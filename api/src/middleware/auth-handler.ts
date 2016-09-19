'use strict';

import * as http from 'http';
import * as express from 'express';

import { ConfigLoader } from '../lib/config-loader';
import { Injector } from '../lib/injector';
import { Logger } from '../lib/logger';
import { UserManager } from '../models/user/user-manager';

const userManager = Injector.request<UserManager>('UserManager');
const config = Injector.request<ConfigLoader>('ConfigLoader');

const authConfig = config.get('auth');

const Log = new Logger('AUTH');

/**
 * Public access switch, if the configuration is set to private we block any unauthorized access.
 */
function publicAccessHandler(req: express.Request, res: express.Response, next: Function): void {
    if (!authConfig['public']) {
        res.sendError(401, '401_NO_HEADER');
    } else {
        next();
    }
};

/**
 * Temporary authentication handler, simply extracts userId from the configured header and inserts into ixmBuyerInfo
 * if the userId corresponds to an ixmBuyer.
 */
function AuthHandler(req: express.Request, res: express.Response, next: Function): void {
    let userId = req.get(authConfig['header']);

    if (!userId) {
        publicAccessHandler(req, res, next);
        return;
    }

    if (isNaN(Number(userId)) || Number(userId) <= 0) {
        res.sendError(401, '401_INVALID_HEADER');
        return;
    }

    userManager.fetchUserFromId(userId)
        .then((userInfo) => {
            // User not found or not an IXM buyer
            if (!userInfo || userInfo.userType !== 'IXMB') {
                res.sendError(401, '401_NOT_IXMBUYER');
                return;
            } else if (userInfo.userStatus !== 'A') {
                res.sendError(401, '401_NOT_ACTIVE');
                return;
            }

            req.ixmBuyerInfo = { userId: userId };
            next();
        })
        .catch((err: Error) => {
            Log.error(err);
        });
}

// // Handle authentication of request, an authenticated user request will have req.ixmBuyerInfo.userId
// function AuthHandler(req: express.Request, res: express.Response, next: Function): void {
//     let accessToken = req.get(authConfig['header']);

//     if (accessToken) {
//         // Send a token verification request.
//         let request = http.request(authConfig['httpOptions'], (response: http.IncomingMessage) => {
//             // Status code should be 200 for a legitimate user.
//             if (response.statusCode !== 200) {
//                 publicAccessHandler(req, res, next);
//                 return;
//             }

//             // Parse returned data
//             response.on('data', (chunk: string) => {
//                 let userData = JSON.parse(chunk);

//                 // Only allow usertypes specified in config
//                 if (!authConfig['allowedUsertypes'].includes(userData.userType)) {
//                     publicAccessHandler(req, res, next);
//                     return;
//                 }

//                 res.ixmBuyerInfo = {
//                     userId: userData.userId
//                 };
//             });
//         });

//         // Log a warning on error, no need to throw anything.
//         request.on('error', (err: Error) => {
//             Log.warn('Authentication error ' + err);
//             res.sendInternalAuthError();
//         });

//         request.write(accessToken);
//         request.end();
//     } else {
//         publicAccessHandler(req, res, next);
//     }
// }

module.exports = () => { return AuthHandler; };

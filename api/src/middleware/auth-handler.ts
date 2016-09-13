'use strict';

import * as http from 'http';
import * as express from 'express';

import { Config } from '../lib/config';
import { Logger } from '../lib/logger';
import { BuyerModel } from '../models/buyers';

const Log = new Logger('AUTH');
const authConfig = Config.get('auth');

// Public access switch, if the configuration is set to private we block any unauthorized access
function publicAccessHandler(req: express.Request, res: express.Response, next: Function): void {
    if (!authConfig['public']) {
        res.sendUnauthorizedError();
    } else {
        next();
    }
};

// Temporary authentication handler, simply extracts userId from the configured header.
function AuthHandler(req: express.Request, res: express.Response, next: Function): void {
    let authHeader = req.get(authConfig['header']);
    let userId = Number(authHeader);

     if (userId && !isNaN(userId)) {
         BuyerModel.isIXMBuyer(userId)
            .then((isBuyer: boolean) => {
                if (isBuyer) {
                    res.ixmBuyerInfo = { userId: authHeader };
                    next();
                } else {
                    res.sendUnauthorizedError();
                }
            });
    } else {
        publicAccessHandler(req, res, next);
    }
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
//         request.on('error', (err: ErrorEvent) => {
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

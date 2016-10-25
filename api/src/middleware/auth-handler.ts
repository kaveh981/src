'use strict';

import * as express from 'express';

import { ConfigLoader } from '../lib/config-loader';
import { Injector } from '../lib/injector';
import { Logger } from '../lib/logger';
import { UserManager } from '../models/user/user-manager';
import { BuyerManager } from '../models/buyer/buyer-manager';

const userManager = Injector.request<UserManager>('UserManager');
const buyerManager = Injector.request<BuyerManager>('BuyerManager');
const config = Injector.request<ConfigLoader>('ConfigLoader');

const authConfig = config.get('auth');

const Log = new Logger('AUTH');

/** Verify if the token is legitimate, and is an IXM buyer */
async function verifyToken(token: string): Promise<string> {

        if (!Number(token)) {
            return '401_NOT_IXMBUYER';
        }

        // Right now the "token" is just the user id.
        let userInfo = await userManager.fetchUserFromId(Number(token));

        // User not found or not an IXM buyer
        if (!userInfo || !authConfig.allowedUserTypes.includes(userInfo.userType)) {
            return '401_NOT_IXMBUYER';
        } else if (userInfo.status !== 'A') {
            return '401_NOT_ACTIVE';
        }

        return 'OK';

}

/**
 * Temporary authentication handler. Simply extracts userId from the configured header and inserts into ixmBuyerInfo
 * if the userId corresponds to an ixmBuyer.
 */
async function AuthHandler (req: express.Request, res: express.Response, next: Function) {

    let accessToken = req.get(authConfig['header']);

    if (!accessToken) {
        next();
        return;
    }

    let verificationStatus = await verifyToken(accessToken);

    if (verificationStatus !== 'OK') {
        res.sendError(verificationStatus);
    } else {
        req.ixmBuyerInfo = await buyerManager.fetchBuyerFromId(Number(accessToken));
        next();
    }

}

module.exports = () => { return AuthHandler; };

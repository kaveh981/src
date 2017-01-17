'use strict';

import * as express from 'express';
import * as jwt from 'jsonwebtoken';

import { ConfigLoader } from '../lib/config-loader';
import { Injector } from '../lib/injector';
import { Logger } from '../lib/logger';
import { MarketUserManager } from '../models/market-user/market-user-manager';
import { HTTPError } from '../lib/http-error';
import { UserManager } from '../models/user/user-manager';

const marketUserManager = Injector.request<MarketUserManager>('MarketUserManager');
const userManager = Injector.request<UserManager>('UserManager');
const config = Injector.request<ConfigLoader>('ConfigLoader');

const authConfig = config.get('auth');

const Log = new Logger('AUTH');

/** Identify if the user is legitimate, and is an IXM user */
async function identifyUser(userID: number, accessToken: string, req: express.Request) {

    let jwtPassphrase = config.getEnv('AUTH_JWT_PASSWORD');
    let userToken: { userID: number, userType: number };

    try {
        if (config.getEnv('NODE_ENV') === 'development' && config.getEnv('AUTH_IGNORE_TOKEN', true) === 'yes') {
            Log.warn('API is ignoring authentication tokens.');
            userToken = JSON.parse(accessToken);
        } else {
            userToken = jwt.verify(accessToken, jwtPassphrase);
        }
    } catch (invalid) {
        throw HTTPError('401');
    }

    if (isNaN(+userToken.userID) || isNaN(+userToken.userType)) {
        Log.error('Generated token was invalid, either SH Auth has created an invalid token, or token generation has been compromised.');
        throw HTTPError('401');
    }

    let requestUser = await userManager.fetchUserFromId(userToken.userID);

    if (!requestUser) {
        Log.fatal('Token generation has been compromised.');
        throw HTTPError('401');
    }

    // Internal users can impersonate anyone.
    if (requestUser.internal && userID) {
        req.impersonator = requestUser;
    } else if (requestUser.internal && !userID) {
        throw HTTPError('401_PROVIDE_IMPERSONATEID');
    } else if (!requestUser.internal && userID && userID !== userToken.userID) {
        throw HTTPError('401_CANNOT_IMPERSONATE');
    }

    let userInfo = await marketUserManager.fetchMarketUserFromId(userID || userToken.userID);

    // User not found or not an IXM buyer
    if (!userInfo) {
        throw HTTPError('401_NOT_IXMUSER');
    } else if (!userInfo.contact.isActive()) {
        throw HTTPError('401_NOT_ACTIVE');
    }

    return userInfo;

}

/**
 * Temporary authentication handler. Simply extracts userId from the configured header and inserts into ixmBuyerInfo
 * if the userId corresponds to an ixmBuyer.
 */
async function AuthHandler (req: express.Request, res: express.Response, next: Function) { try {

    let accessToken = req.get(authConfig['tokenHeader']);
    let userID = Number(req.get(authConfig['userHeader']));

    if (accessToken || userID) {
        Log.trace(`Authentication attempt for ${userID}${accessToken ? ' with access token' : ''}...`, req.id);
        req.ixmUserInfo = await identifyUser(userID, accessToken, req);
    }

    next();

} catch (error) { next(error); } };

module.exports = () => { return AuthHandler; };

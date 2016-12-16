'use strict';

import * as express from 'express';
import * as jwt from 'jsonwebtoken';

import { ConfigLoader } from '../lib/config-loader';
import { Injector } from '../lib/injector';
import { Logger } from '../lib/logger';
import { UserManager } from '../models/user/user-manager';
import { UserModel } from '../models/user/user-model';
import { HTTPError } from '../lib/http-error';

const userManager = Injector.request<UserManager>('UserManager');
const config = Injector.request<ConfigLoader>('ConfigLoader');

const authConfig = config.get('auth');

const Log = new Logger('AUTH');

/** Identify if the user is legitimate, and is an IXM user */
async function identifyUser(userID: number, accessToken: string): Promise<UserModel> {

    let jwtPassphrase = config.getEnv('AUTH_JWT_PASSWORD');
    let userToken: { userID: number, userType: number };

    try {
        if (config.getEnv('NODE_ENV') === 'development' && config.getEnv('AUTH_IGNORE_TOKEN', true) === 'yes') {
            userToken = JSON.parse(accessToken);
        } else {
            userToken = jwt.verify(accessToken, jwtPassphrase);
        }
    } catch (invalid) {
        throw HTTPError('401');
    }

    if (userID !== userToken.userID) {
        throw HTTPError('401_CANNOT_IMPERSONATE');
    }

    let userInfo = await userManager.fetchUserFromId(userID);

    // User not found or not an IXM buyer
    if (!userInfo || !authConfig.allowedUserTypes.includes(userInfo.userType)) {
        throw HTTPError('401_NOT_IXMUSER');
    } else if (!userInfo.isActive()) {
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
        req.ixmUserInfo = await identifyUser(userID, accessToken);
    }

    next();

} catch (error) { next(error); } };

module.exports = () => { return AuthHandler; };

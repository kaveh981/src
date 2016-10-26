'use strict';

import * as express from 'express';

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
async function indentifyUser(token: string): Promise<UserModel> {

        if (!Number(token)) {
            throw HTTPError('401_NOT_IXMUSER');
        }

        // Right now the "token" is just the user id.
        let userInfo = await userManager.fetchUserFromId(Number(token));

        // User not found or not an IXM buyer
        if (!userInfo || !authConfig.allowedUserTypes.includes(userInfo.userType)) {

            throw HTTPError('401_NOT_IXMUSER');

        } else if (userInfo.status !== 'A') {

            throw HTTPError('401_NOT_ACTIVE');
        }

        return userInfo;

}

/**
 * Temporary authentication handler. Simply extracts userId from the configured header and inserts into ixmBuyerInfo
 * if the userId corresponds to an ixmBuyer.
 */
async function AuthHandler (req: express.Request, res: express.Response, next: Function) { try {

        let accessToken = req.get(authConfig['header']);

        if (!accessToken) {
            next();
            return;
        }

        req.ixmUserInfo = await indentifyUser(accessToken);

    } catch (error) { next(error); };

}

module.exports = () => { return AuthHandler; };

'use strict';

import * as express from 'express';

import { ConfigLoader } from '../lib/config-loader';
import { Injector } from '../lib/injector';

const config = Injector.request<ConfigLoader>('ConfigLoader');
const authConfig = config.get('auth');

/**
 * Public access switch, if the configuration is set to private we block any unauthorized access.
 */
function publicAccessHandler(req: express.Request, res: express.Response, next: Function): void {
    if (!authConfig['public'] && (!req.ixmBuyerInfo || !req.ixmBuyerInfo.userID)) {
        res.sendError(401, '401_PRIVATE');
    } else {
        next();
    }
};

module.exports = () => { return publicAccessHandler; };

'use strict';

import * as express from 'express';

import { ConfigLoader } from '../lib/config-loader';
import { Injector } from '../lib/injector';

const config = Injector.request<ConfigLoader>('ConfigLoader');
const authConfig = config.get('auth');

/**
 * Public access switch, if the configuration is set to private we block any unauthorized access.
 */
function PublicAccessHandler(req: express.Request, res: express.Response, next: Function): void {

    if (!authConfig['public'] && (!req.ixmUserInfo || !req.ixmUserInfo.id)) {
        res.sendError('401_PRIVATE');
    } else {
        next();
    }

};

module.exports = () => { return PublicAccessHandler; };

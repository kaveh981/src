'use strict';

import * as express from 'express';
import { ConfigLoader } from '../lib/config-loader';
import { Injector } from '../lib/injector';
import { HTTPError } from '../lib/http-error';

const config = Injector.request<ConfigLoader>('ConfigLoader');
const authConfig = config.get('auth');

/**
 * Control the permissions allowed to use this route.
 */
function Permission(permissions: 'public' | 'read' | 'write' | 'internal' = 'public') {

    return (req: express.Request, res: express.Response, next: Function) => {

        if (permissions === 'internal' && req.impersonator) {
            return next();
        }

        if (!authConfig['public'] && (!req.ixmUserInfo || !req.ixmUserInfo.company)) {
            throw HTTPError('401_PRIVATE');
        }

        if (permissions !== 'public' && (!req.ixmUserInfo || !req.ixmUserInfo.company)) {
            throw HTTPError('401_UNAUTHORIZED');
        }

        if (permissions === 'write' && req.ixmUserInfo.readOnly) {
            throw HTTPError('401_UNAUTHORIZED');
        }

        if (permissions === 'internal' && !req.impersonator) {
            throw HTTPError('404');
        }

        next();

    };

}

export { Permission };

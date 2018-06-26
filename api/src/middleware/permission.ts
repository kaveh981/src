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
function Permission(permissions: 'public' | 'read' | 'write' | 'internal' | 'impersonating' = 'public') {

    return (req: express.Request, res: express.Response, next: Function) => {

        if (permissions === 'public' && !authConfig['public'] && !req.ixmUserInfo && !req.impersonator) {
            throw HTTPError('401_PRIVATE');
        }

        if (permissions === 'read' && !req.ixmUserInfo) {
            throw HTTPError('401_UNAUTHORIZED');
        }

        if (permissions === 'write' && (!req.ixmUserInfo || req.ixmUserInfo.readOnly)) {
            throw HTTPError('401_UNAUTHORIZED');
        }

        if ((permissions === 'internal' || permissions === 'impersonating') && !req.impersonator) {
            throw HTTPError('404');
        }

        if (permissions === 'impersonating' && (!req.impersonator || !req.ixmUserInfo)) {
            throw HTTPError('401_PROVIDE_IMPERSONATEID');
        }

        next();

    };

}

export { Permission };

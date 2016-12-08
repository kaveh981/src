'use strict';

import * as express from 'express';
import { HTTPError } from '../lib/http-error';

/**
 * Sends unauthorized to any user which is not an ixmBuyer for that specific route. To be used only in controllers.
 */
function ProtectedRoute(req: express.Request, res: express.Response, next: Function): void {

    // An ixmBuyer will have these two fields populated by the auth-handler middleware.
    if (!req.ixmUserInfo || !req.ixmUserInfo.id) {
        throw HTTPError('401_UNAUTHORIZED');
    }

    next();
}

export { ProtectedRoute };

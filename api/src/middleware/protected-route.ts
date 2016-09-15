'use strict';

import * as express from 'express';

/**
 * Sends unauthorized to any user which is not an ixmBuyer for that specific route. To be used only in controllers.
 */
function ProtectedRoute(req: express.Request, res: express.Response, next: Function): void {

    // An ixmBuyer will have these two fields populated by the auth-handler middleware.
    if (!res.ixmBuyerInfo || !res.ixmBuyerInfo.userId) {
        res.sendUnauthorizedError();
        return;
    }

    next();
}

export { ProtectedRoute };

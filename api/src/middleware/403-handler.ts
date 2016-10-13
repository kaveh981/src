'use strict';

import * as express from 'express';

import { Logger } from '../lib/logger';

const Log: Logger = new Logger('ROUT');

/**
 * An error handler for 403 - Forbidden Request errors.
 */
function ForbiddenHandler(err: Error, req: express.Request, res: express.Response, next: Function): void {
    if (err.name === 'FORBIDDEN') {
        Log.warn(`${err.toString()} on route ${req.url}.`);
        Log.trace(err.stack);

        res.sendError(403, err.message);
    } else {
        next(err);
    }
};

module.exports = () => { return ForbiddenHandler; };

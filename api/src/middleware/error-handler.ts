'use strict';

import * as express from 'express';

import { Logger } from '../lib/logger';

const Log: Logger = new Logger('ROUT');

/**
 * An error catcher at the end of every route that simply logs the error.
 */
function ErrorHandler(err: Error, req: express.Request, res: express.Response, next: Function): void {
    Log.error(`${err.toString()} on route ${req.url}.`);
    Log.trace(err.stack);

    if (!res.headersSent) {
        res.sendInternalError();
    }
};

module.exports = () => { return ErrorHandler; };

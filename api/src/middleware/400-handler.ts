'use strict';

import * as express from 'express';

import { Logger } from '../lib/logger';

const Log: Logger = new Logger('ROUT');

/**
 * An error handler for 400 - Malformed Request errors.
 */
function BadRequestHandler(err: Error, req: express.Request, res: express.Response, next: Function): void {
    if (err.name === 'BAD_REQUEST') {
        Log.warn(`${err.toString()} on route ${req.url}.`);
        Log.trace(err.stack);

        res.sendValidationError(JSON.parse(err.message));
    } else {
        next(err);
    }
};

module.exports = () => { return BadRequestHandler; };

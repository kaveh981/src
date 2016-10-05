'use strict';

import * as express from 'express';

import { Logger } from '../lib/logger';

const Log: Logger = new Logger('ROUT');

/**
 * An error catcher that catch malformed request.
 */
function BadRequestHandler(err: Error, req: express.Request, res: express.Response, next: Function): void {
    Log.warn(`${err.toString()} on route ${req.url}.`);
    Log.trace(err.stack);

    if (err.name === 'BadRequest') {
        res.sendValidationError(JSON.parse(err.message));
    } else {
        next(err);
    }
};

module.exports = () => { return BadRequestHandler; };

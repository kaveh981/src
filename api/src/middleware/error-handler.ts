'use strict';

import * as express from 'express';

import { Logger } from '../lib/logger';

const Log: Logger = new Logger('ROUT');

/**
 * An error catcher at the end of every route that simply logs the error.
 */
function ErrorHandler(err: Error, req: express.Request, res: express.Response, next: Function): void {
    Log.debug(`${err.name} on route ${req.url}.`);

    if (!res.headersSent) {
        if (!err['crafted'] ) {
            Log.trace(err.stack);
            res.sendError('500');
        } else {
            Log.trace(err['message'] || JSON.stringify(err['details']));
            res.sendError(err['name'], err['details']);
        }
    }
};

module.exports = () => { return ErrorHandler; };

'use strict';

import * as express from 'express';

import { Logger } from '../lib/logger';

const Log: Logger = new Logger('ROUT');

/**
 * An error catcher at the end of every route that simply logs the error.
 */
function ErrorHandler(err: Error, req: express.Request, res: express.Response, next: Function): void {

    Log.debug(`${err.name || 'Unknown error'} on route ${req.url}.`, req.id);

    if (err.message === 'Bad Request' || (err instanceof SyntaxError && 'body' in err)) {
        Log.trace(`Bad request on ${req.url}.`, req.id);
        res.sendError('400');
    } else if (!err['crafted'] ) {
        Log.error(err);
        res.sendError('500');
    } else {
        if (err['message'].trim() || err['details']) {
            Log.trace(err['message'].trim() || JSON.stringify(err['details']), req.id);
        }
        res.sendError(err['name'], err['details']);
    }

};

module.exports = () => { return ErrorHandler; };

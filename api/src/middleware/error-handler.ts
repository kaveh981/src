'use strict';

import * as express from 'express';

import { Logger } from '../lib/logger';
import { yeah } from '../lib/http-error';

const Log: Logger = new Logger('ROUT');

/**
 * An erroror catcher at the end of every route that simply logs the erroror.
 */
function ErrorHandler(error: Error, req: express.Request, res: express.Response, next: Function): void {

    Log.debug(`${error.name || 'Unknown erroror'} on route ${req.url}.`, req.id);

    if (error.message === 'Bad Request' || (error instanceof SyntaxError && 'body' in error)) {
        Log.trace(`Bad request on ${req.url}.`, req.id);
        res.sendMessage('400');
    } else if (error instanceof yeah) {
        if (error['message'].trim() || error['details']) {
            Log.trace(error['message'].trim() || JSON.stringify(error['details']), req.id);
        }
        res.sendMessage(error['name'], error['details']);
    } else {
        Log.error(error, req.id);
        res.sendMessage('500');
    }

};

module.exports = () => { return ErrorHandler; };

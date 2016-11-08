'use strict';

import * as express from 'express';

import { Logger } from '../lib/logger';
import { Helper } from '../lib/helper';

const Log: Logger = new Logger('HTTP');

/**
 * Log all http traffic as trace.
 */
function HttpLogger(req: express.Request, res: express.Response, next: Function): void {

    let id = Helper.generateId(5);
    req.id = id;
    res.id = id;

    // Log at the end to get the correct status code.
    res.on('finish', () => {
        let msg = `${req.ip} - ${req.method} ${req.url} - ${res.statusCode} - ` +
                  `${req.get('User-Agent')} - ${JSON.stringify(req.body, null, 4)}`;

        Log.trace(msg, req.id);
    });

    next();
}

module.exports = () => { return HttpLogger; };

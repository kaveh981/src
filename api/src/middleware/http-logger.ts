'use strict';

import * as express from 'express';

import { Logger } from '../lib/logger';
import { Helper } from '../lib/helper';

const Log: Logger = new Logger('HTTP');

/**
 * Log all http traffic as trace.
 */
function HttpLogger(req: express.Request, res: express.Response, next: Function): void {

    let id = Helper.generateId(8);
    req.id = id;
    res.id = id;

    // Log at the end to get the correct status code.
    res.on('finish', () => {

        Log.info({
            req_ip: req.ip,
            req_id: req.id,
            req_method: req.method,
            req_url: req.originalUrl,
            res_status: res.statusCode,
            res_error_message: res.errorMessage,
            ixm_id: req.tokenUserID && req.tokenUserID.toString(),
            ixm_market_id: req.ixmUserInfo && req.ixmUserInfo.contact.id,
            message: `HTTP Request at ${req.originalUrl} with ${req.method}.`
        });

    });

    next();
}

module.exports = () => { return HttpLogger; };

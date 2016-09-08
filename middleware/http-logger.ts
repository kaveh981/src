import * as express from 'express';

import { Logger } from '../lib/logger';

const Log: Logger = new Logger('HTTP');

function HttpLogger(req: express.Request, res: express.Response, next: Function): void {
    let msg: string = `${req.ip} - ${req.method} ${req.url} - ${res.statusCode} - ${req.get('User-Agent')}`;

    Log.trace(msg);
    next();
}

module.exports = () => { return HttpLogger; };

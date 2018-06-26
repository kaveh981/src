'use strict';

import * as express from 'express';
import { HTTPError } from '../lib/http-error';

/** End point for a request not caught by any route. */
function Handler404(req: express.Request, res: express.Response): void {

    throw HTTPError('404');

};

module.exports = () => { return Handler404; };

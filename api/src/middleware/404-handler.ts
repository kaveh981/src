'use strict';

import * as express from 'express';

/** End point for a request not caught by any route. */
function Handler404(req: express.Request, res: express.Response): void {
    res.sendError('404');
};

module.exports = () => { return Handler404; };

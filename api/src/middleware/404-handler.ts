'use strict';

import * as express from 'express';

/** End point for a request not caught by any route. */
function NotFound(req: express.Request, res: express.Response): void {
    res.sendNotFoundError();
};

module.exports = () => { return NotFound; };

'use strict';

import * as express from 'express';

function NotFound(req: express.Request, res: express.Response): void {
    res.sendNotFoundError();
};

module.exports = () => { return NotFound; };
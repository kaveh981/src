'use strict';

import * as express from 'express';

function NotFound(router: express.Router): void {

    router.route('*').get((req: express.Request, res: express.Response) => {
        res.sendNotFoundError();
    });

};

module.exports = NotFound;

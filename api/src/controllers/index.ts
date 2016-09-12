'use strict';

import * as express from 'express';
import { Index } from '../models/index';

module.exports = function (router: express.Router): void {

    let model: Index = new Index();

    router.route('/').get((req: express.Request, res: express.Response) => {
        res.sendPayload({dog: 'food'});
    });

};

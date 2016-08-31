'use strict';

import * as express from 'express';

let IndexModel = require('../models/index');

module.exports = function (router: express.Router): void {

    let model = new IndexModel();

    router.route('/').get((req: express.Request, res: express.Response) => {
        
        res.send('<h1>Hello, ' + model.name + ' !</h1>');
        
    });

};

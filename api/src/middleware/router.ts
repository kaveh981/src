'use strict';

import * as path from 'path';
import * as express from 'express';
const finder = require('fs-finder');

function Router(args) {

    let routeRouter = express.Router();
    let files = finder.from(args.directory).findFiles('<[0-9a-zA-Z/.-_ ]+\.[tj]s>');

    // Read each file and pass a subrouter to attach to, then use this router in the app.
    files.forEach((file) => {

        let subRouter = express.Router();
        let routePath = '/' + path.dirname(path.relative(args.directory, file)).replace(/\\/g, '/');
        let pathFunction = require(file);

        if (typeof pathFunction !== 'function') {
            throw new Error(`Route at ${routePath} does not return a function.`);
        }

        pathFunction(subRouter);
        routeRouter.use(routePath, subRouter);

    });

    return routeRouter;

}

module.exports = Router;

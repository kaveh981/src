'use strict';

//var express = require('express');
//var kraken = require('kraken-js');
import * as express from 'express';
let kraken: Function = require('kraken-js');

let app: express.Application = module.exports = express();

/*
 * Create and configure application. Also exports application instance for use by tests.
 * See https://github.com/krakenjs/kraken-js#options for additional configuration options.
 */
let options = {
    onconfig: function (config, next) {
        /*
         * Add any additional config setup or overrides here. `config` is an initialized
         * `confit` (https://github.com/krakenjs/confit/) configuration object.
         */
        next(null, config);
    }
};

app.use(kraken(options));
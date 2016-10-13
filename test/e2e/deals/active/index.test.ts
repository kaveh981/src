'use strict';
import * as Promise from 'bluebird';
import * as test from 'tape';
import { Logger }      from '../../../lib/logger';
import { app } from '../../../helper/bootstrap';

const Log = new Logger("TEST");

const before = test;
const after = test;

before("Test Framework bootstrap", (t: test.Test) => {
    app.boot()
        .then(() => {
            Log.debug('Test Framework is up.. Beginning Inception Test Suite');
            t.end();
        })
        .catch((e) => {
            app.shutdown();
            throw e;
        });
});

/**
 * Using require, we run each of the files in the suite.
 */
require("./put.test");

after("Test Framework shutdown..", (t: test.Test) => {
    app.shutdown();
    t.end();
});
import * as Promise from 'bluebird';
import * as test from 'tape';
import { boot, shutdown } from '../helper/loader.helper'

const Logger: any;

test("Test Framework bootstrap", (t: test.Test) => {
    boot()
        .then(() => {
            const Logger = require('../lib/logger').Logger;
            const Log = new Logger("TEST");
            Log.debug('Test Framework is up..');
            t.end();
        })
        .catch((e) => {
            shutdown()
            throw e;
        });
});

test("Inception Test Suite", (t: test.Test) => {
    // t.plan(1);
    // require('./db-populator.test')(t);
    test("Some test inside *.test file", (t: test.Test) => {
        dbPopulator.newUser()
            .then((newUserData) => {
                Log.debug(JSON.stringify(newUserData, undefined, 2));
                t.pass("User inserted to db");
                t.end();
            });
    });
});

test("Test Framework shutdown..", (t: test.Test) => {
    shutdown();
    t.end();
});
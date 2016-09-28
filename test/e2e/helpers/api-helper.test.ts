'use strict';

import * as test from 'tape';

import { Test } from 'tape';
import { app } from '../../helper/bootstrap';
import { Injector } from '../../lib/injector';

import { ApiHelper } from '../../helper/api-helper';
const apiHelper = Injector.request<ApiHelper>('ApiHelper');

const before = test;
const after = test;

before('App boot', (t: Test) => {
    app.boot()
        .then(t.end);
});

test('userID in the request, accessing protected route', (t: Test) => {
    apiHelper.setOptions({
        method: 'GET',
        uri: '/deals/active',
        headers: {
            'content-type': 'application/json'
        }
    });

    apiHelper.setBuyerUserID(100000);

    apiHelper.sendRequest({limit: 20})
        .then((res: any) => {
            t.equal(res.httpStatusCode, 200, 'It should return status code 200 (no buyer being provided yet)');
            t.deepEqual(res.body, { data: {}, message: "You don't seem to have any active deals at the moment. Sorry, eh!", status: 200 });
            return app.shutdown();
        })
        .then(t.end);
});

test('No userID in the request, accessing public route', (t: Test) => {
    apiHelper.setOptions({
        method: 'GET',
        uri: '/deals',
        headers: {
            'content-type': 'application/json'
        }
    });

    apiHelper.setBuyerUserID(undefined);

    apiHelper.sendRequest({limit: 20})
        .then((res: any) => {
            t.equal(res.httpStatusCode, 200, 'It should return status code 200 (no buyer being provided yet)');
            t.deepEqual(
                res.body,
                { data: {}, message: 'No deals are currently available. Come check again soon!', status: 200 },
                'Body content shows unauthorized (for the time being)'
            );
            return app.shutdown();
        })
        .then(t.end);
});

/**
 * Failure disrupts test suite due to thrown error not caught by the test suite
 * The tape framework is not promised-based, making this a bit more complicated
 * Must do more work to check for throws with promises
 */
test.skip('No userID in the request, accessing protected route', (t: Test) => {
    apiHelper.setOptions({
        method: 'GET',
        uri: '/deals/active',
        headers: {
            'content-type': 'application/json'
        }
    });

    apiHelper.setBuyerUserID(undefined);

    apiHelper.sendRequest({limit: 10})
        .then((res: any) => {
            t.equal(res.httpStatusCode, 401, 'It should return status code 401 (no buyer being provided yet)');
            t.deepEqual(
                res.body,
                { status: 401, message: "Unauthorized.", data: {} },
                'Body content shows unauthorized (for the time being)'
            );
            return app.shutdown();
        })
        .then(t.end);
});

test('userID in the request, accessing public route', (t: Test) => {
    apiHelper.setOptions({
        method: 'GET',
        uri: '/deals',
        headers: {
            'content-type': 'application/json'
        }
    });

    apiHelper.setBuyerUserID(100000);

    apiHelper.sendRequest({limit: 20})
        .then((res: any) => {
            t.equal(res.httpStatusCode, 200, 'It should return status code 200 (no buyer being provided yet)');
            t.deepEqual(
                res.body,
                { data: {}, message: 'No deals are currently available. Come check again soon!', status: 200 },
                'Body content shows unauthorized (for the time being)'
            );
            return app.shutdown();
        })
        .then(t.end);
});

after('App shutdown', (t: Test) => {
    app.shutdown();
    t.end();
});

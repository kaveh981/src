'use strict';

import * as test from 'tape';

import { Test } from 'tape';
import { app } from '../../../helper/bootstrap';
import { Injector } from '../../../lib/injector';

import { ApiHelper } from '../../../helper/api-helper';
const apiHelper = Injector.request<ApiHelper>('ApiHelper');

const before = test;
const after = test;

before('App boot', (t: Test) => {
    app.boot()
        .then(t.end);
});

test('Test index route', (t: Test) => {
    apiHelper.setOptions({
        method: 'GET',
        uri: '/deals/active',
        headers: {
            'content-type': 'application/json'
        }
    });

    apiHelper.setBuyerUserID(100000);

    apiHelper.sendRequest()
        .then((res: any) => {
            t.equal(res.httpStatusCode, 401, 'It should return status code 401 (no buyer being provided yet)');
            t.equal(res.body, '{"status":401,"message":"Unauthorized.","data":{}}', 'Body content shows unauthorized (for the time being)');
            return app.shutdown();
        })
        .then(t.end);
});

after('App shutdown', (t: Test) => {
    app.shutdown();
    t.end();
});

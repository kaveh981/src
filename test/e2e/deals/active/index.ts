'use strict';

import { app } from '../../../helper/bootstrap';

import * as test from 'tape';

import { Test } from 'tape';
import { Injector } from '../../../lib/injector';
import { ApiHelper } from '../../../helper/api-helper';

const before = test;
const after = test;

let api: ApiHelper;

before('App boot', (t: Test) => {
    app.boot()
        .then(() => {
            api = Injector.request<ApiHelper>('ApiHelper');
            return t.end();
        });
});

test('Test index route', (t: Test) => {
    api.setOptions({
        method: 'GET',
        uri: 'https://localhost:4430/deals/active',
        headers: {
            'content-type': 'application/json'
        }
    });

    api.setBuyerUserID(100000);

    api.sendRequest(undefined)
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

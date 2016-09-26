'use strict';

import * as test from 'tape';

import { Test } from 'tape';
import { ApiHelper } from '../../../helper/api-helper';

let api: ApiHelper = new ApiHelper();

api.setOptions({
    method: 'GET',
    uri: 'https://localhost:4430/deals/active',
    headers: {
        'content-type': 'application/json'
    }
});

api.setAgentOptions({
    host: 'localhost',
    port: '4430',
    path: '/',
    rejectUnauthorized: false
});

test('Test index route', (t: Test) => {
    t.plan(2);
    api.sendRequest(undefined)
        .then((res: any) => {
            t.equal(res.httpStatusCode, 401, 'It should return status code 401 (no buyer being provided yet)');
            //t.equal(res.httpStatusCode, 200, 'It should return status code 200');
            t.equal(res.body, '{"status":401,"message":"Unauthorized.","data":{}}', 'Body content shows unauthorized (for the time being)');
            //t.equal(res.body, '{"status":200,"message":"No deals are currently available. Come check again soon!","data":{}}', 'Body content shows no deals available');
        });
});
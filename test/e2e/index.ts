'use strict';

import * as test from 'tape';
import * as express from 'express';

import { Test } from "tape";
import { ApiHelper } from '../helper/api-helper';

let api: ApiHelper = new ApiHelper();

api.setOptions({
    method: 'GET',
    uri: 'http://localhost:8000/',
    headers: {
        'content-type': 'application/json'
    }

});

test("test index route", (t: Test) => {
    t.plan(2);
    api.sendRequest(undefined)
        .then((res: any) => {
            t.equal(res.httpStatusCode, 200, "It should return status code 200");
            t.equal(res.body, "<h1>Hello, index !</h1>", "Body content is Hello, index");
        });
});

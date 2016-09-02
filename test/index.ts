import * as test from 'tape';
import {apiHelper} from './helper/apiHelper';
let api:apiHelper = new apiHelper();

api.setOptions({
    method: 'GET',
    uri: 'http://localhost:8000/',
    headers: {
        'content-type': 'application/json'
    }

});


test("test index route", (t)=> {
    t.plan(2);
    api.sendRequest(undefined)
        .then(function (res) {
            t.equal(res.httpStatusCode, 200,"It should return status code 200");
            t.equal(res.body, "<h1>Hello, index !</h1>","Body content is Hello, index");
        });
});



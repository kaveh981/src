'use strict';

import * as test from 'tape';

import { Injector } from '../../src/lib/injector';
import { APIRequestManager } from '../../src/lib/request-manager';
import { DatabasePopulator } from '../../src/lib/database-populator';
import { Helper } from '../../src/lib/helper';
import { DatabaseManager } from '../../src/lib/database-manager';

const databasePopulator = Injector.request<DatabasePopulator>('DatabasePopulator');
const apiRequest = Injector.request<APIRequestManager>('APIRequestManager');
const databaseManager = Injector.request<DatabaseManager>('DatabaseManager');


 /*
 * @case    - The buyer is an IXM Buyer.
 * @expect  - The response has status code which isn't 500 or 401.
 * @label   - ATW_AUTH_V1
 * @route   - GET deals
 * @status  - working
 * @tags    - get, auth, buyer
 */
async function ATW_AUTH_V1 (route: string, verb: string, assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);

    /** Test */
    let response = await apiRequest[verb](route, {}, buyer.user.userID);

    assert.not(response.status, 401);
    assert.not(response.status, 500);

}

 /*
 * @case    - The user is not an IXM Buyer.
 * @expect  - The response has status code 401.
 * @label   - ATW_AUTH_V2
 * @route   - GET deals
 * @status  - working
 * @tags    - get, auth, buyer
 */
async function ATW_AUTH_V2 (route: string, verb: string, assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let publisher = await databasePopulator.createPublisher();

    /** Test */
    let response = await apiRequest[verb](route, {}, publisher.user.userID);

    assert.equal(response.status, 401);

}

 /*
 * @case    - The buyer id is not an integer.
 * @expect  - The response has status code 401.
 * @label   - ATW_AUTH_V3
 * @route   - GET deals
 * @status  - working
 * @tags    - get, auth, buyer
 */
async function ATW_AUTH_V3 (route: string, verb: string, assert: test.Test) {

    /** Setup */
    assert.plan(1);

    /** Test */
    let response = await apiRequest[verb](route, {}, 'goose bear');

    assert.equal(response.status, 401);

}

 /*
 * @case    - The buyer id is not supplied.
 * @expect  - The response has status code 401.
 * @label   - ATW_AUTH_V4
 * @route   - GET deals
 * @status  - working
 * @tags    - get, auth, buyer
 */
async function ATW_AUTH_V4 (route: string, verb: string, assert: test.Test) {

    /** Setup */
    assert.plan(1);

    /** Test */
    let response = await apiRequest[verb](route, {});

    assert.equal(response.status, 401);

}


/**
 * Reusable tests for buyer authentication
 */
function authenticationTest(route: string, verb: string) {
    return [
        (assert: test.Test) => { return ATW_AUTH_V1(route, verb, assert); },
        (assert: test.Test) => { return ATW_AUTH_V2(route, verb, assert); },
        (assert: test.Test) => { return ATW_AUTH_V3(route, verb, assert); },
        (assert: test.Test) => { return ATW_AUTH_V4(route, verb, assert); }
    ];
}

export { authenticationTest }

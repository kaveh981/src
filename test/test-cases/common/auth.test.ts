'use strict';

import * as test from 'tape';

import { Injector } from '../../src/lib/injector';
import { APIRequestManager } from '../../src/lib/request-manager';
import { DatabasePopulator } from '../../src/lib/database-populator';

const databasePopulator = Injector.request<DatabasePopulator>('DatabasePopulator');
const apiRequest = Injector.request<APIRequestManager>('APIRequestManager');

 /*
 * @case    - The user is an IXM User (IXM Buyer or IXM Publisher).
 * @expect  - The response has status code which isn't 500 or 401.
 * @status  - working
 * @tags    - get, auth, buyer
 */
async function ATW_AUTH_01 (route: string, verb: string, setup: Function, assert: test.Test) {

    /** Setup */
    assert.plan(4);

    await setup();

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();

    /** Test */
    let buyerResponse = await apiRequest[verb](route, {}, buyer.user.userID);

    assert.not(buyerResponse.status, 401);
    assert.not(buyerResponse.status, 500);

    let pubResponse = await apiRequest[verb](route, {}, publisher.user.userID);

    assert.not(pubResponse.status, 401);
    assert.not(pubResponse.status, 500);
}

 /*
 * @case    - The user is not an IXM User.
 * @expect  - The response has status code 401.
 * @status  - working
 * @tags    - get,auth,buyer
 */
async function ATW_AUTH_02 (route: string, verb: string, setup: Function, assert: test.Test) {

    /** Setup */
    assert.plan(1);

    await setup();

    let user = await databasePopulator.createUser({ userType: 1 });

    /** Test */
    let response = await apiRequest[verb](route, {}, user.userID);

    assert.equal(response.status, 401);

}

 /*
 * @case    - The user id is not a valid integer (String, Float, Negative, Boolean, Array, Object, Function).
 * @expect  - The response has status code 401.
 * @status  - working
 * @tags    - get, auth, buyer
 */
async function ATW_AUTH_03 (route: string, verb: string, setup: Function, assert: test.Test) {

    /** Setup */
    assert.plan(8);

    await setup();

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let anotherBuyer = await databasePopulator.createBuyer(dsp.dspID);

    /** Test */
    let response = await apiRequest[verb](route, {}, 'goose bear');

    response = await apiRequest[verb](route, {}, 3.1415926 );
    assert.equal(response.status, 401);

    response = await apiRequest[verb](route, {}, -1 );
    assert.equal(response.status, 401);

    response = await apiRequest[verb](route, {}, true );
    assert.equal(response.status, 401);

    response = await apiRequest[verb](route, {}, [3, 1, 4] );
    assert.equal(response.status, 401);

    response = await apiRequest[verb](route, {}, { goose: 314 } );
    assert.equal(response.status, 401);

    response = await apiRequest[verb](route, {}, "() => {}" );
    assert.equal(response.status, 401);

    response = await apiRequest[verb](route, {}, buyer.user.userID.toString() + "," + anotherBuyer.user.userID.toString());
    assert.equal(response.status, 401);

    assert.equal(response.status, 401);
}

 /*
 * @case    - The user id is not supplied.
 * @expect  - The response has status code 401.
 * @status  - working
 * @tags    - get, auth, buyer
 */
async function ATW_AUTH_04 (route: string, verb: string, setup: Function, assert: test.Test) {

    /** Setup */
    assert.plan(1);

    await setup();

    /** Test */
    let response = await apiRequest[verb](route, {});

    assert.equal(response.status, 401);
}

/**
 * Reusable tests for buyer authentication
 */
function authenticationTest(route: string, verb: string, setup: Function) {
    return [
        (assert: test.Test) => { return ATW_AUTH_01(route, verb, setup, assert); },
        (assert: test.Test) => { return ATW_AUTH_02(route, verb, setup, assert); },
        (assert: test.Test) => { return ATW_AUTH_03(route, verb, setup, assert); },
        (assert: test.Test) => { return ATW_AUTH_04(route, verb, setup, assert); }
    ];
}

export { authenticationTest }

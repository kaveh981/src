'use strict';

import * as test from 'tape';

import { Injector } from '../../src/lib/injector';
import { APIRequestManager } from '../../src/lib/request-manager';
import { DatabasePopulator } from '../../src/lib/database-populator';

const databasePopulator = Injector.request<DatabasePopulator>('DatabasePopulator');
const apiRequest = Injector.request<APIRequestManager>('APIRequestManager');

/**
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
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');

    /** Test */
    let buyerAuthResponse = await apiRequest.getAuthToken(buyer.user.emailAddress, buyer.user.password);
    let buyerAccessToken = buyerAuthResponse.body.data.accessToken;

    let buyerResponse = await apiRequest[verb](route, {}, {
        userID: buyer.user.userID,
        userType: buyer.user.userType,
        accessToken: buyerAccessToken
    });

    assert.not(buyerResponse.status, 401);
    assert.not(buyerResponse.status, 500);

    let pubAuthResponse = await apiRequest.getAuthToken(publisher.user.emailAddress, publisher.user.password);
    let pubAccessToken = pubAuthResponse.body.data.accessToken;

    let pubResponse = await apiRequest[verb](route, {}, {
        userID: publisher.user.userID,
        userType: publisher.user.userType,
        accessToken: pubAccessToken
    });

    assert.not(pubResponse.status, 401);
    assert.not(pubResponse.status, 500);

}

/**
 * @case    - The user is not an IXM User.
 * @expect  - The response has status code 401.
 * @status  - working
 * @tags    - get,auth,buyer
 */
async function ATW_AUTH_02 (route: string, verb: string, setup: Function, assert: test.Test) {

    /** Setup */
    assert.plan(1);

    await setup();

    /** Test */
    let user = await databasePopulator.createUser({ userType: 1 });
    let authResponse = await apiRequest.getAuthToken(user.emailAddress, user.password);
    let accessToken = authResponse.body.data.accessToken;

    let pubResponse = await apiRequest[verb](route, {}, {
        userID: user.userID,
        userType: user.userType,
        accessToken: accessToken
    });

    assert.equal(pubResponse.status, 401);

}

/**
 * @case    - The user provides a wrong user id.
 * @expect  - The response has status code 401.
 * @status  - working
 * @tags    - get,auth,buyer
 */
async function ATW_AUTH_03 (route: string, verb: string, setup: Function, assert: test.Test) {

    /** Setup */
    assert.plan(1);

    await setup();

    /** Test */
    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let user = buyer.user;
    let authResponse = await apiRequest.getAuthToken(user.emailAddress, user.password);
    let accessToken = authResponse.body.data.accessToken;

    let pubResponse = await apiRequest[verb](route, {}, {
        userID: user.userID + 185,
        userType: user.userType,
        accessToken: accessToken
    });

    assert.equal(pubResponse.status, 401);

}

/**
 * @case    - The user does not provide an access token.
 * @expect  - The response has status code 401.
 * @status  - working
 * @tags    - get,auth
 */
async function ATW_AUTH_04 (route: string, verb: string, setup: Function, assert: test.Test) {

    /** Setup */
    assert.plan(1);

    await setup();

    /** Test */
    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let user = buyer.user;
    await apiRequest.getAuthToken(user.emailAddress, user.password);

    let pubResponse = await apiRequest[verb](route, {}, {
        userID: user.userID,
        userType: user.userType,
        accessToken: ' '
    });

    assert.equal(pubResponse.status, 401);

}

/**
 * @case    - The user provides no user id.
 * @expect  - The response has status code 401.
 * @status  - working
 * @tags    - get,auth,buyer
 */
async function ATW_AUTH_05 (route: string, verb: string, setup: Function, assert: test.Test) {

    /** Setup */
    assert.plan(1);

    await setup();

    /** Test */
    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let user = buyer.user;
    let authResponse = await apiRequest.getAuthToken(user.emailAddress, user.password);
    let accessToken = authResponse.body.data.accessToken;

    let pubResponse = await apiRequest[verb](route, {}, {
        userType: user.userType,
        accessToken: accessToken
    });

    assert.equal(pubResponse.status, 401);

}

/**
 * @case    - The user id and user types are not valid integers.
 * @expect  - The response has status code 401.
 * @status  - working
 * @tags    - get, auth, buyer
 */
async function ATW_AUTH_06 (route: string, verb: string, setup: Function, assert: test.Test) {

    /** Setup */
    assert.plan(6);

    await setup();

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');

    /** Test */
    let response = await apiRequest[verb](route, {}, {
        userID: 'goose bear',
        userType: 'goose bear'
    });
    assert.equal(response.status, 401);

    response = await apiRequest[verb](route, {}, {
        userID: 3.1415926,
        userType: 3.14159265
    });
    assert.equal(response.status, 401);

    response = await apiRequest[verb](route, {}, {
        userID: -1,
        userType: -1
    });
    assert.equal(response.status, 401);

    response = await apiRequest[verb](route, {}, {
        userID: true,
        userType: true
    });
    assert.equal(response.status, 401);

    response = await apiRequest[verb](route, {}, {
        userID: [ 3, 1, 4 ],
        userType: [ 3, 1, 4 ]
    });
    assert.equal(response.status, 401);

    response = await apiRequest[verb](route, {}, {
        userID: { goose: 314 },
        userType: { goose: 314 }
    });
    assert.equal(response.status, 401);

}

/**
 * @case    - Nothing is supplied.
 * @expect  - The response has status code 401.
 * @status  - working
 * @tags    - get, auth, buyer
 */
async function ATW_AUTH_07 (route: string, verb: string, setup: Function, assert: test.Test) {

    /** Setup */
    assert.plan(1);

    await setup();

    /** Test */
    let response = await apiRequest[verb](route, {});

    assert.equal(response.status, 401);

}

/**
 * @case    - The user is a whitelisted company 
 * @expect  - The response has status code which isn't 500 or 401.
 * @status  - working
 * @tags    - auth, company
 */
async function ATW_AUTH_08 (route: string, verb: string, setup: Function, assert: test.Test) {

    /** Setup */
    assert.plan(4);

    await setup();

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let pubCompany = await databasePopulator.createCompany();

    /** Test */
    let authResponse = await apiRequest.getAuthToken(buyerCompany.user.emailAddress, buyerCompany.user.password);
    let accessToken = authResponse.body.data.accessToken;

    let response = await apiRequest[verb](route, {}, {
        userID: buyerCompany.user.userID,
        accessToken: accessToken
    });

    assert.not(response.status, 401);
    assert.not(response.status, 500);

    authResponse = await apiRequest.getAuthToken(pubCompany.user.emailAddress, pubCompany.user.password);
    accessToken = authResponse.body.data.accessToken;

    response = await apiRequest[verb](route, {}, {
        userID: pubCompany.user.userID,
        accessToken: accessToken
    });

    assert.not(response.status, 401);
    assert.not(response.status, 500);

}

/**
 * @case    - Internal user doesn't provide userID  
 * @expect  - The response has status code 401.
 * @status  - working
 * @tags    - auth, company
 */
async function ATW_AUTH_09 (route: string, verb: string, setup: Function, assert: test.Test) {

    /** Setup */
    assert.plan(2);

    await setup();

    let internalUser = await databasePopulator.createInternalUser();

    /** Test */
    let authResponse = await apiRequest.getAuthToken(internalUser.emailAddress, internalUser.password);

    let accessToken = authResponse.body.data.accessToken;

    let response = await apiRequest[verb](route, {}, {
        accessToken: accessToken
    });

    assert.equal(response.status, 401);
}

/**
 * @case    - Internal user tries to impersonate other ixm users
 * @expect  - The response has status code which isn't 500 or 401.
 * @status  - working
 * @tags    - auth, internal user
 */
async function ATW_AUTH_11 (route: string, verb: string, setup: Function, assert: test.Test) {

    /** Setup */
    assert.plan(8);

    await setup();

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');

    let internalUser = await databasePopulator.createInternalUser();

    let authResponse = await apiRequest.getAuthToken(internalUser.emailAddress, internalUser.password);
    let accessToken = authResponse.body.data.accessToken;

    /** Test */

    // impersonate buyer company
    let response = await apiRequest[verb](route, {}, {
        userID: buyerCompany.user.userID,
        accessToken: accessToken
    });

    assert.not(response.status, 401);
    assert.not(response.status, 500);

    // impersonate buyer 
    response = await apiRequest[verb](route, {}, {
        userID: buyer.user.userID,
        accessToken: accessToken
    });

    assert.not(response.status, 401);
    assert.not(response.status, 500);

    // impersonate pub company 
    response = await apiRequest[verb](route, {}, {
        userID: pubCompany.user.userID,
        accessToken: accessToken
    });

    assert.not(response.status, 401);
    assert.not(response.status, 500);

    // impersonate pub 
    response = await apiRequest[verb](route, {}, {
        userID: publisher.user.userID,
        accessToken: accessToken
    });

    assert.not(response.status, 401);
    assert.not(response.status, 500);

}

/**
 * @case    - Internal user tries to impersonate a non ixm user
 * @expect  - The response has status code 401.
 * @status  - working
 * @tags    - auth, internal user
 */
async function ATW_AUTH_12 (route: string, verb: string, setup: Function, assert: test.Test) {

    /** Setup */
    assert.plan(1);

    await setup();

    let internalUser = await databasePopulator.createInternalUser();
    let anotherInternalUser = await databasePopulator.createInternalUser();

    let authResponse = await apiRequest.getAuthToken(internalUser.emailAddress, internalUser.password);
    let accessToken = authResponse.body.data.accessToken;

    /** Test */

    // impersonate buyer company
    let response = await apiRequest[verb](route, {}, {
        userID: anotherInternalUser.userID,
        accessToken: accessToken
    });

    assert.equal(response.status, 401);

}

/**
 * @case    - Internal user tries to impersonate non-existing user
 * @expect  - The response has status code 401.
 * @status  - working
 * @tags    - auth, internal user
 */
async function ATW_AUTH_13 (route: string, verb: string, setup: Function, assert: test.Test) {

    /** Setup */
    assert.plan(1);

    await setup();

    let internalUser = await databasePopulator.createInternalUser();

    let authResponse = await apiRequest.getAuthToken(internalUser.emailAddress, internalUser.password);
    let accessToken = authResponse.body.data.accessToken;

    /** Test */

    // impersonate buyer company
    let response = await apiRequest[verb](route, {}, {
        userID: 999,
        accessToken: accessToken
    });

    assert.equal(response.status, 401);

}

/**
 * @case    - Internal user tries to impersonate a inactive ixm user
 * @expect  - The response has status code 401.
 * @status  - working
 * @tags    - auth, internal user
 */
async function ATW_AUTH_14 (route: string, verb: string, setup: Function, assert: test.Test) {

    /** Setup */
    assert.plan(1);

    await setup();

    let internalUser = await databasePopulator.createInternalUser();
    let pubCompany = await databasePopulator.createCompany({ status: 'N' });

    let authResponse = await apiRequest.getAuthToken(internalUser.emailAddress, internalUser.password);
    let accessToken = authResponse.body.data.accessToken;

    /** Test */

    // impersonate buyer company
    let response = await apiRequest[verb](route, {}, {
        userID: pubCompany.user.userID,
        accessToken: accessToken
    });

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
        (assert: test.Test) => { return ATW_AUTH_04(route, verb, setup, assert); },
        (assert: test.Test) => { return ATW_AUTH_05(route, verb, setup, assert); },
        (assert: test.Test) => { return ATW_AUTH_06(route, verb, setup, assert); },
        (assert: test.Test) => { return ATW_AUTH_07(route, verb, setup, assert); },
        (assert: test.Test) => { return ATW_AUTH_08(route, verb, setup, assert); },
        (assert: test.Test) => { return ATW_AUTH_09(route, verb, setup, assert); },
        // (assert: test.Test) => { return ATW_AUTH_10(route, verb, setup, assert); },
        (assert: test.Test) => { return ATW_AUTH_11(route, verb, setup, assert); },
        (assert: test.Test) => { return ATW_AUTH_12(route, verb, setup, assert); },
        (assert: test.Test) => { return ATW_AUTH_13(route, verb, setup, assert); },
        (assert: test.Test) => { return ATW_AUTH_14(route, verb, setup, assert); }
    ];
}

export { authenticationTest }

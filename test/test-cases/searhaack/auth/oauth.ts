// SH Auth tests
'use strict';

import * as test from 'tape';

import { Injector } from '../../../src/lib/injector';
import { APIRequestManager } from '../../../src/lib/request-manager';
import { DatabasePopulator } from '../../../src/lib/database-populator';

const databasePopulator = Injector.request<DatabasePopulator>('DatabasePopulator');
const apiRequest = Injector.request<APIRequestManager>('APIRequestManager');

/**
 * @case    - The user has an api key and provides it.
 * @expect  - An access token is returned.
 * @status  - passing (GUI161212_ATW_678)
 * @tags    - post, oauth, searhaack, auth
 */
export async function SH_OAUTH_01 (assert: test.Test) {

    assert.plan(4);

    let pubCompany = await await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    await databasePopulator.createAPIKey(publisher.user.userID, 'gooselegs');
    let response = await apiRequest.getAuthToken(publisher.user.emailAddress, undefined, 'gooselegs');
    let shResponse = await apiRequest.sendRequest('https://api01.indexexchange.com',
            'api/publishers/deals', 'GET', { userID: publisher.user.userID },
            { 'Authorization': `Bearer ${response.body.data.accessToken}` });

    assert.notEqual(shResponse.status, 401, 'Access token should work.');
    assert.equal(response.status, 200, 'Access token request should pass.');
    assert.equal(response.body.responseCode, 200, 'Response code should match the HTTP status.');
    assert.ok(response.body.data.accessToken, 'Access token should be returned.');

}

/**
 * @case    - The user has an api key, but provides password.
 * @expect  - An access token is returned.
 * @status  - passing (GUI161212_ATW_678)
 * @tags    - post, oauth, searhaack, auth
 */
export async function SH_OAUTH_02 (assert: test.Test) {

    assert.plan(4);

    let pubCompany = await await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    await databasePopulator.createAPIKey(publisher.user.userID, 'gooselegs');
    let response = await apiRequest.getAuthToken(publisher.user.emailAddress, publisher.user.password);
    let shResponse = await apiRequest.sendRequest('https://api01.indexexchange.com',
            'api/publishers/deals', 'GET', { userID: publisher.user.userID },
            { 'Authorization': `Bearer ${response.body.data.accessToken}` });

    assert.notEqual(shResponse.status, 401, 'Access token should work.');
    assert.equal(response.status, 200, 'Access token request should pass.');
    assert.equal(response.body.responseCode, 200, 'Response code should match the HTTP status.');
    assert.ok(response.body.data.accessToken, 'Access token should be returned.');

}

/**
 * @case    - The user does not have an api key, but provides a password.
 * @expect  - An access token is provided.
 * @status  - passing (GUI161212_ATW_678)
 * @tags    - post, oauth, searhaack, auth
 */
export async function SH_OAUTH_03 (assert: test.Test) {

    assert.plan(4);

    let pubCompany = await await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let response = await apiRequest.getAuthToken(publisher.user.emailAddress, publisher.user.password);
    let shResponse = await apiRequest.sendRequest('https://api01.indexexchange.com',
            'api/publishers/deals', 'GET', { userID: publisher.user.userID },
            { 'Authorization': `Bearer ${response.body.data.accessToken}` });

    assert.notEqual(shResponse.status, 401, 'Access token should work.');
    assert.equal(response.status, 200, 'Access token request should pass.');
    assert.equal(response.body.responseCode, 200, 'Response code should match the HTTP status.');
    assert.ok(response.body.data.accessToken, 'Access token should be returned.');

}

/**
 * @case    - The user has an api key, but provides password and key.
 * @expect  - An access token is not provided.
 * @status  - passing (GUI161212_ATW_678)
 * @tags    - post, oauth, searhaack, auth
 */
export async function SH_OAUTH_04 (assert: test.Test) {

    assert.plan(3);

    let pubCompany = await await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    await databasePopulator.createAPIKey(publisher.user.userID, 'gooselegs');
    let response = await apiRequest.getAuthToken(publisher.user.emailAddress, publisher.user.password, 'gooselegs');

    assert.equal(response.status, 400, 'Access token request should be denied.');
    assert.equal(response.body.responseCode, 400, 'Response code should match the HTTP status.');
    assert.ok(!response.body.data, 'Access token should not be returned.');

}

/**
 * @case    - The user has an api key, but provides neither password nor key.
 * @expect  - An access token is not provided.
 * @status  - passing (GUI161212_ATW_678)
 * @tags    - post, oauth, searhaack, auth
 */
export async function SH_OAUTH_05 (assert: test.Test) {

    assert.plan(3);

    let pubCompany = await await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    await databasePopulator.createAPIKey(publisher.user.userID, 'gooselegs');
    let response = await apiRequest.getAuthToken(publisher.user.emailAddress, undefined);

    assert.equal(response.status, 400, 'Access token request should be denied.');
    assert.equal(response.body.responseCode, 400, 'Response code should match the HTTP status.');
    assert.ok(!response.body.data, 'Access token should not be returned.');

}

/**
 * @case    - The user has an api key, but provides wrong password.
 * @expect  - An access token is not provided.
 * @status  - passing (GUI161212_ATW_678)
 * @tags    - post, oauth, searhaack, auth
 */
export async function SH_OAUTH_06 (assert: test.Test) {

    assert.plan(3);

    let pubCompany = await await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    await databasePopulator.createAPIKey(publisher.user.userID, 'gooselegs');
    let response = await apiRequest.getAuthToken(publisher.user.emailAddress, 'beepboopiamagoose');

    assert.equal(response.status, 400, 'Access token request should be denied.');
    assert.equal(response.body.responseCode, 400, 'Response code should match the HTTP status.');
    assert.ok(!response.body.data, 'Access token should not be returned.');

}

/**
 * @case    - The user has an api key, but provides password and wrong key.
 * @expect  - An access token is not provided.
 * @status  - passing (GUI161212_ATW_678)
 * @tags    - post, oauth, searhaack, auth
 */
export async function SH_OAUTH_07 (assert: test.Test) {

    assert.plan(3);

    let pubCompany = await await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    await databasePopulator.createAPIKey(publisher.user.userID, 'gooselegs');
    let response = await apiRequest.getAuthToken(publisher.user.emailAddress, publisher.user.password, 'this is wrong');

    assert.equal(response.status, 400, 'Access token request should be denied.');
    assert.equal(response.body.responseCode, 400, 'Response code should match the HTTP status.');
    assert.ok(!response.body.data, 'Access token should not be returned.');

}

/**
 * @case    - The user has an api key, but provides no username and correct password.
 * @expect  - An access token is not provided.
 * @status  - passing (GUI161212_ATW_678)
 * @tags    - post, oauth, searhaack, auth
 */
export async function SH_OAUTH_08 (assert: test.Test) {

    assert.plan(3);

    let pubCompany = await await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    await databasePopulator.createAPIKey(publisher.user.userID, 'gooselegs');
    let response = await apiRequest.getAuthToken(undefined, publisher.user.password);

    assert.equal(response.status, 400, 'Access token request should be denied.');
    assert.equal(response.body.responseCode, 400, 'Response code should match the HTTP status.');
    assert.ok(!response.body.data, 'Access token should not be returned.');

}

/**
 * @case    - The user has an api key but provides only the key.
 * @expect  - An access token is not provided.
 * @status  - passing (GUI161212_ATW_678)
 * @tags    - post, oauth, searhaack, auth
 */
export async function SH_OAUTH_09 (assert: test.Test) {

    assert.plan(3);

    let pubCompany = await await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    await databasePopulator.createAPIKey(publisher.user.userID, 'gooselegs');
    let response = await apiRequest.getAuthToken(undefined, undefined, 'gooselegs');

    assert.equal(response.status, 400, 'Access token request should be denied.');
    assert.equal(response.body.responseCode, 400, 'Response code should match the HTTP status.');
    assert.ok(!response.body.data, 'Access token should not be returned.');

}

/**
 * @case    - The user has an api key, but provides no password and wrong key.
 * @expect  - An access token is not provided.
 * @status  - passing (GUI161212_ATW_678)
 * @tags    - post, oauth, searhaack, auth
 */
export async function SH_OAUTH_10 (assert: test.Test) {

    assert.plan(3);

    let pubCompany = await await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    await databasePopulator.createAPIKey(publisher.user.userID, 'gooselegs');
    let response = await apiRequest.getAuthToken(publisher.user.emailAddress, undefined, 'beesekegs');

    assert.equal(response.status, 400, 'Access token request should be denied.');
    assert.equal(response.body.responseCode, 400, 'Response code should match the HTTP status.');
    assert.ok(!response.body.data, 'Access token should not be returned.');

}

/**
 * @case    - The user has an api key, has an inactive account and supplies correct password.
 * @expect  - An access token is not provided.
 * @status  - passing (GUI161212_ATW_678)
 * @tags    - post, oauth, searhaack, auth
 */
export async function SH_OAUTH_11 (assert: test.Test) {

    assert.plan(3);

    let pubCompany = await await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write', { status: 'N' });
    await databasePopulator.createAPIKey(publisher.user.userID, 'gooselegs');
    let response = await apiRequest.getAuthToken(publisher.user.emailAddress, publisher.user.password);

    assert.equal(response.status, 400, 'Access token request should be denied.');
    assert.equal(response.body.responseCode, 400, 'Response code should match the HTTP status.');
    assert.ok(!response.body.data, 'Access token should not be returned.');

}

/**
 * @case    - The user has an api key, has an inactive account and supplies correct key.
 * @expect  - An access token is not provided.
 * @status  - passing (GUI161212_ATW_678)
 * @tags    - post, oauth, searhaack, auth
 */
export async function SH_OAUTH_12 (assert: test.Test) {

    assert.plan(3);

    let pubCompany = await await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write', { status: 'N' });
    await databasePopulator.createAPIKey(publisher.user.userID, 'gooselegs');
    let response = await apiRequest.getAuthToken(publisher.user.emailAddress, undefined, 'gooselegs');

    assert.equal(response.status, 400, 'Access token request should be denied.');
    assert.equal(response.body.responseCode, 400, 'Response code should match the HTTP status.');
    assert.ok(!response.body.data, 'Access token should not be returned.');

}

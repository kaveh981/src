/* tslint:disable:no-unused-variable */
'use strict';

import * as test from 'tape';

import { Injector } from '../../../src/lib/injector';
import { APIRequestManager } from '../../../src/lib/request-manager';
import { DatabasePopulator } from '../../../src/lib/database-populator';
import { DatabaseManager } from '../../../src/lib/database-manager';

const databasePopulator = Injector.request<DatabasePopulator>('DatabasePopulator');
const apiRequest = Injector.request<APIRequestManager>('APIRequestManager');
const databaseManager = Injector.request<DatabaseManager>('DatabaseManager');

const ROUTE = '/users';

async function companyInWhitelist(company: INewUserData) {

    let row = await databaseManager.select().from('ixmCompanyWhitelist').where('userID', company.userID);

    return !!row[0];
}

async function userIsUpdated(userID: number, permissions: string) {

    let row = await databaseManager.select().from('ixmUserCompanyMappings').where('userID', userID);

    return row[0].permissions === permissions;

}

/** 
 * @case   - Add a company to the whitelist.
 * @setup  - A company and an internal user.
 * @expect - 200 and the user to be updated.
 * @route  - PUT /users
 */
export async function ATW_API_PUT_USE_FUNC_01(assert: test.Test) {

    assert.plan(2);

    let user = await databasePopulator.createUser({ userType: 18 });
    let internalUser = await databasePopulator.createInternalUser();

    let updateUserInfo = {
        email: user.emailAddress,
        whitelist: true
    };

    let response = await apiRequest.put(ROUTE, updateUserInfo, internalUser);

    assert.equal(response.status, 200);
    assert.true(await companyInWhitelist(user));

}

/**
 * @case   - Attempt to add an Index Market user to the whitelist.
 * @setup  - An index market user and an internal user.
 * @expect - 403 and the user not appear in the whitelist.
 * @route  - PUT /users
 */
export async function ATW_API_PUT_USE_FUNC_02(assert: test.Test) {

    assert.plan(2);

    let user = await databasePopulator.createUser({ userType: 22 });
    let internalUser = await databasePopulator.createInternalUser();

    let updateUserInfo = {
        email: user.emailAddress,
        whitelist: true
    };

    let response = await apiRequest.put(ROUTE, updateUserInfo, internalUser);

    assert.equal(response.status, 403);
    assert.false(await companyInWhitelist(user));

}

/**
 * @case   - Attempt to add an inactive company to the whitelist.
 * @setup  - An inactive company and an internal user.
 * @expect - 404 and the company not to appear in the whitelist.
 * @route  - PUT /users
 */
export async function ATW_API_PUT_USE_FUNC_03(assert: test.Test) {

    assert.plan(2);

    let user = await databasePopulator.createUser({ userType: 18, status: 'I' });
    let internalUser = await databasePopulator.createInternalUser();

    let updateUserInfo = {
        email: user.emailAddress,
        whitelist: true
    };

    let response = await apiRequest.put(ROUTE, updateUserInfo, internalUser);

    assert.equal(response.status, 404);
    assert.false(await companyInWhitelist(user));

}

/**
 * @case   - Attempt to add a company that does not exist to the whitelist.
 * @setup  - A company and an internal user.
 * @expect - 404 company not found.
 * @route  - PUT /users
 */
export async function ATW_API_PUT_USE_FUNC_04(assert: test.Test) {

    assert.plan(1);

    let user = await databasePopulator.createUser({ userType: 18 });
    let internalUser = await databasePopulator.createInternalUser();

    let updateUserInfo = {
        email: 'soup@dog.com',
        whitelist: true
    };

    let response = await apiRequest.put(ROUTE, updateUserInfo, internalUser);

    assert.equal(response.status, 404);

}

/**
 * @case - Attempt to add the same company twice to the whitelist.
 * @setup  - A company and an internal user.
 * @expect - 200 and the user to be updated, 403 the second time.
 * @route  - PUT /users
 */
export async function ATW_API_PUT_USE_FUNC_05(assert: test.Test) {

    assert.plan(3);

    let user = await databasePopulator.createUser({ userType: 18 });
    let internalUser = await databasePopulator.createInternalUser();

    let updateUserInfo = {
        email: user.emailAddress,
        whitelist: true
    };

    let response = await apiRequest.put(ROUTE, updateUserInfo, internalUser);
    let responseTwo = await apiRequest.put(ROUTE, updateUserInfo, internalUser);

    assert.equal(response.status, 200);
    assert.equal(responseTwo.status, 403);
    assert.true(await companyInWhitelist(user));

}

/**
 * @case   - Change the permissions for a representative.
 * @setup  - A company, a representative for the company and an internal user.
 * @expect - 200 and the user to be updated with correct permissions.
 * @route  - PUT /users
 */
export async function ATW_API_PUT_USE_FUNC_06(assert: test.Test) {

    assert.plan(2);

    let publisherCompany = await databasePopulator.createCompany({ userType: 18 });
    let publisherRep = await databasePopulator.createPublisher(publisherCompany.user.userID, 'write');
    let internalUser = await databasePopulator.createInternalUser();

    let updateUserInfo = {
        email: publisherRep.user.emailAddress,
        permissions: 'write'
    };

    let response = await apiRequest.put(ROUTE, updateUserInfo, internalUser);

    assert.equal(response.status, 200);
    assert.true(await userIsUpdated(publisherRep.user.userID, 'write'));

}

/**
 * @case - Attempt to change the permissions for a representative that does not exist.
 * @setup  - A company, a representative for the company and an internal user.
 * @expect - 404 user not found.
 * @route  - PUT /users
 */
export async function ATW_API_PUT_USE_FUNC_07(assert: test.Test) {

    assert.plan(1);

    let publisherCompany = await databasePopulator.createCompany({ userType: 18 });
    let publisherRep = await databasePopulator.createPublisher(publisherCompany.user.userID, 'write');
    let internalUser = await databasePopulator.createInternalUser();

    let updateUserInfo = {
        email: 'batman@soup.com',
        permissions: 'read'
    };

    let response = await apiRequest.put(ROUTE, updateUserInfo, internalUser);

    assert.equal(response.status, 404);

}

/**
 * @case - Attempt to change the permissions for a representative that is not in the mapping.
 * @setup  - A company, an unrelated index market user and an internal user.
 * @expect - 403 forbidden.
 * @route  - PUT /users
 */
export async function ATW_API_PUT_USE_FUNC_08(assert: test.Test) {

    assert.plan(1);

    let publisherCompany = await databasePopulator.createCompany({ userType: 18 });
    let badRep = await databasePopulator.createUser({ userType: 22 });
    let internalUser = await databasePopulator.createInternalUser();

    let updateUserInfo = {
        email: badRep.emailAddress,
        permissions: 'read'
    };

    let response = await apiRequest.put(ROUTE, updateUserInfo, internalUser);

    assert.equal(response.status, 403);

}

/**
 * @case - Attempt to change the permissions for a representative that is inactive.
 * @setup  - A company, an inactive representative for the company and an internal user.
 * @expect - 404 and the user to not be updated.
 * @route  - PUT /users
 */
export async function ATW_API_PUT_USE_FUNC_09(assert: test.Test) {

    assert.plan(2);

    let publisherCompany = await databasePopulator.createCompany({ userType: 18 });
    let publisherRep = await databasePopulator.createPublisher(publisherCompany.user.userID, 'write', { status: 'I' });
    let internalUser = await databasePopulator.createInternalUser();

    let updateUserInfo = {
        email: publisherRep.user.emailAddress,
        permissions: 'read'
    };

    let response = await apiRequest.put(ROUTE, updateUserInfo, internalUser);

    assert.equal(response.status, 404);
    assert.true(await userIsUpdated(publisherRep.user.userID, 'write'));

}

/**
 * @case - Attempt to change the permissions for a whitelisted company.
 * @setup  - A company, a representative for the company and an internal user.
 * @expect - 403 forbidden.
 * @route  - PUT /users
 */
export async function ATW_API_PUT_USE_FUNC_10(assert: test.Test) {

    assert.plan(1);

    let publisherCompany = await databasePopulator.createCompany({ userType: 18 });
    let publisherRep = await databasePopulator.createPublisher(publisherCompany.user.userID, 'write');
    let internalUser = await databasePopulator.createInternalUser();

    let updateUserInfo = {
        email: publisherCompany.user.emailAddress,
        permissions: 'read'
    };

    let response = await apiRequest.put(ROUTE, updateUserInfo, internalUser);

    assert.equal(response.status, 403);

}

/**
 * @case - Remove a representative from the mapping.
 * @setup  - A company, a representative for the company and an internal user.
 * @expect - 200 success, and the user to be removed from the mapping.
 * @route  - PUT /users
 */
export async function ATW_API_PUT_USE_FUNC_11(assert: test.Test) {

    assert.plan(2);

    let publisherCompany = await databasePopulator.createCompany({ userType: 18 });
    let publisherRep = await databasePopulator.createPublisher(publisherCompany.user.userID, 'write');
    let internalUser = await databasePopulator.createInternalUser();

    let updateUserInfo = {
        email: publisherRep.user.emailAddress,
        whitelist: false
    };

    let response = await apiRequest.put(ROUTE, updateUserInfo, internalUser);

    let row = await databaseManager.select().from('ixmUserCompanyMappings').where('userID', publisherRep.user.userID);

    assert.equal(response.status, 200);
    assert.false(row[0]);

}

/**
 * @case - Remove a company from the whitelist.
 * @setup  - A company, and an internal user.
 * @expect - 200 and the company to no longer be in the whitelist.
 * @route  - PUT /users
 */
export async function ATW_API_PUT_USE_FUNC_12(assert: test.Test) {

    assert.plan(2);

    let publisherCompany = await databasePopulator.createCompany({ userType: 18 });
    let internalUser = await databasePopulator.createInternalUser();

    let updateUserInfo = {
        email: publisherCompany.user.emailAddress,
        whitelist: false
    };

    let response = await apiRequest.put(ROUTE, updateUserInfo, internalUser);

    assert.equal(response.status, 200);
    assert.false(await companyInWhitelist(publisherCompany.user));

}

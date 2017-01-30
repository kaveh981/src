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

// Create a new internal user and another user.
async function createUserPackage(userFields: INewUserData) {

    let user = await databasePopulator.createUser(userFields);
    let internalUser = await databasePopulator.createInternalUser();

    return { user, internalUser };

}

async function verifyNewUser(userInfo: any, company: INewUserData, assert: test.Test) {

    let row = await databaseManager.select().from('users').where('emailAddress', userInfo.email);

    assert.deepEquals(row[0], {
        userID: row[0].userID,
        userType: 22,
        status: 'A',
        emailAddress: userInfo.email,
        password: row[0].password,
        version: 1,
        firstName: userInfo.first_name,
        lastName: userInfo.last_name,
        companyName: company.companyName,
        address1: company.address1,
        address2: row[0].address2,
        city: company.city,
        state: company.state,
        zipCode: company.zipCode,
        country: company.country,
        phone: userInfo.phone,
        fax: row[0].fax,
        lastLogin: row[0].lastLogin,
        createDate: row[0].createDate,
        modifyDate: row[0].modifyDate
    });

}

/**
 * @case - Create a new IX user on an active company.
 * @setup  - A publisher company.
 * @expect - 201 and the user to be created.
 * @route  - POST /users
 */
export async function ATW_API_POST_USE_FUNC_01(assert: test.Test) {

    assert.plan(2);

    let userPackage = await createUserPackage({ userType: 18 });

    let newUserInfo = {
        first_name: 'Jim',
        last_name: 'Dex',
        email: 'krispy@kream.ca',
        phone: '555-555-5555',
        company_email: userPackage.user.emailAddress,
        permissions: 'read'
    };

    let response = await apiRequest.post(ROUTE, newUserInfo, userPackage.internalUser);

    assert.equal(response.status, 201);

    await verifyNewUser(newUserInfo, userPackage.user, assert);

}

/**
 * @case - Attempt to create a new IX user for an inactive company.
 * @setup  - A publisher company which is inactive.
 * @expect - 404 user not found.
 * @route  - POST /users
 */
export async function ATW_API_POST_USE_FUNC_02(assert: test.Test) {

    assert.plan(1);

    let userPackage = await createUserPackage({ userType: 18, status: 'I' });

    let newUserInfo = {
        first_name: 'Jim',
        last_name: 'Dex',
        email: 'krispy@kream.ca',
        phone: '555-555-5555',
        company_email: userPackage.user.emailAddress,
        permissions: 'read'
    };

    let response = await apiRequest.post(ROUTE, newUserInfo, userPackage.internalUser);

    assert.equal(response.status, 404);

}

/**
 * @case - Attempt to create a new IX user for a company that does not exist.
 * @setup  - A publisher company.
 * @expect - 404 company not found.
 * @route  - POST /users
 */
export async function ATW_API_POST_USE_FUNC_03(assert: test.Test) {

    assert.plan(1);

    let userPackage = await createUserPackage({ userType: 18, status: 'A' });

    let newUserInfo = {
        first_name: 'Jim',
        last_name: 'Dex',
        email: 'krispy@kream.ca',
        phone: '555-555-5555',
        company_email: 'batman@robin.ca',
        permissions: 'read'
    };

    let response = await apiRequest.post(ROUTE, newUserInfo, userPackage.internalUser);

    assert.equal(response.status, 404);

}

/**
 * @case - Attempt to create two new IX users with the same email for an active company.
 * @setup  - A publisher company.
 * @expect - 201 for the first user, 403 for the second attempt.
 * @route  - POST /users
 */
export async function ATW_API_POST_USE_FUNC_04(assert: test.Test) {

    assert.plan(3);

    let userPackage = await createUserPackage({ userType: 18 });

    let newUserInfo = {
        first_name: 'Jim',
        last_name: 'Dex',
        email: 'krispy@kream.ca',
        phone: '555-555-5555',
        company_email: userPackage.user.emailAddress,
        permissions: 'read'
    };

    let badUserInfo = {
        first_name: 'Jima',
        last_name: 'Dexa',
        email: 'krispy@kream.ca',
        phone: '555-555-5555',
        company_email: userPackage.user.emailAddress,
        permissions: 'write'
    };

    let response = await apiRequest.post(ROUTE, newUserInfo, userPackage.internalUser);

    assert.equal(response.status, 201);

    let responseBadUser = await apiRequest.post(ROUTE, badUserInfo, userPackage.internalUser);

    await verifyNewUser(newUserInfo, userPackage.user, assert);

    assert.equal(responseBadUser.status, 403);

}

/**
 * @case - Attempt to create a new IX user for an IXM user.
 * @setup  - An IXM user not associated to a company.
 * @expect - 403 not a company.
 * @route  - POST /users
 */
export async function ATW_API_POST_USE_FUNC_05(assert: test.Test) {

    assert.plan(1);

    let userPackage = await createUserPackage({ userType: 22, status: 'A' });

    let newUserInfo = {
        first_name: 'Jim',
        last_name: 'Dex',
        email: 'krispy@kream.ca',
        phone: '555-555-5555',
        company_email: userPackage.user.emailAddress,
        permissions: 'read'
    };

    let response = await apiRequest.post(ROUTE, newUserInfo, userPackage.internalUser);

    assert.equal(response.status, 403);

}

/**
 * @case - Attempt to create a new IX user for a company with a non-sense permission.
 * @setup  - A publisher company.
 * @expect - 400 bad permission
 * @route  - POST /users
 */
export async function ATW_API_POST_USE_FUNC_06(assert: test.Test) {

    assert.plan(1);

    let userPackage = await createUserPackage({ userType: 22, status: 'A' });

    let newUserInfo = {
        first_name: 'Jim',
        last_name: 'Dex',
        email: 'krispy@kream.ca',
        phone: '555-555-5555',
        company_email: userPackage.user.emailAddress,
        permissions: 'RETURN OF THE WOLVES, ATTACK!'
    };

    let response = await apiRequest.post(ROUTE, newUserInfo, userPackage.internalUser);

    assert.equal(response.status, 400);

}

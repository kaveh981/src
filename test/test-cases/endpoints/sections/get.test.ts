'use strict';

import * as test from 'tape';

import { Injector } from '../../../src/lib/injector';
import { APIRequestManager } from '../../../src/lib/request-manager';
import { DatabasePopulator } from '../../../src/lib/database-populator';
import { DatabaseManager } from '../../../src/lib/database-manager';
import { Helper } from '../../../src/lib/helper';

const databasePopulator = Injector.request<DatabasePopulator>('DatabasePopulator');
const apiRequest = Injector.request<APIRequestManager>('APIRequestManager');
const databaseManager = Injector.request<DatabaseManager>('DatabaseManager');

/** Test constants */
const route = 'sections';

/*
 * @case    - Internal user impersonates a publisher, and tries to view their valid sections. Publisher also tries to view their sections
 * @expect  - 200, all sections returned for the internal user. 404 for the publisher.
 * @route   - GET sections/
 * @status  - working
 * @tags    - 
 */
export async function ATW_API_GET_SEC_FUNC_01(assert: test.Test) {

    /** Setup */
    assert.plan(3);

    let internalUser = await databasePopulator.createInternalUser();
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);

    /** Test */
    let response = await apiRequest.get(route, {}, publisher.user);

    assert.equals(response.status, 404);

    response = await apiRequest.get(route, {}, internalUser, pubCompany.user.userID);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'], [ await Helper.sectionToPayload(section) ]);

}

/*
 * @case    - Internal user impersonates a publisher, and tries to view their sections, while another publisher has their own sections.
 * @expect  - 200, only sections belonging to the impersonated publisher are returned.
 * @route   - GET sections/
 * @status  - working
 * @tags    - 
 */
export async function ATW_API_GET_SEC_FUNC_02(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let internalUser = await databasePopulator.createInternalUser();
    let pubCompany = await databasePopulator.createCompany();
    let otherPubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let otherSite = await databasePopulator.createSite(otherPubCompany.user.userID);
    await databasePopulator.createSection(otherPubCompany.user.userID, [ otherSite.siteID ]);

    /** Test */
    let response = await apiRequest.get(route, {}, internalUser, pubCompany.user.userID);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'], [ await Helper.sectionToPayload(section) ]);

}

/*
 * @case    - Internal user impersonates a publisher, and tries to view their invalid (no sites) sections.
 * @expect  - 200, no sections returned.
 * @route   - GET sections/
 * @status  - working
 * @tags    - 
 */
export async function ATW_API_GET_SEC_FUNC_03(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let internalUser = await databasePopulator.createInternalUser();
    let pubCompany = await databasePopulator.createCompany();
    await databasePopulator.createSection(pubCompany.user.userID, []);

    /** Test */
    let response = await apiRequest.get(route, {}, internalUser, pubCompany.user.userID);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'], []);

}

/*
 * @case    - Internal user impersonates a publisher, and tries to view their sections, one that is active and one that is deleted.
 * @expect  - 200, both sections are returned.
 * @route   - GET sections/
 * @status  - working
 * @tags    - 
 */
export async function ATW_API_GET_SEC_FUNC_04(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let internalUser = await databasePopulator.createInternalUser();
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let activeSection = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ], { status: 'A' });
    let deletedSection = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ], { status: 'D' });

    /** Test */
    let response = await apiRequest.get(route, {}, internalUser, pubCompany.user.userID);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'], [ await Helper.sectionToPayload(activeSection), await Helper.sectionToPayload(deletedSection) ]);

}

/*
 * @case    - Internal user impersonates a publisher, and tries to view their sections, one that is active and one that is deleted, with an active filter.
 * @expect  - 200, only the active section is returned.
 * @route   - GET sections/
 * @status  - working
 * @tags    - 
 */
export async function ATW_API_GET_SEC_FUNC_05(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let internalUser = await databasePopulator.createInternalUser();
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let activeSection = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ], { status: 'A' });
    await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ], { status: 'D' });

    /** Test */
    let response = await apiRequest.get(route + '?status=active', {}, internalUser, pubCompany.user.userID);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'], [ await Helper.sectionToPayload(activeSection) ]);

}

/*
 * @case    - Internal user impersonates a publisher, and tries to view their two sections with different names, with a full and partial name filter.
 * @expect  - 200, only the section corresponding to the name filter is returned.
 * @route   - GET sections/
 * @status  - working
 * @tags    - 
 */
export async function ATW_API_GET_SEC_FUNC_06(assert: test.Test) {

    /** Setup */
    assert.plan(4);

    let internalUser = await databasePopulator.createInternalUser();
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let activeSection = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ], { name: 'first' });
    await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ], { name: 'second' });

    /** Test */
    let response = await apiRequest.get(route + '?name=first', {}, internalUser, pubCompany.user.userID);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'], [ await Helper.sectionToPayload(activeSection) ]);

    response = await apiRequest.get(route + '?name=irs', {}, internalUser, pubCompany.user.userID);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'], [ await Helper.sectionToPayload(activeSection) ]);

}

/*
 * @case    - Internal user impersonates a publisher, and tries to view their sections, one that is active and one that is deleted, with a paused filter.
 * @expect  - 400
 * @route   - GET sections/
 * @status  - working
 * @tags    - 
 */
export async function ATW_API_GET_SEC_FUNC_07(assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let internalUser = await databasePopulator.createInternalUser();
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ], { status: 'A' });
    await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ], { status: 'D' });

    /** Test */
    let response = await apiRequest.get(route + '?status=paused', {}, internalUser, pubCompany.user.userID);

    assert.equals(response.status, 400);

}

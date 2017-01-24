'use strict';

import * as test from 'tape';

import { Injector } from '../../../../src/lib/injector';
import { APIRequestManager } from '../../../../src/lib/request-manager';
import { DatabasePopulator } from '../../../../src/lib/database-populator';
// import { Helper } from '../../../../src/lib/helper';

const databasePopulator = Injector.request<DatabasePopulator>('DatabasePopulator');
const apiRequest = Injector.request<APIRequestManager>('APIRequestManager');

/** Test constants */
const route = 'sections/';
// const currentDate: Date = new Date();

/*
 * @case    - External publisher tries to view a section they own. Internal user tries to view the same section.
 * @expect  - 404 for the publisher, not 401/404/500 for the internal user
 * @route   - GET sections/:section_id
 * @status  - working
 * @tags    - 
 */
export async function ATW_SECTION_GET_01(assert: test.Test) {

    /** Setup */
    assert.plan(4);

    let internalUser = await databasePopulator.createInternalUser();
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);

    /** Test */
    let response = await apiRequest.get(route + section.section.sectionID, {}, publisher.user);

    assert.equals(response.status, 404);

    response = await apiRequest.get(route + section.section.sectionID, {}, internalUser);

    assert.not(response.status, 401);
    assert.not(response.status, 404);
    assert.not(response.status, 500);

}

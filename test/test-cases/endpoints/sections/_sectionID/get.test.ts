'use strict';

import * as test from 'tape';

import { Injector } from '../../../../src/lib/injector';
import { APIRequestManager } from '../../../../src/lib/request-manager';
import { DatabasePopulator } from '../../../../src/lib/database-populator';
import { DatabaseManager } from '../../../../src/lib/database-manager';
import { Helper } from '../../../../src/lib/helper';

const databasePopulator = Injector.request<DatabasePopulator>('DatabasePopulator');
const apiRequest = Injector.request<APIRequestManager>('APIRequestManager');
const databaseManager = Injector.request<DatabaseManager>('DatabaseManager');

/** Test constants */
const route = 'sections/';

/*
 * @case    - External user tries to view a section they own. Internal user tries to view the same section.
 * @expect  - 404 for the publisher, 200 for the internal user
 * @route   - GET sections/:section_id
 * @status  - working
 * @tags    - 
 */
export async function ATW_API_GET_SECID_FUNC_01(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let internalUser = await databasePopulator.createInternalUser();
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);

    /** Test */
    let response = await apiRequest.get(route + section.section.sectionID, {}, publisher.user);

    assert.equals(response.status, 404);

    response = await apiRequest.get(route + section.section.sectionID, {}, internalUser);

    assert.equals(response.status, 200);

}

/*
 * @case    - Internal user tries to get a non-existent section
 * @expect  - 404 not found
 * @route   - GET sections/:section_id
 * @status  - working
 * @tags    - 
 */
export async function ATW_API_GET_SECID_FUNC_02(assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let internalUser = await databasePopulator.createInternalUser();
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);

    /** Test */
    let response = await apiRequest.get(route + (section.section.sectionID + 1), {}, internalUser);

    assert.equals(response.status, 404);

}

/*
 * @case    - Internal user tries to get a section whose status is 'A' and one with status 'D'
 * @expect  - 200, section is returned in both cases
 * @route   - GET sections/:section_id
 * @status  - working
 * @tags    - 
 */
export async function ATW_API_GET_SECID_FUNC_03(assert: test.Test) {

    /** Setup */
    assert.plan(4);

    let internalUser = await databasePopulator.createInternalUser();
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let activeSection = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ], { status: 'A' });
    let deletedSection = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ], { status: 'D' });

    /** Test */
    let response = await apiRequest.get(route + activeSection.section.sectionID, {}, internalUser);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'][0], await Helper.sectionToPayload(activeSection));

    response = await apiRequest.get(route + deletedSection.section.sectionID, {}, internalUser);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'][0], await Helper.sectionToPayload(deletedSection));

}

/*
 * @case    - Internal user tries to get a section whose owner is inactive
 * @expect  - 200, section is returned
 * @route   - GET sections/:section_id
 * @status  - working
 * @tags    - 
 */
export async function ATW_API_GET_SECID_FUNC_04(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let internalUser = await databasePopulator.createInternalUser();
    let pubCompany = await databasePopulator.createCompany({ status: 'N' });
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);

    /** Test */
    let response = await apiRequest.get(route + section.section.sectionID, {}, internalUser);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'][0], await Helper.sectionToPayload(section));

}

/*
 * @case    - Internal user tries to get a section whose only site is inactive
 * @expect  - 200, section is returned without any sites
 * @route   - GET sections/:section_id
 * @status  - working
 * @tags    - 
 */
export async function ATW_API_GET_SECID_FUNC_05(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let internalUser = await databasePopulator.createInternalUser();
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID, { status: 'N' });
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);

    /** Test */
    let response = await apiRequest.get(route + section.section.sectionID, {}, internalUser);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'][0], await Helper.sectionToPayload(section));

}

/*
 * @case    - Internal user tries to get a section with one active and one inactive site
 * @expect  - 200, section is returned with only the active site
 * @route   - GET sections/:section_id
 * @status  - working
 * @tags    - 
 */
export async function ATW_API_GET_SECID_FUNC_06(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let internalUser = await databasePopulator.createInternalUser();
    let pubCompany = await databasePopulator.createCompany();
    let activeSite = await databasePopulator.createSite(pubCompany.user.userID, { status: 'A' });
    let inactiveSite = await databasePopulator.createSite(pubCompany.user.userID, { status: 'N' });
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ activeSite.siteID, inactiveSite.siteID ]);

    /** Test */
    let response = await apiRequest.get(route + section.section.sectionID, {}, internalUser);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'][0], await Helper.sectionToPayload(section));

}

/*
 * @case    - Internal user tries to get a section that is designated as entireSite and that has matches
 * @expect  - 404, nothing is returned
 * @route   - GET sections/:section_id
 * @status  - working
 * @tags    - 
 */
export async function ATW_API_GET_SECID_FUNC_07(assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let internalUser = await databasePopulator.createInternalUser();
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ], { entireSite: 1 });
    await databasePopulator.createSectionMatches(section.section.sectionID);

    /** Test */
    let response = await apiRequest.get(route + section.section.sectionID, {}, internalUser);

    assert.equals(response.status, 404);

}

/*
 * @case    - Internal user tries to get a section that is not designated as entireSite and that has no matches
 * @expect  - 404, nothing is returned
 * @route   - GET sections/:section_id
 * @status  - working
 * @tags    - 
 */
export async function ATW_API_GET_SECID_FUNC_08(assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let internalUser = await databasePopulator.createInternalUser();
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ], { entireSite: 0 });
    await databaseManager.delete().from('rtbSectionMatches').where('sectionID', section.section.sectionID);
    section.section.matches = [];

    /** Test */
    let response = await apiRequest.get(route + section.section.sectionID, {}, internalUser);

    assert.equals(response.status, 404);

}

/*
 * @case    - Internal user tries to get a section that does not have ad unit mappings
 * @expect  - 200, section is returned with a null value for that restriction field
 * @route   - GET sections/:section_id
 * @status  - working
 * @tags    - 
 */
export async function ATW_API_GET_SECID_FUNC_09(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let internalUser = await databasePopulator.createInternalUser();
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    await databaseManager.delete().from('sectionAdUnitMappings').where('sectionID', section.section.sectionID);
    section.section.adUnits = [];

    /** Test */
    let response = await apiRequest.get(route + section.section.sectionID, {}, internalUser);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'][0], await Helper.sectionToPayload(section));

}

/*
 * @case    - Internal user tries to get a section that does not have country mappings
 * @expect  - 200, section is returned with a null value for that restriction field
 * @route   - GET sections/:section_id
 * @status  - working
 * @tags    - 
 */
export async function ATW_API_GET_SECID_FUNC_10(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let internalUser = await databasePopulator.createInternalUser();
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    await databaseManager.delete().from('sectionCountryMappings').where('sectionID', section.section.sectionID);
    section.section.countries = [];

    /** Test */
    let response = await apiRequest.get(route + section.section.sectionID, {}, internalUser);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'][0], await Helper.sectionToPayload(section));

}

/*
 * @case    - Internal user tries to get a section that does not have audience targeting mappings
 * @expect  - 200, section is returned with a null value for that restriction field
 * @route   - GET sections/:section_id
 * @status  - working
 * @tags    - 
 */
export async function ATW_API_GET_SECID_FUNC_11(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let internalUser = await databasePopulator.createInternalUser();
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    await databaseManager.delete().from('sectionDAPMappings').where('sectionID', section.section.sectionID);
    section.section.audienceTargetingSegments = [];

    /** Test */
    let response = await apiRequest.get(route + section.section.sectionID, {}, internalUser);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'][0], await Helper.sectionToPayload(section));

}

/*
 * @case    - Internal user tries to get a section that does not have frequency restriction mappings
 * @expect  - 200, section is returned with a null value for that restriction field
 * @route   - GET sections/:section_id
 * @status  - working
 * @tags    - 
 */
export async function ATW_API_GET_SECID_FUNC_12(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let internalUser = await databasePopulator.createInternalUser();
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    await databaseManager.delete().from('sectionDepthMappings').where('sectionID', section.section.sectionID);
    section.section.rtbDomainDepths = [];

    /** Test */
    let response = await apiRequest.get(route + section.section.sectionID, {}, internalUser);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'][0], await Helper.sectionToPayload(section));

}

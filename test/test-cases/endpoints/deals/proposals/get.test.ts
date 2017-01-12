'use strict';

import * as test from 'tape';

import { authenticationTest } from '../../../common/auth.test';
import { paginationTest } from '../../../common/pagination.test';

import { Injector } from '../../../../src/lib/injector';
import { APIRequestManager } from '../../../../src/lib/request-manager';
import { DatabasePopulator } from '../../../../src/lib/database-populator';
import { Helper } from '../../../../src/lib/helper';

const databasePopulator = Injector.request<DatabasePopulator>('DatabasePopulator');
const apiRequest = Injector.request<APIRequestManager>('APIRequestManager');

/** Test constants */
const route = 'deals/proposals';

async function authDatabaseSetup() {

    let dsp = await databasePopulator.createDSP(123);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);

}

/**
 * Database setup for pagination tests
 * @return: data: the data required from database setup to create a proposal
 */
async function paginationDatabaseSetup() {

    let dsp = await databasePopulator.createDSP(123);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);

    return {
        pubCompany: pubCompany,
        section: section,
        sender: buyerCompany.user
    };
}

/**
 * Create a proposal. Function should allow successive calls to create new proposals without problems.
 * @param: The data required to create new proposal
 * @returns The expected payload for that proposal (used by the test case for comparison with the database object).
 */
async function createProposal(data: ICreateEntityData) {

    let proposal = await databasePopulator.createProposal(data.pubCompany.user.userID, [ data.section.section.sectionID ]);

    return Helper.proposalToPayload(proposal, data.pubCompany.user);

}

/*
 * @case    - The buyer attempts to authenticate.
 * @expect  - Authentication tests to pass.
 * @route   - GET deals/proposals
 * @status  - working
 * @tags    - get, deals, auth
 */
export let ATW_PA_GET_AUTH = authenticationTest(route, 'get', authDatabaseSetup);

/*
 * @case    - Different pagination parameters are attempted.
 * @expect  - Pagination tests to pass.
 * @route   - GET deals/proposals
 * @status  - working
 * @tags    - get, deals, auth
 */
export let ATW_PA_GET_PAG = paginationTest(route, 'get', paginationDatabaseSetup, createProposal);

 /*
 * @case    - The buyer sends a GET request to view active proposals.
 * @expect  - The buyer should receive the defined proposal.
 * @route   - GET deals/proposals
 * @status  - working
 * @tags    - get, deals
 */
export async function IXM_API_DEALS_GET_01 (assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);

    /** Test */
    let response = await apiRequest.get(route, {}, buyer.user);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'][0], Helper.proposalToPayload(proposal, pubCompany.user));

}

 /*
 * @case    - The buyer sends a GET request to view deleted proposals created by a publisher.
 * @expect  - Nothing should be returned
 * @route   - GET deals/proposals
 * @status  - working
 * @tags    - get, deals
 */
export async function IXM_API_DEALS_GET_02 (assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ], { status: 'deleted' });

    /** Test */
    let response = await apiRequest.get(route, {}, buyer.user);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'], []);

}

 /*
 * @case    - Proposal owner send a request to see a deleted proposal
 * @expect  - Nothing should be returned
 * @route   - GET deals/proposals
 * @status  - working
 * @tags    - get, deals
 */
export async function IXM_API_DEALS_GET_03 (assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    await databasePopulator.createCompany({}, dsp.dspID);
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ], { status: 'deleted' });

    /** Test */
    let response = await apiRequest.get(route, {}, publisher.user);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'], []);

}

 /*
 * @case    - Buyer sends a request to see a proposal with no end date.
 * @expect  - Proposal should be returned.
 * @route   - GET deals/proposals
 * @status  - working
 * @tags    - get, deals
 */
export async function IXM_API_DEALS_GET_04 (assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ], { endDate: '0000-00-00' });

    /** Test */
    let response = await apiRequest.get(route, {}, buyer.user);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'], [ Helper.proposalToPayload(proposal, pubCompany.user) ]);

}

 /*
  * @case    - Buyer sends a request to see a proposal with no start date.
  * @expect  - Proposal should be returned.
  * @route   - GET deals/proposals
  * @status  - working
  * @tags    - get, deals
  */
export async function IXM_API_DEALS_GET_05 (assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ], { startDate: '0000-00-00' });

    /** Test */
    let response = await apiRequest.get(route, {}, buyer.user);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'], [ Helper.proposalToPayload(proposal, pubCompany.user) ]);

}

 /*
  * @case    - Buyer sends a request to see a proposal that has expired.
  * @expect  - No proposal should be returned.
  * @route   - GET deals/proposals
  * @status  - working
  * @tags    - get, deals
  */
export async function IXM_API_DEALS_GET_06 (assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ], { startDate: '0000-00-00', endDate: '1960-03-03' });

    /** Test */
    let response = await apiRequest.get(route, {}, buyer.user);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'], []);

}

 /*
  * @case    - Buyer sends a request to see a proposal that has invalid dates.
  * @expect  - No proposal should be returned.
  * @route   - GET deals/proposals
  * @status  - working
  * @tags    - get, deals
  */
export async function IXM_API_DEALS_GET_07 (assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ], { startDate: '2008-04-05', endDate: '1960-03-03' });

    /** Test */
    let response = await apiRequest.get(route, {}, buyer.user);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'], []);

}

/* 
 * @case    - Buyer sends a request to see proposals owned by specific ownerID with some proposals targeting a different user
 * @expect  - Proposals not targetting a different user from ownerID should be returned 
 * @route   - GET deals/proposals
 * @status  - passing
 * @tags    - get, filters, proposals,ownerID, targeting
*/
export async function ATW_API_GET_DEAPRO_FUNC_08 (assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let dspTargeted = await databasePopulator.createDSP(2);
    let buyerCompanyTargeted = await databasePopulator.createCompany({}, dspTargeted.dspID);
    let pubCompany = await databasePopulator.createCompany();
    await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);
    await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ], {}, [ buyerCompanyTargeted.user.userID ]);

    // This publisher's proposals should be filtered out.
    let filteredPubCompany = await databasePopulator.createCompany();
    let filteredSite =  await databasePopulator.createSite(filteredPubCompany.user.userID);
    let filteredSection = await databasePopulator.createSection(filteredPubCompany.user.userID, [ filteredSite.siteID ]);
    await databasePopulator.createProposal(filteredPubCompany.user.userID, [ filteredSection.section.sectionID ]);

    /** Test */
    let response = await apiRequest.get(route + `?owner_id=${pubCompany.user.userID}`, {}, buyer.user);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'], [ Helper.proposalToPayload(proposal, pubCompany.user) ]);

}

/* 
 * @case    - Buyer sends a request to see proposals owned by specific ownerID with page and limit
 * @expect  - Proposals from ownerID should be returned on only one page with no next page url
 * @route   - GET deals/proposals
 * @status  - passing
 * @tags    - get, filters, proposals,ownerID
*/
export async function ATW_API_GET_DEAPRO_FUNC_09 (assert: test.Test) {

    /** Setup */
    assert.plan(3);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');

    // First owner to be filtered out
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);
    await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);

    // Second owner to be included in results
    let pubCompany2 = await databasePopulator.createCompany();
    let site2 = await databasePopulator.createSite(pubCompany2.user.userID);
    let section2 = await databasePopulator.createSection(pubCompany2.user.userID, [ site2.siteID ]);
    let proposal1 = await databasePopulator.createProposal(pubCompany2.user.userID, [ section2.section.sectionID ]);
    let proposal2 = await databasePopulator.createProposal(pubCompany2.user.userID, [ section2.section.sectionID ]);

    /** Test */
    let response = await apiRequest.get(route + `?page=1&limit=2&owner_id=${pubCompany2.user.userID}`, {}, buyer.user);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'], [ Helper.proposalToPayload(proposal1, pubCompany2.user), Helper.proposalToPayload(proposal2, pubCompany2.user) ]);
    // Check that response is not expecting any more data
    assert.deepEqual(response.body.pagination.next_page_url, '');

}

/* 
 * @case    - Buyer sends a request to see proposals owned by specific ownerID with page and limit
 * @expect  - One proposal from ownerID should be returned on one page with next page url
 * @route   - GET deals/proposals
 * @status  - passing
 * @tags    - get, filters, proposals, ownerID, pagination
*/
export async function ATW_API_GET_DEAPRO_FUNC_10 (assert: test.Test) {

    /** Setup */
    assert.plan(3);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');

    // First owner to be filtered out
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);
    await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);

    // Second owner to be included in results
    let pubCompany2 = await databasePopulator.createCompany();
    let site2 = await databasePopulator.createSite(pubCompany2.user.userID);
    let section2 = await databasePopulator.createSection(pubCompany2.user.userID, [ site2.siteID ]);
    let proposal1 = await databasePopulator.createProposal(pubCompany2.user.userID, [ section2.section.sectionID ]);
    await databasePopulator.createProposal(pubCompany2.user.userID, [ section2.section.sectionID ]);

    /** Test */
    let response = await apiRequest.get(route + `?page=1&limit=1&owner_id=${pubCompany2.user.userID}`, {}, buyer.user);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'], [ Helper.proposalToPayload(proposal1, pubCompany2.user) ]);
    // Check that response is expecting more data
    assert.deepEqual(response.body.pagination.next_page_url, 'deals/proposals?page=2&limit=1');

}

/* 
 * @case    - Buyer sends a request to see proposals owned by specific ownerID which does not exist
 * @expect  - No proposals to be returned
 * @route   - GET deals/proposals
 * @status  - working
 * @tags    - get, filters, proposals,ownerID
*/
export async function ATW_API_GET_DEAPRO_FUNC_11 (assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);

    /** Test */
    let response = await apiRequest.get(route + `?owner_id=1`, {}, buyer.user);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'], []);

}

/* 
 * @case    - Buyer sends a request to see proposals owned by specific ownerID which is invalid
 * @expect  - 400 - TYPE NUMB TOO SMALL
 * @route   - GET deals/proposals
 * @status  - in progress
 * @tags    - get, filters, proposals,ownerID
*/
export async function ATW_API_GET_DEAPRO_FUNC_12 (assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);

    /** Test */
    let response = await apiRequest.get(route + `?owner_id=0`, {}, buyer.user);

    assert.equals(response.status, 400);

}

/* 
 * @case    - Buyer sends a request to see proposals owned by specific ownerID which is invalid
 * @expect  - 400
 * @route   - GET deals/proposals
 * @status  - in progress
 * @tags    - get, filters, proposals,ownerID
*/
export async function ATW_API_GET_DEAPRO_FUNC_13 (assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);

    /** Test */
    let response = await apiRequest.get(route + `?owner_id=someString`, {}, buyer.user);

    assert.equals(response.status, 400);

}

/* 
 * @case    - Buyer sends a request to see proposals owned by specific ownerID which does not have any proposals
 * @expect  - No proposals to be returned
 * @route   - GET deals/proposals
 * @status  - working
 * @tags    - get, filters, proposals,ownerID
*/
export async function ATW_API_GET_DEAPRO_FUNC_14 (assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();

    /** Test */
    let response = await apiRequest.get(route + `?owner_id=${pubCompany.user.userID}`, {}, buyer.user);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'], []);

}

/* 
 * @case    - Buyer sends a request to see proposals owned by specific ownerID which does not have any proposals
 * @expect  - No proposals to be returned
 * @route   - GET deals/proposals
 * @status  - working
 * @tags    - get, filters, proposals,ownerID
*/
export async function ATW_API_GET_DEAPRO_FUNC_15 (assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();

    /** Test */
    let response = await apiRequest.get(route + `?owner_id=${pubCompany.user.userID}`, {}, buyer.user);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'], []);

}

/* 
 * @case    - Buyer company sends a request to see proposals owned by specific ownerID with some proposals targeting a different user
 * @expect  - Proposals not targetting a different user from ownerID should be returned 
 * @route   - GET deals/proposals
 * @status  - passing
 * @tags    - get, filters, proposals,ownerID, targeting
 */
export async function ATW_API_GET_DEAPRO_FUNC_16 (assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let dspTargeted = await databasePopulator.createDSP(2);
    let buyerCompanyTargeted = await databasePopulator.createCompany({}, dspTargeted.dspID);
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);
    await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ], {}, [ buyerCompanyTargeted.user.userID ]);

    // This publisher's proposals should be filtered out.
    let filteredPubCompany = await databasePopulator.createCompany();
    let filteredSite =  await databasePopulator.createSite(filteredPubCompany.user.userID);
    let filteredSection = await databasePopulator.createSection(filteredPubCompany.user.userID, [ filteredSite.siteID ]);
    await databasePopulator.createProposal(filteredPubCompany.user.userID, [ filteredSection.section.sectionID ]);

    /** Test */
    let response = await apiRequest.get(route + `?owner_id=${pubCompany.user.userID}`, {}, buyerCompany.user);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'], [ Helper.proposalToPayload(proposal, pubCompany.user) ]);

}

/* 
 * @case    - Internal user impersonate a buyer company sends a request to see proposals owned by specific ownerID 
 *            with some proposals targeting a different user
 * @expect  - Proposals not targetting a different user from ownerID should be returned 
 * @route   - GET deals/proposals
 * @status  - passing
 * @tags    - get, filters, proposals,ownerID, targeting
 */
export async function ATW_API_GET_DEAPRO_FUNC_17 (assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let dspTargeted = await databasePopulator.createDSP(2);
    let buyerCompanyTargeted = await databasePopulator.createCompany({}, dspTargeted.dspID);
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);
    await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ], {}, [ buyerCompanyTargeted.user.userID ]);

    let internalUser = await databasePopulator.createInternalUser();
    let authResponse = await apiRequest.getAuthToken(internalUser.emailAddress, internalUser.password);
    let accessToken = authResponse.body.data.accessToken;

    // This publisher's proposals should be filtered out.
    let filteredPubCompany = await databasePopulator.createCompany();
    let filteredSite =  await databasePopulator.createSite(filteredPubCompany.user.userID);
    let filteredSection = await databasePopulator.createSection(filteredPubCompany.user.userID, [ filteredSite.siteID ]);
    await databasePopulator.createProposal(filteredPubCompany.user.userID, [ filteredSection.section.sectionID ]);

    /** Test */
    let response = await apiRequest.get(route + `?owner_id=${pubCompany.user.userID}`, {}, {
        userID: buyerCompany.user.userID,
        accessToken: accessToken
    });

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'], [ Helper.proposalToPayload(proposal, pubCompany.user) ]);

}

/* 
 * @case    - Get proposal created by a representative user that no longer active
 * @expect  - Proposal returned  with the company default contact information
 * @route   - GET deals/proposals
 * @status  - passing
 * @tags    - get, filters, proposals,ownerID, targeting
 */
export async function ATW_API_GET_DEAPRO_FUNC_18 (assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write', { status: 'N' });
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ], {}, [], publisher.user.userID);

    /** Test */
    let response = await apiRequest.get(route, {}, buyer.user);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'][0], Helper.proposalToPayload(proposal, pubCompany.user));

}

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
    await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [ site.siteID ]);
    await databasePopulator.createProposal(publisher.publisher.userID, [ section.section.sectionID ]);

}

/**
 * Database setup for pagination tests
 * @return: data: the data required from database setup to create a proposal
 */
async function paginationDatabaseSetup() {

    let dsp = await databasePopulator.createDSP(123);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [ site.siteID ]);

    return {
        publisher: publisher,
        section: section,
        sender: buyer.user
    };
}

/**
 * Create a proposal. Function should allow successive calls to create new proposals without problems.
 * @param: The data required to create new proposal
 * @returns The expected payload for that proposal (used by the test case for comparison with the database object).
 */
async function createProposal(data: ICreateEntityData) {

    let proposal = await databasePopulator.createProposal(data.publisher.publisher.userID, [ data.section.section.sectionID ]);

    return Helper.proposalToPayload(proposal, data.publisher.user);

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
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [ section.section.sectionID ]);

    /** Test */
    let response = await apiRequest.get(route, {}, buyer.user);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'][0], Helper.proposalToPayload(proposal, publisher.user));

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
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [ site.siteID ]);
    await databasePopulator.createProposal(publisher.publisher.userID, [ section.section.sectionID ], { status: 'deleted' });

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
    await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [ site.siteID ]);
    await databasePopulator.createProposal(publisher.publisher.userID, [ section.section.sectionID ], { status: 'deleted' });

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
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [ section.section.sectionID ], { endDate: '0000-00-00' });

    /** Test */
    let response = await apiRequest.get(route, {}, buyer.user);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'], [ Helper.proposalToPayload(proposal, publisher.user) ]);

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
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [ section.section.sectionID ], { startDate: '0000-00-00' });

    /** Test */
    let response = await apiRequest.get(route, {}, buyer.user);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'], [ Helper.proposalToPayload(proposal, publisher.user) ]);

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
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [ site.siteID ]);
    await databasePopulator.createProposal(publisher.publisher.userID, [ section.section.sectionID ],
                                                          { startDate: '0000-00-00', endDate: '1960-03-03' });

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
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [ site.siteID ]);
    await databasePopulator.createProposal(publisher.publisher.userID, [ section.section.sectionID ],
                                                          { startDate: '2008-04-05', endDate: '1960-03-03' });

    /** Test */
    let response = await apiRequest.get(route, {}, buyer.user);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'], []);

}

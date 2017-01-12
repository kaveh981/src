/* tslint:disable:no-unused-variable */
'use strict';

import * as test from 'tape';

import { paginationTest } from '../../../../common/pagination.test';
import { authenticationTest } from '../../../../common/auth.test';

import { Injector } from '../../../../../src/lib/injector';
import { APIRequestManager } from '../../../../../src/lib/request-manager';
import { DatabasePopulator } from '../../../../../src/lib/database-populator';
import { Helper } from '../../../../../src/lib/helper';

const databasePopulator = Injector.request<DatabasePopulator>('DatabasePopulator');
const apiRequest = Injector.request<APIRequestManager>('APIRequestManager');

/** Test constants */
const route = 'deals/proposals/incoming';

// Pagination Setup
async function setupPagination() {

    let dsp = await databasePopulator.createDSP(2);
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');

    return {
        pubCompany: pubCompany,
        sender: publisher.user
    };
}

// Create a targeted proposal
async function createProposal(data: ICreateEntityData) {

    let pubCompany = data.pubCompany;

    let buyerCompany = await databasePopulator.createCompany({}, 2);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');

    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);

    let proposal = await databasePopulator.createProposal(buyerCompany.user.userID, [ section.section.sectionID ], {}, [ pubCompany.user.userID ]);

    // Open proposal to make sure we aren't getting more than we want ie. only targeted proposals
    let openProposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);

    return Helper.proposalToPayload(proposal, buyerCompany.user);

}

// Set up db for auth
async function authSetup() {

    let data = await setupPagination();
    await createProposal(data);

    return {
        user: data.pubCompany.user
    };

}

export let ATW_API_GET_DEAPROINC_PAG = paginationTest(route, 'get', setupPagination, createProposal);

export let ATW_API_GET_DEAPROINC_AUTH = authenticationTest(route, 'get', authSetup);

/**
 * @case    - A publisher views proposals targeted to them, and a buyer has targeted them in a proposal.
 * @expect  - The publisher should receive the defined proposal.
 * @route   - GET deals/proposals/incoming
 * @status  - working
 * @tags    - get, deals
 */
export async function ATW_API_GET_DEAPROINC_FUNC_01 (assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);

    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');

    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');

    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);

    let proposal = await databasePopulator.createProposal(buyerCompany.user.userID, [ section.section.sectionID ], {}, [ pubCompany.user.userID ]);

    // Open proposal to make sure we aren't getting more than we want ie. only targeted proposals
    let openProposal = await databasePopulator.createProposal(buyerCompany.user.userID, [ section.section.sectionID ]);

    /** Test */
    let response = await apiRequest.get(route, {}, publisher.user);

    assert.equals(response.status, 200);
    assert.deepEquals(response.body['data'], [ Helper.proposalToPayload(proposal, buyerCompany.user) ]);

}

/**
 * @case    - A buyer views proposals targeted to them, and a publisher has targeted them in a proposal.
 * @expect  - The buyer should receive the defined proposal.
 * @route   - GET deals/proposals
 * @status  - working
 * @tags    - get, deals
 */
export async function ATW_API_GET_DEAPROINC_FUNC_02 (assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);

    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');

    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');

    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);

    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ], {}, [ buyerCompany.user.userID ]);

    // Open proposal to make sure we aren't getting more than we want ie. only targeted proposals
    let openProposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);

    /** Test */
    let response = await apiRequest.get(route, {}, buyer.user);

    assert.equals(response.status, 200);
    assert.deepEquals(response.body['data'], [ Helper.proposalToPayload(proposal, pubCompany.user) ]);

}

/**
 * @case    - A buyer company views proposals targeted to them, and a publisher has targeted them in a proposal.
 * @expect  - The buyer company should receive the defined proposal.
 * @route   - GET deals/proposals
 * @status  - working
 * @tags    - get, deals
 */
export async function ATW_API_GET_DEAPROINC_FUNC_03 (assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);

    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');

    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');

    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);

    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ], {}, [ buyerCompany.user.userID ]);

    // Open proposal to make sure we aren't getting more than we want ie. only targeted proposals
    let openProposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);

    /** Test */
    let response = await apiRequest.get(route, {}, buyerCompany.user);

    assert.equals(response.status, 200);
    assert.deepEquals(response.body['data'], [ Helper.proposalToPayload(proposal, pubCompany.user) ]);

}

/**
 * @case    - A publisher company views proposals targeted to them, and a buyer has targeted them in a proposal.
 * @expect  - The publisher should receive the defined proposal.
 * @route   - GET deals/proposals/incoming
 * @status  - working
 * @tags    - get, deals
 */
export async function ATW_API_GET_DEAPROINC_FUNC_04 (assert: test.Test) {

    /** 
     * Setup 
     */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);

    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');

    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');

    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);

    let proposal = await databasePopulator.createProposal(buyerCompany.user.userID, [ section.section.sectionID ], {}, [ pubCompany.user.userID ]);

    // Open proposal to make sure we aren't getting more than we want ie. only targeted proposals
    let openProposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);

    /** 
     * Test 
     */
    let response = await apiRequest.get(route, {}, pubCompany.user);

    assert.equals(response.status, 200);
    assert.deepEquals(response.body['data'], [ Helper.proposalToPayload(proposal, buyerCompany.user) ]);

}

/**
 * @case    - A publisher company views targeted proposals, but a buyer has not targeted them.
 * @expect  - The publisher should receive nothing.
 * @route   - GET deals/proposals/incoming
 * @status  - working
 * @tags    - get, deals
 */
export async function ATW_API_GET_DEAPROINC_FUNC_05 (assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);

    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');

    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');

    let pubCompany2 = await databasePopulator.createCompany();
    let publisher2 = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');

    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);

    let proposal = await databasePopulator.createProposal(buyerCompany.user.userID, [ section.section.sectionID ], {}, [ pubCompany2.user.userID ]);

    // Open proposal to make sure we aren't getting more than we want ie. only targeted proposals
    let openProposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);

    /** Test */
    let response = await apiRequest.get(route, {}, pubCompany.user);

    assert.equals(response.status, 200);
    assert.deepEquals(response.body['data'], []);

}

/**
 * @case    - A buyer company views proposals targeted to them, and a publisher has targeted another buyer in a proposal.
 * @expect  - The buyer company should not receive the defined proposal.
 * @route   - GET deals/proposals
 * @status  - working
 * @tags    - get, deals
 */
export async function ATW_API_GET_DEAPROINC_FUNC_06 (assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);

    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');

    let buyerCompany2 = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer2 = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');

    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');

    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);

    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ], {}, [ buyerCompany2.user.userID ]);

    // Open proposal to make sure we aren't getting more than we want ie. only targeted proposals
    let openProposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);

    /** Test */
    let response = await apiRequest.get(route, {}, buyerCompany.user);

    assert.equals(response.status, 200);
    assert.deepEquals(response.body['data'], []);

}

/**
 * @case    - A buyer company views proposals targeted to them, and a publisher has targeted them in a deleted proposal.
 * @expect  - The buyer company should receive nothing.
 * @route   - GET deals/proposals
 * @status  - working
 * @tags    - get, deals
 */
export async function ATW_API_GET_DEAPROINC_FUNC_07 (assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);

    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');

    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');

    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);

    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ],
                                                          { status: 'deleted' }, [ buyerCompany.user.userID ]);

    // Open proposal to make sure we aren't getting more than we want ie. only targeted proposals
    let openProposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);

    /** Test */
    let response = await apiRequest.get(route, {}, buyerCompany.user);

    assert.equals(response.status, 200);
    assert.deepEquals(response.body['data'], []);

}

/**
 * @case    - A publisher company views proposals targeted to them, and a buyer has targeted them in a deleted proposal.
 * @expect  - The publisher should receive nothin.
 * @route   - GET deals/proposals/incoming
 * @status  - working
 * @tags    - get, deals
 */
export async function ATW_API_GET_DEAPROINC_FUNC_08 (assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);

    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');

    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');

    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);

    let proposal = await databasePopulator.createProposal(buyerCompany.user.userID, [ section.section.sectionID ],
                                                          { status: 'deleted' }, [ pubCompany.user.userID ]);

    // Open proposal to make sure we aren't getting more than we want ie. only targeted proposals
    let openProposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);

    /** Test */
    let response = await apiRequest.get(route, {}, pubCompany.user);

    assert.equals(response.status, 200);
    assert.deepEquals(response.body['data'], []);

}

/**
 * @case    - A publisher company views proposals targeted to them, and a buyer has targeted them in an expired proposal.
 * @expect  - The publisher should receive nothin.
 * @route   - GET deals/proposals/incoming
 * @status  - working
 * @tags    - get, deals
 */
export async function ATW_API_GET_DEAPROINC_FUNC_09 (assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);

    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');

    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');

    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);

    let proposal = await databasePopulator.createProposal(buyerCompany.user.userID, [ section.section.sectionID ],
                                                          { startDate: '1992-07-29', endDate: '2000-12-01' }, [ pubCompany.user.userID ]);

    // Open proposal to make sure we aren't getting more than we want ie. only targeted proposals
    let openProposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);

    /** Test */
    let response = await apiRequest.get(route, {}, pubCompany.user);

    assert.equals(response.status, 200);
    assert.deepEquals(response.body['data'], []);

}

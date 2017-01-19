/* tslint:disable:no-unused-variable */
'use strict';

import * as test from 'tape';

// import { authenticationTest } from '../../../common/auth.test';
import { paginationTest } from '../../../../common/pagination.test';
import { authenticationTest } from '../../../../common/auth.test';

import { Injector } from '../../../../../src/lib/injector';
import { APIRequestManager } from '../../../../../src/lib/request-manager';
import { DatabasePopulator } from '../../../../../src/lib/database-populator';
import { Helper } from '../../../../../src/lib/helper';

const databasePopulator = Injector.request<DatabasePopulator>('DatabasePopulator');
const apiRequest = Injector.request<APIRequestManager>('APIRequestManager');

/** Test constants */
const route = 'deals/proposals/owned';

// Pagination Setup
async function setupPagination() {

    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');

    return {
        pubCompany: pubCompany,
        sender: publisher.user
    };
}

// Create a proposal
async function createProposal(data: ICreateEntityData) {

    let pubCompany = data.pubCompany;
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);

    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);

    return (await Helper.proposalToPayload(proposal, pubCompany.user));

}

// Set up db for auth
async function authSetup() {

    let data = await setupPagination();
    await createProposal(data);

    return {
        user: data.pubCompany.user
    };

}

export let ATW_API_GET_DEAPROOUT_PAG = paginationTest(route, 'get', setupPagination, createProposal);

export let ATW_API_GET_DEAPROOUT_AUTH = authenticationTest(route, 'get', authSetup);

/**
 * @case    - A publisher views proposals they own, an open one and a targeted one.
 * @expect  - The publisher should receive the defined proposals.
 * @route   - GET deals/proposals/owned
 * @status  - working
 * @tags    - get, deals
 */
export async function ATW_API_GET_DEAPROOUT_FUNC_01 (assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);

    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');

    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');

    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);

    let openProposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);
    let targetedProposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ], {}, [ buyerCompany.user.userID ]);
    let strayProposal = await databasePopulator.createProposal(buyerCompany.user.userID, [ section.section.sectionID ], {}, [ pubCompany.user.userID ]);

    /** Test */
    let response = await apiRequest.get(route, {}, publisher.user);

    assert.equals(response.status, 200);
    assert.deepEquals(response.body['data'], [ await Helper.proposalToPayload(openProposal, pubCompany.user),
                                               await Helper.proposalToPayload(targetedProposal, pubCompany.user) ]);

}

/**
 * @case    - A buyer views proposals they own, an open one and a targeted one.
 * @expect  - The buyer should receive the defined proposals.
 * @route   - GET deals/proposals/owned
 * @status  - working
 * @tags    - get, deals
 */
export async function ATW_API_GET_DEAPROOUT_FUNC_02 (assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);

    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');

    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');

    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);

    let openProposal = await databasePopulator.createProposal(buyerCompany.user.userID, [ section.section.sectionID ]);
    let targetedProposal = await databasePopulator.createProposal(buyerCompany.user.userID, [ section.section.sectionID ], {}, [ pubCompany.user.userID ]);
    let strayProposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ], {}, [ buyerCompany.user.userID ]);

    /** Test */
    let response = await apiRequest.get(route, {}, buyer.user);

    assert.equals(response.status, 200);
    assert.deepEquals(response.body['data'], [ await Helper.proposalToPayload(openProposal, buyerCompany.user),
                                               await Helper.proposalToPayload(targetedProposal, buyerCompany.user) ]);

}

/**
 * @case    - A publisher views proposals they own, an open one and a deleted one.
 * @expect  - The publisher should receive only the open proposal.
 * @route   - GET deals/proposals/owned
 * @status  - working
 * @tags    - get, deals
 */
export async function ATW_API_GET_DEAPROOUT_FUNC_03 (assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);

    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');

    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');

    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);

    let openProposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);
    let deletedProposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ], { status: 'deleted' });
    let strayProposal = await databasePopulator.createProposal(buyerCompany.user.userID, [ section.section.sectionID ], {}, [ pubCompany.user.userID ]);

    /** Test */
    let response = await apiRequest.get(route, {}, publisher.user);

    assert.equals(response.status, 200);
    assert.deepEquals(response.body['data'], [ await Helper.proposalToPayload(openProposal, pubCompany.user) ]);

}

/**
 * @case    - A buyer views proposals they own, an open one and a deleted one.
 * @expect  - The buyer should receive only the open proposal.
 * @route   - GET deals/proposals/owned
 * @status  - working
 * @tags    - get, deals
 */
export async function ATW_API_GET_DEAPROOUT_FUNC_04 (assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);

    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');

    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');

    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);

    let openProposal = await databasePopulator.createProposal(buyerCompany.user.userID, [ section.section.sectionID ]);
    let deletedProposal = await databasePopulator.createProposal(buyerCompany.user.userID, [ section.section.sectionID ], { status: 'deleted' });
    let strayProposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ], {}, [ buyerCompany.user.userID ]);

    /** Test */
    let response = await apiRequest.get(route, {}, buyer.user);

    assert.equals(response.status, 200);
    assert.deepEquals(response.body['data'], [ await Helper.proposalToPayload(openProposal, buyerCompany.user) ]);

}

/**
 * @case    - A publisher company views proposals they own, an open one and a targeted one.
 * @expect  - The publisher company should receive the defined proposals.
 * @route   - GET deals/proposals/owned
 * @status  - working
 * @tags    - get, deals
 */
export async function ATW_API_GET_DEAPROOUT_FUNC_05 (assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);

    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');

    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');

    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);

    let openProposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);
    let targetedProposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ], {}, [ buyerCompany.user.userID ]);
    let strayProposal = await databasePopulator.createProposal(buyerCompany.user.userID, [ section.section.sectionID ], {}, [ pubCompany.user.userID ]);

    /** Test */
    let response = await apiRequest.get(route, {}, pubCompany.user);

    assert.equals(response.status, 200);
    assert.deepEquals(response.body['data'], [ await Helper.proposalToPayload(openProposal, pubCompany.user),
                                               await Helper.proposalToPayload(targetedProposal, pubCompany.user) ]);

}

/**
 * @case    - A buyer company views proposals they own, an open one and a targeted one.
 * @expect  - The buyer company should receive the defined proposals.
 * @route   - GET deals/proposals/owned
 * @status  - working
 * @tags    - get, deals
 */
export async function ATW_API_GET_DEAPROOUT_FUNC_06 (assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);

    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');

    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');

    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);

    let openProposal = await databasePopulator.createProposal(buyerCompany.user.userID, [ section.section.sectionID ]);
    let targetedProposal = await databasePopulator.createProposal(buyerCompany.user.userID, [ section.section.sectionID ], {}, [ pubCompany.user.userID ]);
    let strayProposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ], {}, [ buyerCompany.user.userID ]);

    /** Test */
    let response = await apiRequest.get(route, {}, buyerCompany.user);

    assert.equals(response.status, 200);
    assert.deepEquals(response.body['data'], [ await Helper.proposalToPayload(openProposal, buyerCompany.user),
                                               await Helper.proposalToPayload(targetedProposal, buyerCompany.user) ]);

}

/**
 * @case    - A publisher views proposals they own, an open one and a expired one.
 * @expect  - The publisher should receive both proposals.
 * @route   - GET deals/proposals/owned
 * @status  - working
 * @tags    - get, deals
 */
export async function ATW_API_GET_DEAPROOUT_FUNC_07 (assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);

    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');

    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');

    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);

    let openProposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);
    let expiredProposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ],
                                                                 { startDate: '1992-07-29', endDate: '2000-12-01' });
    let strayProposal = await databasePopulator.createProposal(buyerCompany.user.userID, [ section.section.sectionID ], {}, [ pubCompany.user.userID ]);

    /** Test */
    let response = await apiRequest.get(route, {}, publisher.user);

    assert.equals(response.status, 200);
    assert.deepEquals(response.body['data'], [ await Helper.proposalToPayload(openProposal, pubCompany.user),
                                               await Helper.proposalToPayload(expiredProposal, pubCompany.user) ]);

}

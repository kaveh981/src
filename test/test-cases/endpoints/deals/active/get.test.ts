'use strict';

import * as test from 'tape';

import { authenticationTest } from '../../../common/auth.test';

import { Injector } from '../../../../src/lib/injector';
import { APIRequestManager } from '../../../../src/lib/request-manager';
import { DatabasePopulator } from '../../../../src/lib/database-populator';
import { Helper } from '../../../../src/lib/helper';
import { DatabaseManager } from '../../../../src/lib/database-manager';

const databasePopulator = Injector.request<DatabasePopulator>('DatabasePopulator');
const apiRequest = Injector.request<APIRequestManager>('APIRequestManager');
const databaseManager = Injector.request<DatabaseManager>('DatabaseManager');

/** Test constants */
const ROUTE = 'deals/active';
const VERB = 'get';

/**
 * Create a settled deal. Function should allow successive calls to create new proposals without problems.
 * @param [publisher] - The publisher object that will own the settled deal.
 * @returns The expected payload for that proposal (used by the test case for comparison with the database object).
 */
async function createSettledDeal(publisher: INewPubData) {
    let dsp = await databasePopulator.createDSP(123);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    if (typeof publisher === 'undefined') {
        publisher = await databasePopulator.createPublisher();
    }
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);
    let negotiation = await databasePopulator.createDealNegotiation(
            proposal.proposal.proposalID, publisher.publisher.userID, buyer.user.userID);
    let activeDeal = await databasePopulator.createSettledDeal(
            publisher.publisher.userID, [section.section.sectionID], negotiation.negotiationID);

    return Helper.settledDealToPayload(activeDeal, negotiation, proposal, publisher, buyer);
}

/*
 * @case    - The buyer attempts to authenticate.
 * @expect  - Authentication tests to pass.
 * @route   - GET deals/active
 * @status  - passing
 * @tags    - get, deals, auth
 */
export let IXM_API_DA_GET_AUTH = authenticationTest(ROUTE, VERB, createSettledDeal);

/*
 * @case    - Different pagination parameters are attempted.
 * @expect  - Pagination tests to pass.
 * @route   - GET deals/active
 * @status  - commented out (must restructure common pagination suite)
 * @tags    - get, deals, auth
 */
// export let IXM_API_DA_GET_PAG = paginationTest(ROUTE, VERB, paginationDatabaseSetup, createSettledDeal);

 /*
 * @case    - Proposal is still in negotiation, no rtbDeals entry present
 * @expect  - No deals returned
 * @route   - GET deals/active
 * @status  - passing
 * @tags    - get, active, deals
 */
export async function IXM_API_DA_GET_01 (assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);
    let negotiation = await databasePopulator.createDealNegotiation(
            proposal.proposal.proposalID, publisher.publisher.userID, buyer.user.userID);

    /** Test */
    let response = await apiRequest.get(ROUTE, {}, buyer.user.userID);

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.data, []);

}

 /*
 * @case    - Proposal got rejected, no rtbDeals entry present
 * @expect  - No deals returned
 * @route   - GET deals/active
 * @status  - passing
 * @tags    - get, active, deals
 */
export async function IXM_API_DA_GET_02 (assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);
    let negotiation = await databasePopulator.createDealNegotiation(
            proposal.proposal.proposalID, publisher.publisher.userID, buyer.user.userID, {pubStatus: 'rejected', buyerStatus: 'accepted'});

    /** Test */
    let response = await apiRequest.get(ROUTE, {}, buyer.user.userID);

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.data, []);

}

 /*
 * @case    - Proposal got accepted and rtbDeals entry is present
 * @expect  - A payload containing the deal data.
 * @route   - GET deals/active
 * @status  - failing (created_at returned, but not from rtbDeals (?) and modified_at is wrong)
 * @tags    - get, active, deals
 */
export async function IXM_API_DA_GET_03 (assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);
    let negotiation = await databasePopulator.createDealNegotiation(
        proposal.proposal.proposalID, publisher.publisher.userID, buyer.user.userID);
    let settledDeal = await databasePopulator.createSettledDeal(
        publisher.publisher.userID, [section.section.sectionID], negotiation.negotiationID);

    /** Test */
    let response = await apiRequest.get(ROUTE, {}, buyer.user.userID);

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.data[0], Helper.settledDealToPayload(settledDeal, negotiation, proposal, publisher, buyer));

}

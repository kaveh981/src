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
 * @case    - Settled deal start date is in the future
 * @expect  - No deals returned
 * @route   - GET deals/active
 * @status  - failing (rtbDeals insertion in setup is not recording the date properly)
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

    let tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    let settledDeal = await databasePopulator.createSettledDeal(
        publisher.publisher.userID,
        [section.section.sectionID],
        negotiation.negotiationID,
        {
            startDate: tomorrow
        });

    /** Test */
    let response = await apiRequest.get(ROUTE, {}, buyer.user.userID);

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.data, []);

}

 /*
 * @case    - Settled deal end date is in the past
 * @expect  - No deals returned
 * @route   - GET deals/active
 * @status  - failing (rtbDeals insertion in setup is not recording the date properly)
 * @tags    - get, active, deals
 */
export async function IXM_API_DA_GET_04 (assert: test.Test) {

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

    let yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    let threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    let settledDeal = await databasePopulator.createSettledDeal(
        publisher.publisher.userID,
        [section.section.sectionID],
        negotiation.negotiationID,
        {
            startDate: threeDaysAgo,
            endDate: yesterday
        });

    /** Test */
    let response = await apiRequest.get(ROUTE, {}, buyer.user.userID);

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.data, []);

}

 /*
 * @case    - One section linked to the settled deal is deactivated
 * @expect  - No deals returned
 * @route   - GET deals/active
 * @status  - failing (still showing the deal, but we shouldn't be)
 * @tags    - get, active, deals
 */
export async function IXM_API_DA_GET_05 (assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section1 = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let section2 = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID], {status: 'D'});
    let proposal = await databasePopulator.createProposal(
        publisher.publisher.userID, [section1.section.sectionID, section2.section.sectionID]);
    let negotiation = await databasePopulator.createDealNegotiation(
        proposal.proposal.proposalID, publisher.publisher.userID, buyer.user.userID);
    let settledDeal = await databasePopulator.createSettledDeal(
        publisher.publisher.userID, [section1.section.sectionID, section2.section.sectionID], negotiation.negotiationID);

    /** Test */
    let response = await apiRequest.get(ROUTE, {}, buyer.user.userID);

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.data, []);

}

 /*
 * @case    - All sections linked to the settled deal are deactivated
 * @expect  - No deals returned
 * @route   - GET deals/active
 * @status  - failing (still showing the deal, but we shouldn't be)
 * @tags    - get, active, deals
 */
export async function IXM_API_DA_GET_06 (assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section1 = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID], {status: 'D'});
    let section2 = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID], {status: 'D'});
    let proposal = await databasePopulator.createProposal(
        publisher.publisher.userID, [section1.section.sectionID, section2.section.sectionID]);
    let negotiation = await databasePopulator.createDealNegotiation(
        proposal.proposal.proposalID, publisher.publisher.userID, buyer.user.userID);
    let settledDeal = await databasePopulator.createSettledDeal(
        publisher.publisher.userID, [section1.section.sectionID, section2.section.sectionID], negotiation.negotiationID);

    /** Test */
    let response = await apiRequest.get(ROUTE, {}, buyer.user.userID);

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.data, []);

}

 /*
 * @case    - One site linked to the settled deal is deactivated (section is active)
 * @expect  - No deals returned
 * @route   - GET deals/active
 * @status  - failing (still showing the deal, but we shouldn't be)
 * @tags    - get, active, deals
 */
export async function IXM_API_DA_GET_07 (assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site1 = await databasePopulator.createSite(publisher.publisher.userID, {status: 'D'});
    let site2 = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site1.siteID, site2.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);
    let negotiation = await databasePopulator.createDealNegotiation(
        proposal.proposal.proposalID, publisher.publisher.userID, buyer.user.userID);
    let settledDeal = await databasePopulator.createSettledDeal(
        publisher.publisher.userID, [section.section.sectionID], negotiation.negotiationID);

    /** Test */
    let response = await apiRequest.get(ROUTE, {}, buyer.user.userID);

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.data, []);

}

 /*
 * @case    - All sites linked to the settled deal (through 1 section) are deactivated (section is active)
 * @expect  - No deals returned
 * @route   - GET deals/active
 * @status  - failing (still showing the deal, but we shouldn't be)
 * @tags    - get, active, deals
 */
export async function IXM_API_DA_GET_08 (assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site1 = await databasePopulator.createSite(publisher.publisher.userID, {status: 'D'});
    let site2 = await databasePopulator.createSite(publisher.publisher.userID, {status: 'D'});
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site1.siteID, site2.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);
    let negotiation = await databasePopulator.createDealNegotiation(
        proposal.proposal.proposalID, publisher.publisher.userID, buyer.user.userID);
    let settledDeal = await databasePopulator.createSettledDeal(
        publisher.publisher.userID, [section.section.sectionID], negotiation.negotiationID);

    /** Test */
    let response = await apiRequest.get(ROUTE, {}, buyer.user.userID);

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.data, []);

}

 /*
 * @case    - Publisher who created the proposal is now deactivated
 * @expect  - No deals returned
 * @route   - GET deals/active
 * @status  - failing (still showing the deal, but we shouldn't be)
 * @tags    - get, active, deals
 */
export async function IXM_API_DA_GET_09 (assert: test.Test) {

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
    publisher.user.status = 'D';

    /** Test */
    let response = await apiRequest.get(ROUTE, {}, buyer.user.userID);

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.data, []);

}

 /*
 * @case    - Proposal got accepted and rtbDeals entry of active status is present
 * @expect  - A payload containing the deal data.
 * @route   - GET deals/active
 * @status  - failing (created_at returned, but not from rtbDeals (?) and modified_at is wrong)
 * @tags    - get, active, deals
 */
export async function IXM_API_DA_GET_10 (assert: test.Test) {

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
        publisher.publisher.userID, [section.section.sectionID], negotiation.negotiationID, {status: 'A'});

    /** Test */
    let response = await apiRequest.get(ROUTE, {}, buyer.user.userID);

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.data[0], Helper.settledDealToPayload(settledDeal, negotiation, proposal, publisher, buyer));

}

 /*
 * @case    - Proposal got accepted and rtbDeals entry of paused status is present
 * @expect  - A payload containing the deal data.
 * @route   - GET deals/active
 * @status  - failing (created_at returned, but not from rtbDeals (?) and modified_at is wrong)
 * @tags    - get, active, deals
 */
export async function IXM_API_DA_GET_11 (assert: test.Test) {

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
        publisher.publisher.userID, [section.section.sectionID], negotiation.negotiationID, {status: 'P'});

    /** Test */
    let response = await apiRequest.get(ROUTE, {}, buyer.user.userID);

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.data[0], Helper.settledDealToPayload(settledDeal, negotiation, proposal, publisher, buyer));

}

 /*
 * @case    - Proposal got accepted and rtbDeals entry of deactivated status is present
 * @expect  - A payload containing the deal data.
 * @route   - GET deals/active
 * @status  - failing (created_at returned, but not from rtbDeals (?) and modified_at is wrong)
 * @tags    - get, active, deals
 */
export async function IXM_API_DA_GET_12 (assert: test.Test) {

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
        publisher.publisher.userID, [section.section.sectionID], negotiation.negotiationID, {status: 'D'});

    /** Test */
    let response = await apiRequest.get(ROUTE, {}, buyer.user.userID);

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.data[0], Helper.settledDealToPayload(settledDeal, negotiation, proposal, publisher, buyer));

}

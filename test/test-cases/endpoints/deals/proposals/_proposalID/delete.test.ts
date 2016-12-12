'use strict';

import * as test from 'tape';

import { Injector, authenticationTest, DatabasePopulator, APIRequestManager, validationTest, Helper } from '../../../../../test-framework';

const databasePopulator = Injector.request<DatabasePopulator>('DatabasePopulator');
const apiRequest = Injector.request<APIRequestManager>('APIRequestManager');

/** Test constants */
const route = 'deals/proposals';

/**
 * Common database setup for authentication and proposalID validation
 */
async function databaseSetup() {

    let dsp = await databasePopulator.createDSP(123);
    await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [ section.section.sectionID ]);

    return { userID: publisher.user.userID, proposalID: proposal.proposal.proposalID };

}

/*
 * @case    - The owner attempts to authenticate.
 * @expect  - Authentication tests to pass.
 * @route   - DELETE deals/proposals/:proposal_id
 * @status  - working
 * @tags    - delete, proposal, auth
 */
export let ATW_API_DELETE_DEAPROID_AUTH = authenticationTest(route + '/1', 'delete', databaseSetup);

/*
 * @case    - Common validation cases for proposalID.
 * @setup   - create proposal and apply common validation method.
 * @expect  - Validations tests to pass.
 * @route   - DELETE deals/proposals/:proposal_id
 * @status  - working
 * @tags    - delete, proposal, validation
 */
export let ATW_API_DELETE_DEAPROID_VALI = validationTest(route, 'delete', databaseSetup, {},
    { proposalID: { type: 'integer' } });

/*
 * @case    - The user is the owner of proposal
 * @setup   - create DSP,Buyer,Publisher,Site,Section,Proposal and dealNegotiation 
 * then delete the proposal
 * @expect  - 200,proposal and negotation status deleted.
 * @route   - DELETE deals/proposals/:proposal_id
 * @status  - working
 * @tags    - delete, proposal
 */
export async function ATW_API_DELETE_DEAPROID_01(assert: test.Test) {

    /** Setup */
    let dsp = await databasePopulator.createDSP(3);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(publisher.user.userID, [ section.section.sectionID ]);
    await databasePopulator.createDealNegotiation(proposal.proposal.proposalID,
        publisher.user.userID, buyer.user.userID);
    /** Test */
    let response = await apiRequest.delete(route + `/${proposal.proposal.proposalID}`, {}, publisher.user.userID);

    let deletedProposal = await Helper.getProposalById(proposal.proposal.proposalID);
    let deletedNegotiations = await Helper.getNegotiationsByProposalID(proposal.proposal.proposalID);
    let plans = deletedNegotiations.length * 2 + 3;

    assert.plan(plans);
    assert.equals(response.status, 200, "Response ok");
    assert.equals(response.body.data[0].proposal_id, proposal.proposal.proposalID);
    assert.equal(deletedProposal[0].status, 'deleted');
    deletedNegotiations.forEach((deletedNegotiation) => {
        assert.equal(deletedNegotiation.pubStatus, 'deleted');
        assert.equal(deletedNegotiation.buyerStatus, 'active');
    });

}

/*
 * @case    - Deals created based on this proposal should maintain their status
 * @setup   - create DSP,Buyer,Publisher,Site,Section,Proposal,dealNegotiation and an active deal
 * then delete the proposal
 * @expect  - 200 deal status should stay active.
 * @route   - DELETE deals/proposals/:proposal_id
 * @status  - working
 * @tags    - delete, proposal
 */
export async function ATW_API_DELETE_DEAPROID_02(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(3);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(publisher.user.userID, [ section.section.sectionID ]);
    let dealNegotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID,
        publisher.user.userID, buyer.user.userID);
    await databasePopulator.createSettledDeal(publisher.publisher.userID, [ section.section.sectionID ],
        dealNegotiation.negotiationID);

    /** Test */
    let response = await apiRequest.delete(route + `/${proposal.proposal.proposalID}`, {}, publisher.user.userID);

    let rtbDeals = await Helper.getDealsByProposalID(proposal.proposal.proposalID);

    assert.equals(response.status, 200);
    rtbDeals.forEach((proposalDeal) => {
        assert.equal(proposalDeal.status, 'A');
    });

}

/*
 * @case    - Deleting a deleted proposal
 * @setup   - create DSP,Buyer,Publisher,Site,Section and a deleted Proposal
 * then delete the proposal
 * @expect  - 404 Forbidden.
 * @route   - DELETE deals/proposals/:proposal_id
 * @status  - working
 * @tags    - delete, proposal
 */
export async function ATW_API_DELETE_DEAPROID_03(assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(3);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(buyer.user.userID, [ section.section.sectionID ], { status: 'deleted' });

    /** Test */
    let response = await apiRequest.delete(route + `/${proposal.proposal.proposalID}`, {}, buyer.user.userID);

    assert.equals(response.status, 404);

}

/*
 * @case    - Deleting an expired proposal
 * @setup   - create DSP,Buyer,Publisher,Site,Section and a proposal with endDate = today - 5
 * then delete the proposal
 * @expect  - 200.
 * @route   - DELETE deals/proposals/:proposal_id
 * @status  - working
 * @tags    - delete, proposal
 */
export async function ATW_API_DELETE_DEAPROID_04(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(3);
    await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [ site.siteID ]);
    let currentDate = new Date();
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [ section.section.sectionID ],
        { endDate: new Date(currentDate.setDate(currentDate.getDate() - 5)) });

    /** Test */
    let response = await apiRequest.delete(route + `/${proposal.proposal.proposalID}`, {}, publisher.user.userID);

    assert.equals(response.status, 200, "Response ok");
    assert.equals(response.body.data[0].proposal_id, proposal.proposal.proposalID);

}

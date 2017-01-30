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
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [ section.section.sectionID ]);

    return { user: publisher.user, userID: publisher.user.userID, proposalID: proposal.proposal.proposalID };

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
 * @expect  - Validations tests to pass.
 * @route   - DELETE deals/proposals/:proposal_id
 * @status  - working
 * @tags    - delete, proposal, validation
 */
export let ATW_API_DELETE_DEAPROID_VALI = validationTest(route, 'delete', databaseSetup, {},
    { proposalID: { type: 'integer' } });

/*
 * @case    - The user is the owner of proposal
 * @expect  - 200,proposal and negotation status deleted.
 * @route   - DELETE deals/proposals/:proposal_id
 * @status  - working
 * @tags    - delete, proposal
 */
export async function ATW_API_DELETE_DEAPROID_01(assert: test.Test) {

    /** Setup */
    let dsp = await databasePopulator.createDSP(3);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);
    await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, buyerCompany.user.userID);
    /** Test */
    let response = await apiRequest.delete(route + `/${proposal.proposal.proposalID}`, {}, publisher.user);

    let deletedProposal = await Helper.getProposalById(proposal.proposal.proposalID);
    let deletedNegotiations = await Helper.getNegotiationsByProposalID(proposal.proposal.proposalID);

    assert.plan(4);
    assert.equals(response.status, 200, "Response ok");
    assert.equals(response.body.data[0].proposal_id, proposal.proposal.proposalID);
    assert.equal(deletedProposal[0].status, 'deleted');
    deletedNegotiations.forEach((deletedNegotiation) => {
        assert.equal(deletedNegotiation.ownerStatus, 'deleted');
    });

}

/*
 * @case    - Deals created based on this proposal should maintain their status
 * @expect  - 200 deal status should stay active.
 * @route   - DELETE deals/proposals/:proposal_id
 * @status  - working
 * @tags    - delete, proposal
 */
export async function ATW_API_DELETE_DEAPROID_02(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(3);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);
    let dealNegotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, buyerCompany.user.userID);
    await databasePopulator.createSettledDeal(pubCompany.user.userID, [ section.section.sectionID ], dealNegotiation.negotiationID);

    /** Test */
    let response = await apiRequest.delete(route + `/${proposal.proposal.proposalID}`, {}, publisher.user);

    let rtbDeals = await Helper.getDealsByProposalID(proposal.proposal.proposalID);

    assert.equals(response.status, 200);
    rtbDeals.forEach((proposalDeal) => {
        assert.equal(proposalDeal.status, 'A');
    });

}

/*
 * @case    - Deleting a deleted proposal
 * @expect  - 404 Forbidden.
 * @route   - DELETE deals/proposals/:proposal_id
 * @status  - working
 * @tags    - delete, proposal
 */
export async function ATW_API_DELETE_DEAPROID_03(assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(3);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(buyerCompany.user.userID, [ section.section.sectionID ], { status: 'deleted' });

    /** Test */
    let response = await apiRequest.delete(route + `/${proposal.proposal.proposalID}`, {}, buyer.user);

    assert.equals(response.status, 404);

}

/*
 * @case    - Deleting an expired proposal
 * @expect  - 200.
 * @route   - DELETE deals/proposals/:proposal_id
 * @status  - working
 * @tags    - delete, proposal
 */
export async function ATW_API_DELETE_DEAPROID_04(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(3);
    await databasePopulator.createCompany({}, dsp.dspID);
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let currentDate = new Date();
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ],
        { endDate: new Date(currentDate.setDate(currentDate.getDate() - 5)) });

    /** Test */
    let response = await apiRequest.delete(route + `/${proposal.proposal.proposalID}`, {}, publisher.user);

    assert.equals(response.status, 200, "Response ok");
    assert.equals(response.body.data[0].proposal_id, proposal.proposal.proposalID);

}

/*
 * @case    - User deletes proposal created by another user in the same company
 * @expect  - 200,proposal and negotation status deleted.
 * @route   - DELETE deals/proposals/:proposal_id
 * @status  - working
 * @tags    - delete, proposal
 */
export async function ATW_API_DELETE_DEAPROID_05(assert: test.Test) {

    /** Setup */
    let dsp = await databasePopulator.createDSP(3);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let anotherPublisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(publisher.companyID, [ section.section.sectionID ]);
    await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, buyerCompany.user.userID);

    /** Test */
    let response = await apiRequest.delete(route + `/${proposal.proposal.proposalID}`, {}, anotherPublisher.user);

    let deletedProposal = await Helper.getProposalById(proposal.proposal.proposalID);
    let deletedNegotiations = await Helper.getNegotiationsByProposalID(proposal.proposal.proposalID);

    assert.plan(4);
    assert.equals(response.status, 200, "Response ok");
    assert.equals(response.body.data[0].proposal_id, proposal.proposal.proposalID);
    assert.equal(deletedProposal[0].status, 'deleted');
    deletedNegotiations.forEach((deletedNegotiation) => {
        assert.equal(deletedNegotiation.ownerStatus, 'deleted');
    });

}

/*
 * @case    - Company delete proposal by company account
 * @expect  - 200,proposal and negotation status deleted.
 * @route   - DELETE deals/proposals/:proposal_id
 * @status  - working
 * @tags    - delete, proposal
 */
export async function ATW_API_DELETE_DEAPROID_06(assert: test.Test) {

    /** Setup */
    let dsp = await databasePopulator.createDSP(3);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);
    await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, buyerCompany.user.userID);

    /** Test */
    let response = await apiRequest.delete(route + `/${proposal.proposal.proposalID}`, {}, pubCompany.user);

    let deletedProposal = await Helper.getProposalById(proposal.proposal.proposalID);
    let deletedNegotiations = await Helper.getNegotiationsByProposalID(proposal.proposal.proposalID);

    assert.plan(4);
    assert.equals(response.status, 200, "Response ok");
    assert.equals(response.body.data[0].proposal_id, proposal.proposal.proposalID);
    assert.equal(deletedProposal[0].status, 'deleted');
    deletedNegotiations.forEach((deletedNegotiation) => {
        assert.equal(deletedNegotiation.ownerStatus, 'deleted');
    });

}

/*
 * @case    - Internal user delete proposal on behalf of a publisher
 * @expect  - 200,proposal and negotation status deleted.
 * @route   - DELETE deals/proposals/:proposal_id
 * @status  - working
 * @tags    - delete, proposal
 */
export async function ATW_API_DELETE_DEAPROID_07(assert: test.Test) {

    /** Setup */
    let dsp = await databasePopulator.createDSP(3);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let internalUser = await databasePopulator.createInternalUser();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);
    await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, buyerCompany.user.userID);

    /** Test */
    let authResponse = await apiRequest.getAuthToken(internalUser.emailAddress, internalUser.password);
    let accessToken = authResponse.body.data.accessToken;

    let response = await apiRequest.delete(route + `/${proposal.proposal.proposalID}`, {}, {
        userID: publisher.user.userID,
        accessToken: accessToken
    });

    let deletedProposal = await Helper.getProposalById(proposal.proposal.proposalID);
    let deletedNegotiations = await Helper.getNegotiationsByProposalID(proposal.proposal.proposalID);

    assert.plan(4);
    assert.equals(response.status, 200, "Response ok");
    assert.equals(response.body.data[0].proposal_id, proposal.proposal.proposalID);
    assert.equal(deletedProposal[0].status, 'deleted');
    deletedNegotiations.forEach((deletedNegotiation) => {
        assert.equal(deletedNegotiation.ownerStatus, 'deleted');
    });

}

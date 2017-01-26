'use strict';

import * as test from 'tape';

import { authenticationTest } from '../../../../common/auth.test';
import { validationTest } from '../../../../common/validation.test';

import { Injector } from '../../../../../src/lib/injector';
import { APIRequestManager } from '../../../../../src/lib/request-manager';
import { DatabasePopulator } from '../../../../../src/lib/database-populator';
import { Helper } from '../../../../../src/lib/helper';

const databasePopulator = Injector.request<DatabasePopulator>('DatabasePopulator');
const apiRequest = Injector.request<APIRequestManager>('APIRequestManager');

/** Test constants */
const route = 'deals/proposals';
const currentDate: Date = new Date();

/**
 * Common database setup for authentication and proposalID validation
 */
async function databaseSetup() {

    let dsp = await databasePopulator.createDSP(123);
    await databasePopulator.createCompany({}, dsp.dspID);
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);

    return { user: publisher.user, userID: publisher.user.userID, proposalID: proposal.proposal.proposalID };

}

/*
 * @case    - The buyer attempts to authenticate.
 * @expect  - Authentication tests to pass.
 * @route   - GET deals/proposals/:proposal_id
 * @status  - working
 * @tags    - get, proposal, auth
 */
export let ATW_PA_GET_SP_AUTH = authenticationTest(route + '/1', 'get', databaseSetup);

/*
 * @case    - Common validation cases for proposalID.
 * @expect  - Validations tests to pass.
 * @route   - GET deals/proposals/:proposal_id
 * @status  - failing
 * @tags    - get, proposal, validation
 */
export let ATW_PA_GET_SP_VALIDATION = validationTest(route + '/1', 'get', databaseSetup, {}, { proposalID: { type: 'integer' } });

/*
 * @case    - The user is the owner of proposal
 * and set the owner and user both as publisher or both as buyer .
 * @expect  - 200.
 * @route   - GET deals/proposals/:proposal_id
 * @status  - working
 * @tags    - get, proposal
 */
export async function IXM_API_PROPOSAL_GET_SP_01(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);

    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, publisher.user);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'][0], await Helper.proposalToPayload(proposal, pubCompany.user));

}

/*
 * @case    - User is not the owner and has a different type from the owner (buyer/publisher)
 * @expect  - 200.
 * @route   - GET deals/proposals/:proposal_id
 * @status  - working
 * @tags    - get, proposal
 */
export async function IXM_API_PROPOSAL_GET_SP_02(assert: test.Test) {

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
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, buyer.user);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'][0], await Helper.proposalToPayload(proposal, pubCompany.user));
}

/*
 * @case    - User is not the owner and has the same type as the owner
 * and set publisher as the owner and the user.
 * @expect  - 200.
 * @route   - GET deals/proposals/:proposal_id
 * @status  - working
 * @tags    - get, proposal
 */
export async function IXM_API_PROPOSAL_GET_SP_03(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let pubCompany = await databasePopulator.createCompany();
    let pubCompany2 = await databasePopulator.createCompany();
    let publisher2 = await databasePopulator.createPublisher(pubCompany2.user.userID, 'write');
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);

    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, publisher2.user);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'][0], await Helper.proposalToPayload(proposal, pubCompany.user));
}

/*
 * @case    - when the owner is inactive
 * @expect  - 404 - owner is inactive -> proposal is inactive -> proposal is not readable -> proposal not found
 * @route   - GET deals/proposals/:proposal_id
 * @status  - working
 * @tags    - get, proposal
 */
export async function IXM_API_PROPOSAL_GET_SP_04(assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany({ status: 'D' });
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);

    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, buyer.user);

    assert.equals(response.status, 404);

}

/*
 * @case    - ProposalID is not provided
 * @expect  - 200.
 * @route   - GET deals/proposals/:proposal_id
 * @status  - working
 * @tags    - get, proposal
 */
export async function IXM_API_PROPOSAL_GET_SP_05(assert: test.Test) {

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
    assert.deepEqual(response.body['data'][0], await Helper.proposalToPayload(proposal, pubCompany.user));

}

/*
 * @case    - ProposalID is out of range
 * @expect  - 400 - Malformed Request
 * @route   - GET deals/proposals/:proposal_id
 * @status  - working
 * @tags    - get, proposal
 */
export async function IXM_API_PROPOSAL_GET_SP_06(assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ], { proposalID: 16777215 });

    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID + 1}`, {}, buyer.user);

    assert.equals(response.status, 404);

}

/*
 * @case    - ProposalID is deleted and user is the owner
 * @expect  - 404 - Proposal not found - does not exist to user because it is deleted
 * @route   - GET deals/proposals/:proposal_id
 * @status  - working
 * @tags    - get, proposal
 */
export async function IXM_API_PROPOSAL_GET_SP_07(assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ], { status: 'deleted' });

    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, publisher.user);

    assert.equals(response.status, 404);

}

/*
 * @case    - ProposalID is deleted and user is NOT the owner 
 * @expect  - 404.
 * @route   - GET deals/proposals/:proposal_id
 * @status  - working
 * @tags    - get, proposal
 */
export async function IXM_API_PROPOSAL_GET_SP_08(assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ], { status: 'deleted' });

    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, buyer.user);

    assert.equals(response.status, 404);

}

/*
 * @case    - ProposalID is paused and user is the owner
 * @expect  - 200.
 * @route   - GET deals/proposals/:proposal_id
 * @status  - working
 * @tags    - get, proposal
 */
export async function IXM_API_PROPOSAL_GET_SP_09(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ], { status: 'paused' });

    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, publisher.user);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'][0], await Helper.proposalToPayload(proposal, pubCompany.user));

}

/*
 * @case    - ProposalID is paused and user is NOT the owner
 * @expect  - 404 - Not found. Is not active, so does not exist to user 
 * @route   - GET deals/proposals/:proposal_id
 * @status  - working
 * @tags    - get, proposal
 */
export async function IXM_API_PROPOSAL_GET_SP_10(assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ], { status: 'paused' });

    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, buyer.user);

    assert.equals(response.status, 404);
}

/*
 * @case    - ProposalID end date is today and the owner is the user
 * @expect  - 200.
 * @route   - GET deals/proposals/:proposal_id
 * @status  - working
 * @tags    - get, proposal
 */
export async function IXM_API_PROPOSAL_GET_SP_11(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ], { endDate: currentDate });

    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, publisher.user);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'][0], await Helper.proposalToPayload(proposal, pubCompany.user));

}

/*
 * @case    - ProposalID end date is today and the owner is NOT the user
 * @expect  - 200.
 * @route   - GET deals/proposals/:proposal_id
 * @status  - working
 * @tags    - get, proposal
 */
export async function IXM_API_PROPOSAL_GET_SP_12(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ], { endDate: currentDate });

    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, buyer.user);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'][0], await Helper.proposalToPayload(proposal, pubCompany.user));

}

/*
 * @case    - ProposalID end date is earlier than today and the owner is the user
 * @expect  - 200.
 * @route   - GET deals/proposals/:proposal_id
 * @status  - working
 * @tags    - get, proposal
 */
export async function IXM_API_PROPOSAL_GET_SP_13(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ],
        { endDate: new Date(currentDate.setDate(currentDate.getDate() - 5)) });

    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, publisher.user);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'][0], await Helper.proposalToPayload(proposal, pubCompany.user));

}

/*
 * @case    - ProposalID end date is earlier than today and the owner is NOT the user
 * @expect  - 404 - Proposal not found. Proposal does not exist to user (is not readable)
 * @route   - GET deals/proposals/:proposal_id
 * @status  - working
 * @tags    - get, proposal
 */
export async function IXM_API_PROPOSAL_GET_SP_14(assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ],
        { endDate: new Date(currentDate.setDate(currentDate.getDate() - 5)) });

    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, buyer.user);

    assert.equals(response.status, 200);

}

/*
 * @case    - ProposalID start date is earlier than today and the owner is the user
 * @expect  - 200.
 * @route   - GET deals/proposals/:proposal_id
 * @status  - working
 * @tags    - get, proposal
 */
export async function IXM_API_PROPOSAL_GET_SP_15(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ],
        { startDate: new Date(currentDate.setDate(currentDate.getDate() - 5)) });

    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, publisher.user);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'][0], await Helper.proposalToPayload(proposal, pubCompany.user));

}

/*
 * @case    - ProposalID start date is earlier than today and the owner is NOT the user
 * @expect  - 200.
 * @route   - GET deals/proposals/:proposal_id
 * @status  - working
 * @tags    - get, proposal
 */
export async function IXM_API_PROPOSAL_GET_SP_16(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ],
        { startDate: new Date(currentDate.setDate(currentDate.getDate() - 5)) });

    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, buyer.user);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'][0], await Helper.proposalToPayload(proposal, pubCompany.user));

}

/*
 * @case    - ProposalID start date is later than today and the owner is the user
 * @expect  - 200.
 * @route   - GET deals/proposals/:proposal_id
 * @status  - working
 * @tags    - get, proposal
 */
export async function IXM_API_PROPOSAL_GET_SP_17(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ],
        { startDate: new Date(currentDate.setDate(currentDate.getDate() + 5)) });

    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, publisher.user);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'][0], await Helper.proposalToPayload(proposal, pubCompany.user));

}

/*
 * @case    - ProposalID start date is later than today and the owner is NOT the user
 * @expect  - 403.
 * @route   - GET deals/proposals/:proposal_id
 * @status  - working
 * @tags    - get, proposal
 */
export async function IXM_API_PROPOSAL_GET_SP_18(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ],
        { startDate: new Date(currentDate.setDate(currentDate.getDate() + 5)) });

    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, buyer.user);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'][0], await Helper.proposalToPayload(proposal, pubCompany.user));

}

/*
 * @case    - Some sections are no longer active and the owner is the user
 * @expect  - 200.
 * @route   - GET deals/proposals/:proposal_id
 * @status  - working
 * @tags    - get, proposal
 */
export async function IXM_API_PROPOSAL_GET_SP_19(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section1 = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let section2 = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ], { status: 'D' });
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section1.section.sectionID, section2.section.sectionID ]);
    let expectedProposal: INewProposalData = proposal;
    expectedProposal.sectionIDs = [ section1.section.sectionID ];
    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, publisher.user);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'][0], await Helper.proposalToPayload(expectedProposal, pubCompany.user));

}

/*
 * @case    - Some sections are no longer active and the owner is NOT the user
 * @expect  - 200.
 * @route   - GET deals/proposals/:proposal_id
 * @status  - working
 * @tags    - get, proposal
 */
export async function IXM_API_PROPOSAL_GET_SP_20(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section1 = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let section2 = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ], { status: 'D' });
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section1.section.sectionID, section2.section.sectionID ]);
    let expectedProposal: INewProposalData = proposal;
    expectedProposal.sectionIDs = [ section1.section.sectionID ];
    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, buyer.user);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'][0], await Helper.proposalToPayload(expectedProposal, pubCompany.user));

}

/*
 * @case    - There is no active section and the owner is the user
 * @expect  - 200.
 * @route   - GET deals/proposals/:proposal_id
 * @status  - working
 * @tags    - get, proposal
 */
export async function IXM_API_PROPOSAL_GET_SP_21(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ], { status: 'D' });
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);
    let expectedProposal: INewProposalData = proposal;
    expectedProposal.sectionIDs = [];
    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, publisher.user);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'][0], await Helper.proposalToPayload(expectedProposal, pubCompany.user));

}

/*
 * @case    - There is no active section and the owner is NOT the user
 * @expect  - 404 - Proposal not found. Is not readable, does not exist to user
 * @route   - GET deals/proposals/:proposal_id
 * @status  - working
 * @tags    - get, proposal
 */
export async function IXM_API_PROPOSAL_GET_SP_22(assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ], { status: 'D' });
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);

    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, buyer.user);

    assert.equals(response.status, 200);

}

/*
 * @case    - Some sites are no longer active and the owner is the user.
 * @expect  - 200.
 * @route   - GET deals/proposals/:proposal_id
 * @status  - working
 * @tags    - get, proposal
 */
export async function IXM_API_PROPOSAL_GET_SP_23(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let site1 = await databasePopulator.createSite(pubCompany.user.userID);
    let site2 = await databasePopulator.createSite(pubCompany.user.userID, { status: 'D' });
    let section1 = await databasePopulator.createSection(pubCompany.user.userID, [ site1.siteID ]);
    let section2 = await databasePopulator.createSection(pubCompany.user.userID, [ site2.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section1.section.sectionID, section2.section.sectionID ]);
    let expectedProposal: INewProposalData = proposal;
    expectedProposal.sectionIDs = [ section1.section.sectionID ];
    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, publisher.user);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'][0], await Helper.proposalToPayload(expectedProposal, pubCompany.user));

}

/*
 * @case    - Some sites are no longer active and the owner is NOT the user
 * @expect  - 200.
 * @route   - GET deals/proposals/:proposal_id
 * @status  - working
 * @tags    - get, proposal
 */
export async function IXM_API_PROPOSAL_GET_SP_24(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site1 = await databasePopulator.createSite(pubCompany.user.userID);
    let site2 = await databasePopulator.createSite(pubCompany.user.userID, { status: 'D' });
    let section1 = await databasePopulator.createSection(pubCompany.user.userID, [ site1.siteID ]);
    let section2 = await databasePopulator.createSection(pubCompany.user.userID, [ site2.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section1.section.sectionID, section2.section.sectionID ]);
    let expectedProposal: INewProposalData = proposal;
    expectedProposal.sectionIDs = [ section1.section.sectionID ];
    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, buyer.user);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'][0], await Helper.proposalToPayload(expectedProposal, pubCompany.user));

}

/*
 * @case    - There is no active site and the owner is the user.
 * @expect  - 200.
 * @route   - GET deals/proposals/:proposal_id
 * @status  - working
 * @tags    - get, proposal
 */
export async function IXM_API_PROPOSAL_GET_SP_25(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let site = await databasePopulator.createSite(pubCompany.user.userID, { status: 'D' });
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);
    let expectedProposal: INewProposalData = proposal;
    expectedProposal.sectionIDs = [];
    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, publisher.user);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'][0], await Helper.proposalToPayload(expectedProposal, pubCompany.user));

}

/*
 * @case    - There is no active site and the owner is NOT the user
 * @expect  - 404 - Proposal not found. Is not readable by user. It does not exist to current user. 
 * @route   - GET deals/proposals/:proposal_id
 * @status  - working
 * @tags    - get, proposal
 */
export async function IXM_API_PROPOSAL_GET_SP_26(assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID, { status: 'D' });
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);

    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, buyer.user);

    assert.equals(response.status, 404);

}

/*
 * @case    - There is no proposal available
 * @expect  - 404.
 * @route   - GET deals/proposals/:proposal_id
 * @status  - working
 * @tags    - get, proposal
 */
export async function IXM_API_PROPOSAL_GET_SP_27(assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(1);
    await databasePopulator.createCompany({}, dsp.dspID);
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');

    /** Test */
    let response = await apiRequest.get(route + `/${5}`, {}, publisher.user);

    assert.equals(response.status, 404);

}

/*
 * @case    - The current buyer is not targeted by proposal but another buyer is  
 * @expect  - 404 - The buyer is not able to see the proposal 
 * @route   - GET deals/proposals/:proposal_id
 * @status  - working
 * @tags    - get, proposal, targeting
 */
export async function IXM_API_PROPOSAL_GET_SP_28(assert: test.Test) {

    /** Setup */
    assert.plan(6);

    let dsp = await databasePopulator.createDSP(1);
    let targetedBuyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let nonTargetedBuyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let nonTargetedBuyer = await databasePopulator.createBuyer(nonTargetedBuyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ], {},
                                                          [ targetedBuyerCompany.user.userID ]);
    let internalUser = await databasePopulator.createInternalUser();

    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, nonTargetedBuyer.user);

    assert.equals(response.status, 404);
    assert.deepEqual(response.body.data, []);

    // buyer company
    response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, nonTargetedBuyerCompany.user);

    assert.equals(response.status, 404);
    assert.deepEqual(response.body.data, []);

    // Internal User impersonation
    let authResponse = await apiRequest.getAuthToken(internalUser.emailAddress, internalUser.password);
    let accessToken = authResponse.body.data.accessToken;

    response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, {
        userID: nonTargetedBuyerCompany.user.userID,
        accessToken: accessToken
    });

    assert.equals(response.status, 404);
    assert.deepEqual(response.body.data, []);

}

/*
 * @case    - The current publisher is not targeted by proposal but another publisher is.
 * @expect  - 404 - The publisher is not able to see the proposal 
 * @route   - GET deals/proposals/:proposal_id
 * @status  - working
 * @tags    - get, proposal, targeting
 */
export async function IXM_API_PROPOSAL_GET_SP_29(assert: test.Test) {

    /** Setup */
    assert.plan(6);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let nonTargetedPubCompany = await databasePopulator.createCompany();
    let nonTargetedPublisher = await databasePopulator.createPublisher(nonTargetedPubCompany.user.userID, 'write');
    let targetedPubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(targetedPubCompany.user.userID);
    let section = await databasePopulator.createSection(targetedPubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(buyerCompany.user.userID, [ section.section.sectionID ], {},
                                                          [ targetedPubCompany.user.userID ]);
    let internalUser = await databasePopulator.createInternalUser();

    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, nonTargetedPublisher.user);

    assert.equals(response.status, 404);
    assert.deepEqual(response.body.data, []);

    // Company
    response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, nonTargetedPubCompany.user);

    assert.equals(response.status, 404);
    assert.deepEqual(response.body.data, []);

    // Internal user 
    let authResponse = await apiRequest.getAuthToken(internalUser.emailAddress, internalUser.password);
    let accessToken = authResponse.body.data.accessToken;

    response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, {
        userID: nonTargetedPubCompany.user.userID,
        accessToken: accessToken
    });

    assert.equals(response.status, 404);
    assert.deepEqual(response.body.data, []);

}

/*
 * @case    - The buyer is targeted by proposal being requested
 * @expect  - 200 - The buyer is able to see the proposal 
 * @route   - GET deals/proposals/:proposal_id
 * @status  - working
 * @tags    - get, proposal, targeting
 */
export async function IXM_API_PROPOSAL_GET_SP_30(assert: test.Test) {

    /** Setup */
    assert.plan(6);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ], {},
                                                          [ buyerCompany.user.userID ]);
    let internalUser = await databasePopulator.createInternalUser();

    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, buyer.user);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body.data, [ await Helper.proposalToPayload(proposal, pubCompany.user) ]);

    // Company
    response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, buyerCompany.user);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body.data, [ await Helper.proposalToPayload(proposal, pubCompany.user) ]);

    // internal User
    let authResponse = await apiRequest.getAuthToken(internalUser.emailAddress, internalUser.password);
    let accessToken = authResponse.body.data.accessToken;

    response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, {
        userID: buyerCompany.user.userID,
        accessToken: accessToken
    });

    assert.equals(response.status, 200);
    assert.deepEqual(response.body.data, [ await Helper.proposalToPayload(proposal, pubCompany.user) ]);

}

/*
 * @case    - The publisher is targeted by proposal being requested
 * @expect  - 200 - The buyer is able to see the proposal 
 * @route   - GET deals/proposals/:proposal_id
 * @status  - working
 * @tags    - get, proposal, targeting
 */
export async function IXM_API_PROPOSAL_GET_SP_31(assert: test.Test) {

    /** Setup */
    assert.plan(6);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(buyerCompany.user.userID, [ section.section.sectionID ], {},
                                                          [ pubCompany.user.userID ]);
    let internalUser = await databasePopulator.createInternalUser();

    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, publisher.user);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body.data, [ await Helper.proposalToPayload(proposal, buyerCompany.user) ]);

    // Company
    response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, pubCompany.user);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body.data, [ await Helper.proposalToPayload(proposal, buyerCompany.user) ]);

    // internal User
    let authResponse = await apiRequest.getAuthToken(internalUser.emailAddress, internalUser.password);
    let accessToken = authResponse.body.data.accessToken;

    response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, {
        userID: pubCompany.user.userID,
        accessToken: accessToken
    });

    assert.equals(response.status, 200);
    assert.deepEqual(response.body.data, [ await Helper.proposalToPayload(proposal, buyerCompany.user) ]);

}

/*
 * @case    - The publisher is targeted by proposal that has no sections
 * @expect  - 200 - The publisher is able to see the proposal 
 * @route   - GET deals/proposals/:proposal_id
 * @status  - 
 * @tags    - get, proposal, targeting
 */

export async function IXM_API_PROPOSAL_GET_SP_32(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let proposal = await databasePopulator.createProposal(buyerCompany.user.userID, [], {}, [ pubCompany.user.userID ]);

    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, publisher.user);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'][0], await Helper.proposalToPayload(proposal, buyerCompany.user));

}

/*
 * @case    - The buyer is targeted by proposal that has no sections
 * @expect  - 200 - The buyer is able to see the proposal 
 * @route   - GET deals/proposals/:proposal_id
 * @status  - 
 * @tags    - get, proposal, targeting
 */

export async function IXM_API_PROPOSAL_GET_SP_33(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [], {}, [ buyerCompany.user.userID ]);

    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, buyer.user);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'][0], await Helper.proposalToPayload(proposal, pubCompany.user));

}

/*
 * @case    - The publisher is targeted by proposal that has no valid sections
 * @expect  - 200 - The publisher is able to see the proposal 
 * @route   - GET deals/proposals/:proposal_id
 * @status  - 
 * @tags    - get, proposal, targeting
 */

export async function IXM_API_PROPOSAL_GET_SP_34(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let inactiveSection = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ], { status: 'D' });
    let proposal = await databasePopulator.createProposal(buyerCompany.user.userID, [ inactiveSection.section.sectionID ], {}, [ pubCompany.user.userID ]);

    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, publisher.user);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'][0], await Helper.proposalToPayload(proposal, buyerCompany.user));

}

/*
 * @case    - The publisher is targeted by proposal that has no active sites
 * @expect  - 200 - The publisher is able to see the proposal 
 * @route   - GET deals/proposals/:proposal_id
 * @status  - 
 * @tags    - get, proposal, targeting
 */

export async function IXM_API_PROPOSAL_GET_SP_35(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let site = await databasePopulator.createSite(pubCompany.user.userID, { status: 'D' });
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(buyerCompany.user.userID, [ section.section.sectionID ], {}, [ pubCompany.user.userID ]);

    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, publisher.user);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'][0], await Helper.proposalToPayload(proposal, buyerCompany.user));

}

/*
 * @case    - The buyer is targeted by proposal that has no active sites
 * @expect  - 200 - The buyer is able to see the proposal 
 * @route   - GET deals/proposals/:proposal_id
 * @status  - 
 * @tags    - get, proposal, targeting
 */

export async function IXM_API_PROPOSAL_GET_SP_36(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID, { status: 'D' });
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ], {}, [ buyerCompany.user.userID ]);

    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, buyer.user);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'][0], await Helper.proposalToPayload(proposal, pubCompany.user));

}

/*
 * @case    - The publisher is targeted by proposal that has some inactive sites
 * @expect  - 200 - The publisher is able to see the proposal 
 * @route   - GET deals/proposals/:proposal_id
 * @status  - 
 * @tags    - get, proposal, targeting
 */

export async function IXM_API_PROPOSAL_GET_SP_37(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let inactiveSite = await databasePopulator.createSite(pubCompany.user.userID, { status: 'D' });
    let activeSite = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ activeSite.siteID, inactiveSite.siteID ]);
    let proposal = await databasePopulator.createProposal(buyerCompany.user.userID, [ section.section.sectionID ], {}, [ pubCompany.user.userID ]);

    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, publisher.user);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'][0], await Helper.proposalToPayload(proposal, buyerCompany.user));

}

/*
 * @case    - The buyer is targeted by proposal that has some inactive sites
 * @expect  - 200 - The buyer is able to see the proposal 
 * @route   - GET deals/proposals/:proposal_id
 * @status  - 
 * @tags    - get, proposal, targeting
 */

export async function IXM_API_PROPOSAL_GET_SP_38(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let inactiveSite = await databasePopulator.createSite(pubCompany.user.userID, { status: 'D' });
    let activeSite = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ activeSite.siteID, inactiveSite.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ], {}, [ buyerCompany.user.userID ]);

    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, buyer.user);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'][0], await Helper.proposalToPayload(proposal, pubCompany.user));

}

/*
 * @case    - The buyer is targeted by proposal that has no valid sections
 * @expect  - 200 - The buyer is able to see the proposal 
 * @route   - GET deals/proposals/:proposal_id
 * @status  - 
 * @tags    - get, proposal, targeting
 */

export async function IXM_API_PROPOSAL_GET_SP_39(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let inactiveSection = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ], { status: 'D' });
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ inactiveSection.section.sectionID ], {}, [ buyerCompany.user.userID ]);

    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, buyer.user);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'][0], await Helper.proposalToPayload(proposal, pubCompany.user));

}
/*
 * @case    - The publisher is targeted by proposal that has some invalid sections
 * @expect  - 200 - The publisher is able to see the proposal 
 * @route   - GET deals/proposals/:proposal_id
 * @status  - 
 * @tags    - get, proposal, targeting
 */

export async function IXM_API_PROPOSAL_GET_SP_40(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let inactiveSection = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ], { status: 'D' });
    let proposal = await databasePopulator.createProposal(buyerCompany.user.userID, [ section.section.sectionID, inactiveSection.section.sectionID ],
                                                          {}, [ pubCompany.user.userID ]);

    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, publisher.user);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'][0], await Helper.proposalToPayload(proposal, buyerCompany.user));

}

/*
 * @case    - The buyer is targeted by proposal that has some invalid sections
 * @expect  - 200 - The buyer is able to see the proposal 
 * @route   - GET deals/proposals/:proposal_id
 * @status  - 
 * @tags    - get, proposal, targeting
 */

export async function IXM_API_PROPOSAL_GET_SP_41(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let inactiveSection = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ], { status: 'D' });
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID, inactiveSection.section.sectionID ],
                                                          {}, [ buyerCompany.user.userID ]);
    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, buyer.user);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'][0], await Helper.proposalToPayload(proposal, pubCompany.user));

}

/*
 * @case    - The publisher is targeted by proposal that is expired
 * @expect  - 200 - The publisher is able to see the proposal 
 * @route   - GET deals/proposals/:proposal_id
 * @status  - 
 * @tags    - get, proposal, targeting
 */
export async function IXM_API_PROPOSAL_GET_SP_42(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(buyerCompany.user.userID, [ section.section.sectionID ],
                                                          { endDate: new Date(currentDate.setDate(currentDate.getDate() - 5)) }, [ pubCompany.user.userID ]);

    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, publisher.user);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'][0], await Helper.proposalToPayload(proposal, buyerCompany.user));

}
/*
 * @case    - The buyer is targeted by proposal that is expired
 * @expect  - 200 - The buyer is able to see the proposal 
 * @route   - GET deals/proposals/:proposal_id
 * @status  - 
 * @tags    - get, proposal, targeting
 */

export async function IXM_API_PROPOSAL_GET_SP_43(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ],
                                                          { endDate: new Date(currentDate.setDate(currentDate.getDate() - 5)) }, [ buyerCompany.user.userID ]);

    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, buyer.user);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'][0], await Helper.proposalToPayload(proposal, pubCompany.user));

}

/*
 * @case    - The publisher is targeted by proposal that is deleted
 * @expect  - 404 - The publisher is not able to see the proposal 
 * @route   - GET deals/proposals/:proposal_id
 * @status  - 
 * @tags    - get, proposal, targeting
 */
export async function IXM_API_PROPOSAL_GET_SP_44(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(buyerCompany.user.userID, [ section.section.sectionID ],
                                                          { status: 'deleted' }, [ pubCompany.user.userID ]);

    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, publisher.user);

    assert.equals(response.status, 404);
    assert.deepEqual(response.body.data, []);

}
/*
 * @case    - The buyer is targeted by proposal that is deleted
 * @expect  - 404 - The buyer is not able to see the proposal 
 * @route   - GET deals/proposals/:proposal_id
 * @status  - 
 * @tags    - get, proposal, targeting
 */
export async function IXM_API_PROPOSAL_GET_SP_45(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ],
                                                          { status: 'deleted' }, [ buyerCompany.user.userID ]);

    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, buyer.user);

    assert.equals(response.status, 404);
    assert.deepEqual(response.body.data, []);

}

/*
 * @case    - ProposalID is deleted and user is NOT the owner and user started a negotiation on this proposal
 * @expect  - 200. proposal with limited properties should be returned
 * @route   - GET deals/proposals/:proposal_id
 * @status  - working
 * @tags    - get, proposal
 */
export async function IXM_API_PROPOSAL_GET_SP_46(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ], { status: 'deleted' });
    await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, buyerCompany.user.userID);

    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, buyer.user);

    assert.equals(response.status, 404);
    assert.deepEqual(response.body.data, []);

}

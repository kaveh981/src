'use strict';

import * as test from 'tape';

import { authenticationTest } from '../../../../common/auth.test';
import { validationTest } from '../../../../common/validation.test';
import { paginationTest } from '../../../../common/pagination.test';

import { Injector } from '../../../../../src/lib/injector';
import { APIRequestManager } from '../../../../../src/lib/request-manager';
import { DatabasePopulator } from '../../../../../src/lib/database-populator';
import { Helper } from '../../../../../src/lib/helper';

const databasePopulator = Injector.request<DatabasePopulator>('DatabasePopulator');
const apiRequest = Injector.request<APIRequestManager>('APIRequestManager');

/** Test constants */
const route = 'deals/proposals';
const currentDate: Date = new Date();

async function databaseSetup() {
    let dsp = await databasePopulator.createDSP(123);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);
    return { userID: publisher.user.userID, proposalID: proposal.proposal.proposalID };
}

/**
 * Create a proposal. Function should allow successive calls to create new proposals without problems.
 * @param proposal - The proposal object.
 * @param [publisher] - The publisher object that will own the proposal.
 * @returns The expected payload for that proposal (used by the test case for comparison with the database object).
 */
async function createProposal(publisher: INewPubData) {
    if (typeof publisher === 'undefined') {
        publisher = await databasePopulator.createPublisher();
    }
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);

    return Helper.proposalToPayload(proposal, publisher);
}

/*
 * @case    - The buyer attempts to authenticate.
 * @expect  - Authentication tests to pass.
 * @route   - GET deals/proposals/:proposal_id
 * @status  - working
 * @tags    - get, proposal, auth
 */
export let ATW_PA_GET_SP_AUTH = authenticationTest(route, 'get', databaseSetup);

/*
 * @case    - Common validation cases for proposalID.
 * @setup   - create dsp, create buyer, create publisher, create site, create section, create proposal and apply common validation method.
 * @expect  - Validations tests to pass.
 * @route   - GET deals/proposals/:proposal_id
 * @status  - working
 * @tags    - get, proposal, validation
 */
export let ATW_PA_GET_SP_VALIDATION = validationTest(
    route,
    'get',
    databaseSetup,
    {},
    {
        proposalID: {
            type: 'integer'
        }
    }
);

/*
 * @case    - The user is the owner of proposal
 * @setup   - create dsp, create buyer, create publisher, create site, create section, create proposal 
 * and set the owner and user both as publisher or both as buyer .
 * @expect  - 200.
 * @route   - GET deals/proposal/:proposal_id
 * @status  - working
 * @tags    - get, proposal
 */
export async function IXM_API_PROPOSAL_GET_SP_01(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.user.userID, [section.section.sectionID]);

    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, buyer.user.userID);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'][0], Helper.proposalToPayload(proposal, publisher));

}

/*
 * @case    - User is not the owner and has a different type from the owner (buyer/publisher)
 * @setup   - create dsp, create buyer, create publisher, create site, create section, create proposal
 *  and set publisher as the owner and buyer as the user
 * @expect  - 200.
 * @route   - GET deals/proposal/:proposal_id
 * @status  - working
 * @tags    - get, proposal
 */
export async function IXM_API_PROPOSAL_GET_SP_02(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.user.userID, [section.section.sectionID]);

    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, buyer.user.userID);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'][0], Helper.proposalToPayload(proposal, publisher));
}

/*
 * @case    - User is not the owner and has a the same type as the owner
 * @setup   - create dsp, create buyer, create publisher, create site, create section, create proposal 
 * and set publisher as the owner and the user.
 * @expect  - 200.
 * @route   - GET deals/proposal/:proposal_id
 * @status  - working
 * @tags    - get, proposal
 */
export async function IXM_API_PROPOSAL_GET_SP_03(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.user.userID, [section.section.sectionID]);

    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, publisher.user.userID);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'][0], Helper.proposalToPayload(proposal, publisher));
}

/*
 * @case    - when the owner is deactive
 * @setup   - create dsp, create buyer, create a deactive publisher, create site, create section, create proposal
 *  and set publisher as the owner.
 * @expect  - 403.
 * @route   - GET deals/proposal/:proposal_id
 * @status  - working
 * @tags    - get, proposal
 */
export async function IXM_API_PROPOSAL_GET_SP_04(assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher({ status: 'D' });
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.user.userID, [section.section.sectionID]);

    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, buyer.user.userID);

    assert.equals(response.status, 403);

}

/*
 * @case    - ProposalID is not provided
 * @setup   - create dsp, create buyer, create publisher, create site, create section, create proposal and do not pass the proposalID.
 * @expect  - 200.
 * @route   - GET deals/proposal/:proposal_id
 * @status  - working
 * @tags    - get, proposal
 */
export async function IXM_API_PROPOSAL_GET_SP_05(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);

    /** Test */
    let response = await apiRequest.get(route, {}, buyer.user.userID);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'][0], Helper.proposalToPayload(proposal, publisher));

}

/*
 * @case    - ProposalID is out of range
 * @setup   - create dsp, create buyer, create publisher, create site, create section, create proposal with a proposalID 16777215 + 1
 * @expect  - 404.
 * @route   - GET deals/proposal/:proposal_id
 * @status  - working
 * @tags    - get, proposal
 */
export async function IXM_API_PROPOSAL_GET_SP_06(assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID],
        { proposalID: 16777215 });

    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID + 1}`, {}, buyer.user.userID);

    assert.equals(response.status, 404);

}

/*
 * @case    - ProposalID is deleted and user is the owner
 * @setup   - create dsp, create buyer, create publisher, create site, create section, create proposal and set it's status to deleted and
 *  set publisher as the owner as well as the user. 
 * @expect  - 200.
 * @route   - GET deals/proposal/:proposal_id
 * @status  - working
 * @tags    - get, proposal
 */
export async function IXM_API_PROPOSAL_GET_SP_07(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID], { status: 'deleted' });

    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, publisher.user.userID);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'][0], Helper.proposalToPayload(proposal, publisher));

}

/*
 * @case    - ProposalID is deleted and user is NOT the owner
 * @setup   - create dsp, create buyer, create publisher, create site, create section, create proposal and set it's status to deleted and 
 * set publisher as the owner and buyer as the user. 
 * @expect  - 404.
 * @route   - GET deals/proposal/:proposal_id
 * @status  - working
 * @tags    - get, proposal
 */
export async function IXM_API_PROPOSAL_GET_SP_08(assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID], { status: 'deleted' });

    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, buyer.user.userID);

    assert.equals(response.status, 404);

}

/*
 * @case    - ProposalID is paused and user is the owner
 * @setup   - create dsp, create buyer, create publisher, create site, create section, create proposal and set it's status to paused and 
 * set publisher as the owner as well as the user. 
 * @expect  - 200.
 * @route   - GET deals/proposal/:proposal_id
 * @status  - working
 * @tags    - get, proposal
 */
export async function IXM_API_PROPOSAL_GET_SP_09(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID], { status: 'paused' });

    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, publisher.user.userID);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'][0], Helper.proposalToPayload(proposal, publisher));

}

/*
 * @case    - ProposalID is paused and user is NOT the owner
 * @setup   - create dsp, create buyer, create publisher, create site, create section, create proposal and set it's status to paused and
 *  set publisher as the owner and buyer as the user.  
 * @expect  - 403.
 * @route   - GET deals/proposal/:proposal_id
 * @status  - working
 * @tags    - get, proposal
 */
export async function IXM_API_PROPOSAL_GET_SP_10(assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID], { status: 'paused' });

    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, buyer.user.userID);

    assert.equals(response.status, 403);
}

/*
 * @case    - ProposalID end date is today and the owner is the user
 * @setup   - create dsp, create buyer, create publisher, create site, create section, create proposal and set it's endDate to today and
 *  set the owner as publisher as well as user.
 * @expect  - 200.
 * @route   - GET deals/proposal/:proposal_id
 * @status  - working
 * @tags    - get, proposal
 */
export async function IXM_API_PROPOSAL_GET_SP_11(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID],
        { endDate: currentDate });

    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, publisher.user.userID);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'][0], Helper.proposalToPayload(proposal, publisher));

}

/*
 * @case    - ProposalID end date is today and the owner is NOT the user
 * @setup   - create dsp, create buyer, create publisher, create site, create section, create proposal and set it's endDate to today and
 *  set the owner as publisher and the buyer as the user.
 * @expect  - 200.
 * @route   - GET deals/proposal/:proposal_id
 * @status  - working
 * @tags    - get, proposal
 */
export async function IXM_API_PROPOSAL_GET_SP_12(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID],
        { endDate: currentDate });

    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, publisher.user.userID);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'][0], Helper.proposalToPayload(proposal, publisher));

}

/*
 * @case    - ProposalID end date is earlier than today and the owner is the user
 * @setup   - create dsp, create buyer, create publisher, create site, create section, create proposal and set it's endDate to today - 5 and
 *  set the owner as publisher as well as user.
 * @expect  - 200.
 * @route   - GET deals/proposal/:proposal_id
 * @status  - working
 * @tags    - get, proposal
 */
export async function IXM_API_PROPOSAL_GET_SP_13(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID],
        { endDate: new Date(currentDate.setDate(currentDate.getDate() - 5)) });

    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, publisher.user.userID);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'][0], Helper.proposalToPayload(proposal, publisher));

}

/*
 * @case    - ProposalID end date is earlier than today and the owner is NOT the user
 * @setup   - create dsp, create buyer, create publisher, create site, create section, create proposal and set it's endDate to today - 5 
 * and set the owner as publisher and the buyer as the user.
 * @expect  - 403.
 * @route   - GET deals/proposal/:proposal_id
 * @status  - working
 * @tags    - get, proposal
 */
export async function IXM_API_PROPOSAL_GET_SP_14(assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID],
        { endDate: new Date(currentDate.setDate(currentDate.getDate() - 5)) });

    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, buyer.user.userID);

    assert.equals(response.status, 403);

}

/*
 * @case    - ProposalID start date is earlier than today and the owner is the user
 * @setup   - create dsp, create buyer, create publisher, create site, create section, create proposal and set it's startDate to today - 5 
 * and set the owner as publisher as well as user.
 * @expect  - 2000.
 * @route   - GET deals/proposal/:proposal_id
 * @status  - working
 * @tags    - get, proposal
 */
export async function IXM_API_PROPOSAL_GET_SP_15(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID],
        { startDate: new Date(currentDate.setDate(currentDate.getDate() - 5)) });

    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, publisher.user.userID);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'][0], Helper.proposalToPayload(proposal, publisher));

}

/*
 * @case    - ProposalID start date is earlier than today and the owner is NOT the user
 * @setup   - create dsp, create buyer, create publisher, create site, create section, create proposal and set it's startDate to today
 *  - 5 and set the owner as publisher and the buyer as the user.
 * @expect  - 200.
 * @route   - GET deals/proposal/:proposal_id
 * @status  - working
 * @tags    - get, proposal
 */
export async function IXM_API_PROPOSAL_GET_SP_16(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID],
        { startDate: new Date(currentDate.setDate(currentDate.getDate() - 5)) });

    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, buyer.user.userID);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'][0], Helper.proposalToPayload(proposal, publisher));

}

/*
 * @case    - ProposalID start date is later than today and the owner is the user
 * @setup   - create dsp, create buyer, create publisher, create site, create section, create proposal and set it's startDate to
 *  today + 5 and set the owner as publisher as well as user. 
 * @expect  - 200.
 * @route   - GET deals/proposal/:proposal_id
 * @status  - working
 * @tags    - get, proposal
 */
export async function IXM_API_PROPOSAL_GET_SP_17(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID],
        { startDate: new Date(currentDate.setDate(currentDate.getDate() + 5)) });

    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, publisher.user.userID);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'][0], Helper.proposalToPayload(proposal, publisher));

}

/*
 * @case    - ProposalID start date is later than today and the owner is NOT the user
 * @setup   - create dsp, create buyer, create publisher, create site, create section, create proposal and set it's startDate to today + 5
 *  and set the owner as publisher and the buyer as the user.
 * @expect  - 403.
 * @route   - GET deals/proposal/:proposal_id
 * @status  - working
 * @tags    - get, proposal
 */
export async function IXM_API_PROPOSAL_GET_SP_18(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID],
        { startDate: new Date(currentDate.setDate(currentDate.getDate() + 5)) });

    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, buyer.user.userID);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'][0], Helper.proposalToPayload(proposal, publisher));

}

/*
 * @case    - Some sections are no longer active and the owner is the user
 * @setup   - create dsp, create buyer, create publisher, create site, create section, create a deactive section, create proposal with
 *  active and deactive section set publisher as the owner as well as the user.
 * @expect  - 200.
 * @route   - GET deals/proposal/:proposal_id
 * @status  - working
 * @tags    - get, proposal
 */
export async function IXM_API_PROPOSAL_GET_SP_19(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section1 = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let section2 = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID], { status: 'D' });
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section1.section.sectionID,
    section2.section.sectionID]);

    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, publisher.user.userID);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'][0], Helper.proposalToPayload(proposal, publisher));

}

/*
 * @case    - Some sections are no longer active and the owner is NOT the user
 * @setup   - create dsp, create buyer, create publisher, create site, create section, create a deactive section, create proposal with
 *  active and deactive section set publisher as the owner and the buyer as the user.
 * @expect  - 200.
 * @route   - GET deals/proposal/:proposal_id
 * @status  - working
 * @tags    - get, proposal
 */
export async function IXM_API_PROPOSAL_GET_SP_20(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section1 = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let section2 = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID], { status: 'D' });
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section1.section.sectionID,
    section2.section.sectionID]);

    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, buyer.user.userID);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'][0], Helper.proposalToPayload(proposal, publisher));

}

/*
 * @case    - There is no active section and the owner is the user
 * @setup   - create dsp, create buyer, create publisher, create site, create a deactive section, create proposal with the deactive section
 *  set publisher as the owner as well as the user.
 * @expect  - 200.
 * @route   - GET deals/proposal/:proposal_id
 * @status  - working
 * @tags    - get, proposal
 */
export async function IXM_API_PROPOSAL_GET_SP_21(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID], { status: 'D' });
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);

    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, publisher.user.userID);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'][0], Helper.proposalToPayload(proposal, publisher));

}

/*
 * @case    - There is no active section and the owner is NOT the user
 * @setup   - create dsp, create buyer, create publisher, create site, create a deactive section, create proposal with the deactive
 *  section set publisher as the owner and the buyer as the user.
 * @expect  - 403.
 * @route   - GET deals/proposal/:proposal_id
 * @status  - working
 * @tags    - get, proposal
 */
export async function IXM_API_PROPOSAL_GET_SP_22(assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID], { status: 'D' });
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);

    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, buyer.user.userID);

    assert.equals(response.status, 403);

}

/*
 * @case    - Some sites are no longer active and the owner is the user
 * @setup   - create dsp, create buyer, create publisher, create site,create a deactive site , create section with active and deactive 
 * sites, create proposal and set the publisher as the owner as well as the user.
 * @expect  - 200.
 * @route   - GET deals/proposal/:proposal_id
 * @status  - working
 * @tags    - get, proposal
 */
export async function IXM_API_PROPOSAL_GET_SP_23(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site1 = await databasePopulator.createSite(publisher.publisher.userID);
    let site2 = await databasePopulator.createSite(publisher.publisher.userID, { status: 'D' });
    let section1 = await databasePopulator.createSection(publisher.publisher.userID, [site1.siteID]);
    let section2 = await databasePopulator.createSection(publisher.publisher.userID, [site2.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section1.section.sectionID,
    section2.section.sectionID]);

    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, publisher.user.userID);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'][0], Helper.proposalToPayload(proposal, publisher));

}

/*
 * @case    - Some sites are no longer active and the owner is NOT the user
 * @setup   - create dsp, create buyer, create publisher, create site,create a deactive site , create section with active and deactive
 *  sites, create proposal and set the publisher as the owner and the buyer as the user.
 * @expect  - 200.
 * @route   - GET deals/proposal/:proposal_id
 * @status  - working
 * @tags    - get, proposal
 */
export async function IXM_API_PROPOSAL_GET_SP_24(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site1 = await databasePopulator.createSite(publisher.publisher.userID);
    let site2 = await databasePopulator.createSite(publisher.publisher.userID, { status: 'D' });
    let section1 = await databasePopulator.createSection(publisher.publisher.userID, [site1.siteID]);
    let section2 = await databasePopulator.createSection(publisher.publisher.userID, [site2.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section1.section.sectionID,
    section2.section.sectionID]);

    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, buyer.user.userID);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'][0], Helper.proposalToPayload(proposal, publisher));

}

/*
 * @case    - There is no active site and the owner is the user
 * @setup   - create dsp, create buyer, create publisher, create a deactive site , create section with  deactive site, create proposal
 *  and set the publisher as the owner as well as the user.
 * @expect  - 200.
 * @route   - GET deals/proposal/:proposal_id
 * @status  - working
 * @tags    - get, proposal
 */
export async function IXM_API_PROPOSAL_GET_SP_25(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID, { status: 'D' });
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID],
        { startDate: new Date(currentDate.setDate(currentDate.getDate() + 5)) });

    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, publisher.user.userID);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'][0], Helper.proposalToPayload(proposal, publisher));

}

/*
 * @case    - There is no active site and the owner is NOT the user
 * @setup   - create dsp, create buyer, create publisher, create a deactive site , create section with  deactive site, create proposal
 *  and set the publisher as the owner and the buyer as the user.
 * @expect  - 403.
 * @route   - GET deals/proposal/:proposal_id
 * @status  - working
 * @tags    - get, proposal
 */
export async function IXM_API_PROPOSAL_GET_SP_26(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID, { status: 'D' });
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);

    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, buyer.user.userID);

    assert.equals(response.status, 403);

}

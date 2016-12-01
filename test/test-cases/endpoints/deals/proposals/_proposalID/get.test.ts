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

/**
 * Common database setup for authentication and proposalID validation
 */
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
 * Database setup for pagination tests
 * @return: data: the data required from database setup to create a proposal
 */
async function paginationSetup() {

    let dsp = await databasePopulator.createDSP(123);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);

    let data: ICreateEntityData = {
        publisher: publisher,
        section: section,
        sender: buyer.user
    };

    return data;

}

/**
 * Create a proposal. Function should allow successive calls to create new proposals without problems.
 * @param data: The data required from database setup to create a proposal
 * @returns The expected payload for that proposal (used by the test case for comparison with the database object).
 */
async function createProposal (data: ICreateEntityData) {

    let proposal = await databasePopulator.createProposal(data.publisher.publisher.userID, [data.section.section.sectionID]);

    return Helper.proposalToPayload(proposal, data.publisher.user);

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
 * @case    - The buyer attempts to authenticate.
 * @expect  - Authentication tests to pass.
 * @route   - GET deals/proposals/:proposal_id
 * @status  - working
 * @tags    - get, proposal, auth
 */
export let ATW_PA_GET_SP_PAG = paginationTest(route, 'get', paginationSetup, createProposal);

/*
 * @case    - Common validation cases for proposalID.
 * @setup   - create proposal and apply common validation method.
 * @expect  - Validations tests to pass.
 * @route   - GET deals/proposals/:proposal_id
 * @status  - failing
 * @tags    - get, proposal, validation
 */
export let ATW_PA_GET_SP_VALIDATION = validationTest(route, 'get', databaseSetup, {}, { proposalID: { type: 'integer' } });

/*
 * @case    - The user is the owner of proposal
 * @setup   - create publisher, create site, create section, create proposal 
 * and set the owner and user both as publisher or both as buyer .
 * @expect  - 200.
 * @route   - GET deals/proposals/:proposal_id
 * @status  - working
 * @tags    - get, proposal
 */
export async function IXM_API_PROPOSAL_GET_SP_01(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.user.userID, [section.section.sectionID]);

    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, publisher.user.userID);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'][0], Helper.proposalToPayload(proposal, publisher.user));

}

/*
 * @case    - User is not the owner and has a different type from the owner (buyer/publisher)
 * @setup   - create dsp, create buyer, create publisher, create site, create section, create proposal
 *  and set publisher as the owner and buyer as the user
 * @expect  - 200.
 * @route   - GET deals/proposals/:proposal_id
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
    assert.deepEqual(response.body['data'][0], Helper.proposalToPayload(proposal, publisher.user));
}

/*
 * @case    - User is not the owner and has the same type as the owner
 * @setup   - create publisher, create site, create section, create proposal 
 * and set publisher as the owner and the user.
 * @expect  - 200.
 * @route   - GET deals/proposals/:proposal_id
 * @status  - working
 * @tags    - get, proposal
 */
export async function IXM_API_PROPOSAL_GET_SP_03(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let publisher = await databasePopulator.createPublisher();
    let publisher2 = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.user.userID, [section.section.sectionID]);

    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, publisher2.user.userID);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'][0], Helper.proposalToPayload(proposal, publisher.user));
}

/*
 * @case    - when the owner is inactive
 * @setup   - create dsp, create buyer, create a deactive publisher, create site, create section, create proposal
 *  and set publisher as the owner.
 * @expect  - 404 - owner is inactive -> proposal is inactive -> proposal is not readable -> proposal not found
 * @route   - GET deals/proposals/:proposal_id
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

    assert.equals(response.status, 404);

}

/*
 * @case    - ProposalID is not provided
 * @setup   - create dsp, create buyer, create publisher, create site, create section, create proposal and do not pass the proposalID.
 * @expect  - 200.
 * @route   - GET deals/proposals/:proposal_id
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
    assert.deepEqual(response.body['data'][0], Helper.proposalToPayload(proposal, publisher.user));

}

/*
 * @case    - ProposalID is out of range
 * @setup   - create dsp, create buyer, create publisher, create site, create section, create proposal with a proposalID 16777215 + 1
 * @expect  - 400 - Malformed Request
 * @route   - GET deals/proposals/:proposal_id
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

    assert.equals(response.status, 400);

}

/*
 * @case    - ProposalID is deleted and user is the owner
 * @setup   - create publisher, create site, create section, create proposal and set it's status to deleted and
 *  set publisher as the owner as well as the user. 
 * @expect  - 404 - Proposal not found - does not exist to user because it is deleted
 * @route   - GET deals/proposals/:proposal_id
 * @status  - working
 * @tags    - get, proposal
 */
export async function IXM_API_PROPOSAL_GET_SP_07(assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID], { status: 'deleted' });

    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, publisher.user.userID);

    assert.equals(response.status, 404);

}

/*
 * @case    - ProposalID is deleted and user is NOT the owner
 * @setup   - create dsp, create buyer, create publisher, create site, create section, create proposal and set it's status to deleted and 
 * set publisher as the owner and buyer as the user. 
 * @expect  - 404.
 * @route   - GET deals/proposals/:proposal_id
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
 * @setup   - create publisher, create site, create section, create proposal and set it's status to paused and 
 * set publisher as the owner as well as the user. 
 * @expect  - 200.
 * @route   - GET deals/proposals/:proposal_id
 * @status  - working
 * @tags    - get, proposal
 */
export async function IXM_API_PROPOSAL_GET_SP_09(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID], { status: 'paused' });

    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, publisher.user.userID);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'][0], Helper.proposalToPayload(proposal, publisher.user));

}

/*
 * @case    - ProposalID is paused and user is NOT the owner
 * @setup   - create dsp, create buyer, create publisher, create site, create section, create proposal and set it's status to paused and
 *  set publisher as the owner and buyer as the user.  
 * @expect  - 404 - Not found. Is not active, so does not exist to user 
 * @route   - GET deals/proposals/:proposal_id
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

    assert.equals(response.status, 404);
}

/*
 * @case    - ProposalID end date is today and the owner is the user
 * @setup   - create publisher, create site, create section, create proposal and set it's endDate to today and
 *  set the owner as publisher as well as user.
 * @expect  - 200.
 * @route   - GET deals/proposals/:proposal_id
 * @status  - working
 * @tags    - get, proposal
 */
export async function IXM_API_PROPOSAL_GET_SP_11(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID],
        { endDate: currentDate });

    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, publisher.user.userID);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'][0], Helper.proposalToPayload(proposal, publisher.user));

}

/*
 * @case    - ProposalID end date is today and the owner is NOT the user
 * @setup   - create dsp, create buyer, create publisher, create site, create section, create proposal and set it's endDate to today and
 *  set the owner as publisher and the buyer as the user.
 * @expect  - 200.
 * @route   - GET deals/proposals/:proposal_id
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
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, buyer.user.userID);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'][0], Helper.proposalToPayload(proposal, publisher.user));

}

/*
 * @case    - ProposalID end date is earlier than today and the owner is the user
 * @setup   - create publisher, create site, create section, create proposal and set it's endDate to today - 5 and
 *  set the owner as publisher as well as user.
 * @expect  - 200.
 * @route   - GET deals/proposals/:proposal_id
 * @status  - working
 * @tags    - get, proposal
 */
export async function IXM_API_PROPOSAL_GET_SP_13(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID],
        { endDate: new Date(currentDate.setDate(currentDate.getDate() - 5)) });

    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, publisher.user.userID);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'][0], Helper.proposalToPayload(proposal, publisher.user));

}

/*
 * @case    - ProposalID end date is earlier than today and the owner is NOT the user
 * @setup   - create dsp, create buyer, create publisher, create site, create section, create proposal and set it's endDate to today - 5 
 * and set the owner as publisher and the buyer as the user.
 * @expect  - 404 - Proposal not found. Proposal does not exist to user (is not readable)
 * @route   - GET deals/proposals/:proposal_id
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

    assert.equals(response.status, 404);

}

/*
 * @case    - ProposalID start date is earlier than today and the owner is the user
 * @setup   - create publisher, create site, create section, create proposal and set it's startDate to today - 5 
 * and set the owner as publisher as well as user.
 * @expect  - 2000.
 * @route   - GET deals/proposals/:proposal_id
 * @status  - working
 * @tags    - get, proposal
 */
export async function IXM_API_PROPOSAL_GET_SP_15(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID],
        { startDate: new Date(currentDate.setDate(currentDate.getDate() - 5)) });

    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, publisher.user.userID);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'][0], Helper.proposalToPayload(proposal, publisher.user));

}

/*
 * @case    - ProposalID start date is earlier than today and the owner is NOT the user
 * @setup   - create dsp, create buyer, create publisher, create site, create section, create proposal and set it's startDate to today
 *  - 5 and set the owner as publisher and the buyer as the user.
 * @expect  - 200.
 * @route   - GET deals/proposals/:proposal_id
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
    assert.deepEqual(response.body['data'][0], Helper.proposalToPayload(proposal, publisher.user));

}

/*
 * @case    - ProposalID start date is later than today and the owner is the user
 * @setup   - create publisher, create site, create section, create proposal and set it's startDate to
 *  today + 5 and set the owner as publisher as well as user. 
 * @expect  - 200.
 * @route   - GET deals/proposals/:proposal_id
 * @status  - working
 * @tags    - get, proposal
 */
export async function IXM_API_PROPOSAL_GET_SP_17(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID],
        { startDate: new Date(currentDate.setDate(currentDate.getDate() + 5)) });

    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, publisher.user.userID);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'][0], Helper.proposalToPayload(proposal, publisher.user));

}

/*
 * @case    - ProposalID start date is later than today and the owner is NOT the user
 * @setup   - create dsp, create buyer, create publisher, create site, create section, create proposal and set it's startDate to today + 5
 *  and set the owner as publisher and the buyer as the user.
 * @expect  - 403.
 * @route   - GET deals/proposals/:proposal_id
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
    assert.deepEqual(response.body['data'][0], Helper.proposalToPayload(proposal, publisher.user));

}

/*
 * @case    - Some sections are no longer active and the owner is the user
 * @setup   - create publisher, create site, create section, create a deactive section, create proposal with
 *  active and deactive section set publisher as the owner as well as the user.
 * @expect  - 200.
 * @route   - GET deals/proposals/:proposal_id
 * @status  - working
 * @tags    - get, proposal
 */
export async function IXM_API_PROPOSAL_GET_SP_19(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section1 = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let section2 = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID], { status: 'D' });
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section1.section.sectionID,
    section2.section.sectionID]);
    let expectedProposal: INewProposalData = proposal;
    expectedProposal.sectionIDs = [section1.section.sectionID];
    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, publisher.user.userID);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'][0], Helper.proposalToPayload(expectedProposal, publisher.user));

}

/*
 * @case    - Some sections are no longer active and the owner is NOT the user
 * @setup   - create dsp, create buyer, create publisher, create site, create section, create a deactive section, create proposal with
 *  active and deactive section set publisher as the owner and the buyer as the user.
 * @expect  - 200.
 * @route   - GET deals/proposals/:proposal_id
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
    let expectedProposal: INewProposalData = proposal;
    expectedProposal.sectionIDs = [section1.section.sectionID];
    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, buyer.user.userID);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'][0], Helper.proposalToPayload(expectedProposal, publisher.user));

}

/*
 * @case    - There is no active section and the owner is the user
 * @setup   - create publisher, create site, create a deactive section, create proposal with the deactive section
 *  set publisher as the owner as well as the user.
 * @expect  - 200.
 * @route   - GET deals/proposals/:proposal_id
 * @status  - working
 * @tags    - get, proposal
 */
export async function IXM_API_PROPOSAL_GET_SP_21(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID], { status: 'D' });
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);
    let expectedProposal: INewProposalData = proposal;
    expectedProposal.sectionIDs = [];
    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, publisher.user.userID);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'][0], Helper.proposalToPayload(expectedProposal, publisher.user));

}

/*
 * @case    - There is no active section and the owner is NOT the user
 * @setup   - create dsp, create buyer, create publisher, create site, create a deactive section, create proposal with the deactive
 *  section set publisher as the owner and the buyer as the user.
 * @expect  - 404 - Proposal not found. Is not readable, does not exist to user
 * @route   - GET deals/proposals/:proposal_id
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

    assert.equals(response.status, 404);

}

/*
 * @case    - Some sites are no longer active and the owner is the user
 * @setup   - create publisher, create site,create a deactive site , create section with active and deactive 
 * sites, create proposal and set the publisher as the owner as well as the user.
 * @expect  - 200.
 * @route   - GET deals/proposals/:proposal_id
 * @status  - working
 * @tags    - get, proposal
 */
export async function IXM_API_PROPOSAL_GET_SP_23(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let publisher = await databasePopulator.createPublisher();
    let site1 = await databasePopulator.createSite(publisher.publisher.userID);
    let site2 = await databasePopulator.createSite(publisher.publisher.userID, { status: 'D' });
    let section1 = await databasePopulator.createSection(publisher.publisher.userID, [site1.siteID]);
    let section2 = await databasePopulator.createSection(publisher.publisher.userID, [site2.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section1.section.sectionID,
    section2.section.sectionID]);
    let expectedProposal: INewProposalData = proposal;
    expectedProposal.sectionIDs = [section1.section.sectionID];
    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, publisher.user.userID);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'][0], Helper.proposalToPayload(expectedProposal, publisher.user));

}

/*
 * @case    - Some sites are no longer active and the owner is NOT the user
 * @setup   - create dsp, create buyer, create publisher, create site,create a deactive site , create section with active and deactive
 *  sites, create proposal and set the publisher as the owner and the buyer as the user.
 * @expect  - 200.
 * @route   - GET deals/proposals/:proposal_id
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
    let expectedProposal: INewProposalData = proposal;
    expectedProposal.sectionIDs = [section1.section.sectionID];
    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, buyer.user.userID);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'][0], Helper.proposalToPayload(expectedProposal, publisher.user));

}

/*
 * @case    - There is no active site and the owner is the user
 * @setup   - create publisher, create a deactive site , create section with  deactive site, create proposal
 *  and set the publisher as the owner as well as the user.
 * @expect  - 200.
 * @route   - GET deals/proposals/:proposal_id
 * @status  - working
 * @tags    - get, proposal
 */
export async function IXM_API_PROPOSAL_GET_SP_25(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID, { status: 'D' });
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);
    let expectedProposal: INewProposalData = proposal;
    expectedProposal.sectionIDs = [];
    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, publisher.user.userID);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'][0], Helper.proposalToPayload(expectedProposal, publisher.user));

}

/*
 * @case    - There is no active site and the owner is NOT the user
 * @setup   - create dsp, create buyer, create publisher, create a deactive site , create section with  deactive site, create proposal
 *  and set the publisher as the owner and the buyer as the user.
 * @expect  - 404 - Proposal not found. Is not readable by user. It does not exist to current user. 
 * @route   - GET deals/proposals/:proposal_id
 * @status  - working
 * @tags    - get, proposal
 */
export async function IXM_API_PROPOSAL_GET_SP_26(assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID, { status: 'D' });
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);

    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, buyer.user.userID);

    assert.equals(response.status, 404);

}

/*
 * @case    - There is no proposal available
 * @setup   - create dsp, create buyer, create publisher, create site , create section
 *  and send a proposalID that does not exist.
 * @expect  - 404.
 * @route   - GET deals/proposals/:proposal_id
 * @status  - working
 * @tags    - get, proposal
 */
export async function IXM_API_PROPOSAL_GET_SP_27(assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();

    /** Test */
    let response = await apiRequest.get(route + `/${5}`, {}, publisher.user.userID);

    assert.equals(response.status, 404);

}

/*
 * @case    - The current buyer is not targeted by proposal but another buyer is  
 * @setup   - create dsp, create buyer, create publisher, create site , create section
 *  create proposal, create user targeting
 * @expect  - 404 - The buyer is not able to see the proposal 
 * @route   - GET deals/proposals/:proposal_id
 * @status  - working
 * @tags    - get, proposal, targeting
 */
export async function IXM_API_PROPOSAL_GET_SPT_28(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer1 = await databasePopulator.createBuyer(dsp.dspID);
    let buyer2 = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);

    await databasePopulator.targetProposalToUser(proposal.proposal.proposalID, buyer2.user.userID);

    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, buyer1.user.userID);

    assert.equals(response.status, 404);
    assert.deepEqual(response.body.data, []);

}

/*
 * @case    - The current publisher is not targeted by proposal but another publisher is  
 * @setup   - create dsp, create buyer, create publisher, create site , create section
 *  and send a proposalID that does not exist.
 * @expect  - 404 - The publisher is not able to see the proposal 
 * @route   - GET deals/proposals/:proposal_id
 * @status  - working
 * @tags    - get, proposal, targeting
 */
export async function IXM_API_PROPOSAL_GET_SPT_29(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher1 = await databasePopulator.createPublisher();
    let publisher2 = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher2.publisher.userID);
    let section = await databasePopulator.createSection(publisher2.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(buyer.user.userID, [section.section.sectionID]);

    await databasePopulator.targetProposalToUser(proposal.proposal.proposalID, publisher2.user.userID);

    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, publisher1.user.userID);

    assert.equals(response.status, 404);
    assert.deepEqual(response.body.data, []);
}

/*
 * @case    - The buyer is targeted by proposal
 * @setup   - create dsp, create buyer, create publisher, create site , create section
 *  create proposal, create user targeting
 * @expect  - 200 - The buyer is able to see the proposal 
 * @route   - GET deals/proposals/:proposal_id
 * @status  - working
 * @tags    - get, proposal, targeting
 */
export async function IXM_API_PROPOSAL_GET_SPT_30(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.user.userID, [section.section.sectionID]);

    await databasePopulator.targetProposalToUser(proposal.proposal.proposalID, buyer.user.userID);

    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, buyer.user.userID);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body.data, [Helper.proposalToPayload(proposal, publisher.user)]);

}

/*
 * @case    - The publisher is targeted by proposal
 * @setup   - create dsp, create buyer, create publisher, create site , create section
 *  create proposal, create user targeting
 * @expect  - 200 - The buyer is able to see the proposal 
 * @route   - GET deals/proposals/:proposal_id
 * @status  - working
 * @tags    - get, proposal, targeting
 */
export async function IXM_API_PROPOSAL_GET_SPT_31(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(buyer.user.userID, [section.section.sectionID]);

    await databasePopulator.targetProposalToUser(proposal.proposal.proposalID, publisher.user.userID);

    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, publisher.user.userID);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body.data, [Helper.proposalToPayload(proposal, buyer.user)]);
}

/*
 * @case    - ProposalID is deleted and user is NOT the owner and user started a negotiation on this proposal
 * @setup   - create dsp, create buyer, create publisher, create site, create section, create proposal and set it's status to deleted and 
 * set publisher as the owner and buyer as the user the create a negotiation
 * @expect  - 200. proposal with limited properties should be returned
 * @route   - GET deals/proposals/:proposal_id
 * @status  - working
 * @tags    - get, proposal
 */
export async function IXM_API_PROPOSAL_GET_SP_32(assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID], { status: 'deleted' });
    let dealNegotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID,
        publisher.user.userID, buyer.user.userID);

    /** Test */
    let response = await apiRequest.get(route + `/${proposal.proposal.proposalID}`, {}, buyer.user.userID);

    assert.equals(response.status, 404);

}

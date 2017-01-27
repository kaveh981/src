'use strict';

import * as test from 'tape';

import { authenticationTest } from '../../../common/auth.test';

import { Injector } from '../../../../src/lib/injector';
import { APIRequestManager } from '../../../../src/lib/request-manager';
import { DatabasePopulator } from '../../../../src/lib/database-populator';
import { DatabaseManager } from '../../../../src/lib/database-manager';
import { Helper } from '../../../../src/lib/helper';

const databasePopulator = Injector.request<DatabasePopulator>('DatabasePopulator');
const apiRequest = Injector.request<APIRequestManager>('APIRequestManager');
const databaseManager = Injector.request<DatabaseManager>('DatabaseManager');

/** Test constants */
const route = 'deals/negotiations';
const DSP_ID = 1;
const ANOTHER_DSP_ID = 2;

async function commonDatabaseSetup() {
    let dsp = await databasePopulator.createDSP(123);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);
}

/**
 * Fetch a negotiation filed from database
 */
async function getNegotiatedFieldInDB(proposal: IProposal, partnerID: number, field: string): Promise<any> {
    let row = await databaseManager.select(`ixmNegotiations.${field}`)
                .from('ixmNegotiations')
                .join('ixmProposals', 'ixmProposals.proposalID', 'ixmNegotiations.proposalID')
                .where('ixmNegotiations.proposalID', proposal.proposalID)
                .andWhere('partnerID', partnerID)
                .andWhere('ownerID', proposal.ownerID);
    return row[0][field];
}

/**
 * Fetch owner status from database
 */
async function getOwnerStatus(proposal: IProposal, partnerID: number): Promise<string> {
    return await getNegotiatedFieldInDB(proposal, partnerID, 'ownerStatus');
}

/**
 * Fetch partner status from database
 */
async function getPartnerStatus(proposal: IProposal, partnerID: number): Promise<string> {
    return await getNegotiatedFieldInDB(proposal, partnerID, 'partnerStatus');
}

/**
 * Get section mappings from database
 */
async function getSectionMappings(proposalID: number, partnerID: number) {
    let row = await databaseManager.select('sectionID')
                                   .from('ixmNegotiationSectionMappings')
                                   .join('ixmDealNegotiations', 'ixmNegotiationSectionMappings.negotiationID', '=', 'ixmDealNegotiations.negotiationID')
                                   .where('proposalID', proposalID)
                                   .andWhere('partnerID', partnerID);
    return row.map((section) => { return section.sectionID; });
}

/** Generic Authentication Tests */
export let ATW_CO_PUT_AUTH = authenticationTest(route, 'put', commonDatabaseSetup);

/**
 * @case    - The user does not provide any negotiation fields or a response.
 * @expect  - The API responds with 400.
 * @label   - ATW_API_PUT_DEANEG_FUNC_01
 * @route   - PUT deals/negotiations
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_PUT_DEANEG_FUNC_01 (assert: test.Test) {

   /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');

    let negotiation = {
        proposal_id: 123,
        partner_id: 123
    };

   /** Test */
    let responseNoOptional = await apiRequest.put(route, negotiation, buyer.user);

    assert.equal(responseNoOptional.status, 400);
}

/**
 * @case    - The user supplies a negotiation field along with the response field.
 * @expect  - The API responds with 400.
 * @label   - ATW_API_PUT_DEANEG_FUNC_02
 * @route   - PUT deals/negotiations
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_PUT_DEANEG_FUNC_02 (assert: test.Test) {

   /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');

    let negotiation = {
        proposal_id: 123,
        partner_id: 123,
        price: 123,
        response: 'accept'
    };

   /** Test */
    let responseInvalidCombination = await apiRequest.put(route, negotiation, buyer.user);

    assert.equal(responseInvalidCombination.status, 400);
}

/**
 * @case    - The user does not supply a proposalID.
 * @expect  - The API responds with 400.
 * @label   - ATW_API_PUT_DEANEG_FUNC_01
 * @route   - PUT deals/negotiations
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_PUT_DEANEG_FUNC_03 (assert: test.Test) {

   /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');

    let negotiation = {
        partner_id: 123,
        start_date: '2016-10-21',
        end_date: '2017-10-01',
        price: 123,
        impressions: 123,
        budget: 123,
        terms: 'I want goose'
    };

   /** Test */
    let responseNoOptional = await apiRequest.put(route, negotiation, buyer.user);

    assert.equal(responseNoOptional.status, 400);
}

/**
 * @case    - The user supplies invalid and valid proposalIDs.
 * @expect  - The API responds with 400s for invalid and not with 400s for valid proposalIDs.
 * @label   - ATW_API_COMMON_PROPOSALID
 * @route   - PUT deals/negotiations
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_PUT_DEANEG_FUNC_04 (assert: test.Test) {

   /** Setup */
    assert.plan(8);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');

    let negotiation = {
        partner_id: 123,
        start_date: '2016-10-21',
        end_date: '2017-10-01',
        price: 123,
        impressions: 123,
        budget: 123,
        terms: 'I want goose'
    };

   /** Test */
    Object.assign(negotiation, { proposal_id: 'goose' });
    let responseNonInt = await apiRequest.put(route, negotiation, buyer.user);

    Object.assign(negotiation, { proposal_id: 0 });
    let responseMinLess = await apiRequest.put(route, negotiation, buyer.user);

    Object.assign(negotiation, { proposal_id: 16777216 });
    let responseMaxMore = await apiRequest.put(route, negotiation, buyer.user);

    Object.assign(negotiation, { proposal_id: '123' });
    let responseStringInt = await apiRequest.put(route, negotiation, buyer.user);

    assert.equal(responseNonInt.status, 400);
    assert.equal(responseMinLess.status, 400);
    assert.equal(responseMaxMore.status, 400);
    assert.equal(responseStringInt.status, 400);

    Object.assign(negotiation, { proposal_id: 1 });
    let responseMin = await apiRequest.put(route, negotiation, buyer.user);

    Object.assign(negotiation, { proposal_id: 16777215 });
    let responseMax = await apiRequest.put(route, negotiation, buyer.user);

    assert.notEqual(responseMin.status, 400);
    assert.notEqual(responseMin.status, 500);
    assert.notEqual(responseMax.status, 400);
    assert.notEqual(responseMax.status, 500);
}

/**
 * @case    - The user supplies invalid and valid partnerIDs.
 * @expect  - The API responds with 400s for invalid and not with 400s for valid partnerIDs.
 * @label   - ATW_API_PUT_DEANEG_FUNC
 * @route   - PUT deals/negotiations
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_PUT_DEANEG_FUNC_05 (assert: test.Test) {

   /** Setup */
    assert.plan(8);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');

    let negotiation = {
        proposal_id: 123,
        start_date: '2016-10-21',
        end_date: '2017-10-01',
        price: 123,
        impressions: 123,
        budget: 123,
        terms: 'I want goose'
    };

   /** Test */
    Object.assign(negotiation, { partner_id: 'goose' });
    let responseNonInt = await apiRequest.put(route, negotiation, buyer.user);

    Object.assign(negotiation, { partner_id: 0 });
    let responseMinLess = await apiRequest.put(route, negotiation, buyer.user);

    Object.assign(negotiation, { partner_id: 16777216 });
    let responseMaxMore = await apiRequest.put(route, negotiation, buyer.user);

    Object.assign(negotiation, { partner_id: '123' });
    let responseStringInt = await apiRequest.put(route, negotiation, buyer.user);

    assert.equal(responseNonInt.status, 400);
    assert.equal(responseMinLess.status, 400);
    assert.equal(responseMaxMore.status, 400);
    assert.equal(responseStringInt.status, 400);

    Object.assign(negotiation, { partner_id: 1 });
    let responseMin = await apiRequest.put(route, negotiation, buyer.user);

    Object.assign(negotiation, { partner_id: 16777215 });
    let responseMax = await apiRequest.put(route, negotiation, buyer.user);

    assert.notEqual(responseMin.status, 400);
    assert.notEqual(responseMin.status, 500);
    assert.notEqual(responseMax.status, 400);
    assert.notEqual(responseMax.status, 500);
}

/**
 * @case    - The user supplies invalid and valid prices.
 * @expect  - The API responds with 400s for invalid and not with 400/500 for valid prices.
 * @label   - ATW_API_PUT_DEANEG_FUNC
 * @route   - PUT deals/negotiations
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_PUT_DEANEG_FUNC_06 (assert: test.Test) {

   /** Setup */
    assert.plan(10);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');

    let negotiation = {
        proposal_id: 123,
        partner_id: 123,
        start_date: '2016-10-21',
        end_date: '2017-10-01',
        impressions: 123,
        budget: 123,
        terms: 'I want goose'
    };

   /** Test */
    Object.assign(negotiation, { price: 'goose' });
    let responseNonInt = await apiRequest.put(route, negotiation, buyer.user);

    Object.assign(negotiation, { price: 0 });
    let responseMinLess = await apiRequest.put(route, negotiation, buyer.user);

    Object.assign(negotiation, { price: 655.36 });
    let responseMaxMore = await apiRequest.put(route, negotiation, buyer.user);

    Object.assign(negotiation, { price: '123' });
    let responseStringInt = await apiRequest.put(route, negotiation, buyer.user);

    assert.equal(responseNonInt.status, 400);
    assert.equal(responseMinLess.status, 400);
    assert.equal(responseMaxMore.status, 400);
    assert.equal(responseStringInt.status, 400);

    Object.assign(negotiation, { price: 0.01 });
    let responseMin = await apiRequest.put(route, negotiation, buyer.user);

    Object.assign(negotiation, { price: 655.35 });
    let responseMax = await apiRequest.put(route, negotiation, buyer.user);

    assert.notEqual(responseMin.status, 400);
    assert.notEqual(responseMin.status, 500);
    assert.notEqual(responseMax.status, 400);
    assert.notEqual(responseMax.status, 500);

    let optionalNegotiation = {
        proposal_id: 123,
        partner_id: 123,
        price: 123
    };

    let responseOptional = await apiRequest.put(route, optionalNegotiation, buyer.user);

    assert.notEqual(responseOptional.status, 400);
    assert.notEqual(responseOptional.status, 500);
}

/**
 * @case    - The user supplies invalid and valid impressions.
 * @expect  - The API responds with 400s for invalid and not with 400s for valid impressions.
 * @label   - ATW_API_NEGOTIATION_IMPRESSIONS
 * @route   - PUT deals/negotiations
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_PUT_DEANEG_FUNC_07 (assert: test.Test) {

   /** Setup */
    assert.plan(10);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');

    let negotiation = {
        proposal_id: 123,
        partner_id: 123,
        start_date: '2016-10-21',
        end_date: '2017-10-01',
        price: 123,
        budget: 123,
        terms: 'I want goose'
    };

   /** Test */
    Object.assign(negotiation, { impressions: 'goose' });
    let responseNonInt = await apiRequest.put(route, negotiation, buyer.user);

    Object.assign(negotiation, { impressions: 0 });
    let responseMinLess = await apiRequest.put(route, negotiation, buyer.user);

    Object.assign(negotiation, { impressions: 16777216 });
    let responseMaxMore = await apiRequest.put(route, negotiation, buyer.user);

    Object.assign(negotiation, { impressions: '123' });
    let responseStringInt = await apiRequest.put(route, negotiation, buyer.user);

    assert.equal(responseNonInt.status, 400);
    assert.equal(responseMinLess.status, 400);
    assert.equal(responseMaxMore.status, 400);
    assert.equal(responseStringInt.status, 400);

    Object.assign(negotiation, { impressions: 1 });
    let responseMin = await apiRequest.put(route, negotiation, buyer.user);
    Object.assign(negotiation, { impressions: 16777215 });
    let responseMax = await apiRequest.put(route, negotiation, buyer.user);

    assert.notEqual(responseMin.status, 400);
    assert.notEqual(responseMin.status, 500);
    assert.notEqual(responseMax.status, 400);
    assert.notEqual(responseMax.status, 500);

    let optionalNegotiation = {
        proposal_id: 123,
        partner_id: 123,
        impressions: 123
    };

    let responseOptional = await apiRequest.put(route, optionalNegotiation, buyer.user);

    assert.notEqual(responseOptional.status, 400);
    assert.notEqual(responseOptional.status, 500);
}

/**
 * @case    - The user supplies invalid and valid budgets.
 * @expect  - The API responds with 400s for invalid and not with 400s for valid budgets.
 * @label   - ATW_API_NEGOTIATION_BUDGET
 * @route   - PUT deals/negotiations
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_PUT_DEANEG_FUNC_08 (assert: test.Test) {

   /** Setup */
    assert.plan(10);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');

    let negotiation = {
        proposal_id: 123,
        partner_id: 123,
        start_date: '2016-10-21',
        end_date: '2017-10-01',
        price: 123,
        impressions: 123,
        terms: 'I want goose'
    };

   /** Test */
    Object.assign(negotiation, { budget: 'goose' });
    let responseNonInt = await apiRequest.put(route, negotiation, buyer.user);

    Object.assign(negotiation, { budget: 0 });
    let responseMinLess = await apiRequest.put(route, negotiation, buyer.user);

    Object.assign(negotiation, { budget: 16777216 });
    let responseMaxMore = await apiRequest.put(route, negotiation, buyer.user);

    Object.assign(negotiation, { budget: '123' });
    let responseStringInt = await apiRequest.put(route, negotiation, buyer.user);

    assert.equal(responseNonInt.status, 400);
    assert.equal(responseMinLess.status, 400);
    assert.equal(responseMaxMore.status, 400);
    assert.equal(responseStringInt.status, 400);

    Object.assign(negotiation, { budget: 1 });
    let responseMin = await apiRequest.put(route, negotiation, buyer.user);
    Object.assign(negotiation, { budget: 16777215 });
    let responseMax = await apiRequest.put(route, negotiation, buyer.user);

    assert.notEqual(responseMin.status, 400);
    assert.notEqual(responseMin.status, 500);
    assert.notEqual(responseMax.status, 400);
    assert.notEqual(responseMax.status, 500);

    let optionalNegotiation = {
        proposal_id: 123,
        partner_id: 123,
        budget: 123
    };

    let responseOptional = await apiRequest.put(route, optionalNegotiation, buyer.user);

    assert.notEqual(responseOptional.status, 400);
    assert.notEqual(responseOptional.status, 500);
}

/**
 * @case    - The user supplies invalid and valid terms.
 * @expect  - The API responds with 400s for invalid and not with 400s for valid terms.
 * @label   - ATW_API_NEGOTIATION_TERMS
 * @route   - PUT deals/negotiations
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_PUT_DEANEG_FUNC_09 (assert: test.Test) {

   /** Setup */
    assert.plan(9);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');

    let negotiation = {
        proposal_id: 123,
        partner_id: 123,
        start_date: '2016-10-21',
        end_date: '2017-10-01',
        price: 123,
        impressions: 123,
        budget: 123
    };

   /** Test */
    Object.assign(negotiation, { terms: 123 });
    let responseNonString = await apiRequest.put(route, negotiation, buyer.user);

    Object.assign(negotiation, { terms: ('a'.repeat(65536)) });
    let responseMaxMore = await apiRequest.put(route, negotiation, buyer.user);

    Object.assign(negotiation, { terms: '' });
    let responseEmptyString = await apiRequest.put(route, negotiation, buyer.user);

    assert.equal(responseNonString.status, 400);
    assert.equal(responseMaxMore.status, 400);
    assert.equal(responseEmptyString.status, 400);

    Object.assign(negotiation, { terms: 'K' });
    let responseMin = await apiRequest.put(route, negotiation, buyer.user);

    Object.assign(negotiation, { terms: ('a'.repeat(65535)) });
    let responseMax = await apiRequest.put(route, negotiation, buyer.user);

    assert.notEqual(responseMin.status, 400);
    assert.notEqual(responseMin.status, 500);
    assert.notEqual(responseMax.status, 400);
    assert.notEqual(responseMax.status, 500);

    let optionalNegotiation = {
        proposal_id: 123,
        partner_id: 123,
        terms: 'I want goose'
    };

    let responseOptional = await apiRequest.put(route, optionalNegotiation, buyer.user);

    assert.notEqual(responseOptional.status, 400);
    assert.notEqual(responseOptional.status, 500);
}

/**
 * @case    - The user only supplies a start date for the optional fields.
 * @expect  - The API does not respond with 400. The request is valid.
 * @label   - ATW_API_NEGOTIATION_STARTDATE
 * @route   - PUT deals/negotiations
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_PUT_DEANEG_FUNC_10 (assert: test.Test) {

   /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');

    let optionalNegotiation = {
        proposal_id: 123,
        partner_id: 123,
        start_date: '2016-10-21'
    };

   /** Test */
    let responseOptional = await apiRequest.put(route, optionalNegotiation, buyer.user);

    assert.notEqual(responseOptional.status, 400);
    assert.notEqual(responseOptional.status, 500);
}

/**
 * @case    - The user supplies invalid and valid start dates.
 * @expect  - The API responds with 400s for invalid and not with 400s for valid start dates.
 * @label   - ATW_API_COMMON_STARTDATE
 * @route   - PUT deals/negotiations
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_PUT_DEANEG_FUNC_11 (assert: test.Test) {

   /** Setup */
    assert.plan(9);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');

    let negotiation = {
        proposal_id: 123,
        partner_id: 123,
        end_date: '2017-10-01',
        price: 123,
        impressions: 123,
        budget: 123,
        terms: 'I want goose'
    };

   /** Test */
    Object.assign(negotiation, { start_date: '0000-00-00' });
    let responseZeroDate = await apiRequest.put(route, negotiation, buyer.user);

    Object.assign(negotiation, { start_date: '999-12-31' });
    let responseMinLess = await apiRequest.put(route, negotiation, buyer.user);

    Object.assign(negotiation, { start_date: '10000-01-01' });
    let responseMaxMore = await apiRequest.put(route, negotiation, buyer.user);

    Object.assign(negotiation, { start_date: '10-31-2016' });
    let responseWrongFormat = await apiRequest.put(route, negotiation, buyer.user);

    Object.assign(negotiation, { start_date: 'goose' });
    let responseNonDate = await apiRequest.put(route, negotiation, buyer.user);

    assert.equal(responseZeroDate.status, 400);
    assert.equal(responseMinLess.status, 400);
    assert.equal(responseMaxMore.status, 400);
    assert.equal(responseWrongFormat.status, 400);
    assert.equal(responseNonDate.status, 400);

    Object.assign(negotiation, { start_date: '1000-01-01' });
    let responseMin = await apiRequest.put(route, negotiation, buyer.user);

    Object.assign(negotiation, { start_date: '9999-12-31' });
    let responseMax = await apiRequest.put(route, negotiation, buyer.user);

    assert.notEqual(responseMin.status, 400);
    assert.notEqual(responseMin.status, 500);
    assert.notEqual(responseMax.status, 400);
    assert.notEqual(responseMax.status, 500);
}

/**
 * @case    - The user only supplies an end date for the optional fields.
 * @expect  - The API does not respond with 400. The request is valid.
 * @label   - ATW_API_NEGOTIATION_ENDDATE
 * @route   - PUT deals/negotiations
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_PUT_DEANEG_FUNC_12 (assert: test.Test) {

   /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');

    let optionalNegotiation = {
        proposal_id: 123,
        partner_id: 123,
        end_date: '2016-10-21'
    };

   /** Test */
    let responseOptional = await apiRequest.put(route, optionalNegotiation, buyer.user);

    assert.notEqual(responseOptional.status, 400);
    assert.notEqual(responseOptional.status, 500);
}

/**
 * @case    - The user supplies invalid and valid end dates.
 * @expect  - The API responds with 400s for invalid and not with 400s for valid end dates.
 * @label   - ATW_API_COMMON_ENDDATE
 * @route   - PUT deals/negotiations
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_PUT_DEANEG_FUNC_13 (assert: test.Test) {

   /** Setup */
    assert.plan(9);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');

    let negotiation = {
        proposal_id: 123,
        partner_id: 123,
        start_date: '2016-10-21',
        price: 123,
        impressions: 123,
        budget: 123,
        terms: 'I want goose'
    };

   /** Test */
    Object.assign(negotiation, { end_date: '0000-00-00' });
    let responseZeroDate = await apiRequest.put(route, negotiation, buyer.user);

    Object.assign(negotiation, { end_date: '999-12-31' });
    let responseMinLess = await apiRequest.put(route, negotiation, buyer.user);

    Object.assign(negotiation, { end_date: '10000-01-01' });
    let responseMaxMore = await apiRequest.put(route, negotiation, buyer.user);

    Object.assign(negotiation, { end_date: '10-31-2016' });
    let responseWrongFormat = await apiRequest.put(route, negotiation, buyer.user);

    Object.assign(negotiation, { end_date: 'goose' });
    let responseNonDate = await apiRequest.put(route, negotiation, buyer.user);

    assert.equal(responseZeroDate.status, 400);
    assert.equal(responseMinLess.status, 400);
    assert.equal(responseMaxMore.status, 400);
    assert.equal(responseWrongFormat.status, 400);
    assert.equal(responseNonDate.status, 400);

    Object.assign(negotiation, { end_date: '1000-01-01' });
    let responseMin = await apiRequest.put(route, negotiation, buyer.user);

    Object.assign(negotiation, { end_date: '9999-12-31' });
    let responseMax = await apiRequest.put(route, negotiation, buyer.user);

    assert.notEqual(responseMin.status, 400);
    assert.notEqual(responseMin.status, 500);
    assert.notEqual(responseMax.status, 400);
    assert.notEqual(responseMax.status, 500);
}

/**
 * @case    - The user supplies invalid and valid response fields.
 * @expect  - The API responds with 400s for invalid and not with 400s for valid response fields.
 * @label   - ATW_API_NEGOTIATION_RESPONSE
 * @route   - PUT deals/negotiations
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_PUT_DEANEG_FUNC_14 (assert: test.Test) {

   /** Setup */
    assert.plan(7);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');

    let negotiation = {
        proposal_id: 123,
        partner_id: 123
    };

   /** Test */
    Object.assign(negotiation, { response: 123 });
    let responseNonString = await apiRequest.put(route, negotiation, buyer.user);

    Object.assign(negotiation, { response: '' });
    let responseEmptyString = await apiRequest.put(route, negotiation, buyer.user);

    Object.assign(negotiation, { response: 'goose' });
    let responseNonOption = await apiRequest.put(route, negotiation, buyer.user);

    assert.equal(responseNonString.status, 400);
    assert.equal(responseEmptyString.status, 400);
    assert.equal(responseNonOption.status, 400);

    Object.assign(negotiation, { response: 'AcCePt' });
    let responseAccept = await apiRequest.put(route, negotiation, buyer.user);

    Object.assign(negotiation, { response: 'rEjEcT' });
    let responseReject = await apiRequest.put(route, negotiation, buyer.user);

    assert.notEqual(responseAccept.status, 400);
    assert.notEqual(responseAccept.status, 500);
    assert.notEqual(responseReject.status, 400);
    assert.notEqual(responseReject.status, 500);
}

/**
 * @case    - Publisher start a negotiation with its own proposal.
 * @expect  - 403 Forbidden, publisher cannot start a new negotiation on its own proposal
 * @route   - PUT deals/negotiations
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_PUT_DEANEG_FUNC_15(assert: test.Test) {

   /** Setup */
    assert.plan(1);

    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposalObj = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ], { status: 'active' });

   /** Test */
    let requestBody = {
            proposal_id: proposalObj.proposal.proposalID,
            partner_id: pubCompany.user.userID,
            terms: 'Are you a goose'
    };
    let response = await apiRequest.put(route, requestBody, publisher.user);

    assert.equal(response.status, 403);
}

/**
 * @case    - Publisher start a negotiation on a buyer's proposal
 * @expect  - 200 - Success
 * @route   - PUT deals/negotiations
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_PUT_DEANEG_FUNC_16(assert: test.Test) {

   /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(123);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposalObj = await databasePopulator.createProposal(buyerCompany.user.userID, [ section.section.sectionID ], { status: 'active' });

   /** Test */
    let requestBody = {
            proposal_id: proposalObj.proposal.proposalID,
            partner_id: buyerCompany.user.userID,
            terms: 'Are you a goose'
    };
    let response = await apiRequest.put(route, requestBody, publisher.user);

    assert.equal(response.status, 200);
    assert.equal(response.body.data[0].terms, 'Are you a goose');
}

/**
 * @case    - Publisher send a negotiation to a buyer.
 * @expect  - 200 OK, negotiated field changes
 * @route   - PUT deals/negotiations
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_PUT_DEANEG_FUNC_17(assert: test.Test) {

   /** Setup */
    assert.plan(2);

    await databasePopulator.createDSP(DSP_ID);
    let buyerCompany = await databasePopulator.createCompany({}, DSP_ID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposalObj = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ], { status: 'active' });
    let buyerRequestBody = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: pubCompany.user.userID,
        terms: 'i am a goose'
    };
    await apiRequest.put(route, buyerRequestBody, buyer.user);

   /** Test */
    let pubRequestBody = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: buyerCompany.user.userID,
        terms: 'no you are a duck'
    };
    let response = await apiRequest.put(route, pubRequestBody, publisher.user);

    assert.equal(response.status, 200);
    assert.equal(response.body.data[0].terms, 'no you are a duck');
}

/**
 * @case    - Publisher send second offer before buyer reply
 * @expect  - 403 Forbidden, publisher out of turn
 * @route   - PUT deals/negotiations
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_PUT_DEANEG_FUNC_18(assert: test.Test) {

   /** Setup */
    assert.plan(1);

    await databasePopulator.createDSP(DSP_ID);
    let buyerCompany = await databasePopulator.createCompany({}, DSP_ID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposalObj = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ], { status: 'active' });

    let buyerRequestBody = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: pubCompany.user.userID,
        terms: 'i am a goose'
    };
    await apiRequest.put(route, buyerRequestBody, buyer.user);

    let pubRequestBody1 = {
            proposal_id: proposalObj.proposal.proposalID,
            partner_id: buyerCompany.user.userID,
            terms: 'no you are a duck'
    };
    await apiRequest.put(route, pubRequestBody1, publisher.user);

   /** Test */
    let pubRequestBody2 = {
            proposal_id: proposalObj.proposal.proposalID,
            partner_id: buyerCompany.user.userID,
            terms: 'ok maybe you are a goose'
    };
    let response = await apiRequest.put(route, pubRequestBody2, publisher.user);

    assert.equal(response.status, 403);
}

/**
 * @case    - Publisher sends offer to a negotiation with a wrong buyerID
 * @expect  - 403 Forbidden, publisher cannot start negotiation on its own proposal
 * @route   - PUT deals/negotiations
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_PUT_DEANEG_FUNC_20(assert: test.Test) {

   /** Setup */
    assert.plan(1);

    await databasePopulator.createDSP(DSP_ID);
    let buyerCompany = await databasePopulator.createCompany({}, DSP_ID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let innocentBuyerCompany = await databasePopulator.createCompany({}, DSP_ID);
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposalObj = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ], { status: 'active' });

   /** Test */
    let buyerRequestBody = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: publisher.user.userID,
        terms: 'i am a goose'
    };
    await apiRequest.put(route, buyerRequestBody, buyer.user);

    let pubRequestBody = {
            proposal_id: proposalObj.proposal.proposalID,
            partner_id: innocentBuyerCompany.user.userID,
            terms: 'i have no idea what I am doing'
    };
    let response = await apiRequest.put(route, pubRequestBody, publisher.user);

    assert.equal(response.status, 403);

}

/**
 * @case    - Buyer sends an offer to a proposal
 * @expect  - 200 OK, negotiated filed changes
 * @route   - PUT deals/negotiations
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_PUT_DEANEG_FUNC_21(assert: test.Test) {

   /** Setup */
    assert.plan(2);

    await databasePopulator.createDSP(DSP_ID);
    let buyerCompany = await databasePopulator.createCompany({}, DSP_ID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposalObj = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ], { status: 'active' });

   /** Test */
    let requestBody = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: pubCompany.user.userID,
        terms: 'i am a goose'
    };
    let response = await apiRequest.put(route, requestBody, buyer.user);

    assert.equal(response.status, 200);
    assert.equal(response.body.data[0].terms, 'i am a goose');

}

/**
 * @case    - Buyer send a negotiation to an existing negotiation
 * @expect  - 200 OK, negotiated filed changes
 * @route   - PUT deals/active
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_PUT_DEANEG_FUNC_22(assert: test.Test) {

   /** Setup */
    assert.plan(2);

    await databasePopulator.createDSP(DSP_ID);
    let buyerCompany = await databasePopulator.createCompany({}, DSP_ID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposalObj = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ], { status: 'active' });

    let buyerRequestBody1 = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: pubCompany.user.userID,
        terms: 'i am a goose'
    };
    await apiRequest.put(route, buyerRequestBody1, buyer.user);
    let pubRequestBody = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: buyerCompany.user.userID,
        terms: 'no you are a duck'
    };
    await apiRequest.put(route, pubRequestBody, publisher.user);

   /** Test */
    let buyerRequestBody2 = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: pubCompany.user.userID,
        terms: 'honk honk honk'
    };
    let response = await apiRequest.put(route, buyerRequestBody2, buyer.user);

    assert.equal(response.status, 200);
    assert.equal(response.body.data[0].terms, 'honk honk honk');
}

/**
 * @case    - Buyer sends an offer to a negotiation before publisher reply to its previous offer
 * @expect  - 403 Forbidden, buyer out of turn
 * @route   - PUT deals/negotiations
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_PUT_DEANEG_FUNC_23(assert: test.Test) {

   /** Setup */
    assert.plan(1);

    await databasePopulator.createDSP(DSP_ID);
    let buyerCompany = await databasePopulator.createCompany({}, DSP_ID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposalObj = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ], { status: 'active' });

    let buyerRequestBody1 = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: pubCompany.user.userID,
        terms: 'i am a goose'
    };
    await apiRequest.put(route, buyerRequestBody1, buyer.user);

   /** Test */
    let buyerRequestBody2 = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: pubCompany.user.userID,
        terms: 'honk honk honk'
    };
    let response = await apiRequest.put(route, buyerRequestBody2, buyer.user);

    assert.equal(response.status, 403);

}

/**
 * @case    - Different buyers negotiate on the same proposal do not effect each other.
 * @expect  - 200 OK, another negotiation created
 * @route   - PUT deals/negotiations
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_PUT_DEANEG_FUNC_24(assert: test.Test) {

   /** Setup */
    assert.plan(3);

    await databasePopulator.createDSP(DSP_ID);
    let buyerCompany1 = await databasePopulator.createCompany({}, DSP_ID);
    let buyer1 = await databasePopulator.createBuyer(buyerCompany1.user.userID, 'write');
    await databasePopulator.createDSP(ANOTHER_DSP_ID);
    let buyerCompany2 = await databasePopulator.createCompany({}, ANOTHER_DSP_ID);
    let buyer2 = await databasePopulator.createBuyer(buyerCompany2.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposalObj = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ], { status: 'active' });

    let buyerOneRequest = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: pubCompany.user.userID,
        terms: 'i am a montreal goose'
    };
    let buyerOneResponse = await apiRequest.put(route, buyerOneRequest, buyer1.user);

   /** Test */
    let buyerTwoRequest = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: pubCompany.user.userID,
        terms: 'i am a toronto goose'
    };
    let buyerTwoResponse = await apiRequest.put(route, buyerTwoRequest, buyer2.user);

    assert.equal(buyerTwoResponse.status, 200);
    assert.equal(buyerOneResponse.body.data[0].terms, 'i am a montreal goose');
    assert.equal(buyerTwoResponse.body.data[0].terms, 'i am a toronto goose');

}

/**
 * @case    - Buyer cannot reopen the negotiation after pub rejected.
 * @expect  - 403, buyer status accepted, pub status rejected
 * @route   - PUT deals/negotiations
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_PUT_DEANEG_FUNC_25(assert: test.Test) {

   /** Setup */
    assert.plan(3);

    await databasePopulator.createDSP(DSP_ID);
    let buyerCompany = await databasePopulator.createCompany({}, DSP_ID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposalObj = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ], { status: 'active' });

    let buyerRequestBody1 = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: pubCompany.user.userID,
        terms: 'i am a goose'
    };
    await apiRequest.put(route, buyerRequestBody1, buyer.user);

    let publisherRequestBody = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: buyerCompany.user.userID,
        response: 'reject'
    };
    await apiRequest.put(route, publisherRequestBody, publisher.user);

   /** Test */
    let buyerRequestBody2 = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: pubCompany.user.userID,
        terms: 'honk honk honk'
    };
    let response = await apiRequest.put(route, buyerRequestBody2, buyer.user);

    let actualOwnerStatus = await getOwnerStatus(proposalObj.proposal, buyerCompany.user.userID);
    let actualPartnerStatus = await getPartnerStatus(proposalObj.proposal, buyerCompany.user.userID);

    assert.equal(response.status, 403);
    assert.equal(actualOwnerStatus, 'rejected');
    assert.equal(actualPartnerStatus, 'accepted');
}

/**
 * @case    - Pub cannot reopen the negotiation after buyer rejected.
 * @expect  - 403, buyer status rejected, pub status accepted
 * @route   - PUT deals/negotiations
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_PUT_DEANEG_FUNC_26(assert: test.Test) {

   /** Setup */
    assert.plan(3);

    await databasePopulator.createDSP(DSP_ID);
    let buyerCompany = await databasePopulator.createCompany({}, DSP_ID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposalObj = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ], { status: 'active' });

    let buyerRequestBody1 = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: pubCompany.user.userID,
        terms: 'i am a goose'
    };
    await apiRequest.put(route, buyerRequestBody1, buyer.user);

    let pubRequestBody1 = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: buyerCompany.user.userID,
        terms: 'no you are a duck'
    };
    await apiRequest.put(route, pubRequestBody1, publisher.user);

    let buyerRequestBody2 = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: pubCompany.user.userID,
        response: 'reject'
    };
    await apiRequest.put(route, buyerRequestBody2, buyer.user);

   /** Test */
    let pubRequestBody2 = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: buyerCompany.user.userID,
        terms: 'ok maybe you are a goose'
    };
    let response = await apiRequest.put(route, pubRequestBody2, publisher.user);

    let actualOwnerStatus = await getOwnerStatus(proposalObj.proposal, buyerCompany.user.userID);
    let actualPartnerStatus = await getPartnerStatus(proposalObj.proposal, buyerCompany.user.userID);

    assert.equal(response.status, 403);
    assert.equal(actualOwnerStatus, 'accepted');
    assert.equal(actualPartnerStatus, 'rejected');
}

/**
 * @case    - Buyer send an offer to an accepted negotiation
 * @expect  - 403 Forbidden, buyer cannot send an offer to an accepted negotiation
 * @route   - PUT deals/negotiations
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_PUT_DEANEG_FUNC_27(assert: test.Test) {

   /** Setup */
    assert.plan(1);

    await databasePopulator.createDSP(DSP_ID);
    let buyerCompany = await databasePopulator.createCompany({}, DSP_ID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposalObj = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ], { status: 'active' });

    let buyerRequestBody1 = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: pubCompany.user.userID,
        terms: 'i am a goose'
    };
    await apiRequest.put(route, buyerRequestBody1, buyer.user);

    let pubRequestBody = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: buyerCompany.user.userID,
        response: 'accept'
    };
    await apiRequest.put(route, pubRequestBody, publisher.user);

   /** Test */
    let buyerRequestBody2 = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: pubCompany.user.userID,
        terms: 'honk honk honk'
    };
    let response = await apiRequest.put(route, buyerRequestBody2, buyer.user);

    assert.equal(response.status, 403);
}

/**
 * @case    - Publisher send an offer to an accepted negotiation
 * @expect  - 403 Forbidden, pub cannot send an offer to an accepted negotiation
 * @route   - PUT deals/negotiations
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_PUT_DEANEG_FUNC_28(assert: test.Test) {

   /** Setup */
    assert.plan(1);

    await databasePopulator.createDSP(DSP_ID);
    let buyerCompany = await databasePopulator.createCompany({}, DSP_ID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposalObj = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ], { status: 'active' });

    let buyerRequestBody = {
        proposal_id: proposalObj.proposal.proposalID,
        terms: 'i am a goose'
    };
    await apiRequest.put(route, buyerRequestBody, buyer.user);

    let pubRequestBody1 = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: buyerCompany.user.userID,
        response: 'accept'
    };
    await apiRequest.put(route, pubRequestBody1, publisher.user);

   /** Test */
    let pubRequestBody2 = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: buyerCompany.user.userID,
        terms: 'no you are a duck'
    };
    let response = await apiRequest.put(route, pubRequestBody2, publisher.user);

    assert.equal(response.status, 403);
}

/**
 * @case    - Buyer try to reject a negotiation that doesn't exist
 * @expect  - 403 Forbidden, cannot reject a negotiation that doesn't exist
 * @route   - PUT deals/negotiations
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_PUT_DEANEG_FUNC_29(assert: test.Test) {

   /** Setup */
    assert.plan(1);

    await databasePopulator.createDSP(DSP_ID);
    let buyerCompany = await databasePopulator.createCompany({}, DSP_ID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposalObj = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ], { status: 'active' });

   /** Test */
    let buyerRequestBody = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: pubCompany.user.userID,
        response: 'reject'
    };
    let response = await apiRequest.put(route, buyerRequestBody, buyer.user);

    assert.equal(response.status, 403);
}

/**
 * @case    - Publisher try to reject a negotiation that doesn't exist
 * @expect  - 403 Forbidden, cannot reject a negotiation that doesn't exist
 * @route   - PUT deals/negotiations
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_PUT_DEANEG_FUNC_30(assert: test.Test) {

   /** Setup */
    assert.plan(1);

    await databasePopulator.createDSP(DSP_ID);
    let buyerCompany = await databasePopulator.createCompany({}, DSP_ID);
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposalObj = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ], { status: 'active' });

   /** Test */
    let pubRequestBody = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: buyerCompany.user.userID,
        response: 'reject'
    };
    let response = await apiRequest.put(route, pubRequestBody, publisher.user);

    assert.equal(response.status, 403);
}

/**
 * @case    - The buyer sends a counter-offer to a proposal that doesn't exist.
 * @expect  - 404 Not Found, cannot found a non-existing proposal
 * @route   - PUT deals/negotiations
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_PUT_DEANEG_FUNC_31(assert: test.Test) {

   /** Setup */
    assert.plan(1);

    await databasePopulator.createDSP(DSP_ID);
    let buyerCompany = await databasePopulator.createCompany({}, DSP_ID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let fakeProposalID = 2333;

   /** Test */
    let buyerRequestBody = {
        proposal_id: fakeProposalID,
        partner_id: pubCompany.user.userID,
        terms: 'i am a goose'
    };
    let response = await apiRequest.put(route, buyerRequestBody, buyer.user);

    assert.equal(response.status, 404);
}

/**
 * @case    - The buyer sends a counter-offer with a non-numeric proposal id	
 * @expect  - 400 Bad Request, proposal id has to be a number
 * @route   - PUT deals/negotiations
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_PUT_DEANEG_FUNC_32(assert: test.Test) {

   /** Setup */
    assert.plan(1);

    await databasePopulator.createDSP(DSP_ID);
    let buyerCompany = await databasePopulator.createCompany({}, DSP_ID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let fakeProposalID = 'gooseID';

   /** Test */
    let buyerRequestBody = {
        proposal_id: fakeProposalID,
        partner_id: pubCompany.user.userID,
        terms: 'i am a goose'
    };
    let response = await apiRequest.put(route, buyerRequestBody, buyer.user);

    assert.equal(response.status, 400);
}

/**
 * @case    - The buyer sends a counter-offer with no proposal id.	
 * @expect  - 400 Bad Request, a request has to have a proposal id
 * @route   - PUT deals/negotiations
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_PUT_DEANEG_FUNC_33(assert: test.Test) {

   /** Setup */
    assert.plan(1);

    await databasePopulator.createDSP(DSP_ID);
    let buyerCompany = await databasePopulator.createCompany({}, DSP_ID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();

   /** Test */
    let buyerRequestBody = {
        partner_id: pubCompany.user.userID,
        terms: 'i am a goose'
    };
    let response = await apiRequest.put(route, buyerRequestBody, buyer.user);

    assert.equal(response.status, 400);
}

/**
 * @case    - The buyer sends a counter-offer for an inactive proposal.		
 * @expect  - 404 Proposal not found - proposal 'dooes not exist' to user
 * @route   - PUT deals/negotiations
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_PUT_DEANEG_FUNC_34(assert: test.Test) {

   /** Setup */
    assert.plan(1);

    await databasePopulator.createDSP(DSP_ID);
    let buyerCompany = await databasePopulator.createCompany({}, DSP_ID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ], { status: 'deleted' });

   /** Test */
    let buyerRequestBody = {
        proposal_id: proposal.proposal.proposalID,
        partner_id: pubCompany.user.userID,
        terms: 'i am a goose'
    };
    let response = await apiRequest.put(route, buyerRequestBody, buyer.user);

    assert.equal(response.status, 404);
}

/**
 * @case    - The buyer can reject a negotiation out of turn, but cannot reject again.
 * @expect  - 200 and 403
 * @route   - PUT deals/negotiations
 * @status  - working
 * @tags    - put, negotiations, deals, reject
 */
export async function ATW_API_PUT_DEANEG_FUNC_37(assert: test.Test) {

   /** Setup */
    assert.plan(3);

    await databasePopulator.createDSP(DSP_ID);
    let buyerCompany = await databasePopulator.createCompany({}, DSP_ID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposalObj = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);

    let buyerRequestBody1 = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: pubCompany.user.userID,
        terms: 'i am a goose'
    };
    let response1 = await apiRequest.put(route, buyerRequestBody1, buyer.user);

    // Test
    let buyerRequestBody2 = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: pubCompany.user.userID,
        response: 'reject'
    };
    let response2 = await apiRequest.put(route, buyerRequestBody2, buyer.user);
    let response3 = await apiRequest.put(route, buyerRequestBody2, buyer.user);

    assert.equal(response1.status, 200);
    assert.equal(response2.status, 200);
    assert.equal(response3.status, 403);

}

/**
 * @case    - The publisher can reject a negotiation out of turn, but cannot reject again.
 * @expect  - 200 and 403
 * @route   - PUT deals/negotiations
 * @status  - working
 * @tags    - put, negotiations, deals, reject
 */
export async function ATW_API_PUT_DEANEG_FUNC_38(assert: test.Test) {

   /** Setup */
    assert.plan(4);

    await databasePopulator.createDSP(DSP_ID);
    let buyerCompany = await databasePopulator.createCompany({}, DSP_ID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposalObj = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);

    let buyerRequestBody1 = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: pubCompany.user.userID,
        terms: 'i am a goose'
    };
    let response1 = await apiRequest.put(route, buyerRequestBody1, buyer.user);

    let publisherRequestBody1 = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: buyerCompany.user.userID,
        terms: 'i am a goober'
    };
    let response2 = await apiRequest.put(route, publisherRequestBody1, publisher.user);

    // Test
    let publisherRequestBody2 = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: buyerCompany.user.userID,
        response: 'reject'
    };
    let response3 = await apiRequest.put(route, publisherRequestBody2, publisher.user);
    let response4 = await apiRequest.put(route, publisherRequestBody2, publisher.user);

    assert.equal(response1.status, 200);
    assert.equal(response2.status, 200);
    assert.equal(response3.status, 200);
    assert.equal(response4.status, 403);

}

/**
 * @case    - A buyer tries to start a negotiation on a proposal owned by another buyer 
 * @expect  - 403 - cannot do that
 * @route   - PUT deals/negotiations
 * @status  - working
 * @tags    - put, negotiations, deals, reject
 */
 export async function ATW_API_PUT_DEANEG_FUNC_39(assert: test.Test) {

    /** Setup */
     assert.plan(1);

     await databasePopulator.createDSP(DSP_ID);
     let buyerCompany = await databasePopulator.createCompany({}, DSP_ID);
     let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
     let proposalOwnerBuyerCompany = await databasePopulator.createCompany({}, DSP_ID);
     let pubCompany = await databasePopulator.createCompany();
     let site = await databasePopulator.createSite(pubCompany.user.userID);
     let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
     let proposalObj = await databasePopulator.createProposal(proposalOwnerBuyerCompany.user.userID, [ section.section.sectionID ]);

     let requestBody = {
         proposal_id: proposalObj.proposal.proposalID,
         partner_id: proposalOwnerBuyerCompany.user.userID,
         terms: 'i am a goose'
     };

     let response = await apiRequest.put(route, requestBody, buyer.user);

     assert.equal(response.status, 403);

 }

/**
 * @case    - A publisher tries to start a negotiation on a proposal owned by another publisher 
 * @expect  - 403 - cannot do that
 * @route   - PUT deals/negotiations
 * @status  - working
 * @tags    - put, negotiations, deals, reject
 */
 export async function ATW_API_PUT_DEANEG_FUNC_40(assert: test.Test) {

    /** Setup */
     assert.plan(1);

     let pubCompany = await databasePopulator.createCompany();
     let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
     let proposalOwnerPubCompany = await databasePopulator.createCompany();
     let site = await databasePopulator.createSite(pubCompany.user.userID);
     let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
     let proposalObj = await databasePopulator.createProposal(proposalOwnerPubCompany.user.userID, [ section.section.sectionID ]);

     let requestBody = {
         proposal_id: proposalObj.proposal.proposalID,
         partner_id: proposalOwnerPubCompany.user.userID,
         terms: 'i am a goose'
     };

     let response = await apiRequest.put(route, requestBody, publisher.user);

     assert.equal(response.status, 403);

 }

/**
 * @case    - The buyer is not targeted by proposal it is trying to negotiate but another buyer is 
 * @setup   - create dsp, create buyer, create publisher, create site , create section
 *  create proposal, create user targeting
 * @expect  - 404 - Buyer is not able to negotiate  
 * @route   - PUT deals/negotations
 * @status  - working
 * @tags    - put, negotations, proposal, targeting
 */
export async function ATW_API_PUT_DEANEG_FUNC_05_01(assert: test.Test) {

    assert.plan(2);

    await databasePopulator.createDSP(DSP_ID);
    let buyerCompany1 = await databasePopulator.createCompany({}, DSP_ID);
    let buyer1 = await databasePopulator.createBuyer(buyerCompany1.user.userID, 'write');
    let buyerCompany2 = await databasePopulator.createCompany({}, DSP_ID);
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ], {},
                                                            [ buyerCompany2.user.userID ]);

    let buyer1RequestBody = {
        proposal_id: proposal.proposal.proposalID,
        partner_id: pubCompany.user.userID,
        terms: 'i am a goose'
    };

    let response = await apiRequest.put(route, buyer1RequestBody, buyer1.user);

    assert.equal(response.status, 404);
    assert.deepEqual(response.body.data, []);

}

/**
 * @case    - The publisher is not targeted by proposal it is trying to negotiate but another publisher is 
 * @setup   - create dsp, create buyer, create publisher, create site , create section
 *  create proposal, create user targeting
 * @expect  - 404 - publisher is not able to negotiate  
 * @route   - PUT deals/negotations
 * @status  - working
 * @tags    - put, negotations, proposal, targeting
 */

export async function ATW_API_PUT_DEANEG_FUNC_41(assert: test.Test) {

    assert.plan(2);

    await databasePopulator.createDSP(DSP_ID);
    let buyerCompany = await databasePopulator.createCompany({}, DSP_ID);
    let pubCompany1 = await databasePopulator.createCompany();
    let publisher1 = await databasePopulator.createPublisher(pubCompany1.user.userID, 'write');
    let pubCompany2 = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany2.user.userID);
    let section = await databasePopulator.createSection(pubCompany2.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(buyerCompany.user.userID, [ section.section.sectionID ], {},
                                                            [ pubCompany2.user.userID ]);

    let publisher1RequestBody = {
        proposal_id: proposal.proposal.proposalID,
        partner_id: buyerCompany.user.userID,
        terms: 'i am a goose'
    };

    let response = await apiRequest.put(route, publisher1RequestBody, publisher1.user);

    assert.equal(response.status, 404);
    assert.deepEqual(response.body.data, []);
}

/**
 * @case    - The buyer is targeted by proposal it is trying to negotiate
 * @setup   - create dsp, create buyer, create publisher, create site , create section,
 *  create proposal, create user targeting
 * @expect  - 200 - Counter offer sent   
 * @route   - PUT deals/negotations
 * @status  - working
 * @tags    - put, negotations, proposal, targeting
 */
export async function ATW_API_PUT_DEANEG_FUNC_42(assert: test.Test) {

    assert.plan(1);

    await databasePopulator.createDSP(DSP_ID);
    let buyerCompany = await databasePopulator.createCompany({}, DSP_ID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ], {}
                                                          [ buyerCompany.user.userID ]);

    let buyerRequestBody = {
        proposal_id: proposal.proposal.proposalID,
        partner_id: pubCompany.user.userID,
        terms: 'i am a goose'
    };

    let response = await apiRequest.put(route, buyerRequestBody, buyer.user);

    assert.equal(response.status, 200);

}

/**
 * @case    - The publisher is targeted by proposal it is trying to negotiate
 * @setup   - create dsp, create buyer, create publisher, create site , create section,
 *   create proposal, create user targeting 
 * @expect  - 200 - Counter offer sent   
 * @route   - PUT deals/negotations
 * @status  - working
 * @tags    - put, negotations, proposal, targeting
 */
export async function ATW_API_PUT_DEANEG_FUNC_43(assert: test.Test) {

    assert.plan(1);

    await databasePopulator.createDSP(DSP_ID);
    let buyerCompany = await databasePopulator.createCompany({}, DSP_ID);
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(buyerCompany.user.userID, [ section.section.sectionID ], {}
                                                          [ pubCompany.user.userID ]);

    let publisherRequestBody = {
        proposal_id: proposal.proposal.proposalID,
        partner_id: buyerCompany.user.userID,
        terms: 'i am a goose'
    };

    let response = await apiRequest.put(route, publisherRequestBody, publisher.user);

    assert.equal(response.status, 200);

}

/**
 * @case    - The buyer accepts an ongoing negotiation
 * @setup   - create dsp, create buyer, create publisher, create site , create section,
 *   create proposal, create deal negotiation (sender: publisher) 
 * @expect  - 200 - new deal created  
 * @route   - PUT deals/negotations
 * @status  - 
 * @tags    - put, negotations, accepting
 */
export async function ATW_API_PUT_DEANEG_FUNC_44(assert: test.Test) {

    assert.plan(1);

    await databasePopulator.createDSP(DSP_ID);
    let buyerCompany = await databasePopulator.createCompany({}, DSP_ID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);
    await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, buyerCompany.user.userID, { sender: 'owner' });

    let buyerRequestBody = {
        proposal_id: proposal.proposal.proposalID,
        partner_id: pubCompany.user.userID,
        response: 'accept'
    };

    let response = await apiRequest.put(route, buyerRequestBody, buyer.user);

    assert.equal(response.status, 200);

}

/**
 * @case    - The publisher accepts an ongoing negotiation
 * @setup   - create dsp, create buyer, create publisher, create site , create section,
 *   create proposal, create deal negotiation (sender: buyer) 
 * @expect  - 200 - new deal created  
 * @route   - PUT deals/negotations
 * @status  - 
 * @tags    - put, negotations, accepting
 */
export async function ATW_API_PUT_DEANEG_FUNC_45(assert: test.Test) {

    assert.plan(1);

    await databasePopulator.createDSP(DSP_ID);
    let buyerCompany = await databasePopulator.createCompany({}, DSP_ID);
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);
    await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, buyerCompany.user.userID, { sender: 'partner' });

    let publisherRequestBody = {
        proposal_id: proposal.proposal.proposalID,
        partner_id: buyerCompany.user.userID,
        response: 'accept'
    };

    let response = await apiRequest.put(route, publisherRequestBody, publisher.user);

    assert.equal(response.status, 200);

}

/**
 * @case    - Pub user negotiate on a negotiation between partner and another pub user in its company
 * @expect  - 200 OK, negotiated field changes
 * @route   - PUT deals/negotiations
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_PUT_DEANEG_FUNC_46(assert: test.Test) {

    /** Setup */
    assert.plan(4);

    await databasePopulator.createDSP(DSP_ID);
    let buyerCompany = await databasePopulator.createCompany({}, DSP_ID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let anotherPublisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposalObj = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ],
                                                             { status: 'active' }, [], publisher.user.userID);
    let buyerRequestBody = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: pubCompany.user.userID,
        terms: 'i am a goose'
    };
    await apiRequest.put(route, buyerRequestBody, buyer.user);

    /** Test */
    let pubRequestBody = {
            proposal_id: proposalObj.proposal.proposalID,
            partner_id: buyerCompany.user.userID,
            terms: 'no you are a duck'
    };
    let response = await apiRequest.put(route, pubRequestBody, anotherPublisher.user);
    let termsInDB = await getNegotiatedFieldInDB(proposalObj.proposal, buyerCompany.user.userID, 'terms');

    assert.equal(response.status, 200);
    assert.equal(response.body.data[0].terms, 'no you are a duck');
    assert.equal(termsInDB, 'no you are a duck');
    assert.deepEqual(response.body.data[0].contact, Helper.contactToPayload(buyer.user));
}

/**
 * @case    - Buyer user negotiate on a negotiation between partner and another buyer user in its company
 * @expect  - 200 OK, negotiated filed changes
 * @route   - PUT deals/active
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_PUT_DEANEG_FUNC_47(assert: test.Test) {

   /** Setup */
    assert.plan(4);

    await databasePopulator.createDSP(DSP_ID);
    let buyerCompany = await databasePopulator.createCompany({}, DSP_ID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let anotherBuyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposalObj = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ], { status: 'active' });

    let buyerRequestBody1 = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: pubCompany.user.userID,
        terms: 'i am a goose'
    };
    await apiRequest.put(route, buyerRequestBody1, buyer.user);
    let pubRequestBody = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: buyerCompany.user.userID,
        terms: 'no you are a duck'
    };
    await apiRequest.put(route, pubRequestBody, publisher.user);

   /** Test */
    let buyerRequestBody2 = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: pubCompany.user.userID,
        terms: 'honk honk honk'
    };
    let response = await apiRequest.put(route, buyerRequestBody2, anotherBuyer.user);
    let termsInDB = await getNegotiatedFieldInDB(proposalObj.proposal, buyerCompany.user.userID, 'terms');

    assert.equal(response.status, 200);
    assert.equal(response.body.data[0].terms, 'honk honk honk');
    assert.equal(termsInDB, 'honk honk honk');
    assert.deepEqual(response.body.data[0].contact, Helper.contactToPayload(pubCompany.user));
}

/**
 * @case    - Pub user negotiate on a negotiation between partner and another pub user in its company
 * @expect  - 200 OK, negotiated field changes
 * @route   - PUT deals/negotiations
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_PUT_DEANEG_FUNC_48(assert: test.Test) {

    /** Setup */
    assert.plan(4);

    await databasePopulator.createDSP(DSP_ID);
    let buyerCompany = await databasePopulator.createCompany({}, DSP_ID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let anotherPublisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let internalUser = await databasePopulator.createInternalUser();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposalObj = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ],
                                                             { status: 'active' }, [], publisher.user.userID);
    let buyerRequestBody = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: pubCompany.user.userID,
        terms: 'i am a goose'
    };
    await apiRequest.put(route, buyerRequestBody, buyer.user);

    /** Test */
    let pubRequestBody = {
            proposal_id: proposalObj.proposal.proposalID,
            partner_id: buyerCompany.user.userID,
            terms: 'no you are a duck'
    };

    let authResponse = await apiRequest.getAuthToken(internalUser.emailAddress, internalUser.password);
    let accessToken = authResponse.body.data.accessToken;

    let response = await apiRequest.put(route, pubRequestBody, {
        userID: anotherPublisher.user.userID,
        accessToken: accessToken
    });
    let termsInDB = await getNegotiatedFieldInDB(proposalObj.proposal, buyerCompany.user.userID, 'terms');

    assert.equal(response.status, 200);
    assert.equal(response.body.data[0].terms, 'no you are a duck');
    assert.equal(termsInDB, 'no you are a duck');
    assert.deepEqual(response.body.data[0].contact, Helper.contactToPayload(buyer.user));
}

/**
 * @case    - Internal user impersonate impersonates a buyer to negotiate on a negotiation started by 
 *            another buyer in its company
 * @expect  - 200 OK, negotiated filed changes
 * @route   - PUT deals/active
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_PUT_DEANEG_FUNC_49(assert: test.Test) {

   /** Setup */
    assert.plan(4);

    await databasePopulator.createDSP(DSP_ID);
    let buyerCompany = await databasePopulator.createCompany({}, DSP_ID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let anotherBuyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let internalUser = await databasePopulator.createInternalUser();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposalObj = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ], { status: 'active' });

    let buyerRequestBody1 = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: pubCompany.user.userID,
        terms: 'i am a goose'
    };
    await apiRequest.put(route, buyerRequestBody1, buyer.user);
    let pubRequestBody = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: buyerCompany.user.userID,
        terms: 'no you are a duck'
    };
    await apiRequest.put(route, pubRequestBody, publisher.user);

   /** Test */
    let buyerRequestBody2 = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: pubCompany.user.userID,
        terms: 'honk honk honk'
    };

    let authResponse = await apiRequest.getAuthToken(internalUser.emailAddress, internalUser.password);
    let accessToken = authResponse.body.data.accessToken;

    let response = await apiRequest.put(route, buyerRequestBody2, {
        userID: anotherBuyer.user.userID,
        accessToken: accessToken
    });
    let termsInDB = await getNegotiatedFieldInDB(proposalObj.proposal, buyerCompany.user.userID, 'terms');

    assert.equal(response.status, 200);
    assert.equal(response.body.data[0].terms, 'honk honk honk');
    assert.equal(termsInDB, 'honk honk honk');
    assert.deepEqual(response.body.data[0].contact, Helper.contactToPayload(pubCompany.user));
}

/**
 * @case    - Inactive section in counter-offer request
 * @expect  - 403
 * @route   - PUT deals/active
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_PUT_DEANEG_FUNC_50(assert: test.Test) {

   /** Setup */
    assert.plan(1);

    await databasePopulator.createDSP(DSP_ID);
    let buyerCompany = await databasePopulator.createCompany({}, DSP_ID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let inactiveSection = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ], { status: 'D' });
    let proposalObj = await databasePopulator.createProposal(pubCompany.user.userID, [], { status: 'active' });

    let buyerRequestBody = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: pubCompany.user.userID,
        terms: 'i am a goose'
    };
    await apiRequest.put(route, buyerRequestBody, buyer.user);
    let pubRequestBody = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: buyerCompany.user.userID,
        inventory: [ section.section.sectionID, inactiveSection.section.sectionID ]
    };
    let response = await apiRequest.put(route, pubRequestBody, publisher.user);

    /** Test */
    assert.equal(response.status, 403);

}

/**
 * @case    - Not their section in counter-offer request
 * @expect  - 403
 * @route   - PUT deals/active
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_PUT_DEANEG_FUNC_51(assert: test.Test) {

   /** Setup */
    assert.plan(1);

    await databasePopulator.createDSP(DSP_ID);
    let buyerCompany = await databasePopulator.createCompany({}, DSP_ID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let poorPubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let site = await databasePopulator.createSite(poorPubCompany.user.userID);
    let section = await databasePopulator.createSection(poorPubCompany.user.userID, [ site.siteID ]);
    let proposalObj = await databasePopulator.createProposal(pubCompany.user.userID, [], { status: 'active' });

    let buyerRequestBody = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: pubCompany.user.userID,
        terms: 'i am a goose'
    };
    await apiRequest.put(route, buyerRequestBody, buyer.user);
    let pubRequestBody = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: buyerCompany.user.userID,
        inventory: [ section.section.sectionID ]
    };
    let response = await apiRequest.put(route, pubRequestBody, publisher.user);

    /** Test */
    assert.equal(response.status, 403);

}

/**
 * @case    - 0 sections on negotiation, counter-offer with multiple sections
 * @expect  - 200
 * @route   - PUT deals/active
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_PUT_DEANEG_FUNC_52(assert: test.Test) {

   /** Setup */
    assert.plan(3);

    await databasePopulator.createDSP(DSP_ID);
    let buyerCompany = await databasePopulator.createCompany({}, DSP_ID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let anotherSection = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposalObj = await databasePopulator.createProposal(pubCompany.user.userID, [], { status: 'active' });

    let buyerRequestBody = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: pubCompany.user.userID,
        terms: 'i am a goose'
    };
    await apiRequest.put(route, buyerRequestBody, buyer.user);
    let pubRequestBody = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: buyerCompany.user.userID,
        inventory: [ section.section.sectionID, anotherSection.section.sectionID ]
    };
    let response = await apiRequest.put(route, pubRequestBody, publisher.user);

    /** Test */
    let sectionInDB = await getSectionMappings(proposalObj.proposal.proposalID, buyerCompany.user.userID);
    let sections = await Helper.sectionArrayToPayload(pubRequestBody.inventory);

    assert.equal(response.status, 200);
    assert.same(sectionInDB, pubRequestBody.inventory);
    assert.deepEqual(response.body.data[0].inventory, sections);

}

/**
 * @case    - Multiple sections on negotiation, counter-offer with 0 sections
 * @expect  - 400
 * @route   - PUT deals/active
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_PUT_DEANEG_FUNC_53(assert: test.Test) {

   /** Setup */
    assert.plan(1);

    await databasePopulator.createDSP(DSP_ID);
    let buyerCompany = await databasePopulator.createCompany({}, DSP_ID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let anotherSection = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposalObj = await databasePopulator.createProposal(pubCompany.user.userID,
                                                             [ section.section.sectionID, anotherSection.section.sectionID ],
                                                             { status: 'active' });

    let buyerRequestBody = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: pubCompany.user.userID,
        terms: 'i am a goose'
    };
    await apiRequest.put(route, buyerRequestBody, buyer.user);
    let pubRequestBody = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: buyerCompany.user.userID,
        inventory: []
    };
    let response = await apiRequest.put(route, pubRequestBody, publisher.user);

    /** Test */
    assert.equal(response.status, 400);
}

/**
 * @case    - Multiple sections on negotiation, counter-offer with different sections
 * @expect  - 200
 * @route   - PUT deals/active
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_PUT_DEANEG_FUNC_54(assert: test.Test) {

   /** Setup */
    assert.plan(3);

    await databasePopulator.createDSP(DSP_ID);
    let buyerCompany = await databasePopulator.createCompany({}, DSP_ID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let anotherSection = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposalObj = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ], { status: 'active' });

    let buyerRequestBody = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: pubCompany.user.userID,
        terms: 'i am a goose'
    };
    await apiRequest.put(route, buyerRequestBody, buyer.user);
    let pubRequestBody = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: buyerCompany.user.userID,
        inventory: [ anotherSection.section.sectionID ]
    };
    let response = await apiRequest.put(route, pubRequestBody, publisher.user);

    /** Test */
    let sectionInDB = await getSectionMappings(proposalObj.proposal.proposalID, buyerCompany.user.userID);
    let sections = await Helper.sectionArrayToPayload(pubRequestBody.inventory);

    assert.equal(response.status, 200);
    assert.same(sectionInDB, pubRequestBody.inventory);
    assert.deepEqual(response.body.data[0].inventory, sections);

}

/**
 * @case    - Multiple sections on proposal, counter-offer with same sections
 * @expect  - 403
 * @route   - PUT deals/active
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_PUT_DEANEG_FUNC_55(assert: test.Test) {

   /** Setup */
    assert.plan(1);

    await databasePopulator.createDSP(DSP_ID);
    let buyerCompany = await databasePopulator.createCompany({}, DSP_ID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposalObj = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ], { status: 'active' });

    let buyerRequestBody = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: pubCompany.user.userID,
        terms: 'i am a goose'
    };
    await apiRequest.put(route, buyerRequestBody, buyer.user);

    let pubRequestBody = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: buyerCompany.user.userID,
        inventory: [ section.section.sectionID ]
    };
    let response = await apiRequest.put(route, pubRequestBody, publisher.user);

    /** Test */
    assert.equal(response.status, 403);

}

/**
 * @case    - Buyer negotiate on sections
 * @expect  - 403
 * @route   - PUT deals/active
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_PUT_DEANEG_FUNC_56(assert: test.Test) {

   /** Setup */
    assert.plan(1);

    await databasePopulator.createDSP(DSP_ID);
    let buyerCompany = await databasePopulator.createCompany({}, DSP_ID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposalObj = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ], { status: 'active' });

    let buyerRequestBody = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: pubCompany.user.userID,
        inventory: [ section.section.sectionID ]
    };
    let response = await apiRequest.put(route, buyerRequestBody, buyer.user);

    /** Test */
    assert.equal(response.status, 400);

}

/**
 * @case    - Multiple sections on negotiation, counter-offer with same sections
 * @expect  - 403
 * @route   - PUT deals/active
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_PUT_DEANEG_FUNC_57(assert: test.Test) {

   /** Setup */
    assert.plan(1);

    await databasePopulator.createDSP(DSP_ID);
    let buyerCompany = await databasePopulator.createCompany({}, DSP_ID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let anotherSection = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposalObj = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ], { status: 'active' });

    let buyerRequestBody = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: pubCompany.user.userID,
        terms: 'i am a goose'
    };
    await apiRequest.put(route, buyerRequestBody, buyer.user);

    let pubRequestBody = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: buyerCompany.user.userID,
        inventory: [ anotherSection.section.sectionID ]
    };
    await apiRequest.put(route, pubRequestBody, publisher.user);

    let buyerRequestBody2 = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: pubCompany.user.userID,
        terms: 'i really am'
    };
    await apiRequest.put(route, buyerRequestBody2, buyer.user);

    let response = await apiRequest.put(route, pubRequestBody, publisher.user);

    /** Test */
    assert.equal(response.status, 403);

}

/**
 * @case    - Pub accept a negotiation (proposal created by itself) without sections
 * @expect  - 403
 * @route   - PUT deals/active
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_PUT_DEANEG_FUNC_58(assert: test.Test) {

   /** Setup */
    assert.plan(1);

    await databasePopulator.createDSP(DSP_ID);
    let buyerCompany = await databasePopulator.createCompany({}, DSP_ID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let proposalObj = await databasePopulator.createProposal(pubCompany.user.userID, [], {}, [ buyerCompany.user.userID ]);

    let buyerRequestBody = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: pubCompany.user.userID,
        terms: 'i am a goose'
    };
    await apiRequest.put(route, buyerRequestBody, buyer.user);
    let pubRequestBody = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: buyerCompany.user.userID,
        response: 'accept'
    };
    let response = await apiRequest.put(route, pubRequestBody, publisher.user);

    /** Test */
    assert.equal(response.status, 403);

}

/**
 * @case    - Buyer accept a negotiation (proposal created by partner) without sections
 * @expect  - 403
 * @route   - PUT deals/active
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_PUT_DEANEG_FUNC_59(assert: test.Test) {

   /** Setup */
    assert.plan(1);

    await databasePopulator.createDSP(DSP_ID);
    let buyerCompany = await databasePopulator.createCompany({}, DSP_ID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let proposalObj = await databasePopulator.createProposal(pubCompany.user.userID, [], {}, [ buyerCompany.user.userID ]);

    let buyerRequestBody = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: pubCompany.user.userID,
        terms: 'i am a goose'
    };
    await apiRequest.put(route, buyerRequestBody, buyer.user);

    let pubRequestBody = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: buyerCompany.user.userID,
        terms: 'no you are a duck'
    };
    await apiRequest.put(route, pubRequestBody, publisher.user);

    let buyerRequestBody2 = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: pubCompany.user.userID,
        response: 'accept'
    };
    let response = await apiRequest.put(route, buyerRequestBody2, buyer.user);

    /** Test */
    assert.equal(response.status, 403);

}

/**
 * @case    - Pub accept a negotiation (proposal created by pub) with sections in proposal
 * @expect  - 200
 * @route   - PUT deals/active
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_PUT_DEANEG_FUNC_60(assert: test.Test) {

   /** Setup */
    assert.plan(2);

    await databasePopulator.createDSP(DSP_ID);
    let buyerCompany = await databasePopulator.createCompany({}, DSP_ID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposalObj = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ], { status: 'active' });

    let buyerRequestBody = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: pubCompany.user.userID,
        terms: 'i am a goose'
    };
    await apiRequest.put(route, buyerRequestBody, buyer.user);

    let pubRequestBody = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: buyerCompany.user.userID,
        response: 'accept'
    };
    let response = await apiRequest.put(route, pubRequestBody, publisher.user);

    /** Test */
    let sections = await Helper.sectionArrayToPayload([ section.section.sectionID ]);

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.data[0].inventory, sections);

}

/**
 * @case    - Buyer accept a negotiation (proposal created by pub) with sections in proposal
 * @expect  - 200
 * @route   - PUT deals/active
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_PUT_DEANEG_FUNC_61(assert: test.Test) {

   /** Setup */
    assert.plan(2);

    await databasePopulator.createDSP(DSP_ID);
    let buyerCompany = await databasePopulator.createCompany({}, DSP_ID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposalObj = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ], { status: 'active' });

    let buyerRequestBody = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: pubCompany.user.userID,
        terms: 'i am a goose'
    };
    await apiRequest.put(route, buyerRequestBody, buyer.user);

    let pubRequestBody = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: buyerCompany.user.userID,
        terms: 'cool'
    };
    await apiRequest.put(route, pubRequestBody, publisher.user);

    let buyerRequestBody2 = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: pubCompany.user.userID,
        response: 'accept'
    };
    let response = await apiRequest.put(route, buyerRequestBody2, buyer.user);

    /** Test */
    let sections = await Helper.sectionArrayToPayload([ section.section.sectionID ]);

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.data[0].inventory, sections);

}

/**
 * @case    - Buyer accept a negotiation (proposal created by pub) with sections in negotiation
 * @expect  - 200
 * @route   - PUT deals/active
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_PUT_DEANEG_FUNC_62(assert: test.Test) {

   /** Setup */
    assert.plan(3);

    await databasePopulator.createDSP(DSP_ID);
    let buyerCompany = await databasePopulator.createCompany({}, DSP_ID);
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposalObj = await databasePopulator.createProposal(pubCompany.user.userID, [], {}, [ buyerCompany.user.userID ]);

    let buyerRequestBody = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: pubCompany.user.userID,
        terms: 'i am a goose'
    };
    await apiRequest.put(route, buyerRequestBody, buyerCompany.user);

    let pubRequestBody = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: buyerCompany.user.userID,
        inventory: [ section.section.sectionID ]
    };
    await apiRequest.put(route, pubRequestBody, pubCompany.user);

    let buyerRequestBody2 = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: pubCompany.user.userID,
        response: 'accept'
    };
    let response = await apiRequest.put(route, buyerRequestBody2, buyerCompany.user);

    /** Test */
    let sectionInDB = await getSectionMappings(proposalObj.proposal.proposalID, buyerCompany.user.userID);
    let sections = await Helper.sectionArrayToPayload(pubRequestBody.inventory);

    assert.equal(response.status, 200);
    assert.same(sectionInDB, pubRequestBody.inventory);
    assert.deepEqual(response.body.data[0].inventory, sections);

}

/**
 * @case    - Pub accept a negotiation (proposal created by pub) with sections in negotiation
 * @expect  - 200
 * @route   - PUT deals/active
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_PUT_DEANEG_FUNC_63(assert: test.Test) {

   /** Setup */
    assert.plan(3);

    await databasePopulator.createDSP(DSP_ID);
    let buyerCompany = await databasePopulator.createCompany({}, DSP_ID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposalObj = await databasePopulator.createProposal(pubCompany.user.userID, [], {}, [ buyerCompany.user.userID ]);

    let buyerRequestBody = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: pubCompany.user.userID,
        terms: 'i am a goose'
    };
    await apiRequest.put(route, buyerRequestBody, buyer.user);

    let pubRequestBody = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: buyerCompany.user.userID,
        inventory: [ section.section.sectionID ]
    };
    await apiRequest.put(route, pubRequestBody, publisher.user);

    let buyerRequestBody2 = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: pubCompany.user.userID,
        terms: 'no you are a duck'
    };
    await apiRequest.put(route, buyerRequestBody2, buyer.user);

    let pubRequestBody2 = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: buyerCompany.user.userID,
        response: 'accept'
    };
    let response = await apiRequest.put(route, pubRequestBody2, publisher.user);

    /** Test */
    let sectionInDB = await getSectionMappings(proposalObj.proposal.proposalID, buyerCompany.user.userID);
    let sections = await Helper.sectionArrayToPayload(pubRequestBody.inventory);

    assert.equal(response.status, 200);
    assert.same(sectionInDB, pubRequestBody.inventory);
    assert.deepEqual(response.body.data[0].inventory, sections);

}

/**
 * @case    - Buyer accept a negotiation (proposal created by pub) with sections in both proposal and negotiation
 * @expect  - 200
 * @route   - PUT deals/active
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_PUT_DEANEG_FUNC_64(assert: test.Test) {

   /** Setup */
    assert.plan(3);

    await databasePopulator.createDSP(DSP_ID);
    let buyerCompany = await databasePopulator.createCompany({}, DSP_ID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let anotherSection = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposalObj = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ], { status: 'active' });

    let buyerRequestBody = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: pubCompany.user.userID,
        terms: 'i am a goose'
    };
    await apiRequest.put(route, buyerRequestBody, buyer.user);

    let pubRequestBody = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: buyerCompany.user.userID,
        inventory: [ anotherSection.section.sectionID ]
    };
    await apiRequest.put(route, pubRequestBody, publisher.user);

    let buyerRequestBody2 = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: pubCompany.user.userID,
        response: 'accept'
    };
    let response = await apiRequest.put(route, buyerRequestBody2, buyer.user);

    /** Test */
    let sectionInDB = await getSectionMappings(proposalObj.proposal.proposalID, buyerCompany.user.userID);
    let sections = await Helper.sectionArrayToPayload(pubRequestBody.inventory);

    assert.equal(response.status, 200);
    assert.same(sectionInDB, pubRequestBody.inventory);
    assert.deepEqual(response.body.data[0].inventory, sections);

}

/**
 * @case    - Pub accept a negotiation (proposal created by pub) with sections in both proposal and negotiation
 * @expect  - 200
 * @route   - PUT deals/active
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_PUT_DEANEG_FUNC_65(assert: test.Test) {

   /** Setup */
    assert.plan(3);

    await databasePopulator.createDSP(DSP_ID);
    let buyerCompany = await databasePopulator.createCompany({}, DSP_ID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let anotherSection = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposalObj = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ], { status: 'active' });

    let buyerRequestBody = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: pubCompany.user.userID,
        terms: 'i am a goose'
    };
    await apiRequest.put(route, buyerRequestBody, buyer.user);

    let pubRequestBody = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: buyerCompany.user.userID,
        inventory: [ anotherSection.section.sectionID ]
    };
    await apiRequest.put(route, pubRequestBody, publisher.user);

    let buyerRequestBody2 = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: pubCompany.user.userID,
        terms: 'no you are a duck'
    };
    await apiRequest.put(route, buyerRequestBody2, buyer.user);

    let pubRequestBody2 = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: buyerCompany.user.userID,
        response: 'accept'
    };
    let response = await apiRequest.put(route, pubRequestBody2, publisher.user);

    /** Test */
    let sectionInDB = await getSectionMappings(proposalObj.proposal.proposalID, buyerCompany.user.userID);
    let sections = await Helper.sectionArrayToPayload(pubRequestBody.inventory);

    assert.equal(response.status, 200);
    assert.same(sectionInDB, pubRequestBody.inventory);
    assert.deepEqual(response.body.data[0].inventory, sections);

}

/**
 * @case    - Pub accept a negotiation (proposal created by buyer) without sections
 * @expect  - 403
 * @route   - PUT deals/active
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_PUT_DEANEG_FUNC_66(assert: test.Test) {

   /** Setup */
    assert.plan(1);

    await databasePopulator.createDSP(DSP_ID);
    let buyerCompany = await databasePopulator.createCompany({}, DSP_ID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let proposalObj = await databasePopulator.createProposal(buyerCompany.user.userID, [], {}, [ pubCompany.user.userID ]);

    let pubRequestBody = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: buyerCompany.user.userID,
        terms: 'i am a goose'
    };
    await apiRequest.put(route, pubRequestBody, publisher.user);

    let buyerRequestBody = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: pubCompany.user.userID,
        terms: 'no you are a duck'
    };
    await apiRequest.put(route, buyerRequestBody, buyer.user);

    let pubRequestBody2 = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: buyerCompany.user.userID,
        response: 'accept'
    };
    let response = await apiRequest.put(route, pubRequestBody2, publisher.user);

    /** Test */
    assert.equal(response.status, 403);

}

/**
 * @case    - Buyer accept a negotiation (proposal created by itself) without sections
 * @expect  - 403
 * @route   - PUT deals/active
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_PUT_DEANEG_FUNC_67(assert: test.Test) {

   /** Setup */
    assert.plan(1);

    await databasePopulator.createDSP(DSP_ID);
    let buyerCompany = await databasePopulator.createCompany({}, DSP_ID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let proposalObj = await databasePopulator.createProposal(buyerCompany.user.userID, [], { status: 'active' });

    let pubRequestBody = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: buyerCompany.user.userID,
        terms: 'i am a goose'
    };
    await apiRequest.put(route, pubRequestBody, publisher.user);

    let buyerRequestBody = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: pubCompany.user.userID,
        response: 'accept'
    };
    let response = await apiRequest.put(route, buyerRequestBody, buyer.user);

    /** Test */
    assert.equal(response.status, 403);

}

/**
 * @case    - Buyer accept a negotiation (proposal created by buyer) with sections in negotiation
 * @expect  - 403
 * @route   - PUT deals/active
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_PUT_DEANEG_FUNC_68(assert: test.Test) {

    /** Setup */
    assert.plan(3);

    await databasePopulator.createDSP(DSP_ID);
    let buyerCompany = await databasePopulator.createCompany({}, DSP_ID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposalObj = await databasePopulator.createProposal(buyerCompany.user.userID, [], { status: 'active' });

    let pubRequestBody = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: buyerCompany.user.userID,
        inventory: [ section.section.sectionID ]
    };
    await apiRequest.put(route, pubRequestBody, publisher.user);

    let buyerRequestBody = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: pubCompany.user.userID,
        response: 'accept'
    };
    let response = await apiRequest.put(route, buyerRequestBody, buyer.user);

    /** Test */
    let sectionInDB = await getSectionMappings(proposalObj.proposal.proposalID, pubCompany.user.userID);
    let sections = await Helper.sectionArrayToPayload(pubRequestBody.inventory);

    assert.equal(response.status, 200);
    assert.same(sectionInDB, pubRequestBody.inventory);
    assert.deepEqual(response.body.data[0].inventory, sections);

}

/**
 * @case    - Pub accept a negotiation (proposal created by buyer) with sections in negotiation
 * @expect  - 403
 * @route   - PUT deals/active
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_PUT_DEANEG_FUNC_69(assert: test.Test) {

    /** Setup */
    assert.plan(3);

    await databasePopulator.createDSP(DSP_ID);
    let buyerCompany = await databasePopulator.createCompany({}, DSP_ID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposalObj = await databasePopulator.createProposal(buyerCompany.user.userID, [], { status: 'active' });

    let pubRequestBody = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: buyerCompany.user.userID,
        inventory: [ section.section.sectionID ]
    };
    await apiRequest.put(route, pubRequestBody, publisher.user);

    let buyerRequestBody = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: pubCompany.user.userID,
        terms: 'no you are a duck'
    };
    await apiRequest.put(route, buyerRequestBody, buyer.user);

    let pubRequestBody2 = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: buyerCompany.user.userID,
        response: 'accept'
    };
    let response = await apiRequest.put(route, pubRequestBody2, publisher.user);

    /** Test */
    let sectionInDB = await getSectionMappings(proposalObj.proposal.proposalID, pubCompany.user.userID);
    let sections = await Helper.sectionArrayToPayload(pubRequestBody.inventory);

    assert.equal(response.status, 200);
    assert.same(sectionInDB, pubRequestBody.inventory);
    assert.deepEqual(response.body.data[0].inventory, sections);

}

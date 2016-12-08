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
const route = 'deals/negotiations';
const DSP_ID = 1;
const ANOTHER_DSP_ID = 2;

async function commonDatabaseSetup() {
    let dsp = await databasePopulator.createDSP(123);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);
}

async function getPubStatus(proposalID: number, publisherID: number, buyerID: number): Promise<string> {

    let row = await databaseManager.select('pubStatus')
                .from('ixmDealNegotiations')
                .where('proposalID', proposalID)
                .andWhere('buyerID', buyerID)
                .andWhere('publisherID', publisherID);
    return row[0].pubStatus;

}

async function getBuyerStatus(proposalID: number, publisherID: number, buyerID: number): Promise<string> {

    let row = await databaseManager.select('buyerStatus')
                .from('ixmDealNegotiations')
                .where('proposalID', proposalID)
                .andWhere('buyerID', buyerID)
                .andWhere('publisherID', publisherID);
    return row[0].buyerStatus;

}

/** Generic Authentication Tests */
export let ATW_CO_PUT_AUTH = authenticationTest(route, 'put', commonDatabaseSetup);

 /*
 * @case    - The user does not provide any negotiation fields or a response.
 * @expect  - The API responds with 400.
 * @label   - ATW_API_NEGOTIATION_GENERAL_01
 * @route   - PUT deals/negotiations
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_NEGOTIATION_GENERAL_01 (assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);

    let negotiation = {
        proposal_id: 123,
        partner_id: 123
    };

    /** Test */
    let responseNoOptional = await apiRequest.put(route, negotiation, buyer.user.userID);

    assert.equal(responseNoOptional.status, 400);
}

/*
 * @case    - The user supplies a negotiation field along with the response field.
 * @expect  - The API responds with 400.
 * @label   - ATW_API_NEGOTIATION_GENERAL_02
 * @route   - PUT deals/negotiations
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_NEGOTIATION_GENERAL_02 (assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);

    let negotiation = {
        proposal_id: 123,
        partner_id: 123,
        price: 123,
        response: 'accept'
    };

    /** Test */
    let responseInvalidCombination = await apiRequest.put(route, negotiation, buyer.user.userID);

    assert.equal(responseInvalidCombination.status, 400);
}

/*
 * @case    - The user does not supply a proposalID.
 * @expect  - The API responds with 400.
 * @label   - ATW_API_NEGOTIATION_PROPOSALID_01
 * @route   - PUT deals/negotiations
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_NEGOTIATION_PROPOSALID_01 (assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);

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
    let responseNoOptional = await apiRequest.put(route, negotiation, buyer.user.userID);

    assert.equal(responseNoOptional.status, 400);
}

/*
 * @case    - The user supplies invalid and valid proposalIDs.
 * @expect  - The API responds with 400s for invalid and not with 400s for valid proposalIDs.
 * @label   - ATW_API_COMMON_PROPOSALID
 * @route   - PUT deals/negotiations
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_COMMON_PROPOSALID (assert: test.Test) {

    /** Setup */
    assert.plan(8);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);

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
    let responseNonInt = await apiRequest.put(route, negotiation, buyer.user.userID);

    Object.assign(negotiation, { proposal_id: 0 });
    let responseMinLess = await apiRequest.put(route, negotiation, buyer.user.userID);

    Object.assign(negotiation, { proposal_id: 16777216 });
    let responseMaxMore = await apiRequest.put(route, negotiation, buyer.user.userID);

    Object.assign(negotiation, { proposal_id: '123' });
    let responseStringInt = await apiRequest.put(route, negotiation, buyer.user.userID);

    assert.equal(responseNonInt.status, 400);
    assert.equal(responseMinLess.status, 400);
    assert.equal(responseMaxMore.status, 400);
    assert.equal(responseStringInt.status, 400);

    Object.assign(negotiation, { proposal_id: 1 });
    let responseMin = await apiRequest.put(route, negotiation, buyer.user.userID);

    Object.assign(negotiation, { proposal_id: 16777215 });
    let responseMax = await apiRequest.put(route, negotiation, buyer.user.userID);

    assert.notEqual(responseMin.status, 400);
    assert.notEqual(responseMin.status, 500);
    assert.notEqual(responseMax.status, 400);
    assert.notEqual(responseMax.status, 500);
}

/*
 * @case    - The user supplies invalid and valid partnerIDs.
 * @expect  - The API responds with 400s for invalid and not with 400s for valid partnerIDs.
 * @label   - ATW_API_NEGOTIATION_PARTNERID
 * @route   - PUT deals/negotiations
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_NEGOTIATION_PARTNERID (assert: test.Test) {

    /** Setup */
    assert.plan(8);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);

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
    let responseNonInt = await apiRequest.put(route, negotiation, buyer.user.userID);

    Object.assign(negotiation, { partner_id: 0 });
    let responseMinLess = await apiRequest.put(route, negotiation, buyer.user.userID);

    Object.assign(negotiation, { partner_id: 16777216 });
    let responseMaxMore = await apiRequest.put(route, negotiation, buyer.user.userID);

    Object.assign(negotiation, { partner_id: '123' });
    let responseStringInt = await apiRequest.put(route, negotiation, buyer.user.userID);

    assert.equal(responseNonInt.status, 400);
    assert.equal(responseMinLess.status, 400);
    assert.equal(responseMaxMore.status, 400);
    assert.equal(responseStringInt.status, 400);

    Object.assign(negotiation, { partner_id: 1 });
    let responseMin = await apiRequest.put(route, negotiation, buyer.user.userID);

    Object.assign(negotiation, { partner_id: 16777215 });
    let responseMax = await apiRequest.put(route, negotiation, buyer.user.userID);

    assert.notEqual(responseMin.status, 400);
    assert.notEqual(responseMin.status, 500);
    assert.notEqual(responseMax.status, 400);
    assert.notEqual(responseMax.status, 500);
}

 /*
 * @case    - The user supplies invalid and valid prices.
 * @expect  - The API responds with 400s for invalid and not with 400/500 for valid prices.
 * @label   - ATW_API_NEGOTIATION_PRICE
 * @route   - PUT deals/negotiations
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_NEGOTIATION_PRICE (assert: test.Test) {

    /** Setup */
    assert.plan(10);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);

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
    let responseNonInt = await apiRequest.put(route, negotiation, buyer.user.userID);

    Object.assign(negotiation, { price: 0 });
    let responseMinLess = await apiRequest.put(route, negotiation, buyer.user.userID);

    Object.assign(negotiation, { price: 655.36 });
    let responseMaxMore = await apiRequest.put(route, negotiation, buyer.user.userID);

    Object.assign(negotiation, { price: '123' });
    let responseStringInt = await apiRequest.put(route, negotiation, buyer.user.userID);

    assert.equal(responseNonInt.status, 400);
    assert.equal(responseMinLess.status, 400);
    assert.equal(responseMaxMore.status, 400);
    assert.equal(responseStringInt.status, 400);

    Object.assign(negotiation, { price: 0.01 });
    let responseMin = await apiRequest.put(route, negotiation, buyer.user.userID);

    Object.assign(negotiation, { price: 655.35 });
    let responseMax = await apiRequest.put(route, negotiation, buyer.user.userID);

    assert.notEqual(responseMin.status, 400);
    assert.notEqual(responseMin.status, 500);
    assert.notEqual(responseMax.status, 400);
    assert.notEqual(responseMax.status, 500);

    let optionalNegotiation = {
        proposal_id: 123,
        partner_id: 123,
        price: 123
    };

    let responseOptional = await apiRequest.put(route, optionalNegotiation, buyer.user.userID);

    assert.notEqual(responseOptional.status, 400);
    assert.notEqual(responseOptional.status, 500);
}

 /*
 * @case    - The user supplies invalid and valid impressions.
 * @expect  - The API responds with 400s for invalid and not with 400s for valid impressions.
 * @label   - ATW_API_NEGOTIATION_IMPRESSIONS
 * @route   - PUT deals/negotiations
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_NEGOTIATION_IMPRESSIONS (assert: test.Test) {

    /** Setup */
    assert.plan(10);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);

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
    let responseNonInt = await apiRequest.put(route, negotiation, buyer.user.userID);

    Object.assign(negotiation, { impressions: 0 });
    let responseMinLess = await apiRequest.put(route, negotiation, buyer.user.userID);

    Object.assign(negotiation, { impressions: 16777216 });
    let responseMaxMore = await apiRequest.put(route, negotiation, buyer.user.userID);

    Object.assign(negotiation, { impressions: '123' });
    let responseStringInt = await apiRequest.put(route, negotiation, buyer.user.userID);

    assert.equal(responseNonInt.status, 400);
    assert.equal(responseMinLess.status, 400);
    assert.equal(responseMaxMore.status, 400);
    assert.equal(responseStringInt.status, 400);

    Object.assign(negotiation, { impressions: 1 });
    let responseMin = await apiRequest.put(route, negotiation, buyer.user.userID);
    Object.assign(negotiation, { impressions: 16777215 });
    let responseMax = await apiRequest.put(route, negotiation, buyer.user.userID);

    assert.notEqual(responseMin.status, 400);
    assert.notEqual(responseMin.status, 500);
    assert.notEqual(responseMax.status, 400);
    assert.notEqual(responseMax.status, 500);

    let optionalNegotiation = {
        proposal_id: 123,
        partner_id: 123,
        impressions: 123
    };

    let responseOptional = await apiRequest.put(route, optionalNegotiation, buyer.user.userID);

    assert.notEqual(responseOptional.status, 400);
    assert.notEqual(responseOptional.status, 500);
}

 /*
 * @case    - The user supplies invalid and valid budgets.
 * @expect  - The API responds with 400s for invalid and not with 400s for valid budgets.
 * @label   - ATW_API_NEGOTIATION_BUDGET
 * @route   - PUT deals/negotiations
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_NEGOTIATION_BUDGET (assert: test.Test) {

    /** Setup */
    assert.plan(10);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);

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
    let responseNonInt = await apiRequest.put(route, negotiation, buyer.user.userID);

    Object.assign(negotiation, { budget: 0 });
    let responseMinLess = await apiRequest.put(route, negotiation, buyer.user.userID);

    Object.assign(negotiation, { budget: 16777216 });
    let responseMaxMore = await apiRequest.put(route, negotiation, buyer.user.userID);

    Object.assign(negotiation, { budget: '123' });
    let responseStringInt = await apiRequest.put(route, negotiation, buyer.user.userID);

    assert.equal(responseNonInt.status, 400);
    assert.equal(responseMinLess.status, 400);
    assert.equal(responseMaxMore.status, 400);
    assert.equal(responseStringInt.status, 400);

    Object.assign(negotiation, { budget: 1 });
    let responseMin = await apiRequest.put(route, negotiation, buyer.user.userID);
    Object.assign(negotiation, { budget: 16777215 });
    let responseMax = await apiRequest.put(route, negotiation, buyer.user.userID);

    assert.notEqual(responseMin.status, 400);
    assert.notEqual(responseMin.status, 500);
    assert.notEqual(responseMax.status, 400);
    assert.notEqual(responseMax.status, 500);

    let optionalNegotiation = {
        proposal_id: 123,
        partner_id: 123,
        budget: 123
    };

    let responseOptional = await apiRequest.put(route, optionalNegotiation, buyer.user.userID);

    assert.notEqual(responseOptional.status, 400);
    assert.notEqual(responseOptional.status, 500);
}

/*
 * @case    - The user supplies invalid and valid terms.
 * @expect  - The API responds with 400s for invalid and not with 400s for valid terms.
 * @label   - ATW_API_NEGOTIATION_TERMS
 * @route   - PUT deals/negotiations
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_NEGOTIATION_TERMS (assert: test.Test) {

    /** Setup */
    assert.plan(9);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);

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
    let responseNonString = await apiRequest.put(route, negotiation, buyer.user.userID);

    Object.assign(negotiation, { terms: ('a'.repeat(65536)) });
    let responseMaxMore = await apiRequest.put(route, negotiation, buyer.user.userID);

    Object.assign(negotiation, { terms: '' });
    let responseEmptyString = await apiRequest.put(route, negotiation, buyer.user.userID);

    assert.equal(responseNonString.status, 400);
    assert.equal(responseMaxMore.status, 400);
    assert.equal(responseEmptyString.status, 400);

    Object.assign(negotiation, { terms: 'K' });
    let responseMin = await apiRequest.put(route, negotiation, buyer.user.userID);

    Object.assign(negotiation, { terms: ('a'.repeat(65535)) });
    let responseMax = await apiRequest.put(route, negotiation, buyer.user.userID);

    assert.notEqual(responseMin.status, 400);
    assert.notEqual(responseMin.status, 500);
    assert.notEqual(responseMax.status, 400);
    assert.notEqual(responseMax.status, 500);

    let optionalNegotiation = {
        proposal_id: 123,
        partner_id: 123,
        terms: 'I want goose'
    };

    let responseOptional = await apiRequest.put(route, optionalNegotiation, buyer.user.userID);

    assert.notEqual(responseOptional.status, 400);
    assert.notEqual(responseOptional.status, 500);
}

/*
 * @case    - The user only supplies a start date for the optional fields.
 * @expect  - The API does not respond with 400. The request is valid.
 * @label   - ATW_API_NEGOTIATION_STARTDATE
 * @route   - PUT deals/negotiations
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_NEGOTIATION_STARTDATE (assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);

    let optionalNegotiation = {
        proposal_id: 123,
        partner_id: 123,
        start_date: '2016-10-21'
    };

    /** Test */
    let responseOptional = await apiRequest.put(route, optionalNegotiation, buyer.user.userID);

    assert.notEqual(responseOptional.status, 400);
    assert.notEqual(responseOptional.status, 500);
}

/*
 * @case    - The user supplies invalid and valid start dates.
 * @expect  - The API responds with 400s for invalid and not with 400s for valid start dates.
 * @label   - ATW_API_COMMON_STARTDATE
 * @route   - PUT deals/negotiations
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_COMMON_STARTDATE (assert: test.Test) {

    /** Setup */
    assert.plan(9);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);

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
    let responseZeroDate = await apiRequest.put(route, negotiation, buyer.user.userID);

    Object.assign(negotiation, { start_date: '999-12-31' });
    let responseMinLess = await apiRequest.put(route, negotiation, buyer.user.userID);

    Object.assign(negotiation, { start_date: '10000-01-01' });
    let responseMaxMore = await apiRequest.put(route, negotiation, buyer.user.userID);

    Object.assign(negotiation, { start_date: '10-31-2016' });
    let responseWrongFormat = await apiRequest.put(route, negotiation, buyer.user.userID);

    Object.assign(negotiation, { start_date: 'goose' });
    let responseNonDate = await apiRequest.put(route, negotiation, buyer.user.userID);

    assert.equal(responseZeroDate.status, 400);
    assert.equal(responseMinLess.status, 400);
    assert.equal(responseMaxMore.status, 400);
    assert.equal(responseWrongFormat.status, 400);
    assert.equal(responseNonDate.status, 400);

    Object.assign(negotiation, { start_date: '1000-01-01' });
    let responseMin = await apiRequest.put(route, negotiation, buyer.user.userID);

    Object.assign(negotiation, { start_date: '9999-12-31' });
    let responseMax = await apiRequest.put(route, negotiation, buyer.user.userID);

    assert.notEqual(responseMin.status, 400);
    assert.notEqual(responseMin.status, 500);
    assert.notEqual(responseMax.status, 400);
    assert.notEqual(responseMax.status, 500);
}

/*
 * @case    - The user only supplies an end date for the optional fields.
 * @expect  - The API does not respond with 400. The request is valid.
 * @label   - ATW_API_NEGOTIATION_ENDDATE
 * @route   - PUT deals/negotiations
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_NEGOTIATION_ENDDATE (assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);

    let optionalNegotiation = {
        proposal_id: 123,
        partner_id: 123,
        end_date: '2016-10-21'
    };

    /** Test */
    let responseOptional = await apiRequest.put(route, optionalNegotiation, buyer.user.userID);

    assert.notEqual(responseOptional.status, 400);
    assert.notEqual(responseOptional.status, 500);
}

/*
 * @case    - The user supplies invalid and valid end dates.
 * @expect  - The API responds with 400s for invalid and not with 400s for valid end dates.
 * @label   - ATW_API_COMMON_ENDDATE
 * @route   - PUT deals/negotiations
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_COMMON_ENDDATE (assert: test.Test) {

    /** Setup */
    assert.plan(9);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);

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
    let responseZeroDate = await apiRequest.put(route, negotiation, buyer.user.userID);

    Object.assign(negotiation, { end_date: '999-12-31' });
    let responseMinLess = await apiRequest.put(route, negotiation, buyer.user.userID);

    Object.assign(negotiation, { end_date: '10000-01-01' });
    let responseMaxMore = await apiRequest.put(route, negotiation, buyer.user.userID);

    Object.assign(negotiation, { end_date: '10-31-2016' });
    let responseWrongFormat = await apiRequest.put(route, negotiation, buyer.user.userID);

    Object.assign(negotiation, { end_date: 'goose' });
    let responseNonDate = await apiRequest.put(route, negotiation, buyer.user.userID);

    assert.equal(responseZeroDate.status, 400);
    assert.equal(responseMinLess.status, 400);
    assert.equal(responseMaxMore.status, 400);
    assert.equal(responseWrongFormat.status, 400);
    assert.equal(responseNonDate.status, 400);

    Object.assign(negotiation, { end_date: '1000-01-01' });
    let responseMin = await apiRequest.put(route, negotiation, buyer.user.userID);

    Object.assign(negotiation, { end_date: '9999-12-31' });
    let responseMax = await apiRequest.put(route, negotiation, buyer.user.userID);

    assert.notEqual(responseMin.status, 400);
    assert.notEqual(responseMin.status, 500);
    assert.notEqual(responseMax.status, 400);
    assert.notEqual(responseMax.status, 500);
}

/*
 * @case    - The user supplies invalid and valid response fields.
 * @expect  - The API responds with 400s for invalid and not with 400s for valid response fields.
 * @label   - ATW_API_NEGOTIATION_RESPONSE
 * @route   - PUT deals/negotiations
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_NEGOTIATION_RESPONSE (assert: test.Test) {

    /** Setup */
    assert.plan(7);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);

    let negotiation = {
        proposal_id: 123,
        partner_id: 123
    };

    /** Test */
    Object.assign(negotiation, { response: 123 });
    let responseNonString = await apiRequest.put(route, negotiation, buyer.user.userID);

    Object.assign(negotiation, { response: '' });
    let responseEmptyString = await apiRequest.put(route, negotiation, buyer.user.userID);

    Object.assign(negotiation, { response: 'goose' });
    let responseNonOption = await apiRequest.put(route, negotiation, buyer.user.userID);

    assert.equal(responseNonString.status, 400);
    assert.equal(responseEmptyString.status, 400);
    assert.equal(responseNonOption.status, 400);

    Object.assign(negotiation, { response: 'AcCePt' });
    let responseAccept = await apiRequest.put(route, negotiation, buyer.user.userID);

    Object.assign(negotiation, { response: 'rEjEcT' });
    let responseReject = await apiRequest.put(route, negotiation, buyer.user.userID);

    assert.notEqual(responseAccept.status, 400);
    assert.notEqual(responseAccept.status, 500);
    assert.notEqual(responseReject.status, 400);
    assert.notEqual(responseReject.status, 500);
}

/*
 * @case    - Publisher start a negotiation with its own proposal.
 * @expect  - 403 Forbidden, publisher cannot start a new negotiation on its own proposal
 * @route   - PUT deals/negotiations
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_NEGOTIATION_PUBLISHER_01_01(assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposalObj = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID], { status: 'active' });

    /** Test */
    let requestBody = {
            proposal_id: proposalObj.proposal.proposalID,
            partner_id: publisher.user.userID,
            terms: 'Are you a goose'
    };
    let response = await apiRequest.put(route, requestBody, publisher.user.userID);

    assert.equal(response.status, 403);
}

/*
 * @case    - Publisher start a negotiation on a buyer's proposal
 * @expect  - 200 - Success
 * @route   - PUT deals/negotiations
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_NEGOTIATION_PUBLISHER_01_02(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(123);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposalObj = await databasePopulator.createProposal(buyer.user.userID, [section.section.sectionID], { status: 'active' });

    /** Test */
    let requestBody = {
            proposal_id: proposalObj.proposal.proposalID,
            partner_id: buyer.user.userID,
            terms: 'Are you a goose'
    };
    let response = await apiRequest.put(route, requestBody, publisher.user.userID);

    assert.equal(response.status, 200);
    assert.equal(response.body.data[0].terms, 'Are you a goose');
}

/*
 * @case    - Publisher send a negotiation to a buyer.
 * @expect  - 200 OK, negotiated field changes
 * @route   - PUT deals/negotiations
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_NEGOTIATION_PUBLISHER_02_01(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyer = await databasePopulator.createBuyer(DSP_ID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposalObj = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID], { status: 'active' });
    let buyerRequestBody = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: publisher.user.userID,
        terms: 'i am a goose'
    };
    await apiRequest.put(route, buyerRequestBody, buyer.user.userID);

    /** Test */
    let pubRequestBody = {
            proposal_id: proposalObj.proposal.proposalID,
            partner_id: buyer.user.userID,
            terms: 'no you are a duck'
    };
    let response = await apiRequest.put(route, pubRequestBody, publisher.user.userID);

    assert.equal(response.status, 200);
    assert.equal(response.body.data[0].terms, 'no you are a duck');
}

/*
 * @case    - Publisher send second offer before buyer reply
 * @expect  - 403 Forbidden, publisher out of turn
 * @route   - PUT deals/negotiations
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_NEGOTIATION_PUBLISHER_02_02(assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyer = await databasePopulator.createBuyer(DSP_ID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposalObj = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID], { status: 'active' });

    let buyerRequestBody = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: buyer.user.userID,
        terms: 'i am a goose'
    };
    await apiRequest.put(route, buyerRequestBody, buyer.user.userID);

    let pubRequestBody1 = {
            proposal_id: proposalObj.proposal.proposalID,
            partner_id: buyer.user.userID,
            terms: 'no you are a duck'
    };
    await apiRequest.put(route, pubRequestBody1, publisher.user.userID);

    /** Test */
    let pubRequestBody2 = {
            proposal_id: proposalObj.proposal.proposalID,
            partner_id: buyer.user.userID,
            terms: 'ok maybe you are a goose'
    };
    let response = await apiRequest.put(route, pubRequestBody2, publisher.user.userID);

    assert.equal(response.status, 403);
}

 /*
 * @case    - A publisher sends an offer for other pub's proposal.
 * @expect  - 403 Forbidden, pub cannot negotiate with other pubs
 * @route   - PUT deals/negotiations
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_NEGOTIATION_PUBLISHER_03_ (assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyer = await databasePopulator.createBuyer(DSP_ID);
    let publisher = await databasePopulator.createPublisher();
    let annoyingPublisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposalObj = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID], { status: 'active' });

    /** Test */
    let pubRequestBody = {
            proposal_id: proposalObj.proposal.proposalID,
            partner_id: publisher.user.userID,
            terms: 'hello other pub'
    };
    let response = await apiRequest.put(route, pubRequestBody, annoyingPublisher.user.userID);

    assert.equal(response.status, 403);

}

 /*
 * @case    - Publisher sends offer to a negotiation with a wrong buyerID
 * @expect  - 403 Forbidden, publisher cannot start negotiation on its own proposal
 * @route   - PUT deals/negotiations
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_NEGOTIATION_PUBLISHER_04(assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyer = await databasePopulator.createBuyer(DSP_ID);
    let innocentBuyer = await databasePopulator.createBuyer(DSP_ID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposalObj = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID], { status: 'active' });

    /** Test */
    let buyerRequestBody = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: publisher.user.userID,
        terms: 'i am a goose'
    };
    await apiRequest.put(route, buyerRequestBody, buyer.user.userID);

    let pubRequestBody = {
            proposal_id: proposalObj.proposal.proposalID,
            partner_id: innocentBuyer.user.userID,
            terms: 'i have no idea what I am doing'
    };
    let response = await apiRequest.put(route, pubRequestBody, publisher.user.userID);

    assert.equal(response.status, 403);

}

 /*
 * @case    - Buyer sends an offer to a proposal
 * @expect  - 200 OK, negotiated filed changes
 * @route   - PUT deals/negotiations
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_NEGOTIATION_BUYER_01(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyer = await databasePopulator.createBuyer(DSP_ID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposalObj = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID], { status: 'active' });

    /** Test */
    let requestBody = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: publisher.user.userID,
        terms: 'i am a goose'
    };
    let response = await apiRequest.put(route, requestBody, buyer.user.userID);

    assert.equal(response.status, 200);
    assert.equal(response.body.data[0].terms, 'i am a goose');

}

/*
 * @case    - Buyer send a getotiation to an existing negotiation
 * @expect  - 200 OK, negotiated filed changes
 * @route   - PUT deals/active
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_NEGOTIATION_BUYER_02_01(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyer = await databasePopulator.createBuyer(DSP_ID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposalObj = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID], { status: 'active' });

    let buyerRequestBody1 = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: publisher.user.userID,
        terms: 'i am a goose'
    };
    await apiRequest.put(route, buyerRequestBody1, buyer.user.userID);
    let pubRequestBody = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: buyer.user.userID,
        terms: 'no you are a duck'
    };
    await apiRequest.put(route, pubRequestBody, publisher.user.userID);

    /** Test */
    let buyerRequestBody2 = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: publisher.user.userID,
        terms: 'honk honk honk'
    };
    let response = await apiRequest.put(route, buyerRequestBody2, buyer.user.userID);

    assert.equal(response.status, 200);
    assert.equal(response.body.data[0].terms, 'honk honk honk');
}

 /*
 * @case    - Buyer sends an offer to a negotiation before publisher reply to its previous offer
 * @expect  - 403 Forbidden, buyer out of turn
 * @route   - PUT deals/negotiations
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_NEGOTIATION_BUYER_02_02(assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyer = await databasePopulator.createBuyer(DSP_ID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposalObj = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID], { status: 'active' });

    let buyerRequestBody1 = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: publisher.user.userID,
        terms: 'i am a goose'
    };
    await apiRequest.put(route, buyerRequestBody1, buyer.user.userID);

    /** Test */
    let buyerRequestBody2 = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: publisher.user.userID,
        terms: 'honk honk honk'
    };
    let response = await apiRequest.put(route, buyerRequestBody2, buyer.user.userID);

    assert.equal(response.status, 403);

}

 /*
 * @case    - Different buyers negotiate on the same proposal do not effect each other.
 * @expect  - 200 OK, another negotiation created
 * @route   - PUT deals/negotiations
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_NEGOTIATION_BUYER_04(assert: test.Test) {

    /** Setup */
    assert.plan(3);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyer1 = await databasePopulator.createBuyer(DSP_ID);
    let anotherDsp = await databasePopulator.createDSP(ANOTHER_DSP_ID);
    let buyer2 = await databasePopulator.createBuyer(ANOTHER_DSP_ID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposalObj = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID], { status: 'active' });

    let buyerOneRequest = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: publisher.user.userID,
        terms: 'i am a montreal goose'
    };
    let buyerOneResponse = await apiRequest.put(route, buyerOneRequest, buyer1.user.userID);

    /** Test */
    let buyerTwoRequest = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: publisher.user.userID,
        terms: 'i am a toronto goose'
    };
    let buyerTwoResponse = await apiRequest.put(route, buyerTwoRequest, buyer2.user.userID);

    assert.equal(buyerTwoResponse.status, 200);
    assert.equal(buyerOneResponse.body.data[0].terms, 'i am a montreal goose');
    assert.equal(buyerTwoResponse.body.data[0].terms, 'i am a toronto goose');

}

 /*
 * @case    - Buyer cannot reopen the negotiation after pub rejected.
 * @expect  - 403, buyer status accepted, pub status rejected
 * @route   - PUT deals/negotiations
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_NEGOTIATION_STATE_01_01(assert: test.Test) {

    /** Setup */
    assert.plan(3);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyer = await databasePopulator.createBuyer(DSP_ID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposalObj = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID], { status: 'active' });

    let buyerRequestBody1 = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: publisher.user.userID,
        terms: 'i am a goose'
    };
    await apiRequest.put(route, buyerRequestBody1, buyer.user.userID);

    let publisherRequestBody = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: buyer.user.userID,
        response: 'reject'
    };
    await apiRequest.put(route, publisherRequestBody, publisher.user.userID);

    /** Test */
    let buyerRequestBody2 = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: publisher.user.userID,
        terms: 'honk honk honk'
    };
    let response = await apiRequest.put(route, buyerRequestBody2, buyer.user.userID);

    let actualPubStatus = await getPubStatus(proposalObj.proposal.proposalID, publisher.user.userID, buyer.user.userID);
    let actualBuyerStatus = await getBuyerStatus(proposalObj.proposal.proposalID, publisher.user.userID, buyer.user.userID);

    assert.equal(response.status, 403);
    assert.equal(actualPubStatus, 'rejected');
    assert.equal(actualBuyerStatus, 'accepted');
}

/*
 * @case    - Pub cannot reopen the negotiation after buyer rejected.
 * @expect  - 403, buyer status rejected, pub status accepted
 * @route   - PUT deals/negotiations
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_NEGOTIATION_STATE_02_02(assert: test.Test) {

    /** Setup */
    assert.plan(3);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyer = await databasePopulator.createBuyer(DSP_ID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposalObj = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID], { status: 'active' });

    let buyerRequestBody1 = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: publisher.user.userID,
        terms: 'i am a goose'
    };
    await apiRequest.put(route, buyerRequestBody1, buyer.user.userID);

    let pubRequestBody1 = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: buyer.user.userID,
        terms: 'no you are a duck'
    };
    await apiRequest.put(route, pubRequestBody1, publisher.user.userID);

    let buyerRequestBody2 = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: publisher.user.userID,
        response: 'reject'
    };
    await apiRequest.put(route, buyerRequestBody2, buyer.user.userID);

    /** Test */
    let pubRequestBody2 = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: buyer.user.userID,
        terms: 'ok maybe you are a goose'
    };
    let response = await apiRequest.put(route, pubRequestBody2, publisher.user.userID);

    let actualPubStatus = await getPubStatus(proposalObj.proposal.proposalID, publisher.user.userID, buyer.user.userID);
    let actualBuyerStatus = await getBuyerStatus(proposalObj.proposal.proposalID, publisher.user.userID, buyer.user.userID);

    assert.equal(response.status, 403);
    assert.equal(actualBuyerStatus, 'rejected');
    assert.equal(actualPubStatus, 'accepted');
}

/*
 * @case    - Buyer send an offer to an accepted negotiation
 * @expect  - 403 Forbidden, buyer cannot send an offer to an accepted negotiation
 * @route   - PUT deals/negotiations
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_NEGOTIATION_STATE_03_01(assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyer = await databasePopulator.createBuyer(DSP_ID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposalObj = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID], { status: 'active' });

    let buyerRequestBody1 = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: publisher.user.userID,
        terms: 'i am a goose'
    };
    await apiRequest.put(route, buyerRequestBody1, buyer.user.userID);

    let pubRequestBody = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: buyer.user.userID,
        response: 'accept'
    };
    await apiRequest.put(route, pubRequestBody, publisher.user.userID);

    /** Test */
    let buyerRequestBody2 = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: publisher.user.userID,
        terms: 'honk honk honk'
    };
    let response = await apiRequest.put(route, buyerRequestBody2, buyer.user.userID);

    assert.equal(response.status, 403);
}

/*
 * @case    - Publisher send an offer to an accepted negotiation
 * @expect  - 403 Forbidden, pub cannot send an offer to an accepted negotiation
 * @route   - PUT deals/negotiations
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_NEGOTIATION_STATE_03_02(assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyer = await databasePopulator.createBuyer(DSP_ID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposalObj = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID], { status: 'active' });

    let buyerRequestBody = {
        proposal_id: proposalObj.proposal.proposalID,
        terms: 'i am a goose'
    };
    await apiRequest.put(route, buyerRequestBody, buyer.user.userID);

    let pubRequestBody1 = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: buyer.user.userID,
        response: 'accept'
    };
    await apiRequest.put(route, pubRequestBody1, publisher.user.userID);

    /** Test */
    let pubRequestBody2 = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: buyer.user.userID,
        terms: 'no you are a duck'
    };
    let response = await apiRequest.put(route, pubRequestBody2, publisher.user.userID);

    assert.equal(response.status, 403);
}

/*
 * @case    - Buyer try to reject a negotiation that doesn't exist
 * @expect  - 403 Forbidden, cannot reject a negotiation that doesn't exist
 * @route   - PUT deals/negotiations
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_NEGOTIATION_STATE_04_01(assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyer = await databasePopulator.createBuyer(DSP_ID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposalObj = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID], { status: 'active' });

    /** Test */
    let buyerRequestBody = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: publisher.user.userID,
        response: 'reject'
    };
    let response = await apiRequest.put(route, buyerRequestBody, buyer.user.userID);

    assert.equal(response.status, 403);
}

/*
 * @case    - Publisher try to reject a negotiation that doesn't exist
 * @expect  - 403 Forbidden, cannot reject a negotiation that doesn't exist
 * @route   - PUT deals/negotiations
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_NEGOTIATION_STATE_04_02(assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyer = await databasePopulator.createBuyer(DSP_ID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposalObj = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID], { status: 'active' });

    /** Test */
    let pubRequestBody = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: buyer.user.userID,
        response: 'reject'
    };
    let response = await apiRequest.put(route, pubRequestBody, publisher.user.userID);

    assert.equal(response.status, 403);
}

/*
 * @case    - The buyer sends a counter-offer to a proposal that doesn't exist.
 * @expect  - 404 Not Found, cannot found a non-existing proposal
 * @route   - PUT deals/negotiations
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_NEGOTIATION_PROPOSAL_01(assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyer = await databasePopulator.createBuyer(DSP_ID);
    let publisher = await databasePopulator.createPublisher();
    let fakeProposalID = 2333;

    /** Test */
    let buyerRequestBody = {
        proposal_id: fakeProposalID,
        partner_id: publisher.user.userID,
        terms: 'i am a goose'
    };
    let response = await apiRequest.put(route, buyerRequestBody, buyer.user.userID);

    assert.equal(response.status, 404);
}

/*
 * @case    - The buyer sends a counter-offer with a non-numeric proposal id	
 * @expect  - 400 Bad Request, proposal id has to be a number
 * @route   - PUT deals/negotiations
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_NEGOTIATION_PROPOSAL_02_01(assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyer = await databasePopulator.createBuyer(DSP_ID);
    let publisher = await databasePopulator.createPublisher();
    let fakeProposalID = 'gooseID';

    /** Test */
    let buyerRequestBody = {
        proposal_id: fakeProposalID,
        partner_id: publisher.user.userID,
        terms: 'i am a goose'
    };
    let response = await apiRequest.put(route, buyerRequestBody, buyer.user.userID);

    assert.equal(response.status, 400);
}

/*
 * @case    - The buyer sends a counter-offer with no proposal id.	
 * @expect  - 400 Bad Request, a request has to have a proposal id
 * @route   - PUT deals/negotiations
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_NEGOTIATION_PROPOSAL_02_02(assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyer = await databasePopulator.createBuyer(DSP_ID);
    let publisher = await databasePopulator.createPublisher();

    /** Test */
    let buyerRequestBody = {
        partner_id: publisher.user.userID,
        terms: 'i am a goose'
    };
    let response = await apiRequest.put(route, buyerRequestBody, buyer.user.userID);

    assert.equal(response.status, 400);
}

/*
 * @case    - The buyer sends a counter-offer for an inactive proposal.		
 * @expect  - 404 Proposal not found - proposal 'dooes not exist' to user
 * @route   - PUT deals/negotiations
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_NEGOTIATION_PROPOSAL_03(assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyer = await databasePopulator.createBuyer(DSP_ID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID], { status: 'deleted' });

    /** Test */
    let buyerRequestBody = {
        proposal_id: proposal.proposal.proposalID,
        partner_id: publisher.user.userID,
        terms: 'i am a goose'
    };
    let response = await apiRequest.put(route, buyerRequestBody, buyer.user.userID);

    assert.equal(response.status, 404);
}

/*
 * @case    - The buyer sends a counter-offer for an invalid proposal (no active sections). 	
 * @expect  - 404 Proposal not found - proposal 'dooes not exist' to user
 * @route   - PUT deals/negotiations
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_NEGOTIATION_PROPOSAL_04_01(assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyer = await databasePopulator.createBuyer(DSP_ID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID], { status: 'D' });
    let proposalObj = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);

    /** Test */
    let buyerRequestBody = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: publisher.user.userID,
        terms: 'i am a goose'
    };
    let response = await apiRequest.put(route, buyerRequestBody, buyer.user.userID);

    assert.equal(response.status, 404);
}

/*
 * @case    - The buyer sends a counter-offer for an invalid proposal (no active sites). 	
 * @expect  - 404 Proposal not found - proposal 'dooes not exist' to user
 * @route   - PUT deals/negotiations
 * @status  - working
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_NEGOTIATION_PROPOSAL_04_02(assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyer = await databasePopulator.createBuyer(DSP_ID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID, { status: 'D' });
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposalObj = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);

    /** Test */
    let buyerRequestBody = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: publisher.user.userID,
        terms: 'i am a goose'
    };
    let response = await apiRequest.put(route, buyerRequestBody, buyer.user.userID);

    assert.equal(response.status, 404);
}

/**
 * @case    - The buyer can reject a negotiation out of turn, but cannot reject again.
 * @expect  - 200 and 403
 * @route   - PUT deals/negotiations
 * @status  - working
 * @tags    - put, negotiations, deals, reject
 */
export async function ATW_API_NEGOTIATION_PROPOSAL_04_03(assert: test.Test) {

    /** Setup */
    assert.plan(3);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyer = await databasePopulator.createBuyer(DSP_ID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposalObj = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);

    let buyerRequestBody1 = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: publisher.user.userID,
        terms: 'i am a goose'
    };
    let response1 = await apiRequest.put(route, buyerRequestBody1, buyer.user.userID);

    // Test
    let buyerRequestBody2 = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: publisher.user.userID,
        response: 'reject'
    };
    let response2 = await apiRequest.put(route, buyerRequestBody2, buyer.user.userID);
    let response3 = await apiRequest.put(route, buyerRequestBody2, buyer.user.userID);

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
export async function ATW_API_NEGOTIATION_PROPOSAL_04_04(assert: test.Test) {

    /** Setup */
    assert.plan(4);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyer = await databasePopulator.createBuyer(DSP_ID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposalObj = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);

    let buyerRequestBody1 = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: publisher.user.userID,
        terms: 'i am a goose'
    };
    let response1 = await apiRequest.put(route, buyerRequestBody1, buyer.user.userID);

    let publisherRequestBody1 = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: buyer.user.userID,
        terms: 'i am a goober'
    };
    let response2 = await apiRequest.put(route, publisherRequestBody1, publisher.user.userID);

    // Test
    let publisherRequestBody2 = {
        proposal_id: proposalObj.proposal.proposalID,
        partner_id: buyer.user.userID,
        response: 'reject'
    };
    let response3 = await apiRequest.put(route, publisherRequestBody2, publisher.user.userID);
    let response4 = await apiRequest.put(route, publisherRequestBody2, publisher.user.userID);

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
 export async function ATW_API_NEGOTIATION_PROPOSAL_04_05(assert: test.Test) {

     /** Setup */
     assert.plan(1);

     let dsp = await databasePopulator.createDSP(DSP_ID);
     let buyer = await databasePopulator.createBuyer(DSP_ID);
     let proposalOwnerBuyer = await databasePopulator.createBuyer(DSP_ID);
     let publisher = await databasePopulator.createPublisher();
     let site = await databasePopulator.createSite(publisher.publisher.userID);
     let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
     let proposalObj = await databasePopulator.createProposal(proposalOwnerBuyer.user.userID, [section.section.sectionID]);

     let requestBody = {
         proposal_id: proposalObj.proposal.proposalID,
         partner_id: proposalOwnerBuyer.user.userID,
         terms: 'i am a goose'
     };

     let response = await apiRequest.put(route, requestBody, buyer.user.userID);

     assert.equal(response.status, 403);

 }

 /**
  * @case    - A publisher tries to start a negotiation on a proposal owned by another publisher 
  * @expect  - 403 - cannot do that
  * @route   - PUT deals/negotiations
  * @status  - working
  * @tags    - put, negotiations, deals, reject
  */
 export async function ATW_API_NEGOTIATION_PROPOSAL_04_06(assert: test.Test) {

     /** Setup */
     assert.plan(1);

     let publisher = await databasePopulator.createPublisher();
     let proposalOwnerPublisher = await databasePopulator.createPublisher();
     let site = await databasePopulator.createSite(publisher.publisher.userID);
     let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
     let proposalObj = await databasePopulator.createProposal(proposalOwnerPublisher.user.userID, [section.section.sectionID]);

     let requestBody = {
         proposal_id: proposalObj.proposal.proposalID,
         partner_id: proposalOwnerPublisher.user.userID,
         terms: 'i am a goose'
     };

     let response = await apiRequest.put(route, requestBody, publisher.user.userID);

     assert.equal(response.status, 403);

 }

/*
 * @case    - The buyer is not targeted by proposal it is trying to negotiate but another buyer is 
 * @setup   - create dsp, create buyer, create publisher, create site , create section
 *  create proposal, create user targeting
 * @expect  - 404 - Buyer is not able to negotiate  
 * @route   - PUT deals/negotations
 * @status  - working
 * @tags    - put, negotations, proposal, targeting
 */

export async function ATW_API_NEGOTIATION_TARGETED_05_01(assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyer1 = await databasePopulator.createBuyer(DSP_ID);
    let buyer2 = await databasePopulator.createBuyer(DSP_ID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID], {},
                                                          [buyer2.user.userID]);

    let buyer1RequestBody = {
        proposal_id: proposal.proposal.proposalID,
        partner_id: publisher.user.userID,
        terms: 'i am a goose'
    };

    let response = await apiRequest.put(route, buyer1RequestBody, buyer1.user.userID);

    assert.equal(response.status, 404);
    assert.deepEqual(response.body.data, []);

}

/*
 * @case    - The publisher is not targeted by proposal it is trying to negotiate but another publisher is 
 * @setup   - create dsp, create buyer, create publisher, create site , create section
 *  create proposal, create user targeting
 * @expect  - 404 - publisher is not able to negotiate  
 * @route   - PUT deals/negotations
 * @status  - working
 * @tags    - put, negotations, proposal, targeting
 */

export async function ATW_API_NEGOTIATION_TARGETED_05_02(assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyer = await databasePopulator.createBuyer(DSP_ID);
    let publisher1 = await databasePopulator.createPublisher();
    let publisher2 = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher2.publisher.userID);
    let section = await databasePopulator.createSection(publisher2.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(buyer.user.userID, [section.section.sectionID], {},
                                                          [publisher2.user.userID]);

    let publisher1RequestBody = {
        proposal_id: proposal.proposal.proposalID,
        partner_id: buyer.user.userID,
        terms: 'i am a goose'
    };

    let response = await apiRequest.put(route, publisher1RequestBody, publisher1.user.userID);

    assert.equal(response.status, 404);
    assert.deepEqual(response.body.data, []);
}

/*
 * @case    - The buyer is targeted by proposal it is trying to negotiate
 * @setup   - create dsp, create buyer, create publisher, create site , create section,
 *  create proposal, create user targeting
 * @expect  - 200 - Counter offer sent   
 * @route   - PUT deals/negotations
 * @status  - working
 * @tags    - put, negotations, proposal, targeting
 */

export async function ATW_API_NEGOTIATION_TARGETED_05_03(assert: test.Test) {

    assert.plan(1);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyer = await databasePopulator.createBuyer(DSP_ID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.user.userID, [section.section.sectionID], {}
                                                          [buyer.user.userID]);

    let buyerRequestBody = {
        proposal_id: proposal.proposal.proposalID,
        partner_id: publisher.user.userID,
        terms: 'i am a goose'
    };

    let response = await apiRequest.put(route, buyerRequestBody, buyer.user.userID);

    assert.equal(response.status, 200);

}

/*
 * @case    - The publisher is targeted by proposal it is trying to negotiate
 * @setup   - create dsp, create buyer, create publisher, create site , create section,
 *   create proposal, create user targeting 
 * @expect  - 200 - Counter offer sent   
 * @route   - PUT deals/negotations
 * @status  - working
 * @tags    - put, negotations, proposal, targeting
 */

export async function ATW_API_NEGOTIATION_TARGETED_05_04(assert: test.Test) {

    assert.plan(1);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyer = await databasePopulator.createBuyer(DSP_ID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(buyer.user.userID, [section.section.sectionID], {},
                                                          [publisher.user.userID]);

    let publisherRequestBody = {
        proposal_id: proposal.proposal.proposalID,
        partner_id: buyer.user.userID,
        terms: 'i am a goose'
    };

    let response = await apiRequest.put(route, publisherRequestBody, publisher.user.userID);

    assert.equal(response.status, 200);

}

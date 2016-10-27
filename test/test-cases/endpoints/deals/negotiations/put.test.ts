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

async function commonDatabaseSetup() {
    let dsp = await databasePopulator.createDSP(123);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);
}

/** Generic Authentication Tests */
export let ATW_CO_PUT_AUTH = authenticationTest(route, 'put', commonDatabaseSetup);

 /*
 * @case    - The user does not provide any negotiation fields or a response.
 * @expect  - The API responds with 400.
 * @label   - ATW_API_NEGOTIATION_GENERAL_1
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
 * @label   - ATW_API_NEGOTIATION_GENERAL_2
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
 * @label   - ATW_API_NEGOTIATION_PROPOSALID_1
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

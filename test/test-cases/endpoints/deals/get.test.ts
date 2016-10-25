'use strict';

import * as test from 'tape';

import { authenticationTest } from '../../common/auth.test';
import { paginationTest } from '../../common/pagination.test';

import { Injector } from '../../../src/lib/injector';
import { APIRequestManager } from '../../../src/lib/request-manager';
import { DatabasePopulator } from '../../../src/lib/database-populator';
import { Helper } from '../../../src/lib/helper';

const databasePopulator = Injector.request<DatabasePopulator>('DatabasePopulator');
const apiRequest = Injector.request<APIRequestManager>('APIRequestManager');

/** Test constants */
const route = 'deals';

async function authDatabaseSetup() {
    let dsp = await databasePopulator.createDSP(123);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);
}

async function paginationDatabaseSetup() {
    let dsp = await databasePopulator.createDSP(123);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
}

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
 * @route   - GET deals
 * @status  - working
 * @tags    - get, deals, auth
 */
/** Generic Authentication Tests */
export let ATW_PA_GET_AUTH = authenticationTest(route, 'get', authDatabaseSetup);

/*
 * @case    - Different pagination parameters are attempted.
 * @expect  - Pagination tests to pass.
 * @route   - GET deals
 * @status  - working
 * @tags    - get, deals, auth
 */
/** Generic Pagination Tests */
export let ATW_PA_GET_PAG = paginationTest(route, 'get', paginationDatabaseSetup, createProposal);


 /*
 * @case    - The buyer sends a GET request to view active proposals.
 * @expect  - The buyer should receive the defined proposal.
 * @route   - GET deals
 * @status  - working
 * @tags    - get, deals
 */
export async function IXM_API_DEALS_GET_01 (assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);

    /** Test */
    let response = await apiRequest.get(route, {limit: 3, offset: 0}, buyer.user.userID);

    assert.equals(response.status, 200);
    assert.deepEqual(response.body['data'][0], Helper.proposalToPayload(proposal, publisher));

}

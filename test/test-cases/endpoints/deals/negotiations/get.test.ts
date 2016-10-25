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
    let dealNegotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID,
                                                                         publisher.user.userID, buyer.user.userID);
}

/** Generic Authentication Tests */
export let ATW_PA_GET_AUTH = authenticationTest(route, 'get', commonDatabaseSetup);

/*
 * @case    - Publisher has no proposals (and no negotiations)
 * @label   - ATW_DN_GET_F1
 * @route   - GET deals/negotitation
 * @status  - 
 * @tags    - 
 */
export async function ATW_DN_GET_F1 (assert: test.Test) {

    /**Setup  */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);

    /** Test */
    let response = await apiRequest.get(route, {}, buyer.user.userID);
    assert.equal(response.status, 200, "Response 200");
    assert.deepEqual(response.body['data'], [], "No Data Returned");
}

/*
 * @case    - Publisher has proposals (no negotiations)
 * @label   - ATW_DN_GET_F2
 * @route   - GET deals/negotitation
 * @status  - 
 * @tags    - 
 */
export async function ATW_DN_GET_F2 (assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);

    let response = await apiRequest.get(route, {}, buyer.user.userID);
    assert.equal(response.status, 200, "Response 200");
    assert.deepEqual(response.body['data'], [], "No Data Returned");

}

/*
 * @case    - Proposal belonging to different publisher containing negotiations exists, but current user is NOT linked to them
 * @label   - ATW_DN_GET_F3
 * @route   - GET deals/negotitation
 * @status  - 
 * @tags    - 
 */
export async function ATW_DN_GET_F3 (assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let publisher_2 = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);
    let dealNegotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID,
                                                                         publisher.user.userID, buyer.user.userID);

    let response = await apiRequest.get(route, {}, publisher_2.publisher.userID);
    assert.equal(response.status, 200, "Response 200");
    assert.deepEqual(response.body['data'], [], "No Data Returned");

}

/*
 * @case    - Publisher was not the last to negotiate on its proposal
 * @label   - ATW_DN_GET_F4
 * @route   - GET deals/negotitation
 * @status  - 
 * @tags    - 
 */
export async function ATW_DN_GET_F4 (assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);
    let dealNegotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID,
                                                                         publisher.user.userID, buyer.user.userID, {
                                                                             buyerStatus: 'accepted',
                                                                             pubStatus: 'active',
                                                                             sender: 'buyer'
                                                                         });
    let response = await apiRequest.get(route, {}, buyer.user.userID);
    assert.equal(response.status, 200, "Reponse 200");
    assert.deepEqual(response.body['data'][0], {
         proposal_id: proposal.proposal.proposalID,
        publisher_id: publisher.user.userID,
        publisher_contact: {
            title: 'Warlord',
            name: publisher.user.firstName + ' ' + publisher.user.lastName,
            email_address: publisher.user.emailAddress,
            phone: publisher.user.phone
        },
        buyer_id: buyer.user.userID,
        buyer_contact: {
            title: 'Warlord',
            name: buyer.user.firstName + ' ' + buyer.user.lastName,
            email_address: buyer.user.emailAddress,
            phone: buyer.user.phone
        },
        description: proposal.proposal.description,
        terms: dealNegotiation.terms,
        impressions: dealNegotiation.impressions,
        budget: dealNegotiation.budget,
        name: proposal.proposal.name,
        start_date: Helper.formatDate(dealNegotiation.startDate),
        end_date: Helper.formatDate(dealNegotiation.endDate),
        auction_type: proposal.proposal.auctionType,
        price: dealNegotiation.price,
        deal_section_id: proposal.sectionIDs,
        currency: 'USD',
        created_at: (new Date(dealNegotiation.createDate)).toISOString(),
        modified_at: (new Date(dealNegotiation.modifyDate)).toISOString()
    }, "1 DN Returned");
}

/*
 * @case    - Publisher was the last to negotiate on its proposal
 * @label   - ATW_DN_GET_F5
 * @route   - GET deals/negotitation
 * @status  - 
 * @tags    - 
 */
export async function ATW_DN_GET_F5 (assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);
    let dealNegotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID,
                                                                         publisher.user.userID, buyer.user.userID, {
                                                                             buyerStatus: 'active',
                                                                             pubStatus: 'accepted',
                                                                             sender: 'publisher'
                                                                         });
    let response = await apiRequest.get(route, {}, buyer.user.userID);
    assert.equal(response.status, 200, "Reponse 200");
    assert.deepEqual(response.body['data'][0], {
         proposal_id: proposal.proposal.proposalID,
        publisher_id: publisher.user.userID,
        publisher_contact: {
            title: 'Warlord',
            name: publisher.user.firstName + ' ' + publisher.user.lastName,
            email_address: publisher.user.emailAddress,
            phone: publisher.user.phone
        },
        buyer_id: buyer.user.userID,
        buyer_contact: {
            title: 'Warlord',
            name: buyer.user.firstName + ' ' + buyer.user.lastName,
            email_address: buyer.user.emailAddress,
            phone: buyer.user.phone
        },
        description: proposal.proposal.description,
        terms: dealNegotiation.terms,
        impressions: dealNegotiation.impressions,
        budget: dealNegotiation.budget,
        name: proposal.proposal.name,
        start_date: Helper.formatDate(dealNegotiation.startDate),
        end_date: Helper.formatDate(dealNegotiation.endDate),
        auction_type: proposal.proposal.auctionType,
        price: dealNegotiation.price,
        deal_section_id: proposal.sectionIDs,
        currency: 'USD',
        created_at: (new Date(dealNegotiation.createDate)).toISOString(),
        modified_at: (new Date(dealNegotiation.modifyDate)).toISOString()
    }, "1 DN Returned");
}

/*
 * @case    - Buyer accepted publisher's proposal right away
 * @label   - ATW_DN_GET_F6
 * @route   - GET deals/negotitation
 * @status  -
 * @tags    - 
 */
export async function ATW_DN_GET_F6 (assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);
    let dealNegotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID,
                                                                        publisher.user.userID, buyer.user.userID,
                                                                        {
                                                                            buyerStatus: 'accepted',
                                                                            pubStatus: 'accepted'
                                                                        });

    let response = await apiRequest.get(route, {}, buyer.user.userID);
    assert.equal(response.status, 200, "Response 200");
    assert.deepEqual(response.body['data'], [], "No data returned");
}

/*
 * @case    - Publisher accepted its own proposal after a negotiation
 * @label   - ATW_DN_GET_F7
 * @route   - GET deals/negotitation
 * @status  - 
 * @tags    - 
 */
export async function ATW_DN_GET_F7 (assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);
    let dealNegotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID,
                                                                         publisher.user.userID, buyer.user.userID, {
                                                                             buyerStatus: 'accepted',
                                                                             pubStatus: 'accepted',
                                                                             sender: 'buyer'
                                                                         });
    let response = await apiRequest.get(route, {}, buyer.user.userID);
    assert.equal(response.status, 200, "Reponse 200");
    assert.deepEqual(response.body['data'], [], "No Negotiation Objects returned");
}

/*
 * @case    - Buyer rejects publisher's proposal after negotiations
 * @label   - ATW_DN_GET_F8
 * @route   - GET deals/negotitation
 * @status  - 
 * @tags    - 
 */
export async function ATW_DN_GET_F8 (assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);
    let dealNegotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID,
                                                                         publisher.user.userID, buyer.user.userID, {
                                                                             buyerStatus: 'rejected',
                                                                             pubStatus: 'active',
                                                                             sender: 'buyer'
                                                                         });
    let response = await apiRequest.get(route, {}, buyer.user.userID);
    assert.equal(response.status, 200, "Reponse 200");
    assert.deepEqual(response.body['data'], [{
        proposal_id: proposal.proposal.proposalID,
        publisher_id: publisher.user.userID,
        publisher_contact: {
            title: 'Warlord',
            name: publisher.user.firstName + ' ' + publisher.user.lastName,
            email_address: publisher.user.emailAddress,
            phone: publisher.user.phone
        },
        buyer_id: buyer.user.userID,
        buyer_contact: {
            title: 'Warlord',
            name: buyer.user.firstName + ' ' + buyer.user.lastName,
            email_address: buyer.user.emailAddress,
            phone: buyer.user.phone
        },
        description: proposal.proposal.description,
        terms: dealNegotiation.terms,
        impressions: dealNegotiation.impressions,
        budget: dealNegotiation.budget,
        name: proposal.proposal.name,
        start_date: Helper.formatDate(dealNegotiation.startDate),
        end_date: Helper.formatDate(dealNegotiation.endDate),
        auction_type: proposal.proposal.auctionType,
        price: dealNegotiation.price,
        deal_section_id: proposal.sectionIDs,
        currency: 'USD',
        created_at: (new Date(dealNegotiation.createDate)).toISOString(),
        modified_at: (new Date(dealNegotiation.modifyDate)).toISOString()
        }], "1 DN Returned");
}

/*
 * @case    - Publisher rejects its own proposal after a negotiation
 * @label   - ATW_DN_GET_F9
 * @route   - GET deals/negotitation
 * @status  - 
 * @tags    - 
 */
export async function ATW_DN_GET_F9 (assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);
    let dealNegotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID,
                                                                         publisher.user.userID, buyer.user.userID, {
                                                                             buyerStatus: 'active',
                                                                             pubStatus: 'rejected',
                                                                             sender: 'publisher'
                                                                         });
    let response = await apiRequest.get(route, {}, buyer.user.userID);
    assert.equal(response.status, 200, "Reponse 200");
    assert.deepEqual(response.body['data'][0], {
        proposal_id: proposal.proposal.proposalID,
        publisher_id: publisher.user.userID,
        publisher_contact: {
            title: 'Warlord',
            name: publisher.user.firstName + ' ' + publisher.user.lastName,
            email_address: publisher.user.emailAddress,
            phone: publisher.user.phone
        },
        buyer_id: buyer.user.userID,
        buyer_contact: {
            title: 'Warlord',
            name: buyer.user.firstName + ' ' + buyer.user.lastName,
            email_address: buyer.user.emailAddress,
            phone: buyer.user.phone
        },
        description: proposal.proposal.description,
        terms: dealNegotiation.terms,
        impressions: dealNegotiation.impressions,
        budget: dealNegotiation.budget,
        name: proposal.proposal.name,
        start_date: Helper.formatDate(dealNegotiation.startDate),
        end_date: Helper.formatDate(dealNegotiation.endDate),
        auction_type: proposal.proposal.auctionType,
        price: dealNegotiation.price,
        deal_section_id: proposal.sectionIDs,
        currency: 'USD',
        created_at: (new Date(dealNegotiation.createDate)).toISOString(),
        modified_at: (new Date(dealNegotiation.modifyDate)).toISOString()
    }, "1 DN Returned");
}

/*
 * @case    - Multiple proposals belong to publisher - publisher's perspective
 * @label   - ATW_DN_GET_F10
 * @route   - GET deals/negotitation
 * @status  - Not supported right now 
 * @tags    - notSupported
 */
export async function ATW_DN_GET_F10 (assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer_1 = await databasePopulator.createBuyer(dsp.dspID);
    let buyer_2 = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);
    let unusedProposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);
    let dealNegotiation_1 = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID,
                                                                         publisher.user.userID, buyer_1.user.userID, {
                                                                             buyerStatus: 'active',
                                                                             pubStatus: 'accepted',
                                                                             sender: 'publisher'
                                                                         });
    let dealNegotiation_2 = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID,
                                                                         publisher.user.userID, buyer_2.user.userID, {
                                                                             buyerStatus: 'accepted',
                                                                             pubStatus: 'active',
                                                                             sender: 'buyer'
                                                                         });

    let response = await apiRequest.get(route, {}, publisher.user.userID);

    assert.equals(response.status, 200, "Response ok");
    assert.deepEqual(response.body['data'], [{
        proposal_id: proposal.proposal.proposalID,
        publisher_id: publisher.user.userID,
        publisher_contact: {
            title: 'Warlord',
            name: publisher.user.firstName + ' ' + publisher.user.lastName,
            email_address: publisher.user.emailAddress,
            phone: publisher.user.phone
        },
        buyer_id: buyer_1.user.userID,
        buyer_contact: {
            title: 'Warlord',
            name: buyer_1.user.firstName + ' ' + buyer_1.user.lastName,
            email_address: buyer_1.user.emailAddress,
            phone: buyer_1.user.phone
        },
        description: proposal.proposal.description,
        terms: dealNegotiation_1.terms,
        impressions: dealNegotiation_1.impressions,
        budget: dealNegotiation_1.budget,
        name: proposal.proposal.name,
        start_date: Helper.formatDate(dealNegotiation_1.startDate),
        end_date: Helper.formatDate(dealNegotiation_1.endDate),
        auction_type: proposal.proposal.auctionType,
        price: dealNegotiation_1.price,
        deal_section_id: proposal.sectionIDs,
        currency: 'USD',
        created_at: (new Date(dealNegotiation_1.createDate)).toISOString(),
        modified_at: (new Date(dealNegotiation_1.modifyDate)).toISOString()
    },
    {
        proposal_id: proposal.proposal.proposalID,
        publisher_id: publisher.user.userID,
        publisher_contact: {
            title: 'Warlord',
            name: publisher.user.firstName + ' ' + publisher.user.lastName,
            email_address: publisher.user.emailAddress,
            phone: publisher.user.phone
        },
        buyer_id: buyer_2.user.userID,
        buyer_contact: {
            title: 'Warlord',
            name: buyer_2.user.firstName + ' ' + buyer_2.user.lastName,
            email_address: buyer_2.user.emailAddress,
            phone: buyer_2.user.phone
        },
        description: proposal.proposal.description,
        terms: dealNegotiation_2.terms,
        impressions: dealNegotiation_2.impressions,
        budget: dealNegotiation_2.budget,
        name: proposal.proposal.name,
        start_date: Helper.formatDate(dealNegotiation_2.startDate),
        end_date: Helper.formatDate(dealNegotiation_2.endDate),
        auction_type: proposal.proposal.auctionType,
        price: dealNegotiation_2.price,
        deal_section_id: proposal.sectionIDs,
        currency: 'USD',
        created_at: (new Date(dealNegotiation_2.createDate)).toISOString(),
        modified_at: (new Date(dealNegotiation_2.modifyDate)).toISOString()
    }], "DN1 and DN2 returned");
}

/*
 * @case    - Multiple proposals belong to publisher - buyer's perspective
 * @label   - ATW_DN_GET_F11
 * @route   - GET deals/negotitation
 * @status  - 
 * @tags    - 
 */
    export async function ATW_DN_GET_F11 (assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer_1 = await databasePopulator.createBuyer(dsp.dspID);
    let buyer_2 = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);
    let dealNegotiation_1 = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID,
                                                                         publisher.user.userID, buyer_1.user.userID, {
                                                                             buyerStatus: 'active',
                                                                             pubStatus: 'accepted',
                                                                             sender: 'publisher'
                                                                         });
    let dealNegotiation_2 = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID,
                                                                         publisher.user.userID, buyer_2.user.userID, {
                                                                             buyerStatus: 'accepted',
                                                                             pubStatus: 'active',
                                                                             sender: 'buyer'
                                                                         });
    let response = await apiRequest.get(route, {}, buyer_1.user.userID);
     assert.equals(response.status, 200, "Response 200");
     assert.deepEqual(response.body['data'], [{
        proposal_id: proposal.proposal.proposalID,
        publisher_id: publisher.user.userID,
        publisher_contact: {
            title: 'Warlord',
            name: publisher.user.firstName + ' ' + publisher.user.lastName,
            email_address: publisher.user.emailAddress,
            phone: publisher.user.phone
        },
        buyer_id: buyer_1.user.userID,
        buyer_contact: {
            title: 'Warlord',
            name: buyer_1.user.firstName + ' ' + buyer_1.user.lastName,
            email_address: buyer_1.user.emailAddress,
            phone: buyer_1.user.phone
        },
        description: proposal.proposal.description,
        terms: dealNegotiation_1.terms,
        impressions: dealNegotiation_1.impressions,
        budget: dealNegotiation_1.budget,
        name: proposal.proposal.name,
        start_date: Helper.formatDate(dealNegotiation_1.startDate),
        end_date: Helper.formatDate(dealNegotiation_1.endDate),
        auction_type: proposal.proposal.auctionType,
        price: dealNegotiation_1.price,
        deal_section_id: proposal.sectionIDs,
        currency: 'USD',
        created_at: (new Date(dealNegotiation_1.createDate)).toISOString(),
        modified_at: (new Date(dealNegotiation_1.modifyDate)).toISOString()
    }], "1 DN returned");
}

/*
 * @case    - Buyer linked to multiple proposals
 * @label   - ATW_DN_GET_F12
 * @route   - GET deals/negotitation
 * @status  - 
 * @tags    - 
 */
export async function ATW_DN_GET_F12 (assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal_1 = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);
    let proposal_2 = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);
    let dealNegotiation_1 = await databasePopulator.createDealNegotiation(proposal_1.proposal.proposalID,
                                                                         publisher.user.userID, buyer.user.userID, {
                                                                             buyerStatus: 'active',
                                                                             pubStatus: 'accepted',
                                                                             sender: 'publisher'
                                                                         });
    let dealNegotiation_2 = await databasePopulator.createDealNegotiation(proposal_2.proposal.proposalID,
                                                                         publisher.user.userID, buyer.user.userID, {
                                                                             buyerStatus: 'accepted',
                                                                             pubStatus: 'active',
                                                                             sender: 'buyer'
                                                                         });

    let response = await apiRequest.get(route, {}, buyer.user.userID);

    assert.equals(response.status, 200, "Response ok");
    assert.deepEqual(response.body['data'], [{
        proposal_id: proposal_1.proposal.proposalID,
        publisher_id: publisher.user.userID,
        publisher_contact: {
            title: 'Warlord',
            name: publisher.user.firstName + ' ' + publisher.user.lastName,
            email_address: publisher.user.emailAddress,
            phone: publisher.user.phone
        },
        buyer_id: buyer.user.userID,
        buyer_contact: {
            title: 'Warlord',
            name: buyer.user.firstName + ' ' + buyer.user.lastName,
            email_address: buyer.user.emailAddress,
            phone: buyer.user.phone
        },
        description: proposal_1.proposal.description,
        terms: dealNegotiation_1.terms,
        impressions: dealNegotiation_1.impressions,
        budget: dealNegotiation_1.budget,
        name: proposal_1.proposal.name,
        start_date: Helper.formatDate(dealNegotiation_1.startDate),
        end_date: Helper.formatDate(dealNegotiation_1.endDate),
        auction_type: proposal_1.proposal.auctionType,
        price: dealNegotiation_1.price,
        deal_section_id: proposal_1.sectionIDs,
        currency: 'USD',
        created_at: (new Date(dealNegotiation_1.createDate)).toISOString(),
        modified_at: (new Date(dealNegotiation_1.modifyDate)).toISOString()
    },
    {
        proposal_id: proposal_2.proposal.proposalID,
        publisher_id: publisher.user.userID,
        publisher_contact: {
            title: 'Warlord',
            name: publisher.user.firstName + ' ' + publisher.user.lastName,
            email_address: publisher.user.emailAddress,
            phone: publisher.user.phone
        },
        buyer_id: buyer.user.userID,
        buyer_contact: {
            title: 'Warlord',
            name: buyer.user.firstName + ' ' + buyer.user.lastName,
            email_address: buyer.user.emailAddress,
            phone: buyer.user.phone
        },
        description: proposal_2.proposal.description,
        terms: dealNegotiation_2.terms,
        impressions: dealNegotiation_2.impressions,
        budget: dealNegotiation_2.budget,
        name: proposal_2.proposal.name,
        start_date: Helper.formatDate(dealNegotiation_2.startDate),
        end_date: Helper.formatDate(dealNegotiation_2.endDate),
        auction_type: proposal_2.proposal.auctionType,
        price: dealNegotiation_2.price,
        deal_section_id: proposal_2.sectionIDs,
        currency: 'USD',
        created_at: (new Date(dealNegotiation_2.createDate)).toISOString(),
        modified_at: (new Date(dealNegotiation_2.modifyDate)).toISOString()
    }], "DN1 and DN2 returned");

}

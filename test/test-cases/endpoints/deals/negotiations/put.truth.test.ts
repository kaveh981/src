/* tslint:disable */
'use strict';

import * as test from 'tape';

import { Injector } from '../../../../src/lib/injector';
import { APIRequestManager } from '../../../../src/lib/request-manager';
import { DatabasePopulator } from '../../../../src/lib/database-populator';

const databasePopulator = Injector.request<DatabasePopulator>('DatabasePopulator');
const apiRequest = Injector.request<APIRequestManager>('APIRequestManager');

/**
 * 
 * Here we test the truth table as is defined at: http://confluence.indexexchange.com/display/ATW/24-01-2017+-+When+can+you+do+to+a+proposal+what
 * All test cases test for the binary cases 200 / not 200.
 * 
 */

const ROUTE = 'deals/negotiations';

/**
 * Create a proposal with given fields and sections.
 */
async function createProposal(owner: 'publisher' | 'buyer', proposalFields: IProposal,
                              sectionFields: Partial<ISection>[]= [{}], targeted: boolean = false) {

        await databasePopulator.createDSP(1);

        let buyerCompany = await databasePopulator.createCompany({}, 1);
        let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
        let publisherCompany = await databasePopulator.createCompany();
        let publisher = await databasePopulator.createPublisher(publisherCompany.user.userID, 'write');

        let proposalOwner = owner === 'publisher' ? publisherCompany : buyerCompany;
        let targetUser = owner !== 'publisher' ? publisherCompany : buyerCompany;
        let site = await databasePopulator.createSite(publisherCompany.user.userID);
        let sections = await Promise.all(sectionFields.map((sectionField) => {
            return databasePopulator.createSection(publisherCompany.user.userID, [ site.siteID ], sectionField);
        }));

        let proposal = await databasePopulator.createProposal(proposalOwner.user.userID, sections.map(section => section.section.sectionID),
                                                              Object.assign({ status: 'active' }, proposalFields),
                                                              targeted ? [ targetUser.user.userID ] : undefined);

        return { buyer: buyerCompany, publisher: publisherCompany, site, sections, proposal };

}

/** 
 * List of negotiation functions to tests according to the truth table. 
 */
const negotiationFunctions = {

    /** Accept a negotiation on price. */
    'accept': async (proposal: IProposal, owner: INewUserData, partner: INewUserData) => {

        await databasePopulator.createDealNegotiation(proposal.proposalID, partner.userID, {
            price: proposal.price + 4,
            partnerStatus: 'accepted',
            startDate: null,
            endDate: null,
            sender: 'partner',
            ownerStatus: 'active'
        });

        let body = {
            proposal_id: proposal.proposalID,
            partner_id: partner.userID,
            response: 'accept'
        };

        return apiRequest.put(ROUTE, body, owner);

    },

    /** Send a counter-offer for price. */
    'counter-offer': async (proposal: IProposal, owner: INewUserData, partner: INewUserData) => {

        await databasePopulator.createDealNegotiation(proposal.proposalID, partner.userID, {
            price: proposal.price + 2,
            partnerStatus: 'accepted',
            startDate: null,
            endDate: null,
            sender: 'partner',
            ownerStatus: 'active'
        });

        let body = {
            proposal_id: proposal.proposalID,
            partner_id: partner.userID,
            price: proposal.price + 8
        };

        return apiRequest.put(ROUTE, body, owner);

    },
    /** Start a negotiation on price. */
    'start': async (proposal: IProposal, owner: INewUserData, partner: INewUserData) => {

        let body = {
            proposal_id: proposal.proposalID,
            partner_id: owner.userID,
            price: proposal.price + 2
        };

        return apiRequest.put(ROUTE, body, partner);

    }
};

/** 
 * List of test functions.
 */
let ATW_API_PUT_NEG_TRUTH_TABLE = [];

/**
 * Generate 5 test functions for each combination of publisher / buyer, targeted / not-targeted, start / counter-offer / accept
 */
[ 'publisher', 'buyer' ].forEach((proposalOwner: 'publisher' | 'buyer') => {
    [ true, false ].forEach((targeted) => {
        [ 'start', 'counter-offer', 'accept' ].forEach((negotiationState) => {

            // Buyers can't be owners of targeted proposals.
            if (proposalOwner === 'buyer' && !targeted) {
                return;
            }

            /**
             * Proposal has no sections.
             */
            if (targeted) {
                ATW_API_PUT_NEG_TRUTH_TABLE.push(async function ATW_API_TRUTH_NO_SECTIONS(assert: test.Test) {

                    console.log(`CASE: ATW_API_TRUTH_NO_SECTIONS`);
                    console.log(`Testing case: owner is ${proposalOwner}, proposal is ${targeted ? 'targeted' : 'open'} and sending ${negotiationState}.`);

                    assert.plan(1);

                    let proposalGroup = await createProposal(proposalOwner, {}, [], targeted);
                    let partner = proposalOwner === 'buyer' ? proposalGroup.publisher : proposalGroup.buyer;
                    let owner = proposalOwner === 'buyer' ? proposalGroup.buyer : proposalGroup.publisher;
                    let response = await negotiationFunctions[negotiationState](proposalGroup.proposal.proposal, owner.user, partner.user);

                    switch (negotiationState) {

                        case 'start':
                            assert.equal(response.status, 200);
                            break;

                        case 'counter-offer':
                            assert.equal(response.status, 200);
                            break;

                        case 'accept':
                            assert.notEqual(response.status, 200);
                            break;

                    }

                });
            }

            /**
             * Proposal has only invalid sections.
             */
            ATW_API_PUT_NEG_TRUTH_TABLE.push(async function ATW_API_TRUTH_INVALID_SECTIONS(assert: test.Test) {

                console.log(`CASE: ATW_API_TRUTH_INVALID_SECTIONS`);
                console.log(`Testing case: owner is ${proposalOwner}, proposal is ${targeted ? 'targeted' : 'open'} and sending ${negotiationState}.`);

                assert.plan(1);

                let proposalGroup = await createProposal(proposalOwner, {}, [ { status: 'D' }, { status: 'D' } ], targeted);
                let partner = proposalOwner === 'buyer' ? proposalGroup.publisher : proposalGroup.buyer;
                let owner = proposalOwner === 'buyer' ? proposalGroup.buyer : proposalGroup.publisher;
                let response = await negotiationFunctions[negotiationState](proposalGroup.proposal.proposal, owner.user, partner.user);

                switch (negotiationState) {

                    case 'start':
                        targeted ? assert.equal(response.status, 200) : assert.notEqual(response.status, 200);
                        break;

                    case 'counter-offer':
                        targeted ? assert.equal(response.status, 200) : assert.notEqual(response.status, 200);
                        break;

                    case 'accept':
                        assert.notEqual(response.status, 200);
                        break;

                }

            });

            /**
             * Proposal has valid sections.
             */
            ATW_API_PUT_NEG_TRUTH_TABLE.push(async function ATW_API_TRUTH_VALID_SECTIONS(assert: test.Test) {

                console.log(`CASE: ATW_API_TRUTH_VALID_SECTIONS`);
                console.log(`Testing case: owner is ${proposalOwner}, proposal is ${targeted ? 'targeted' : 'open'} and sending ${negotiationState}.`);

                assert.plan(1);

                let proposalGroup = await createProposal(proposalOwner, {}, [{}, { status: 'D' }], targeted);
                let partner = proposalOwner === 'buyer' ? proposalGroup.publisher : proposalGroup.buyer;
                let owner = proposalOwner === 'buyer' ? proposalGroup.buyer : proposalGroup.publisher;
                let response = await negotiationFunctions[negotiationState](proposalGroup.proposal.proposal, owner.user, partner.user);

                switch (negotiationState) {

                    case 'start':
                        assert.equal(response.status, 200);
                        break;

                    case 'counter-offer':
                        assert.equal(response.status, 200);
                        break;

                    case 'accept':
                        assert.equal(response.status, 200);
                        break;

                }

            });

            /**
             * Proposal is expired.
             */
            ATW_API_PUT_NEG_TRUTH_TABLE.push(async function ATW_API_TRUTH_EXPIRED_PROPOSAL(assert: test.Test) {

                console.log(`CASE: ATW_API_TRUTH_EXPIRED_PROPOSAL`);
                console.log(`Testing case: owner is ${proposalOwner}, proposal is ${targeted ? 'targeted' : 'open'} and sending ${negotiationState}.`);

                assert.plan(1);

                let proposalGroup = await createProposal(proposalOwner, { startDate: '1992-07-29', endDate: '1994-07-25' }, [{}, {}], targeted);
                let partner = proposalOwner === 'buyer' ? proposalGroup.publisher : proposalGroup.buyer;
                let owner = proposalOwner === 'buyer' ? proposalGroup.buyer : proposalGroup.publisher;
                let response = await negotiationFunctions[negotiationState](proposalGroup.proposal.proposal, owner.user, partner.user);

                switch (negotiationState) {

                    case 'start':
                        assert.notEqual(response.status, 200);
                        break;

                    case 'counter-offer':
                        assert.notEqual(response.status, 200);
                        break;

                    case 'accept':
                        assert.notEqual(response.status, 200);
                        break;

                }

            });

            /**
             * Proposal has been deleted.
             */
            ATW_API_PUT_NEG_TRUTH_TABLE.push(async function ATW_API_TRUTH_DELETED_PROPOSAL(assert: test.Test) {

                console.log(`CASE: ATW_API_TRUTH_DELETED_PROPOSAL`);
                console.log(`Testing case: owner is ${proposalOwner}, proposal is ${targeted ? 'targeted' : 'open'} and sending ${negotiationState}.`);

                assert.plan(1);

                let proposalGroup = await createProposal(proposalOwner, { status: 'deleted' }, [{}, {}], targeted);
                let partner = proposalOwner === 'buyer' ? proposalGroup.publisher : proposalGroup.buyer;
                let owner = proposalOwner === 'buyer' ? proposalGroup.buyer : proposalGroup.publisher;
                let response = await negotiationFunctions[negotiationState](proposalGroup.proposal.proposal, owner.user, partner.user);

                switch (negotiationState) {

                    case 'start':
                        assert.notEqual(response.status, 200);
                        break;

                    case 'counter-offer':
                        assert.notEqual(response.status, 200);
                        break;

                    case 'accept':
                        assert.notEqual(response.status, 200);
                        break;

                }

            });

        });
    });
});

export { ATW_API_PUT_NEG_TRUTH_TABLE };

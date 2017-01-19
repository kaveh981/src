'use strict';

import * as crypto from 'crypto';

import { DatabaseManager } from './database-manager';
import { APIRequestManager } from './request-manager';
import { DatabasePopulator } from './database-populator';
import { Injector } from './injector';

const databaseManager = Injector.request<DatabaseManager>('DatabaseManager');
const apiRequest = Injector.request<APIRequestManager>('APIRequestManager');
const databasePopulator = Injector.request<DatabasePopulator>('DatabasePopulator');

class Helper {

    public static formatDate(dateString: string | Date) {

        if (dateString === null) {
            return null;
        }

        dateString = dateString.toString();
        let date = new Date(dateString.toString());

        if (dateString.includes('0000-00-00')) {
            return '0000-00-00';
        }

        if (date.toString() === 'Invalid Date') {
            throw new Error('Invalid date provided.');
        }

        const pad = (val: Number) => { if (val < 10) { return '0' + val; } return val.toString(); };
        return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
    }

    /**
     * Convert a single letter status to a word.
     * @param status - The letter to convert.
     * @returns The word.
     */
    public static statusLetterToWord(status: string): 'active' | 'deleted' | 'paused' {
        switch (status) {
            case 'A':
                return 'active';
            case 'D':
                return 'deleted';
            case 'P':
                return 'paused';
            default:
                return;
        }
    }

    /**
     * Construct a contact payload form user info
     * @param contact - user object
     * @returns contact payload
     */
    public static contactToPayload(contact: INewUserData): any {
        return contact.status === 'A'
            ? {
                title: 'Warlord',
                name: contact.firstName + ' ' + contact.lastName,
                email: contact.emailAddress,
                phone: contact.phone
            }
            : {
                status: "INACTIVE_USER"
            };
    }
    /**
     * Construct a proposal payload from a proposal.
     * @param proposal - The proposal object.
     * @param owner - The user who own's the proposal buyer/publisher.
     * @returns The expected payload for that proposal.
     */
    public static async proposalToPayload(proposal: INewProposalData, contact?: INewUserData) {
        let requestUser = await databasePopulator.createInternalUser();
        if (proposal.proposal.status === 'deleted') {
            return {
                created_at: proposal.proposal.createDate.toISOString(),
                proposal_id: proposal.proposal.proposalID,
                modified_at: proposal.proposal.modifyDate.toISOString(),
                status: proposal.proposal.status
            };
        } else {
            return {
                auction_type: proposal.proposal.auctionType,
                budget: proposal.proposal.budget,
                owner_id: proposal.proposal.ownerID,
                contact: this.contactToPayload(contact),
                created_at: proposal.proposal.createDate.toISOString(),
                currency: 'USD',
                description: proposal.proposal.description,
                end_date: this.formatDate(proposal.proposal.endDate),
                proposal_id: proposal.proposal.proposalID,
                impressions: proposal.proposal.impressions,
                inventory: await Promise.all(proposal.sectionIDs.map(async (id) => {
                    let section = (await apiRequest.get(`sections/${id}`, {}, requestUser)).body['data'][0];
                    return section;
                })),
                partners: proposal.targetedUsers,
                modified_at: proposal.proposal.modifyDate.toISOString(),
                name: proposal.proposal.name,
                price: proposal.proposal.price,
                start_date: this.formatDate(proposal.proposal.startDate),
                status: proposal.proposal.status,
                terms: proposal.proposal.terms
            };
        }
    }

    public static async dealNegotiationToPayload(dealNegotiation: IDealNegotiationData, proposal: INewProposalData,
        proposalOwner: INewUserData, partner: INewUserData) {

        if (proposal.proposal.status === 'deleted') {
            return {
                proposal: await Helper.proposalToPayload(proposal, proposalOwner),
                partner_id: partner.userID,
                contact: Helper.contactToPayload(partner),
                status: 'closed_by_owner',
                created_at: dealNegotiation.createDate.toISOString(),
                modified_at: dealNegotiation.modifyDate.toISOString()
            };
        } else {
            return {
                proposal: await Helper.proposalToPayload(proposal, proposalOwner),
                partner_id: partner.userID,
                contact: Helper.contactToPayload(partner),
                status: Helper.setNegotiationPayloadStatus(dealNegotiation, partner.userID !== proposalOwner.userID),
                price: dealNegotiation.price,
                impressions: dealNegotiation.impressions,
                budget: dealNegotiation.budget,
                terms: dealNegotiation.terms,
                start_date: Helper.formatDate(dealNegotiation.startDate),
                end_date: Helper.formatDate(dealNegotiation.endDate),
                created_at: dealNegotiation.createDate.toISOString(),
                modified_at: dealNegotiation.modifyDate.toISOString()
            };
        }
    }

    /**
     * Use created models to compute expected payload from the API
     * The payload from deals/active GET differs from the response from deals/active PUT
     * @param settledDeal {ISettledDealData} - rtbDeals entry, associated sectionIDs, associated negotiationID
     * @param dealNegotiation {IDealNegotiationData} - Negotiated properties of the deal
     * @param proposal {INewProposalData} - The original proposal
     * @param partner {INewUserData} - The partner tied to the proposal/deal
     * @returns - The payload we expect to be returned by the API
     */
    public static async dealsActiveGetToPayload (settledDeal: ISettledDealData, dealNegotiation: IDealNegotiationData,
                                        proposal: INewProposalData, partner: INewUserData) {
        let requestUser = await databasePopulator.createInternalUser();
        return {
            proposal: {
                proposal_id: proposal.proposal.proposalID,
                name: proposal.proposal.name,
                description: proposal.proposal.description,
                currency: 'USD',
                resource: `deals/proposals/${proposal.proposal.proposalID}`
            },
            partner_id: partner.userID,
            partner: Helper.contactToPayload(partner),
            inventory: await Promise.all(proposal.sectionIDs.map(async (id) => {
                let section = (await apiRequest.get(`sections/${id}`, {}, requestUser)).body['data'][0];
                return section;
            })),
            auction_type: settledDeal.settledDeal.auctionType,
            dsp_id: settledDeal.settledDeal.dspID,
            terms: dealNegotiation.terms,
            impressions: dealNegotiation.impressions,
            budget: dealNegotiation.budget,
            external_id: settledDeal.settledDeal.externalDealID,
            start_date: Helper.formatDate(settledDeal.settledDeal.startDate),
            end_date: Helper.formatDate(settledDeal.settledDeal.endDate),
            status: Helper.statusLetterToWord(settledDeal.settledDeal.status),
            price: settledDeal.settledDeal.rate,
            priority: settledDeal.settledDeal.priority,
            created_at: (new Date(settledDeal.settledDeal.createDate)).toISOString(),
            modified_at: (new Date(settledDeal.settledDeal.modifiedDate)).toISOString()
        };
    }

    public static async dealsActivePutToPayload(proposal: INewProposalData,
        owner: INewUserData, buyerCompany: INewCompanyData, modifiedDate: Date, createDate: Date) {

        let requestUser = await databasePopulator.createInternalUser();
        return {
            proposal: {
                proposal_id: proposal.proposal.proposalID,
                name: proposal.proposal.name,
                description: proposal.proposal.description,
                currency: 'USD',
                resource: `deals/proposals/${proposal.proposal.proposalID}`
            },
            partner_id: owner.userID,
            partner: Helper.contactToPayload(owner),
            auction_type: proposal.proposal.auctionType,
            inventory: await Promise.all(proposal.sectionIDs.map(async (id) => {
                let section = (await apiRequest.get(`sections/${id}`, {}, requestUser)).body['data'][0];
                return section;
            })),
            dsp_id: buyerCompany.dspID,
            terms: proposal.proposal.terms,
            impressions: proposal.proposal.impressions,
            budget: proposal.proposal.budget,
            external_id: `ixm-${proposal.proposal.proposalID}-${this.encrypt(buyerCompany.user.userID + '-' + owner.userID)}`,
            start_date: Helper.formatDate(proposal.proposal.startDate),
            end_date: Helper.formatDate(proposal.proposal.endDate),
            status: proposal.proposal.status,
            price: proposal.proposal.price,
            priority: 5,
            created_at: createDate.toISOString(),
            modified_at: modifiedDate.toISOString()
        };

    }

    public static encrypt(text) {
        let cipher = crypto.createCipher('aes-256-ctr', 'only geese eat rats');
        let encrypted = cipher.update(text.toString(), 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return encrypted;
    }

     /**
      * Determines the status to return to the user based on buyer and publisher status
      */
    private static setNegotiationPayloadStatus(dealNegotiation: IDealNegotiationData, isOwner: boolean) {

        if (isOwner) {
            if (dealNegotiation.ownerStatus === 'active') {
                return 'waiting_on_you';
            } else if (dealNegotiation.ownerStatus === 'rejected') {
                return 'rejected_by_you';
            } else if (dealNegotiation.partnerStatus === 'active') {
                return 'waiting_on_partner';
            } else if (dealNegotiation.partnerStatus === 'rejected') {
                return 'rejected_by_partner';
            }
        } else {
            if (dealNegotiation.partnerStatus === 'active') {
                return 'waiting_on_you';
            } else if (dealNegotiation.partnerStatus === 'rejected') {
                return 'rejected_by_you';
            } else if (dealNegotiation.ownerStatus === 'active') {
                return 'waiting_on_partner';
            } else if (dealNegotiation.ownerStatus === 'rejected') {
                return 'rejected_by_partner';
            }
        }

        return 'accepted';

    }

    public static async getProposalById(proposalID: number) {
         let proposal: IProposal = await databaseManager.select().from('ixmDealProposals').where('proposalID', proposalID);
         return proposal;
     }

     public static async getNegotiationsByProposalID(proposalID: number) {
         let negotiations: IDealNegotiationData[] = await databaseManager.select().from('ixmDealNegotiations')
             .where('proposalID', proposalID);
         return negotiations;
     }

     public static async getDealsByProposalID(proposalID: number) {
         let negotiations: ISettledDeal[] = await databaseManager.select().from('rtbDeals')
             .join('ixmNegotiationDealMappings', 'ixmNegotiationDealMappings.dealID', 'rtbDeals.dealID')
             .join('ixmDealNegotiations', 'ixmDealNegotiations.negotiationID', 'ixmNegotiationDealMappings.negotiationID')
             .where('ixmDealNegotiations.proposalID', proposalID);
         return negotiations;
     }

}

export { Helper };

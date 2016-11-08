'use strict';

import { DatabaseManager } from './database-manager';
import { Injector } from './injector';

let crypto = require('crypto');

const databaseManager = Injector.request<DatabaseManager>('DatabaseManager');

class Helper {

    public static formatDate(dateString: string | Date) {
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
     * Construct a proposal payload from a proposal.
     * @param proposal - The proposal object.
     * @param owner - The user who own's the proposal buyer/publisher.
     * @returns The expected payload for that proposal.
     */
    public static proposalToPayload(proposal: INewProposalData, owner: INewUserData) {

        return {
            auction_type: proposal.proposal.auctionType,
            budget: proposal.proposal.budget,
            contact: {
                title: 'Warlord',
                name: owner.firstName + ' ' + owner.lastName,
                email: owner.emailAddress,
                phone: owner.phone
            },
            created_at: proposal.proposal.createDate.toISOString(),
            currency: 'USD',
            description: proposal.proposal.description,
            end_date: this.formatDate(proposal.proposal.endDate.toISOString()),
            id: proposal.proposal.proposalID,
            impressions: proposal.proposal.impressions,
            inventory: proposal.sectionIDs,
            modified_at: proposal.proposal.modifyDate.toISOString(),
            name: proposal.proposal.name,
            price: proposal.proposal.price,
            owner_id: proposal.proposal.ownerID,
            start_date: this.formatDate(proposal.proposal.startDate.toISOString()),
            status: proposal.proposal.status,
            terms: proposal.proposal.terms,
        };
    }

    public static dealNegotiationToPayload(dealNegotiation: IDealNegotiationData, proposal: INewProposalData,
        partner: INewUserData) {
        return {
            proposal: {
                id: proposal.proposal.proposalID,
                name: proposal.proposal.name,
                description: proposal.proposal.description,
                auction_type: proposal.proposal.auctionType,
                inventory: proposal.sectionIDs,
                currency: 'USD'
            },
            start_date: Helper.formatDate(dealNegotiation.startDate),
            end_date: Helper.formatDate(dealNegotiation.endDate),
            price: dealNegotiation.price,
            impressions: dealNegotiation.impressions,
            budget: dealNegotiation.budget,
            partner: {
                id: partner.userID,
                contact: {
                    title: 'Warlord',
                    name: partner.firstName + ' ' + partner.lastName,
                    email: partner.emailAddress,
                    phone: partner.phone
                }
            },
            terms: dealNegotiation.terms,
            created_at: dealNegotiation.createDate.toISOString(),
            modified_at: dealNegotiation.modifyDate.toISOString()
        };
    }

    public static async activeDealToPayload(proposal: INewProposalData,
        partner: INewUserData, buyer: INewBuyerData) {
        let dates = await databaseManager.select('createDate', 'modifyDate').from('ixmDealNegotiations');
        let createDate = new Date(dates[0]['createDate']);
        let modifyDate = new Date(dates[0]['modifyDate']);

        return {
            proposal: {
                "id": proposal.proposal.proposalID,
                "description": proposal.proposal.description,
                "name": proposal.proposal.name,
            },
            partner: {
                id: partner.userID,
                contact: {
                    title: 'Warlord',
                    name: partner.firstName + ' ' + partner.lastName,
                    email: partner.emailAddress,
                    phone: partner.phone
                }
            },
            dsp_id: buyer.dspID,
            terms: proposal.proposal.terms,
            impressions: proposal.proposal.impressions,
            budget: proposal.proposal.budget,
            external_id: `ixm-${proposal.proposal.proposalID}-${this.encrypt(buyer.user.userID + '-' + partner.userID)}`,
            start_date: Helper.formatDate(proposal.proposal.startDate),
            end_date: Helper.formatDate(proposal.proposal.endDate),
            status: proposal.proposal.status,
            auction_type: proposal.proposal.auctionType,
            price: proposal.proposal.price,
            inventory: proposal.sectionIDs,
            currency: 'USD',
            created_at: createDate.toISOString(),
            modified_at: modifyDate.toISOString()
        };
    }

    public static encrypt(text) {
        let cipher = crypto.createCipher('aes-256-ctr', 'only geese eat rats');
        let encrypted = cipher.update(text.toString(), 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return encrypted;
    }

}

export { Helper };

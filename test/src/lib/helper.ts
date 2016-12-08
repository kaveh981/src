'use strict';

import { DatabaseManager } from './database-manager';
import { Injector } from './injector';
import { ConfigLoader} from './config-loader';

let crypto = require('crypto');

const configLoader = Injector.request<ConfigLoader>('ConfigLoader');
const databaseManager = Injector.request<DatabaseManager>('DatabaseManager');

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
     * Construct a proposal payload from a proposal.
     * @param proposal - The proposal object.
     * @param owner - The user who own's the proposal buyer/publisher.
     * @returns The expected payload for that proposal.
     */
       public static proposalToPayload(proposal: INewProposalData, owner: INewUserData): any {
        if (proposal.proposal.status === 'deleted') {
            return {
                created_at: proposal.proposal.createDate.toISOString(),
                proposal_id: proposal.proposal.proposalID,
                modified_at: proposal.proposal.modifyDate.toISOString(),
                status: proposal.proposal.status,
            };
        } else {
            return {
                auction_type: proposal.proposal.auctionType,
                budget: proposal.proposal.budget,
                owner: {
                    owner_id: owner.userID,
                    contact: {
                        title: 'Warlord',
                        name: owner.firstName + ' ' + owner.lastName,
                        email: owner.emailAddress,
                        phone: owner.phone
                    }
                },
                created_at: proposal.proposal.createDate.toISOString(),
                currency: 'USD',
                description: proposal.proposal.description,
                end_date: this.formatDate(proposal.proposal.endDate.toISOString()),
                proposal_id: proposal.proposal.proposalID,
                impressions: proposal.proposal.impressions,
                inventory: proposal.sectionIDs.map((id) => {
                    return {
                        id: id,
                        resource: `sections/${id}`
                    };
                }),
                partners: proposal.targetedUsers,
                modified_at: proposal.proposal.modifyDate.toISOString(),
                name: proposal.proposal.name,
                price: proposal.proposal.price,
                start_date: this.formatDate(proposal.proposal.startDate.toISOString()),
                status: proposal.proposal.status,
                terms: proposal.proposal.terms,
            };
        }
    }

    public static dealNegotiationToPayload(dealNegotiation: IDealNegotiationData, proposal: INewProposalData,
        proposalOwner: INewUserData, partner: INewUserData): any {

        if (proposal.proposal.status === 'deleted') {
            return {
                proposal: Helper.proposalToPayload(proposal, proposalOwner),
                partner: {
                    partner_id: partner.userID,
                    contact: {
                        title: 'Warlord',
                        name: partner.firstName + ' ' + partner.lastName,
                        email: partner.emailAddress,
                        phone: partner.phone
                    }
                },
                status: 'closed_by_owner',
                created_at: dealNegotiation.createDate.toISOString(),
                modified_at: dealNegotiation.modifyDate.toISOString()
            };
        } else {
            return {
                proposal: Helper.proposalToPayload(proposal, proposalOwner),
                partner: {
                    partner_id: partner.userID,
                    contact: {
                        title: 'Warlord',
                        name: partner.firstName + ' ' + partner.lastName,
                        email: partner.emailAddress,
                        phone: partner.phone
                    }
                },
                status: Helper.setNegotiationPayloadStatus(dealNegotiation, partner.userType),
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
    public static dealsActiveGetToPayload (settledDeal: ISettledDealData, dealNegotiation: IDealNegotiationData,
                                        proposal: INewProposalData, partner: INewUserData) {
        return {
            proposal: {
                proposal_id: proposal.proposal.proposalID,
                name: proposal.proposal.name,
                description: proposal.proposal.description,
                currency: 'USD',
                resource: `deals/proposals/${proposal.proposal.proposalID}`
            },
            partner: {
                partner_id: partner.userID,
                contact: {
                    title: 'Warlord',
                    name: partner.firstName + ' ' + partner.lastName,
                    email: partner.emailAddress,
                    phone: partner.phone
                }
            },
            inventory: proposal.sectionIDs.map((id) => {
                return {
                    id: id,
                    resource: `sections/${id}`
                };
            }),
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

    public static dealsActivePutToPayload(proposal: INewProposalData,
        owner: INewUserData, buyer: INewBuyerData, modifiedDate: Date, createDate: Date) {

        return {
            proposal: {
                proposal_id: proposal.proposal.proposalID,
                name: proposal.proposal.name,
                description: proposal.proposal.description,
                currency: 'USD',
                resource: `deals/proposals/${proposal.proposal.proposalID}`
            },
            partner: {
                partner_id: owner.userID,
                contact: {
                    title: 'Warlord',
                    name: owner.firstName + ' ' + owner.lastName,
                    email: owner.emailAddress,
                    phone: owner.phone
                }
            },
            auction_type: proposal.proposal.auctionType,
            inventory: proposal.sectionIDs.map((id) => {
                return {
                    id: id,
                    resource: `sections/${id}`
                };
            }),
            dsp_id: buyer.dspID,
            terms: proposal.proposal.terms,
            impressions: proposal.proposal.impressions,
            budget: proposal.proposal.budget,
            external_id: `ixm-${proposal.proposal.proposalID}-${this.encrypt(buyer.user.userID + '-' + owner.userID)}`,
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
    private static setNegotiationPayloadStatus(dealNegotiation: IDealNegotiationData, partnerType: number) {

        if (partnerType === 23) {
            if (dealNegotiation.buyerStatus === 'active') {
                return 'waiting_on_you';
            } else if (dealNegotiation.buyerStatus === 'rejected') {
                return 'rejected_by_you';
            } else if (dealNegotiation.pubStatus === 'active') {
                return 'waiting_on_partner';
            } else if (dealNegotiation.pubStatus === 'rejected') {
                return 'rejected_by_partner';
            }
        } else {
            if (dealNegotiation.pubStatus === 'active') {
                return 'waiting_on_you';
            } else if (dealNegotiation.pubStatus === 'rejected') {
                return 'rejected_by_you';
            } else if (dealNegotiation.buyerStatus === 'active') {
                return 'waiting_on_partner';
            } else if (dealNegotiation.buyerStatus === 'rejected') {
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

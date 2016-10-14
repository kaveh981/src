'use strict';

import { UserModel } from '../../user/user-model';
import { ProposedDealModel } from '../proposed-deal/proposed-deal-model';

class NegotiatedDealModel {

    /** ID of the negotation in ixmDealNegotiation */
    public id: number;
    /** The id of the buyer in this negotiation */
    public buyerID: number;
    /** Contact info for the buyer */
    public buyerInfo: UserModel;
    /** The id of the publisher in this negotiation */
    public publisherID: number;
    /** The contact info for the publisher */
    public publisherInfo: UserModel;
    /** Publisher's status */
    public publisherStatus: 'active' | 'archived' | 'deleted' | 'accepted' | 'rejected';
    /** Buyer's status */
    public buyerStatus: 'active' | 'archived' | 'deleted' | 'accepted' | 'rejected';
    /** Which party last updated this offer */
    public sender: 'publisher' | 'buyer';
    /** Created date of the negotation */
    public createDate: string;
    /** Modified date of the negotation */
    public modifyDate: string;

    /** The original proposed deal */
    public proposedDeal: ProposedDealModel;

    /** 
     * These are the new terms of the proposed deal
     */

    /** Start date of the deal */
    public startDate: string;
    /** End date of the package */
    public endDate: string;
    /** Price of the package */
    public price: number;
    /** Projected amout of impressions for the package */
    public impressions: number;
    /** Project amount to be spend by the buyer */
    public budget: number;
    /** Free text that both parties can edit to convene of specific deal conditions */
    public terms: string;

    /**
     * Constructor
     * @param initParams - Initial parameters to populate the deal negotiation model.
     */
    constructor(initParams?: any) {
        if (initParams) {
            Object.assign(this, initParams);
        }
    }

    /**
     * Return payload formated object
     */
    public toPayload(): any {
        return {
            proposal_id: this.proposedDeal.id,
            publisher_id: this.publisherID,
            publisher_contact: this.publisherInfo.toContactPayload(),
            buyer_id: this.buyerID,
            buyer_contact: this.buyerInfo.toContactPayload(),
            description: this.proposedDeal.description,
            terms: this.terms,
            impressions: this.impressions,
            budget: this.budget,
            name: this.proposedDeal.name,
            start_date: this.formatDate(this.startDate),
            end_date: this.formatDate(this.endDate),
            auction_type: this.proposedDeal.auctionType,
            price: this.price,
            deal_section_id: this.proposedDeal.sections,
            currency: this.proposedDeal.currency,
            created_at: this.formatDate(this.createDate),
            modified_date: this.formatDate(this.modifyDate)
        };
    }

    /** 
     * Format the dates to yyyy-mm-dd
     * @param dateString - The date as a string.
     */
    private formatDate(dateString: string) {
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
}

export { NegotiatedDealModel }

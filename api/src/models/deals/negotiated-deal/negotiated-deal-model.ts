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
     * Update the current negotiation with new fields.
     * @param negotationFields - Fields to update.
     * @param sender - The person who is sending the new fields.
     * @param responseType - The response the sender is sending.
     * @param otherPartyStatus - The status of the receiving party.
     * @returns True if there was a change to the negotiation terms.
     */
    public update(negotationFields: any, sender: 'buyer' | 'publisher',
        senderStatus: 'active' | 'archived' | 'deleted' | 'accepted' | 'rejected',
        partnerStatus: 'active' | 'archived' | 'deleted' | 'accepted' | 'rejected') {

        let existDifference = false;

        this.sender = sender;

        for (let key in negotationFields) {
            if (negotationFields[key] && negotationFields[key] !== this[key]) {
                this[key] = negotationFields[key];
                existDifference = true;
            }
        }

        if (sender === 'publisher') {
            this.publisherStatus = senderStatus;
            this.buyerStatus = partnerStatus;
        } else {
            this.buyerStatus = senderStatus;
            this.publisherStatus = partnerStatus;
        }

        return existDifference;

    }

    /**
     * Return payload formated object
     */
    public toPayload(): any {
        let payload: any = {
            publisher_id: this.publisherID,
            publisher_contact: this.publisherInfo.toContactPayload(),
            buyer_id: this.buyerID,
            buyer_contact: this.buyerInfo.toContactPayload(),
            description: this.proposedDeal.description,
            name: this.proposedDeal.name,
            auction_type: this.proposedDeal.auctionType,
            deal_section_id: this.proposedDeal.sections,
            currency: this.proposedDeal.currency,
            terms: this.terms || undefined,
            impressions: this.impressions || undefined,
            budget: this.budget || undefined,
            price: this.price || undefined,
            start_date: this.formatDate(this.startDate),
            end_date: this.formatDate(this.endDate),
            created_at: (new Date(this.createDate)).toISOString(),
            modified_at: (new Date(this.modifyDate)).toISOString()
        };

        return payload;
    }

    /** 
     * Format the dates to yyyy-mm-dd
     * @param dateString - The date as a string.
     */
    private formatDate(dateString: string | Date) {

        if (!dateString) {
            return undefined;
        }

        let date = new Date(dateString.toString());

        if (dateString.toString().includes('0000-00-00')) {
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

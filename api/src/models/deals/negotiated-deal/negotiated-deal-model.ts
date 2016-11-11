'use strict';

import { Helper } from '../../../lib/helper';
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
    public createDate: Date;
    /** Modified date of the negotation */
    public modifyDate: Date;

    /** The original proposed deal */
    public proposedDeal: ProposedDealModel;

    /** 
     * These are the new terms of the proposed deal
     */

    /** Start date of the deal */
    public startDate: Date | '0000-00-00';
    /** End date of the package */
    public endDate: Date  | '0000-00-00';
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
     * @param senderStatus - The response the sender is sending.
     * @param partnerStatus - The status of the receiving party.
     * @returns True if there was a change to the negotiation terms.
     */
    public update(sender: 'buyer' | 'publisher', senderStatus: 'active' | 'archived' | 'deleted' | 'accepted' | 'rejected',
        partnerStatus: 'active' | 'archived' | 'deleted' | 'accepted' | 'rejected', negotiationFields: any = {}) {

        let existDifference = false;

        this.sender = sender;

        for (let key in negotiationFields) {
            if (negotiationFields[key] && negotiationFields[key] !== this[key]) {
                this[key] = negotiationFields[key];
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
    public toPayload(userType: string): any {

        let partner;

        if (userType === 'IXMB') {
            partner = this.publisherInfo.toPayload('partner_id');
        } else {
            partner = this.buyerInfo.toPayload('partner_id');
        }

        return {
            proposal: this.proposedDeal.toSubPayload(),
            partner: partner,
            terms: this.terms,
            impressions: this.impressions,
            budget: this.budget,
            price: this.price,
            start_date: Helper.formatDate(this.startDate),
            end_date: Helper.formatDate(this.endDate),
            created_at: this.createDate.toISOString(),
            modified_at: this.modifyDate.toISOString()
        };

    }

}

export { NegotiatedDealModel }

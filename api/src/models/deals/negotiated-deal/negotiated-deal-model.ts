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
    public createDate: Date;
    /** Modified date of the negotation */
    public modifyDate: Date;

    /** The original proposed deal */
    public proposedDeal: ProposedDealModel;

    /** 
     * These are the new terms of the proposed deal
     */

    /** Start date of the deal */
    public startDate: string | null;
    /** End date of the proposal */
    public endDate: string | null;
    /** Price of the proposal */
    public price: number | null;
    /** Projected amout of impressions for the proposal */
    public impressions: number | null;
    /** Project amount to be spend by the buyer */
    public budget: number | null;
    /** Free text that both parties can edit to convene of specific deal conditions */
    public terms: string | null;

    /**
     * Constructor
     * @param initParams - Initial parameters to populate the deal negotiation model.
     */
    constructor(initParams: any = {}) {
        Object.assign(this, initParams);
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
     * Function to inspect if the negotiation is active
     * @returns true if the negotiation and associated proposal are all active
     */
    public isActive() {

        let negotiationActive = (this.publisherStatus === 'accepted' && this.buyerStatus === 'active') ||
                                (this.buyerStatus === 'accepted' && this.publisherStatus === 'active');

        return negotiationActive && this.proposedDeal.isActive();

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

        if (this.proposedDeal.isDeleted()) {
            return {
                proposal: this.proposedDeal.toPayload(),
                partner: partner,
                status: this.setPayloadStatus(userType),
                created_at: this.createDate.toISOString(),
                modified_at: this.modifyDate.toISOString()
            };
        } else {
            return {
                proposal: this.proposedDeal.toPayload(),
                partner: partner,
                status: this.setPayloadStatus(userType),
                terms: this.terms,
                impressions: this.impressions,
                budget: this.budget,
                price: this.price,
                start_date: this.startDate,
                end_date: this.endDate,
                created_at: this.createDate.toISOString(),
                modified_at: this.modifyDate.toISOString()
            };
        }

    };

    /**
     * Checks whether this negotiated deal is readable by a specific user. The user must just be one of the negotiating parties.
     * @param user - the user in question
     * @returns true if the negotiation is readable by the user
     */
    public isReadableByUser(user: UserModel) {
        return (user.id === this.buyerID || user.id === this.publisherID);
    }

    /**
     * Determines the status to return to the user based on buyer and publisher status
     */
    private setPayloadStatus(userType: string) {

        if (this.proposedDeal.status === 'deleted') {
            return 'closed_by_owner';
        }

        if (userType === 'IXMB') {
            if (this.buyerStatus === 'active') {
                return 'waiting_on_you';
            } else if (this.buyerStatus === 'rejected') {
                return 'rejected_by_you';
            } else if (this.publisherStatus === 'active') {
                return 'waiting_on_partner';
            } else if (this.publisherStatus === 'rejected') {
                return 'rejected_by_partner';
            }
        } else {
            if (this.publisherStatus === 'active') {
                return 'waiting_on_you';
            } else if (this.publisherStatus === 'rejected') {
                return 'rejected_by_you';
            } else if (this.buyerStatus === 'active') {
                return 'waiting_on_partner';
            } else if (this.buyerStatus === 'rejected') {
                return 'rejected_by_partner';
            }
        }

        return 'accepted';

    }

}

export { NegotiatedDealModel }

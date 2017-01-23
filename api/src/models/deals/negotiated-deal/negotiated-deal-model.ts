'use strict';

import { MarketUserModel } from '../../market-user/market-user-model';
import { Helper } from '../../../lib/helper';
import { ProposedDealModel } from '../proposed-deal/proposed-deal-model';

class NegotiatedDealModel {

    /** ID of the negotation in ixmDealNegotiation */
    public id: number;
    /** The partner in this negotiation */
    public partner: MarketUserModel;
    /** Publisher's status */
    public ownerStatus: 'active' | 'archived' | 'deleted' | 'accepted' | 'rejected';
    /** Buyer's status */
    public partnerStatus: 'active' | 'archived' | 'deleted' | 'accepted' | 'rejected';
    /** Which party last updated this offer */
    public sender: 'owner' | 'partner';
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
    constructor(initParams: Partial<NegotiatedDealModel> = {}) {
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
    public update(sender: 'owner' | 'partner', senderStatus: 'active' | 'archived' | 'deleted' | 'accepted' | 'rejected',
        receiverStatus: 'active' | 'archived' | 'deleted' | 'accepted' | 'rejected', negotiationFields: Partial<NegotiatedDealModel> = {}) {

        let existDifference = false;

        this.sender = sender;

        for (let key in negotiationFields) {
            if (typeof negotiationFields[key] === 'undefined') {
                continue;
            }

            if (this[key] && negotiationFields[key] !== this[key] || !this[key] && this.proposedDeal[key] !== negotiationFields[key]) {
                this[key] = negotiationFields[key];
                existDifference = true;
            }
        }

        if (sender === 'partner') {
            this.partnerStatus = senderStatus;
            this.ownerStatus = receiverStatus;
        } else {
            this.ownerStatus = senderStatus;
            this.partnerStatus = receiverStatus;
        }

        return existDifference;

    }

    /**
     * Function to inspect if the negotiation is active.
     * @returns True if the negotiation is still going back and forth.
     */
    public isActive() {
        return (this.ownerStatus === 'accepted' && this.partnerStatus === 'active') || (this.partnerStatus === 'accepted' && this.ownerStatus === 'active');
    }

    /**
     * Returns true if the negotiation can be bought as is.
     */
    public isValid() {

        let endDate = this.endDate || this.proposedDeal.endDate;
        let startDate = this.startDate || this.proposedDeal.startDate;
        let today = Helper.formatDate((new Date()).toDateString());

        return (startDate <= endDate && endDate >= today || endDate === '0000-00-00') && !this.proposedDeal.isDeleted();

    }

    /**
     * Returns the publisher for the negotiation.
     */
    public getPublisher(): MarketUserModel {

        if (this.partner.isBuyer()) {
            return this.proposedDeal.owner;
        } else {
            return this.partner;
        }

    }

    /**
     * Return payload formated object
     */
    public toPayload(user: MarketUserModel): any {

        let otherParty: any;
        let otherPartyID: number;

        let person: 'partner' | 'owner' = user.company.id === this.partner.company.id ? 'partner' : 'owner';

        if (person === 'owner') {
            otherParty = this.partner.toPayload();
            otherPartyID = this.partner.company.id;
        } else {
            otherParty = this.proposedDeal.owner.toPayload();
            otherPartyID = this.proposedDeal.owner.company.id;
        }

        if (this.proposedDeal.isDeleted()) {
            return {
                proposal: this.proposedDeal.toPayload(),
                partner_id: otherPartyID,
                contact: otherParty,
                status: this.setPayloadStatusFor(person),
                created_at: this.createDate.toISOString(),
                modified_at: this.modifyDate.toISOString()
            };
        } else {
            return {
                proposal: this.proposedDeal.toPayload(),
                partner_id: otherPartyID,
                contact: otherParty,
                status: this.setPayloadStatusFor(person),
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
    public isReadableByUser(user: MarketUserModel) {
        return user.company.id === this.partner.company.id || user.company.id === this.proposedDeal.owner.company.id;
    }

    /**
     * Determines the status to return to the user based on buyer and publisher status
     */
    private setPayloadStatusFor(person: 'partner' | 'owner') {

        if (this.proposedDeal.status === 'deleted') {
            return 'closed_by_owner';
        }

        if (person === 'partner') {
            if (this.partnerStatus === 'active') {
                return 'waiting_on_you';
            } else if (this.partnerStatus === 'rejected') {
                return 'rejected_by_you';
            } else if (this.ownerStatus === 'active') {
                return 'waiting_on_partner';
            } else if (this.ownerStatus === 'rejected') {
                return 'rejected_by_partner';
            }
        } else {
            if (this.ownerStatus === 'active') {
                return 'waiting_on_you';
            } else if (this.ownerStatus === 'rejected') {
                return 'rejected_by_you';
            } else if (this.partnerStatus === 'active') {
                return 'waiting_on_partner';
            } else if (this.partnerStatus === 'rejected') {
                return 'rejected_by_partner';
            }
        }

        return 'accepted';

    }

}

export { NegotiatedDealModel }

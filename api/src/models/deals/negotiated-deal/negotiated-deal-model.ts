'use strict';

import { MarketUserModel } from '../../market-user/market-user-model';
import { ProposedDealModel } from '../proposed-deal/proposed-deal-model';
import { DealSectionModel } from '../../deal-section/deal-section-model';
import { Helper } from '../../../lib/helper';

class NegotiatedDealModel {

    /** ID of the negotation in ixmNegotiation */
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
    /** The sections relating to the current negotiation */
    public sections: DealSectionModel[] = [];

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

    /** Private variables incoming */
    private oldSections: number[] = null;

    /**
     * Constructor
     * @param initParams - Initial parameters to populate the deal negotiation model.
     */
    constructor(initParams: Partial<NegotiatedDealModel> & { oldSections?: number[]} = {}) {
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
        let currentSections: DealSectionModel[] = [];
        let newSections: DealSectionModel[] = [];

        this.sender = sender;

        for (let key in negotiationFields) {
            if (typeof negotiationFields[key] === 'undefined') {
                continue;
            }

            if (key === 'sections') {
                currentSections = this[key];
                newSections = negotiationFields[key];
                continue;
            }

            if (this[key] && negotiationFields[key] !== this[key] || !this[key] && this.proposedDeal[key] !== negotiationFields[key]) {
                this[key] = negotiationFields[key];
                existDifference = true;
            }
        }

        if (currentSections.length > 0 || newSections.length > 0) {
            let currentSectionIds = currentSections.map((section) => { return section.id; });
            let newSectionIds = newSections.map((section) => { return section.id; });

            if (!Helper.arrayEqual(currentSectionIds, newSectionIds)) {
                this.oldSections = currentSectionIds;
                this.sections = negotiationFields.sections;
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
     * Returns true if the negotiation is still going back and forth.
     */

    public isWaiting() {
        return (this.ownerStatus === 'accepted' && this.partnerStatus === 'active') || (this.partnerStatus === 'accepted' && this.ownerStatus === 'active');
    }

    /**
     * Returns true if the negotiation is expired.
     */
    public isExpired() {

        let endDate = this.endDate || this.proposedDeal.endDate;
        let startDate = this.startDate || this.proposedDeal.startDate;
        let today = Helper.formatDate((new Date()).toDateString());

        return !(startDate <= endDate && endDate >= today || endDate === '0000-00-00');

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
     * Checks whether this negotiated deal is readable by a specific user. The user must just be one of the negotiating parties.
     * @param user - the user in question
     * @returns true if the negotiation is readable by the user
     */
    public isReadableByUser(user: MarketUserModel) {
        return user.company.id === this.partner.company.id || user.company.id === this.proposedDeal.owner.company.id;
    }

    /**
     * Processes the difference between the current negotiation-section mapping and the desired negotiation-section mapping
     * @param: newSectionIds - the input to the API. Need to be diffed with what is already in the database
     */
    public getSectionDiff(newSectionIds: number[]) {

        let diff: ArrayDiffResult = Helper.checkDiff(this.oldSections, newSectionIds);

        this.oldSections = null;

        return diff;

    }

    /**
     * To check if sections were updated through input and therefore need to be updated in the database
     * @returns: boolean - true if need update, false otherwise
     */
    public sectionsUpdated () {
        return this.oldSections !== null;
    }

    /**
     * Check if at least one of the sections of this negotiated deal is valid.
     * @return: true if at least one section is valid, false otherwise.
     */
    public hasOneValidSection() {

        if (this.sections.length === 0) {
            return this.proposedDeal.oneSectionValid();
        }

        for (let i = 0; i < this.sections.length; i++) {
            if (this.sections[i].isActive()) {
                return true;
            }
        }

        return false;

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
                modified_at: this.modifyDate.toISOString(),
                inventory: this.sections.map((section) => { return section.toPayload(); })
            };
        }

    };

}

export { NegotiatedDealModel }

'use strict';

import { MarketUserModel } from '../../market-user/market-user-model';
import { DealSectionModel } from '../../deal-section/deal-section-model';
import { Helper } from '../../../lib/helper';

class ProposedDealModel {

    /** ID of the proposal */
    public id: number;
    /** The owner user model */
    public owner: MarketUserModel;
    /** Name of the proposal, unique value */
    public name: string;
    /** Description of the proposal */
    public description: string;
    /** Status of the packge, which could only be active, paused or deleted */
    public status: 'active' | 'paused' | 'deleted';
    /** Flag to define is the proposal viewable to public */
    public isPublic: number;
    /** Start date of the proposal */
    public startDate: string;
    /** End date of the proposal */
    public endDate: string;
    /** Price of the proposal */
    public price: number;
    /** Projected amout of impressions for the proposal */
    public impressions: number;
    /** Project amount to be spend by the buyer */
    public budget: number;
    /** Auction type of the deal, which could only be first, second or fixed */
    public auctionType: 'first' | 'second' | 'fixed';
    /** Free text that both parties can edit to convene of specific deal conditions */
    public terms: string;
    /** Created date of the proposal */
    public createDate: Date;
    /** Modified date of the proposal */
    public modifyDate: Date;
    /** Array of sectionsID associated with the proposal */
    public sections: DealSectionModel[];
    /** The currency the proposal is in */
    public currency: string = 'USD';
    /** Targetted Users */
    public targetedUsers: number[] = [];

    /**
     * Constructor
     * @param initParams - Initial parameters to populate the proposal model.
     */
    constructor(initParams: Partial<ProposedDealModel> = {}) {
        Object.assign(this, initParams);
    }

    /**
     * Checks that a proposed deal can currently be displayed in the market by checking its start and end dates,
     * that is has at least one section, that its status is active, and that its owner is active
     * @returns a boolean indicating whether the proposed deal is available to buy or not
     */
    public isActive(): boolean {
        return (this.sections.length > 0) && (this.status === 'active') && this.owner.isActive();
    }

    public isExpired(): boolean {

        let today = Helper.formatDate((new Date()).toDateString());

        return !((this.startDate <= this.endDate && this.endDate >= today) || this.endDate === '0000-00-00');

    }

    /**
     * Checks that a proposed deal is purchasable by a specific user. The proposal must be a valid purchasable 
     * proposal, its owner must be active, and the user viewing it must not have the same type as 
     * its owner (publishers can't view other publishers' proposals, and the same applies to buyers).
     * Also ensures that if the proposal is targeted, it is targeted to the current user. 
     * @param user - the user in question
     * @returns true if the proposal is purchasable by this user
     */
    public isPurchasableByUser(user: MarketUserModel) {
        return this.isActive() && !this.isExpired() && user.isBuyer() !== this.owner.isBuyer() && this.targetsUser(user);
    }

    /**
     * Checks that a proposed deal is readable by a specific user. The proposal must be available for the market
     * and targeted towards the current user if it's a targeted proposal, or
     * the proposal must be owned by the user and not deleted.
     * @param user - the user in question
     * @returns true if the proposal is readable by this user
     */
    public isReadableByUser(user: MarketUserModel) {
        return this.isActive() && !this.isExpired() && this.targetsUser(user) || this.owner.company.id === user.company.id && !this.isDeleted();
    }

    /**
     * Check that negotiations on this proposal can be viewed by the user.
     * @param user - The user in question.
     * @param hasNegotiations - If the user already has negotiations on this proposal.
     */
    public hasNegotiationsViewableBy(user: MarketUserModel, hasNegotiations: boolean) {
        return this.targetsUser(user) || this.owner.company.id === user.company.id || !hasNegotiations && this.isReadableByUser(user);
    }

    /**
     * Returns true if the proposal is deleted.
     */
    public isDeleted() {
        return this.status === 'deleted';
    }

    /**
     * Returns true if the proposal targets the user
     */
    public targetsUser(user: MarketUserModel) {
        return !(this.targetedUsers.length > 0 && this.targetedUsers.indexOf(user.company.id) === -1);
    }

    /**
     * Update the current proposal with new fields.
     * @param proposalFields - Fields to update.
     * @returns True if there was a change to the proposal.
     */
    public update(proposalFields: any) {

        let different = false;

        for (let key in proposalFields) {
            if (proposalFields[key] && proposalFields[key] !== this[key]) {
                this[key] = proposalFields[key];
                different = true;
            }
        }

        return different;

    }

    /**
     * Return the model as a ready-to-send JSON object.
     * @returns - The model as specified in the API.
     */
    public toPayload(): any {

        if (this.isDeleted()) {
            return {
                proposal_id: this.id,
                status: this.status,
                created_at: this.createDate.toISOString(),
                modified_at: this.modifyDate.toISOString()
            };
        } else {
            return {
                proposal_id: this.id,
                owner_id: this.owner.company.id,
                contact: this.owner.toPayload(),
                partners: this.targetedUsers,
                name: this.name,
                status: this.status,
                currency: this.currency,
                description: this.description,
                start_date: this.startDate,
                end_date: this.endDate,
                price: this.price,
                impressions: this.impressions,
                budget: this.budget,
                auction_type: this.auctionType,
                terms: this.terms,
                created_at: this.createDate.toISOString(),
                modified_at: this.modifyDate.toISOString(),
                inventory: this.sections.map((section) => { return section.toPayload(); })
            };
        }

    }

    /**
     * Return a subset of the information for the proposal.
     * @param minimal - Returns only the most basic information about the proposal, used almost exclusively for settled deal.
     * @returns - A subset of the model.
     */
    public toSubPayload(minimal?: boolean): any {

        let infoURL = `deals/proposals/${this.id}`;

        if (minimal) {
            return {
                proposal_id: this.id,
                name: this.name,
                description: this.description,
                currency: this.currency,
                resource: infoURL
            };
        } else {
            return {
                proposal_id: this.id,
                name: this.name,
                description: this.description,
                auction_type: this.auctionType,
                inventory: this.sections.map((section) => { return section.toSubPayload(); }),
                currency: this.currency,
                resource: infoURL
            };
        }

    }

}

export { ProposedDealModel }

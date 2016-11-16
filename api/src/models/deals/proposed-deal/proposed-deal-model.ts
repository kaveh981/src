'use strict';

import { UserModel } from '../../user/user-model';
import { DealSectionModel } from '../../deal-section/deal-section-model';
import { Helper } from '../../../lib/helper';
import { ConfigLoader } from '../../../lib/config-loader';
import { Injector } from '../../../lib/injector';

const configLoader = Injector.request<ConfigLoader>('ConfigLoader');

class ProposedDealModel {

    /** ID of the proposal */
    public id: number;
    /** ID of the proposal's owner, corresponding to users in database */
    public ownerID: number;
    /** Contact information for the owner */
    public ownerInfo: UserModel;
    /** Name of the proposal, unique value */
    public name: string;
    /** Description of the proposal */
    public description: string;
    /** Status of the packge, which could only be active, paused or deleted */
    public status: 'active' | 'paused' | 'deleted';
    /** Flag to define is the proposal viewable to public */
    public isPublic: number;
    /** Start date of the proposal */
    public startDate: Date | '0000-00-00';
    /** End date of the proposal */
    public endDate: Date | '0000-00-00';
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
    /** Array of sectionsID associated with the proposal*/
    public sections: DealSectionModel[];
    /** The currency the proposal is in */
    public currency: string = 'USD';

     /**
     * Constructor
     * @param initParams - Initial parameters to populate the proposal model.
     */
    constructor(initParams?: any) {
        if (initParams) {
            Object.assign(this, initParams);
        }
    }

    /**
     * Checks that a proposed deal is currently available to buy by checking its start and end dates,
     * that is has at least one section, and that its status is active
     * @returns a boolean indicating whether the proposed deal is available to buy or not
     */
    public isAvailable(): boolean {

        let startDate = Helper.formatDate(this.startDate);
        let endDate = Helper.formatDate(this.endDate);
        let today = Helper.formatDate(new Date());

        return (this.sections.length > 0) && (this.status === 'active')
            && (startDate <= endDate) && (endDate >= today || endDate === '0000-00-00');

    }

    /**
     * Checks that a proposed deal is accessible by a specific user (can be returned by any of the
     * listing routes). The proposal must be a valid purchaseable proposal, its owner must be active, 
     * and the user viewing it must be a user that's not the same type as its owner (publishers can't 
     * view other publishers' proposals, and the same applies to buyers). Alternatively, the proposal 
     * must be owned by the user.
     * @param user - the user in question
     * @returns true if the proposal is accessible by this user
     */
    public isAccessibleByUser(user: UserModel) {
        return (this.isAvailable() && this.ownerInfo.status === 'A' && this.ownerInfo.userType !== user.userType)
                || this.ownerInfo.id === user.id;
    }

    /**
     * Return the model as a ready-to-send JSON object.
     * @returns - The model as specified in the API.
     */
    public toPayload(): any {

        return {
            proposal_id: this.id,
            owner: this.ownerInfo.toPayload('owner_id'),
            name: this.name,
            status: this.status,
            currency: this.currency,
            description: this.description,
            start_date: Helper.formatDate(this.startDate),
            end_date: Helper.formatDate(this.endDate),
            price: this.price,
            impressions: this.impressions,
            budget: this.budget,
            auction_type: this.auctionType,
            terms: this.terms,
            created_at: this.createDate.toISOString(),
            modified_at: this.modifyDate.toISOString(),
            inventory: this.sections.map((section) => { return section.toSubPayload(); })
        };

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

'use strict';

import { UserModel } from '../../user/user-model';

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
    public createDate: string;
    /** Modified date of the proposal */
    public modifyDate: string;
    /** Array of sectionsID associated with the proposal*/
    public sections: number[];
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

        let startDate = this.formatDate(this.startDate);
        let endDate = this.formatDate(this.endDate);
        let today = this.formatDate(new Date());

        return (this.sections.length > 0) && (this.status === 'active')
            && (startDate <= endDate) && (endDate >= today || endDate === '0000-00-00');

    }

    /**
     * Return the model as a ready-to-send JSON object.
     * @returns - The model as specified in the API.
     */
    public toPayload(): any {

        return {
            id: this.id,
            owner_id: this.ownerID,
            contact: this.ownerInfo.toContactPayload(),
            name: this.name,
            status: this.status,
            currency: this.currency,
            description: this.description,
            start_date: this.formatDate(this.startDate),
            end_date: this.formatDate(this.endDate),
            price: this.price,
            impressions: this.impressions,
            budget: this.budget,
            auction_type: this.auctionType,
            terms: this.terms,
            created_at: (new Date(this.createDate)).toISOString(),
            modified_at: (new Date(this.modifyDate)).toISOString(),
            inventory: this.sections
        };

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

export { ProposedDealModel }

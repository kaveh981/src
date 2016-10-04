'use strict';

import { ContactModel } from '../contact-info/contact-model';

class PackageModel {

    /** ID of the package */
    public packageID: number;
    /** ID of the package's owner, corresponding to users in database */
    public ownerID: number;
    /** Contact information for the owner */
    public ownerContactInfo: ContactModel;
    /** Name of the package, unique value */
    public name: string;
    /** Description of the package */
    public description: string;
    /** Status of the packge, which could only be active, paused or deleted */
    public status: 'active' | 'paused' | 'deleted';
    /** Flag to define is the package viewable to public */
    public isPublic: number;
    /** Start date of the package */
    public startDate: string;
    /** End date of the package */
    public endDate: string;
    /** Price of the package */
    public price: number;
    /** Projected amout of impressions for the package */
    public impressions: number;
    /** Project amount to be spend by the buyer */
    public budget: number;
    /** Auction type of the deal, which could only be first, second or fixed */
    public auctionType: 'first' | 'second' | 'fixed';
    /** Free text that both parties can edit to convene of specific deal conditions */
    public terms: string;
    /** Created date of the package */
    public createDate: string;
    /** Modified date of the package */
    public modifyDate: string;
    /** Array of sectionsID associated with the package*/
    public sections: number[];

     /**
     * Constructor
     * @param initParams - Initial parameters to populate the package model.
     */
    constructor(initParams?: any) {
        if (initParams) {
            Object.assign(this, initParams);
        }
    }

    /**
     * Checks that a package is currently available to buy by checking its start and end dates,
     * as well as its owner's current status
     * @param owner - owner of the package
     * @returns a boolean indicating whether the package is available to buy or not
     */
    public isValidAvailablePackage(): boolean {
        let startDate = new Date(this.startDate);
        let endDate = new Date(this.endDate);
        let today = new Date(Date.now());
        let zeroDate = '0000-00-00';

        // Set all date "hours" to be 0 to be able to just compare the dates alone
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        return (startDate.toDateString() !== 'Invalid Date' && endDate.toDateString() !== 'Invalid Date')
            && (startDate < endDate || startDate.toDateString() === endDate.toDateString())
            && (endDate >= today || this.endDate === zeroDate)
            && this.sections.length > 0;
    }

    /**
     * Return the model as a ready-to-send JSON object.
     * @returns - The model as specified in the API.
     */
    public toPayload(): any {
        return {
            id: this.packageID,
            publisher_id: this.ownerID,
            contact: {
                title: this.ownerContactInfo.title,
                name: this.ownerContactInfo.name,
                email: this.ownerContactInfo.emailAddress,
                phone: this.ownerContactInfo.phone
            },
            name: this.name,
            description: this.description,
            start_date: this.startDate,
            end_date: this.endDate,
            price: this.price,
            impressions: this.impressions,
            budget: this.budget,
            auction_type: this.auctionType,
            terms: this.terms,
            created_at: this.createDate,
            modified_at: this.modifyDate,
            deal_section_id: this.sections
        };
    }

}

export { PackageModel }

'use strict';

import { UserModel } from '../user/user-model';

class PackageModel implements IPackageModel {
    /** ID of the package */
    public packageID: number;
    /** ID of the package's owner, corresponding to users in database */
    public ownerID: number;
    /** Contact information for the owner */
    public ownerContactInfo: IContactModel;
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
    public modifiyDate: string;
    /** Array of sectionsID associated with the package*/
    public sections: number[];

     /**
     * Constructor
     * @param initParams - Initial parameters to populate the package model.
     */
    constructor(initParams?: IPackageModel) {
        if (initParams) {
            Object.assign(this, initParams);
        }
    }

    public isValidAvailablePackage(user: UserModel): boolean {
        let startDate: Date = new Date(this.startDate);
        let endDate: Date = new Date(this.endDate);
        let today: Date = new Date(Date.now());
        let zeroDate: string = '0000-00-00';
        // Set all date "hours" to be 0 to be able to just compare the dates alone
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        return user.userStatus === 'A'
            && (startDate <= today || this.startDate === zeroDate)
            && (endDate >= today || this.endDate === zeroDate)
            && this.sections.length > 0;
    }

    /**
     * TODO: empty function, need to validate date and enum?
     * validate the package model object, see if all attributes are valid
     * @returns Returns a string indicate which attributes are incorrect
     */
    public validate(): string {
        return;
    }
}

export { PackageModel }

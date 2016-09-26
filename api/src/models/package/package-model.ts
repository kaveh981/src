'use strict';

import { UserModel } from '../user/user-model';

/**
 * Interface for package which represents a potential deal
 */
interface IPackageModel {
    /** ID of the package */
    packageID?: number;
    /** ID of the package's owner, corresponding to users in database */
    ownerID: number;
    /** Name of the package, unique value */
    name: string;
    /** Description of the package */
    description?: string;
    /** Status of the packge, which could only be active, paused or deleted */
    status?: string;
    /** Flag to define is the package viewable to public */
    isPublic: number;
    /** Start date of the package */
    startDate?: string;
    /** End date of the package */
    endDate?: string;
    /** Price of the package */
    price?: number;
    /** Projected amout of impressions for the package */
    impressions: number;
    /** Project amount to be spend by the buyer */
    budget: number;
    /** Auction type of the deal, which could only be first, second or fixed */
    auctionType?: string;
    /** Free text that both parties can edit to convene of specific deal conditions */
    terms?: string;
    /** Created date of the package */
    createDate?: string;
    /** Modified date of the package */
    modifiyDate?: string;
    /** Array of sectionsID associated with the package*/
    sections: number[];
}

class PackageModel implements IPackageModel {
    /** ID of the package */
    public packageID: number;
    /** ID of the package's owner, corresponding to users in database */
    public ownerID: number;
    /** Name of the package, unique value */
    public name: string;
    /** Description of the package */
    public description: string;
    /** Status of the packge, which could only be active, paused or deleted */
    public status: string;
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
    public auctionType: string;
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
}

export { PackageModel }

'use strict';

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

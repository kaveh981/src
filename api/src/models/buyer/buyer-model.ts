'use strict';

interface IBuyerModel {
    /** The buyer's userID */
    userId: number;
    /** An array of dspID's associated with this buyer */
    dspIds: number[];
    /** The buyer's contact info (to be potentially replaced by a ContactInfo object) */
    emailAddress: string;
    firstName: string;
    lastName: string;
    companyName: string;
}

/**
 * IXM Buyer Model
 */
class BuyerModel implements IBuyerModel {
    /** The buyer's userID */
    public userId: number;
    /** An array of dspID's associated with this buyer */
    public dspIds: number[];
    /** The buyer's contact info (to be potentially replaced by a ContactInfo object) */
    public emailAddress: string;
    public firstName: string;
    public lastName: string;
    public companyName: string;

    /**
     * Constructor
     * @param initParams - Initial parameters to populate the buyer model.
     */
    constructor(initParams?: IBuyerModel) {
        if (initParams) {
            Object.assign(this, initParams);
        }
    }

}

export { BuyerModel }


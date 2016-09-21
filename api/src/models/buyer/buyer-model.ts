'use strict';

import { ContactModel } from '../contact-info/contact-model';

interface IBuyerModel {
    /** The buyer's userID */
    userId: number;

    /** An array of dspID's associated with this buyer */
    dspIds: number[];

    /** The buyer's contact info */
    contactInfo?: ContactModel;
}

/**
 * IXM Buyer Model
 */
class BuyerModel implements IBuyerModel {

    /** The buyer's userID */
    public userId: number;

    /** An array of dspID's associated with this buyer */
    public dspIds: number[];

    /** The buyer's contact info */
    public contactInfo: ContactModel;

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
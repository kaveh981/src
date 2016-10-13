'use strict';

import { ContactModel } from '../contact-info/contact-model';

class BuyerModel {

    /** The buyer's userID */
    public userID: number;
    /** An array of dspID's associated with this buyer */
    public dspIDs: number[];
    /** The buyer's contact info */
    public contactInfo: ContactModel;

    /**
     * Constructor
     * @param initParams - Initial parameters to populate the buyer model.
     */
    constructor(initParams?: any) {
        if (initParams) {
            Object.assign(this, initParams);
        }
    }

}

export { BuyerModel }

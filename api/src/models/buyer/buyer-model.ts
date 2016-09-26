'use strict';

class BuyerModel implements IBuyerModel {
    /** The buyer's userID */
    public userID: number;
    /** An array of dspID's associated with this buyer */
    public dspIDs: number[];
    /** The buyer's contact info */
    public contactInfo: IContactModel;

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

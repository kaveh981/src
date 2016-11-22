'use strict';

import { UserModel } from '../user/user-model';

class BuyerModel {

    /** The buyer's userID */
    public userID: number;
    /** An array of dspID's associated with this buyer */
    public dspIDs: number[];
    /** The buyer's contact info */
    public userInfo: UserModel;

    /**
     * Constructor
     * @param initParams - Initial parameters to populate the buyer model.
     */
    constructor(initParams: any = {}) {
        Object.assign(this, initParams);
    }

}

export { BuyerModel }

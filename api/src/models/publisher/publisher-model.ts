'use strict';

import { UserModel } from '../user/user-model';

class PublisherModel {

    /** The pub's userID */
    public userID: number;
    /** The pub's contact info */
    public userInfo: UserModel;

    /**
     * Constructor
     * @param initParams - Initial parameters to populate the pub model.
     */
    constructor(initParams?: any) {
        if (initParams) {
            Object.assign(this, initParams);
        }
    }

}

export { PublisherModel }

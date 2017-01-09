'use strict';

import { UserModel } from '../user/user-model';

class MarketUserModel {

    /** Company user */
    public company: UserModel;

    /** Representative user */
    public contact: UserModel;

    /** If the user only has read-only access */
    public readOnly: boolean;

    constructor(initialParams: Partial<MarketUserModel> = {}) {
        Object.assign(this, initialParams);
    }

    /** 
     * The user is considered active if the company is active. 
     */
    public isActive() {
        return this.company.isActive();
    }

    /**
     * Is this user a buyer? 
     */
    public isBuyer() {
        return this.company.isBuyer();
    }

    /**
     * Is the user an individual representing a company, or a company?
     */
    public isCompany() {
        return this.company.id === this.contact.id;
    }

    /**
     * Returns contact information payload based on the status of the contact user.
     */
    public toPayload() {

        if (this.contact.isActive()) {
            return this.contact.toContactPayload();
        } else {
            return this.company.toContactPayload();
        }

    }

}

export { MarketUserModel };

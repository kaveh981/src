'use strict';

class UserModel {

    /** The user's userId */
    public id: number;
    /** The current status of the user */
    public status: string;
    /** The abbreviated name of the user type. */
    public userType: string;
    /** The usergroup to which this user belongs. */
    public userGroup: string;
    /** The contact person's title */
    public title: string = 'Warlord';
    /** The contact person's first name */
    public firstName: string;
    /** The contact person's last name */
    public lastName: string;
    /** The contact person's email address */
    public emailAddress: string;
    /** The contact person's phone number */
    public phone: string;

    public internal: boolean = false;

    /**
     * Constructor
     * @param initParams - Initial parameters to populate the user model.
     */
    constructor(initParams: Partial<UserModel> = {}) {
        Object.assign(this, initParams);
    }

    /**
     * Returns true if the user is active.
     */
    public isActive() {
        return this.status === 'active';
    }

    /**
     * The user is a buyer if they aren't a publisher.
     */
    public isBuyer() {
        return IXM_CONSTANTS.BUYER_TYPES.indexOf(this.userType) !== -1;
    }

    /** 
     * Craft the contact information as payload
     */
    public toContactPayload(): any {

        return {
            title: this.title,
            name: this.firstName + ' ' + this.lastName,
            email: this.emailAddress,
            phone: this.phone
        };

    }

    /** 
     * Craft the user information as payload
     * @param userIDKey - The key to use for ID.
     */
    public toPayload(userIdKey: string = 'id') {

        return {
            [userIdKey]: this.id,
            contact: this.toContactPayload()
        };

    }
}

export { UserModel }

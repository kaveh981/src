'use strict';

class UserModel {

    /** The user's userId */
    public id: string;
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

    /**
     * Constructor
     * @param initParams - Initial parameters to populate the user model.
     */
    constructor(initParams?: any) {
        if (initParams) {
            Object.assign(this, initParams);
        }
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
}

export { UserModel }

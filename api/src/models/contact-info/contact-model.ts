'use strict';

class ContactModel {

    /** User Id of the model */
    public userID: number;
    /** The contact person's title */
    public title: string = 'Warlord';
    /** The contact person's name */
    public name: string;
    /** The contact person's email address */
    public emailAddress: string;
    /** The contact person's phone number */
    public phone: string;

    /**
     * Constructor
     * @param initParams - Initial parameters to populate the contact model.
     */
    constructor(initParams?: any) {
        if (initParams) {
            Object.assign(this, initParams);
        }
    }

    /**
     * Return the model as a ready-to-send JSON object.
     * @returns The model as specified in the API.
     */
    public toPayload(): any {
        return {
            title: this.title,
            name: this.name,
            email: this.emailAddress,
            phone: this.phone
        };
    }
}

export { ContactModel }

'use strict';

interface IContactModel {
    /** UserId of the contact */
    userId: number;

    /** The contact person's title */
    title?: string;

    /** The contact person's name */
    name: string;

    /** The contact person's email address */
    emailAddress: string;

    /** The contact person's phone number */
    phone: string;
}

/** Contact Model */
class ContactModel implements IContactModel {
    /** User Id of the model */
    public userId: number;

    /** The contact person's title */
    public title: string = 'Warlord';

    /** The contact person's name */
    public name: string;

    /** The contact person's email address */
    public emailAddress: string;

    /** The contact person's phone number */
    public phone: string;

    constructor(initParams?: IContactModel) {
        if (initParams) {
            Object.assign(this, initParams);
        }
    }
}

export { ContactModel };

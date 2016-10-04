'use strict';

import { ContactModel } from '../contact-info/contact-model';

class DealModel {

    /** The deal's unique internal identifier */
    public dealID: number;
    /** The publisher offering the deal */
    public publisherID: number;
    /** Publisher information */
    public publisherContact: ContactModel;
    /** The DSP buying the deal */
    public dspID: number;
    /** A descriptive name for the deal */
    public name: string;
    /** The reserved rate of the deal */
    public price: number;
    /** The external ID the DSP must use when they bid with the deal */
    public externalID: string;
    /** The sections where the deal is eligible to serve */
    public sections: number[];
    /** The auction type under which the deal is operating - private */
    public auctionType: 'first' | 'second' | 'fixed';
    /** The current status of the deal - private */
    public status: 'N' | 'A' | 'D' | 'P';
    /** The first day when the deal will serve - private */
    public startDate: string;
    /** The last day when the deal will serve - private */
    public endDate: string;
    /** Currency of the deal */
    public currency: string = 'USD';

    /**
     * Constructor
     * @param initParams - Initial parameters to populate the deal model.
     */
    constructor(initParams?: any) {
        if (initParams) {
            Object.assign(this, initParams);
        }
    }

    /**
     * Return the model as a ready-to-send JSON object.
     * @returns - The model as specified in the API.
     */
    public toPayload(): any {
        return {
            id: this.dealID,
            publisher_id: this.publisherID,
            contact: {
                title: this.publisherContact.title,
                name: this.publisherContact.name,
                email: this.publisherContact.emailAddress,
                phone: this.publisherContact.phone
            },
            currency: this.currency,
            dsp_id: this.dspID,
            name: this.name,
            deal_section_id: this.sections,
            status: this.status,
            start_date: this.startDate,
            end_date: this.endDate,
            auction_type: this.auctionType,
            external_id: this.externalID,
            price: this.price
        };
    }

    /**
     * Helper function that makes sure that a stringhas the format 'YYYY-MM-DD'
     * Ensures that the date provided follows the format 'YYYY-MM-DD'
     * @param date - date about to be set
     */
    private isValidDate(date: string): boolean {
        let datePattern  = /^\d\d\d\d-\d\d-\d\d$/;

        return datePattern.test(date);
    }

}

export { DealModel }

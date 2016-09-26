'use strict';

class DealModel implements IDealModel {
    /** The deal's unique internal identifier */
    public dealID: number;
    /** The publisher offering the deal */
    public publisherID: number;
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

    /**
     * Constructor
     * @param initParams - Initial parameters to populate the deal model.
     */
    constructor(initParams?: IDealModel) {
        if (initParams) {
            Object.assign(this, initParams);
        }
    }

    /**
     * TODO: empty function, need to validate date and enum?
     * validate the deal model object, see if all attributes are valid
     * @returns Returns a string indicate which attributes are incorrect
     */
    public validate(): string {
        return;
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

'use strict';

interface IDealModel {

    /** The deal's unique internal identifier */
    id: number;

    /** The publisher offering the deal */
    publisherId: number;

    /** The DSP buying the deal */
    dspId: number;

    /** A descriptive name for the deal */
    name: string;

    /** The auction type under which the deal is operating */
    auctionType: string;

    /** The reserved rate of the deal */
    price: number;

    /** The current status of the deal */
    status: string;

    /** The first day when the deal will serve */
    startDate: string;

    /** The last day when the deal will serve */
    endDate: string;

    /** The external ID the DSP must use when they bid with the deal */
    externalId: string;

    /** The sections where the deal is eligible to serve */
    sections: number[];

}

/**
 * Generic IX deal model.
 */

class DealModel implements IDealModel {

    /** The deal's unique internal identifier */
    public id: string;

    /** The publisher offering the deal */
    public publisherId: number;

    /** The DSP buying the deal */
    public dspId: number;

    /** A descriptive name for the deal */
    public name: string;

    /** The reserved rate of the deal */
    public price: number;

    /** The external ID the DSP must use when they bid with the deal */
    public externalId: string;

    /** The sections where the deal is eligible to serve */
    public sections: number[];

    /** The auction type under which the deal is operating - private */
    private _auctionType: string;

    /** The current status of the deal - private */
    private _status: string;

    /** The first day when the deal will serve - private */
    private _startDate: string;

    /** The last day when the deal will serve - private */
    private _endDate: string;

    /**
     * Constructor
     * @param initParams - Initial parameters to populate the deal model.
     */
    public constructor(initParams?: IDealModel) {
        if (initParams) {
            Object.assign(this, initParams);
        }
    }

    /**
     * Setter for the private auctionType property - automagically called when trying to assign it 
     * @param at - auction type about to be set
     */
    public set auctionType (at: string) {
        if ( at === 'second' || at === 'first' || at === 'fixed' ) {
            this._auctionType = at;
        } else {
            throw new Error('Auction type must be either fixed, first or second');
        }
    }

    /**
     * Setter for the private status property - automagically called when trying to assign it 
     * Ensures that the status is either New, Active, Deleted or Paused and converts it to the right value
     * @param st - status about to be set
     */
    public set status (st: string) {

        let lowerStatus: string = st.toLowerCase();

        if ( lowerStatus === 'active' ) {
            this._status = 'A';
        } else if ( lowerStatus === 'new' ) {
            this._status = 'N';
        } else if ( lowerStatus === 'paused' ) {
            this._status = 'P';
        } else if ( lowerStatus === 'deleted' ) {
            this._status = 'D';
        } else {
            throw new Error('Status must be either Active, Deleted, New or Paused');
        }
    }

    /**
     * Setter for the private startDate property - automagically called when trying to assign it 
     * Ensures that the date provided follows the format 'YYYY-MM-DD'
     * @param date - date about to be set
     */
    public set startDate (date: string) {

        if ( this.isValidDate(date) ) {
            this._startDate = date;
        } else {
            throw new Error('Start date must follow format "YYYY-MM-DD"');
        }
    }

    /**
     * Setter for the private endDate property - automagically called when trying to assign it 
     * Ensures that the date provided follows the format 'YYYY-MM-DD'
     * @param date - date about to be set
     */
    public set endDate (date: string) {

        if ( this.isValidDate(date) ) {
            this._endDate = date;
        } else {
            throw new Error('End date must follow format "YYYY-MM-DD"');
        }
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

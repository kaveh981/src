'use strict';

class NegotiationModel {

    /** ID of the negotiation */
    public negotiationID: number;
    /** Parent package of the negotiation */
    public packageID: number;
    /** ID of the publisher involved in this negotiation */
    public publisherID: number;
    /** ID of the buyer involved in this negotiation */
    public buyerID: number;
    /** Current negotiated price - if different from the one in package  */
    public price: number;
    /** Current negotiated start date - if different from the one in package */
    public startDate: string;
    /** Current negotiated end date - if different from the one in package */
    public endDate: string;
    /** Current negotiated terms - if different from the one in package */
    public terms: string;
    /** Party who last updated the negotiation */
    public sender: 'P' | 'B';
    /** Keeps track of the publishers position */
    public pubStatus: 'active' | 'archived' | 'deleted' | 'accepted' | 'rejected';
    /** Keeps track of the buyers position */
    public buyerStatus: 'active' | 'archived' | 'deleted' | 'accepted' | 'rejected';
    /** Creation date of the negotiation */
    public createDate: string;
    /** Last modify date of the negotiation*/
    public modifyDate: string;

    /**
     * Constructor
     * @param initParams - Initial parameters to populate the deal negotiation model.
     */
    constructor(initParams?: any) {
        if (typeof initParams === 'object') {
            for (let key in initParams) {
                if (this.hasOwnProperty(key)) {
                    this[key] = initParams[key];
                } else {
                    throw new Error(`Unknown initial parameter ${key}`);
                }
            }
        }
    }

}

export { NegotiationModel }

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
    public sender: 'publisher' | 'buyer';
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
        if (initParams) {
            Object.assign(this, initParams);
        }
    }

}

export { NegotiationModel }

'use strict';

/**
 * Interface of deal negotiation which is an offer made on a package
 */
interface INegotiationModel {
    /** ID of the negotiation */
    neogotiationID?: number;
    /** Parent package of the negotiation */
    packageID: number;
    /** ID of the publisher involved in this negotiation */
    publisherID: number;
    /** ID of the buyer involved in this negotiation */
    buyerID: number;
    /** Current negotiated price - if different from the one in package  */
    price?: number;
    /** Current negotiated start date - if different from the one in package */
    startDate?: string;
    /** Current negotiated end date - if different from the one in package */
    endDate?: string;
    /** Current negotiated terms - if different from the one in package */
    terms?: string;
    /** Party who last updated the negotiation */
    sender?: string;
    /** Keeps track of the publishers position */
    pubStatus?: string;
    /** Keeps track of the buyers position */
    buyerStatus?: string;
    /** Creation date of the negotiation */
    createDate?: string;
    /** Last modify date of the negotiation*/
    modifyDate?: string;
}

/**
 * Generic deal negotiation model
 */
class NegotiationModel implements INegotiationModel {
    /** ID of the negotiation */
    public neogotiationID: number;
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
    public sender: string;
    /** Keeps track of the publishers position */
    public pubStatus: string;
    /** Keeps track of the buyers position */
    public buyerStatus: string;
    /** Creation date of the negotiation */
    public createDate: string;
    /** Last modify date of the negotiation*/
    public modifyDate: string;

    /**
     * Constructor
     * @param initParams - Initial parameters to populate the deal negotiation model.
     */
    constructor(initParams?: INegotiationModel) {
        if (initParams) {
            Object.assign(this, initParams);
        }
    }
}

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
    /** Party who last updated the negotiation P - Publisher, B - Buyer */
    sender?: 'P' | 'B';
    /** Keeps track of the publishers position */
    pubStatus?: 'active' | 'archived' | 'deleted' | 'accepted' | 'rejected';
    /** Keeps track of the buyers position */
    buyerStatus?: 'active' | 'archived' | 'deleted' | 'accepted' | 'rejected';
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
    constructor(initParams?: INegotiationModel) {
        if (initParams) {
            Object.assign(this, initParams);
        }
    }

    /**
     * TODO: empty function, need to validate date and enum?
     * validate the negotiation model object, see if all attributes are valid
     * @returns Returns a string indicate which attributes are incorrect
     */
    public validate(): string {
        return;
    }
}

export { NegotiationModel }

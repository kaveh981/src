'use strict';

import * as Promise from 'bluebird';

import { DatabaseManager } from '../../lib/database-manager';
import { Logger } from '../../lib/logger';

const Log: Logger = new Logger('NEGM');

/**
 * Interface of deal negotiation which is an offer made on a package
 */
interface IDealNegotiation {
    /** ID of the negotiation */
    neogotiationID: number;
    /** Parent package of the negotiation */
    packageID: number;
    /** ID of the publisher involved in this negotiation */
    publisherID: number;
    /** ID of the buyer involved in this negotiation */
    buyerID: number;
    /** Current negotiated price - if different from the one in package  */
    price: number;
    /** Current negotiated start date - if different from the one in package */
    startDate: string;
    /** Current negotiated end date - if different from the one in package */
    endDate: string;
    /** Current negotiated terms - if different from the one in package */
    terms: string;
    /** Party who last updated the negotiation */
    sender: string;
    /** Keeps track of the publishers position */
    pubStatus: string;
    /** Keeps track of the buyers position */
    buyerStatus: string;
    /** Creation date of the negotiation */
    createDate: string;
    /** Last modify date of the negotiation*/
    modifyDate: string;
}

/**
 * Class encapsulates functions related to ixmDealNegotiations
 */
class DealNegotiationModel {

    /**
     * Get deal negotiation object by ID
     * @param negotiationID - the ID of the deal negotiation
     * @returns Returns a deal negotiation object
     */
    public static getNegotiationFromID (negotiationID: number): Promise<IDealNegotiation> {
        return DatabaseManager.select()
                .from('ixmDealNegotiations')
                .where('negotiationID', negotiationID)
                .limit(1)
            .then((rows: any) => {
                return rows[0];
            });
    }

    /**
     * Insert deal negotiation object into database
     * @param negotiationObject - a deal negotiation object
     * @returns Returns the negotiationID of new created negotiation
     */
    public static addNegotiation (negotiationObject: IDealNegotiation): Promise<any> {
        return DatabaseManager.insert({
                    packageID: negotiationObject.packageID,
                    publisherID: negotiationObject.publisherID,
                    buyerID: negotiationObject.buyerID,
                    startDate: negotiationObject.startDate,
                    endDate: negotiationObject.endDate,
                    price: negotiationObject.price,
                    terms: negotiationObject.terms,
                    sender: negotiationObject.sender,
                    pubStatus: negotiationObject.pubStatus,
                    buyerStatus: negotiationObject.buyerStatus,
                    createDate: negotiationObject.createDate,
                    modifyDate: negotiationObject.modifyDate
                })
                .into('ixmDealNegotiations')
            .then((newNegotiationIDs: any) => {
                return newNegotiationIDs[0];
            })
            .catch((err: Error) => {
                Log.error(err.toString());
                throw err;
            });
    }
}

export { DealNegotiationModel }

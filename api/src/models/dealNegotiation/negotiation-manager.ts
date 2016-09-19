'use strict';

import * as Promise from 'bluebird';

import { DatabaseManager } from '../../lib/database-manager';
import { Logger } from '../../lib/logger';

const Log = new Logger('mNEG');

/** Deal Negotiation model manager */
class NegotiationManager {

    /** Internal dbm  */
    private dbm: DatabaseManager;

    /**
     * Constructor
     * @param database - An instance of the database manager.
     */
    constructor(database: DatabaseManager) {
        this.dbm = database;
    }

    /**
     * Get deal negotiation object by ID
     * @param negotiationID - the ID of the deal negotiation
     * @returns Returns a deal negotiation object
     */
    public fetchNegotiationFromId(negotiationID: string): Promise<INegotiationModel> {
       return this.dbm.select()
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
    public saveNegotiation(negotiationObject: INegotiationModel): Promise<any> {
        return this.dbm.insert({
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

export { NegotiationManager };

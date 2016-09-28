'use strict';

import * as Promise from 'bluebird';

import { DatabaseManager } from '../../lib/database-manager';
import { Logger } from '../../lib/logger';
import { NegotiationModel } from './negotiation-model';

const Log = new Logger('mNEG');

/** Deal Negotiation model manager */
class NegotiationManager {

    /** Internal databaseManager  */
    private databaseManager: DatabaseManager;

    /**
     * Constructor
     * @param database - An instance of the database manager.
     */
    constructor(databaseManager: DatabaseManager) {
        this.databaseManager = databaseManager;
    }

    /**
     * Get deal negotiation object by ID
     * @param negotiationID - the ID of the deal negotiation
     * @returns Returns a deal negotiation object
     */
    public fetchNegotiationFromId(negotiationID: number): Promise<NegotiationModel> {
       return this.databaseManager.select()
                .from('ixmDealNegotiations')
                .where('negotiationID', negotiationID)
                .limit(1)
            .then((rows: any) => {
                return new NegotiationModel(rows[0]);
            });
    }

}

export { NegotiationManager };

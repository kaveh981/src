'use strict';

import * as Promise from 'bluebird';

import { DatabaseManager } from '../../lib/database-manager';
import { Logger } from '../../lib/logger';
import { ContactManager } from '../contact-info/contact-manager';
import { BuyerModel } from './buyer-model';

const Log: Logger = new Logger('mBYR');

/** Buyer model manager */
class BuyerManager {

    /** Internal dbm  */
    private dbm: DatabaseManager;

    /** Internal contact manager */
    private contactManager: ContactManager;

    /**
     * Constructor
     * @param database - An instance of the database manager.
     */
    constructor(database: DatabaseManager, contactManager: ContactManager) {
        this.dbm = database;
        this.contactManager = contactManager;
    }

    /**
     * Returns a buyer model from a userID and an optional dspID
     * @param userId - The userID of the buyer we want information from.
     * @returns A promise for a new buyer model.
     */
    public fetchBuyerFromId(userId: number): Promise<BuyerModel> {
        let buyerObject: BuyerModel;

        return this.getDSPsFromId(userId)
            .then((dsps) => {
                buyerObject = new BuyerModel({
                    userID: userId,
                    dspIDs: dsps.map((dsp) => { return dsp.dspid; })
                });

                return userId;
            })
            .then(this.contactManager.fetchContactInfoById)
            .then((contactInfo) => {
                buyerObject.contactInfo = contactInfo;
                return buyerObject;
            })
            .catch((err: Error) => {
                Log.error(err);
                throw err;
            });
    }

    /**
     * Returns all userIDs associated with a given DSP
     * @param dspId - The ID of the DSP we want to obtain users for.
     */
    public getIdsFromDSP(dspId: number, pagination: any): Promise<any> {
        return this.dbm.select('userid')
                .from('ixmBuyers')
                .where('dspid', dspId)
                .limit(pagination.limit)
                .offset(pagination.offset)
            .catch((err: Error) => {
                Log.error(err);
                throw err;
            });
    }

    /** 
     * Helper function for getting all dspIDs associated with a given userID 
     */
    private getDSPsFromId(userId: number): Promise<any> {
        return this.dbm.select('dspid')
                .from('ixmBuyers')
                .where('userid', userId)
            .catch((err: Error) => {
                Log.error(err);
                throw err;
            });
    }

    // /**
    //  * Adds a new buyer to the ixmBuyers table (Until we design ContactInfo, this function just takes two ID params)
    //  */
    // public saveBuyer(userId: number, dspId: number): Promise<any> {
    //     return this.dbm.insert({userId: userId, dspId: dspId})
    //         .into('ixmBuyers')
    //         .catch((err: Error) => {
    //             Log.error(err);
    //             throw err;
    //         });
    // }

}

export { BuyerManager }

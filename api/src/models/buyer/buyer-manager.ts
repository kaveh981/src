'use strict';

import * as Promise from 'bluebird';

import { DatabaseManager } from '../../lib/database-manager';
import { Logger } from '../../lib/logger';
import { BuyerModel } from './buyer-model';

const Log: Logger = new Logger('mBYR');

/** Buyer model manager */
class BuyerManager {

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
     * Returns a buyer model from a userID and an optional dspID
     * @param userId - The userID of the buyer we want information from.
     * @param dspId - A dspID associated with the buyer (It is unclear whether we need this as an optional parameter or not)
     */
    public fetchBuyer(userId: number, dspId?: number): Promise<BuyerModel> {
        return this.getInfoFromId(userId)
            .then((info: any) => {
                if (dspId) {
                    let buyer: BuyerModel = Object.assign({userId: userId, dspIds: [dspId]}, info[0]);
                    return new BuyerModel(buyer);
                } else {
                    return this.getDSPsFromId(userId)
                        .then((dsps: any) => {
                            let dspArray: number[] = [];
                            dsps.forEach((dsp: any) => {
                                dspArray.push(dsp.dspid);
                            });
                            let buyer: BuyerModel = Object.assign({userId: userId, dspIds: dspArray}, info[0]);
                            return new BuyerModel(buyer);
                        });
                }
            })
            .catch((err: Error) => {
                Log.error(err);
                throw err;
            });
    }

    /**
     * Returns a boolean indicating whether a userID is associated with an IXM Buyer.
     * @param userId - The ID of the user we want to check against the ixmBuyers table.
     */
    public isIXMBuyer(userId: number): Promise<boolean> {
        return this.dbm.select().from('ixmBuyers').where('userID', userId).limit(1)
            .then((rows: any) => {
                return rows.length !== 0;
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
     * Adds a new buyer to the ixmBuyers table (Until we design ContactInfo, this function just takes two ID params)
     */
    public saveBuyer(userId: number, dspId: number): Promise<any> {
        return this.dbm.insert({userId: userId, dspId: dspId})
            .into('ixmBuyers')
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

    /**
     * Helper function for retrieving contact information of a user (Might be updated to get this info from ixmBuyers?)
     */
    private getInfoFromId(userId: number): Promise<any> {
        return this.dbm.select('emailAddress', 'firstName', 'lastName', 'companyName')
            .from('users')
            .where('userid', userId)
            .catch((err: Error) => {
                Log.error(err);
                throw err;
            });
    }
}

export { BuyerManager }

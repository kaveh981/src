'use strict';

import * as Promise from 'bluebird';

import { DatabaseManager } from '../../lib/database-manager';
import { Logger } from '../../lib/logger';
import { ContactManager } from '../contact-info/contact-manager';
import { BuyerModel } from './buyer-model';

const Log: Logger = new Logger('mBYR');

/** Buyer model manager */
class BuyerManager {

    /** Internal databaseManager  */
    private databaseManager: DatabaseManager;

    /** Internal contact manager */
    private contactManager: ContactManager;

    /**
     * Constructor
     * @param database - An instance of the database manager.
     */
    constructor(databaseManager: DatabaseManager, contactManager: ContactManager) {
        this.databaseManager = databaseManager;
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
            .then(this.contactManager.fetchContactInfoFromId)
            .then((contactInfo) => {
                buyerObject.contactInfo = contactInfo;
                return buyerObject;
            })
            .catch((err: Error) => {
                throw err;
            });
    }

    /**
     * Returns all userIDs associated with a given DSP
     * @param dspID - The ID of the DSP we want to obtain users for.
     * @returns a list of objects containing the IDs
     */
    public getIdsFromDSP(dspID: number, pagination: any): Promise<any> {
        return this.databaseManager.select('userID')
                .from('ixmBuyers')
                .where('dspid', dspID)
                .limit(pagination.limit)
                .offset(pagination.offset)
            .catch((err: Error) => {
                throw err;
            });
    }

    /** 
     * Returns the dspIDs associated with a given user
     * @param userID - the ID of the user in question
     * @returns a list of objects containing the IDs
     */
    public getDSPsFromId(userID: number): Promise<any> {
        return this.databaseManager.select('dspid')
                .from('ixmBuyers')
                .where('userid', userID)
            .catch((err: Error) => {
                throw err;
            });
    }

}

export { BuyerManager }

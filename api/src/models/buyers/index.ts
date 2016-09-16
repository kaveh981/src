import * as Promise from 'bluebird';

import { DatabaseManager } from '../../lib/database-manager';
import { Logger } from '../../lib/logger';

const Log: Logger = new Logger('IXMB');

// Interface for a buyer
interface IBuyer {
    userId: number;
    dspIds: number[];
    emailAddress: string;
    firstName: string;
    lastName: string;
    companyName: string;
}

// A class for accessing and manipulating any data related to buyers
class BuyerModel {

    private userId: number;
    private dspIds: number[];
    private emailAddress: string;
    private firstName: string;
    private lastName: string;
    private companyName: string;

    constructor(initParams?: any) {
        if (initParams) {
            Object.assign(this, initParams);
        }
    }

    public static createBuyerFromId(userId: number, populate?: boolean) {

    }

    // Create an object filled with information about the specified buyer
    public getBuyer(userId: number, dspId?: number): Promise<IBuyer> {
        return this.getInfoFromId(userId)
            .then((info: any) => {
                if (dspId) {
                    return Object.assign({userId: userId, dspIds: [dspId]}, info[0]);
                } else {
                    return this.getDSPsFromId(userId)
                        .then((dsps: any) => {
                            let dspArray: number[] = [];
                            dsps.forEach((dsp: any) => {
                                dspArray.push(dsp.dspid);
                            });
                            return Object.assign({userId: userId, dspIds: dspArray}, info[0]);
                        });
                }
            });
    }

    // Check if the userId is in ixmBuyers
    public isIXMBuyer(userId: number): Promise<boolean> {
        return DatabaseManager.select().from('ixmBuyers').where('userID', userId).limit(1)
            .then((rows: any) => {
                return rows.length !== 0;
            })
            .catch((err: Error) => {
                Log.error(err);
                throw err;
            });
    }

    // Get all dspIDs associated with a given userID
    public getDSPsFromId(userId: number): Promise<any> {
        return DatabaseManager.select('dspid')
            .from('ixmBuyers')
            .where('userid', userId)
            .catch((err: Error) => {
                Log.error(err);
                throw err;
            });
    }

    // Get all userIDs associated with a given DSP
    public getIdsFromDSP(dspId: number): Promise<any> {
        return DatabaseManager.select('userid')
            .from('ixmBuyers')
            .where('dspid', dspId)
            .catch((err: Error) => {
                Log.error(err);
                throw err;
            });
    }

    // Add a new buyer to the ixmBuyers table
    public addBuyer(userId: number, dspId: number): Promise<any> {
        return DatabaseManager.insert({userId: userId, dspId: dspId})
            .into('ixmBuyers')
            .catch((err: Error) => {
                Log.error(err);
                throw err;
            });
    }

    // Retrieve information tied to a given userID
    private getInfoFromId(userId: number): Promise<any> {
        return DatabaseManager.select('emailAddress', 'firstName', 'lastName', 'companyName')
            .from('users')
            .where('userid', userId)
            .catch((err: Error) => {
                Log.error(err);
                throw err;
            });
    }

}

/** Fake DI */
let bm = new BuyerModel();

export { bm as BuyerModel }

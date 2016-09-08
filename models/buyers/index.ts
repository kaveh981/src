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

    // Create an object filled with information about the specified buyer
    public static getBuyer(userId: number, dspId?: number): Promise<IBuyer> {
        return BuyerModel.getInfoFromId(userId)
            .then((info: any) => {
                if (dspId) {
                    return Object.assign({userId: userId, dspIds: [dspId]}, info[0]);
                } else {
                    return BuyerModel.getDSPsFromId(userId)
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

    // Get all dspIDs associated with a given userID
    public static getDSPsFromId(userId: number): Promise<any> {
        return DatabaseManager.select('dspid')
            .from('ixmBuyers')
            .where('userid', userId)
            .catch((err: ErrorEvent) => {
                Log.error(err.toString());
                throw err;
            });
    }

    // Get all userIDs associated with a given DSP
    public static getIdsFromDSP(dspId: number): Promise<any> {
        return DatabaseManager.select('userid')
            .from('ixmBuyers')
            .where('dspid', dspId)
            .catch((err: ErrorEvent) => {
                Log.error(err.toString());
                throw err;
            });
    }

    // Add a new buyer to the ixmBuyers table
    public static addBuyer(userId: number, dspId: number): Promise<any> {
        return DatabaseManager.insert({userId: userId, dspId: dspId})
            .into('ixmBuyers')
            .catch((err: ErrorEvent) => {
                Log.error(err.toString());
                throw err;
            });
    }

    // Retrieve information tied to a given userID
    private static getInfoFromId(userId: number): Promise<any> {
        return DatabaseManager.select('emailAddress', 'firstName', 'lastName', 'companyName')
            .from('users')
            .where('userid', userId)
            .catch((err: ErrorEvent) => {
                Log.error(err.toString());
                throw err;
            });
    }

}

export { BuyerModel }

import * as Promise from 'bluebird';

import { DatabaseManager } from '../../lib/database-manager';
import { Logger } from '../../lib/logger';

const Log: Logger = new Logger('IXMB');

class BuyerModel {
    public static getDSPFromId(userId: number): Promise<any> {
        return DatabaseManager.select('dspid')
            .from('ixmBuyers')
            .where('userid', userId)
            .catch((err: ErrorEvent) => {
                Log.error(err.toString());
                throw err;
            });
    }

    public static getIdsFromDSP(dspId: number): Promise<any> {
        return DatabaseManager.select('userid')
            .from('ixmBuyers')
            .where('dspid', dspId)
            .catch((err: ErrorEvent) => {
                Log.error(err.toString());
                throw err;
            });
    }

    public static addBuyer(userId: number, dspId: number): Promise<any> {
        return DatabaseManager.insert({userId: userId, dspId: dspId})
            .into('ixmBuyers')
            .catch((err: ErrorEvent) => {
                Log.error(err.toString());
                throw err;
            });
    }
}

export { BuyerModel }

'use strict';

import { DatabaseManager } from '../../lib/database-manager';

/** Handle DSP information */
class DspManager {

    /** Internal database manager */
    private databaseManager: DatabaseManager;

    /** Just a social construct */
    constructor(databaseManager: DatabaseManager) {
        this.databaseManager = databaseManager;
    }

    /** Get the dsp belonging to the given company */
    public async fetchDspIdByCompanyId(companyID: number) {

        let rows = await this.databaseManager.pluck('dspID')
                                             .from('rtbTradingDesks')
                                             .where('userID', companyID);

        return rows[0];

    }

}

export { DspManager };

// Database pupulator class to insert data for testing purposes

import * as Promise from 'bluebird';

import { DatabaseManager } from './database-manager';
import { Logger          } from './logger';

class DatabasePopulator {
    
    private dbm = DatabaseManager;
    private logger = new Logger("DBPO");

    constructor () {
    }

    public initialize (): Promise<void> {
        return this.dbm.initialize()
            .then(() => {
                this.logger.info("DatabasePopulator successfully initialized")
            })
            .catch((err) => {
                this.logger.error(err)
            });
    }

    public shutdown (): void {
        this.dbm.shutdown();
        this.logger.info("DatabasePopulator gracefully shutdown");
    }

    public insertBuyer (buyerData: IBuyer): IBuyer {
        
    }
}

const dbpop: DatabasePopulator = new DatabasePopulator();

export { dbpop as dbPopulator };
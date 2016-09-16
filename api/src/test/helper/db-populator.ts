// Database pupulator class to insert data for testing purposes

import * as Promise from 'bluebird';

import * as globals from '../../lib/globals';

import { DatabaseManager } from './database-manager';
import { Logger          } from './logger';
import { dataGenerator } from './data-generator';

export class DatabasePopulator {

    constructor (
        private dbm = DatabaseManager,
        private logger = new Logger("DBPO"),
        private dg = dataGenerator
    ) {
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

    public insertNewBuyer (): Promise<void> {
        let newBuyerData = this.dg.generateNewBuyer();
        let newID;
        return this.dbm.insert(newBuyerData)
            .into("users")
            .then((newBuyerID: number[]) => {
                newID = newBuyerID[0];
                this.logger.info("Added new Buyer with userID: " + newID);
                return this.dbm.update("status", "A")
                    .from("users")
                    .where('userID', '=', newID);
            })
            .then(() => {
                this.logger.info("Updated UserType");
            })
            .catch((err) => {
                this.logger.error(err);
                throw err;
            });
    }
}

export const dbPopulator: DatabasePopulator = new DatabasePopulator();
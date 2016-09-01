'use strict';

import * as Knex from 'knex';
import * as Promise from 'bluebird';

import { ConfigLoader } from './config-loader';

// DatabaseManager interface. As we can't implement this in the class directly it has to be separate. Not a big deal.
interface IDatabaseManager extends Knex.QueryInterface {
    initialize(): Promise<{}>;
}

// The database manager class which extends Knex. After calling initialize, it properly extends the knex.js object.
class DatabaseManager {

    // Load the configuration from db-config.json and copy properties from Knex to itself.
    public initialize(): Promise<{}> {
        return new Promise((resolve: Function, reject: Function) => {
            let env: string = process.env.ENVIRONMENT || 'development';
            let databaseConfig: Knex.Config = ConfigLoader.loadConfig('db-config.json');
            let queryBuilder: Knex.QueryInterface = Knex(databaseConfig[env]);

            Object.assign(this, queryBuilder);
            resolve();
        });
    }

};

/*
* DatabaseManager should be a static class, but you can't type-assert a static class.
* So this hack will do until it is supported.
*/
let dbManager: IDatabaseManager = <IDatabaseManager>(new DatabaseManager());

export { dbManager as DatabaseManager };

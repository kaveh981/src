'use strict';

import * as Knex from 'knex';
import * as Promise from 'bluebird';

import { ConfigLoader } from './config-loader';

// DatabaseManager interface. As we can't implement this in the class directly it has to be separate. Not a big deal.
interface IDatabaseManager extends Knex.QueryInterface {
    initialize(): Promise<any>;
}

// The database manager class which extends Knex. After calling initialize, it properly extends the knex.js object.
class DatabaseManager {

    // Load the configuration from environment and copy properties from Knex to itself.
    public initialize(): Promise<any> {

        return new Promise((resolve: Function, reject: Function) => {
            let databaseConfig: Knex.Config = {
                client: 'mysql',
                connection: {
                    host: ConfigLoader.getEnv('DB_HOST'),
                    user: ConfigLoader.getEnv('DB_USER'),
                    password: ConfigLoader.getEnv('DB_PASSWORD'),
                    database: ConfigLoader.getEnv('DB_DATABASE')
                }
            };

            let queryBuilder: Knex.QueryInterface = Knex(databaseConfig);

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

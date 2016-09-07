/**
 * DatabaseManager
 *
 * The `DatabaseManager` object is a singleton which needs to be initialized before use. Import `DatabaseManager`
 * from `./lib/database-manager` and call the method `DatabaseManager.initialize()`. The `DatabaseManager` object
 * is an extension of the [Knex Query Builder](http://knexjs.org/#Builder) object, so refer to their documentation
 * for usage.
 *
 */
'use strict';

import * as Knex from 'knex';
import * as Promise from 'bluebird';

import { ConfigLoader } from './config-loader';
import { Logger } from './logger';

const Log: Logger = new Logger("DBMA");

// DatabaseManager interface. As we can't implement this in the class directly it has to be separate. Not a big deal.
interface IDatabaseManager extends Knex.QueryInterface {
    initialize(): Promise<{}>;
}

// The database manager class which extends Knex. After calling initialize, it properly extends the knex.js object.
class DatabaseManager {

    // Load the configuration from environment and copy properties from Knex to itself.
    public initialize(): Promise<{}> {

        Log.info('Initializing database connection...');

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

            let queryBuilder: Knex = Knex(databaseConfig);

            // Test DB Connection
            queryBuilder.raw('SELECT 1')
                .then(() => {
                    Log.info('Database connection established successfully.');

                    Object.assign(this, queryBuilder);
                    resolve();
                })
                .catch((err: ErrorEvent) => {
                    reject(err);
                });
        })
        .catch((err: ErrorEvent) => {
            Log.warn('Database failed to connect.');
            Log.error(err.toString());
            throw err;
        });

    }

};

/*
* DatabaseManager should be a static class, but you can't type-assert a static class.
* So this hack will do until it is supported.
*/
let dbManager: IDatabaseManager = <IDatabaseManager>(new DatabaseManager());

export { dbManager as DatabaseManager };

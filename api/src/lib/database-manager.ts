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

import { Config } from './config';
import { Logger } from './logger';

const Log: Logger = new Logger("DBMA");

// DatabaseManager interface. As we can't implement this in the class directly it has to be separate. Not a big deal.
interface IDatabaseManager extends Knex.QueryInterface {
    initialize(): Promise<{}>;
    shutdown(): void;
}

// The database manager class which extends Knex. After calling initialize, it properly extends the knex.js object.
class DatabaseManager {

    // The internal client pool, no actual type for this
    private clientPool: any;

    // Load the configuration from environment and copy properties from Knex to itself.
    public initialize(): Promise<{}> {

        Log.info(`Initializing database connection to ${Config.getVar('DB_DATABASE')}@${Config.getVar('DB_HOST')}...`);

        return new Promise((resolve: Function, reject: Function) => {
            let databaseConfig: Knex.Config = {
                client: 'mysql',
                connection: {
                    host: Config.getVar('DB_HOST'),
                    user: Config.getVar('DB_USER'),
                    password: Config.getVar('DB_PASSWORD'),
                    database: Config.getVar('DB_DATABASE')
                }
            };

            let queryBuilder: Knex = Knex(databaseConfig);

            // Test DB Connection
            queryBuilder.raw('SELECT 1')
                .then(() => {
                    Log.info(`Database connection established successfully.`);
                    Object.assign(this, queryBuilder);
                    this.clientPool = queryBuilder.client;
                    resolve();
                })
                .catch((err: Error) => {
                    reject(err);
                });
        })
        .catch((err: Error) => {
            Log.warn('Database failed to connect.');
            Log.error(err);
            throw err;
        });

    }

    // Close down the database connection
    public shutdown(): void {
        Log.info('Shutting down the DatabaseManager...');

        if (this.clientPool) {
            Log.debug('Destroying client pool...');
            this.clientPool.destroy();
        }

        Log.info('DatabaseManager has been shutdown.');
    }

};

// DatabaseManager should be a static class, but you can't type-assert a static class.
let dbManager: IDatabaseManager = (new DatabaseManager()) as any as IDatabaseManager;

export { dbManager as DatabaseManager };

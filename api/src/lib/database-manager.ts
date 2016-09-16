'use strict';

import * as Knex from 'knex';
import * as Promise from 'bluebird';

import { ConfigLoader } from './config-loader';
import { Logger } from './logger';

const Log: Logger = new Logger("DBMA");

/**
 * A database manager class which extends Knex. After calling initialize it properly extends the knex.js object,
 * before this it does not have any knex methods.
 */
export class DatabaseManager  {

    /** The internal db client pool, no actual type for this */
    private clientPool: any;

    /** Internal config loader */
    private config: ConfigLoader;

    /** 
     * Constructor
     * @param config - The config loader to use.
     */
    constructor(config: ConfigLoader) {
        this.config = config;
    }

    /**
     * Load the database configuration from environment and copy properties from Knex to itself.
     * @returns Empty promise which resolves once the database connection is established.
     */
    public initialize(): Promise<{}> {

        Log.info(`Initializing database connection to ${this.config.getVar('DB_DATABASE')}@${this.config.getVar('DB_HOST')}...`);

        return new Promise((resolve: Function, reject: Function) => {
            let databaseConfig: Knex.Config = {
                client: 'mysql',
                connection: {
                    host: this.config.getVar('DB_HOST'),
                    user: this.config.getVar('DB_USER'),
                    password: this.config.getVar('DB_PASSWORD'),
                    database: this.config.getVar('DB_DATABASE')
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

    /**
     * Close down the database connection. If the client pool is open, destroys it.
     */
    public shutdown(): void {
        Log.info('Shutting down the DatabaseManager...');

        if (this.clientPool) {
            Log.debug('Destroying client pool...');
            this.clientPool.destroy();
        }

        Log.info('DatabaseManager has been shutdown.');
    }

};

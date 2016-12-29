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
export class DatabaseManager {

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
        return new Promise((resolve, reject) => {

            Log.info(`Initializing database connection to ${this.config.getEnv('DB_DATABASE')}@${this.config.getEnv('DB_HOST')}...`);

            let databaseConfig: Knex.Config = {
                client: 'mysql',
                connection: {
                    host: this.config.getEnv('DB_HOST'),
                    user: this.config.getEnv('DB_USER'),
                    password: this.config.getEnv('DB_PASSWORD'),
                    database: this.config.getEnv('DB_DATABASE')
                },
                pool: this.config.get('database')['pool']
            };

            let queryBuilder: Knex = Knex(databaseConfig);

            // Test DB Connection
            queryBuilder.raw('SELECT 1')
                .then(() => {
                    Log.info(`Database connection established successfully.`);

                    Object.assign(this, queryBuilder);

                    // Log all queries
                    queryBuilder.on('query', (query) => {
                        let filledQuery = query.sql;
                        let idx = 0;

                        while (filledQuery.includes('?') && idx < query.bindings.length) {
                            filledQuery = filledQuery.replace('?', query.bindings[idx]);
                            idx++;
                        }

                        Log.trace(filledQuery);
                    });

                    resolve();
                })
                .catch((err: Error) => {
                    Log.error(err);
                    reject(err);
                });

        });
    }

    /**
     * Function to do the db filtering. It formats the filters and then returns a function that will apply these filters
     * @param filters - An array of filters, each with a name (including table name it applies to), operator and value
     * @param filterMapping - An object mapping filter names to operators and the associated sql table
     * @returns A function that uses knex to do the filtering
     */
    public createFilter(filters: {[s: string]: any}, filterMapping: {[s: string]: {table: string, operator: string, column: string}}) {

        let formattedFilters: any[] = [];

        for (let filterName in filters) {
            if (filterMapping[filterName]) {
               formattedFilters.push({
                    nameWithTable : filterMapping[filterName].table + "." + filterMapping[filterName].column,
                    operator: filterMapping[filterName].operator,
                    value: filters[filterName]
                });
            }
        }

        return (db) => {
            formattedFilters.forEach((filter) => {
                db.where(filter.nameWithTable, filter.operator, filter.value);
            });
        };

    }

    /**
     * Close down the database connection. If the client pool is open, destroys it.
     */
    public shutdown(): void {

        Log.info('Shutting down the DatabaseManager...');

        if (this.client) {
            Log.debug('Destroying client pool...');
            this.client.destroy();
        }

        Log.info('DatabaseManager has been shutdown.');

    }

};

// export { DatabaseManager }

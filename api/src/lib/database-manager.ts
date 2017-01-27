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

            let databaseConfig = this.config.get('database');

            Log.info(`Initializing database connection to ${databaseConfig['database']}@${databaseConfig['host']}...`);

            let knexConfig: Knex.Config = {
                client: databaseConfig['client'],
                connection: {
                    host: databaseConfig['host'],
                    user: databaseConfig['user'],
                    password: databaseConfig['password'],
                    database: databaseConfig['database']
                },
                pool: databaseConfig['pool']
            };

            let queryBuilder: Knex = Knex(knexConfig);

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

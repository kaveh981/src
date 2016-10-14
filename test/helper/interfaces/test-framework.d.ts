'use strict';
declare module 'testFramework' {

    export = testFramework;

    import * as Promise from 'bluebird';

    import { ConfigLoader } from '../../lib/config-loader';
    import { DatabaseManager } from '../../lib/database-manager';

    namespace testFramework {

        interface IApiHelper {

            config: ConfigLoader;
            reqOptions: IReqOptions;
            isQueryString: Boolean;
            protocol?: string;

            setReqOpts(options: IReqOptions): void;
            getReqOpts(): IReqOptions;
            setIsQueryString(qs: Boolean): void;
            getIsQueryString(): Boolean;
            setProtocol(protocol: string): void;
            getProtocol(): string;
            sendRequest(requestBody?: any): Promise<any>;

        }

        interface IDataSetup {

            dbm: DatabaseManager;

            /**
             * Backup a table.
             * @param table - The name of the table that we want to backup.
             * @param suffix - The backup table name suffix which is optional and default is _bckp.
             * @returns A promise.
             */
            backupTable(table: string, suffix: string = '_bckp'): Promise<any>;

            /**
             * Backup an array of tables.
             * @param [tables] - The name of tables that we want to backup.
             * @param suffix - The backup table name suffix which is optional and default is _bckp.
             * @returns A promise.
             */
            backupTables(tables: string[], suffix: string = '_bckp'): any;

            /**
             * Restore a table.
             * @param table - The name of the table that we want to restore.
             * @param suffix - The backup table name suffix which is optional and default is _bckp.
             * @returns A promise.
             */
            restoreTable(table: string, suffix: string = '_bckp'): Promise<any>;

            /**
             * Restore an array of tables.
             * @param [tables] - The name of tables that we want to restore.
             * @param suffix - The backup table name suffix which is optional and default is _bckp.
             * @returns A promise.
             */
            restoreTables(tables: string[], suffix: string = '_bckp'): Promise<any>;
            /**
             * Clear a table.
             * @param table - The name of the table that we want to clear.
             * @param suffix - The clear table name suffix which is optional and default is _bckp.
             * @returns A promise.
             */
            clearTable(table: string, suffix: string = '_bckp'): Promise<any>;

            /**
             * Clear an array of tables.
             * @param [tables] - The name of tables that we want to clear.
             * @param suffix - The clear table name suffix which is optional and default is _bckp.
             * @returns A promise.
             */
            clearTables(tables: string[], suffix: string = '_bckp'): Promise<any>;

        }
        interface IHelperMethods {

            /**
             * Changes the date format to yyyy-mm-dd
             * @param date any - date in ISO format
             * @returns date in the format of yyyy-mm-dd
             */
            dateToYMD(date: any): string;
        }
    }
}

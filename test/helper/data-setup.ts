'use strict';
import * as Promise from 'bluebird';
import * as testFramework from 'testFramework';

import { Logger } from '../lib/logger';
import { Injector } from '../lib/injector';
import { DatabaseManager } from '../lib/database-manager';

const Log = new Logger('DSTP');

class DataSetup implements testFramework.IDataSetup {

    public dbm: DatabaseManager;

    constructor(dbm: DatabaseManager) {
        this.dbm = dbm;
    }

    /**
     * Backup a table.
     * @param table - The name of the table that we want to backup.
     * @param suffix - The backup table name suffix which is optional and default is _bckp.
     * @returns A promise.
     */
    public backupTable(table: string, suffix: string = '_bckp'): Promise<any> {

        let newtable: string = table + suffix;

        return this.dbm.raw('SHOW TABLES LIKE ?', [table])
            .then((res1) => {
                if (res1[0].length === 0) {
                    throw 'Target table: ' + table + ' is not found.';
                }
            })
            .then(() => {
                return this.dbm.raw('DROP TABLE IF EXISTS ' + newtable );
            })
            .then(() => {
                return this.dbm.raw('SET foreign_key_checks=0');
            })
            .then(() => {
                return this.dbm.raw('CREATE TABLE IF NOT EXISTS ' + newtable + ' SELECT * FROM ' + table);
            })
            .then(() => {
                return this.dbm.raw(' SET foreign_key_checks=1');
            });
    }

    /**
     * Backup an array of tables.
     * @param [tables] - The name of tables that we want to backup.
     * @param suffix - The backup table name suffix which is optional and default is _bckp.
     * @returns A promise.
     */
    public backupTables = Promise.coroutine(function* (tables: string[], suffix: string): any {
        for (let i = 0; i < tables.length; i += 1) {
            let table = tables[i];
            yield this.backupTable(table, suffix);
        }
    }) as { (tables: string[], suffix: string = '_bckp'): Promise<any> };

    /**
     * Restore a table.
     * @param table - The name of the table that we want to restore.
     * @param suffix - The backup table name suffix which is optional and default is _bckp.
     * @returns A promise.
     */
    public restoreTable(table: string, suffix: string = '_bckp'): Promise<any> {

        let backup: string = table + suffix;

        return this.dbm.raw('SHOW TABLES LIKE ?', [backup])
            .then((res) => {
                if (res[0].length === 0) {
                    throw 'Backup table ' + backup + ' being restored are not found.';
                }
            })
            .then(() => {
                return this.dbm.raw('SHOW TABLES LIKE ?', [table]);
            })
            .then((res) => {
                if (res[0].length === 0) {
                    throw 'Live table ' + table + ' being restored are not found.';
                }
            })
            .then(() => {
                return this.dbm.raw('SET foreign_key_checks=0');
            })
            .then(() => {
                return this.dbm.raw('TRUNCATE TABLE ' + table);
            })
            .then(() => {
                return this.dbm.raw('INSERT INTO ' + table + ' SELECT * FROM ' + backup);
            })
            .then(() => {
                return this.dbm.raw('DROP TABLE ' + backup);
            })
            .then(() => {
                return this.dbm.raw('SET foreign_key_checks=1');
            });
    }

    /**
     * Restore an array of tables.
     * @param [tables] - The name of tables that we want to restore.
     * @param suffix - The backup table name suffix which is optional and default is _bckp.
     * @returns A promise.
     */
    public restoreTables = Promise.coroutine(function* (tables: string[], suffix: string): any  {
        for (let i = 0; i < tables.length; i += 1) {
            let table = tables[i];
            yield this.restoreTable(table, suffix);
        }
    }) as (tables: string[], suffix: string = '_bckp') => Promise<any>;

    /**
     * Clear a table.
     * @param table - The name of the table that we want to clear.
     * @param suffix - The clear table name suffix which is optional and default is _bckp.
     * @returns A promise.
     */
    public clearTable(table: string, suffix: string = '_bckp'): Promise<any> {

        let backup: string = table + suffix;

        return this.dbm.raw('SHOW TABLES LIKE ?', [backup])
            .then((res) => {
                if (res[0].length === 0) {
                    throw 'Backup table ' + backup + ' is not found. It is not safe to clear the table.';
                }
                return this.dbm.raw('SET foreign_key_checks=0');
            })
            .then(() => {
                return this.dbm.raw('DELETE FROM ' + table);
            })
            .then(() => {
                return this.dbm.raw('SET foreign_key_checks=1');
            });
    };

    /**
     * Clear an array of tables.
     * @param [tables] - The name of tables that we want to clear.
     * @param suffix - The clear table name suffix which is optional and default is _bckp.
     * @returns A promise.
     */
    public clearTables = Promise.coroutine(function* (tables: string[], suffix: string): any {
        for (let i = 0; i < tables.length; i += 1) {
            let table = tables[i];
            yield this.clearTable(table, suffix);
        }
    }) as (tables: string[], suffix: string = '_bckp') => Promise<any>;

}

export { DataSetup };

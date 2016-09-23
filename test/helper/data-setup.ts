'use strict';
import * as Promise from 'bluebird';
import { Logger } from '../lib/logger';
import { Injector } from '../lib/injector';
import { DatabaseManager } from '../lib/database-manager';

const Log = new Logger('dSTP');

class DataSetup {

    private dbm: DatabaseManager;

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
                } else {
                    return this.dbm.raw('SHOW TABLES LIKE ?', [newtable]);
                }
            })
            .then((res2) => {
                if (res2[0].length !== 0) {
                    throw 'Backup table: ' + newtable + ' already exists.';
                } else {
                    return this.dbm.raw('SET foreign_key_checks=0');
                }
            })
            .then(() => {
                return this.dbm.raw('CREATE TABLE IF NOT EXISTS ' + newtable + ' SELECT * FROM ' + table);
            })
            .then(() => {
                return this.dbm.raw(' SET foreign_key_checks=1');
            })
            .catch((err: Error) => {
                Log.error(err);
                throw err;
            });
    }

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
                return this.dbm.raw('DELETE FROM ' + table);
            })
            .then(() => {
                return this.dbm.raw('INSERT INTO ' + table + ' SELECT * FROM ' + backup);
            })
            .then(() => {
                return this.dbm.raw('DROP TABLE ' + backup);
            })
            .then(() => {
                return this.dbm.raw('SET foreign_key_checks=1');
            })
            .catch((err: Error) => {
                Log.error(err);
                throw err;
            });
    }

    /**
     * Clear a table.
     * @param table - The name of the table that we want to clear.
     * @returns A promise.
     */
    public clearTable(table: string): Promise<any> {

        return this.dbm.raw('SET foreign_key_checks=0')
            .then(() => {
                return this.dbm.raw('DELETE FROM ' + table);
            })
            .then(() => {
                return this.dbm.raw('SET foreign_key_checks=1');
            })
           .catch((err: Error) => {
                Log.error(err);
                throw err;
            });
    };

}

export {DataSetup};

'use strict';

/** Lib */
import { Logger          } from './logger';
import { ConfigLoader    } from './config-loader';
import { DatabaseManager } from './database-manager';

const Log = new Logger('DSTP');

interface IDataSetupConfig {
    suffix: string;
    tables: string[];
}

class DataSetup {

    private dbm: DatabaseManager;
    private config: IDataSetupConfig;

    constructor(dbm: DatabaseManager, cl: ConfigLoader) {
        this.dbm = dbm;
        this.config = cl.get('data-setup');
    }

    /**
     * Backup a table.
     * @param table - The name of the table that we want to backup.
     * @param suffix - The backup table name suffix which is optional and defaults to constant config.suffix
     * @returns A promise.
     */
    public async backupTable(table: string, suffix: string = this.config.suffix) {

        let newTable = table + suffix;

        let backupTables = await this.dbm.raw(`SHOW TABLES LIKE '${newTable}'`);
        let tables = await this.dbm.raw(`SHOW TABLES LIKE '${table}'`);

        Log.debug('Backing up table ' + table + '...');

        if (tables[0].length === 0) {
            Log.error(`Table ${table} could not be found.`);
            return;
        }

        if (backupTables[0].length > 0) {
            Log.error(`Table ${table} is already backed up.`);
            return;
        }

        await this.dbm.transaction(async (trans) => {
            await trans.raw('SET foreign_key_checks=0');
            await trans.raw(`DROP TABLE IF EXISTS ${newTable}`);
            await trans.raw(`CREATE TABLE IF NOT EXISTS ${newTable} SELECT * FROM ${table}`);
            await trans.raw('SET foreign_key_checks=1');
        });
        await this.clearTable(table);

        Log.debug(`Backed up tables ${table}.`);

    }

    /**
     * Backup an array of tables.
     * @param [tables] - The name of tables that we want to backup.
     * @param suffix - The backup table name suffix which is optional and defaults to constant BKP_SUFFIX.
     * @returns A promise.
     */
    public async backupTables(tables: string[] = this.config.tables, suffix: string = this.config.suffix) {

        await Promise.all(tables.map(async (table) => {
            await this.backupTable(table, suffix);
        }));

    }

    /**
     * Restore a table.
     * @param table - The name of the table that we want to restore.
     * @param suffix - The backup table name suffix which is optional and defaults to constant BKP_SUFFIX.
     * @returns A promise.
     */
    public async restoreTable(table: string, suffix: string = this.config.suffix) {

        let backup = table + suffix;

        let backupTables = await this.dbm.raw(`SHOW TABLES LIKE '${backup}'`);
        let tables = await this.dbm.raw(`SHOW TABLES LIKE '${table}'`);

        Log.debug('Restoring table ' + table + '...');

        if (backupTables[0].length === 0) {
            Log.error(`Back up table ${backup} could not be found.`);
            return;
        }

        if (tables[0].length === 0) {
            Log.error(`Table ${backup} could not be found.`);
            return;
        }

        await this.clearTable(table);
        await this.dbm.transaction(async (trans) => {
            await trans.raw('SET foreign_key_checks=0');
            await trans.raw(`INSERT INTO ${table} SELECT * FROM ${backup}`);
            await trans.raw(`DROP TABLE ${backup}`);
            await trans.raw('SET foreign_key_checks=1');
        });

        Log.debug(`Restored table ${table}.`);

    }

    /**
     * Restore an array of tables.
     * @param [tables] - The name of tables that we want to restore.
     * @param suffix - The backup table name suffix which is optional and defaults to constant BKP_SUFFIX.
     * @returns A promise.
     */
    public async restoreTables(tables: string[] = this.config.tables, suffix: string = this.config.suffix) {

        await Promise.all(tables.map(async (table) => {
            await this.restoreTable(table, suffix);
        }));

    }

    /**
     * Clear a table.
     * @param table - The name of the table that we want to clear.
     * @param suffix - The clear table name suffix which is optional and defaults to constant BKP_SUFFIX.
     * @returns A promise.
     */
    public async clearTable(table: string, suffix: string = this.config.suffix) {

        let backup = table + suffix;

        let tables = await this.dbm.raw(`SHOW TABLES LIKE '${backup}'`);

        if (tables.length === 0) {
            Log.error('Backup table ' + backup + ' is not found. It is not safe to clear the table.');
            throw new Error('Table is missing.');
        }

        await this.dbm.transaction(async (trans) => {
            await trans.raw('SET foreign_key_checks=0');
            await trans.raw(`TRUNCATE ${table}`);
            await trans.raw('SET foreign_key_checks=1');
        });

    };

    /**
     * Clear an array of tables.
     * @param [tables] - The name of tables that we want to clear.
     * @param suffix - The clear table name suffix which is optional and defaults to constant BKP_SUFFIX.
     * @returns A promise.
     */
    public async clearTables(tables: string[] = this.config.tables, suffix: string = this.config.suffix) {

        await Promise.all(tables.map(async (table) => {
            await this.clearTable(table, suffix);
        }));

    }

}

export { DataSetup };

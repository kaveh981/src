'use strict';
import * as Promise from 'bluebird';

import { DatabaseManager } from '../../lib/database-manager';

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
     * Restore a table.
     * @param table - The name of the table that we want to restore.
     * @param suffix - The backup table name suffix which is optional and default is _bckp.
     * @returns A promise.
     */
     restoreTable(table: string, suffix: string = '_bckp'): Promise<any>;

    /**
     * Clear a table.
     * @param table - The name of the table that we want to clear.
     * @returns A promise.
     */
     clearTable(table: string, suffix: string = '_bckp'): Promise<any>;

}

export { IDataSetup };

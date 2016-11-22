'use strict';

/** Lib */
import { Injector } from './injector';
import { ConfigLoader } from './config-loader';
import { DatabaseManager } from './database-manager';
import { APIRequestManager } from "./request-manager";
import { DatabasePopulator } from "./database-populator";
import { DataSetup } from "./data-setup";

/** Dependency Resolution */

const config = new ConfigLoader('../../config');
Injector.put(config, 'ConfigLoader');

const apiHelper = new APIRequestManager(config);
Injector.put(apiHelper, 'APIRequestManager');

const databaseManager = new DatabaseManager(config);
Injector.put(databaseManager, 'DatabaseManager');

const dbPopulator = new DatabasePopulator(databaseManager, config);
Injector.put(dbPopulator, "DatabasePopulator");

const dataSetup = new DataSetup(databaseManager, config);
Injector.put(dataSetup, 'DataSetup');

/**
 * Bootstrap class, the first module you import inside a test file
 */
class Bootstrap {

    /**
     * Boot function that initializes any dependencies that require async initialization
     * @returns {Promise<void>} Promise which resolves when boot has finished
     */
    public static async boot(backupTables: boolean = true) {
        await databaseManager.initialize();
        if (backupTables) {
            await dataSetup.backupTables();
        }
    }

    /**
     * Shutdown function. Calls shutdown on any dependency that requires shutdown action.
     */
    public static async shutdown(restoreTables: boolean = true) {
        if (restoreTables) {
            await dataSetup.restoreTables();
        }
        return databaseManager.shutdown();
    }

    public static crash() {
        let crashDBM = new DatabaseManager(config);
        let crashDataSetup = new DataSetup(crashDBM, config);
        databaseManager.shutdown();
        setTimeout(() => {
            crashDBM.initialize()
                .then(() => { return crashDataSetup.restoreTables(); })
                .then(() => {
                    crashDBM.shutdown();
                    process.exit(0);
                });
        }, 10);
    }

}

export { Bootstrap }

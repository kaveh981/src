'use strict';

/** Resolve any dependencies in this file and pass it to the injector for safe keeping. */
import * as Promise from 'bluebird';
import * as testFramework from 'testFramework';
/** Lib */
import { Injector     } from '../lib/injector';
import { ConfigLoader } from '../lib/config-loader';

const config = new ConfigLoader('../../test/config');
Injector.put(config, 'ConfigLoader');

/** Helper modules */
import { DatabaseManager   } from '../lib/database-manager';
import { ApiHelper         } from "./api-helper";
import { DatabasePopulator } from "./database-populator";
import { DataSetup         } from "./data-setup";
import { HelperMethods     } from "./helper-methods";

/** Dependency Resolution */

const apiHelper: testFramework.IApiHelper = new ApiHelper(config);
Injector.put(apiHelper, 'ApiHelper');

const databaseManager = new DatabaseManager(config);
Injector.put(databaseManager, 'DatabaseManager');

const dbPopulator = new DatabasePopulator(databaseManager, config);
Injector.put(dbPopulator, "DatabasePopulator");

const dataSetup: testFramework.IDataSetup = new DataSetup(databaseManager);
Injector.put(dataSetup, 'DataSetup');

const helperMethods: testFramework.IHelperMethods = new HelperMethods();
Injector.put(helperMethods, 'HelperMethods');
/**
 * Bootstrap class, the first module you import inside a test file
 */
class Bootstrap {
    /** Ready Flag */
    private count: number = 0;

    /**
     * Boot function that initializes any dependencies that require async initialization
     * @returns {Promise<void>} Promise which resolves when boot has finished
     */
    public boot(): Promise<void> {

        if (this.count > 0) {
            this.count += 1;
            return Promise.resolve();
        }
        return databaseManager.initialize()
            .then(() => {
                this.count += 1;
            })
            .catch((e) => {
                throw e;
            });
    }

    /**
     * Shutdown function. Calls shutdown on any dependency that requires shutdown action.
     */
    public shutdown(): void {
        if (this.count <= 1) {
            databaseManager.shutdown();
            this.count = 0;
        }
        this.count -= 1;
    }

}

const app = new Bootstrap();

export { app }

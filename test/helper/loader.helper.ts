'use strict';

/** Resolve any dependencies in this file and pass it to the injector for safe keeping. */
import * as Promise from 'bluebird';

/** Lib */
import { Injector } from '../lib/injector';
import { ConfigLoader } from '../lib/config-loader';

// Logger forces us to load the config before importing anything else.
const config = new ConfigLoader('../../../test/config');
Injector.put(config, 'ConfigLoader');

/** Helper modules */
import { DatabaseManager } from '../lib/database-manager';
import { ApiHelper } from "./api.helper";
import { DataSetup } from "./data-setup.helper";
import { DatabasePopulator } from "./db-populator.helper";

/** Dependency Resolution */
Injector.put(ApiHelper, 'ApiHelper');

const databaseManager = new DatabaseManager(config);
Injector.put(databaseManager, 'DatabaseManager');

const dataSetup = new DataSetup(databaseManager);
Injector.put(dataSetup,'DataSetup');

const dbPopulator = new DatabasePopulator(databaseManager, config);
Injector.put(dbPopulator, "DatabasePopulator");

/** Ready Flag */
let ready:boolean = false;

function setReady ():void { ready = true }
function setNotReady ():void {ready = false }

/**
 * Boot function that initializes any dependencies that require async initialization
 * @returns {Promise<void>} Promise which resolves when boot has finished
 */
function boot(): Promise<void> {
    if (ready) { return Promise.resolve() }
    return databaseManager.initialize().then(setReady);
}

/**
 * Shutdown function. Calls shutdown on any dependency that requires shutdown action.
 */
function shutdown(): void {
    if (!ready) { return }
    setNotReady();
    return databaseManager.shutdown();
}

export { boot, shutdown }
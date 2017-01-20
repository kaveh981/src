/* tslint:disable:no-console */
'use strict';

/** Set up DI */
import './loader';

import { Injector } from './lib/injector';

import { Server } from './lib/server';
import { DatabaseManager } from './lib/database-manager';
import { RamlTypeValidator } from './lib/raml-type-validator';
import { ConfigLoader } from './lib/config-loader';
import { Mailer } from './lib/mailer';
import { Notifier } from './lib/notifier';
import { Logger } from './lib/logger';

const validator = Injector.request<RamlTypeValidator>('Validator');
const databaseManager = Injector.request<DatabaseManager>('DatabaseManager');
const server = Injector.request<Server>('Server');
const configLoader = Injector.request<ConfigLoader>('ConfigLoader');
const mailer = Injector.request<Mailer>('Mailer');
const notifier = Injector.request<Notifier>('Notifier');

async function start() {

    try {

        console.log('Hello.');
        await configLoader.initialize({ 'mw': './src/middleware' });

        Logger.configureLoggers(configLoader.get('logger'));
        global['IXM_CONSTANTS'] = configLoader.get('constants');

        await validator.initialize('../../spec/');
        await databaseManager.initialize();
        await mailer.initialize();
        await notifier.initialize();
        await server.initialize();

    } catch (error) {
        console.error(error);
        databaseManager.shutdown();
    }

}

start();

process.on('SIGTERM', () => {
    console.log('Goodbye.');
    setTimeout(process.exit, 0, 0);
});

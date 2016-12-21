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

const validator = Injector.request<RamlTypeValidator>('Validator');
const databaseManager = Injector.request<DatabaseManager>('DatabaseManager');
const server = Injector.request<Server>('Server');
const configLoader = Injector.request<ConfigLoader>('ConfigLoader');
const mailer = Injector.request<Mailer>('Mailer');
const notifier = Injector.request<Notifier>('Notifier');

/** Initialize the libraries. */
Promise.resolve()
    .then(() => {
        console.log('Hello.');
        return configLoader.initialize({ 'mw': './src/middleware' });
    })
    .then(() => {
        return validator.initialize('../../spec/');
    })
    .then(() => {
        return databaseManager.initialize();
    })
    .then(() => {
        return mailer.initialize();
    })
    .then(() => {
        return notifier.initialize();
    })
    .then(() => {
        return server.initialize();
    })
    .catch((err: Error) => {
        console.error(err);
        // Clean up.
        databaseManager.shutdown();
    });

process.on('SIGTERM', () => {
    console.log('Goodbye.');
    setTimeout(process.exit, 0, 0);
});

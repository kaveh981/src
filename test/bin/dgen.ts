/**
 * @file Provides a command line interface (CLI) to the data generation functions
 */

import * as fs from 'fs';

import { ConfigLoader }      from '../lib/config-loader';
import { Injector } from '../lib/injector';

const Config = new ConfigLoader('../../../test/config');
Injector.put(Config, "ConfigLoader");

import { DatabasePopulator } from '../helper/database-populator';
import { DatabaseManager } from '../lib/database-manager';

import * as cmd from 'commander';

const dbm = new DatabaseManager(Config);
const dbPopulator = new DatabasePopulator(dbm, Config);

interface InterfaceCLI extends commander.ICommand {
  user?: string
  password?: string
}

class DataGenCLI {

	constructor () {
		cmd.version('6.6.6')
			.option('-6 --six', 'sixy')
			.option('-f --file', 'A json file containing data objects')
			.option('-p --pub', 'Generate a publisher, use -p <n> to generate n publishers.');
			.option('-s --site', 'Generate a site, publisher ID required, append a number with a comma: -s <id>,<n> to generate n sites.');
		console.log(cmd);
	}

	run() {

	}
}

const dgc:DataGenCLI = new DataGenCLI();
dgc.run();

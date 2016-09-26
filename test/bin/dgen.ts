/**
 * @file Provides a command line interface (CLI) to the data generation functions
 */

import * as fs from 'fs';
import * as process from 'process';

import { ConfigLoader }      from '../lib/config-loader';
import { Injector } from '../lib/injector';

const Config = new ConfigLoader('../../../test/config');
Injector.put(Config, "ConfigLoader");

import { DatabasePopulator } from '../helper/database-populator';
import { DatabaseManager } from '../lib/database-manager';

const dbm = new DatabaseManager(Config);
const dbPopulator = new DatabasePopulator(dbm, Config);

import * as commander from 'commander';

interface InterfaceCLI extends commander.ICommand {
		file?: string;
        pub?: string;
		site?: string;
		section?: string;
		package?: string;
}



class DataGenCLI {

	protected cmd:InterfaceCLI;

	/**
	 * Constructor: set up Commander to parse the input options
	 * @return {void}
	 */
	constructor() {
		this.cmd = commander.version('6.6.6')
			.description('Generate IXM related data. Call with no arguments for generating a standard set.')
			.option('-f --file [string]', 'A json file containing data objects')
			.option('-p --pub [string]', 'Generate a publisher, use -p <n> to generate n publishers.')
			.option('-s --site [string]', 'Generate a site, pub ID required, append a number with a comma: -s <id>,<n> to generate n sites.')
			.option('-S --section [string]', 'Generate a site section, pub ID, section ID required. Append a number to generate multiple: -S <pid>,<sid>,<n>')
			.option('-P --package [string]', 'Generate a package. Owner ID, section [ID]s required: -P <pid>,<sid0>:...:<sidN>,n')
			.parse(process.argv);
	}

 	/**
 	 * Run the command according to input options.
 	 * @return {void}
	 */
	run():void {
		let cmd = this.cmd;
		
		if(cmd.file) {
			this.handleFile(cmd.file);
		} else {
			// if(!cmd.pub && !cmd.site && !cmd.section && !cmd.package) {
			// 	this.handleAll();
			// 	return;
			// }

			if(cmd.pub) {
				this.handlePublisher(cmd.pub);
			}

			if(cmd.site) {
				this.handleSite(cmd.site);
			}

			if(cmd.section) {
				this.handleSection(cmd.section);
			}

			if(cmd.package) {
				this.handlePackage(cmd.package);
			}
		}

		console.log("All done!")
	}

	/**
	 * Parse file input and trigger creation functions
	 * @param {string} fileArgs The file arguments from the command line
	 * @return {void}
	 */
	handleFile(fileArgs:string):void {
		console.log("ratpoint.jpg?");
		console.log("Here's what you wrote though:");
		console.log(fileArgs);
	}

	/**
	 * Parse publisher input and trigger creation functions
	 * @param {string} pubArgs The publisher arguments from the command line
	 * @return {void}
	 */
	handlePublisher(pubArgs:string):void {
		console.log("Sure would be nice to have some pubs");
		console.log("Here's what you wrote though:");
		console.log(pubArgs);
	}

	/**
	 * Parse site input and trigger creation functions
	 * @param {string} siteArgs The site arguments from the command line
	 * @return {void}
	 */
	handleSite(siteArgs:string):void {
		console.log("Maybe for your birthday");
		console.log("Here's what you wrote though:");
		console.log(siteArgs);
	}

	/**
	 * Parse section input and trigger creation functions
	 * @param {string} sectionArgs The section arguments from the command line
	 * @return {void}
	 */
	handleSection(sectionArgs:string):void {
		console.log("Sections too?");
		console.log("Here's what you wrote though:");
		console.log(sectionArgs);
	}

	/**
	 * Parse package input and trigger creation functions
	 * @param {string} packageArgs The package arguments from the command line
	 * @return {void}
	 */
	handlePackage(packageArgs:string):void {
		console.log("Pretend this is a new package");
		console.log("Here's what you wrote though:");
		console.log(packageArgs);
	}

}

const dgc:DataGenCLI = new DataGenCLI();
dgc.run();

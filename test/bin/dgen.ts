/**
 * @file Provides a command line interface (CLI) to the data generation functions
 */

import * as fs from 'fs';
import * as process from 'process';
import * as Promise from 'bluebird';

import { DatabasePopulator } from '../helper/database-populator';
import { Injector } from '../lib/injector';
import { app } from '../helper/bootstrap';

const dbPopulator = Injector.request<DatabasePopulator>('DatabasePopulator');

import * as commander from 'commander';

/*
 * The commander interface won't have our CLI option vars by default
 * Make Typescript happy.
 */
interface InterfaceCLI extends commander.ICommand {
		file?: string;
        pub?: string;
		site?: string;
		section?: string;
		package?: string;
}

/** 
 * CLI class 
 */
class DataGenCLI {

	protected cmd:InterfaceCLI;

	/**
	 * Constructor: set up Commander to parse the input options
	 * @return {void}
	 */
	constructor() {
		this.cmd = commander.version('6.6.6')
			.description('Generate IXM related data. Call with no arguments for generating a standard set.')
			.option('-f --file <string>', 'A json file containing data objects')
			.option('-p --pub [string]', 'Generate a publisher, use -p <n> to generate n publishers.')
			.option('-s --site <string>', 'Generate a site, pub ID required, append a number with a comma: -s <id>,<n> to generate n sites.')
			.option('-S --section <string>', 'Generate a site section, pub ID, site ID required. Append a number to generate multiple: -S <pid>,<sid>,<n>')
			.option('-P --package <string>', 'Generate a package. Owner ID, section [ID]s required: -P <pid>,<sid0>:...:<sidN>,n')
			.parse(process.argv);
	}

 	/**
 	 * Run the command according to input options.
 	 * @return {void}
	 */
	public run():void {

		app.boot()
			.then(() => {
				return this.runHandlers();
			})
			.then((results) => {

				console.log("Here's what you got:");
				console.log(results);
				app.shutdown();

				console.log("All done");
			});
	}

	private runHandlers() {
		
		let cocorico =  Promise.coroutine(function* () {
			let cmd = this.cmd;
			console.log("cocorico");
			console.log(cmd.site);
			let res = {
				file: null,
				pub: null,
				site: null,
				section: null,
				package: null
			};
			if(cmd.file) {
				res.file = yield this.handleFile(cmd.file);
			} else {
				// if(!cmd.pub && !cmd.site && !cmd.section && !cmd.package) {
				// 	this.handleAll();
				// 	return;
				// }

				if(cmd.pub) {
					res.pub = yield this.handlePublisher(cmd.pub);
				}

				if(cmd.site) {
					res.site = yield this.handleSite(cmd.site);
				}

				if(cmd.section) {
					res.section = yield this.handleSection(cmd.section);
				}

				if(cmd.package) {
					res.package = yield this.handlePackage(cmd.package);
				}
			}

			return res;
		}.bind(this));

		return cocorico();
	}

	/**
	 * Parse file input and trigger creation functions
	 * @param {string} fileArgs The file arguments from the command line
	 * @return {void}
	 */
	private handleFile(fileArgs:string):void {
		console.log("ratpoint.jpg?");
		console.log("Here's what you wrote though:");
		console.log(fileArgs);
	}

	/**
	 * Parse publisher input and trigger creation functions
	 * @param {string | boolean} pubArgs The publisher arguments from the command line
	 * @return {Promise<INewPubData>}
	 */
	private handlePublisher(pubArgs:string | boolean):Promise<INewPubData> {
		console.log("Sure would be nice to have some pubs");
		console.log("Here's what you wrote though:");
		console.log(pubArgs);

		return dbPopulator.newPub();
	}

	/**
	 * Parse site input and trigger creation functions
	 * @param {string} siteArgs The site arguments from the command line
	 * @return {Promise<INewSiteData>}
	 */
	private handleSite(siteArgs:string):Promise<INewSiteData> {
		console.log("Maybe for your birthday");
		console.log("Here's what you wrote though:");
		console.log(siteArgs);

		let parts = siteArgs.split(',');
		let ownerID = parseInt(parts[0]);

		return dbPopulator.newSite(ownerID);
	}

	/**
	 * Parse section input and trigger creation functions
	 * @param {string} sectionArgs The section arguments from the command line
	 * @return {Promise<INewSectionData>}
	 */
	private handleSection(sectionArgs:string):Promise<INewSectionData> {
		console.log("Sections too?");
		console.log("Here's what you wrote though:");
		console.log(sectionArgs);

		let parts = sectionArgs.split(',');
		let ownerID = parseInt(parts[0]);
		let siteIDs = this.getIDsFromArgs(parts[1]);

		return dbPopulator.newSection(ownerID, siteIDs);
	}

	/**
	 * Parse package input and trigger creation functions
	 * @param {string} packageArgs The package arguments from the command line
	 * @return {Promise<INewPackageData>}
	 */
	private handlePackage(packageArgs:string):Promise<INewPackageData> {
		console.log("Pretend this is a new package");
		console.log("Here's what you wrote though:");
		console.log(packageArgs);

		let parts = packageArgs.split(',');
		let ownerID = parseInt(parts[0]);
		let sectionIDs = this.getIDsFromArgs(parts[1]);

		return dbPopulator.newPackage(ownerID, sectionIDs);
	}

	/**
	 * Create each object type in sequence
	 * @return {void}
	 */
	private handleAll():void {
		console.log("Pretending to look real busy now");
		// let pub:INewPubData;
		// let sites:INewSiteData[];

		// this.handlePublisher(true)
		// .then((newPub:INewPubData) => {
		// 	pub = newPub;
		// 	return this.handleSite(pub.user.userID.toString());
		// })
		// .then(() => {

		// })

		// dbPopulator.newPub()
		// .then((newPub:INewPubData)=>{
		// 	pub = newPub;
		// 	return dbPopulator.newSite(pub.user.userID);
		// })
		// .then((newSite) => {
		// 	sites= [newSite];
		// 	return 
		// })
	}

	/**
	 * Parse an array of integer ID values from a CLI string
	 * @param {string} args The passed list of IDs
	 * @return {number[]} The parsed array of numeric IDs
	 */
	private getIDsFromArgs(args:string):number[] {
		return args.split(':').map((val:string) => {
			return parseInt(val);
		});
	}

}

const dgc:DataGenCLI = new DataGenCLI();
dgc.run();

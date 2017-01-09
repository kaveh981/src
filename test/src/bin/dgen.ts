// /* tslint:disable:no-console */
// 'use strict';

// /**
//  * @file Provides a command line interface (CLI) to the data population functions
//  */

// import * as commander from 'commander';

// import { Logger } from '../lib/logger';
// import { DatabasePopulator } from '../lib/database-populator';
// import { Injector } from '../lib/injector';
// import { Bootstrap } from '../lib/bootstrap';

// const dbPopulator = Injector.request<DatabasePopulator>('DatabasePopulator');
// const Log = new Logger('DGEN');

// /*
//  * The commander interface won't have our CLI option vars by default
//  * Make Typescript happy.
//  */
// interface InterfaceCLI extends commander.ICommand {
//     file?: string;
//     dsp?: string;
//     buyer?: string;
//     pub?: string;
//     site?: string;
//     section?: string;
//     proposal?: string;
// }

// /**
//  * CLI class
//  */
// class DataGenCLI {

//     protected cmd: InterfaceCLI;

//     /**
//      * Constructor: set up Commander to parse the input options
//      * @return {void}
//      */
//     constructor() {
//         let fileDescription = 'A json file containing data objects';
//         let publisherDescription = 'Generate a publisher, use -p <n> to generate n publishers.';
//         let siteDescription = 'Generate a site, pub ID required, append a number with a comma to generate n sites:'
//             + ' -s <id>,<n> .';
//         let sectionDescription = 'Generate a site section, pub ID, site ID required. Append a number to generate multiple:'
//             + ' -S <pid>,<sid>,<n>';
//         let proposalDescription = 'Generate a proposal. Owner ID, section [ID]s required:'
//             + ' -P <pid>,<sid0>:...:<sidN>,n';
//         let dspDescription = 'Generate a new DSP, [ID] required: -D <dspID>';
//         let buyerDescription = 'Generate a new ixmBuyer, dspID required: -b <dspID>';

//         this.cmd = commander.version('6.6.6')
//             .description('Generate IXM related data. Call with no arguments for generating a standard set.')
//             .option('-f --file <string>', fileDescription)
//             .option('-p --pub [string]', publisherDescription)
//             .option('-s --site <string>', siteDescription)
//             .option('-S --section <string>', sectionDescription)
//             .option('-P --proposal <string>', proposalDescription)
//             .option('-D --dsp <ID>', dspDescription)
//             .option('-b --buyer <dspID>', buyerDescription)
//             .parse(process.argv);
//     }

//     /**
//      * Run the command according to input options.
//      * @return {void}
//      */
//     public async run() {
//         try {
//             await Bootstrap.boot(false);
//             let results = await this.runHandlers();
//             console.log("Here's what you got:");
//             console.log(JSON.stringify(results, null, 4));
//             await Bootstrap.shutdown(false);
//             console.log("All done");
//         } catch (e) {
//             console.error(e);
//             await Bootstrap.shutdown(false);
//             process.exit(1);
//         }
//     }

//     /**
//      * Run all handlers according to given command options
//      * @return {Object} results The generated data
//      */
//     private async runHandlers() {
//         console.log("cocorico");
//         let res = {
//             file: null,
//             dsp: null,
//             buyer: null,
//             pub: null,
//             site: null,
//             section: null,
//             proposal: null
//         };
//         if (this.cmd.file) {
//             res.file = this.handleFile(this.cmd.file);
//         }

//         if (this.cmd.dsp) {
//             res.dsp = await this.handleDSP(this.cmd.dsp);
//         }

//         if (this.cmd.buyer) {
//             res.buyer = await this.handleBuyer(this.cmd.buyer);
//         }

//         if (this.cmd.pub) {
//             res.pub = await this.handlePublisher(this.cmd.pub);
//         }

//         if (this.cmd.site) {
//             res.site = await this.handleSite(this.cmd.site);
//         }

//         if (this.cmd.section) {
//             res.section = await this.handleSection(this.cmd.section);
//         }

//         if (this.cmd.proposal) {
//             res.proposal = await this.handleProposal(this.cmd.proposal);
//         }

//         return res;
//     }

//     /**
//      * Parse file input and trigger creation functions
//      * @param {string} fileArgs The file arguments from the command line
//      * @return {void}
//      */
//     private handleFile(fileArgs: string): void {
//         Log.info("ratpoint.jpg?");
//         Log.info("Here's what you wrote though:");
//         Log.info(fileArgs);
//     }

//     /**
//      * Parse dspID and create new DSP via DatabasePopulator
//      * @param {string} dspID - The dspID to map the buyer with
//      * @returns {Promise<INewDSPData>}
//      */
//     private handleDSP(dspID: string): Promise<INewDSPData> {
//         console.log("Seems like you're on the DSP creation business, and I'm doing your job...");
//         return dbPopulator.createDSP(parseInt(dspID, 10));
//     }

//     private handleBuyer(dspID: string): Promise<INewBuyerData> {
//         console.log("Need just 1 buyer? We have up to 16777215 for you");
//         return dbPopulator.createBuyer(parseInt(dspID, 10));
//     }

//     /**
//      * Parse publisher input and trigger creation functions
//      * @param {string | boolean} pubArgs The publisher arguments from the command line
//      * @return {Promise<INewPubData>}
//      */
//     private handlePublisher(pubArgs: string) {
//         console.log("Sure would be nice to have some pubs");
//         console.log("Here's what you wrote though:");
//         console.log(pubArgs);

//         return dbPopulator.createPublisher();
//     }

//     /**
//      * Parse site input and trigger creation functions
//      * @param {string} siteArgs The site arguments from the command line
//      * @return {Promise<INewSiteData>}
//      */
//     private handleSite(siteArgs: string) {
//         Log.info("Maybe for your birthday");
//         Log.info("Here's what you wrote though:");
//         Log.info(siteArgs);

//         let parts = siteArgs.split(',');
//         let ownerID = parseInt(parts[0], 10);

//         return dbPopulator.createSite(ownerID);
//     }

//     /**
//      * Parse section input and trigger creation functions
//      * @param {string} sectionArgs The section arguments from the command line
//      * @return {Promise<INewSectionData>}
//      */
//     private handleSection(sectionArgs: string) {
//         Log.info("Sections too?");
//         Log.info("Here's what you wrote though:");
//         Log.info(sectionArgs);

//         let parts = sectionArgs.split(',');
//         let ownerID = parseInt(parts[0], 10);
//         let siteIDs = this.getIDsFromArgs(parts[1]);

//         return dbPopulator.createSection(ownerID, siteIDs);
//     }

//     /**
//      * Parse proposal input and trigger creation functions
//      * @param {string} proposalArgs The proposal arguments from the command line
//      * @return {Promise<INewProposalData>}
//      */
//     private handleProposal(proposalArgs: string) {
//         Log.info("Pretend this is a new proposal");
//         Log.info("Here's what you wrote though:");
//         Log.info(proposalArgs);

//         let parts = proposalArgs.split(',');
//         let ownerID = parseInt(parts[0], 10);
//         let sectionIDs = this.getIDsFromArgs(parts[1]);

//         return dbPopulator.createProposal(ownerID, sectionIDs);
//     }

//     /**
//      * Parse an array of integer ID values from a CLI string
//      * @param {string} args The passed list of IDs
//      * @return {number[]} The parsed array of numeric IDs
//      */
//     private getIDsFromArgs(args: string): number[] {
//         return args.split(':').map((val: string) => {
//             return parseInt(val, 10);
//         });
//     }

// }

// const dgc: DataGenCLI = new DataGenCLI();
// dgc.run();

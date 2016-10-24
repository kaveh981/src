'use strict';

/**
 * @file Provides a command line interface (CLI) to the data population functions
 */

import * as process from 'process';
import * as PromiseB from 'bluebird';
import * as commander from 'commander';

import { DatabasePopulator } from '../lib/database-populator';
import { Injector } from '../lib/injector';
import { Bootstrap } from '../lib/bootstrap';

const dbPopulator = Injector.request<DatabasePopulator>('DatabasePopulator');

/*
 * The commander interface won't have our CLI option vars by default
 * Make Typescript happy.
 */
interface InterfaceCLI extends commander.ICommand {
        file?: string;
        pub?: string;
        site?: string;
        section?: string;
        proposal?: string;
}

/** 
 * CLI class 
 */
class DataGenCLI {

    protected cmd: InterfaceCLI;

    /**
     * Constructor: set up Commander to parse the input options
     * @return {void}
     */
    constructor() {
        let fileDescription = 'A json file containing data objects';
        let publisherDescription = 'Generate a publisher, use -p <n> to generate n publishers.';
        let siteDescription = 'Generate a site, pub ID required, append a number with a comma to generate n sites:'
                      + ' -s <id>,<n> .';
        let sectionDescription = 'Generate a site section, pub ID, site ID required. Append a number to generate multiple:'
                      + ' -S <pid>,<sid>,<n>';
        let proposalDescription = 'Generate a proposal. Owner ID, section [ID]s required:'
                      + ' -P <pid>,<sid0>:...:<sidN>,n';

        this.cmd = commander.version('6.6.6')
            .description('Generate IXM related data. Call with no arguments for generating a standard set.')
            .option('-f --file <string>', fileDescription)
            .option('-p --pub [string]', publisherDescription)
            .option('-s --site <string>', siteDescription)
            .option('-S --section <string>', sectionDescription)
            .option('-P --proposal <string>', proposalDescription)
            .parse(process.argv);
    }

    /**
     * Run the command according to input options.
     * @return {void}
     */
    public async run() {

        await Bootstrap.boot(false);
        let results = await this.runHandlers();
        console.log("Here's what you got:");
        console.log(results);
        await Bootstrap.shutdown(false);
        console.log("All done");
/*        Bootstrap.boot(false)
            .then(() => {
                return this.runHandlers();
            })
            .then((results) => {

                console.log("Here's what you got:");
                console.log(results);
                Bootstrap.shutdown(false);

                console.log("All done");
            });*/
    }

    /**
     * Generate a coroutine to run each specified handler
     * @return {Object} results The generated data
     */
    private runHandlers(): Object {
        let cocorico =  PromiseB.coroutine(function* (): Object {
            let cmd = this.cmd;
            console.log("cocorico");
            console.log(cmd.site);
            let res = {
                file: null,
                pub: null,
                site: null,
                section: null,
                proposal: null
            };
            if (cmd.file) {
                res.file = yield this.handleFile(cmd.file);
            } else {
                // if(!cmd.pub && !cmd.site && !cmd.section && !cmd.proposal) {
                //  this.handleAll();
                //  return;
                // }

                if (cmd.pub) {
                    res.pub = yield this.handlePublisher(cmd.pub);
                }

                if (cmd.site) {
                    res.site = yield this.handleSite(cmd.site);
                }

                if (cmd.section) {
                    res.section = yield this.handleSection(cmd.section);
                }

                if (cmd.proposal) {
                    res.proposal = yield this.handlePackage(cmd.proposal);
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
    private handleFile(fileArgs: string): void {
        console.log("ratpoint.jpg?");
        console.log("Here's what you wrote though:");
        console.log(fileArgs);
    }

    /**
     * Parse publisher input and trigger creation functions
     * @param {string | boolean} pubArgs The publisher arguments from the command line
     * @return {Promise<INewPubData>}
     */
    private handlePublisher(pubArgs: string | boolean) {
        console.log("Sure would be nice to have some pubs");
        console.log("Here's what you wrote though:");
        console.log(pubArgs);

        return dbPopulator.createPublisher();
    }

    /**
     * Parse site input and trigger creation functions
     * @param {string} siteArgs The site arguments from the command line
     * @return {Promise<INewSiteData>}
     */
    private handleSite(siteArgs: string) {
        console.log("Maybe for your birthday");
        console.log("Here's what you wrote though:");
        console.log(siteArgs);

        let parts = siteArgs.split(',');
        let ownerID = parseInt(parts[0], 10);

        return dbPopulator.createSite(ownerID);
    }

    /**
     * Parse section input and trigger creation functions
     * @param {string} sectionArgs The section arguments from the command line
     * @return {Promise<INewSectionData>}
     */
    private handleSection(sectionArgs: string) {
        console.log("Sections too?");
        console.log("Here's what you wrote though:");
        console.log(sectionArgs);

        let parts = sectionArgs.split(',');
        let ownerID = parseInt(parts[0], 10);
        let siteIDs = this.getIDsFromArgs(parts[1]);

        return dbPopulator.createSection(ownerID, siteIDs);
    }

    /**
     * Parse proposal input and trigger creation functions
     * @param {string} proposalArgs The proposal arguments from the command line
     * @return {Promise<INewPackageData>}
     */
    private handlePackage(proposalArgs: string) {
        console.log("Pretend this is a new proposal");
        console.log("Here's what you wrote though:");
        console.log(proposalArgs);

        let parts = proposalArgs.split(',');
        let ownerID = parseInt(parts[0], 10);
        let sectionIDs = this.getIDsFromArgs(parts[1]);

        return dbPopulator.createProposal(ownerID, sectionIDs);
    }

    /**
     * Create each object type in sequence
     * @return {void}
     */
    private handleAll(): void {
        console.log("Pretending to look real busy now");
        // let pub:INewPubData;
        // let sites:INewSiteData[];

        // this.handlePublisher(true)
        // .then((newPub:INewPubData) => {
        //  pub = newPub;
        //  return this.handleSite(pub.user.userID.toString());
        // })
        // .then(() => {

        // })

        // dbPopulator.newPub()
        // .then((newPub:INewPubData)=>{
        //  pub = newPub;
        //  return dbPopulator.newSite(pub.user.userID);
        // })
        // .then((newSite) => {
        //  sites= [newSite];
        //  return 
        // })
    }

    /**
     * Parse an array of integer ID values from a CLI string
     * @param {string} args The passed list of IDs
     * @return {number[]} The parsed array of numeric IDs
     */
    private getIDsFromArgs(args: string): number[] {
        return args.split(':').map((val: string) => {
            return parseInt(val, 10);
        });
    }

}

const dgc: DataGenCLI = new DataGenCLI();
dgc.run();

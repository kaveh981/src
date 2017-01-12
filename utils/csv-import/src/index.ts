'use strict';

/** Lib */
import './boot';

import { Injector } from './lib/injector';
import { CSVLoader } from './lib/csv-loader';
import { Logger } from './lib/logger';
import { Validator } from './lib/validator';
import { SQLScriptBuilder } from './lib/sql-script-builder';
import { SectionPopulator } from './lib/section-populator';

/** node_modules */
import toCsv = require('csv-stringify/lib/sync');

import * as program from 'commander';
import * as path from 'path';
import * as fs from 'fs';
import * as prompt from 'prompt-sync';

const csv = Injector.request<CSVLoader>('CSVLoader');
const validator = Injector.request<Validator>('Validator');
const sqlScriptBuilder = Injector.request<SQLScriptBuilder>('SQLScriptBuilder');
const sectionPopulator = Injector.request<SectionPopulator>('SectionPopulator');
const Log = new Logger();

program.version('1.0.0')
    .option('-p, --proposal', 'Import proposals.')
    .option('-s, --section', 'Import sections.')
    .option('-f, --file [file]', 'The csv file to parse.')
    .parse(process.argv);

let filePath = program['file'];

if (!filePath) {
    Log.error('Please specify a file name.');
    process.exit(1);
}

if (!fs.existsSync(filePath)) {
    Log.error(`File at ${filePath} does not exist.`);
    process.exit(1);
}

let file = path.basename(filePath);
let directory = path.dirname(filePath);

if (!csv.setFolder(directory)) {
    Log.error(`Directory ${directory} not found.`);
    process.exit(1);
}

if (program['proposal']) {
    importProposals();
} else if (program['section']) {
    importSections();
} else {
    Log.error('Please specify the type of data to import');
    process.exit(1);
}

function importProposals () {
    Log.info('Parsing proposals...');

    let proposals = csv.getProposals(file);

    if (!validator.validateProposals(proposals)) {
        Log.error('One or more proposals are invalid. Exiting...');
        process.exit(1);
    }

    Log.info('Parsed proposals:\n' + JSON.stringify(proposals, undefined, 4));

    Log.info('All proposals pass validation. Building SQL script...');

    sqlScriptBuilder.buildScripts(file.slice(0, -4), directory, proposals)
        .then(() => {
            Log.info(`Successfully created SQL queries for ${file}.`);
        })
        .catch((error: Error) => {
            Log.error(error);
        });
}

async function importSections () {

    Log.info('Parsing sections...');

    let sections = csv.getSections(file);
    // Use the unparsed input array to generate output
    let originalImput = csv.loadCsvFile(file);

    if (!validator.validateSections(sections)) {
        Log.error('One or more sections are invalid. Exiting...');
        process.exit(1);
    }

    Log.info(`Number of parsed sections: ${sections.length}`);
    Log.info('Parsed sections:\n' + JSON.stringify(sections, undefined, 4));
    Log.info('All sections pass validation. Importing to DB...');

    let username: string = prompt()('E-mail Address: ');
    let password: string = prompt().hide('Password: ');

    Log.info('Obtaining access token...');

    try {
        await sectionPopulator.getAccessToken(username, password);
    } catch (err) {
        Log.error(`Failed to authenticate user ${username}`);
        process.exit(1);
    }

    Log.info('Obtain success.');

    Log.info('Start sending requests to create sections... ');

    let results = await sectionPopulator.importSections(sections, originalImput);

    let columns = {
        userID: 'userID',
        name: 'name',
        percent: 'percent',
        entireSite: 'entireSite',
        fullMatchesURL: 'fullMatchesURL',
        partialMatchesURL: 'partialMatchesURL',
        siteID: 'siteIDs',
        frequencyRestrictions: 'frequencyRestrictions',
        audienceRestrictions: 'audienceRestrictions',
        countryRestrictions: 'countryRestrictions',
        adUnitRestrictions: 'adUnitRestrictions',
        responseCode: 'responseCode',
        responseErrors: 'responseErrors',
        newSectionID: 'newSectionID'
    };

    let csvResults: string = toCsv(results, { header: true, columns: columns });

    fs.writeFile(path.join(directory, file.slice(0, -4) + "_results.csv"), csvResults, (err) => {
            if (err) {
                return Log.error(err);
            }
    });

    Log.info('Done.');

}

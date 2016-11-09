'use strict';

console.log('Booting CSV Import utility tool');
import './boot';

import { Injector } from './lib/injector';
import { CSVLoader } from './lib/csv-loader';
import { Logger } from './lib/logger';
import { Validator } from './lib/validator';

import * as program from 'commander';
import * as path from 'path';
import * as fs from 'fs';

const csv = Injector.request<CSVLoader>('CSVLoader');
const validator = Injector.request<Validator>('Validator');
const Log = new Logger();

program.version('1.0.0')
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

let proposals = csv.getProposals(file);

Log.info('Parsed proposals:\n' + JSON.stringify(proposals, undefined, 4));

console.log(validator.validateProposals(proposals));

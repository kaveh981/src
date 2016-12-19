'use strict';

/** node_modules */
import * as program from 'commander';

/** Lib */
import { Logger } from './lib/logger';
import { Bootstrap } from './lib/bootstrap';
import { SuiteManager } from './lib/suite-manager';

const Log = new Logger('TEST');

program.version('1.0.0')
    .option('-d, --directory [dir]', 'The directory which houses the tests.')
    .option('-s, --stress', 'A signal to run stress tests')
    .option('-r, --regex [regex]', 'A regular expression matching the test name.')
    .parse(process.argv);

let directory = program['directory'];
let regex = program['regex'] && new RegExp(program['regex']);
let isStress = program['stress'];

if (!directory && !isStress) {
    Log.error('Please specify a directory.');
} else {
    Bootstrap.boot()
        .then(() => {
            let suiteManager = new SuiteManager(directory, !!isStress, regex);
            return suiteManager.runSuite();
        })
        .then(() => {
            Bootstrap.shutdown();
        })
        .catch((e) => {
            Bootstrap.shutdown();
        });
}

process.on('SIGINT', () => {
    Log.info('Shutting down gracefully');
    Bootstrap.crash();
});

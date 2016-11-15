'use strict';

/** node_modules */
import * as program from 'commander';

/** Lib */
import { Bootstrap } from './lib/bootstrap';
import { SuiteManager } from './lib/suite-manager';

program.version('1.0.0')
    .option('-d, --directory [dir]', 'The directory which houses the tests.')
    .option('-s, --stress-test [dir]', 'The directory which houses the stress tests.')
    .option('-r, --regex [regex]', 'A regular expression matching the test name.')
    .parse(process.argv);

let directory = program['directory'];
let stressDirectory = program['stress-test'];
let regex = program['regex'] && new RegExp(program['regex']);

if (!directory && !stressDirectory) {
    console.log('Please specify a directory.');
} else {
    Bootstrap.boot()
        .then(() => {
            let suiteManager = new SuiteManager(directory, stressDirectory, regex);
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
        console.log('Shutting down gracefully');
        Bootstrap.crash();
});

'use strict';

/** node_modules */
import * as program from 'commander';
import * as path from 'path';

/** Lib */
import { Logger } from './lib/logger';
import { Bootstrap } from './lib/bootstrap';
import { SuiteManager } from './lib/suite-manager';

const Log = new Logger('TEST');
const ON_DEATH = require('death')({ uncaughtException: true });

program.version('1.0.0')
    .option('-d, --directory [dir]', 'The directory which houses the tests.')
    .option('-s, --stress', 'A signal to run stress tests')
    .option('-r, --regex [regex]', 'A regular expression matching the test name.')
    .option('-b, --restore', 'Restore the database.')
    .option('-f --file [file]', 'Run the tests exported in a given file.')
    .parse(process.argv);

let directory = program['directory'];
let regex = program['regex'] && new RegExp(program['regex']);
let isStress = program['stress'];
let restore = program['restore'];
let file = program['file'];

let suiteManager: SuiteManager;

if (!directory && !isStress && !file && !restore) {
    Log.error('Please specify a file (-f) or directory (-d).');
    process.exit(1);
}

Bootstrap.boot()
    .then(() => {

        if (restore) {
            return;
        }

        let testDirectory: string;

        if (file) {
            testDirectory = file;
        } else if (directory) {
            testDirectory = path.join('/test-cases/endpoints', directory);
        } else if (isStress) {
            testDirectory = '/test-cases/stress-tests';
        }

        suiteManager = new SuiteManager(testDirectory, regex);

        return suiteManager.runSuite();

    })
    .then(() => {
        Bootstrap.shutdown();
    })
    .catch((e) => {
        Log.error(e);
        Bootstrap.shutdown();
    });

ON_DEATH((signal, err) => {
    if (suiteManager) {
        suiteManager.stopTesting();
    }
    Bootstrap.crash();
});

'use strict';

/** node_modules */
import * as program from 'commander';

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
    .parse(process.argv);

let directory = program['directory'];
let regex = program['regex'] && new RegExp(program['regex']);
let isStress = program['stress'];
let restore = program['restore'];
let suiteManager: SuiteManager;

if (restore) {
    Bootstrap.boot()
        .then(() => {
            Bootstrap.shutdown();
        })
        .catch((e) => {
            Bootstrap.shutdown();
        });
} else {
    if (!directory && !isStress) {
        Log.error('Please specify a directory.');
    } else {
        Bootstrap.boot()
            .then(() => {
                suiteManager = new SuiteManager(directory, !!isStress, regex);
                return suiteManager.runSuite();
            })
            .then(() => {
                Bootstrap.shutdown();
            })
            .catch((e) => {
                Bootstrap.shutdown();
            });
    }
}

ON_DEATH((signal, err) => {
    if (suiteManager) {
        suiteManager.stopTesting();
    }
    Bootstrap.crash();
});

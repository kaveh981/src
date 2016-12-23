'use strict';

/** node_modules */
import * as program from 'commander';
import * as path from 'path';
const keypress = require('keypress');

/** Lib */
import { Logger } from './lib/logger';
import { Bootstrap } from './lib/bootstrap';
import { SuiteManager } from './lib/suite-manager';

const Log = new Logger('TEST');

program.version('1.0.0')
    .option('-d, --directory [dir]', 'The directory which houses the tests.')
    .option('-s, --stress', 'A signal to run stress tests')
    .option('-r, --regex [regex]', 'A regular expression matching the test name.')
    .option('-b, --restore', 'Restore the database.')
    .option('-f --file [file]', 'Run the tests exported in a given file.')
    .parse(process.argv);

keypress(process.stdin);

let suiteManager: SuiteManager;
let killCount: number = 0;

async function start() {

    let directory = program['directory'];
    let regex = program['regex'] && new RegExp(program['regex']);
    let isStress = program['stress'];
    let restore = program['restore'];
    let file = program['file'];
    let testDirectory: string;

    if (!directory && !isStress && !file && !restore) {
        Log.error('Please specify a file (-f) or directory (-d).');
        process.exit(1);
    }

    if (file) {
        testDirectory = file;
    } else if (directory) {
        testDirectory = path.join('/test-cases/endpoints', directory);
    } else if (isStress) {
        testDirectory = '/test-cases/stress-tests';
    }

    await Bootstrap.boot();

    if (!restore) {
        suiteManager = new SuiteManager(testDirectory, regex);
        await suiteManager.runSuite().catch(e => Log.error(e));
    }

    await Bootstrap.shutdown();
    process.exit(0);

}

process.stdin.on('keypress', (ch, key) => {
    if (key && key.ctrl && key.name === 'c') {
        killCount++;

        if (suiteManager) {
            suiteManager.stopTesting();
        }

        if (killCount >= 3) {
            process.exit(1);
        }
    }
});

process.stdin['setRawMode'](true);
process.stdin.resume();

process.on('uncaughtException', () => { process.exit(1); });

start();

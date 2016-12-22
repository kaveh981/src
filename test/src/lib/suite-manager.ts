'use strict';

/** node_modules */
import * as path from 'path';
import * as test from 'tape';
import * as fs from 'fs';
import Finder = require("fs-finder");

/** Lib */
import { TestManager } from './test-manager';
import { Logger } from './logger';

const Log = new Logger('SUMN');

interface ITestCaseFunction {
    (assert: test.Test): Promise<void>;
}

/**
 * SuiteManager class. Loads all test files in the specified folder and includes any test cases that match a RegExp
 */
class SuiteManager {

    public shuttingDown: boolean = false;

    private testsPath: string;
    private regex: RegExp;
    private testCases: TestManager[] = [];

    /**
     * Instance constructor. Assigns params and loads test cases
     * @param testsPath - the path to load tst files from
     * @param regex - the regular expression to describe test cases to load
     */
    constructor (testsPath: string, regex: RegExp = /\.*/) {
        this.regex = regex;
        this.testsPath = path.join(__dirname, '../../', testsPath);
        this.loadTests();
    }

    /**
     * Loads tests described by this test suite
     */
    private loadTests() {

        let testFiles: string[];

        if (fs.lstatSync(this.testsPath).isDirectory()) {
            testFiles = Finder.from(this.testsPath).findFiles('*.test.<[jt]>s');
        } else {
            testFiles = [ this.testsPath ];
        }

        testFiles.forEach((testFile: string) => {
            let fileExports: any = require(testFile);

            for (let testName in fileExports) {
                if (this.regex.test(testName)) {
                    let exported: ITestCaseFunction | ITestCaseFunction[] = fileExports[testName];

                    if (Array.isArray(exported)) {
                        exported.forEach((testFunction: ITestCaseFunction, i) => {
                            let testCase = new TestManager(`${testName}_${('0' + (i + 1)).slice(-2)}`, testFunction);
                            this.testCases.push(testCase);
                        });
                    } else {
                        let testCase = new TestManager(testName, exported);
                        this.testCases.push(testCase);
                    }
                }
            }

        });

    }

    /**
     * Runs all test cases loaded by calling runTest() on each of the testCases
     */
    public async runSuite() {

        for (let i = 0; i < this.testCases.length; i += 1) {

            // We are interrupting SIGINT, so we need to manually stop the testing.
            if (this.shuttingDown) {
                break;
            }

            let testCase = this.testCases[i];

            try {
                await testCase.runTest();
            } catch (error) {
                Log.error(error);

                // DB errors include this message, so we can't continue.
                if (error.message.indexOf('cannot accept work') !== -1) {
                    break;
                }
            }
        }

    }

    public stopTesting() {
        this.shuttingDown = true;
    }

}

export { SuiteManager }

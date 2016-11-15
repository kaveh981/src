'use strict';

/** node_modules */
import * as path from 'path';
import * as test from 'tape';
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
    private testsPath: string;
    private stressTestsPath: string;
    private regex: RegExp;
    private testCases: TestManager[];

    /**
     * Instance constructor. Assigns params and loads test cases
     * @param testsPath - the path to load tst files from
     * @param regex - the regular expression to describe test cases to load
     */
    constructor (testsPath: string, stressTestsPath: string, regex: RegExp = /\.*/) {
        this.testCases = [];
        this.regex = regex;
        if (testsPath) {
            this.testsPath = path.join(__dirname, '../../test-cases/endpoints', testsPath);
        }
        if (stressTestsPath) {
            this.stressTestsPath = path.join(__dirname, '../../test-cases/', stressTestsPath);
        }
        this.loadTests();
    }

    /**
     * Loads tests described by this test suite
     */
    private loadTests() {
        let testFiles: string[] = [];

        if (this.stressTestsPath) {
           testFiles = testFiles.concat(Finder.from(this.stressTestsPath).findFiles('*.test.ts'));
        }

        if (this.testsPath) {
            testFiles = testFiles.concat(Finder.from(this.testsPath).findFiles('*.test.js'));
        }

        testFiles.forEach((testFile: string) => {
            let fileExports: any = require(testFile);

            for (let testName in fileExports) {
                if (!fileExports.hasOwnProperty(testName)) { return; }

                if (this.regex.test(testName)) {
                    let exported: ITestCaseFunction | ITestCaseFunction[] = fileExports[testName];

                    if (Array.isArray(exported)) {
                        exported.forEach((testFunction: ITestCaseFunction, i) => {
                            let testCase = new TestManager(`${testName}_${('0' + (i + 1)).slice(-2)}`, testFunction);
                            this.testCases.push(testCase);
                        }, this);
                    } else {
                        let testCase = new TestManager(testName, exported);
                        this.testCases.push(testCase);
                    }
                }
            }

        }, this);
    }

    /**
     * Runs all test cases loaded by calling runTest() on each of the testCases
     */
    public async runSuite() {
        for (let i = 0; i < this.testCases.length; i += 1) {
            let testCase = this.testCases[i];

            try {
                await testCase.runTest().catch((e) => { throw e; });
            } catch (error) {
                Log.error(error);
                break;
            }
        }
    }

}

export { SuiteManager }

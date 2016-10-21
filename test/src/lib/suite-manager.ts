'use strict';

/** node_modules */
import * as path from 'path';
import * as test from 'tape';
import Finder = require("fs-finder");

/** Lib */
import { TestManager } from './test-manager';

interface ITestCaseFn { (assert: test.Test): Promise<void> }

/**
 * SuiteManager class. Loads all test files in the specified folder and includes any test cases that match a RegExp
 */
class SuiteManager {

    private testsPath: string;
    private regex: RegExp;
    private test_cases: TestManager[];

    /**
     * Instance constructor. Assigns params and loads test cases
     * @param testsPath - the path to load tst files from
     * @param regex - the regular expression to describe test cases to load
     */
    constructor (testsPath: string, regex: RegExp = /\.*/) {
        this.test_cases = [];
        this.regex = regex;
        this.testsPath = path.join(__dirname, '../../test-cases/endpoints', testsPath);
        this.loadTests();
    }

    /**
     * Loads tests described by this test suite
     */
    private loadTests() {
        let testFiles: string[] = Finder.from(this.testsPath).findFiles('*.test.js');

        testFiles.forEach((testFile: string) => {
            let file_exports: any = require(testFile);

            for (let test_name in file_exports) {
                if (!file_exports.hasOwnProperty(test_name)) { return }

                if (this.regex.test(test_name)) {
                    let exported:ITestCaseFn | ITestCaseFn[] = file_exports[test_name];

                    if (Array.isArray(exported)) {
                        exported.forEach((test_fn:ITestCaseFn, i) => {
                            let test_case = new TestManager(`${test_name}_${i}`, test_fn);
                            this.test_cases.push(test_case);
                        }, this);
                    }
                    else {
                        let test_case = new TestManager(test_name, exported);
                        this.test_cases.push(test_case);
                    }
                }
            }

        }, this);
    }

    /**
     * Runs all test cases loaded by calling runTest() on each of the test_cases
     */
    public async runSuite() {
        for (let i = 0; i < this.test_cases.length; i += 1) {
            let test_case = this.test_cases[i];
            await test_case.runTest();
        }
    }

}

export { SuiteManager }

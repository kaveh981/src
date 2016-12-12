'use strict';

/** node_modules */
import * as test from 'tape';
import * as deep from 'deep-diff';

/** Lib */
import { DataSetup } from './data-setup';
import { Injector  } from './injector';
import { Logger    } from './logger';

/** request dependencies */
const Log = new Logger('TMGR');
const dataSetup = Injector.request<DataSetup>('DataSetup');

/**
 *  Test Manager class. 
 */
class TestManager {

    private testName: string;
    private testFunction: (assert: test.Test) => Promise<void>;

    /**
     *  Constructs a TestManager instance describing an atomic test-case.
     * @param name - The name or label to assign to the test case
     * @param testCaseFunction - an async function that runs the test case
     */
    constructor (name: string, testCaseFunction: (assert: test.Test) => Promise<void>) {
        this.testName = name;
        this.testFunction = testCaseFunction;
    }

    /**
     *  Wraps tape's test function and runs a test function after clearing tables
     */
    public runTest() {
        return new Promise((resolve, reject) => {
            test(this.testName, async (t: test.Test) => {
                try {
                    this.upgradeTapeObject(t);
                    await dataSetup.clearTables();
                    await this.testFunction(t);
                    resolve();
                } catch (e) {
                    reject(e);
                }
            });
        });

    }

    /**
     * Update the tape test object with better tests.
     * @param assert - The tape test object passed to the test function.
     */
    private upgradeTapeObject(assert: test.Test) {

        // Improve the tape deep equals by adding the location of difference.
        assert.deepEqual = function(actualObject: any, expectedObject: any, message?: string) {

            let deepDifference = deep.diff(expectedObject, actualObject) || [];

            this._assert(deepDifference.length === 0, {
                message: message || 'Both objects should be identical.',
                operator: 'deepEquals',
                expected: JSON.stringify(expectedObject),
                actual: JSON.stringify(actualObject)
            });

            Log.info(deepDifference.map((diff) => {
                        return `Error at: ${diff.path && diff.path.join(' -> ')}. Expected '${diff.lhs}' got '${diff.rhs}'.`;
                    }).join('\n'));

        };

        // Synonyms
        assert.deepEquals = assert.deepEqual;

    }

}

export { TestManager }

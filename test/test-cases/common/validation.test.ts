'use strict';

import * as test from 'tape';

import { Injector } from '../../src/lib/injector';
import { APIRequestManager } from '../../src/lib/request-manager';
import { ConfigLoader    } from '../../src/lib/config-loader';
import { DataSetup } from '../../src/lib/data-setup';
import { Logger } from '../../src/lib/logger';

const Log = new Logger('VALT');

const configLoader = Injector.request<ConfigLoader>('ConfigLoader');
const apiRequest = Injector.request<APIRequestManager>('APIRequestManager');
const dataSetup = Injector.request<DataSetup>('DataSetup');

/**
 * exports common validation tests.
 * @param route - The route that we are calling.
 * @param verb - The verb that we are using for the api.
 * @param setup - The setup function that populate required tables.
 * @param validationParams - The api request parameters.
 * @returns an array of test cases functions.
 */
function validationTest(route: string, verb: string, setup: Function, validationParams: {}) {

    let tests = [];

    // loop trough params
    for (let property in validationParams) {

        if (validationParams.hasOwnProperty(property)) {

            let cases = configLoader.get(`common-validation/${validationParams[property].type}`);
            if (validationParams[property].extraCases && validationParams[property].extraCases.length > 0) {
                cases.concat(validationParams[property].extraCases);
            }

            let testFunction = async (t: test.Test) => {
                let setupRes = await setup();
                let requestParams = parseRequestParams(validationParams, setupRes);
                t.plan(cases.length);
                // loop through configs
                for (let i = 0; i < cases.length; i++) {

                    requestParams[property] = cases[i].input;
                    let res = await apiRequest[verb.toLowerCase()](route, requestParams, setupRes.userID);
                    t.equal(res.status, cases[i].expect ? cases[i].expect : 400);
                    // clear table and run setup if the api call succeed for any reason to start with fresh data for the next test
                    if (res.status === 200) {
                        await dataSetup.clearTables();
                        setupRes = await setup();
                        requestParams = parseRequestParams(validationParams, setupRes);
                    }

                }
                // to test missing param
            };

            tests.push((assert: test.Test) => {return testFunction(assert); });

        }

    }
    return tests;
}

/**
 * Returns a valid request parameters based on the valid params in the validationParams.
 * @param validationParams - The api request parameters.
 * @param setupResponse - The object that setup function returns.
 * @returns A valid route request body object.
 */
function parseRequestParams(validationParams: {}, setupResponse: {}) {
    let requestParams = {};

    for (let param in validationParams) {

        if (validationParams.hasOwnProperty(param)) {
            if (validationParams[param].validParam) {
                requestParams[param] = validationParams[param].validParam;
            } else if (setupResponse[param]) {
                requestParams[param] = setupResponse[param];
            } else {
                Log.error(`The param ${param} is not included`);
            }
        }

    }

    return requestParams;

}

export { validationTest }

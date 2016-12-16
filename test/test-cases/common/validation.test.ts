'use strict';

import * as test from 'tape';

import { Injector } from '../../src/lib/injector';
import { APIRequestManager } from '../../src/lib/request-manager';
import { ConfigLoader } from '../../src/lib/config-loader';
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
 * @param validationParams - The api request body parameters with their respective options.
 * @param uriParams - An object that has the parameters we want to send in the route uri with their respective options.
 * @returns an array of test cases functions.
 */
function validationTest(route: string, verb: string, setup: Function, validationParams: {}, uriParams?: {}) {

    let tests = [];

    // loop trough request body params
    for (let property in validationParams) {

        if (validationParams.hasOwnProperty(property)) {
            let cases = [];
            if (validationParams[property].type) {
                cases = configLoader.get(`common-validation/${validationParams[property].type}`);
                cases = JSON.parse(JSON.stringify(cases));
            }
            if (validationParams[property].extraCases && validationParams[property].extraCases.length > 0) {
                cases = cases.concat(validationParams[property].extraCases);
            }

            // create a function that has all the api calls for invalid cases we provide
            let testFunction = async (t: test.Test) => {
                let setupRes = await setup();
                let validRequestParams = parseRequestParams(validationParams, setupRes);
                let validUriParams = parseRequestParams(uriParams, setupRes);
                let routeParam = route;
                for (let validParam in validUriParams) {
                    if (validUriParams.hasOwnProperty(validParam)) {
                        routeParam += `/${validUriParams[validParam]}`;
                    }
                }
                t.plan(cases.length);
                // loop through cases
                for (let i = 0; i < cases.length; i++) {
                    let input = cases[i].input;
                    validRequestParams[property] = input;
                    let res = await apiRequest[verb.toLowerCase()](routeParam, validRequestParams, setupRes.user);
                    t.equal(res.status, cases[i].expect || 400);
                    // clear table and run setup if the api call succeed for any reason to start with fresh data for the next test
                    if (res.status === 200) {
                        await dataSetup.clearTables();
                        setupRes = await setup();
                        validRequestParams = parseRequestParams(validationParams, setupRes);
                    }

                }
                // to test missing param
            };

            tests.push((assert: test.Test) => { return testFunction(assert); });

        }

    }

    // loop trough uriParams 
    for (let param in uriParams) {

        if (uriParams.hasOwnProperty(param)) {

            let cases = configLoader.get(`common-validation/${uriParams[param].type}`);
            cases = JSON.parse(JSON.stringify(cases));

            if (uriParams[param].extraCases && uriParams[param].extraCases.length > 0) {
                cases = cases.concat(uriParams[param].extraCases);
            }

            // create a function that has all the api calls for invalid cases we provide
            let testFunction = async (t: test.Test) => {
                let setupRes = await setup();
                let validRequestParams = parseRequestParams(validationParams, setupRes);
                let validUriParams = parseRequestParams(uriParams, setupRes);
                let routeParam = route;
                t.plan(cases.length);
                // loop through cases
                for (let i = 0; i < cases.length; i++) {
                    // Check if the invalid param is an array we do this work around 
                    // because array concatination with array removes the square brackets      
                    if (Object.prototype.toString.call(cases[i].input) === '[object Array]') {
                        validUriParams[param] = '[' + cases[i].input + ']';
                        // Check if the invalid param is an empty string we do this work around 
                        // because  concatination with empty string removes the qutations
                    } else if (!cases[i].input) {
                        validUriParams[param] = '""';
                    } else {
                        let input = cases[i].input;
                        validUriParams[param] = typeof input === 'object' ? JSON.stringify(input) : input.toString();
                    }

                    routeParam = route;
                    for (let validParam in validUriParams) {

                        if (validUriParams.hasOwnProperty(validParam)) {
                            routeParam += `/${validUriParams[validParam]}`;
                        }
                    }
                    let res = await apiRequest[verb.toLowerCase()](routeParam, validRequestParams, setupRes.user);
                    t.equal(res.status, cases[i].expect || 404);
                    // clear table and run setup if the api call succeed for any reason to start with fresh data for the next test
                    if (res.status === 200) {
                        await dataSetup.clearTables();
                        setupRes = await setup();
                        validUriParams = parseRequestParams(uriParams, setupRes);
                    }

                }
                // to test missing param
            };

            tests.push((assert: test.Test) => { return testFunction(assert); });

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

'use strict';

import * as test from 'tape';

import { Injector } from '../../src/lib/injector';
import { APIRequestManager } from '../../src/lib/request-manager';
import { ConfigLoader    } from '../../src/lib/config-loader';

const configLoader = Injector.request<ConfigLoader>('ConfigLoader');
const apiRequest = Injector.request<APIRequestManager>('APIRequestManager');

/**
 * exports common validation tests.
 * @param route - The route that we are calling.
 * @param verb - The verb that we are using for the api.
 * @param setup - The setup function that populate required tables.
 * @param validationParams - The api request parameters.
 */
function validationTest(route: string, verb: string, setup: Function, validationParams: {}) {

    let tests = [];
    // loop trough params
    for (let property in validationParams) {
        let requestParams = parseRequestParams(validationParams);
        if (validationParams.hasOwnProperty(property)) {
            let cases = configLoader.get(`common-validation/${validationParams[property].type}`);
            if (validationParams[property].extraParams && validationParams[property].extraParams.length > 0) {
                validationParams[property].extraParams.forEach((param) => {
                    cases.push(param);
                });
            }

            let func = async function (t: test.Test) {
                let setupRes = await setup();
                t.plan(cases.length);
                // loop through configs
                for (let i = 0; i < cases.length; i++) {
                    requestParams[property] = cases[i].input;
                    let res = await apiRequest[verb.toLowerCase()](route, requestParams, setupRes.buyer.user.userID);
                    t.equal(res.status, cases[i].expect);
                }

            };

            tests.push(
                (assert: test.Test) => {
                    return func(assert);
                }
            );

        }
    }
    return tests;
}

/**
 * Returns a valid request parameters based on the valid params in the validationParams.
 * @param validationParams - The api request parameters.
 */
function parseRequestParams(validationParams: any) {
    let requestParams = {};
    for (let param in validationParams) {
        if (validationParams.hasOwnProperty(param)) {
            requestParams[param] = validationParams[param].validParam;
        }
    }
    return requestParams;

}

export { validationTest }

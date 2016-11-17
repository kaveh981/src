'use strict';

import * as test from 'tape';

import { Injector } from '../../src/lib/injector';
import { APIRequestManager } from '../../src/lib/request-manager';
import { DatabasePopulator } from '../../src/lib/database-populator';

const databasePopulator = Injector.request<DatabasePopulator>('DatabasePopulator');
const apiRequest = Injector.request<APIRequestManager>('APIRequestManager');

/*
 * @case    - Limit is non-int
 * @expect  - 400 - TYPE_INT_INVALID
 * @status  - passing
 * @tags    - get, pagination, buyer
 */
async function ATW_PAG_01 (route: string, verb: string, setup: Function, createEntity: Function, assert: test.Test) {

    /** Setup */
    assert.plan(4);

    let setupData = await setup();

    await createEntity(setupData);

    /** Test */
    let cases = [`'10'`, {10: true}, [10], true];

    for (let limit of cases) {
        let response = await apiRequest[verb](route, {'limit': limit}, setupData.buyer.user.userID);

        assert.equal(response.status, 400);
    }

}

/*
 * @case    - limit is less than 1
 * @expect  - 400 - TYPE_NUMB_TOO_SMALL
 * @status  - passing
 * @tags    - get, pagination, buyer
 */
async function ATW_PAG_02 (route: string, verb: string, setup: Function, createEntity: Function, assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let setupData = await setup();

    await createEntity(setupData);

    /** Test */
    let response = await apiRequest[verb](route, {'limit': 0}, setupData.buyer.user.userID);

    assert.equal(response.status, 400);

}

/*
 * @case    - limit is within the permitted values
 * @expect  - 200 - the correct proposals are fetched, limit returned in the response is correct
 * @status  - failing ("expected" date incorrect, limit type from response is incorrect - should be int instead of string)
 * @tags    - get, pagination, buyer
 */
async function ATW_PAG_03 (route: string, verb: string, setup: Function, createEntity: Function, assert: test.Test) {

    /** Setup */
    assert.plan(10);

    let setupData = await setup();

    let entity1Payload = await createEntity(setupData);
    let entity2Payload = await createEntity(setupData);

    /** Test */
    let cases = [
        {input: 1, expect: {limit: 1, data: [entity1Payload]}},
        {input: 2, expect: {limit: 2, data: [entity1Payload, entity2Payload]}},
        {input: 249, expect: {limit: 249, data: [entity1Payload, entity2Payload]}},
        {input: 250, expect: {limit: 250, data: [entity1Payload, entity2Payload]}},
        {input: 251, expect: {limit: 250, data: [entity1Payload, entity2Payload]}}
    ];

    for (let caseObject of cases) {
        let response = await apiRequest[verb](route, {'limit': caseObject.input}, setupData.buyer.user.userID);

        assert.equal(response.status, 200);
        assert.deepEqual(response.body.data, caseObject.expect.data);
        // assert.deepEqual(response.body.pagination, {limit: caseObject.expect.limit, page: 1});
    }

}

/*
 * @case    - page is non-int
 * @expect  - 400 - TYPE_INT_INVALID
 * @status  - passing
 * @tags    - get, pagination, buyer
 */
async function ATW_PAG_04 (route: string, verb: string, setup: Function, createEntity: Function, assert: test.Test) {

    /** Setup */
    assert.plan(4);

    let setupData = await setup();

    await createEntity(setupData);

    /** Test */
    let cases = [`'10'`, {10: true}, [10], true];

    for (let page of cases) {
        let response = await apiRequest[verb](route, {'page': page}, setupData.buyer.user.userID);

        assert.equal(response.status, 400);
    }

}

/*
 * @case    - page is less than 1
 * @expect  - 400 - TYPE_NUMB_TOO_SMALL
 * @status  - passing
 * @tags    - get, pagination, buyer
 */
async function ATW_PAG_05 (route: string, verb: string, setup: Function, createEntity: Function, assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let setupData = await setup();

    await createEntity(setupData);

    let cases = [-1, 0];

    /** Test */
    for (let page of cases) {
        let response = await apiRequest[verb](route, {'page': page}, setupData.buyer.user.userID);

        assert.equal(response.status, 400);
    }

}

/*
 * @case    - page is within the permitted values
 * @expect  - 200 - the correct proposal is fetched, page returned in the response is correct
 * @status  - 
 * @tags    - get, pagination, buyer
 */
async function ATW_PAG_06 (route: string, verb: string, setup: Function, createEntity: Function, assert: test.Test) {

    /** Setup */
    assert.plan(4);

    let setupData = await setup();

    let entity1Payload = await createEntity(setupData);
    let entity2Payload = await createEntity(setupData);

    /** Test */
    let cases = [
        {input: 1, expect: {page: 1, data: [entity1Payload]}},
        {input: 2, expect: {page: 2, data: [entity2Payload]}}
    ];

    for (let caseObject of cases) {
        let response = await apiRequest[verb](route, {'page': caseObject.input, 'limit': 1}, setupData.buyer.user.userID);

        assert.equal(response.status, 200);
        assert.deepEqual(response.body.data, caseObject.expect.data);
        // assert.deepEqual(response.body.pagination, {limit: 1, page: caseObject.expect.page});
    }

}

/**
 * Reusable tests for pagination authentication
 */
function paginationTest(route: string, verb: string, setup: Function, createEntity: Function) {
    return [
        (assert: test.Test) => { return ATW_PAG_01(route, verb, setup, createEntity, assert); },
        (assert: test.Test) => { return ATW_PAG_02(route, verb, setup, createEntity, assert); },
        (assert: test.Test) => { return ATW_PAG_03(route, verb, setup, createEntity, assert); },
        (assert: test.Test) => { return ATW_PAG_04(route, verb, setup, createEntity, assert); },
        (assert: test.Test) => { return ATW_PAG_05(route, verb, setup, createEntity, assert); },
        (assert: test.Test) => { return ATW_PAG_06(route, verb, setup, createEntity, assert); }
    ];
}

export { paginationTest }

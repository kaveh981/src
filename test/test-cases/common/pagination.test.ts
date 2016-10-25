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

    await setup();

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);

    await createEntity();

    /** Test */
    let cases = [`'10'`, {10: true}, [10], true];

    for (let limit of cases) {
        let response = await apiRequest[verb](route, {'limit': limit}, buyer.user.userID);

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

    await setup();

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);

    await createEntity();

    /** Test */
    let response = await apiRequest[verb](route, {'limit': 0}, buyer.user.userID);

    assert.equal(response.status, 400);

}

/*
 * @case    - limit is within the permitted values
 * @expect  - 200 - the correct proposals is fetched, limit returned in the response is correct
 * @status  - failing ("expected" date incorrect, limit type from response is incorrect - should be int instead of string)
 * @tags    - get, pagination, buyer
 */
async function ATW_PAG_03 (route: string, verb: string, setup: Function, createEntity: Function, assert: test.Test) {

    /** Setup */
    assert.plan(15);

    await setup();

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);

    let publisher = await databasePopulator.createPublisher();
    let entity1Payload = await createEntity(publisher);
    let entity2Payload = await createEntity(publisher);

    /** Test */
    let response = await apiRequest[verb](route, {'limit': 1}, buyer.user.userID);

    assert.equal(response.status, 200);
    assert.equal(response.body.data, [entity1Payload]);
    assert.equal(response.body.pagination.limit, 1);

    let cases = [
        {input: 2, expect: {limit: 2, data: [entity1Payload, entity2Payload]}},
        {input: 249, expect: {limit: 249, data: [entity1Payload, entity2Payload]}},
        {input: 250, expect: {limit: 250, data: [entity1Payload, entity2Payload]}},
        {input: 251, expect: {limit: 250, data: [entity1Payload, entity2Payload]}}
    ];

    for (let caseObject of cases) {
        response = await apiRequest[verb](route, {'limit': caseObject.input}, buyer.user.userID);

        assert.equal(response.status, 200);
        assert.equal(response.body.data, caseObject.expect.data);
        assert.equal(response.body.pagination.limit, caseObject.expect.limit);
    }

}

/*
 * @case    - offset is non-int
 * @expect  - 400 - TYPE_INT_INVALID
 * @status  - passing
 * @tags    - get, pagination, buyer
 */
async function ATW_PAG_04 (route: string, verb: string, setup: Function, createEntity: Function, assert: test.Test) {

    /** Setup */
    assert.plan(4);

    await setup();

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);

    await createEntity();

    /** Test */
    let cases = [`'10'`, {10: true}, [10], true];

    for (let offset of cases) {
        let response = await apiRequest[verb](route, {'offset': offset}, buyer.user.userID);

        assert.equal(response.status, 400);
    }

}

/*
 * @case    - offset is less than 0
 * @expect  - 400 - TYPE_NUMB_TOO_SMALL
 * @status  - passing
 * @tags    - get, pagination, buyer
 */
async function ATW_PAG_05 (route: string, verb: string, setup: Function, createEntity: Function, assert: test.Test) {

    /** Setup */
    assert.plan(1);

    await setup();

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);

    await createEntity();

    /** Test */
    let response = await apiRequest[verb](route, {'offset': -1}, buyer.user.userID);

    assert.equal(response.status, 400);

}

/*
 * @case    - offset is within the permitted values
 * @expect  - 200 - the correct proposal is fetched, offset returned in the response is correct
 * @status  - failing ("expected" date incorrect, offset type from response is incorrect - should be int instead of string)
 * @tags    - get, pagination, buyer
 */
async function ATW_PAG_06 (route: string, verb: string, setup: Function, createEntity: Function, assert: test.Test) {

    /** Setup */
    assert.plan(6);

    await setup();

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);

    let publisher = await databasePopulator.createPublisher();
    let entity1Payload = await createEntity(publisher);
    let entity2Payload = await createEntity(publisher);

    /** Test */
    let cases = [
        {input: 0, expect: {offset: 0, data: [entity1Payload]}},
        {input: 1, expect: {offset: 1, data: [entity2Payload]}}
    ];

    for (let caseObject of cases) {
        let response = await apiRequest[verb](route, {'offset': caseObject.input, 'limit': 1}, buyer.user.userID);

        assert.equal(response.status, 200);
        assert.equal(response.body.data, caseObject.expect.data);
        assert.equal(response.body.pagination.offset, caseObject.expect.offset);
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

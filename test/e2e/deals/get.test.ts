'use strict';

import * as test from 'tape';
import * as express from 'express';
import * as Promise from 'bluebird';

import { app } from '../../helper/bootstrap';
import { Injector } from '../../lib/injector';
import { Test } from "tape";

import { ApiHelper } from '../../helper/api-helper';
const apiHelper = Injector.request<ApiHelper>("ApiHelper");

import { DataSetup } from '../../helper/data-setup';
const dataSetup = Injector.request<DataSetup>("DataSetup");

import { DatabasePopulator } from '../../helper/database-populator';
const databasePopulator = Injector.request<DatabasePopulator>('DatabasePopulator');

import { DatabaseManager   } from '../../lib/database-manager';
const dbm = Injector.request<DatabaseManager>('DatabaseManager');

apiHelper.setOptions({
    hostname: 'localhost',
    port: 8000,
    method: 'GET',
    uri: '/deals',
    headers: {
        'content-type': 'application/json'
    }
});

test("When every thing supplied correctly", (t: Test) => {
    const tables: string[] = ['ixmPackageSectionMappings', 'ixmPackages', 'rtbSiteSections', 'rtbSections', 'sites', 'publishers', 'users'];
    let ixmPackage: any;
    t.test('setup', (assert: test.Test) => {
        Promise.coroutine(function* (): any {
            yield app.boot();
            for (let i = 0; i < tables.length; i += 1) {
                let table = tables[i];
                yield dataSetup.backupTable(table);
                yield dataSetup.clearTable(table);
            }
            let newPub = yield databasePopulator.newPub();
            let newSite = yield databasePopulator.newSite(newPub.user.userID);
            let newSection = yield databasePopulator.newSection(newPub.user.userID, [newSite.siteID]);
            ixmPackage = yield databasePopulator.newPackage(newPub.user.userID, [newSection.sectionID]);
            assert.end();
        })().catch((e) => {
            assert.end();
            throw e;
        });
    });

    t.test('esting response code', (assert: Test) => {
        apiHelper.sendRequest({'limit': 20})
            .then((res: any) => {
                assert.equal(res.httpStatusCode, 200, "It should return status code 200");
                assert.end();
            });
    });

    t.test('teardown', (assert: test.Test) => {
        Promise.coroutine(function* (): any {
            for (let i = 0; i < tables.length; i += 1) {
                let table = tables[i];
                yield dataSetup.restoreTable(table);
            }
            app.shutdown();
            assert.end();

        })().catch((e) => {
            assert.end();
            throw e;
        });
    });
});

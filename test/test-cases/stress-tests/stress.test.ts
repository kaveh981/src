'use strict';

import * as test from 'tape';
import * as path from 'path';
import { DatabasePopulator } from '../../src/lib/database-populator';
import { Helper } from '../../src/lib/helper';
import { DatabaseManager } from '../../src/lib/database-manager';
import { Injector } from '../../src/lib/injector';
import { Logger } from '../../src/lib/logger';

const databasePopulator = Injector.request<DatabasePopulator>('DatabasePopulator');
const databaseManager = Injector.request<DatabaseManager>('DatabaseManager');
const spawn = require('child_process').spawn;
const csvFile = path.join(__dirname, "./users_and_proposals.csv");
let SimpleCSV = require('simple-csv');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const Log: Logger = new Logger('ROUT');

/*
 * @case    - 10 F(lows)PS, 2 mins, 1200 pub, 1200 buyers, 1200 proposals
 * @expect  -  
 * @route   - 
 * @status  - 
 * @tags    - 
 */
export async function ATW_STRESS_TEST_01 () {

    let artilleryData = [];
    let dsp = await databasePopulator.createDSP(1);

    for (let i = 0; i < 1200; i++) {

        let buyer = await databasePopulator.createBuyer(dsp.dspID);
        let publisher = await databasePopulator.createPublisher();
        let site = await databasePopulator.createSite(publisher.publisher.userID);
        let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
        let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);

        artilleryData.push([proposal.proposal.proposalID, buyer.user.userID, publisher.user.userID]);
    }

    let csv = new SimpleCSV();

    await csv.append(artilleryData);
    await csv.write(csvFile);

    Log.info('Finished generating users_and_proposals.csv');

    await new Promise((resolve, reject) => {

        let child = spawn('artillery', ['run', path.join(__dirname, "./10_FPS.json")]);

        child.stdout.on('data', (data) => {
            Log.info(`${data}`.trim());
        });

        child.stderr.on('data', (data) => {
            Log.debug(data.toString());
        });

        child.on('close', (code) => {
            resolve();
        });

    });

}

/*
 * @case    - 100 FPS, 2 mins, 12,000 pub, 12,000 buyers, 12,000 proposals
 * @expect  -  
 * @route   - 
 * @status  - 
 * @tags    - 
 */
export async function ATW_STRESS_TEST_02 () {

    let artilleryData = [];
    let dsp = await databasePopulator.createDSP(1);

    for (let i = 0; i < 12000; i++) {
        let buyer = await databasePopulator.createBuyer(dsp.dspID);
        let publisher = await databasePopulator.createPublisher();
        let site = await databasePopulator.createSite(publisher.publisher.userID);
        let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
        let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);

        artilleryData.push([proposal.proposal.proposalID, buyer.user.userID, publisher.user.userID]);
    }

    let csv = new SimpleCSV();

    await csv.append(artilleryData);
    await csv.write(csvFile);

    Log.info('Finished generating users_and_proposals.csv');

    await new Promise((resolve, reject) => {

        let child = spawn('artillery', ['run', path.join(__dirname, "./100_FPS.json")]);

        child.stdout.on('data', (data) => {
            Log.info(`${data}`.trim());
        });

        child.stderr.on('data', (data) => {
            Log.debug(data.toString());
        });

        child.on('close', (code) => {
            resolve();
        });

    });

}

/*
 * @case    - 1000 FPS, 2 mins, 120,000 pub, 120,000 buyers, 120,000 proposals
 * @expect  -  
 * @route   - 
 * @status  - 
 * @tags    - 
 */
export async function ATW_STRESS_TEST_03 () {

    let artilleryData = [];
    let dsp = await databasePopulator.createDSP(1);

    for (let i = 0; i < 120000; i++) {
        let buyer = await databasePopulator.createBuyer(dsp.dspID);
        let publisher = await databasePopulator.createPublisher();
        let site = await databasePopulator.createSite(publisher.publisher.userID);
        let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
        let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);

        artilleryData.push([proposal.proposal.proposalID, buyer.user.userID, publisher.user.userID]);
    }

    let csv = new SimpleCSV();

    await csv.append(artilleryData);
    await csv.write(csvFile);

    Log.info('Finished generating users_and_proposals.csv');

    await new Promise((resolve, reject) => {

        let child = spawn('artillery', ['run', path.join(__dirname, "./1000_FPS.json")]);

        child.stdout.on('data', (data) => {
            Log.info(`${data}`.trim());
        });

        child.stderr.on('data', (data) => {
            Log.debug(data.toString());
        });

        child.on('close', (code) => {
            resolve();
        });

    });

}

/*
 * @case    - 10 FPS, 20 mins, 1,200 pub, 1,200 buyers, 12,000 proposals (10 proposals per publisher)
 * @expect  -  
 * @route   - 
 * @status  - 
 * @tags    - 
 */
export async function ATW_STRESS_TEST_04 () {

    let artilleryData = [];
    let dsp = await databasePopulator.createDSP(1);

    for (let i = 0; i < 1200; i++) {
        let buyer = await databasePopulator.createBuyer(dsp.dspID);
        let publisher = await databasePopulator.createPublisher();
        let site = await databasePopulator.createSite(publisher.publisher.userID);

        for (let j = 0; j < 10; j++) {
            let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
            let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);

            artilleryData.push([proposal.proposal.proposalID, buyer.user.userID, publisher.user.userID]);
        }
    }

    let csv = new SimpleCSV();

    await csv.append(artilleryData);
    await csv.write(csvFile);

    Log.info('Finished generating users_and_proposals.csv');

    await new Promise((resolve, reject) => {

        let child = spawn('artillery', ['run', path.join(__dirname, "./10_FPS_20m.json")]);

        child.stdout.on('data', (data) => {
            Log.info(`${data}`.trim());
        });

        child.stderr.on('data', (data) => {
            Log.debug(data.toString());
        });

        child.on('close', (code) => {
            resolve();
        });

    });

}

/*
 * @case    - 10 FPS, 200 mins, 1,200 pub, 1,200 buyers, 120,000 proposals (100 proposals per publisher)
 * @expect  -  
 * @route   - 
 * @status  - 
 * @tags    - 
 */
export async function ATW_STRESS_TEST_05 () {

    let artilleryData = [];
    let dsp = await databasePopulator.createDSP(1);

    for (let i = 0; i < 1200; i++) {
        let buyer = await databasePopulator.createBuyer(dsp.dspID);
        let publisher = await databasePopulator.createPublisher();
        let site = await databasePopulator.createSite(publisher.publisher.userID);

        for (let j = 0; j < 100; j++) {
            let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
            let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);

            artilleryData.push([proposal.proposal.proposalID, buyer.user.userID, publisher.user.userID]);
        }
    }

    let csv = new SimpleCSV();

    await csv.append(artilleryData);
    await csv.write(csvFile);

    Log.info('Finished generating users_and_proposals.csv');

    await new Promise((resolve, reject) => {

        let child = spawn('artillery', ['run', path.join(__dirname, "./10_FPS_200m.json")]);

        child.stdout.on('data', (data) => {
            Log.info(`${data}`.trim());
        });

        child.stderr.on('data', (data) => {
            Log.debug(data.toString());
        });

        child.on('close', (code) => {
            resolve();
        });

    });

}

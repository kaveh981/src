'use strict';

import * as test from 'tape';
import * as path from 'path';
import { DatabasePopulator } from '../../../src/lib/database-populator';
import { Helper } from '../../../src/lib/helper';
import { DatabaseManager } from '../../../src/lib/database-manager';
import { Injector } from '../../../src/lib/injector';

const databasePopulator = Injector.request<DatabasePopulator>('DatabasePopulator');
const databaseManager = Injector.request<DatabaseManager>('DatabaseManager');
const spawn = require('child_process').spawn;
const csvFile = path.join(__dirname, "./users_and_proposals.csv");
const statsFile = path.join(__dirname, "./docker-stats.txt");
const statsTimeout = 300;

let debug = require('debug')('ssc:example');
let SimpleCSV = require('simple-csv');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

/*
 * @case    - 10 RPS, 2 mins, 170 pub, 170 buyers, 170 proposals
 * @expect  -  
 * @route   - 
 * @status  - 
 * @tags    - 
 */
export async function ATW_STRESS_TEST_01 () {

    let artilleryData = []; // initialize empty array

    for (let i = 0; i < 170; i++) {

        let dsp = await databasePopulator.createDSP(i + 1);
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
    console.log('Complete, ... generated users_and_proposals.csv');

    await new Promise((resolve, reject) => {

        let child = spawn(`artillery`, [`run`, path.join(__dirname, "./10_RPS.json")]);

        child.stdout.on('data', (data) => {
            console.log(`${data}`.trim());
        });

        child.stderr.on('data', (data) => {
            console.error(data.toString());
        });

        child.on('close', (code) => {
            resolve();
        });

    });

}

/*
 * @case    - 100 RPS, 2 mins, 1700 pub, 1700 buyers, 1700 proposals
 * @expect  -  
 * @route   - 
 * @status  - 
 * @tags    - 
 */
export async function ATW_STRESS_TEST_02 () {

    let artilleryData = []; // initialize empty array

    for (let i = 0; i < 1700; i++) {

        let dsp = await databasePopulator.createDSP(i + 1);
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
    console.log('Complete, ... generated users_and_proposals.csv');

    await new Promise((resolve, reject) => {

        let child = spawn(`artillery`, [`run`, path.join(__dirname, "./100_RPS.json")]);

        child.stdout.on('data', (data) => {
            console.log(`${data}`.trim());
        });

        child.stderr.on('data', (data) => {
            console.error(data.toString());
        });

        child.on('close', (code) => {
            resolve();
        });

    });

}

/*
 * @case    - 1000 RPS, 2 mins, 17000 pub, 17000 buyers, 17000 proposals
 * @expect  -  
 * @route   - 
 * @status  - 
 * @tags    - 
 */
export async function ATW_STRESS_TEST_03 () {

    let artilleryData = []; // initialize empty array

    for (let i = 0; i < 17000; i++) {

        let dsp = await databasePopulator.createDSP(i + 1);
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
    console.log('Complete, ... generated users_and_proposals.csv');

    await new Promise((resolve, reject) => {

        let child = spawn(`artillery`, [`run`, path.join(__dirname, "./1000_RPS.json")]);

        child.stdout.on('data', (data) => {
            console.log(`${data}`.trim());
        });

        child.stderr.on('data', (data) => {
            console.error(data.toString());
        });

        child.on('close', (code) => {
            resolve();
        });

    });

}

/*
 * @case    - 10 RPS, 2 mins, 170 pub, 170 buyers, 1700 proposals (10 proposals per publisher)
 * @expect  -  
 * @route   - 
 * @status  - 
 * @tags    - 
 */
export async function ATW_STRESS_TEST_04 () {

    let artilleryData = []; // initialize empty array

    for (let i = 0; i < 1700; i++) {

        let dsp = await databasePopulator.createDSP(i + 1);
        let buyer = await databasePopulator.createBuyer(dsp.dspID);
        let publisher = await databasePopulator.createPublisher();
        let site = await databasePopulator.createSite(publisher.publisher.userID);

        for (let j = 0; j < 10; j++){

            let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
            let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);
            artilleryData.push([proposal.proposal.proposalID, buyer.user.userID, publisher.user.userID]);
        }
    }

    let csv = new SimpleCSV();

    await csv.append(artilleryData);
    await csv.write(csvFile);
    console.log('Complete, ... generated users_and_proposals.csv');

    await new Promise((resolve, reject) => {

        let child = spawn(`artillery`, [`run`, path.join(__dirname, "./10_RPS.json")]);

        child.stdout.on('data', (data) => {
            console.log(`${data}`.trim());
        });

        child.stderr.on('data', (data) => {
            console.error(data.toString());
        });

        child.on('close', (code) => {
            resolve();
        });

    });

}

/*
 * @case    - 10 RPS, 2 mins, 170 pub, 170 buyers, 17000 proposals (100 proposals per publisher)
 * @expect  -  
 * @route   - 
 * @status  - 
 * @tags    - 
 */
export async function ATW_STRESS_TEST_05 () {

    let artilleryData = []; // initialize empty array

    for (let i = 0; i < 1700; i++) {

        let dsp = await databasePopulator.createDSP(i + 1);
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
    console.log('Complete, ... generated users_and_proposals.csv');

    await new Promise((resolve, reject) => {

        let child = spawn(`artillery`, [`run`, path.join(__dirname, "./10_RPS.json")]);

        child.stdout.on('data', (data) => {
            console.log(`${data}`.trim());
        });

        child.stderr.on('data', (data) => {
            console.error(data.toString());
        });

        child.on('close', (code) => {
            resolve();
        });

    });

}

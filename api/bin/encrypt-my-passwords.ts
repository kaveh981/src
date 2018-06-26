/* tslint:disable */
'use strict';

import { DatabaseManager } from '../src/lib/database-manager';
import { ConfigLoader } from '../src/lib/config-loader';
import { Injector } from '../src/lib/injector';

import * as crypto from 'crypto';
import * as path from 'path';
import * as fs from 'fs';
import * as inquirer from 'inquirer';

let config = new ConfigLoader('../../');
Injector.put(config, 'ConfigLoader');

let databaseManager = new DatabaseManager(config);

async function start() { try {

    await config.initialize();
    await databaseManager.initialize();

    let answer = await inquirer.prompt([{
        type: 'confirm',
        name: 'confirm',
        message: `This will hash and salt all of your users' passwords, this is irreversible. Are you sure you want to continue?`
    }]);

    if (!answer['confirm']) {
        console.log('Aborting...');
        await databaseManager.shutdown();
        return;
    }

    let rows = await databaseManager.select('userID', 'password').from('users');
    let date = new Date().getTime();

    console.log(`Writing passwords to old-passwords-${date}.log...`);

    fs.writeFileSync(path.join(__dirname, `./old-passwords-${date}.log`), JSON.stringify(rows.map((row) => {
        return {
            userID: row.userID,
            password: row.password
        };
    })));

    await Promise.all(rows.map(async (row) => {

        let hashedPassword = await new Promise((resolve, reject) => {
            crypto.randomBytes(9, (err, salt) => {
                let saltString = salt.toString('base64');
                let hash = crypto.pbkdf2Sync(row.password, saltString, 35000, 48, 'sha1');
                let saltPassword = hash.toString('base64') + saltString;
                resolve(saltPassword);
            });
        });

        console.log(`Updating user ${row.userID}...`);

        await databaseManager.update({
            password: hashedPassword
        }).from('users').where('userID', row.userID);

    }));

    console.log('Done.');

    await databaseManager.shutdown();

} catch (err) { process.exit(1); }}

start();

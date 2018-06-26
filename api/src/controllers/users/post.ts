'use strict';

import * as express from 'express';
import * as request from 'request-promise-native';

import { Logger } from '../../lib/logger';
import { Injector } from '../../lib/injector';
import { MarketUserManager } from '../../models/market-user/market-user-manager';
import { UserManager } from '../../models/user/user-manager';
import { UserModel } from '../../models/user/user-model';
import { RamlTypeValidator } from '../../lib/raml-type-validator';
import { HTTPError } from '../../lib/http-error';
import { Permission } from '../../middleware/permission';
import { DatabaseManager } from '../../lib/database-manager';
import { ConfigLoader } from '../../lib/config-loader';

const marketUserManager = Injector.request<MarketUserManager>('MarketUserManager');
const validator = Injector.request<RamlTypeValidator>('Validator');
const userManager = Injector.request<UserManager>('UserManager');
const databaseManager = Injector.request<DatabaseManager>('DatabaseManager');
const configLoader = Injector.request<ConfigLoader>('ConfigLoader');

const Log: Logger = new Logger('ROUT');

function Users(router: express.Router): void {

    router.post('/', Permission('internal'), async (req: express.Request, res: express.Response, next: Function) => { try {

        /** Validation */
        let validationErrors = validator.validateType(req.body, 'UserCreate', { removeNull: true });

        if (validationErrors.length > 0) {
            throw HTTPError('400', validationErrors);
        }

        /** Route logic */
        let email = req.body['email'];
        let companyEmail = req.body['company_email'];
        let requestedUser = await userManager.fetchUserFromEmail(email);
        let requestedCompany = await userManager.fetchUserFromEmail(companyEmail);

        if (!requestedCompany || !requestedCompany.isActive()) {
            throw HTTPError('404_COMPANY_NOT_FOUND');
        } else if (!requestedCompany.isCompany()) {
            throw HTTPError('403_USER_NOT_COMPANY');
        } else if (requestedUser) {
            throw HTTPError('403_EMAIL_IN_USE');
        }

        Log.debug(`Creating a new user for company ${requestedCompany.id}.`, req.id);

        await databaseManager.transaction(async (transaction) => {

            let newUser = new UserModel({
                userType: IXM_CONSTANTS.IXM_USER_TYPE,
                status: 'active',
                firstName: req.body['first_name'],
                lastName: req.body['last_name'],
                emailAddress: req.body['email'],
                phone: req.body['phone'],
                country: requestedCompany.country,
                zipCode: requestedCompany.zipCode,
                companyName: requestedCompany.companyName,
                address: requestedCompany.address,
                city: requestedCompany.city,
                state: requestedCompany.state
            });

            await userManager.insertUser(newUser, transaction);

            Log.trace(`Inserted new user ${newUser.id}.`, req.id);

            await marketUserManager.createUserCompanyMapping(newUser.id, requestedCompany.id, req.body['permissions'], transaction);

            Log.trace(`Mapped user ${newUser.id} to user ${requestedCompany.id}.`, req.id);

            res.location('/users/' + newUser.id);
            res.sendMessage('201', newUser.toPayload());

        });

        Log.debug(`Sending forgotten password PUT request to SH Auth for ${email}...`, req.id);

        // Sending forgotten password to SH Auth to create a new password.
        let options = {
            url: `https://auth.indexexchange.com/auth/password/forgotten`,
            headers: {
                Authorization: `Bearer ${req.headers[configLoader.get('auth')['tokenHeader']]}`
            },
            json: true,
            body: {
                emailAddress: email
            },
            rejectUnauthorized: false
        };

        let response = await request.put(options);

        Log.trace(Log.stringify(response), req.id);

    } catch (error) { next(error); } });

};

module.exports = Users;

'use strict';

import * as express from 'express';

import { Injector } from '../../lib/injector';
import { MarketUserManager } from '../../models/market-user/market-user-manager';
import { UserManager } from '../../models/user/user-manager';
import { RamlTypeValidator } from '../../lib/raml-type-validator';
import { HTTPError } from '../../lib/http-error';
import { Permission } from '../../middleware/permission';
import { Logger } from '../../lib/logger';

const marketUserManager = Injector.request<MarketUserManager>('MarketUserManager');
const validator = Injector.request<RamlTypeValidator>('Validator');
const userManager = Injector.request<UserManager>('UserManager');

const Log: Logger = new Logger('ROUT');

function Users(router: express.Router): void {

    router.put('/', Permission('internal'), async (req: express.Request, res: express.Response, next: Function) => { try {

        /** Validation */
        let validationErrors = validator.validateType(req.body, 'UserUpdate', { removeNull: true });

        if (validationErrors.length > 0) {
            throw HTTPError('400', validationErrors);
        }

        /** Route logic */
        let email = req.body['email'];
        let whitelist = req.body['whitelist'];
        let companyEmail = req.body['company_email'];
        let permissions = req.body['permissions'];

        let requestedUser = await userManager.fetchUserFromEmail(email);
        let requestedMarketUser = await marketUserManager.fetchMarketUserFromEmail(email);
        let companyUser = companyEmail ? await userManager.fetchUserFromEmail(companyEmail) : null;

        if (!requestedUser || !requestedUser.isActive()) {
            throw HTTPError('404_USER_NOT_FOUND');
        } else if (companyEmail && (!companyUser || !companyUser.isActive())) {
            throw HTTPError('404_COMPANY_NOT_FOUND');
        } else if (typeof whitelist === 'boolean' && permissions) {
            throw HTTPError('400_PERMISSION_OR_WHITELIST');
        }

        if (typeof whitelist === 'boolean' && !whitelist) {

            Log.trace(`Deleting market user ${email}...`);

            if (!requestedMarketUser) {
                throw HTTPError('403_NOT_MARKET_USER');
            }

            await marketUserManager.deleteMarketUser(requestedMarketUser);

        } else if (whitelist) {

            Log.trace(`Whitelisting market user company ${email}...`);

            if (requestedMarketUser) {
                throw HTTPError('403_ALREADY_MARKET_USER');
            } else if (!requestedUser.isCompany()) {
                throw HTTPError('403_USER_NOT_COMPANY');
            }

            await marketUserManager.addCompanyToWhitelist(requestedUser.id);

        } else if (permissions) {

            Log.trace(`Updating market user ${email}...`);

            if (requestedUser.isCompany()) {
                throw HTTPError('403_USER_BAD_UPDATE');
            } else if (!requestedMarketUser) {
                throw HTTPError('403_NOT_MARKET_USER');
            }

            requestedMarketUser.readOnly = permissions === 'read';
            await marketUserManager.updateMarketUser(requestedMarketUser);

        } else {
            throw HTTPError('400_PERMISSION_OR_WHITELIST');
        }

        res.sendPayload({ user_id: requestedUser.id });

    } catch (error) { next(error); } });

};

module.exports = Users;

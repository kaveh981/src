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
        }

        if (requestedMarketUser) {
            Log.trace(`Attempting to update market user ${email}...`);

            if (typeof whitelist === 'boolean' && !whitelist) {
                await marketUserManager.deleteMarketUser(requestedMarketUser);
            } else if (permissions && !requestedMarketUser.isCompany()) {
                requestedMarketUser.readOnly = permissions === 'read';
                await marketUserManager.updateMarketUser(requestedMarketUser);
            } else {
                throw HTTPError('403_USER_BAD_UPDATE');
            }
        } else if (whitelist && requestedUser.isCompany()) {
            Log.trace(`Attempting to whitelist market user company ${email}...`);

            await marketUserManager.setCompanyWhitelist(requestedUser.id, whitelist);
        } else {
            throw HTTPError('403_NOT_MARKET_USER');
        }

        res.sendPayload({ user_id: requestedUser.id });

    } catch (error) { next(error); } });

};

module.exports = Users;

'use strict';

import * as express from 'express';

import { Injector } from '../../lib/injector';
import { UserManager } from '../../models/user/user-manager';
import { RamlTypeValidator } from '../../lib/raml-type-validator';
import { HTTPError } from '../../lib/http-error';
import { Permission } from '../../middleware/permission';

import { PaginationModel } from '../../models/pagination/pagination-model';

const userManager = Injector.request<UserManager>('UserManager');
const validator = Injector.request<RamlTypeValidator>('Validator');

/**
 * Function that takes care of user information
 */
function Users(router: express.Router): void {

    /**
     * GET request to get all users info. The function first validates pagination query params and other query params. It then retrieves all users
     * from the database meeting the query params, then returns users that do meet to the requesting entity.
     */
    router.get('/', Permission('internal'), async (req: express.Request, res: express.Response, next: Function) => { try {

        /** Validation */
        // Validate request query
        let validationErrors = validator.validateType(req.query, 'traits/queryParameters/pageable',
                               { fillDefaults: true, forceOnError: [ 'TYPE_NUMB_TOO_LARGE' ], sanitizeIntegers: true });

        if (validationErrors.length > 0) {
            throw HTTPError('400', validationErrors);
        }

        validationErrors = validator.validateType(req.query, 'traits/queryParameters/user_filterable', { sanitizeIntegers: true });

        if (validationErrors.length > 0) {
            throw HTTPError('400', validationErrors);
        }

        /** Route logic */
        let pagination = new PaginationModel({ page: req.query.page, limit: req.query.limit }, req);
        let users = await userManager.fetchActiveUsers(pagination, req.query);

        res.sendPayload(users.map((user) => { return user.toPayload(); }), pagination.toPayload());

    } catch (error) { next(error); } });

    /**
     * GET request to get contact info for a user
     */
    router.get('/:id', async (req: express.Request, res: express.Response, next: Function) => { try {

        let userID = req.params['id'];
        let user = await userManager.fetchUserFromId(userID);

        if (!user.isActive()) {
            throw HTTPError('404');
        }

        res.sendPayload(user.toContactPayload());

    } catch (error) { next(error); } });

};

module.exports = Users;

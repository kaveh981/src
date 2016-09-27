'use strict';

import * as express from 'express';
import * as Promise from 'bluebird';

import { Logger } from '../../../lib/logger';
import { Injector } from '../../../lib/injector';
import { ConfigLoader } from '../../../lib/config-loader';
import { Validator } from '../../../lib/validator';

import { DealManager } from '../../../models/deal/deal-manager';

const dealManager = Injector.request<DealManager>('DealManager');
const config = Injector.request<ConfigLoader>('ConfigLoader');
const validator = Injector.request<Validator>('Validator');

const paginationConfig = config.get('pagination');

const Log: Logger = new Logger('ACTD');

/**
 * Function that takes care of all /deals/active routes
 */
function ActiveDeals(router: express.Router): void {
    /**
     * GET request to get all active deals. The function first validates pagination query parameters. It then retrieves all
     * active deals from the database and returns them.
     */
    router.get('/', (req: express.Request, res: express.Response) => {
        // Extract pagination details
        if (typeof req.query.limit === 'undefined') {
            Log.trace('Pagination limit not provided');
        }

        if (typeof req.query.offset === 'undefined') {
            Log.trace('Pagination offset not provided');
        }

        let limit: number = (Number(req.query.limit) > paginationConfig['RESULTS_LIMIT'] || typeof req.query.limit === 'undefined')
                ? paginationConfig['RESULTS_LIMIT'] : Number(req.query.limit);
        let offset: number = Number(req.query.offset) || paginationConfig['DEFAULT_OFFSET'];

        let pagination = {
            limit: limit,
            offset: offset
        };

        let validation: any = validator.validate(pagination, 'Pagination');
        if (validation.success === 0) {
            res.sendValidationError(['Some pagination parameters are invalid']);
            Log.error(validation.errors);
            return;
        }

        // Get all active deals for current buyer
        // let buyerId = Number(req.ixmBuyerInfo.userId);
        let buyerId = 123;

        return dealManager.fetchActiveDealsForBuyer(buyerId, pagination)
            .then((activeDeals) => {
                    if (activeDeals.length === 0) {
                        res.sendError(200, '200_NO_DEALS');
                        return;
                    }
                    res.sendPayload(activeDeals, pagination);
            })
            .catch((err: Error) => {
                Log.error(err);
                throw err;
            });

    });

};

module.exports = ActiveDeals;

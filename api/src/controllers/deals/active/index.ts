'use strict';

import * as express from 'express';
import * as Promise from 'bluebird';

import { Logger } from '../../../lib/logger';
import { Injector } from '../../../lib/injector';
import { ConfigLoader } from '../../../lib/config-loader';

import { DealManager } from '../../../models/deal/deal-manager';

const dealManager = Injector.request<DealManager>('DealManager');

const config = Injector.request<ConfigLoader>('ConfigLoader');
const paginationConfig = config.get('pagination');

const Log: Logger = new Logger('ACTD');

function ActiveDeals(router: express.Router): void {

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

        if (limit <= 0 || offset < 0) {
            res.sendValidationError(['Pagination parameters must be positive integers']);
            Log.debug('Negative pagination details');
            return;
        } else if (isNaN(limit) || isNaN(offset)) {
            res.sendValidationError(['Pagination parameters must be numbers']);
            Log.debug('NaN pagination details');
            return;
        } else if (limit > 4294967295 || offset > 4294967295) {
            res.sendValidationError(['Pagination parameters cannot exceed 2^32']);
            Log.debug('2^32 pagination details');
            return;
        } else if (limit > paginationConfig['RESULTS_LIMIT']) {
            Log.debug('Pagination limit capped to RESULTS_LIMIT');
        }

        let pagination = {
            limit: limit,
            offset: offset
        };

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

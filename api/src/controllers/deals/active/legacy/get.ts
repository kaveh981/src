'use strict';

import * as express from 'express';
import * as request from 'request-promise-native';

import { Logger } from '../../../../lib/logger';
import { Injector } from '../../../../lib/injector';
import { ProtectedRoute } from '../../../../middleware/protected-route';
import { ConfigLoader } from '../../../../lib/config-loader';

const config = Injector.request<ConfigLoader>('ConfigLoader');

const authConfig = config.get('auth');

const Log: Logger = new Logger('ROUT');

/**
 * Function that takes care of GET /deals/active/legacy routes
 */
function ActiveDeals(router: express.Router): void {

    /**
     * GET request to get all active and paused deals.
     */
    router.get('/', ProtectedRoute, async (req: express.Request, res: express.Response, next: Function) => { try {

        Log.trace(`Get deals request received, retrieve from Index Exchange API`, req.id);

        let accessToken = req.get(authConfig['tokenHeader']);

        let options = {
            url: `https://api01.indexexchange.com/api/publishers/deals?userID=${req.ixmUserInfo.id}`,
            headers: {
                Authorization: `Bearer ${accessToken}`
            },
            json: true,
            rejectUnauthorized: false
        };

        let response = await request(options).catch((err) => {
            if (err.name === 'StatusCodeError') {
                return err.error;
            }
        });

        res.status(response.responseCode).send(response);

    } catch (error) { next(error); } });

}

module.exports = ActiveDeals;

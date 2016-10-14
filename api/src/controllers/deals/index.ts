'use strict';

import * as express from 'express';
import * as Promise from 'bluebird';

import { Logger } from '../../lib/logger';
import { Injector } from '../../lib/injector';
import { ConfigLoader } from '../../lib/config-loader';
import { RamlTypeValidator } from '../../lib/raml-type-validator';
import { ProtectedRoute } from '../../middleware/protected-route';

import { ProposedDealManager } from '../../models/deals/proposed-deal/proposed-deal-manager';
import { ProposedDealModel } from '../../models/deals/proposed-deal/proposed-deal-model';
import { UserManager } from '../../models/user/user-manager';

const proposedDealManager = Injector.request<ProposedDealManager>('ProposedDealManager');
const userManager = Injector.request<UserManager>('UserManager');
const validator = Injector.request<RamlTypeValidator>('Validator');

const Log: Logger = new Logger('DEAL');

/**
 * Function that takes care of /deals route
 */
function Deals(router: express.Router): void {

    /**
     * GET request to get all available proposals. The function first validates pagination query parameters. It then retrieves all
     * proposals from the database and filters out all invalid ones, before returning the rest of the them to the requesting entity.
     */
    router.get('/', ProtectedRoute, Promise.coroutine(function* (req: express.Request, res: express.Response, next: Function): any {

        // Validate pagination parameters
        let pagination = {
            limit: req.query.limit,
            offset: req.query.offset
        };

        let validationErrors = validator.validateType(pagination, 'Pagination',
                               { fillDefaults: true, forceOnError: ['TYPE_NUMB_TOO_LARGE'] });

        if (validationErrors.length > 0) {
            let err = new Error(JSON.stringify(validationErrors));
            err.name = 'BAD_REQUEST';
            return next(err);
        }

        let activeProposals: ProposedDealModel[] = yield proposedDealManager.fetchProposedDealsFromStatus('active', pagination);
        let proposedDeals = [];

        for (let i = 0; i < activeProposals.length; i++) {
            let activeProposal = activeProposals[i];
            let owner = yield userManager.fetchUserFromId(activeProposal.ownerID);

            if (activeProposal.isAvailable() && owner.status === 'A') {
                proposedDeals.push(activeProposal);
            }
        }

        if (proposedDeals.length > 0) {
            res.sendPayload(proposedDeals.map((deal) => { return deal.toPayload(); }), pagination);
        } else {
            res.sendError(200, '200_NO_PACKAGES');
        }

    }) as any);

};

module.exports = Deals;

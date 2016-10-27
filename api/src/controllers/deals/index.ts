'use strict';

import * as express from 'express';

import { Logger } from '../../lib/logger';
import { Injector } from '../../lib/injector';
import { ConfigLoader } from '../../lib/config-loader';
import { RamlTypeValidator } from '../../lib/raml-type-validator';
import { HTTPError } from '../../lib/http-error';
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
    router.get('/', ProtectedRoute, async (req: express.Request, res: express.Response, next: Function) => { try {

        // Validate pagination parameters
        let pagination = {
            limit: req.query.limit,
            offset: req.query.offset
        };

        let validationErrors = validator.validateType(pagination, 'Pagination',
                               { fillDefaults: true, forceOnError: ['TYPE_NUMB_TOO_LARGE'] });

        if (validationErrors.length > 0) {
            throw HTTPError('400', validationErrors);
        }

        // Convert from strings (query) to integers
        pagination.limit = Number(pagination.limit);
        pagination.offset = Number(pagination.offset);

        let activeProposals = await proposedDealManager.fetchProposedDealsFromStatus('active', pagination);
        let proposedDeals = [];

        for (let i = 0; i < activeProposals.length; i++) {
            let activeProposal = activeProposals[i];

            if (!activeProposal) {
                continue;
            }

            let owner = await userManager.fetchUserFromId(activeProposal.ownerID);

            if (activeProposal.isAvailable() && owner.status === 'A') {
                proposedDeals.push(activeProposal);
            }
        }

        if (proposedDeals.length > 0) {
            res.sendPayload(proposedDeals.map((deal) => { return deal.toPayload(); }), pagination);
        } else {
            res.sendError('200_NO_PROPOSALS');
        }

    } catch (error) { next(error); } });

};

module.exports = Deals;

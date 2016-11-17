'use strict';

import * as express from 'express';

import { Logger } from '../../../lib/logger';
import { Injector } from '../../../lib/injector';
import { ConfigLoader } from '../../../lib/config-loader';
import { RamlTypeValidator } from '../../../lib/raml-type-validator';
import { HTTPError } from '../../../lib/http-error';
import { ProtectedRoute } from '../../../middleware/protected-route';

import { ProposedDealManager } from '../../../models/deals/proposed-deal/proposed-deal-manager';
import { ProposedDealModel } from '../../../models/deals/proposed-deal/proposed-deal-model';
import { UserManager } from '../../../models/user/user-manager';
import { PaginationModel } from '../../../models/pagination/pagination-model';

const proposedDealManager = Injector.request<ProposedDealManager>('ProposedDealManager');
const userManager = Injector.request<UserManager>('UserManager');
const validator = Injector.request<RamlTypeValidator>('Validator');

const Log: Logger = new Logger('ROUT');

/**
 * Function that takes care of /deals route
 */
function Proposals(router: express.Router): void {

    /**
     * GET request to get all available proposals. The function first validates pagination query parameters. It then retrieves all
     * proposals from the database and filters out all invalid ones, before returning the rest of the them to the requesting entity.
     */
    router.get('/', ProtectedRoute, async (req: express.Request, res: express.Response, next: Function) => { try {

       // Validate pagination parameters
        let paginationParams = {
            page: req.query.page,
            limit: req.query.limit
        };

        let validationErrors = validator.validateType(paginationParams, 'Pagination',
                               { fillDefaults: true, forceOnError: ['TYPE_NUMB_TOO_LARGE'], sanitizeIntegers: true });

        if (validationErrors.length > 0) {
            throw HTTPError('400', validationErrors);
        }

        let pagination = new PaginationModel(paginationParams, req);

        let proposals = await proposedDealManager.fetchProposedDeals(pagination);
        let availableProposals = [];

        Log.trace(`Found proposals ${Log.stringify(proposals)}`, req.id);

        for (let i = 0; i < proposals.length; i++) {
            let proposal = proposals[i];

            if (!proposal) {
                continue;
            }

            let user = req.ixmUserInfo;

            if (proposal.isReadableByUser(user)) {
                availableProposals.push(proposal);
            }
        }

        Log.trace(`Found valid proposals ${Log.stringify(availableProposals)}`, req.id);

        if (availableProposals.length > 0) {
            res.sendPayload(availableProposals.map((deal) => { return deal.toPayload(); }), pagination.toPayload());
        } else {
            res.sendError('200_NO_PROPOSALS');
        }

    } catch (error) { next(error); } });

    /**
     * GET request to get a specific proposal using the proposal ID. The function first makes sure the requested proposal is accessible,
     * then it returns it if successful.
     */
    router.get('/:proposalID', ProtectedRoute, async (req: express.Request, res: express.Response, next: Function) => { try {

        let proposalID = Number(req.params.proposalID);

        // Validate the parameter
        let validationErrors = validator.validateType(proposalID, 'SpecificProposalParameter');

        if (validationErrors.length > 0) {
            throw HTTPError('404_PROPOSAL_NOT_FOUND');
        }

        // Fetch the desired proposal
        let proposal = await proposedDealManager.fetchProposedDealFromId(proposalID);

        if (!proposal) {
            throw HTTPError('404_PROPOSAL_NOT_FOUND');
        }

        let user = req.ixmUserInfo;

        // Check that the proposal can actually be viewed by the current user. If not, send back an error. If so, send back the proposal.
        if (proposal.isReadableByUser(user)) {
            res.sendPayload(proposal.toPayload());
        } else if (proposal.status === 'deleted') {
            throw HTTPError('404_PROPOSAL_NOT_FOUND');
        } else {
            throw HTTPError('403');
        }

    } catch (error) { next(error); } });

};

module.exports = Proposals;

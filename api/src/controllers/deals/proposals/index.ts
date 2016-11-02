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

const proposedDealManager = Injector.request<ProposedDealManager>('ProposedDealManager');
const userManager = Injector.request<UserManager>('UserManager');
const validator = Injector.request<RamlTypeValidator>('Validator');

const Log: Logger = new Logger('PROP');

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
        let pagination = {
            limit: req.query.limit,
            offset: req.query.offset
        };

        let validationErrors = validator.validateType(pagination, 'Pagination',
                               { fillDefaults: true, forceOnError: ['TYPE_NUMB_TOO_LARGE'], sanitizeIntegers: true });

        if (validationErrors.length > 0) {
            throw HTTPError('400', validationErrors);
        }

        let activeProposals = await proposedDealManager.fetchProposedDealsFromStatus('active', pagination);
        let proposedDeals = [];

        for (let i = 0; i < activeProposals.length; i++) {
            let activeProposal = activeProposals[i];

            if (!activeProposal) {
                continue;
            }

            let owner = activeProposal.ownerInfo;
            let user = req.ixmUserInfo;
            // The proposal must be a valid purschaseable proposal, its owner must be active, and the user viewing 
            // it must either be its owner or a user that's not the same type as its owner (publishers can't view other 
            // publisher's proposals, and the same applies to buyers)
            if (activeProposal.isAvailable() && owner.status === 'A' && (owner.id === user.id || owner.userType !== user.userType)) {
                proposedDeals.push(activeProposal);
            }
        }

        if (proposedDeals.length > 0) {
            res.sendPayload(proposedDeals.map((deal) => { return deal.toPayload(); }), pagination);
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

        // Check that the proposal can actually be viewed by the current user. If not, send back an error. If so, send back the proposal.
        if (proposal.ownerID !== Number(req.ixmUserInfo.id)) {
            if (proposal.status === 'deleted') {
                throw HTTPError('404_PROPOSAL_NOT_FOUND');
            } else if (!proposal.isAvailable() || proposal.ownerInfo.status !== 'A'
                    || proposal.ownerInfo.userType === req.ixmUserInfo.userType) {
                throw HTTPError('403');
            }
        }

        res.sendPayload(proposal.toPayload());

    } catch (error) { next(error); } });

};

module.exports = Proposals;

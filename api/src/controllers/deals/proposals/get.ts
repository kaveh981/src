'use strict';

import * as express from 'express';

import { Logger } from '../../../lib/logger';
import { Injector } from '../../../lib/injector';
import { RamlTypeValidator } from '../../../lib/raml-type-validator';
import { HTTPError } from '../../../lib/http-error';
import { Permission } from '../../../middleware/permission';

import { ProposedDealManager } from '../../../models/deals/proposed-deal/proposed-deal-manager';
import { PaginationModel } from '../../../models/pagination/pagination-model';

const proposedDealManager = Injector.request<ProposedDealManager>('ProposedDealManager');
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
    router.get('/', Permission('read'), async (req: express.Request, res: express.Response, next: Function) => { try {

        /** Validation */

        // Validate request queryy
        let validationErrors = validator.validateType(req.query, 'traits/queryParameters/pageable',
                               { fillDefaults: true, forceOnError: [ 'TYPE_NUMB_TOO_LARGE' ], sanitizeIntegers: true });

        if (validationErrors.length > 0) {
            throw HTTPError('400', validationErrors);
        }

        validationErrors = validator.validateType(req.query, 'traits/queryParameters/deal_filterable', { sanitizeIntegers: true });

        if (validationErrors.length > 0) {
            throw HTTPError('400', validationErrors);
        }

        /** Route logic */
        let pagination = new PaginationModel({ page: req.query.page, limit: req.query.limit }, req);
        let availableProposals = await proposedDealManager.fetchAvailableProposedDeals(pagination, req.query);

        Log.trace(`Found valid proposals ${Log.stringify(availableProposals)}`, req.id);

        res.sendPayload(availableProposals.map((deal) => { return deal.toPayload(); }), pagination.toPayload());

    } catch (error) { next(error); } });

    /**
     * GET request to get a specific proposal using the proposal ID. The function first makes sure the requested proposal is accessible,
     * then it returns it if successful.
     */
    router.get('/:proposalID(\\d+)', Permission('read'), async (req: express.Request, res: express.Response, next: Function) => { try {

        /** Validation */

        // Validate request params
        let proposalID = Number(req.params['proposalID']);

        if (isNaN(proposalID)) {
            throw HTTPError('404_PROPOSAL_NOT_FOUND');
        }

        /** Route logic */

        // Fetch the desired proposal
        let proposal = await proposedDealManager.fetchProposedDealFromId(proposalID);
        let user = req.ixmUserInfo;

        // Check that the proposal can actually be viewed by the current user. If not, send back an error.
        if (!proposal || !proposal.isReadableByUser(user)) {
            throw HTTPError('404_PROPOSAL_NOT_FOUND');
        }

        res.sendPayload(proposal.toPayload());

    } catch (error) { next(error); } });

};

module.exports = Proposals;

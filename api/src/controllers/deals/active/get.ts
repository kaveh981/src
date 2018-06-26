'use strict';

import * as express from 'express';

import { Logger } from '../../../lib/logger';
import { Injector } from '../../../lib/injector';
import { RamlTypeValidator } from '../../../lib/raml-type-validator';
import { HTTPError } from '../../../lib/http-error';
import { Permission } from '../../../middleware/permission';

import { ProposedDealManager } from '../../../models/deals/proposed-deal/proposed-deal-manager';
import { SettledDealManager } from '../../../models/deals/settled-deal/settled-deal-manager';
import { PaginationModel } from '../../../models/pagination/pagination-model';
import { UserManager } from '../../../models/user/user-manager';

const userManager = Injector.request<UserManager>('UserManager');
const settledDealManager = Injector.request<SettledDealManager>('SettledDealManager');
const proposedDealManager = Injector.request<ProposedDealManager>('ProposedDealManager');
const validator = Injector.request<RamlTypeValidator>('Validator');

const Log: Logger = new Logger('ROUT');

/**
 * Function that takes care of GET /deals/active routes
 */
function ActiveDeals(router: express.Router): void {

    /**
     * GET request to get all active deals.
     */
    router.get('/', Permission('read'), async (req: express.Request, res: express.Response, next: Function) => { try {

        /** Validation */

        // Validate Query
        let validationErrors = validator.validateType(req.query, 'traits/queryParameters/pageable',
                               { fillDefaults: true, forceOnError: [ 'TYPE_NUMB_TOO_LARGE' ], sanitizeIntegers: true });

        if (validationErrors.length > 0) {
            throw HTTPError('400', validationErrors);
        }

        /** Route logic */

        // Get all active deals for current user
        let user = req.ixmUserInfo;
        let pagination = new PaginationModel({ page: req.query.page, limit: req.query.limit }, req);
        let activeDeals = await settledDealManager.fetchActiveSettledDealsForUser(user, pagination);

        Log.trace(`Found deals ${Log.stringify(activeDeals)} for user ${user.contact.id} representing ${user.company.id}.`, req.id);

        res.sendPayload(activeDeals.map((deal) => { return deal.toPayload(user); }), pagination.toPayload());

    } catch (error) { next(error); } });

    /**
     * GET request to get active deals by proposalID.
     */
    router.get('/:proposalID', Permission('read'), async (req: express.Request, res: express.Response, next: Function) => { try {

        /** Validation */

        // Validate request params
        let proposalID = Number(req.params['proposalID']);

        if (isNaN(proposalID)) {
            throw HTTPError('404_PROPOSAL_NOT_FOUND');
        }

        // Validate request query
        let validationErrors = validator.validateType(req.query, 'traits/queryParameters/pageable',
                               { fillDefaults: true, forceOnError: [ 'TYPE_NUMB_TOO_LARGE' ], sanitizeIntegers: true });

        if (validationErrors.length > 0) {
            throw HTTPError('400', validationErrors);
        }

        /** Route logic */

        let user = req.ixmUserInfo;
        let pagination = new PaginationModel({ page: req.query.page, limit: req.query.limit }, req);
        let settledDeals = await settledDealManager.fetchSettledDealsFromUserProposalIds(user.company.id, proposalID, pagination);
        let proposal = await proposedDealManager.fetchProposedDealFromId(proposalID);

        if (!proposal || !proposal.hasNegotiationsViewableBy(user, !!settledDeals[0])) {
            throw HTTPError('404_PROPOSAL_NOT_FOUND');
        }

        Log.trace(`Found deals ${Log.stringify(settledDeals)} for proposal ${proposalID} for user \
                  ${user.contact.id} representing ${user.company.id}.`, req.id);

        res.sendPayload(settledDeals.map((deal) => { return deal.toPayload(user); }), pagination.toPayload());

    } catch (error) { next(error); } });

    /**
     * GET request to get active deals by proposalID/partnerID.
     */
    router.get('/:proposalID/partner/:partnerID', Permission('read'), async (req: express.Request, res: express.Response, next: Function) => { try {

        /** Validation */

        // Validate Params
        let proposalID = Number(req.params.proposalID);
        let partnerID = Number(req.params.partnerID);

        if (isNaN(proposalID) || isNaN(partnerID)) {
            throw HTTPError('404_DEAL_NOT_FOUND');
        }

        /** Route logic */

        let user = req.ixmUserInfo;

        let settledDeal = await settledDealManager.fetchSettledDealFromPartyIds(proposalID, user.company.id, partnerID);
        let proposal = await proposedDealManager.fetchProposedDealFromId(proposalID);
        let partner = await userManager.fetchUserFromId(partnerID);

        if (!proposal || !proposal.hasNegotiationsViewableBy(user, !!settledDeal)) {
            throw HTTPError('404_PROPOSAL_NOT_FOUND');
        } else if (!partner || !partner.isActive() && !settledDeal) {
            throw HTTPError('404_PARTNER_NOT_FOUND');
        } else if (!settledDeal || settledDeal.isDeleted()) {
            throw HTTPError('404_DEAL_NOT_FOUND');
        }

        Log.trace(`Found deal ${Log.stringify(settledDeal)} for user ${user.contact.id} representing 
                  ${user.company.id} with partner ${partnerID} and proposal ${proposalID}.`, req.id);

        res.sendPayload(settledDeal.toPayload(user));

    } catch (error) { next(error); } });

};

module.exports = ActiveDeals;

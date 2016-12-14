'use strict';

import * as express from 'express';

import { Logger } from '../../../lib/logger';
import { Injector } from '../../../lib/injector';
import { RamlTypeValidator } from '../../../lib/raml-type-validator';
import { HTTPError } from '../../../lib/http-error';
import { ProtectedRoute } from '../../../middleware/protected-route';

import { SettledDealManager } from '../../../models/deals/settled-deal/settled-deal-manager';
import { PaginationModel } from '../../../models/pagination/pagination-model';
import { ProposedDealManager } from '../../../models/deals/proposed-deal/proposed-deal-manager';
import { UserManager } from '../../../models/user/user-manager';
import { NegotiatedDealManager } from '../../../models/deals/negotiated-deal/negotiated-deal-manager';

const settledDealManager = Injector.request<SettledDealManager>('SettledDealManager');
const validator = Injector.request<RamlTypeValidator>('Validator');
const proposedDealManager = Injector.request<ProposedDealManager>('ProposedDealManager');
const userManager = Injector.request<UserManager>('UserManager');
const negotiatedDealManager = Injector.request<NegotiatedDealManager>('NegotiatedDealManager');

const Log: Logger = new Logger('ROUT');

/**
 * Function that takes care of GET /deals/active routes
 */
function ActiveDeals(router: express.Router): void {

    /**
     * GET request to get all active deals.
     */
    router.get('/', ProtectedRoute, async (req: express.Request, res: express.Response, next: Function) => { try {

        /** Validation */

        // Validate Query
        let validationErrors = validator.validateType(req.query, 'Pagination',
                               { fillDefaults: true, forceOnError: [ 'TYPE_NUMB_TOO_LARGE' ], sanitizeIntegers: true });

        if (validationErrors.length > 0) {
            throw HTTPError('400', validationErrors);
        }

        /** Route logic */

        // Get all active deals for current user
        let user = req.ixmUserInfo;
        let pagination = new PaginationModel({ page: req.query.page, limit: req.query.limit }, req);
        let activeDeals = await settledDealManager.fetchActiveSettledDealsFromUser(user, pagination);

        Log.trace(`Found deals ${Log.stringify(activeDeals)} for user ${user.id}.`, req.id);

        res.sendPayload(activeDeals.map((deal) => { return deal.toPayload(req.ixmUserInfo.userType); }), pagination.toPayload());

    } catch (error) { next(error); } });

    /**
     * GET request to get active deals by proposalID.
     */
    router.get('/:proposalID', ProtectedRoute, async (req: express.Request, res: express.Response, next: Function) => { try {

        /** Validation */

        // Validate request params
        let paramErrors = validator.validateType(req.params, 'SpecificProposalParameter', { sanitizeIntegers: true });

        if (paramErrors.length > 0) {
            throw HTTPError('404_PROPOSAL_NOT_FOUND');
        }

        // Validate request query
        let validationErrors = validator.validateType(req.query, 'Pagination',
                               { fillDefaults: true, forceOnError: [ 'TYPE_NUMB_TOO_LARGE' ], sanitizeIntegers: true });

        if (validationErrors.length > 0) {
            throw HTTPError('400', validationErrors);
        }

        /** Route logic */

    } catch (error) { next(error); } });

    /**
     * GET request to get active deals by proposalID/partnerID.
     */
    router.get('/:proposalID/partner/:partnerID', ProtectedRoute, async (req: express.Request, res: express.Response, next: Function) => { try {

        /** Validation */

        // Validate Query
        let validationErrors = validator.validateType(req.params, 'SpecificDealParameters', { sanitizeIntegers: true });

        if (validationErrors.length > 0) {
            throw HTTPError('404_DEAL_NOT_FOUND', validationErrors);
        }

        /** Route logic */

        let proposalID: number = req.params.proposalID;
        let partnerID: number = req.params.partnerID;
        let user = req.ixmUserInfo;

        // Check that proposal exists and can be accessed by the user
        let proposal = await proposedDealManager.fetchProposedDealFromId(proposalID);

        if (!proposal || !proposal.targetsUser(user)) {
            throw HTTPError('404_PROPOSAL_NOT_FOUND');
        }

        // Check that partner exists and is active
        let partner = await userManager.fetchUserFromId(partnerID);

        if (!partner) {
            throw HTTPError('404_PARTNER_NOT_FOUND');
        } else if (!partner.isActive()) {
            throw HTTPError('403_PARTNER_NOT_ACTIVE');
        }

        let buyerID: number;
        let publisherID: number;

        if (partner.userType === 'IXMB') {
            buyerID = partner.id;
            publisherID = user.id;
        } else {
            buyerID = user.id;
            publisherID = partner.id;
        }

        // Check that user has interacted with the proposal. If they haven't, and the proposal is deleted, then it should behave as if the proposal does not and
        // has never existed. However, if they have at least negotiated on it, then it should be possible for them to use its ID to get associated deals.
        let negotiatedDeal = await negotiatedDealManager.fetchNegotiatedDealFromIds(proposalID, buyerID, publisherID);

        if (!negotiatedDeal && proposal.isDeleted()) {
            throw HTTPError('404_PROPOSAL_NOT_FOUND');
        }

        // Fetch the settled deal
        let settledDeal = await settledDealManager.fetchSettledDealFromIds(proposalID, buyerID, publisherID);

        if (!settledDeal || settledDeal.isDeleted()) {
            throw HTTPError('404_DEAL_NOT_FOUND');
        }

        res.sendPayload(settledDeal.toPayload(user.userType));

    } catch (error) { next(error); } });

};

module.exports = ActiveDeals;

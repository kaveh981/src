'use strict';

import * as express from 'express';

import { Logger } from '../../../lib/logger';
import { Injector } from '../../../lib/injector';
import { RamlTypeValidator } from '../../../lib/raml-type-validator';
import { HTTPError } from '../../../lib/http-error';
import { ProtectedRoute } from '../../../middleware/protected-route';

import { ProposedDealManager } from '../../../models/deals/proposed-deal/proposed-deal-manager';
import { NegotiatedDealManager } from '../../../models/deals/negotiated-deal/negotiated-deal-manager';
import { UserManager } from '../../../models/user/user-manager';
import { PaginationModel } from '../../../models/pagination/pagination-model';

const proposedDealManager = Injector.request<ProposedDealManager>('ProposedDealManager');
const negotiatedDealManager = Injector.request<NegotiatedDealManager>('NegotiatedDealManager');
const userManager = Injector.request<UserManager>('UserManager');
const validator = Injector.request<RamlTypeValidator>('Validator');

const Log: Logger = new Logger('ROUT');

/**
 * Function that takes care of GET /deals/negotiation routes  
 */
function NegotiationDeals(router: express.Router): void {

    /**
     * GET request to get all active negotiations for the user. The function first validates pagination query parameters.
     * It then retrieves all negotiations from the database and filters out all invalid ones, before returning the rest
     * of them to the requesting entity.
     */
    router.get('/', ProtectedRoute, async (req: express.Request, res: express.Response, next: Function) => { try {

        /** Validation */

        // Validate request query
        let validationErrors = validator.validateType(req.query, 'Pagination',
                               { fillDefaults: true, forceOnError: [ 'TYPE_NUMB_TOO_LARGE' ], sanitizeIntegers: true });

        if (validationErrors.length > 0) {
            throw HTTPError('400', validationErrors);
        }

        /** Route Logic */

        let user = req.ixmUserInfo;
        let pagination = new PaginationModel({ page: req.query.page, limit: req.query.limit }, req);
        let activeNegotiatedDeals = await negotiatedDealManager.fetchActiveNegotiatedDealsFromUser(user, pagination);

        Log.trace(`Found active negotiated deals ${Log.stringify(activeNegotiatedDeals)}`, req.id);

        res.sendPayload(activeNegotiatedDeals.map((deal) => { return deal.toPayload(user.userType); }), pagination.toPayload());

    } catch (error) { next(error); } });

    /*
     * GET Request for both users, buyers and publishers, to get a list of deal negotiations by providing a proposalID
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

        /** Route Logic */

        let pagination = new PaginationModel({ page: req.query.page, limit: req.query.limit }, req);
        let userID = req.ixmUserInfo.id;
        let proposalID: number = req.params.proposalID;
        let proposal = await proposedDealManager.fetchProposedDealFromId(proposalID);

        if (!proposal) {
            throw HTTPError('404_PROPOSAL_NOT_FOUND');
        }

        let negotiatedDeals = await negotiatedDealManager.fetchNegotiatedDealsFromUserProposalIds(userID, proposalID, pagination);

        Log.trace(`Found negotiated deals ${Log.stringify(negotiatedDeals)}`, req.id);

        res.sendPayload(negotiatedDeals.map((deal) => { return deal.toPayload(req.ixmUserInfo.userType); }), pagination.toPayload());

    } catch (error) { next(error); } });

    /**
     * Get specific negotiation from proposal id and partner id
     */
    router.get('/:proposalID/partner/:partnerID', ProtectedRoute, async (req: express.Request, res: express.Response, next: Function) => { try {

        /** Validation */

        // Validate request params
        let validationErrors = validator.validateType(req.params, 'SpecificNegotiationParameters', { sanitizeIntegers: true });

        if (validationErrors.length > 0) {
            throw HTTPError('404_NEGOTIATION_NOT_FOUND');
        }

        /** Route logic */

        let proposalID: number = req.params.proposalID;
        let partnerID: number = req.params.partnerID;

        // Check proposal and partner existence
        let proposal = await proposedDealManager.fetchProposedDealFromId(proposalID);
        let partner = await userManager.fetchUserFromId(partnerID);

        if (!proposal) {
            throw HTTPError('404_PROPOSAL_NOT_FOUND');
        } else if (!partner) {
            throw HTTPError('404_PARTNER_NOT_FOUND');
        } else if (partner.userGroup !== 'Index Market') {
            throw HTTPError('403_PARTNER_NOT_IXMUSER');
        } else if (!partner.isActive()) {
            throw HTTPError('403_PARTNER_NOT_ACTIVE');
        } else if (partner.userType === req.ixmUserInfo.userType) {
            throw HTTPError('403_PARTNER_INVALID_USERTYPE');
        }

        let buyerID: number;
        let publisherID: number;

        if (partner.userType === 'IXMB') {
            buyerID = partner.id;
            publisherID = req.ixmUserInfo.id;
        } else {
            buyerID = req.ixmUserInfo.id;
            publisherID = partner.id;
        }

        let negotiatedDeal = await negotiatedDealManager.fetchNegotiatedDealFromIds(proposalID, buyerID, publisherID);

        Log.trace(`Found negotiation ${JSON.stringify(negotiatedDeal)}`, req.id);

        if (!negotiatedDeal) {
            throw HTTPError('404_NEGOTIATION_NOT_FOUND');
        }

        res.sendPayload(negotiatedDeal.toPayload(req.ixmUserInfo.userType));

    } catch (error) { next(error); } });

}

module.exports = NegotiationDeals;

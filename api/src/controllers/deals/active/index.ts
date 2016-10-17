'use strict';

import * as express from 'express';
import * as Promise from 'bluebird';

import { Logger } from '../../../lib/logger';
import { Injector } from '../../../lib/injector';
import { ConfigLoader } from '../../../lib/config-loader';
import { RamlTypeValidator } from '../../../lib/raml-type-validator';
import { HttpError } from '../../../lib/http-error';
import { ProtectedRoute } from '../../../middleware/protected-route';

import { SettledDealManager } from '../../../models/deals/settled-deal/settled-deal-manager';
import { SettledDealModel } from '../../../models/deals/settled-deal/settled-deal-model';
import { ProposedDealManager } from '../../../models/deals/proposed-deal/proposed-deal-manager';
import { ProposedDealModel } from '../../../models/deals/proposed-deal/proposed-deal-model';
import { NegotiatedDealManager } from '../../../models/deals/negotiated-deal/negotiated-deal-manager';
import { NegotiatedDealModel } from '../../../models/deals/negotiated-deal/negotiated-deal-model';
import { UserManager } from '../../../models/user/user-manager';
import { BuyerManager } from '../../../models/buyer/buyer-manager';

const negotiatedDealManager = Injector.request<NegotiatedDealManager>('NegotiatedDealManager');
const proposedDealManager = Injector.request<ProposedDealManager>('ProposedDealManager');
const settledDealManager = Injector.request<SettledDealManager>('SettledDealManager');
const buyerManager = Injector.request<BuyerManager>('BuyerManager');
const userManager = Injector.request<UserManager>('UserManager');
const validator = Injector.request<RamlTypeValidator>('Validator');

const Log: Logger = new Logger('ACTD');

/**
 * Function that takes care of all /deals/active routes
 */
function ActiveDeals(router: express.Router): void {

    /**
     * GET request to get all active deals.
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
            Log.debug('Request is invalid');
            return next(HttpError.badRequest(JSON.stringify(validationErrors)));
        }

        // Get all active deals for current buyer
        let buyerId = Number(req.ixmBuyerInfo.userID);

        let activeDeals = yield settledDealManager.fetchSettledDealsFromBuyerId(buyerId, pagination);

        if (activeDeals.length > 0) {
            res.sendPayload(activeDeals.map((deal) => { return deal.toPayload(); }), pagination);
        } else {
            res.sendError(200, '200_NO_DEALS');
        }

    }) as any);

    /**
     * PUT request to accept a deal and insert it into the database to activate it.
     */
    router.put('/', ProtectedRoute, Promise.coroutine(function* (req: express.Request, res: express.Response, next: Function): any {

        // Validate the request
        let validationErrors = validator.validateType(req.body, 'AcceptDealRequest');

        if (validationErrors.length > 0) {
            Log.debug('Request is invalid');
            return next(HttpError.badRequest(JSON.stringify(validationErrors)));
        }

        // Check that proposal exists
        let proposalID: number = req.body.proposalID;
        let buyerID = Number(req.ixmBuyerInfo.userID);
        let buyerIXMInfo = yield buyerManager.fetchBuyerFromId(buyerID);
        let proposedDeal: ProposedDealModel = yield proposedDealManager.fetchProposedDealFromId(proposalID);

        if (!proposedDeal || proposedDeal.status === 'deleted') {
            Log.debug('Proposal does not exist');
            return next();
        }

        // Check that the proposal is available for purchase
        let owner = yield userManager.fetchUserFromId(proposedDeal.ownerID);

        if (!proposedDeal.isAvailable() || !(owner.status === 'A')) {
            Log.debug('Proposal is not available for purchase');
            return next(HttpError.forbidden('403_NOT_FORSALE'));
        }

        // Check that proposal has not been bought yet by this buyer, or isn't in negotiation
        let dealNegotiation: NegotiatedDealModel =
                yield negotiatedDealManager.fetchNegotiatedDealFromIds(proposalID, buyerID, proposedDeal.ownerID);

        if (dealNegotiation) {
            if (dealNegotiation.buyerStatus === 'accepted' && dealNegotiation.publisherStatus === 'accepted') {
                Log.debug('Proposal has already been accepted.');
                return next(HttpError.forbidden('403_PROPOSAL_BOUGHT'));

            } else if (dealNegotiation.buyerStatus !== 'rejected' && dealNegotiation.publisherStatus !== 'rejected') {
                Log.debug('Proposal is in negotiation.');
                return next(HttpError.forbidden('403_PROPOSAL_IN_NEGOTIATION'));
            }
        }

        // Create a new negotiation
        let acceptedNegotiation = yield negotiatedDealManager.createAcceptedNegotiationFromProposedDeal(proposedDeal, buyerID);
        yield negotiatedDealManager.insertNegotiatedDeal(acceptedNegotiation);

        // Create the settled deal
        let settledDeal = settledDealManager.createSettledDealFromNegotiation(acceptedNegotiation, buyerIXMInfo.dspIDs[0]);
        yield settledDealManager.insertSettledDeal(settledDeal);

        res.sendPayload(settledDeal.toPayload());

    }) as any);

};

module.exports = ActiveDeals;

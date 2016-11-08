'use strict';

import * as express from 'express';

import { Logger } from '../../../lib/logger';
import { Injector } from '../../../lib/injector';
import { ConfigLoader } from '../../../lib/config-loader';
import { RamlTypeValidator } from '../../../lib/raml-type-validator';
import { HTTPError } from '../../../lib/http-error';
import { ProtectedRoute } from '../../../middleware/protected-route';

import { SettledDealManager } from '../../../models/deals/settled-deal/settled-deal-manager';
import { SettledDealModel } from '../../../models/deals/settled-deal/settled-deal-model';
import { ProposedDealManager } from '../../../models/deals/proposed-deal/proposed-deal-manager';
import { ProposedDealModel } from '../../../models/deals/proposed-deal/proposed-deal-model';
import { NegotiatedDealManager } from '../../../models/deals/negotiated-deal/negotiated-deal-manager';
import { NegotiatedDealModel } from '../../../models/deals/negotiated-deal/negotiated-deal-model';
import { UserManager } from '../../../models/user/user-manager';
import { DatabaseManager } from '../../../lib/database-manager';
import { BuyerManager } from '../../../models/buyer/buyer-manager';

const negotiatedDealManager = Injector.request<NegotiatedDealManager>('NegotiatedDealManager');
const proposedDealManager = Injector.request<ProposedDealManager>('ProposedDealManager');
const settledDealManager = Injector.request<SettledDealManager>('SettledDealManager');
const databaseManager = Injector.request<DatabaseManager>('DatabaseManager');
const buyerManager = Injector.request<BuyerManager>('BuyerManager');
const userManager = Injector.request<UserManager>('UserManager');
const validator = Injector.request<RamlTypeValidator>('Validator');

const Log: Logger = new Logger('ROUT');

/**
 * Function that takes care of all /deals/active routes
 */
function ActiveDeals(router: express.Router): void {

    /**
     * GET request to get all active deals.
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

        // Get all active deals for current buyer
        let buyerId = Number(req.ixmUserInfo.id);
        let settledDeals = await settledDealManager.fetchSettledDealsFromBuyerId(buyerId, pagination);
        let activeDeals = settledDeals.filter((deal) => { return deal.isActive(); });

        Log.trace(`Found deals ${JSON.stringify(activeDeals, null, 4)} for buyer ${buyerId}.`, req.id);

        if (activeDeals.length > 0) {
            res.sendPayload(activeDeals.map((deal) => { return deal.toPayload(req.ixmUserInfo.userType); }), pagination);
        } else {
            res.sendError('200_NO_DEALS');
        }

    } catch (error) { next(error); } });

    /**
     * PUT request to accept a deal and insert it into the database to activate it.
     */
    router.put('/', ProtectedRoute, async (req: express.Request, res: express.Response, next: Function) => { try {

        // Validate the request
        let validationErrors = validator.validateType(req.body, 'AcceptDealRequest');

        if (validationErrors.length > 0) {
            throw HTTPError('400', validationErrors);
        }

        // Check that proposal exists
        let proposalID: number = req.body.proposal_id;
        let buyerID = Number(req.ixmUserInfo.id);
        let buyerIXMInfo = await buyerManager.fetchBuyerFromId(buyerID);
        let proposedDeal = await proposedDealManager.fetchProposedDealFromId(proposalID);

        Log.trace(`Request to buy proposal ${proposalID} for buyer ${buyerID}.`, req.id);

        if (!proposedDeal || proposedDeal.status === 'deleted') {
            throw HTTPError('404_PROPOSAL_NOT_FOUND');
        }

        // Check that the proposal is available for purchase
        let owner = await userManager.fetchUserFromId(proposedDeal.ownerID);

        if (!proposedDeal.isAvailable() || !(owner.status === 'A')) {
            throw HTTPError('403_NOT_FORSALE');
        }

        // Check that proposal has not been bought yet by this buyer, or isn't in negotiation
        let dealNegotiation: NegotiatedDealModel =
                await negotiatedDealManager.fetchNegotiatedDealFromIds(proposalID, buyerID, proposedDeal.ownerID);

        Log.trace(`Found a negotiation: ${JSON.stringify(dealNegotiation, null, 4)}.`, req.id);

        if (dealNegotiation) {
            if (dealNegotiation.buyerStatus === 'accepted' && dealNegotiation.publisherStatus === 'accepted') {
                throw HTTPError('403_PROPOSAL_BOUGHT');
            } else if (dealNegotiation.buyerStatus !== 'rejected' && dealNegotiation.publisherStatus !== 'rejected') {
                throw HTTPError('403_PROPOSAL_IN_NEGOTIATION');
            }
        }

        Log.debug(`Creating a new negotiation and inserting into rtbDeals...`, req.id);

        // Begin transaction
        await databaseManager.transaction(async (transaction) => {
            // Create a new negotiation
            let acceptedNegotiation = await negotiatedDealManager.createAcceptedNegotiationFromProposedDeal(proposedDeal, buyerID);
            await negotiatedDealManager.insertNegotiatedDeal(acceptedNegotiation, transaction);

            Log.trace(`Created accepted negotiation ${JSON.stringify(acceptedNegotiation, null, 4)}`, req.id);

            // Create the settled deal
            let settledDeal = settledDealManager.createSettledDealFromNegotiation(acceptedNegotiation, buyerIXMInfo.dspIDs[0]);
            await settledDealManager.insertSettledDeal(settledDeal, transaction);

            Log.trace(`Created settled deal ${JSON.stringify(settledDeal)}`, req.id);

            res.sendPayload(settledDeal.toPayload(req.ixmUserInfo.userType));
        });

    } catch (error) { next(error); } });

};

module.exports = ActiveDeals;

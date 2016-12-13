'use strict';

import * as express from 'express';

import { Logger } from '../../../lib/logger';
import { Injector } from '../../../lib/injector';
import { RamlTypeValidator } from '../../../lib/raml-type-validator';
import { HTTPError } from '../../../lib/http-error';
import { ProtectedRoute } from '../../../middleware/protected-route';

import { SettledDealManager } from '../../../models/deals/settled-deal/settled-deal-manager';
import { SettledDealModel } from '../../../models/deals/settled-deal/settled-deal-model';
import { ProposedDealManager } from '../../../models/deals/proposed-deal/proposed-deal-manager';
import { NegotiatedDealManager } from '../../../models/deals/negotiated-deal/negotiated-deal-manager';
import { DatabaseManager } from '../../../lib/database-manager';
import { BuyerManager } from '../../../models/buyer/buyer-manager';
import { PublisherManager } from '../../../models/publisher/publisher-manager';
import { BuyerModel } from '../../../models/buyer/buyer-model';
import { PublisherModel } from '../../../models/publisher/publisher-model';

const negotiatedDealManager = Injector.request<NegotiatedDealManager>('NegotiatedDealManager');
const proposedDealManager = Injector.request<ProposedDealManager>('ProposedDealManager');
const settledDealManager = Injector.request<SettledDealManager>('SettledDealManager');
const databaseManager = Injector.request<DatabaseManager>('DatabaseManager');
const buyerManager = Injector.request<BuyerManager>('BuyerManager');
const publisherManager = Injector.request<PublisherManager>('PublisherManager');
const validator = Injector.request<RamlTypeValidator>('Validator');

const Log: Logger = new Logger('ROUT');

/**
 * Function that takes care of PUT /deals/active routes
 */
function ActiveDeals(router: express.Router): void {

    /**
     * PUT request to accept a deal and insert it into the database to activate it.
     */
    router.put('/', ProtectedRoute, async (req: express.Request, res: express.Response, next: Function) => { try {

        /** Validation */

        // Validate body
        let validationErrors = validator.validateType(req.body, 'AcceptDealRequest');

        if (validationErrors.length > 0) {
            throw HTTPError('400', validationErrors);
        }

        /** Route logic */

        // Check that proposal exists
        let proposalID: number = req.body.proposal_id;
        let userID = req.ixmUserInfo.id;
        let proposedDeal = await proposedDealManager.fetchProposedDealFromId(proposalID);
        let userInfo = req.ixmUserInfo;
        let buyer: BuyerModel;
        let publisher: PublisherModel;

        Log.trace(`Request to buy proposal ${proposalID} for user ${userID}.`, req.id);

        if (!proposedDeal || proposedDeal.status === 'deleted') {
            throw HTTPError('404_PROPOSAL_NOT_FOUND');
        }

        if (!proposedDeal.isPurchasableByUser(req.ixmUserInfo)) {
            throw HTTPError('403_FORBIDDEN');
        }

        if (req.ixmUserInfo.userType === 'IXMB') {
            buyer = await buyerManager.fetchBuyerFromId(userID);
            publisher = await publisherManager.fetchPublisherFromId(proposedDeal.ownerID);
        } else {
            publisher = await publisherManager.fetchPublisherFromId(userID);
            buyer = await buyerManager.fetchBuyerFromId(proposedDeal.ownerID);
        }

        // Check that proposal has not been bought yet by this buyer, or isn't in negotiation
        let dealNegotiation = await negotiatedDealManager.fetchNegotiatedDealFromIds(proposalID, buyer.userID, publisher.userID);

        if (dealNegotiation) {
            Log.trace(`Found a negotiation: ${Log.stringify(dealNegotiation)}.`, req.id);

            if (dealNegotiation.buyerStatus === 'accepted' && dealNegotiation.publisherStatus === 'accepted') {
                throw HTTPError('403_PROPOSAL_BOUGHT');
            } else if (dealNegotiation.buyerStatus !== 'rejected' && dealNegotiation.publisherStatus !== 'rejected') {
                throw HTTPError('403_PROPOSAL_IN_NEGOTIATION');
            }
        }

        Log.debug(`Creating a new negotiation and inserting into rtbDeals...`, req.id);

        let settledDeal: SettledDealModel;

        // Begin transaction
        await databaseManager.transaction(async (transaction) => {

            // Create a new negotiation
            let acceptedNegotiation = await negotiatedDealManager.createAcceptedNegotiationFromProposedDeal(proposedDeal, userInfo);
            await negotiatedDealManager.insertNegotiatedDeal(acceptedNegotiation, transaction);

            Log.trace(`Created accepted negotiation ${Log.stringify(acceptedNegotiation)}`, req.id);

            // Create the settled deal
            settledDeal = settledDealManager.createSettledDealFromNegotiation(acceptedNegotiation, buyer.dspIDs[0]);
            await settledDealManager.insertSettledDeal(settledDeal, transaction);

            Log.trace(`Created settled deal ${Log.stringify(settledDeal)}`, req.id);

        });

        res.sendPayload(settledDeal.toPayload(req.ixmUserInfo.userType));

    } catch (error) { next(error); } });

};

module.exports = ActiveDeals;
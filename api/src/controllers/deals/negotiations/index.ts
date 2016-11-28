'use strict';

import * as express from 'express';

import { Logger } from '../../../lib/logger';
import { Injector } from '../../../lib/injector';
import { RamlTypeValidator } from '../../../lib/raml-type-validator';
import { HTTPError } from '../../../lib/http-error';
import { ProtectedRoute } from '../../../middleware/protected-route';

import { ProposedDealModel } from '../../../models/deals/proposed-deal/proposed-deal-model';
import { ProposedDealManager } from '../../../models/deals/proposed-deal/proposed-deal-manager';
import { NegotiatedDealManager } from '../../../models/deals/negotiated-deal/negotiated-deal-manager';
import { NegotiatedDealModel } from '../../../models/deals/negotiated-deal/negotiated-deal-model';
import { SettledDealManager } from '../../../models/deals/settled-deal/settled-deal-manager';
import { SettledDealModel } from '../../../models/deals/settled-deal/settled-deal-model';
import { DatabaseManager } from '../../../lib/database-manager';
import { UserModel } from '../../../models/user/user-model';
import { UserManager } from '../../../models/user/user-manager';
import { BuyerManager } from '../../../models/buyer/buyer-manager';
import { PaginationModel } from '../../../models/pagination/pagination-model';

const proposedDealManager = Injector.request<ProposedDealManager>('ProposedDealManager');
const negotiatedDealManager = Injector.request<NegotiatedDealManager>('NegotiatedDealManager');
const settledDealManager = Injector.request<SettledDealManager>('SettledDealManager');
const buyerManager = Injector.request<BuyerManager>('BuyerManager');
const userManager = Injector.request<UserManager>('UserManager');
const validator = Injector.request<RamlTypeValidator>('Validator');
const databaseManager = Injector.request<DatabaseManager>('DatabaseManager');

const Log: Logger = new Logger('ROUT');

/**
 * Function that takes care of all /deals/negotiation routes  
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
                               { fillDefaults: true, forceOnError: ['TYPE_NUMB_TOO_LARGE'], sanitizeIntegers: true });

        if (validationErrors.length > 0) {
            throw HTTPError('400', validationErrors);
        }

        /** Route Logic */

        let user = req.ixmUserInfo;
        let pagination = new PaginationModel({ page: req.query.page, limit: req.query.limit }, req);
        let negotiatedDeals = await negotiatedDealManager.fetchNegotiatedDealsFromUser(user, pagination);

        Log.trace(`Found negotiated deals ${Log.stringify(negotiatedDeals)}`, req.id);

        res.sendPayload(negotiatedDeals.map((deal) => { return deal.toPayload(user.userType); }), pagination.toPayload());

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
                               { fillDefaults: true, forceOnError: ['TYPE_NUMB_TOO_LARGE'], sanitizeIntegers: true });

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
    router.get('/:proposalID/partner/:partnerID', ProtectedRoute,
               async (req: express.Request, res: express.Response, next: Function) => { try {

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

        if (!proposal) {
            throw HTTPError('404_PROPOSAL_NOT_FOUND');
        }

        let partner = await userManager.fetchUserFromId(partnerID);

        if (!partner) {
            throw HTTPError('404_PARTNER_NOT_FOUND');
        }

        // Check partner user group and status
        if (partner.userGroup !== 'Index Market') {
            throw HTTPError('403_PARTNER_NOT_IXMUSER');
        }

        if (!partner.isActive()) {
            throw HTTPError('403_PARTNER_NOT_ACTIVE');
        }

        // Check if request sender and partner are in the same type
        if (partner.userType === req.ixmUserInfo.userType) {
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

    /**
     * PUT request to accept a deal and insert it into the database to activate it.
     */
    router.put('/', ProtectedRoute, async (req: express.Request, res: express.Response, next: Function) => { try {

        /** Validation */

        // Validate the request body
        let validationErrors = validator.validateType(req.body, 'NegotiateDealRequest',
                                { sanitizeStringEnum: true, fillDefaults: true, removeNull: true, trimStrings: true });

        if (validationErrors.length > 0) {
            throw HTTPError('400', validationErrors);
        }

        /** Route Logic */

        // Populate negotiation information used in the rest of the route
        let responseType: string = req.body.response;

        let negotiationFields = JSON.parse(JSON.stringify({
            startDate: req.body['start_date'],
            endDate: req.body['end_date'],
            price: req.body['price'],
            impressions: req.body['impressions'],
            budget: req.body['budget'],
            terms: req.body['terms']
        }));

        // Confirm that the user sent fields consistent with negotiation / acceptance-rejection
        let fieldCount = Object.keys(negotiationFields).length;

        if (responseType === 'counter-offer' && fieldCount === 0) {
            throw HTTPError('400_MISSING_NEG_FIELD');
        } else if (fieldCount > 0 && responseType !== 'counter-offer') {
            throw HTTPError('400_EXTRA_NEG_FIELD');
        }

        // Check whether the user is a publisher or a buyer and populate user fields accordingly
        let userType: 'buyer' | 'publisher' = req.ixmUserInfo.userType === 'IXMB' ? 'buyer' : 'publisher';
        let buyerID: number;
        let publisherID: number;

        if (userType === 'publisher') {
            buyerID = req.body.partner_id;
            publisherID = req.ixmUserInfo.id;
        } else {
            buyerID = req.ixmUserInfo.id;
            publisherID = req.body.partner_id;
        }

        Log.trace(`User is a ${userType} with ID ${req.ixmUserInfo.id}.`, req.id);

        // Confirm that the proposal is available and belongs to one of buyer or publisher
        let proposalID = req.body.proposal_id;
        let targetProposal = await proposedDealManager.fetchProposedDealFromId(proposalID);

        if (!targetProposal) {
            throw HTTPError('404_PROPOSAL_NOT_FOUND');
        }

        if (targetProposal.ownerID !== publisherID && targetProposal.ownerID !== buyerID) {
            Log.trace('Proposal does not belong to neither, the publisher or the buyer');
            throw HTTPError('403_BAD_PROPOSAL');
        }

        // Check whether there are negotiations started already between the users at stake
        let currentNegotiation = await negotiatedDealManager.fetchNegotiatedDealFromIds(proposalID, buyerID, publisherID);

        // If the negotiation had not started yet, then it gets created
        if (!currentNegotiation) {

            // A buyer cannot accept or reject a negotiation that doesn't exist.
            if (responseType !== 'counter-offer') {
                throw HTTPError('403_NO_NEGOTIATION');
            }

            currentNegotiation = await negotiatedDealManager.createNegotiationFromProposedDeal(
                                        targetProposal, buyerID, publisherID, 'buyer');

            let fieldChanged = currentNegotiation.update('buyer', 'accepted', 'active', negotiationFields);

            if (!fieldChanged) {
                throw HTTPError('403_NO_CHANGE');
            }

            if (!targetProposal.isPurchasableByUser(req.ixmUserInfo)) {
                throw HTTPError('403_NOT_FORSALE');
            }

            await negotiatedDealManager.insertNegotiatedDeal(currentNegotiation);

            Log.trace(`Inserted the new negotiation with ID: ${currentNegotiation.id}`, req.id);

        } else {

            Log.trace('Found negotiation with ID: ' + currentNegotiation.id, req.id);

            let otherPartyStatus = userType === 'buyer' ? currentNegotiation.publisherStatus : currentNegotiation.buyerStatus;
            let currentNegotiationStatus = userType === 'buyer' ? currentNegotiation.buyerStatus : currentNegotiation.publisherStatus;

            // Check that proposal has not been bought yet
            if (currentNegotiation.buyerStatus === 'accepted' && currentNegotiation.publisherStatus === 'accepted') {
                throw HTTPError('403_PROPOSAL_BOUGHT');
            }

            // Check if the negotiation has been rejected by any party
            if (otherPartyStatus === 'rejected') {
                throw HTTPError('403_OTHER_REJECTED');
            }

            // Check if you have already rejected
            if (currentNegotiationStatus === 'rejected') {
                throw HTTPError('403_ALREADY_REJECTED');
            }

            // Check if the user is out of turn
            if (currentNegotiation.sender === userType && responseType !== 'reject') {
                throw HTTPError('403_OUT_OF_TURN');
            }

            // If user rejects the negotiation, there is nothing more to do:
            if (responseType === 'reject') {

                Log.trace('User is rejecting the negotiation', req.id);

                currentNegotiation.update(userType, 'rejected', otherPartyStatus);
                await negotiatedDealManager.updateNegotiatedDeal(currentNegotiation);

            } else if (responseType === 'accept') {

                Log.trace('User is accepting the negotiation', req.id);

                Log.debug(`Beginning transaction, updating negotiation ${currentNegotiation.id} and inserting settled deal...`, req.id);

                await databaseManager.transaction(async (transaction) => {

                    currentNegotiation.update(userType, 'accepted', 'accepted');
                    await negotiatedDealManager.updateNegotiatedDeal(currentNegotiation, transaction);

                    let buyerIXMInfo = await buyerManager.fetchBuyerFromId(buyerID);
                    let settledDeal = settledDealManager.createSettledDealFromNegotiation(currentNegotiation, buyerIXMInfo.dspIDs[0]);

                    await settledDealManager.insertSettledDeal(settledDeal, transaction);

                    Log.trace(`New deal created with id ${settledDeal.id}.`, req.id);

                    res.sendPayload(settledDeal.toPayload(req.ixmUserInfo.userType));
                });

                return;

            } else {

                Log.trace(`User has sent a counter-offer.`, req.id);

                let fieldChanged = currentNegotiation.update(userType, 'accepted', 'active', negotiationFields);

                if (fieldChanged) {
                    Log.trace(`Fields have changed, updating negotiation.`, req.id);
                    await negotiatedDealManager.updateNegotiatedDeal(currentNegotiation);
                } else {
                    throw HTTPError('403_NO_CHANGE');
                }

            }
        }

        res.sendPayload(currentNegotiation.toPayload(req.ixmUserInfo.userType));

    } catch (error) { next(error); } });
}

module.exports = NegotiationDeals;

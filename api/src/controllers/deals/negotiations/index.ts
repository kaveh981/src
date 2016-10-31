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

const proposedDealManager = Injector.request<ProposedDealManager>('ProposedDealManager');
const negotiatedDealManager = Injector.request<NegotiatedDealManager>('NegotiatedDealManager');
const settledDealManager = Injector.request<SettledDealManager>('SettledDealManager');
const buyerManager = Injector.request<BuyerManager>('BuyerManager');
const userManager = Injector.request<UserManager>('UserManager');
const validator = Injector.request<RamlTypeValidator>('Validator');
const databaseManager = Injector.request<DatabaseManager>('DatabaseManager');

const Log: Logger = new Logger('NEGO');

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

        let buyerID = Number(req.ixmUserInfo.id);
        let negotiatedDeals = await negotiatedDealManager.fetchNegotiatedDealsFromBuyerId(buyerID, pagination);
        let activeNegotiatedDeals: NegotiatedDealModel[] = [];

        for (let i = 0; i < negotiatedDeals.length; i++) {
            let proposal = negotiatedDeals[i].proposedDeal;
            let owner = await userManager.fetchUserFromId(proposal.ownerID);

            if ( (negotiatedDeals[i].buyerStatus === 'active' || negotiatedDeals[i].publisherStatus === 'active')
                && proposal.isAvailable() && owner.status === 'A' ) {
                    activeNegotiatedDeals.push(negotiatedDeals[i]);
            }
        }

        if (activeNegotiatedDeals.length > 0) {
            res.sendPayload(activeNegotiatedDeals.map((deal) => { return deal.toPayload(); }), pagination);
        } else {
            res.sendError('200_NO_NEGOTIATIONS');
        }

    } catch (error) { next(error); } });

    /*
     * GET Request for both users, buyers and publishers, to get a list of deal negotiations by providing a proposalID
     */
    router.get('/:proposalID', ProtectedRoute, async (req: express.Request, res: express.Response, next: Function) => { try {

        // Validate proposalID
        let proposalID = Number(req.params.proposalID);
        let proposalValidationErrors = validator.validateType(proposalID, 'SpecificProposalParameter');

        if (proposalValidationErrors.length > 0) {
            throw HTTPError('404_PROPOSAL_NOT_FOUND');
        }

        // Check proposal exists based on proposalID
        let proposal = await proposedDealManager.fetchProposedDealFromId(proposalID);

        if (!proposal) {
            throw HTTPError('404_PROPOSAL_NOT_FOUND');
        }

        // Validate pagination parameters
        let pagination = {
            limit: req.query.limit,
            offset: req.query.offset
        };

        let paginationValidationErrors = validator.validateType(pagination, 'Pagination',
                               { fillDefaults: true, forceOnError: ['TYPE_NUMB_TOO_LARGE'], sanitizeIntegers: true });

        if (paginationValidationErrors.length > 0) {
            throw HTTPError('400', paginationValidationErrors);
        }

        let userID = Number(req.ixmUserInfo.id);
        let negotiatedDeals = await negotiatedDealManager.fetchNegotiatedDealsFromProposalId(userID, proposalID);

        if (negotiatedDeals && negotiatedDeals.length > 0) {
            res.sendPayload(negotiatedDeals.map((deal) => { return deal.toPayload(); }), pagination);
        } else {
            throw HTTPError('200_NO_NEGOTIAITIONS');
        }

    } catch (error) { next(error); } });

    /**
     * PUT request to accept a deal and insert it into the database to activate it.
     */
    router.put('/', ProtectedRoute, async (req: express.Request, res: express.Response, next: Function) => { try {

        // Validate the request's parameters syntax
        let validationErrors = validator.validateType(req.body, 'NegotiateDealRequest',
                                { sanitizeString: true, fillDefaults: true, removeNull: true });

        if (validationErrors.length > 0) {
            throw HTTPError('400', validationErrors);
        }

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
            buyerID = Number(req.body.partner_id);
            publisherID = Number(req.ixmUserInfo.id);
        } else {
            buyerID = Number(req.ixmUserInfo.id);
            publisherID = Number(req.body.partner_id);
        }

        Log.trace(`User is a ${userType} with ID ${req.ixmUserInfo.id}.`);

        // Confirm that the proposal is available and belongs to this publisher
        let proposalID = Number(req.body.proposal_id);
        let targetProposal = await proposedDealManager.fetchProposedDealFromId(proposalID);

        if (!targetProposal) {
            throw HTTPError('404_PROPOSAL_NOT_FOUND');
        }

        // Confirm that proposal is from the same publisher as negotiation request
        if (targetProposal.ownerID !== publisherID) {
            Log.trace(`Proposal belongs to ${targetProposal.ownerID}, not to ${publisherID}.`);
            throw HTTPError('403_BAD_PROPOSAL');
        }

        // Check whether there are negotiations started already between the users at stake
        let currentNegotiation = await negotiatedDealManager.fetchNegotiatedDealFromIds(proposalID, buyerID, publisherID);

        // If the negotiation had not started yet, then it gets created
        if (!currentNegotiation) {

            // Only buyers can start a negotiation
            if (userType === 'publisher') {
                throw HTTPError('403_CANNOT_START_NEGOTIATION');
            }

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

            if (!targetProposal.isAvailable() || !(targetProposal.ownerInfo.status === 'A')) {
                throw HTTPError('403_NOT_FORSALE');
            }

            await negotiatedDealManager.insertNegotiatedDeal(currentNegotiation);

            Log.debug(`Inserted the new negotiation with ID: ${currentNegotiation.id}`);

        } else {

            Log.trace('Found negotiation with ID: ' + currentNegotiation.id);

            let otherPartyStatus = userType === 'buyer' ? currentNegotiation.publisherStatus : currentNegotiation.buyerStatus;

            // Check that proposal has not been bought yet
            if (currentNegotiation.buyerStatus === 'accepted' && currentNegotiation.publisherStatus === 'accepted') {
                throw HTTPError('403_PROPOSAL_BOUGHT');
            }

            // Check if the user is out of turn
            if (currentNegotiation.sender === userType && otherPartyStatus !== 'rejected') {
                throw HTTPError('403_OUT_OF_TURN');
            }

            // If user rejects the negotiation, there is nothing more to do:
            if (responseType === 'reject') {

                Log.trace('User is rejecting the negotiation');

                currentNegotiation.update(userType, 'rejected', otherPartyStatus);
                await negotiatedDealManager.updateNegotiatedDeal(currentNegotiation);

            } else if (responseType === 'accept') {

                Log.trace('User is accepting the negotiation');

                // Confirm that the other party hasn't closed the deal
                if (otherPartyStatus === 'rejected') {
                    throw HTTPError('403_OTHER_REJECTED');
                }

                await databaseManager.transaction(async (transaction) => {
                    Log.trace(`Beginning transaction, updating negotiation ${currentNegotiation.id} and inserting settled deal...`);

                    currentNegotiation.update(userType, 'accepted', 'accepted');
                    await negotiatedDealManager.updateNegotiatedDeal(currentNegotiation, transaction);

                    let buyerIXMInfo = await buyerManager.fetchBuyerFromId(buyerID);
                    let settledDeal = settledDealManager.createSettledDealFromNegotiation(currentNegotiation, buyerIXMInfo.dspIDs[0]);

                    await settledDealManager.insertSettledDeal(settledDeal, transaction);

                    Log.trace(`New deal created with id ${settledDeal.id}.`);

                    res.sendPayload(settledDeal.toPayload());
                });

                return;

            } else {

                Log.trace(`User has sent a counter-offer.`);

                let fieldChanged = currentNegotiation.update(userType, 'accepted', 'active', negotiationFields);

                if (fieldChanged) {
                    Log.trace(`Fields have changed, updating negotiation.`);
                    await negotiatedDealManager.updateNegotiatedDeal(currentNegotiation);
                } else {
                    throw HTTPError('403_NO_CHANGE');
                }

            }
        }

        res.sendPayload(currentNegotiation.toPayload());

    } catch (error) { next(error); } });
}

module.exports = NegotiationDeals;

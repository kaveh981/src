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
import { UserModel } from '../../../models/user/user-model';
import { UserManager } from '../../../models/user/user-manager';
import { BuyerManager } from '../../../models/buyer/buyer-manager';

const proposedDealManager = Injector.request<ProposedDealManager>('ProposedDealManager');
const negotiatedDealManager = Injector.request<NegotiatedDealManager>('NegotiatedDealManager');
const settledDealManager = Injector.request<SettledDealManager>('SettledDealManager');
const buyerManager = Injector.request<BuyerManager>('BuyerManager');
const userManager = Injector.request<UserManager>('UserManager');
const validator = Injector.request<RamlTypeValidator>('Validator');

const Log: Logger = new Logger('ACTD');

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

        let pagination = {
            limit: req.query.limit,
            offset: req.query.offset
        };

        let validationErrors = validator.validateType(pagination, 'Pagination',
                                { fillDefaults: true, forceOnError: ['TYPE_NUMB_TOO_LARGE'] });

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

    /**
     * PUT request to accept a deal and insert it into the database to activate it.
     */
    router.put('/', ProtectedRoute, async (req: express.Request, res: express.Response, next: Function) => { try {

        let responseType: string;
        // Sanitize data: response is validated case-insensitively and by trailing spaces
        negotiationOrResponse:
            if (req.body.hasOwnProperty('response')) {
                req.body.response = req.body.response.trim().toLowerCase();

                // There cannot be negotiation fields along with a response to an offer
                for (let key in req.body) {
                    if (req.body.hasOwnProperty(key) && key !== 'partner_id' && key !== 'proposal_id') {
                        throw HTTPError('400', 'No negotiation field can be provided along with a "Response" field, found field ' + key);
                    }
                }
                responseType = req.body.response;
                Log.trace('User is sending a response: ' + responseType);
            } else {
                responseType = 'counter-offer';
                Log.trace('User is sending a counter-offer');
                for (let key in req.body) {
                    if (req.body.hasOwnProperty(key) && key !== 'partner_id' && key !== 'proposal_id') {
                        break negotiationOrResponse;
                    }
                }

                // If there is no other field beyond partner_id and proposal_id, then the request is invalid
                throw HTTPError('400', 'At least 1 negotiation or the "response" field must be provided.');
            }

        // Validate the request's parameters syntax
        let validationErrors = validator.validateType(req.body, 'NegotiateDealRequest');

        if (validationErrors.length > 0) {
            throw HTTPError('400', validationErrors);
        }

        // Check whether the user is a publisher or a buyer and populate user fields accordingly
        let userType: string = 'buyer'; // TODO - for now let's hard-code it's a buyer for simplicity sake until the middleware is fixed
        let buyerID: number;
        let publisherID: number;

        if (userType === 'publisher') {
            Log.trace('User is a publisher');
            buyerID = req.body.partner_id;
            publisherID = Number(req.ixmBuyerInfo.userID);
        } else {
            Log.trace('User is a buyer');
            // Route is protected so at this stage we already know that user is either a publisher or a buyer
            buyerID = Number(req.ixmBuyerInfo.userID);
            publisherID = req.body.partner_id;
            Log.trace('BuyerID is: ' + buyerID);
        }

        // Confirm that the proposal is available and belongs to this publisher
        let proposalID: number = req.body.proposal_id;
        let targetProposal: ProposedDealModel;
        targetProposal = await proposedDealManager.fetchProposedDealFromId(proposalID);

        if (!targetProposal) {
            throw HTTPError('404_PROPOSAL_NOT_FOUND');
        }

        // Confirm that proposal is from the same publisher as negotiation request
        if (targetProposal.ownerID !== publisherID) {
            Log.debug('Proposal belongs to ' + targetProposal.ownerID + ', not to sent ' + publisherID);
            throw HTTPError('403_BAD_PROPOSAL');
        }

        // Check whether there are negotiations started already between the users at stake
        let currentNegotiation: NegotiatedDealModel =
            await negotiatedDealManager.fetchNegotiatedDealFromIds(proposalID, buyerID, publisherID);

        // If the negotiation had not started yet, then it gets created
        if (!currentNegotiation) {

            // Only buyers can start a negotiation
            if (userType === 'publisher') {
                throw HTTPError('403_CANNOT_START_NEGOTIATION');
            }

            // Build the negotiation object with the core fields
            currentNegotiation = new NegotiatedDealModel({
                'buyerID': buyerID,
                'publisherID': publisherID,
                publisherStatus: 'active',
                buyerStatus: 'accepted',
                sender: 'buyer',
                proposedDeal: targetProposal
            });

            // Populate the negotiation fields
            for (let key in req.body) {
                if (req.body.hasOwnProperty(key)) {
                    Log.trace('Found key: ' + key + ' with value: ' + req.body[key]);
                    switch (key) {
                        case 'start_date':
                            currentNegotiation.startDate = req.body[key];
                            break;
                        case 'end_date':
                            currentNegotiation.endDate = req.body[key];
                            break;
                        case 'price':
                            currentNegotiation.price = req.body[key];
                            break;
                        case 'impressions':
                            currentNegotiation.impressions = req.body[key];
                            break;
                        case 'budget':
                            currentNegotiation.budget = req.body[key];
                            break;
                        case 'terms':
                            currentNegotiation.terms = req.body[key];
                            break;
                        default:
                            // This is not a negotiation field, nothing to do
                            break;
                    }
                }
            }

            // Check that the proposal is available for purchase
            let owner = await userManager.fetchUserFromId(targetProposal.ownerID);
            if (!targetProposal.isAvailable() || !(owner.status === 'A')) {
                Log.debug('Proposal is not available for sale');
                throw HTTPError('403_NOT_FORSALE');
            }

            currentNegotiation.publisherInfo = owner;
            let buyer = await userManager.fetchUserFromId(buyerID);
            currentNegotiation.buyerInfo = buyer;
            await negotiatedDealManager.insertNegotiatedDeal(currentNegotiation);

            Log.debug('Inserted the new negotiation with ID: ' + currentNegotiation.id);
            res.sendPayload(currentNegotiation.toPayload());

        } else {

            // Check if last offerer is same as current
            let otherPartyStatus: string = userType === 'buyer' ? currentNegotiation.publisherStatus : currentNegotiation.buyerStatus;
            if (currentNegotiation.sender === userType && otherPartyStatus !== 'rejected') {
                throw HTTPError('403_OUT_OF_TURN');
            }

            // Check that proposal has not been bought yet
            if (currentNegotiation.buyerStatus === 'accepted' && currentNegotiation.publisherStatus === 'accepted') {
                throw HTTPError('403_PROPOSAL_BOUGHT');
            }

            // If user rejects the negotiation, there is nothing more to do:
            if (responseType === 'reject') {
                Log.debug('User is rejecting the negotiation');
                currentNegotiation.modifyDate = await negotiatedDealManager.updateNegotiatedDeal(currentNegotiation.id, userType, responseType,
                    { }, otherPartyStatus);
                res.sendPayload(currentNegotiation.toPayload());
            } else if (responseType === 'accept') {
                Log.debug('User is rejecting the negotiation');

                // Confirm that the other party hasn't closed the deal
                if (otherPartyStatus === 'rejected') {
                    throw HTTPError('403_OTHER_REJECTED');
                }

                // Finalize the negotiation and create the settled deal
                // TODO: this belongs in a transaction
                currentNegotiation.modifyDate = await negotiatedDealManager.updateNegotiatedDeal(currentNegotiation.id, userType, responseType,
                    { }, otherPartyStatus);
                Log.debug('Negotiation updated');
                let buyerIXMInfo = await buyerManager.fetchBuyerFromId(buyerID);
                let settledDeal = settledDealManager.createSettledDealFromNegotiation(currentNegotiation, buyerIXMInfo.dspIDs[0]);
                await settledDealManager.insertSettledDeal(settledDeal);
                Log.debug('New deal created with id: ' + settledDeal.id);

                res.sendPayload(settledDeal.toPayload());
            }
            else {

                // This is a negotiation, let's populate the relevant fields and confirm there exists at least 1 difference
                let negotiationFields: any = { };
                let hasDifferentField: boolean = false;

                for (let key in req.body) {
                    if (req.body.hasOwnProperty(key)) {
                        switch (key) {
                            case 'start_date':
                                negotiationFields.startDate = req.body[key];
                                if ( negotiationFields.startDate !== currentNegotiation.startDate ) {
                                    hasDifferentField = true;
                                }
                                break;
                            case 'end_date':
                                negotiationFields.endDate = req.body[key];
                                if ( negotiationFields.endDate !== currentNegotiation.endDate ) {
                                    hasDifferentField = true;
                                }
                                break;
                            case 'price':
                                negotiationFields.price = req.body[key];
                                if ( negotiationFields.price !== currentNegotiation.startDate ) {
                                    hasDifferentField = true;
                                }
                                break;
                            case 'impressions':
                                negotiationFields.impressions = req.body[key];
                                if ( negotiationFields.impressions !== currentNegotiation.startDate ) {
                                    hasDifferentField = true;
                                }
                                break;
                            case 'budget':
                                negotiationFields.budget = req.body[key];
                                if ( negotiationFields.budget !== currentNegotiation.startDate ) {
                                    hasDifferentField = true;
                                }
                                break;
                            case 'terms':
                                negotiationFields.terms = req.body[key];
                                if ( negotiationFields.terms !== currentNegotiation.startDate ) {
                                    hasDifferentField = true;
                                }
                                break;
                            default:
                                // This is not a negotiation field, nothing to do
                                break;
                        }
                    }
                }

                // Update the negotiation
                currentNegotiation.modifyDate = await negotiatedDealManager.updateNegotiatedDeal(currentNegotiation.id, userType, responseType,
                    negotiationFields, otherPartyStatus);
                res.sendPayload(currentNegotiation.toPayload());
            }

        }

    } catch (error) { next(error); } });
}

module.exports = NegotiationDeals;

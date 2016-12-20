'use strict';

import * as express from 'express';

import { Logger } from '../../../lib/logger';
import { Injector } from '../../../lib/injector';
import { RamlTypeValidator } from '../../../lib/raml-type-validator';
import { HTTPError } from '../../../lib/http-error';
import { ProtectedRoute } from '../../../middleware/protected-route';

import { ProposedDealManager } from '../../../models/deals/proposed-deal/proposed-deal-manager';
import { NegotiatedDealManager } from '../../../models/deals/negotiated-deal/negotiated-deal-manager';
import { SettledDealManager } from '../../../models/deals/settled-deal/settled-deal-manager';
import { DatabaseManager } from '../../../lib/database-manager';
import { BuyerManager } from '../../../models/buyer/buyer-manager';
import { Notifier } from '../../../lib/notifier';

const proposedDealManager = Injector.request<ProposedDealManager>('ProposedDealManager');
const negotiatedDealManager = Injector.request<NegotiatedDealManager>('NegotiatedDealManager');
const settledDealManager = Injector.request<SettledDealManager>('SettledDealManager');
const buyerManager = Injector.request<BuyerManager>('BuyerManager');
const validator = Injector.request<RamlTypeValidator>('Validator');
const databaseManager = Injector.request<DatabaseManager>('DatabaseManager');
const notifier = Injector.request<Notifier>('Notifier');

const Log: Logger = new Logger('ROUT');

/**
 * Function that takes care of PUT /deals/negotiation routes  
 */
function NegotiationDeals(router: express.Router): void {

    /**
     * PUT request to send a counter-offer to a negotiation/proposal, or to accept/reject a negotiation
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
        let user = req.ixmUserInfo;

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

        if (!targetProposal || targetProposal.isDeleted()) {
            throw HTTPError('404_PROPOSAL_NOT_FOUND');
        } else if (targetProposal.ownerID !== publisherID && targetProposal.ownerID !== buyerID) {
            throw HTTPError('403_BAD_PROPOSAL');
        }

        // Check whether there are negotiations started already between the users at stake
        let currentNegotiation = await negotiatedDealManager.fetchNegotiatedDealFromIds(proposalID, buyerID, publisherID);

        // If the negotiation had not started yet, then it gets created
        if (!currentNegotiation) {

            if (targetProposal.ownerID === user.id || targetProposal.ownerInfo.userType === user.userType) {
                throw HTTPError('403_CANNOT_START_NEGOTIATION');
            } else if (responseType !== 'counter-offer') {
                throw HTTPError('403_NO_NEGOTIATION');
            } else if (!targetProposal.isPurchasableByUser(req.ixmUserInfo)) {
                throw HTTPError('404_PROPOSAL_NOT_FOUND');
            }

            currentNegotiation = await negotiatedDealManager.createNegotiationFromProposedDeal(targetProposal, buyerID, publisherID, 'buyer');

            let fieldChanged = currentNegotiation.update('buyer', 'accepted', 'active', negotiationFields);

            if (!fieldChanged) {
                throw HTTPError('403_NO_CHANGE');
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
            } else if (otherPartyStatus === 'rejected') {
                throw HTTPError('403_OTHER_REJECTED');
            } else if (currentNegotiationStatus === 'rejected') {
                throw HTTPError('403_ALREADY_REJECTED');
            } else if (currentNegotiation.sender === userType && responseType !== 'reject') {
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

                    let dealPartnerInfo = targetProposal.ownerInfo.userType === 'buyer' ? currentNegotiation.buyerInfo : currentNegotiation.publisherInfo;
                    let buyerIXMInfo = await buyerManager.fetchBuyerFromId(buyerID);
                    let settledDeal = settledDealManager.createSettledDealFromNegotiation(currentNegotiation, buyerIXMInfo.dspIDs[0]);

                    await settledDealManager.insertSettledDeal(settledDeal, transaction);

                    Log.trace(`New deal created with id ${settledDeal.id}.`, req.id);

                    res.sendPayload(settledDeal.toPayload(req.ixmUserInfo.userType));

                    notifier.sendNotification('NEGOTIATED_PROPOSAL_BOUGHT', dealPartnerInfo, targetProposal, settledDeal);

                });

                return;

            } else {

                Log.trace(`User has sent a counter-offer.`, req.id);

                let fieldChanged = currentNegotiation.update(userType, 'accepted', 'active', negotiationFields);

                if (!fieldChanged) {
                    throw HTTPError('403_NO_CHANGE');
                }

                Log.trace(`Fields have changed, updating negotiation.`, req.id);
                await negotiatedDealManager.updateNegotiatedDeal(currentNegotiation);

            }
        }

        res.sendPayload(currentNegotiation.toPayload(req.ixmUserInfo.userType));

    } catch (error) { next(error); } });

}

module.exports = NegotiationDeals;

'use strict';

import * as express from 'express';

import { Logger } from '../../../lib/logger';
import { Injector } from '../../../lib/injector';
import { RamlTypeValidator } from '../../../lib/raml-type-validator';
import { HTTPError } from '../../../lib/http-error';
import { Permission } from '../../../middleware/permission';

import { ProposedDealManager } from '../../../models/deals/proposed-deal/proposed-deal-manager';
import { NegotiatedDealManager } from '../../../models/deals/negotiated-deal/negotiated-deal-manager';
import { SettledDealManager } from '../../../models/deals/settled-deal/settled-deal-manager';
import { DatabaseManager } from '../../../lib/database-manager';
import { DspManager } from '../../../models/dsp/dsp-manager';
import { Notifier } from '../../../lib/notifier';

const proposedDealManager = Injector.request<ProposedDealManager>('ProposedDealManager');
const negotiatedDealManager = Injector.request<NegotiatedDealManager>('NegotiatedDealManager');
const settledDealManager = Injector.request<SettledDealManager>('SettledDealManager');
const dspManager = Injector.request<DspManager>('DspManager');
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
    router.put('/', Permission('write'), async (req: express.Request, res: express.Response, next: Function) => { try {

        /** Validation */

        // Validate the request body
        let validationErrors = validator.validateType(req.body, 'NegotiatedDealCreate',
                                { sanitizeStringEnum: true, fillDefaults: true, removeNull: true, trimStrings: true });

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

        /** Route Logic */

        // Check whether the user is a publisher or a buyer and populate user fields accordingly

        let proposalID: number = req.body.proposal_id;
        let sender = req.ixmUserInfo;
        let receiverID = req.body.partner_id;
        let currentNegotiation = await negotiatedDealManager.fetchNegotiatedDealFromPartyIds(proposalID, receiverID, sender.company.id);

        // If the negotiation had not started yet, then it gets created
        if (!currentNegotiation) {

            let targetProposal = await proposedDealManager.fetchProposedDealFromId(proposalID);

            if (!targetProposal || !targetProposal.isReadableByUser(sender)) {
                throw HTTPError('404_PROPOSAL_NOT_FOUND');
            } else if (targetProposal.owner.company.id !== receiverID) {
                throw HTTPError('403_BAD_PROPOSAL');
            } else if (!targetProposal.isPurchasableByUser(sender)) {
                throw HTTPError('403_CANNOT_START_NEGOTIATION');
            } else if (responseType !== 'counter-offer') {
                throw HTTPError('403_NO_NEGOTIATION');
            }

            currentNegotiation = await negotiatedDealManager.createNegotiationFromProposedDeal(targetProposal, sender, 'partner');

            let fieldChanged = currentNegotiation.update('partner', 'accepted', 'active', negotiationFields);

            if (!fieldChanged) {
                throw HTTPError('403_NO_CHANGE');
            }

            await databaseManager.transaction(async (transaction) => {

                await negotiatedDealManager.insertNegotiatedDeal(currentNegotiation);

                res.sendPayload(currentNegotiation.toPayload(sender));

            });

            Log.trace(`Inserted the new negotiation with ID: ${currentNegotiation.id}`, req.id);

        } else {
            // A negotiation already exists
            Log.trace('Found negotiation with ID: ' + currentNegotiation.id, req.id);

            let partnerID = currentNegotiation.partner.company.id;
            let receiver =  receiverID === partnerID ? currentNegotiation.partner : currentNegotiation.proposedDeal.owner;
            let senderType: 'owner' | 'partner' = receiverID === partnerID ? 'owner' : 'partner';
            let senderStatus = receiverID === partnerID ? currentNegotiation.ownerStatus : currentNegotiation.partnerStatus;
            let receiverStatus = receiverID === partnerID ? currentNegotiation.partnerStatus : currentNegotiation.ownerStatus;

            // Check that proposal has not been bought yet
            if (senderStatus === 'accepted' && receiverStatus === 'accepted') {
                throw HTTPError('403_PROPOSAL_BOUGHT');
            } else if (receiverStatus === 'rejected') {
                throw HTTPError('403_OTHER_REJECTED');
            } else if (senderStatus === 'rejected') {
                throw HTTPError('403_ALREADY_REJECTED');
            } else if (currentNegotiation.sender === senderType && responseType !== 'reject') {
                throw HTTPError('403_OUT_OF_TURN');
            } else if (!currentNegotiation.isActive()) {
                throw HTTPError('403_NEGOTIATION_NOT_ACTIVE');
            }

            // If user rejects the negotiation, there is nothing more to do:
            if (responseType === 'reject') {

                Log.trace('User is rejecting the negotiation', req.id);

                currentNegotiation.update(senderType, 'rejected', receiverStatus);

                await databaseManager.transaction(async (transaction) => {

                    await negotiatedDealManager.updateNegotiatedDeal(currentNegotiation, transaction);

                    res.sendPayload(currentNegotiation.toPayload(sender));

                });

            } else if (responseType === 'accept') {

                Log.trace('User is accepting the negotiation', req.id);

                if (!currentNegotiation.isValid()) {
                    throw HTTPError('403_CANT_ACCEPT');
                }

                Log.debug(`Beginning transaction, updating negotiation ${currentNegotiation.id} and inserting settled deal...`, req.id);

                await databaseManager.transaction(async (transaction) => {

                    let dspID = await dspManager.fetchDspIdByCompanyId(sender.isBuyer() ? sender.company.id : receiver.company.id);
                    let settledDeal = settledDealManager.createSettledDealFromNegotiation(currentNegotiation, dspID);
                    currentNegotiation.update(senderType, 'accepted', 'accepted');

                    await negotiatedDealManager.updateNegotiatedDeal(currentNegotiation, transaction);
                    await settledDealManager.insertSettledDeal(settledDeal, transaction);

                    Log.trace(`New deal created with id ${settledDeal.id}.`, req.id);

                    notifier.sendNotification('NEGOTIATED_PROPOSAL_BOUGHT', receiver.contact , currentNegotiation.proposedDeal, settledDeal);

                    res.sendPayload(settledDeal.toPayload(sender));

                });

            } else {

                Log.trace(`User has sent a counter-offer.`, req.id);

                let fieldChanged = currentNegotiation.update(senderType, 'accepted', 'active', negotiationFields);

                if (!currentNegotiation.isValid()) {
                    throw HTTPError('403_INVALID_TERMS');
                } else if (!fieldChanged) {
                    throw HTTPError('403_NO_CHANGE');
                }

                Log.trace(`Fields have changed, updating negotiation.`, req.id);

                await databaseManager.transaction(async (transaction) => {

                    await negotiatedDealManager.updateNegotiatedDeal(currentNegotiation, transaction);

                    res.sendPayload(currentNegotiation.toPayload(sender));

                });

            }
        }

    } catch (error) { next(error); } });

}

module.exports = NegotiationDeals;

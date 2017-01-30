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
import { DealSectionModel } from '../../../models/deal-section/deal-section-model';
import { DealSectionManager } from '../../../models/deal-section/deal-section-manager';
import { DatabaseManager } from '../../../lib/database-manager';
import { DspManager } from '../../../models/dsp/dsp-manager';
import { MarketUserManager } from '../../../models/market-user/market-user-manager';
import { Notifier } from '../../../lib/notifier';

const proposedDealManager = Injector.request<ProposedDealManager>('ProposedDealManager');
const negotiatedDealManager = Injector.request<NegotiatedDealManager>('NegotiatedDealManager');
const dealSectionManager = Injector.request<DealSectionManager>('DealSectionManager');
const settledDealManager = Injector.request<SettledDealManager>('SettledDealManager');
const dspManager = Injector.request<DspManager>('DspManager');
const validator = Injector.request<RamlTypeValidator>('Validator');
const databaseManager = Injector.request<DatabaseManager>('DatabaseManager');
const marketUserManager = Injector.request<MarketUserManager>('MarketUserManager');
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

        // Perform some validation on the sections being negotiated (if specified)
        let negotiatedSections: DealSectionModel[];

        if (req.body['inventory']) {
            if (req.ixmUserInfo.isBuyer()) {
                throw HTTPError('400_BUYERS_CANNOT_SPECIFY_INVENTORY');
            }

            let inventory: number[] = req.body['inventory'];

            negotiatedSections = await dealSectionManager.fetchDealSectionsByIds(inventory);

            if (negotiatedSections.length === 0) {
                throw HTTPError('404_SECTION_NOT_FOUND');
            }

            for (let i = 0; i < negotiatedSections.length; i++) {
                if (negotiatedSections[i].publisherID !== req.ixmUserInfo.company.id) {
                    throw HTTPError('403_SECTION_NOT_OWNED');
                } else if (!negotiatedSections[i].isActive()) {
                    throw HTTPError('403_SECTION_NOT_ACTIVE');
                }
            }
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

        // Need to assign actual DealSectionModel[] instead of JSON object to negotiationFields.sections
        if (negotiatedSections) {
            negotiationFields.sections = negotiatedSections;
        }

        // Confirm that the user sent fields consistent with negotiation / acceptance-rejection
        let fieldCount = Object.keys(negotiationFields).length;

        if (responseType === 'counter-offer' && fieldCount === 0) {
            throw HTTPError('400_NEGOTIATION_MISSING_NEG_FIELD');
        } else if (fieldCount > 0 && responseType !== 'counter-offer') {
            throw HTTPError('400_NEGOTIATION_EXTRA_NEG_FIELD');
        }

        /** Route Logic */

        // Check whether the user is a publisher or a buyer and populate user fields accordingly
        let proposalID: number = req.body.proposal_id;
        let receiverID = req.body.partner_id;
        let sender = req.ixmUserInfo;
        let receiver = await marketUserManager.fetchMarketUserFromId(receiverID);
        let currentNegotiation = await negotiatedDealManager.fetchNegotiatedDealFromPartyIds(proposalID, receiverID, sender.company.id);

        // If the negotiation had not started yet, then it gets created
        if (!currentNegotiation) {

            let targetProposal = await proposedDealManager.fetchProposedDealFromId(proposalID);

            if (!targetProposal || !targetProposal.isReadableByUser(sender)) {
                throw HTTPError('404_PROPOSAL_NOT_FOUND');
            } else if (sender.company.id === targetProposal.owner.company.id) {
                throw HTTPError('403_CANNOT_NEGOTIATE_OWN_PROPOSAL');
            } else if (sender.isBuyer() === receiver.isBuyer()) {
                throw HTTPError('403_CANNOT_NEGOTIATE_WITH_SAME_USERTYPE');
            } else if (targetProposal.owner.company.id !== receiverID) {
                throw HTTPError('403_NEGOTIATION_BAD_PROPOSAL');
            } else if (targetProposal.hasInvalidSections() && targetProposal.targetedUsers.length === 0) {
                throw HTTPError('403_NEGOTIATION_INVALID_SECTIONS');
            } else if (targetProposal.isExpired()) {
                throw HTTPError('403_NEGOTIATION_PROPOSAL_EXPIRED');
            } else if (responseType !== 'counter-offer') {
                throw HTTPError('403_NEGOTIATION_NOT_STARTED');
            } else if (!targetProposal.owner.isActive()) {
                throw HTTPError('403_NEGOTIATION_PARTNER_NOT_ACTIVE');
            }

            currentNegotiation = await negotiatedDealManager.createNegotiationFromProposedDeal(targetProposal, sender, 'partner');

            let fieldChanged = currentNegotiation.update('partner', 'accepted', 'active', negotiationFields);

            if (!fieldChanged) {
                throw HTTPError('403_NEGOTIATION_NO_CHANGE');
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
                throw HTTPError('403_NEGOTIATION_PROPOSAL_BOUGHT');
            } else if (receiverStatus === 'rejected') {
                throw HTTPError('403_NEGOTIATION_OTHER_REJECTED');
            } else if (senderStatus === 'rejected') {
                throw HTTPError('403_NEGOTIATION_ALREADY_REJECTED');
            } else if (currentNegotiation.sender === senderType && responseType !== 'reject') {
                throw HTTPError('403_NEGOTIATION_OUT_OF_TURN');
            } else if (!currentNegotiation.isWaiting()) {
                throw HTTPError('403_NEGOTIATION_NOT_ACTIVE');
            } else if (!receiver.isActive()) {
                throw HTTPError('403_NEGOTIATION_PARTNER_NOT_ACTIVE');
            } else if (currentNegotiation.proposedDeal.isDeleted()) {
                throw HTTPError('403_NEGOTIATION_PROPOSAL_DELETED');
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

                if (!currentNegotiation.hasOneValidSection()) {
                    throw HTTPError('403_NEGOTIATION_INVALID_SECTIONS');
                } else if (currentNegotiation.isExpired()) {
                    throw HTTPError('403_NEGOTIATION_EXPIRED');
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

                if (!currentNegotiation.hasOneValidSection() && currentNegotiation.proposedDeal.targetedUsers.length === 0) {
                    throw HTTPError('403_NEGOTIATION_INVALID_SECTIONS');
                } else if (!fieldChanged) {
                    throw HTTPError('403_NEGOTIATION_NO_CHANGE');
                } else if (currentNegotiation.isExpired()) {
                    throw HTTPError('403_NEGOTIATION_EXPIRED');
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

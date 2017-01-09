'use strict';

import * as express from 'express';

import { Logger } from '../../../lib/logger';
import { Injector } from '../../../lib/injector';
import { RamlTypeValidator } from '../../../lib/raml-type-validator';
import { HTTPError } from '../../../lib/http-error';
import { Permission } from '../../../middleware/permission';

import { SettledDealManager } from '../../../models/deals/settled-deal/settled-deal-manager';
import { SettledDealModel } from '../../../models/deals/settled-deal/settled-deal-model';
import { ProposedDealManager } from '../../../models/deals/proposed-deal/proposed-deal-manager';
import { NegotiatedDealManager } from '../../../models/deals/negotiated-deal/negotiated-deal-manager';
import { DatabaseManager } from '../../../lib/database-manager';
import { DspManager } from '../../../models/dsp/dsp-manager';
import { Notifier } from '../../../lib/notifier';

const negotiatedDealManager = Injector.request<NegotiatedDealManager>('NegotiatedDealManager');
const proposedDealManager = Injector.request<ProposedDealManager>('ProposedDealManager');
const settledDealManager = Injector.request<SettledDealManager>('SettledDealManager');
const databaseManager = Injector.request<DatabaseManager>('DatabaseManager');
const dspManager = Injector.request<DspManager>('DspManager');
const validator = Injector.request<RamlTypeValidator>('Validator');
const notifier = Injector.request<Notifier>('Notifier');

const Log: Logger = new Logger('ROUT');

/**
 * Function that takes care of PUT /deals/active routes
 */
function ActiveDeals(router: express.Router): void {

    /**
     * PUT request to accept a deal and insert it into the database to activate it.
     */
    router.put('/', Permission('write'), async (req: express.Request, res: express.Response, next: Function) => { try {

        /** Validation */

        // Validate body
        let validationErrors = validator.validateType(req.body, 'ActiveDealCreate');

        if (validationErrors.length > 0) {
            throw HTTPError('400', validationErrors);
        }

        /** Route logic */

        // Check that proposal exists
        let proposalID: number = req.body.proposal_id;
        let user = req.ixmUserInfo;
        let proposedDeal = await proposedDealManager.fetchProposedDealFromId(proposalID);

        Log.trace(`Request to buy proposal ${proposalID} for user ${user.contact.id}.`, req.id);

        if (!proposedDeal || !proposedDeal.isReadableByUser(user)) {
            throw HTTPError('404_PROPOSAL_NOT_FOUND');
        } else if (!proposedDeal.isPurchasableByUser(user)) {
            throw HTTPError('403_NOT_FORSALE');
        }

        // Check that proposal has not been bought yet by this buyer, or isn't in negotiation
        let dealNegotiation = await negotiatedDealManager.fetchNegotiatedDealFromPartyIds(proposalID, proposedDeal.owner.company.id, user.company.id);

        if (dealNegotiation) {
            Log.trace(`Found a negotiation: ${Log.stringify(dealNegotiation)}.`, req.id);

            if (dealNegotiation.partnerStatus === 'accepted' && dealNegotiation.ownerStatus === 'accepted') {
                throw HTTPError('403_PROPOSAL_BOUGHT');
            } else if (dealNegotiation.partnerStatus !== 'rejected' && dealNegotiation.ownerStatus !== 'rejected') {
                throw HTTPError('403_PROPOSAL_IN_NEGOTIATION');
            } else if (dealNegotiation.ownerStatus === 'rejected') {
                throw HTTPError('403_NEGOTIATION_REJECTED_OWNER');
            } else {
                throw HTTPError('403_NEGOTIATION_REJECTED_SELF');
            }
        }

        Log.debug(`Creating a new negotiation and inserting into rtbDeals...`, req.id);

        // Create a new negotiation
        let acceptedNegotiation = await negotiatedDealManager.createAcceptedNegotiationFromProposedDeal(proposedDeal, user, 'partner');
        let dspID = await dspManager.fetchDspIdByCompanyId(user.isBuyer() ? user.company.id : proposedDeal.owner.company.id);
        let settledDeal = settledDealManager.createSettledDealFromNegotiation(acceptedNegotiation, dspID);

        // Begin transaction
        await databaseManager.transaction(async (transaction) => {

            await negotiatedDealManager.insertNegotiatedDeal(acceptedNegotiation, transaction);

            Log.trace(`Inserted accepted negotiation ${Log.stringify(acceptedNegotiation)}`, req.id);

            await settledDealManager.insertSettledDeal(settledDeal, transaction);

            Log.trace(`Inserted settled deal ${Log.stringify(settledDeal)}`, req.id);

        });

        notifier.sendNotification('PROPOSAL_BOUGHT', proposedDeal.owner.contact, proposedDeal, settledDeal);

        res.sendPayload(settledDeal.toPayload(user));

    } catch (error) { next(error); } });

};

module.exports = ActiveDeals;

'use strict';

import * as express from 'express';

import { Logger } from '../../../lib/logger';
import { Injector } from '../../../lib/injector';
import { RamlTypeValidator } from '../../../lib/raml-type-validator';
import { HTTPError } from '../../../lib/http-error';
import { Permission } from '../../../middleware/permission';

import { ProposedDealManager } from '../../../models/deals/proposed-deal/proposed-deal-manager';
import { NegotiatedDealManager } from '../../../models/deals/negotiated-deal/negotiated-deal-manager';
import { PaginationModel } from '../../../models/pagination/pagination-model';
import { UserManager } from '../../../models/user/user-manager';

const negotiatedDealManager = Injector.request<NegotiatedDealManager>('NegotiatedDealManager');
const proposedDealManager = Injector.request<ProposedDealManager>('ProposedDealManager');
const validator = Injector.request<RamlTypeValidator>('Validator');
const userManager = Injector.request<UserManager>('UserManager');

const Log: Logger = new Logger('ROUT');

/**
 * Function that takes care of GET /deals/negotiation routes
 */
function NegotiationDeals(router: express.Router): void {

    /**
     * GET request to get all active negotiations for the user. The function first validates pagination query parameters.
     * It then retrieves all negotiations from the database and filters out all invalid ones, before returning the rest
     * of them to the requesting entity.
     */
    router.get('/', Permission('read'), async (req: express.Request, res: express.Response, next: Function) => { try {

        /** Validation */

        // Validate request query
        let validationErrors = validator.validateType(req.query, 'traits/queryParameters/pageable',
                               { fillDefaults: true, forceOnError: [ 'TYPE_NUMB_TOO_LARGE' ], sanitizeIntegers: true });

        if (validationErrors.length > 0) {
            throw HTTPError('400', validationErrors);
        }

        /** Route Logic */

        let user = req.ixmUserInfo;
        let pagination = new PaginationModel({ page: req.query.page, limit: req.query.limit }, req);
        let activeNegotiatedDeals = await negotiatedDealManager.fetchActiveNegotiatedDealsForUser(user, pagination);

        Log.trace(`Found active negotiated deals ${Log.stringify(activeNegotiatedDeals)} for ${user.contact.id}.`, req.id);

        res.sendPayload(activeNegotiatedDeals.map((deal) => { return deal.toPayload(user); }), pagination.toPayload());

    } catch (error) { next(error); } });

    /*
     * GET Request for both users, buyers and publishers, to get a list of deal negotiations by providing a proposalID
     */
    router.get('/:proposalID', Permission('read'), async (req: express.Request, res: express.Response, next: Function) => { try {

        /** Validation */

        // Validate request params
        let proposalID = Number(req.params['proposalID']);

        if (isNaN(proposalID)) {
            throw HTTPError('404_PROPOSAL_NOT_FOUND');
        }

        // Validate request query
        let validationErrors = validator.validateType(req.query, 'traits/queryParameters/pageable',
                               { fillDefaults: true, forceOnError: [ 'TYPE_NUMB_TOO_LARGE' ], sanitizeIntegers: true });

        if (validationErrors.length > 0) {
            throw HTTPError('400', validationErrors);
        }

        /** Route Logic */

        let pagination = new PaginationModel({ page: req.query.page, limit: req.query.limit }, req);
        let user = req.ixmUserInfo;
        let proposal = await proposedDealManager.fetchProposedDealFromId(proposalID);
        let negotiatedDeals = await negotiatedDealManager.fetchNegotiatedDealsFromUserProposalIds(proposalID, user.company.id, pagination);

        if (!proposal || !proposal.hasNegotiationsViewableBy(user, !!negotiatedDeals[0])) {
            throw HTTPError('404_PROPOSAL_NOT_FOUND');
        }

        Log.trace(`Found negotiated deals ${Log.stringify(negotiatedDeals)} for ${user.contact.id}.`, req.id);

        res.sendPayload(negotiatedDeals.map((deal) => { return deal.toPayload(user); }), pagination.toPayload());

    } catch (error) { next(error); } });

    /**
     * Get specific negotiation from proposal id and partner id
     */
    router.get('/:proposalID/partner/:partyID', Permission('read'), async (req: express.Request, res: express.Response, next: Function) => { try {

        /** Validation */

        // Validate request params
        let proposalID = Number(req.params.proposalID);
        let partyID = Number(req.params.partyID);

        if (isNaN(proposalID) || isNaN(partyID)) {
            throw HTTPError('404_NEGOTIATION_NOT_FOUND');
        }

        /** Route logic */

        let user = req.ixmUserInfo;
        let negotiatedDeal = await negotiatedDealManager.fetchNegotiatedDealFromPartyIds(proposalID, partyID, user.company.id);
        let proposal = await proposedDealManager.fetchProposedDealFromId(proposalID);
        let partner = await userManager.fetchUserFromId(partyID);

        Log.trace(`Found negotiation ${JSON.stringify(negotiatedDeal)} for ${user.contact.id}.`, req.id);

        if (!proposal || !proposal.hasNegotiationsViewableBy(user, !!negotiatedDeal)) {
            throw HTTPError('404_PROPOSAL_NOT_FOUND');
        } else if (!partner || !partner.isActive() && !negotiatedDeal) {
            throw HTTPError('404_PARTNER_NOT_FOUND');
        } else if (!negotiatedDeal) {
            throw HTTPError('404_NEGOTIATION_NOT_FOUND');
        }

        res.sendPayload(negotiatedDeal.toPayload(user));

    } catch (error) { next(error); } });

}

module.exports = NegotiationDeals;

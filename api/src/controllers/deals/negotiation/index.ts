'use strict';

import * as express from 'express';
import * as Promise from 'bluebird';

import { Logger } from '../../../lib/logger';
import { Injector } from '../../../lib/injector';
import { RamlTypeValidator } from '../../../lib/raml-type-validator';
import { HTTPError } from '../../../lib/http-error';
import { ProtectedRoute } from '../../../middleware/protected-route';

import { ProposedDealModel } from '../../../models/deals/proposed-deal/proposed-deal-model';
import { NegotiatedDealManager } from '../../../models/deals/negotiated-deal/negotiated-deal-manager';
import { NegotiatedDealModel } from '../../../models/deals/negotiated-deal/negotiated-deal-model';
import { UserModel } from '../../../models/user/user-model';
import { UserManager } from '../../../models/user/user-manager';
import { BuyerManager } from '../../../models/buyer/buyer-manager';

const negotiatedDealManager = Injector.request<NegotiatedDealManager>('NegotiatedDealManager');
const buyerManager = Injector.request<BuyerManager>('BuyerManager');
const userManager = Injector.request<UserManager>('UserManager');
const validator = Injector.request<RamlTypeValidator>('Validator');

const Log: Logger = new Logger('ACTD');

/**
 * Function that takes care of all /deals/negotiation routes  
 */
function NegotiationDeals(router: express.Router): void {

    /**
     * GET request to get all active negotiations for the user. The function first validates pagination query parameters. It then retrieves all
     * negotiations from the database and filters out all invalid ones, before returning the rest of them to the requesting entity.
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

        let buyerID = Number(req.ixmBuyerInfo.userID);
        let negotiatedDeals: NegotiatedDealModel[] = await negotiatedDealManager.fetchNegotiatedDealsFromBuyerId(buyerID, pagination);
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
}

module.exports = NegotiationDeals;

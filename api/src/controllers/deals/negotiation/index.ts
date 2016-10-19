'use strict'; 

import * as express from 'express'; 
import * as Promise from 'bluebird'; 

import { Logger } from '../../../lib/logger'; 
import { Injector } from '../../../lib/injector'; 
import { ConfigLoader } from '../../../lib/config-loader'; 
import { RamlTypeValidator } from '../../../lib/raml-type-validator'; 
import { ProtectedRoute } from '../../../middleware/protected-route';
import { ErrorCreator } from '../../../lib/error-creator'; 

import { ProposedDealManager } from '../../../models/deals/proposed-deal/proposed-deal-manager';
import { ProposedDealModel } from '../../../models/deals/proposed-deal/proposed-deal-model';
import { NegotiatedDealManager } from '../../../models/deals/negotiated-deal/negotiated-deal-manager';
import { NegotiatedDealModel } from '../../../models/deals/negotiated-deal/negotiated-deal-model';
import { UserModel } from '../../../models/user/user-model';
import { UserManager } from '../../../models/user/user-manager';
import { BuyerManager } from '../../../models/buyer/buyer-manager';


const negotiatedDealManager = Injector.request<NegotiatedDealManager>('NegotiatedDealManager');
const proposedDealManager = Injector.request<ProposedDealManager>('ProposedDealManager');
const buyerManager = Injector.request<BuyerManager>('BuyerManager');
//const userModel = Injector.request<UserModel>('UserModel'); 
const userManager = Injector.request<UserManager>('UserManager');
const validator = Injector.request<RamlTypeValidator>('Validator');
const errorCreator = Injector.request<ErrorCreator>('ErrorCreator');

const Log: Logger = new Logger('ACTD'); 


/**
 * Function that takes care of all /deals/negotiation routes  
 */
function NegotiationDeals(router: express.Router): void { 

    router.get('/', ProtectedRoute, Promise.coroutine(function* (req: express.Request, res: express.Response, next: Function): any {

        let pagination = {
            limit: req.query.limit,
            offset: req.query.offset
        }; 

        let validationErrors = validator.validateType(pagination, 'Pagination', 
                                { fillDefaults: true, forceOnError: ['TYPE_NUMB_TOO_LARGE'] }); 

        if (validationErrors.length > 0) { 
            Log.debug('Request is invalid'); 
            return next(errorCreator.createValidationError(validationErrors)); 
        }

        let buyerID = Number(req.ixmBuyerInfo.userID); 
        let negotiatedDeals : NegotiatedDealModel[] = yield negotiatedDealManager.fetchLatestNegotiatedDealsFromBuyerId(buyerID, pagination);
        let activeNegotiatedDeals : NegotiatedDealModel[] = []; 

        for (let i = 0; i < negotiatedDeals.length; i++) {        
                let proposal : ProposedDealModel = negotiatedDeals[i].proposedDeal; 
                let owner : UserModel = yield userManager.fetchUserFromId(proposal.ownerID);       
                if ( (negotiatedDeals[i].buyerStatus === 'active' || negotiatedDeals[i].publisherStatus === 'active') 
                    && proposal.isAvailable() && owner.status === 'A' ) { 
                        activeNegotiatedDeals.push(negotiatedDeals[i]); 
                }
        }

        if (activeNegotiatedDeals.length > 0) { 
            res.sendPayload(activeNegotiatedDeals.map((deal) => {return deal.toPayload(); }), pagination);
        } else { 
            res.sendError(200, '200_NO_DEALS'); 
        }

    }) as any); 
}

module.exports = NegotiationDeals;
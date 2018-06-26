import * as express from 'express';

import { Injector } from '../../../lib/injector';
import { RamlTypeValidator } from '../../../lib/raml-type-validator';
import { HTTPError } from '../../../lib/http-error';
import { Permission } from '../../../middleware/permission';
import { Helper } from '../../../lib/helper';

import { ProposedDealManager } from '../../../models/deals/proposed-deal/proposed-deal-manager';
import { ProposedDealModel } from '../../../models/deals/proposed-deal/proposed-deal-model';
import { MarketUserManager } from '../../../models/market-user/market-user-manager';
import { DealSectionManager } from '../../../models/deal-section/deal-section-manager';

const proposedDealManager = Injector.request<ProposedDealManager>('ProposedDealManager');
const marketUserManager = Injector.request<MarketUserManager>('MarketUserManager');
const dealSectionManager = Injector.request<DealSectionManager>('DealSectionManager');
const validator = Injector.request<RamlTypeValidator>('Validator');

function Proposals(router: express.Router): void {

    /**
     * PUT request for creating a new proposal, which can be targeted or non-targeted.
     */
    router.put('/', Permission('write'), async (req: express.Request, res: express.Response, next: Function) => { try {

        /** Validation */

        // Validate request body
        let validationErrors = validator.validateType(req.body, 'ProposedDealCreate',
                            { sanitizeStringEnum: true, fillDefaults: true, removeNull: true, trimStrings: true });

        if (validationErrors.length > 0) {
            throw HTTPError('400', validationErrors);
        }

        /** Route logic */

        let today = Helper.formatDate(Helper.currentDate());
        let user = req.ixmUserInfo;

        let proposedDeal = new ProposedDealModel({
            auctionType: req.body['auction_type'],
            budget: req.body['budget'] || null,
            description: req.body['description'] || '',
            endDate: Helper.formatDate(req.body['end_date'] || '0000-00-00'),
            impressions: req.body['impressions'] || null,
            sections: [],
            name: req.body['name'],
            owner: user,
            targetedUsers: [],
            price: req.body['price'] || null,
            startDate: Helper.formatDate(req.body['start_date'] || today),
            terms: req.body['terms'] || '',
            createDate: new Date()
        });

        // Check that partners are valid
        if (req.body['partners']) {
            for (let i = 0; i < req.body['partners'].length; i++) {
                let targetUser = await marketUserManager.fetchMarketUserFromId(req.body['partners'][i]);

                if (!targetUser) {
                    throw HTTPError('404_PARTNER_NOT_FOUND');
                } else if (!targetUser.isActive()) {
                    throw HTTPError('403_PARTNER_NOT_ACTIVE');
                } else if (targetUser.isBuyer() === user.isBuyer() || !targetUser.isCompany()) {
                    throw HTTPError('403_PARTNER_INVALID_USERTYPE');
                }

                proposedDeal.targetedUsers.push(targetUser.company.id);
            }
        }

        let dealSectionIDs = req.body['inventory'] || [];
        let isTargeted = proposedDeal.targetedUsers.length > 0;

        if (req.ixmUserInfo.isBuyer()) {
            if (!isTargeted) {
                throw HTTPError('400_BUYERS_MUST_TARGET');
            } else if (dealSectionIDs.length > 0) {
                throw HTTPError('400_BUYERS_CANNOT_SPECIFY_INVENTORY');
            }
        } else {
            if (!isTargeted && dealSectionIDs.length === 0) {
                throw HTTPError('400_SPECIFY_INVENTORY_FOR_OPEN_PROPOSAL');
            }
        }

        // Check that sections are valid
        for (let i = 0; i < dealSectionIDs.length; i++) {
            let dealSection = await dealSectionManager.fetchDealSectionById(dealSectionIDs[i]);

            if (!dealSection) {
                throw HTTPError('404_SECTION_NOT_FOUND');
            } else if (dealSection.publisherID !== user.company.id) {
                throw HTTPError('403_SECTION_NOT_OWNED');
            } else if (!dealSection.isActive() || !dealSection.allSitesValid()) {
                throw HTTPError('403_SECTION_NOT_ACTIVE');
            }

            proposedDeal.sections.push(dealSection);
        }

        // Insert the proposal into the database
        await proposedDealManager.insertProposedDeal(proposedDeal);

        res.location('/deals/proposals/' + proposedDeal.id);
        res.sendMessage('201', proposedDeal.toPayload());

    } catch (error) { next(error); } });

}

module.exports = Proposals;

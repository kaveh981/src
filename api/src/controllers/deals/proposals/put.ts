import * as express from 'express';

import { Injector } from '../../../lib/injector';
import { RamlTypeValidator } from '../../../lib/raml-type-validator';
import { HTTPError } from '../../../lib/http-error';
import { ProtectedRoute } from '../../../middleware/protected-route';
import { Helper } from '../../../lib/helper';

import { ProposedDealManager } from '../../../models/deals/proposed-deal/proposed-deal-manager';
import { UserManager } from '../../../models/user/user-manager';
import { DealSectionManager } from '../../../models/deal-section/deal-section-manager';

const proposedDealManager = Injector.request<ProposedDealManager>('ProposedDealManager');
const userManager = Injector.request<UserManager>('UserManager');
const dealSectionManager = Injector.request<DealSectionManager>('DealSectionManager');
const validator = Injector.request<RamlTypeValidator>('Validator');

function Proposals(router: express.Router): void {

    /**
     * PUT request for creating a new proposal, which can be targeted or non-targeted.
     */
    router.put('/', ProtectedRoute, async (req: express.Request, res: express.Response, next: Function) => { try {

        /** Validation */

        // Validate request params
        let validationErrors = validator.validateType(req.body, 'CreateProposalRequest',
                            { sanitizeStringEnum: true, fillDefaults: true, removeNull: true, trimStrings: true, sanitizeIntegers: true });

        if (validationErrors.length > 0) {
            throw HTTPError('400', validationErrors);
        }

        /** Route logic */

        let today = Helper.formatDate(Helper.currentDate());

        let proposalFields = {
            auctionType: req.body['auction_type'],
            budget: req.body['budget'] || null,
            contact: req.body['contact'],
            description: req.body['description'] || "",
            endDate: req.body['end_date'] || '0000-00-00',
            impressions: req.body['impressions'] || null,
            inventory: [],
            name: req.body['name'],
            ownerID: req.ixmUserInfo.id,
            ownerInfo: req.ixmUserInfo,
            partners: req.body['partners'] || [],
            price: req.body['price'] || null,
            startDate: req.body['start_date'] || today,
            terms: req.body['terms'] || ""
        };

        proposalFields.endDate = Helper.formatDate(proposalFields.endDate);
        proposalFields.startDate = Helper.formatDate(proposalFields.startDate);

        // Check that dates are valid
        if (proposalFields.endDate !== '0000-00-00' &&
                                    (proposalFields.startDate > proposalFields.endDate || proposalFields.endDate < today)) {
            throw HTTPError('400_INVALID_DATES');
        }

        let dealSectionIDs = req.body['inventory'];

        // Check that sections are valid
        for (let i = 0; i < dealSectionIDs.length; i++) {
            let dealSection = await dealSectionManager.fetchDealSectionById(dealSectionIDs[i]);

            if (!dealSection) {
                throw HTTPError('404_SECTION_NOT_FOUND');
            } else if (dealSection.publisherID !== req.ixmUserInfo.id && proposalFields.partners.indexOf(dealSection.publisherID) === -1) {
                throw HTTPError('403_SECTION_OWNED');
            } else if (dealSection.status !== 'active') {
                throw HTTPError('403_SECTION_NOT_ACTIVE');
            }

            // Check that at least one site associated with this section is active
            let allSitesInactive = true;

            for (let i = 0; i < dealSection.sites.length; i++) {
                if (dealSection.sites[i].status === 'active') {
                    allSitesInactive = false;
                    break;
                }
            }

            if (allSitesInactive) {
                throw HTTPError('403_SITES_NOT_ACTIVE');
            }

            proposalFields.inventory.push(dealSection);
        }

        // Check that partners are valid
        for (let i = 0; i < proposalFields.partners.length; i++) {
            let targetUser = await userManager.fetchUserFromId(proposalFields.partners[i]);

            if (!targetUser) {
                throw HTTPError('404_PARTNER_NOT_FOUND');
            } else if (targetUser.status !== 'active') {
                throw HTTPError('403_PARTNER_NOT_ACTIVE');
            } else if (targetUser.userType === req.ixmUserInfo.userType) {
                throw HTTPError('403_PARTNER_INVALID_USERTYPE');
            }
        }

        // Insert the proposal into the database
        let proposedDeal = await proposedDealManager.createProposedDeal(proposalFields);

        await proposedDealManager.insertProposedDeal(proposedDeal);

        res.location('/deals/proposals/' + proposedDeal.id);
        res.sendMessage('201', proposedDeal.toPayload());

    } catch (error) { next(error); } });

}

module.exports = Proposals;

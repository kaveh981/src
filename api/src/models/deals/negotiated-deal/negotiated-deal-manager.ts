'use strict';

import * as knex from 'knex';

import { DatabaseManager } from '../../../lib/database-manager';
import { NegotiatedDealModel } from './negotiated-deal-model';
import { ProposedDealModel } from '../proposed-deal/proposed-deal-model';
import { ProposedDealManager } from '../proposed-deal/proposed-deal-manager';
import { MarketUserManager } from '../../market-user/market-user-manager';
import { MarketUserModel } from '../../market-user/market-user-model';
import { PaginationModel } from '../../pagination/pagination-model';
import { DealSectionManager } from '../../deal-section/deal-section-manager';
import { Helper } from '../../../lib/helper';

/** Deal Negotiation model manager */
class NegotiatedDealManager {

    /**
     * Constructor
     * @param databaseManager - An instance of the database manager.
     * @param proposedDealManager - An instance of the ProposedDealManager.
     * @param marketUserManager - An instance of the Market User Manager.
     */
    constructor(
        private databaseManager: DatabaseManager,
        private proposedDealManager: ProposedDealManager,
        private marketUserManager: MarketUserManager,
        private dealSectionManager: DealSectionManager
    ) {}

    /**
     * Get a negotation from the primary id keys: proposalID, partnerID.
     * @param proposalID - The id of the original proposed deal.
     * @param partnerID - The id of the partner for the negotiation.
     * @returns A negotiated deal object or nothing if none can be found.
     */
    public async fetchNegotiatedDealFromIds(proposalID: number, partnerID: number): Promise<NegotiatedDealModel> {

        let rows = await this.databaseManager.select('negotiationID as id', 'partnerID', 'partnerContactID', 'startDate', 'endDate', 'terms', 'price',
                                                     'partnerStatus', 'ownerStatus', 'sender', 'createDate', 'modifyDate', 'budget', 'impressions')
                                             .from('ixmNegotiations')
                                             .where('proposalID', proposalID)
                                             .andWhere('partnerID', partnerID);

        if (!rows[0]) {
            return;
        }

        let negotiatedDeal = new NegotiatedDealModel({
            id: rows[0].id,
            partnerStatus: rows[0].partnerStatus,
            ownerStatus: rows[0].ownerStatus,
            sender: rows[0].sender,
            createDate: rows[0].createDate,
            modifyDate: rows[0].modifyDate,
            startDate: rows[0].startDate && Helper.formatDate(rows[0].startDate),
            endDate: rows[0].endDate && Helper.formatDate(rows[0].endDate),
            price: rows[0].price,
            impressions: rows[0].impressions,
            budget: rows[0].budget,
            terms: rows[0].terms
        });

        await Promise.all([ (async () => {
            negotiatedDeal.proposedDeal = await this.proposedDealManager.fetchProposedDealFromId(proposalID);
        })(), (async () => {
            negotiatedDeal.partner = await this.marketUserManager.fetchMarketUserFromId(rows[0].partnerContactID);
        })(), (async () => {
            negotiatedDeal.sections = await this.dealSectionManager.fetchSectionsFromNegotiationId(negotiatedDeal.id);
        })() ]);

        return negotiatedDeal;

    }

    /**
     * Get list of available deals in negotiation for the user  
     * @param user - The user in question.
     * @param pagination - Pagination details for this query. This function modifies this parameter by setting its nextPageURL.
     * @returns A list of negotiated deal objects.
     */
    public async fetchActiveNegotiatedDealsForUser(user: MarketUserModel, pagination: PaginationModel) {

        let query = this.databaseManager.distinct('ixmNegotiations.proposalID', 'ownerID', 'partnerID')
                                        .select()
                                        .from('ixmDealNegotiations')
                                        .join('ixmDealProposals', 'ixmDealProposals.proposalID', 'ixmDealNegotiations.proposalID')
                                        .join('users as owner', 'owner.userID', 'ixmDealProposals.ownerID')
                                        .join('users as partner', 'partner.userID', 'ixmDealNegotiations.partnerID')
                                        .where(function() {
                                            this.where('ownerID', user.company.id)
                                                .orWhere('partnerID', user.company.id);
                                        })
                                        .andWhere(function() {
                                            this.where('partnerStatus', 'accepted')
                                                .andWhere('ownerStatus', 'active')
                                                .orWhere('ownerStatus', 'accepted')
                                                .andWhere('partnerStatus', 'active');
                                        })
                                        .andWhere('ixmProposals.status', 'active')
                                        .andWhere('owner.status', 'A')
                                        .andWhere('partner.status', 'A');

        if (pagination) {
            query.limit(pagination.limit + 1).offset(pagination.getOffset());
        }

        let rows = await query;

        if (pagination) {
            if (rows.length <= pagination.limit) {
                pagination.nextPageURL = '';
            } else {
                rows.pop();
            }
        }

        // Fetch the negotiations
        let negotiatedDealArray: NegotiatedDealModel[] = [];

        await Promise.all(rows.map(async (row) => {
            let negotiatedDeal = await this.fetchNegotiatedDealFromIds(row.proposalID, row.partnerID);

            if (negotiatedDeal) {
                negotiatedDealArray.push(negotiatedDeal);
            }
        }));

        negotiatedDealArray.sort((a, b) => a.id - b.id);

        return negotiatedDealArray;

    }

    /**
     * Get proposalID specific deal negotiations from proposal id and user id 
     * @param proposalID - The id of the proposal being negotiated
     * @param partyID - The id of one of the parties.
     * @returns A list of negotiated deal objects.
     */
    public async fetchNegotiatedDealsFromUserProposalIds(proposalID: number, partyID: number, pagination: PaginationModel) {

        let query = this.databaseManager.select('ownerID', 'partnerID')
                                        .from('ixmNegotiations')
                                        .join('ixmProposals', 'ixmProposals.proposalID', 'ixmNegotiations.proposalID')
                                        .where({
                                            'ixmProposals.proposalID': proposalID,
                                            partnerID: partyID
                                        })
                                        .orWhere({
                                            'ixmProposals.proposalID': proposalID,
                                            ownerID: partyID
                                        });

        if (pagination) {
            query.limit(pagination.limit + 1).offset(pagination.getOffset());
        }

        let rows = await query;

        if (pagination) {
            if (rows.length <= pagination.limit) {
                pagination.nextPageURL = '';
            } else {
                rows.pop();
            }
        }

        // Fetch the negotiations
        let negotiatedDealArray: NegotiatedDealModel[] = [];

        await Promise.all(rows.map(async (row) => {
            let negotiatedDeal = await this.fetchNegotiatedDealFromIds(proposalID, row.partnerID);

            if (negotiatedDeal) {
                negotiatedDealArray.push(negotiatedDeal);
            }
        }));

        negotiatedDealArray.sort((a, b) => a.id - b.id);

        return negotiatedDealArray;

    }

    /**
     * Get negotiation from negotiation on proposal between two parties.
     * @param proposalID - The id of the proposal being negotiated
     * @param partyID - The id of one of the parties.
     * @param otherPartyID - The id of the other party.
     * @returns A lnegotiated deal object.
     */
    public async fetchNegotiatedDealFromPartyIds(proposalID: number, partyID: number, otherPartyID: number) {

        let rows = await this.databaseManager.select('ownerID', 'partnerID')
                                             .from('ixmNegotiations')
                                             .join('ixmProposals', 'ixmProposals.proposalID', 'ixmNegotiations.proposalID')
                                             .where({
                                                 'ixmProposals.proposalID': proposalID,
                                                 partnerID: partyID,
                                                 ownerID: otherPartyID
                                             })
                                             .orWhere({
                                                 'ixmProposals.proposalID': proposalID,
                                                 ownerID: partyID,
                                                 partnerID: otherPartyID
                                             });

        if (!rows[0]) {
            return;
        }

        let negotiatedDeal = await this.fetchNegotiatedDealFromIds(proposalID, rows[0].partnerID);

        return negotiatedDeal;

    }

    /**
     * Insert a new negotiated deal into the database, fails if the negotiated deal already has an id or else populates the id.
     * @param negotiatedDeal - The negotiated deal to insert.
     * @param transation - A knex transaction object to use.
     */
    public async insertNegotiatedDeal(negotiatedDeal: NegotiatedDealModel, transaction?: knex.Transaction) {

        if (negotiatedDeal.id) {
            throw new Error('Cannot insert a negotiated deal with an id.');
        }

        // If there is no transaction, start one.
        if (!transaction) {
            await this.databaseManager.transaction(async (trx) => {
                await this.insertNegotiatedDeal(negotiatedDeal, trx);
            });
            return;
        }

        // Creation timestamp has to be made up - MySQL only takes care of the update timestamp
        if (!negotiatedDeal.createDate) {
            negotiatedDeal.createDate = Helper.currentDate();
        }

        await transaction.insert({
            proposalID: negotiatedDeal.proposedDeal.id,
            partnerID: negotiatedDeal.partner.company.id,
            partnerContactID: negotiatedDeal.partner.contact.id,
            price: negotiatedDeal.price,
            startDate: negotiatedDeal.startDate,
            endDate: negotiatedDeal.endDate,
            budget: negotiatedDeal.budget,
            impressions: negotiatedDeal.impressions,
            terms: negotiatedDeal.terms,
            sender: negotiatedDeal.sender,
            ownerStatus: negotiatedDeal.ownerStatus,
            partnerStatus: negotiatedDeal.partnerStatus,
            createDate: negotiatedDeal.createDate,
            modifyDate: negotiatedDeal.modifyDate
        }).into('ixmNegotiations');

        // Get the id and set it in the negotiated deal object.
        let negotiationInserted = (await transaction.select('negotiationID', 'modifyDate')
                                                    .from('ixmNegotiations')
                                                    .where('proposalID', negotiatedDeal.proposedDeal.id)
                                                    .andWhere('partnerID', negotiatedDeal.partner.company.id))[0];

        negotiatedDeal.id = negotiationInserted.negotiationID;
        negotiatedDeal.modifyDate = negotiationInserted.modifyDate;

        // Insert negotiation section mappings into ixmNegotiationSectionMappings
        let sectionIDs = negotiatedDeal.sections.map((section) => { return section.id; });

        await Promise.all(sectionIDs.map((sectionID) => {
                                            return this.dealSectionManager.insertNegotiationSection(negotiatedDeal.id, sectionID, transaction);
                                         }));

    }

    /**
     * Create a negotiation from proposed deal where both parties have accepted.
     * @param proposedDeal - The proposed deal to build off of.
     * @param partner - The partner in the negotiation.
     * @param sender - The one who is sending the accepted request.
     * @returns A NegotiatedDealModel.
     */
    public async createAcceptedNegotiationFromProposedDeal(proposedDeal: ProposedDealModel, partner: MarketUserModel, sender: 'owner' | 'partner') {

        let negotiatedDeal = new NegotiatedDealModel({
            partner: partner,
            partnerStatus: 'accepted',
            ownerStatus: 'accepted',
            sender: sender,
            createDate: Helper.currentDate(),
            modifyDate: Helper.currentDate(),
            proposedDeal: proposedDeal,
            startDate: null,
            endDate: null,
            price: null,
            impressions: null,
            budget: null,
            terms: null
        });

        return negotiatedDeal;

    }

    /**
     * Create a new negotiation between a buyer and a sender.
     * @param proposedDeal - The proposed deal to build off of.
     * @param partner - The partner in the negotiation.
     * @param sender - The one who is sending the accepted request.
     * @param negotiationFields - The fields to use as the negotiation terms.
     * @returns A negotiated deal model with the appropriate fields updated.
     */
    public async createNegotiationFromProposedDeal(proposedDeal: ProposedDealModel, partner: MarketUserModel, sender: 'owner' | 'partner',
                                                                                                              negotiationFields: any = {}) {

        let negotiatedDeal = new NegotiatedDealModel({
            partnerStatus: sender === 'partner' ? 'accepted' : 'active',
            ownerStatus: sender === 'partner' ? 'active' : 'accepted',
            partner: partner,
            sender: sender,
            createDate: Helper.currentDate(),
            modifyDate: Helper.currentDate(),
            proposedDeal: proposedDeal,
            startDate: negotiationFields.startDate || null,
            endDate: negotiationFields.endDate || null,
            price: negotiationFields.price || null,
            impressions: negotiationFields.impressions || null,
            budget: negotiationFields.budget || null,
            terms: negotiationFields.terms || null,
            sections: proposedDeal.sections || [],
            oldSections: proposedDeal.sections.map((section) => { return section.id; })
        });

        return negotiatedDeal;

    }

    /**
     * Update a negotiation with new parameters sent in the request and return new modifyDate
     * @param negotiatedDeal - The negotiated deal to update.
     * @param transaction - An optional transaction to use. 
     * @param currentSectionIds - the current mapping of sections to this negotiation
     */
    public async updateNegotiatedDeal(negotiatedDeal: NegotiatedDealModel, transaction?: knex.Transaction) {

        if (!negotiatedDeal.id) {
            throw new Error('Cannot update a negotiated deal without an id.');
        }

        // If there is no transaction, start one.
        if (!transaction) {
            await this.databaseManager.transaction(async (trx) => {
                await this.updateNegotiatedDeal(negotiatedDeal, trx);
            });
            return;
        }

        await transaction.from('ixmNegotiations').update({
            proposalID: negotiatedDeal.proposedDeal.id,
            partnerID: negotiatedDeal.partner.company.id,
            partnerContactID: negotiatedDeal.partner.contact.id,
            price: negotiatedDeal.price,
            startDate: negotiatedDeal.startDate,
            endDate: negotiatedDeal.endDate,
            budget: negotiatedDeal.budget,
            impressions: negotiatedDeal.impressions,
            terms: negotiatedDeal.terms,
            sender: negotiatedDeal.sender,
            partnerStatus: negotiatedDeal.partnerStatus,
            ownerStatus: negotiatedDeal.ownerStatus,
            createDate: negotiatedDeal.createDate,
            modifyDate: negotiatedDeal.modifyDate
        }).where('negotiationID', negotiatedDeal.id);

        // Get the id and set it in the negotiated deal object.
        let negotiationUpdated = (await transaction.select('negotiationID', 'modifyDate')
                                                   .from('ixmNegotiations')
                                                   .where('proposalID', negotiatedDeal.proposedDeal.id)
                                                   .andWhere('partnerID', negotiatedDeal.partner.company.id))[0];

        negotiatedDeal.id = negotiationUpdated.negotiationID;
        negotiatedDeal.modifyDate = negotiationUpdated.modifyDate;

        if (negotiatedDeal.sectionsUpdated()) {
            let newSectionIds: number[] = negotiatedDeal.sections.map((section) => { return section.id; });
            let sectionDiff: ArrayDiffResult = negotiatedDeal.getSectionDiff(newSectionIds);

            // Update ixmNegotiationSectionMappings without causing duplicate insert attempts using sectionDiff
            await this.dealSectionManager.removeSectionsFromNegotiation(negotiatedDeal.id, sectionDiff.removed, transaction);

            for (let i = 0; i < sectionDiff.added.length; i++) {
                let sectionID = sectionDiff.added[i];
                await this.dealSectionManager.insertNegotiationSection(negotiatedDeal.id, sectionID, transaction);
            }
        }

    }

    /**
     * Set the ownerStatus to deleted on all negotiation with this proposalID.
     * @param proposalID - The ID of the proposal.
     * @param transaction - knex.Transaction 
     */
    public async deleteOwnerNegotiationsFromProposalId(proposalID: number, transaction?: knex.Transaction) {

        // If there is no transaction, start one.
        if (!transaction) {
            await this.databaseManager.transaction(async (trx) => {
                await this.deleteOwnerNegotiationsFromProposalId(proposalID, trx);
            });
            return;
        }

        await transaction.from('ixmNegotiations')
                         .update({
                             ownerStatus: 'deleted'
                         })
                         .where('proposalID', proposalID);

    }

}

export { NegotiatedDealManager };

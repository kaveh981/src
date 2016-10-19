'use strict';

import * as Promise from 'bluebird';

import { DatabaseManager } from '../../../lib/database-manager';
import { Logger } from '../../../lib/logger';
import { NegotiatedDealModel } from './negotiated-deal-model';
import { ProposedDealModel } from '../proposed-deal/proposed-deal-model';
import { ProposedDealManager } from '../proposed-deal/proposed-deal-manager';
import { UserManager } from '../../user/user-manager';

/** Deal Negotiation model manager */
class NegotiatedDealManager {

    /** Internal databaseManager  */
    private databaseManager: DatabaseManager;

    /** Internal proposed deal manager */
    private proposedDealManager: ProposedDealManager;

    /** Internal user manager */
    private userManager: UserManager;

    /**
     * Constructor
     * @param databaseManager - An instance of the database manager.
     * @param proposedDealManager - An instance of the ProposedDealManager.
     * @param userManager - An instance of the User Manager.
     */
    constructor(databaseManager: DatabaseManager, proposedDealManager: ProposedDealManager, userManager: UserManager) {
        this.databaseManager = databaseManager;
        this.proposedDealManager = proposedDealManager;
        this.userManager = userManager;
    }

    /**
     * Get a negotation from the primary id keys.
     * @param proposalID - The id of the original proposed deal.
     * @param buyerID - The id of the buyer of the negotiation.
     * @param publisherID - The id of the publisher of the negotiation.
     * @returns A negotiated deal object.
     */
    public fetchNegotiatedDealFromIds = Promise.coroutine(function* (proposalID: number, buyerID: number, publisherID: number) {

        let rows = yield this.databaseManager.select('negotiationID as id', 'buyerID', 'publisherID', 'startDate', 'endDate', 'terms',
                'price', 'pubStatus as publisherStatus', 'buyerStatus', 'sender', 'createDate', 'modifyDate', 'budget', 'impressions')
            .from('ixmDealNegotiations')
            .where('packageID', proposalID)
            .andWhere('buyerID', buyerID)
            .andWhere('publisherID', publisherID);

        if (!rows[0]) {
            return;
        }

        let negotiatedDeal = new NegotiatedDealModel(rows[0]);
        negotiatedDeal.proposedDeal = yield this.proposedDealManager.fetchProposedDealFromId(proposalID);
        negotiatedDeal.buyerInfo = yield this.userManager.fetchUserFromId(negotiatedDeal.buyerID);
        negotiatedDeal.publisherInfo = yield this.userManager.fetchUserFromId(negotiatedDeal.publisherID);

        return negotiatedDeal;

    }.bind(this)) as (proposalID: number, buyerID: number, publisherID: number) => Promise<NegotiatedDealModel>;

    /**
     * Get list of latest deals in negotiation for the buyer  
     * @param buyerID - The id of the buyer of the negotiation.
     * @returns A list of negotiated deal object.
     */
    public fetchLatestNegotiatedDealsFromBuyerId = Promise.coroutine(function* (buyerID: number, pagination: any) {

        //extra proposalID field in query; proposalID not in NegotiatedDealModel
        let rows = yield this.databaseManager.max('negotiationID as id').select('proposalID', 'buyerID', 'publisherID', 'startDate', 'endDate', 'terms',
                'price', 'pubStatus as publisherStatus', 'buyerStatus', 'sender', 'createDate', 'modifyDate', 'budget', 'impressions')
            .from('ixmDealNegotiations')
            .where('buyerID', buyerID)
            .limit(pagination.limit)
            .offset(pagination.offset)
            .groupBy('proposalID', 'publisherID', 'buyerID');

        let negotiatedDealArray = new Array<NegotiatedDealModel>();   
        rows.forEach(function* (element, index, array) { 
                let negotiatedDeal = new NegotiatedDealModel(element);
                negotiatedDeal.proposedDeal = yield this.proposedDealManager.fetchProposedDealFromId(element.proposalID);
                negotiatedDeal.buyerInfo = yield this.userManager.fetchUserFromId(negotiatedDeal.buyerID);
                negotiatedDeal.publisherInfo = yield this.userManager.fetchUserFromId(negotiatedDeal.publisherID);
                //delete extra field from query in NegotiatedDealModel
                delete negotiatedDeal["proposalID"];
                negotiatedDealArray.push(negotiatedDeal); 
        });  

        return negotiatedDealArray;

    }.bind(this)) as (buyerID: number, pagination: any) => Promise<NegotiatedDealModel[]>;

    /**
     * Insert a new negotiated deal into the database, fails if the negotiated deal already has an id or else populates the id.
     * @param negotiatedDeal - The negotiated deal to insert.
     */
    public insertNegotiatedDeal = Promise.coroutine(function* (negotiatedDeal: NegotiatedDealModel) {

        if (negotiatedDeal.id) {
            throw new Error('A negotiated deal with that id already exists.');
        }

        yield this.databaseManager.insert({
            packageID: negotiatedDeal.proposedDeal.id,
            publisherID: negotiatedDeal.publisherID,
            buyerID: negotiatedDeal.buyerID,
            price: negotiatedDeal.price,
            startDate: negotiatedDeal.startDate,
            endDate: negotiatedDeal.endDate,
            budget: negotiatedDeal.budget,
            impressions: negotiatedDeal.impressions,
            terms: negotiatedDeal.terms,
            sender: negotiatedDeal.sender,
            pubStatus: negotiatedDeal.publisherStatus,
            buyerStatus: negotiatedDeal.buyerStatus,
            createDate: negotiatedDeal.createDate,
            modifyDate: negotiatedDeal.modifyDate
        }).into('ixmDealNegotiations');

        // Get the id and set it in the negotiated deal object.
        let negotiationId = (yield this.databaseManager.select('negotiationID').from('ixmDealNegotiations')
                                      .where('packageID', negotiatedDeal.proposedDeal.id)
                                      .andWhere('buyerID', negotiatedDeal.buyerID)
                                      .andWhere('publisherID', negotiatedDeal.publisherID))[0].negotiationID;

        negotiatedDeal.id = negotiationId;

    }) as (negotiatedDeal: NegotiatedDealModel) => void;

    /**
     * Create a negotiation from proposed deal where both parties have accepted.
     * @param proposedDeal - The proposed deal to build off of.
     * @param buyerID - The id of the buyer of the proposal.
     * @returns A NegotiatedDealModel.
     */
    public createAcceptedNegotiationFromProposedDeal = Promise.coroutine(function* (proposedDeal: ProposedDealModel, buyerID: number) {

        let negotiatedDeal = new NegotiatedDealModel({
            buyerID: buyerID,
            buyerInfo: yield this.userManager.fetchUserFromId(buyerID),
            publisherID: proposedDeal.ownerID,
            publisherInfo: proposedDeal.ownerInfo,
            publisherStatus: 'accepted',
            buyerStatus: 'accepted',
            sender: 'buyer',
            createDate: this.dateToMysqlTimestamp(new Date()),
            modifyDate: this.dateToMysqlTimestamp(new Date()),
            proposedDeal: proposedDeal,
            startDate: proposedDeal.startDate,
            endDate: proposedDeal.endDate,
            price: proposedDeal.price,
            impressions: proposedDeal.impressions,
            budget: proposedDeal.budget,
            terms: proposedDeal.terms
        });

        return negotiatedDeal;

    }.bind(this)) as (proposedDeal: ProposedDealModel, buyerID: number) => Promise<NegotiatedDealModel>;

    /**
     * Changes the date format to yyyy-mm-dd hh:mm:ss (MySQL datetime format)
     * @param date - The date in ISO format
     * @returns A strign with the date in the format of yyyy-mm-dd hh:mm:ss
     */
    private dateToMysqlTimestamp(date: string | Date): string {

        date = new Date(date);

        return date.getFullYear() + '-' +
            ('00' + (date.getMonth() + 1)).slice(-2) + '-' +
            ('00' + date.getDate()).slice(-2) + ' ' +
            ('00' + date.getHours()).slice(-2) + ':' +
            ('00' + date.getMinutes()).slice(-2) + ':' +
            ('00' + date.getSeconds()).slice(-2);

    }

}

export { NegotiatedDealManager };

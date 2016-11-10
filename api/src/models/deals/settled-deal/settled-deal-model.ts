'use strict';

import { NegotiatedDealModel } from '../negotiated-deal/negotiated-deal-model';
import { Helper } from '../../../lib/helper';

class SettledDealModel {

    /** Id for the deal in rtbDeals */
    public id: number;
    /** Status of the deal in rtbDeals */
    public status: 'active' | 'paused' | 'deleted';
    /** External deal id for the deal */
    public externalDealID: string;
    /** The dsp ID corresponding to this deal */
    public dspID: number;
    /** Create date of the deal */
    public createDate: Date;
    /** Modified date of the deal */
    public modifyDate: Date;

    /** Start date */
    public startDate: Date | '0000-00-00';
    /** End date */
    public endDate: Date | '0000-00-00';
    /** Price */
    public price: number;
    /** Deal Priority */
    public priority: number;

    /** Reference to the negotiation */
    public negotiatedDeal: NegotiatedDealModel;

    /** Reference variables */

    /** Is this active deal from IXM */
    public isIXMDeal: boolean = true;

    /**
     * Constructor
     * @param initParams - Initial parameters to populate the deal model.
     */
    constructor(initParams?: any) {
        if (initParams) {
            Object.assign(this, initParams);
        }
    }

    /** 
     * Returns true if the deal is live
     * @returns True if the deal is live.
     */
    public isActive() {

        let startDate = Helper.formatDate(this.startDate);
        let endDate = Helper.formatDate(this.endDate);
        let today = Helper.formatDate(new Date());

        return (this.status === 'active') && (startDate <= endDate) && (endDate >= today || endDate === '0000-00-00');

    }

    /**
     * Return the model as a ready-to-send JSON object.
     * @returns - The model as specified in the API.
     */
    public toPayload(userType: string): any {

        let partner;

        if (userType === 'IXMB') {
            partner = { id: this.negotiatedDeal.publisherID, contact: this.negotiatedDeal.publisherInfo.toContactPayload() };
        } else {
            partner = { id: this.negotiatedDeal.buyerID, contact: this.negotiatedDeal.buyerInfo.toContactPayload() };
        }

        if (this.isIXMDeal) {
            // IXM deals have more information
            return {
                proposal: {
                    id: this.negotiatedDeal.proposedDeal.id,
                    name: this.negotiatedDeal.proposedDeal.name,
                    description: this.negotiatedDeal.proposedDeal.description,
                },
                partner: partner,
                dsp_id: this.dspID,
                terms: this.negotiatedDeal.terms,
                impressions: this.negotiatedDeal.impressions,
                budget: this.negotiatedDeal.budget,
                auction_type: this.negotiatedDeal.proposedDeal.auctionType,
                inventory: this.negotiatedDeal.proposedDeal.sections,
                currency: this.negotiatedDeal.proposedDeal.currency,
                external_id: this.externalDealID,
                start_date: Helper.formatDate(this.startDate),
                end_date: Helper.formatDate(this.endDate),
                status: this.status,
                priority: this.priority,
                price: this.negotiatedDeal.price,
                created_at: this.createDate.toISOString(),
                modified_at: this.modifyDate.toISOString()
            };
        } else {
            // Non-ixm deals have less information
            return {
                dsp_id: this.dspID,
                status: this.status,
                external_id: this.externalDealID,

                partner: partner,
                price: this.negotiatedDeal.price,
                start_date: this.negotiatedDeal.startDate,
                end_date: this.negotiatedDeal.endDate,

                auction_type: this.negotiatedDeal.proposedDeal.auctionType,
                inventory: this.negotiatedDeal.proposedDeal.sections,
                currency: this.negotiatedDeal.proposedDeal.currency,
                name: this.negotiatedDeal.proposedDeal.name
            };
        }

    }

}

export { SettledDealModel }

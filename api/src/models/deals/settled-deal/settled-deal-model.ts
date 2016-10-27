'use strict';

import { NegotiatedDealModel } from '../negotiated-deal/negotiated-deal-model';

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
    public createDate: string;
    /** Modified date of the deal */
    public modifyDate: string;

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
     * Return the model as a ready-to-send JSON object.
     * @returns - The model as specified in the API.
     */
    public toPayload(): any {
        if (this.isIXMDeal) {
            // IXM deals have more information
            return {
                proposal_id: this.negotiatedDeal.proposedDeal.id,
                publisher_id: this.negotiatedDeal.publisherID,
                publisher_contact: this.negotiatedDeal.publisherInfo.toContactPayload(),
                buyer_id: this.negotiatedDeal.buyerID,
                buyer_contact: this.negotiatedDeal.buyerInfo.toContactPayload(),
                dsp_id: this.dspID,
                description: this.negotiatedDeal.proposedDeal.description,
                terms: this.negotiatedDeal.terms,
                impressions: this.negotiatedDeal.impressions,
                budget: this.negotiatedDeal.budget,
                name: this.negotiatedDeal.proposedDeal.name,
                external_id: this.externalDealID,
                start_date: this.formatDate(this.negotiatedDeal.startDate),
                end_date: this.formatDate(this.negotiatedDeal.endDate),
                status: this.status,
                auction_type: this.negotiatedDeal.proposedDeal.auctionType,
                price: this.negotiatedDeal.price,
                deal_section_id: this.negotiatedDeal.proposedDeal.sections,
                currency: this.negotiatedDeal.proposedDeal.currency,
                created_at: (new Date(this.createDate)).toISOString(),
                modified_at: (new Date(this.modifyDate)).toISOString()
            };
        } else {
            // Non-ixm deals have less information
            return {
                dsp_id: this.dspID,
                status: this.status,
                external_id: this.externalDealID,

                publisher_id: this.negotiatedDeal.publisherID,
                publisher_contact: this.negotiatedDeal.publisherInfo.toContactPayload(),
                buyer_id: this.negotiatedDeal.buyerID,
                buyer_contact: this.negotiatedDeal.buyerInfo.toContactPayload(),
                price: this.negotiatedDeal.price,
                start_date: this.negotiatedDeal.startDate,
                end_date: this.negotiatedDeal.endDate,

                auction_type: this.negotiatedDeal.proposedDeal.auctionType,
                deal_section_id: this.negotiatedDeal.proposedDeal.sections,
                currency: this.negotiatedDeal.proposedDeal.currency,
                name: this.negotiatedDeal.proposedDeal.name
            };
        }
    }

    /** 
     * Format the dates to yyyy-mm-dd
     * @param dateString - The date as a string.
     */
    private formatDate(dateString: string | Date) {

        if (!dateString) {
            return undefined;
        }

        let date = new Date(dateString.toString());

        if (dateString.toString().includes('0000-00-00')) {
            return '0000-00-00';
        }

        if (date.toString() === 'Invalid Date') {
            throw new Error('Invalid date provided.');
        }

        const pad = (val: Number) => { if (val < 10) { return '0' + val; } return val.toString(); };
        return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
    }

}

export { SettledDealModel }

'use strict';

import { NegotiatedDealModel } from '../negotiated-deal/negotiated-deal-model';
import { Helper } from '../../../lib/helper';
import { MarketUserModel } from '../../market-user/market-user-model';
import { DealSectionModel } from '../../deal-section/deal-section-model';

class SettledDealModel {

    /** Id for the deal in rtbDeals */
    public id: number;
    /** Status of the deal in rtbDeals */
    public status: 'active' | 'paused' | 'deleted' | 'inactive';
    /** External deal id for the deal */
    public externalDealID: string;
    /** The dsp ID corresponding to this deal */
    public dspID: number;
    /** Create date of the deal */
    public createDate: Date;
    /** Modified date of the deal */
    public modifyDate: Date;

    /** Start date */
    public startDate: string;
    /** End date */
    public endDate: string;
    /** Price */
    public price: number;
    /** Deal Priority */
    public priority: number;
    /** Auction Type */
    public auctionType: string;
    /** Section Ids */
    public sections: DealSectionModel[];

    /** Reference to the negotiation */
    public negotiatedDeal: NegotiatedDealModel;

    /** Reference variables */

    /** Is this active deal from IXM */
    public isIXMDeal: boolean = true;

    /**
     * Constructor
     * @param initParams - Initial parameters to populate the deal model.
     */
    constructor(initParams: Partial<SettledDealModel> = {}) {
        Object.assign(this, initParams);
    }

    /** 
     * Returns true if the deal is live
     * @returns True if the deal is live.
     */
    public isActive() {

        let startDate = this.startDate;
        let endDate = this.endDate;
        let today = Helper.formatDate((new Date()).toDateString());

        return (this.status === 'active') && (startDate <= endDate) && (endDate >= today || endDate === '0000-00-00')
               && this.sections.length > 0
               && this.negotiatedDeal.getPublisher().isActive();

    }

    /**
     * Returns true if deal is deleted.
     */
    public isDeleted() {
        return this.status === 'deleted';
    }

    /**
     * Return the model as a ready-to-send JSON object.
     * @returns - The model as specified in the API.
     */
    public toPayload(user: MarketUserModel) {

        let partner: MarketUserModel;
        let person: 'partner' | 'owner' = user.company.id === this.negotiatedDeal.partner.company.id ? 'partner' : 'owner';

        if (person === 'owner') {
            partner = this.negotiatedDeal.partner;
        } else {
            partner = this.negotiatedDeal.proposedDeal.owner;
        }

        let negotiatedDeal = this.negotiatedDeal;
        let proposedDeal = this.negotiatedDeal.proposedDeal;

        return {
            proposal: proposedDeal.toSubPayload(true),
            partner_id: partner.company.id,
            partner: partner.toPayload(),
            dsp_id: this.dspID,
            auction_type: this.auctionType,
            external_id: this.externalDealID,
            start_date: this.startDate,
            end_date: this.endDate,
            status: this.status,
            priority: this.priority,
            inventory: this.sections.map((section) => { return section.toPayload(); }),
            created_at: this.createDate.toISOString(),
            modified_at: this.modifyDate.toISOString(),
            price: this.price,
            terms: negotiatedDeal.terms === null ? proposedDeal.terms : negotiatedDeal.terms,
            impressions: negotiatedDeal.impressions === null ? proposedDeal.impressions : negotiatedDeal.impressions,
            budget: negotiatedDeal.budget === null ? proposedDeal.budget : negotiatedDeal.budget
        };

    }

}

export { SettledDealModel }

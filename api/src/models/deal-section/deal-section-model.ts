'use strict';

import { SiteModel } from '../site/site-model';

class DealSectionModel {

    /** Ad unit restrictions */
    public adUnitRestrictions: string[];
    /** Country restrictions */
    public countryRestrictions: string[];
    /** Coverage */
    public coverage: number;
    /** Entire Site */
    public entireSite: number;
    /** Frequency Restrictions */
    public frequencyRestrictions: string[];
    /** Section id */
    public id: number;
    /** URL Matches */
    public urlMatches: string[];
    /** Name */
    public name: string;
    /** Publisher Id */
    public publisherID: number;
    /** Site */
    public sites: SiteModel[];
    /** Status */
    public status: 'active' | 'deleted';

    constructor(initParams: any = {}) {
        Object.assign(this, initParams);
    }

    /**
     * Return payload formated object
     */
    public toPayload() {

        return {
            ad_unit_restrictions: this.adUnitRestrictions,
            country_restrictions: this.countryRestrictions,
            coverage: this.coverage,
            entire_site: this.entireSite,
            frequency_restrictions: this.frequencyRestrictions,
            id: this.id,
            url_matches: this.urlMatches,
            name: this.name,
            publisher_id: this.publisherID,
            sites: this.sites.map((site) => { return site.toPayload(); })
        };

    }

}

export { DealSectionModel };

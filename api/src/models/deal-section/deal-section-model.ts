'use strict';

import { SiteModel } from '../site/site-model';

class DealSectionModel {

    /** Ad unit restrictions */
    public adUnitRestrictions: string[];
    /** Audience restrictions */
    public audienceRestrictions: number[];
    /** Country restrictions */
    public countryRestrictions: string[];
    /** Coverage */
    public coverage: number;
    /** Entire Site */
    public entireSite: boolean;
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
    public status: 'active' | 'deleted' | 'paused' | 'inactive';

    constructor(initParams: Partial<DealSectionModel> = {}) {
        Object.assign(this, initParams);
    }

    /**
     * Returns true if the section is active.
     */
    public isActive() {
        return this.sites.length > 0 && this.status === 'active';
    }

    /**
     * Return payload formated object
     */
    public toPayload() {

        return {
            ad_unit_restrictions: this.adUnitRestrictions,
            audience_restrictions: this.audienceRestrictions,
            country_restrictions: this.countryRestrictions,
            coverage: this.coverage,
            entire_site: this.entireSite,
            frequency_restrictions: this.frequencyRestrictions,
            id: this.id,
            url_matches: this.urlMatches,
            name: this.name,
            publisher_id: this.publisherID,
            sites: this.sites.map((site) => { return site.toPayload(); }),
            status: this.status
        };

    }

    /**
     * Return subset of payload object with URL.
     * @returns A JSON object which is a subset of the payload object.
     */
    public toSubPayload() {

        let infoURL = `sections/${this.id}`;

        return {
            id: this.id,
            resource: infoURL
        };

    }

}

export { DealSectionModel };

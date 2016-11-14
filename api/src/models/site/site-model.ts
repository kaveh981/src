'use strict';

class SiteModel {

    /** Site id */
    public id: number;
    /** Owner id */
    public publisherId: number;
    /** Site Name */
    public name: string;
    /** URL */
    public url: string;
    /** Category */
    public categories: string[];
    /** Uniques */
    public monthlyUniques: number;
    /** Description */
    public description: string;
    /** Status */
    public status: 'active' | 'paused' | 'deleted';

    constructor(initParams: any = {}) {
        Object.assign(this, initParams);
    }

    /**
     * Return payload formated object
     */
    public toPayload() {

        return {
            id: this.id,
            publisher_id: this.publisherId,
            name: this.name,
            url: this.url,
            categories: this.categories,
            uniques: this.monthlyUniques,
            description: this.description,
            inventory: [{
                ad_unit: '1337x420',
                video: true,
                devices: [ 'kerosene-powered cheese grater', 'goober' ]
            }],
            impressions: 666
        };

    }

}

export { SiteModel };

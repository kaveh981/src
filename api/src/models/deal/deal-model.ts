'use strict';

interface IDealModel {

    /** The deal's unique internal identifier */
    id: number;

    /** The current status of the deal */
    status: string;

}

/**
 * Generic IX user model.
 */

class DealModel implements DealModel {

    /** The deal's unique internal identifier */
    public id: string;

    /** The current status of the deal */
    public status: string;

    /**
     * Constructor
     * @param initParams - Initial parameters to populate the deal model.
     */
    constructor(initParams?: IDealModel) {
        if (initParams) {
            Object.assign(this, initParams);
        }
    }
}

export { DealModel }

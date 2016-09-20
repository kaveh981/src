'use strict';

interface IDealModel {

	/** The deal's unique internal identifier */
	id: number;

	/** The publisher offering the deal */
	userId: number;

	/** The DSP buying the deal */
	dspId: number;

	/** A descriptive name for the deal */
	name: string;

	/** The auction type under which the deal is operating */
	auctionType: string;

	/** The reserved rate of the deal */
	price: number;

	/** The current status of the deal */
	status: string;

	/** The first day when the deal will serve */
	startDate: string;

	/** The last day when the deal will serve */
	endDate: string;

	/** The external ID the DSP must use when they bid with the deal */
	externalID : string;

	/** The sections where the deal is eligible to serve */
	sections: number[];

}

/**
 * Generic IX deal model.
 */

class DealModel implements DealModel {

	/** The deal's unique internal identifier */
	public id: string;

	/** The publisher offering the deal */
	public userId: number;

	/** The DSP buying the deal */
	public dspId: number;

	/** A descriptive name for the deal */
	public name: string;

	/** The auction type under which the deal is operating */
	public auctionType: string;

	/** The reserved rate of the deal */
	public price: number;

	/** The current status of the deal */
	public status: string;

	/** The first day when the deal will serve */
	public startDate: string;

	/** The last day when the deal will serve */
	public endDate: string;

	/** The external ID the DSP must use when they bid with the deal */
	public externalID : string;

	/** The sections where the deal is eligible to serve */
	public sections: number[];

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

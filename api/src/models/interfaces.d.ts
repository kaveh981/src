/** Model interface definitions */

interface IContactModel {
    /** UserId of the contact */
    userID: number;
    /** The contact person's title */
    title?: string;
    /** The contact person's name */
    name: string;
    /** The contact person's email address */
    emailAddress: string;
    /** The contact person's phone number */
    phone: string;
}

interface IBuyerModel {
    /** The buyer's userID */
    userID: number;
    /** An array of dspID's associated with this buyer */
    dspIDs: number[];
    /** The buyer's contact info */
    contactInfo?: IContactModel;
}

interface IUserModel {
    /** The user's userId */
    userID: string;
    /** The current status of the user */
    userStatus: string;
    /** The abbreviated name of the user type. */
    userType: string;
    /** The usergroup to which this user belongs. */
    userGroup: string;
}

interface IPackageModel {
    /** ID of the package */
    packageID?: number;
    /** ID of the package's owner, corresponding to users in database */
    ownerID: number;
    /** Contact information for the owner */
    ownerContactInfo: IContactModel;
    /** Name of the package, unique value */
    name: string;
    /** Description of the package */
    description?: string;
    /** Status of the packge, which could only be active, paused or deleted */
    status?: 'active' | 'paused' | 'deleted';
    /** Flag to define is the package viewable to public */
    isPublic: number;
    /** Start date of the package */
    startDate?: string;
    /** End date of the package */
    endDate?: string;
    /** Price of the package */
    price?: number;
    /** Projected amout of impressions for the package */
    impressions: number;
    /** Project amount to be spend by the buyer */
    budget: number;
    /** Auction type of the deal, which could only be first, second or fixed */
    auctionType?: 'first' | 'second' | 'fixed';
    /** Free text that both parties can edit to convene of specific deal conditions */
    terms?: string;
    /** Created date of the package */
    createDate?: string;
    /** Modified date of the package */
    modifiyDate?: string;
    /** Array of sectionsID associated with the package*/
    sections: number[];
}

interface INegotiationModel {
    /** ID of the negotiation */
    neogotiationID?: number;
    /** Parent package of the negotiation */
    packageID: number;
    /** ID of the publisher involved in this negotiation */
    publisherID: number;
    /** ID of the buyer involved in this negotiation */
    buyerID: number;
    /** Current negotiated price - if different from the one in package  */
    price?: number;
    /** Current negotiated start date - if different from the one in package */
    startDate?: string;
    /** Current negotiated end date - if different from the one in package */
    endDate?: string;
    /** Current negotiated terms - if different from the one in package */
    terms?: string;
    /** Party who last updated the negotiation P - Publisher, B - Buyer */
    sender?: 'P' | 'B';
    /** Keeps track of the publishers position */
    pubStatus?: 'active' | 'archived' | 'deleted' | 'accepted' | 'rejected';
    /** Keeps track of the buyers position */
    buyerStatus?: 'active' | 'archived' | 'deleted' | 'accepted' | 'rejected';
    /** Creation date of the negotiation */
    createDate?: string;
    /** Last modify date of the negotiation*/
    modifyDate?: string;
}

interface IDealModel {
    /** The deal's unique internal identifier */
    dealID: number;
    /** The publisher offering the deal */
    publisherID: number;
    /** The DSP buying the deal */
    dspID: number;
    /** A descriptive name for the deal */
    name: string;
    /** The auction type under which the deal is operating - it's a private property so the interface has the getter's signature */
    auctionType?: 'first' | 'second' | 'fixed';
    /** The reserved rate of the deal */
    price: number;
    /** The current status of the deal */
    status?: 'N' | 'A' | 'D' | 'P';
    /** The first day when the deal will serve */
    startDate?: string;
    /** The last day when the deal will serve */
    endDate?: string;
    /** The external ID the DSP must use when they bid with the deal */
    externalID: string;
    /** The sections where the deal is eligible to serve */
    sections: number[];
}

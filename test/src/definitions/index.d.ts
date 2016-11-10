interface IJsfSchema {
    properties?: {};
    required?: string[];
    __ref__?: string;
}

interface INewUserData {
    userID?: number;
    userType?: number;
    emailAddress?: string;
    password?: string;
    status?: string;
    firstName?: string;
    lastName?: string;
    companyName?: string;
    address1?: string;
    address2?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    phone?: string;
    fax?: string;
    version?: number;
    createDate?: string | Date;
    modifyDate?: string;
    lastLogin?: string;
}

interface INewBuyerData {
    user: INewUserData;
    dspID: number;
}

interface IPubData {
    userID?: number;
    payeeName?: string;
    minimumPayment?: number;
    creditTerms?: number;
    paypalAccount?: string;
    allowInvoiceType?: number;
    payout?: number;
    ip?: string;
    language?: string;
    paymentGroupID?: number;
    monthlyAdvRevenue?: string;
    networks?: string;
    approvalDate?: Date;
    rtbNetwork?: string;
    reportingEmail?: string;
    isSFRP?: number;
    notificationEnabled?: number;
    autoInvoice?: number;
}

interface INewPubData {
    user: INewUserData;
    publisher: IPubData;
}

interface INewSiteData {
    siteID?: number;
    userID?: number;
    status?: string;
    name?: string;
    mainDomain?: string;
    description?: string;
    createDate?: Date;
    modifyDate?: Date;
    autoApprove?: number;
    prmPause?: number;
    siteAliasCheck?: number;
    semiTransparentURL?: string;
}

interface ISection {
    sectionID?: number;
    userID?: number;
    status?: string;
    name?: string;
    percent?: number;
    entireSite?: number;
}

interface INewSectionData {
    siteIDs: number[];
    section: ISection;
}

interface IProposal {
    proposalID?: number;
    ownerID?: number;
    name?: string;
    description?: string;
    status?: string;
    accessMode?: number;
    startDate?: Date;
    endDate?: Date;
    price?: number;
    impressions?: number;
    budget?: number;
    auctionType?: string;
    terms?: string;
    createDate?: Date;
    modifyDate?: Date;
}

interface INewProposalData {
    proposal?: IProposal;
    sectionIDs?: number[];
}

interface IReqOptions {
    hostname?: string;
    port?: number;
    method?: string;
    path?: string;
    headers?: {};
}

interface INewDSPData {
    dspID?: number;
    udsID?: number;
    name?: string;
    bidURL?: string;
    limiter?: number;
    creativeContained?: number;
    siteURLRequired?: number;
    status?: 'A' | 'D';
    userMatchOptional?: number;
    blockListDisabled?: number;
    keepAliveDisabled?: number;
    exchangeMode?: number;
    campaignMode?: number;
    apiEnabled?: number;
    creativeTypeRequired?: number;
    version?: number;
    multiBidsCompete?: number;
    proxy?: number;
    protected?: number;
    useBrandURL?: number;
    publisherNotifyMode?: number;
    sslEnabled?: number;
    pubNetworkOverride?: number;
    paused?: number;
    ipcmidUDSID?: number;
}

interface IDealNegotiationData {
    negotiationID?: number;
    proposalID?: number;
    publisherID?: number;
    buyerID?: number;
    startDate?: Date;
    endDate?: Date;
    price?: number;
    impressions?: number;
    budget?: number;
    terms?: string;
    sender?: string;
    pubStatus?: string;
    buyerStatus?: string;
    createDate?: Date;
    modifyDate?: Date;
}

interface ISettledDeal {
    dealID?: number;
    userID?: number;
    dspID?: number;
    name?: string;
    auctionType?: string;
    rate?: number;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    modifiedDate?: Date;
    externalDealID?: string;
    priority?: number;
    openMarket?: number;
    noPayoutMode?: number;
    manualApproval?: number;
}

interface ISettledDealData {
    settledDeal?: ISettledDeal;
    sectionIDs?: number[];
    negotiationID?: number;
}

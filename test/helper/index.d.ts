interface IJsfSchema {
    properties?: {};
    required?: string[];
    __ref__?: string;
}

interface INewUserData {
    userID?: number;
    userType: number;
    emailAddress: string;
    password: string;
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

interface INewPubData {
    user: INewUserData;
    publisher: {
        userID?: number;
        payeeName: string;
        minimumPayment: number;
        creditTerms: number;
        paypalAccount: string;
        allowInvoiceType: number;
        payout: number;
        ip: string;
        language: string;
        paymentGroupID: number;
        monthlyAdvRevenue: string;
        networks: string;
        approvalDate: Date;
        rtbNetwork: string;
        reportingEmail: string;
        isSFRP: number;
        notificationEnabled: number;
        autoInvoice: number;
    };
}

interface INewSiteData {
    siteID?: number;
    userID: number;
    status: string;
    name: string;
    mainDomain: string;
    description: string;
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
    status: string;
    name: string;
    percent: number;
    entireSite: number;
}

interface INewSectionData {
    siteIDs: number[];
    section: ISection;
}

interface IPackage {
    packageID?: number;
    ownerID: number;
    name: string;
    description: string;
    status: string;
    public: number;
    startDate: Date;
    endDate: Date;
    price: number;
    impressions: number;
    budget: number;
    auctionType: string;
    terms: string;
    createDate: Date;
    modifyDate?: Date;
}

interface INewPackageData {
    sectionIDs: number[];
    package: IPackage;
}


interface IReqOptions {
    hostname?: string;
    port?: number;
    method?: string;
    path?: string;
    headers?: {};
    json?: {};
}


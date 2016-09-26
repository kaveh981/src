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
    };
}

interface INewSiteData {
    siteID?: number;
    userID: number;
    status: string;
    name: string;
    mainDomain: string;
    description: string;
    createDate?: string;
    modifyDate?: string;
}

interface INewSectionData {
    siteIDs?: number[];
    sectionID?: number;
    userID?: number;
    status: string;
    name: string;
    percent: number;
    entireSite: number;
}

interface INewPackageData {
    packageID?: number;
    ownerID: number;
    sectionIDs?: number[];
    name: string;
    description: string;
    status: string;
    public: number;
    startDate: string;
    endDate: string;
    price: number;
    impressions: number;
    budget: number;
    auctionType: string;
    terms: string;
    createDate: string;
    modifyDate?: string;
}

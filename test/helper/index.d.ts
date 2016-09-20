interface IJsfSchema {
    type?: string,
    properties?: string,
    required?: string,
}

interface INewUserData {
    userID?: number,
    userType: number,
    emailAddress: string,
    password: string,
    status?: string,
    firstName?: string,
    lastName?: string,
    companyName?: string,
    address1?: string,
    city?: string,
    state?: string,
    zipCode?: string,
    country?: string,
    phone?: string
}

interface INewBuyerData {
    user: INewUserData,
    dspID: number
}

interface INewPubData {
    user: INewUserData,
    publisher: {
        payeeName: string,
        minimumPayment: number,
        creditTerms: number,
        paypalAccount: string,
        allowInvoiceType: number,
        payout: number,
        ip: string,
        language: string,
        paymentGroupID: number,
        monthlyAdvRevenue: string
    }
}

interface INewSiteData {
    siteID?: number,
    userID: number,
    status: string,
    name: string,
    mainDomain: string,
    description: string
}

interface ISection {
    sectionID?: number,
    userID?: number,
    status: string,
    name: string,
    percent: number,
    entireSite: number
}

interface INewSectionData {
    siteIDs?: number[],
    section: ISection
}
/*global testApp*/
'use strict';

const dataSetup = {
    backup: {
        mysql: {
            Viper2: [
                'adFormats',
                'adUnits',
                'audienceTargetingSegments',
                'audienceTargetingSegmentTypes',
                'audienceTargetingSegmentTypeMappings',
                'campaignContentGroupFilter',
                'countries',
                'siteContentGroupFilter',
                'siteDSPFilter',
                'siteUserFilter',
                'siteBrandFilter',
                'systemFilter',
                'siteReportingHistory',
                'siteCampaignWhiteList',
                'siteFrequencyCaps',
                'privs',
                'publisherPaymentTypeMappings',
                'publisherPayoutPercentages',
                'ajaxPublisherWhitelist',
                'categories',
                'manageExchangeManagers',
                'managePublisherRelationshipManagers',
                'managePublishers',
                'proxyDSPPublisherWhitelist',
                'publishers',
                'placementDepthMappings',
                'placementDAPMappings',
                'placementCountryMappings',
                'placementAdUnitMappings',
                'rtbDomainDepths',
                'rtbDSPs',
                'rtbSitePlacements',
                'rtbPlacements',
                'rtbPlacementMatches',
                'rtbPlacementTiers',
                'siteAlias',
                'siteAutoApproval',
                'siteCategories',
                'siteDynamicAdCodes',
                'sitePositions',
                //'siteOptions',
                'sites',
                'siteTagMappings',
                'siteTags',
                'siteTagTypes',
                'tierAccessOverride',
                'tierTransparencyOverride',
                'users',
                'restrictedAdunits',
                'publisherAdunitWhitelist',
                'ajaxPublisherPriceLevels',
                'rtbSSPConfs',
                'rtbSections',
                'rtbDeals',
                'publisherRTBTimeouts',
                'publisherRTBDCTimeouts',
                'dataCenters',
                'rtbDomainFilter',
                'rtbProxyDomainFilter',
                'rtbProxyDomainWhitelist',
                'functionPrivs',
                'rtbDSPTierFloors',
                'rtbMasterTierFloors',
                'rtbAudienceCriteriaTierFloors',
                'rtbAdUnitPlacementFloors',
                'rtbBrandPlacementFloors',
                'rtbDAPPlacementFloors',
                'rtbCountryPlacementFloors',
                'rtbCreativeTypePlacementFloors',
                'rtbTradingDeskPlacementFloors',
                'rtbDomainDepthPlacementFloors',
                'rtbIndustryPlacementFloors',
                'rtbMasterFloors',
                'rtbAdUnitFloors',
                'rtbBrandFloors',
                'rtbDAPFloors',
                'rtbBinaryCriteriaRequestFloors',
                'rtbCountryFloors',
                'rtbCreativeTypeFloors',
                'rtbDSPFloors',
                'rtbTradingDeskFloors',
                'rtbDomainDepthFloors',
                'rtbIndustryFloors',
                'rtbBinaryCriteriaRequests',
                'campaigns',
                'defaultCampaigns',
                'creative',
                'singleImage',
                'richMedia',
                'files',
                'fileBinary',
                'passBackCreatives',
                'onpageProperties',
                'rtbTradingDesks',
                'rtbSections',
                'rtbSiteSections',
                'rtbSectionMatches',
                'sectionDepthMappings',
                'sectionDAPMappings',
                'sectionCountryMappings',
                'sectionAdUnitMappings',
                'settings',
                'siteTypeMappings',
                'rtbDeals',
                'rtbDealPlacements',
                'rtbDealSections',
                'rtbDealMode',
                'rtbSSPConfs',
                'userConfig',
                'rtbAdvertisers',
                'siteCampaignWhiteList',
                'rtbDealBuyers',
                'siteExchangeRatesMonthly',
                'publisherPaymentModifier',
                'exchangeRatesDaily',
                'apiKeys',
                'paymentGroups',
                'payeeInfo',
                'exchangeRatesSupported',
                'passwordResetRequests'
            ],
            Stats: [
                'rtbRevenueShareEarningsStats',
                'pxRevenueShareEarningsStats',
                'rtbRevenueShareHourlyEarningsStats',
                'pxRevenueShareHourlyEarningsStats',
                'unsoldSiteStats',
                'rtbCampaignWinningBidStats'
            ]
        }
    },
    clear: {
        mysql: {
            Viper2: [
                'adFormats WHERE adFormatID <> 8',
                'adUnits WHERE adUnitID <> 11',
                'audienceTargetingSegments',
                'audienceTargetingSegmentTypes',
                'audienceTargetingSegmentTypeMappings',
                'countries',
                'campaignContentGroupFilter',
                'siteContentGroupFilter',
                'siteDSPFilter',
                'siteUserFilter',
                'siteBrandFilter',
                'systemFilter',
                'siteReportingHistory',
                'siteCampaignWhiteList',
                'siteFrequencyCaps',
                //'privs',
                //'publisherPaymentTypeMappings',
                'publisherPayoutPercentages',
                //'ajaxPublisherWhitelist',
                'categories',
                //'manageExchangeManagers',
                //'managePublisherRelationshipManagers',
                //'managePublishers',
                //'proxyDSPPublisherWhitelist',
                //'publishers',
                'placementDepthMappings',
                'placementDAPMappings',
                'placementCountryMappings',
                'placementAdUnitMappings',
                'rtbDomainDepths',
                'rtbDSPs',
                'rtbSitePlacements',
                'rtbPlacements',
                'rtbPlacementMatches',
                'rtbPlacementTiers',
                'siteAlias',
                'siteAutoApproval',
                'siteCategories',
                'siteDynamicAdCodes',
                'sitePositions',
                //'siteOptions',
                'sites',
                'siteTagMappings',
                'siteTags WHERE siteTagTypeID = 17',
                //'siteTagTypes',
                //'users',
                //'sessions',
                //'secureSessions'
                'tierAccessOverride',
                'tierTransparencyOverride',
                'restrictedAdunits',
                'publisherAdunitWhitelist',
                'ajaxPublisherPriceLevels',
                'rtbSSPConfs',
                'rtbSections',
                'rtbDeals',
                'publisherRTBTimeouts',
                'publisherRTBDCTimeouts',
                'dataCenters',
                'rtbDomainFilter',
                'rtbProxyDomainFilter',
                'rtbProxyDomainWhitelist',
                'functionPrivs',
                'rtbDSPTierFloors',
                'rtbMasterTierFloors',
                'rtbAudienceCriteriaTierFloors',
                'rtbAdUnitPlacementFloors',
                'rtbBrandPlacementFloors',
                'rtbDAPPlacementFloors',
                'rtbCountryPlacementFloors',
                'rtbCreativeTypePlacementFloors',
                'rtbTradingDeskPlacementFloors',
                'rtbDomainDepthPlacementFloors',
                'rtbIndustryPlacementFloors',
                'rtbMasterFloors',
                'rtbAdUnitFloors',
                'rtbBrandFloors',
                'rtbDAPFloors',
                'rtbBinaryCriteriaRequestFloors',
                'rtbCountryFloors',
                'rtbCreativeTypeFloors',
                'rtbDSPFloors',
                'rtbTradingDeskFloors',
                'rtbDomainDepthFloors',
                'rtbIndustryFloors',
                'rtbBinaryCriteriaRequests',
                'campaigns',
                'defaultCampaigns',
                'creative',
                'singleImage',
                'richMedia',
                'files',
                'fileBinary',
                'passBackCreatives',
                'onpageProperties',
                'rtbTradingDesks',
                'rtbSections',
                'rtbSiteSections',
                'rtbSectionMatches',
                'sectionDepthMappings',
                'sectionDAPMappings',
                'sectionCountryMappings',
                'sectionAdUnitMappings',
                'siteTypeMappings',
                'rtbDeals',
                'rtbDealPlacements',
                'rtbDealSections',
                'rtbDealMode',
                'rtbSSPConfs',
                'userConfig',
                'rtbAdvertisers',
                'siteCampaignWhiteList',
                'rtbDealBuyers',
                'siteExchangeRatesMonthly',
                'publisherPaymentModifier',
                'exchangeRatesDaily',
                'apiKeys',
                'payeeInfo',
                'passwordResetRequests'
            ],
            Stats: [
                'rtbRevenueShareEarningsStats',
                'pxRevenueShareEarningsStats',
                'rtbRevenueShareHourlyEarningsStats',
                'pxRevenueShareHourlyEarningsStats',
                'unsoldSiteStats',
                'rtbCampaignWinningBidStats'
            ]
        }
    },


};


export default dataSetup;
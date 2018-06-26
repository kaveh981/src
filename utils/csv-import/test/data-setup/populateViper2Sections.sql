-- CREATE ADMIN

-- Password is encrypted, actually '123'
INSERT INTO `users` (userID, userType, status, emailAddress, password, version, firstName, lastName, companyName, address1, city, state, zipCode, country, phone) 
    VALUES (1000, 1, 'A', 'admin@ix.com', 'Ii2Hnp+BJwUVltY/gOQ09yVTGhfdjpieg5xtdSxvHMc9OReFkzxxOyRV1GNPrANon0fTFRYuBbL2', 1, 'Admi', 'Nistrator',  'Index Exchange', '74 Wingold', 'Toronto', 'Ontario', 82110, 'CA', '789-654-1230');

-- CREATE PUBS

-- Password is encrypted, actually '123'
INSERT INTO `users` (userID, userType, status, emailAddress, password, version, firstName, lastName, companyName, address1, city, state, zipCode, country, phone) 
    VALUES (100129, 18, 'A', 'one@publisher.com', 'E6yj3ZRClVpH1VKPKTuM7n+/Yf4kSp6DTLsk+Jh/tkfvE2xSCzYFgQw7Q7jJr9BAO3gRs+UIGTfI', 1, 'guy3', 'family3',  'company for test', '123 Street', 'Mazatlan', 'Sinaloa', 82110, 'US', '789-654-1230');

-- Password is encrypted, actually '123'
INSERT INTO `users` (userID, userType, status, emailAddress, password, version, firstName, lastName, companyName, address1, city, state, zipCode, country, phone) 
    VALUES (100130, 18, 'A', 'another@publisher.com', 'cUB9KvKu+AZ4+seN2hG5cv+1YRgcFcdKHyGkqdNJ9ATdSVKahEg5A8lLz/WbpXWbWBUsHO8P5CUu', 1, 'guy3', 'family3',  'company for test', '123 Street', 'Mazatlan', 'Sinaloa', 82110, 'US', '789-654-1230');

INSERT INTO `publishers` (userID, payeeName, minimumPayment, creditTerms, allowInvoiceTax, payout, ip, paymentGroupID, monthlyAdvRevenue, approvalDate, isSFRP, rtbNetwork) 
    VALUES (100129, 'PAYEE ONE', 0, 45, 0, 70, '10.3.1.159', 4, 'under10K', '2015-08-31', 1, 'exchangeOne');

INSERT INTO `publishers` (userID, payeeName, minimumPayment, creditTerms, allowInvoiceTax, payout, ip, paymentGroupID, monthlyAdvRevenue, approvalDate, isSFRP, rtbNetwork) 
    VALUES (100130, 'PAYEE ONE', 0, 45, 0, 70, '10.3.1.159', 4, 'under10K', '2015-08-31', 1, 'exchangeOne');

INSERT INTO `userConfig` (userID, currencyID, locale, timezone) VALUES (100129, 'USD', 'en-us', 'America/New_York');

INSERT INTO `userConfig` (userID, currencyID, locale, timezone) VALUES (100130, 'USD', 'en-us', 'America/New_York');

-- CREATE SITES

INSERT INTO `sites` (userID, siteID, status, name, mainDomain, description) VALUES (100129, 1, 'A', 's1', 'http://qq.com', 'wow');

INSERT INTO `sites` (userID, siteID, status, name, mainDomain, description) VALUES (100129, 2, 'A', 's2', 'http://pp.com', 'wow');

INSERT INTO `sites` (userID, siteID, status, name, mainDomain, description) VALUES (100129, 3, 'A', 's3', 'http://dd.com', 'wow');

INSERT INTO `sites` (userID, siteID, status, name, mainDomain, description) VALUES (100130, 4, 'A', 's4', 'http://bb.com', 'wow');

INSERT INTO `sites` (userID, siteID, status, name, mainDomain, description) VALUES (100130, 5, 'A', 's5', 'http://nn.com', 'wow');

INSERT INTO `sites` (userID, siteID, status, name, mainDomain, description) VALUES (100130, 6, 'A', 's6', 'http://uu.com', 'wow');

-- CREATE DEPTHS for frequencyRestrictions

INSERT INTO `rtbDomainDepths` (depthBucket, name) VALUES (4, '31 - 62');

INSERT INTO `rtbDomainDepths` (depthBucket, name) VALUES (5, '63 - 126');

-- CREATE AUDIENCE SEGMENTS for audienceRestrictions

INSERT INTO `audienceTargetingSegments` (segmentID, segmentTypeID, code) VALUES (6, 1, '01');

INSERT INTO `audienceTargetingSegments` (segmentID, segmentTypeID, code) VALUES (7, 1, '02');

INSERT INTO `audienceTargetingSegmentTypeMappings` (userID, segmentTypeID) VALUES (100129, 1);

INSERT INTO `audienceTargetingSegmentTypeMappings` (userID, segmentTypeID) VALUES (100130, 1);

-- CREATE NORTH AMERICA

INSERT INTO `countries` (countryID, name) VALUES ('CA', 'Canada');

INSERT INTO `countries` (countryID, name) VALUES ('US', 'United States');

INSERT INTO `countries` (countryID, name) VALUES ('MX', 'Mexico');

-- CREATE AD UNITS

INSERT INTO `adUnits` (adUnitID, adFormatID, name, status) VALUES (8, 3, '300x600 (Tower)', 'A');

INSERT INTO `adUnits` (adUnitID, adFormatID, name, status) VALUES (9, 7, '300x50 (Mobile Web)', 'A');

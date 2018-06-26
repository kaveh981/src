-- CREATE BUYERS

INSERT INTO `users` (userID, userType, status, emailAddress, password, version, firstName, lastName, companyName, address1, city, state, zipCode, country, phone) VALUES (1, 22, 'A', 'test.buyer1@csvimport.com', 'ratpoint.jpeg', 1, 'Buy1', 'Buyers1',  'company for test', '123 Street', 'Mazatlan', 'Sinaloa', 82110, 'MX', '789-654-1230');

INSERT INTO `users` (userID, userType, status, emailAddress, password, version, firstName, lastName, companyName, address1, city, state, zipCode, country, phone) VALUES (16777215, 22, 'A', 'test.buyer2@csvimport.com', 'ratpoint.jpeg', 1, 'Buy2', 'Buyers2',  'company for test', '123 Street', 'Mazatlan', 'Sinaloa', 82110, 'MX', '789-654-1230');

INSERT INTO `users` (userID, userType, status, emailAddress, password, version, firstName, lastName, companyName, address1, city, state, zipCode, country, phone) VALUES (101010, 22, 'A', 'test.buyer3@csvimport.com', 'ratpoint.jpeg', 1, 'Buy3', 'Buyers3',  'company for test', '123 Street', 'Mazatlan', 'Sinaloa', 82110, 'MX', '789-654-1230');

INSERT INTO `users` (userID, userType, status, emailAddress, password, version, firstName, lastName, companyName, address1, city, state, zipCode, country, phone) VALUES (101011, 22, 'A', 'test.buyer4@csvimport.com', 'ratpoint.jpeg', 1, 'Buy4', 'Buyers4',  'company for test', '123 Street', 'Mazatlan', 'Sinaloa', 82110, 'MX', '789-654-1230');

-- CREATE DSP

INSERT INTO `rtbDSPs` (dspID, name, bidURL) VALUES (1, 'CSV-testDSP', 'http://dsp.test.com/');

-- MAP ixmBuyers

INSERT INTO `ixmBuyers` (userID, dspID) VALUES (1, 1);
INSERT INTO `ixmBuyers` (userID, dspID) VALUES (16777215, 1);
INSERT INTO `ixmBuyers` (userID, dspID) VALUES (101010, 1);
INSERT INTO `ixmBuyers` (userID, dspID) VALUES (101011, 1);

-- CREATE PUBS

INSERT INTO `users` (userID, userType, status, emailAddress, password, version, firstName, lastName, companyName, address1, city, state, zipCode, country, phone) VALUES (100129, 23, 'A', 'test.pub3@csvimport.com', 'ratpoint.jpeg', 1, 'guy3', 'family3',  'company for test', '123 Street', 'Mazatlan', 'Sinaloa', 82110, 'MX', '789-654-1230');

-- CREATE SECTIONS

INSERT INTO `rtbSections` (sectionID, userID, name, status, percent, entireSite) VALUES (1, 100129, 'testSectionCSV-1', 'A', 100, 1);

INSERT INTO `rtbSections` (sectionID, userID, name, status, percent, entireSite) VALUES (16777215, 100129, 'testSectionCSV-2', 'A', 100, 1);

INSERT INTO `rtbSections` (sectionID, userID, name, status, percent, entireSite) VALUES (5, 100129, 'testSectionCSV-3', 'A', 100, 1);

INSERT INTO `rtbSections` (sectionID, userID, name, status, percent, entireSite) VALUES (51, 100129, 'testSectionCSV-4', 'A', 100, 1);

INSERT INTO `rtbSections` (sectionID, userID, name, status, percent, entireSite) VALUES (10, 100129, 'testSectionCSV-5', 'A', 100, 1);

INSERT INTO `rtbSections` (sectionID, userID, name, status, percent, entireSite) VALUES (188, 100129, 'testSectionCSV-6', 'A', 100, 1);


SET foreign_key_checks=0;

-- CLEAR TABLES

TRUNCATE `users`;
TRUNCATE `rtbSections`;
TRUNCATE `sites`;
TRUNCATE `rtbDomainDepths`;
TRUNCATE `audienceTargetingSegments`;
TRUNCATE `audienceTargetingSegmentTypeMappings`;
TRUNCATE `countries`;
TRUNCATE `adUnits`;
TRUNCATE `publishers`;
TRUNCATE `userConfig`;
TRUNCATE `rtbSectionMatches`;
TRUNCATE `rtbSiteSections`;
TRUNCATE `sectionDepthMappings`;
TRUNCATE `sectionDAPMappings`;
TRUNCATE `sectionCountryMappings`;
TRUNCATE `sectionAdUnitMappings`;

-- RESTORE TABLES

INSERT INTO `users` select * from `users_backup`;
INSERT INTO `rtbSections` select * from `rtbSections_backup`;
INSERT INTO `sites` select * from `sites_backup`;
INSERT INTO `rtbDomainDepths` select * from `rtbDomainDepths_backup`;
INSERT INTO `audienceTargetingSegments` select * from `audienceTargetingSegments_backup`;
INSERT INTO `audienceTargetingSegmentTypeMappings` select * from `audienceTargetingSegmentTypeMappings_backup`;
INSERT INTO `countries` select * from `countries_backup`;
INSERT INTO `adUnits` select * from `adUnits_backup`;
INSERT INTO `publishers` select * from `publishers_backup`;
INSERT INTO `userConfig` select * from `userConfig_backup`;
INSERT INTO `rtbSectionMatches` SELECT * FROM `rtbSectionMatches_backup`;
INSERT INTO `rtbSiteSections` SELECT * FROM `rtbSiteSections_backup`;
INSERT INTO `sectionDepthMappings` SELECT * FROM `sectionDepthMappings_backup`;
INSERT INTO `sectionDAPMappings` SELECT * FROM `sectionDAPMappings_backup`;
INSERT INTO `sectionCountryMappings` SELECT * FROM `sectionCountryMappings_backup`;
INSERT INTO `sectionAdUnitMappings` SELECT * FROM `sectionAdUnitMappings_backup`;

-- DROP BACKUP TABLES

DROP TABLE `users_backup`;
DROP TABLE `rtbSections_backup`;
DROP TABLE `sites_backup`;
DROP TABLE `rtbDomainDepths_backup`;
DROP TABLE `audienceTargetingSegments_backup`;
DROP TABLE `audienceTargetingSegmentTypeMappings_backup`;
DROP TABLE `countries_backup`;
DROP TABLE `adUnits_backup`;
DROP TABLE `publishers_backup`;
DROP TABLE `userConfig_backup`;
DROP TABLE `rtbSectionMatches_backup`;
DROP TABLE `rtbSiteSections_backup`;
DROP TABLE `sectionDepthMappings_backup`;
DROP TABLE `sectionDAPMappings_backup`;
DROP TABLE `sectionCountryMappings_backup`;
DROP TABLE `sectionAdUnitMappings_backup`;

SET foreign_key_checks=1;

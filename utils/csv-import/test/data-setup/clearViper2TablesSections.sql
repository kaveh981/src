SET foreign_key_checks=0;

-- BACKUP TABLES

DROP TABLE IF EXISTS `users_backup`;
DROP TABLE IF EXISTS `rtbSections_backup`;
DROP TABLE IF EXISTS `sites_backup`;
DROP TABLE IF EXISTS `rtbDomainDepths_backup`;
DROP TABLE IF EXISTS `audienceTargetingSegments_backup`;
DROP TABLE IF EXISTS `audienceTargetingSegmentTypeMappings_backup`;
DROP TABLE IF EXISTS `countries_backup`;
DROP TABLE IF EXISTS `adUnits_backup`;
DROP TABLE IF EXISTS `publishers_backup`;
DROP TABLE IF EXISTS `userConfig_backup`;

CREATE TABLE IF NOT EXISTS `users_backup` SELECT * FROM `users`;
CREATE TABLE IF NOT EXISTS `rtbSections_backup` SELECT * FROM `rtbSections`;
CREATE TABLE IF NOT EXISTS `sites_backup` SELECT * FROM `sites`;
CREATE TABLE IF NOT EXISTS `rtbDomainDepths_backup` SELECT * FROM `rtbDomainDepths`;
CREATE TABLE IF NOT EXISTS `audienceTargetingSegments_backup` SELECT * FROM `audienceTargetingSegments`;
CREATE TABLE IF NOT EXISTS `audienceTargetingSegmentTypeMappings_backup` SELECT * FROM `audienceTargetingSegmentTypeMappings`;
CREATE TABLE IF NOT EXISTS `countries_backup` SELECT * FROM `countries`;
CREATE TABLE IF NOT EXISTS `adUnits_backup` SELECT * FROM `adUnits`;
CREATE TABLE IF NOT EXISTS `publishers_backup` SELECT * FROM `publishers`;
CREATE TABLE IF NOT EXISTS `userConfig_backup` SELECT * FROM `userConfig`;


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

SET foreign_key_checks=1;

SET foreign_key_checks=0;

-- BACKUP TABLES

DROP TABLE IF EXISTS `users_backup`;
DROP TABLE IF EXISTS `rtbSections_backup`;
DROP TABLE IF EXISTS `rtbDSPs_backup`;
DROP TABLE IF EXISTS `ixmDealProposals_backup`;
DROP TABLE IF EXISTS `ixmBuyers_backup`;
DROP TABLE IF EXISTS `ixmProposalTargeting_backup`;
DROP TABLE IF EXISTS `ixmProposalSectionMappings_backup`;

CREATE TABLE IF NOT EXISTS `users_backup` SELECT * FROM `users`;
CREATE TABLE IF NOT EXISTS `rtbSections_backup` SELECT * FROM `rtbSections`;
CREATE TABLE IF NOT EXISTS `rtbDSPs_backup` SELECT * FROM `rtbDSPs`;
CREATE TABLE IF NOT EXISTS `ixmDealProposals_backup` SELECT * FROM `ixmDealProposals`;
CREATE TABLE IF NOT EXISTS `ixmBuyers_backup` SELECT * FROM `ixmBuyers`;
CREATE TABLE IF NOT EXISTS `ixmProposalTargeting_backup` SELECT * FROM `ixmProposalTargeting`;
CREATE TABLE IF NOT EXISTS `ixmProposalSectionMappings_backup` SELECT * FROM `ixmProposalSectionMappings`;

-- CLEAR TABLES

TRUNCATE `users`;
TRUNCATE `rtbSections`;
TRUNCATE `rtbDSPs`;
TRUNCATE `ixmDealProposals`;
TRUNCATE `ixmBuyers`;
TRUNCATE `ixmProposalTargeting`;
TRUNCATE `ixmProposalSectionMappings`;

SET foreign_key_checks=1;

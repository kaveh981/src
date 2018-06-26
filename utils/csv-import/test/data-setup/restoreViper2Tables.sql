SET foreign_key_checks=0;

-- CLEAR TABLES

TRUNCATE `users`;
TRUNCATE `rtbSections`;
TRUNCATE `rtbDSPs`;
TRUNCATE `ixmProposals`;
TRUNCATE `ixmBuyers`;
TRUNCATE `ixmProposalTargeting`;
TRUNCATE `ixmProposalSectionMappings`;

-- RESTORE TABLES

INSERT INTO `users` SELECT * FROM `users_backup`;
INSERT INTO `rtbSections` SELECT * FROM `rtbSections_backup`;
INSERT INTO `rtbDSPs` SELECT * FROM `rtbDSPs_backup`;
INSERT INTO `ixmProposals` SELECT * FROM `ixmProposals_backup`;
INSERT INTO `ixmBuyers` SELECT * FROM `ixmBuyers_backup`;
INSERT INTO `ixmProposalTargeting` SELECT * FROM `ixmProposalTargeting_backup`;
INSERT INTO `ixmProposalSectionMappings` SELECT * FROM `ixmProposalSectionMappings_backup`;

-- DROP BACKUP TABLES

DROP TABLE `users_backup`;
DROP TABLE `rtbSections_backup`;
DROP TABLE `rtbDSPs_backup`;
DROP TABLE `ixmProposals_backup`;
DROP TABLE `ixmBuyers_backup`;
DROP TABLE `ixmProposalTargeting_backup`;
DROP TABLE `ixmProposalSectionMappings_backup`;

SET foreign_key_checks=1;

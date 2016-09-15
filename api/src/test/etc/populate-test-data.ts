// Script to auto-populate Viper2 with data relevant to IXM Buyer API

import { dbPopulator } from '../helper/db-populator';
import { Logger }      from '../helper/logger';

const logger: Logger = new Logger("TEST");

dbPopulator.initialize()
    .then(() => {
        logger.info("DO SOME STUFF WITH dbPopulator");
    })
    .then(dbPopulator.shutdown.bind(dbPopulator));
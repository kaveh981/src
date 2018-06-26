'use strict';

import { Injector } from './lib/injector';
import { Validator } from './lib/validator';
import { ConfigLoader } from './lib/config-loader';
import { CSVLoader } from './lib/csv-loader';
import { SQLScriptBuilder } from './lib/sql-script-builder';
import { SchemaLoader } from './lib/schema-loader';
import { SectionPopulator } from './lib/section-populator';

const configLoader = new ConfigLoader();
Injector.put(configLoader, 'ConfigLoader');

const csvLoader = new CSVLoader();
Injector.put(csvLoader, 'CSVLoader');

const sqlScriptBuilder = new SQLScriptBuilder();
Injector.put(sqlScriptBuilder, 'SQLScriptBuilder');

const schemaLoader = new SchemaLoader();
Injector.put(schemaLoader, 'SchemaLoader');

const validator = new Validator(configLoader, schemaLoader);
Injector.put(validator, 'Validator');

const sectionPopulator = new SectionPopulator(configLoader);
Injector.put(sectionPopulator, 'SectionPopulator');

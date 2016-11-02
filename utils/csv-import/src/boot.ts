'use strict';

import { Injector } from './lib/injector';
import { Validator } from './lib/validator';
import { ConfigLoader } from './lib/config-loader';
import { CSVLoader } from './lib/csv-loader';
import { SchemaLoader } from './lib/schema-loader';

const configLoader = new ConfigLoader();
Injector.put(configLoader, 'ConfigLoader');

const csvLoader = new CSVLoader(configLoader);
Injector.put(csvLoader, 'CSVLoader');

const schemaLoader = new SchemaLoader();
Injector.put(schemaLoader, 'SchemaLoader');

const validator = new Validator(configLoader, schemaLoader);
Injector.put(validator, 'Validator');

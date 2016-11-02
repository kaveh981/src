'use strict';

import { Injector } from './lib/injector';
import { Validator } from './lib/validator';
import { ConfigLoader, CsvLoader, SchemaLoader } from './lib/loaders';

const configLoader = new ConfigLoader();
Injector.put(configLoader, 'ConfigLoader');

const csvLoader = new CsvLoader(configLoader);
Injector.put(csvLoader, 'CsvLoader');

const schemaLoader = new SchemaLoader();
Injector.put(schemaLoader, 'SchemaLoader');

const validator = new Validator(configLoader, schemaLoader);
Injector.put(validator, 'Validator');

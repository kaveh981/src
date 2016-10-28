'use strict';

import { Injector } from './lib/injector';
import { ConfigLoader, CsvLoader } from './lib/loaders';

const configLoader = new ConfigLoader();
Injector.put(configLoader, "ConfigLoader");

const csvLoader = new CsvLoader(configLoader);
Injector.put(csvLoader, "CsvLoader");

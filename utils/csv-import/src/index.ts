'use strict';

import * as fs from 'fs';
import csv = require('csv-parse/lib/sync');

let input = fs.readFileSync('/home/eusebioolalde/work/local/tmp/example.csv').toString();

console.log(input);

console.log(csv(input, {columns: true}));
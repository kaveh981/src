'use strict';

import { LoadDependencies } from './loader.ts';

LoadDependencies();

process.on('SIGTERM', () => {
    console.log('Shutting down gracefully...');
    setTimeout(process.exit, 0, 0);
});

const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env'), quiet: true });
require('../src/services/storage').prepareBucket()
    .then(() => console.log('Bucket privado gamix-imagenes listo.'))
    .catch(error => {
        console.error(error.message);
        process.exitCode = 1;
    });

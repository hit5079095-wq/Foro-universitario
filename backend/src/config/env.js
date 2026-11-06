const path = require('path');

// Carga siempre backend/.env, sin importar el directorio desde el que se arranque.
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

module.exports = process.env;

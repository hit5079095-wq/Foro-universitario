require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const { defineConfig } = require('prisma/config');

module.exports = defineConfig({
    schema: 'prisma/schema.prisma',
    migrations: {
        seed: 'node prisma/seed.js'
    }
});

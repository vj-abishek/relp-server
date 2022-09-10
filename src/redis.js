const Redis = require('ioredis');

const client = new Redis(process.env.REDIS_CLIENT);
console.log('connected to redis');
module.exports = client;

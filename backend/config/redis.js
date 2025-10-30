const { createClient } = require('redis');

const url = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

const client = createClient({
  url,
  socket: url.startsWith('rediss://') ? { tls: true } : undefined,
});

client.on('error', (e) => console.error('Redis error:', e));

async function connectRedis() {
  if (!client.isOpen) {
    await client.connect();
  }
}

module.exports = { client, connectRedis };
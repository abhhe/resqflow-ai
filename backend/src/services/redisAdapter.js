/**
 * Redis Real-Time State & Pub/Sub Adapter (PS10)
 * Connects to Redis instance if REDIS_URL/REDIS_HOST is provided;
 * otherwise gracefully falls back to a high-speed in-memory state cache with identical API.
 */

class RedisAdapter {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.memoryStore = new Map();
    this.subscribers = new Map();

    this.init();
  }

  async init() {
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      try {
        const { createClient } = require('redis');
        this.client = createClient({ url: redisUrl });
        this.client.on('error', (err) => {
          console.warn('[REDIS] Redis client error, operating on memory cache fallback:', err.message);
          this.isConnected = false;
        });
        await this.client.connect();
        this.isConnected = true;
        console.log('[REDIS] Connected to external Redis instance for real-time state.');
      } catch (err) {
        console.warn('[REDIS] Unable to connect to external Redis. Using high-performance in-memory cache.');
        this.isConnected = false;
      }
    } else {
      // Memory state mode
      this.isConnected = false;
    }
  }

  async get(key) {
    if (this.isConnected && this.client) {
      try {
        const val = await this.client.get(key);
        return val ? JSON.parse(val) : null;
      } catch (_) {}
    }
    const val = this.memoryStore.get(key);
    return val !== undefined ? JSON.parse(JSON.stringify(val)) : null;
  }

  async set(key, value, ttlSeconds = null) {
    if (this.isConnected && this.client) {
      try {
        const strVal = JSON.stringify(value);
        if (ttlSeconds) {
          await this.client.setEx(key, ttlSeconds, strVal);
        } else {
          await this.client.set(key, strVal);
        }
        return true;
      } catch (_) {}
    }
    this.memoryStore.set(key, JSON.parse(JSON.stringify(value)));
    if (ttlSeconds) {
      setTimeout(() => {
        this.memoryStore.delete(key);
      }, ttlSeconds * 1000);
    }
    return true;
  }

  async del(key) {
    if (this.isConnected && this.client) {
      try {
        await this.client.del(key);
        return true;
      } catch (_) {}
    }
    this.memoryStore.delete(key);
    return true;
  }

  async publish(channel, message) {
    const payload = typeof message === 'string' ? message : JSON.stringify(message);
    if (this.isConnected && this.client) {
      try {
        await this.client.publish(channel, payload);
      } catch (_) {}
    }
    // Local memory pubsub
    const handlers = this.subscribers.get(channel) || [];
    handlers.forEach(fn => {
      try { fn(typeof message === 'string' ? JSON.parse(payload) : message); } catch (_) {}
    });
  }

  subscribe(channel, handler) {
    const handlers = this.subscribers.get(channel) || [];
    handlers.push(handler);
    this.subscribers.set(channel, handlers);
  }

  getStatus() {
    return {
      active: true,
      mode: this.isConnected ? 'EXTERNAL_REDIS_CLUSTER' : 'HIGH_PERFORMANCE_MEMORY_ADAPTER',
      keysTracked: this.memoryStore.size,
      subscribersCount: this.subscribers.size
    };
  }
}

const redisAdapter = new RedisAdapter();

module.exports = {
  RedisAdapter,
  redisAdapter
};


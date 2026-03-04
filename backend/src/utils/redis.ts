import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL;

let redis: Redis | undefined;
let isRedisConnected = false;

if (redisUrl) {
  redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    connectTimeout: 5000,
  });

  redis.on('connect', () => {
    console.log('Connected to Redis');
    isRedisConnected = true;
  });

  redis.on('error', (err) => {
    console.error('Redis error:', err.message);
    isRedisConnected = false;
  });
} else {
  console.log('Redis not configured, using in-memory fallback');
  isRedisConnected = false;
}

export const connectRedis = async () => {
  if (!redis || !redisUrl) {
    console.log('Redis not configured, skipping connection');
    return;
  }
  try {
    await redis.connect();
  } catch (error: any) {
    console.error('Failed to connect to Redis:', error?.message || error);
    isRedisConnected = false;
  }
};

const inMemoryStore = new Map<string, { data: string; expiry: number }>();

export const sessionStore = {
  async get(sessionId: string): Promise<string | null> {
    if (!isRedisConnected || !redis) {
      const item = inMemoryStore.get(`session:${sessionId}`);
      if (item && item.expiry > Date.now()) {
        return item.data;
      }
      inMemoryStore.delete(`session:${sessionId}`);
      return null;
    }
    const data = await redis.get(`session:${sessionId}`);
    return data;
  },

  async set(sessionId: string, sessionData: string, ttl: number = 604800): Promise<void> {
    if (!isRedisConnected || !redis) {
      inMemoryStore.set(`session:${sessionId}`, { data: sessionData, expiry: Date.now() + ttl * 1000 });
      return;
    }
    await redis.setex(`session:${sessionId}`, ttl, sessionData);
  },

  async destroy(sessionId: string): Promise<void> {
    if (!isRedisConnected || !redis) {
      inMemoryStore.delete(`session:${sessionId}`);
      return;
    }
    await redis.del(`session:${sessionId}`);
  },

  async touch(sessionId: string, ttl: number = 604800): Promise<void> {
    if (!isRedisConnected || !redis) {
      const item = inMemoryStore.get(`session:${sessionId}`);
      if (item) {
        item.expiry = Date.now() + ttl * 1000;
      }
      return;
    }
    await redis.expire(`session:${sessionId}`, ttl);
  },
};

export default redis;

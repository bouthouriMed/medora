import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

redis.on('connect', () => {
  console.log('Connected to Redis');
});

redis.on('error', (err) => {
  console.error('Redis error:', err);
});

export const connectRedis = async () => {
  try {
    await redis.connect();
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
  }
};

export const sessionStore = {
  async get(sessionId: string): Promise<string | null> {
    const data = await redis.get(`session:${sessionId}`);
    return data;
  },

  async set(sessionId: string, sessionData: string, ttl: number = 604800): Promise<void> {
    await redis.setex(`session:${sessionId}`, ttl, sessionData);
  },

  async destroy(sessionId: string): Promise<void> {
    await redis.del(`session:${sessionId}`);
  },

  async touch(sessionId: string, ttl: number = 604800): Promise<void> {
    await redis.expire(`session:${sessionId}`, ttl);
  },
};

export default redis;

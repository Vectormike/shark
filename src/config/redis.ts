import { createClient, RedisClientType } from 'redis';

// Redis configuration
const redisConfig = {
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
};

// Create Redis client
export const redisClient: RedisClientType = createClient({
  url: redisConfig.url,
  socket: {
    host: redisConfig.host,
    port: redisConfig.port,
    reconnectStrategy: (retries) => Math.min(retries * 50, 1000),
  },
  password: redisConfig.password,
  database: redisConfig.db,
});

// Redis connection events
redisClient.on('connect', () => {
  console.log('✅ Redis client connecting...');
});

redisClient.on('ready', () => {
  console.log('✅ Redis client connected successfully');
});

redisClient.on('error', (error) => {
  console.error('❌ Redis client error:', error);
});

redisClient.on('end', () => {
  console.log('📴 Redis client disconnected');
});

// Connect to Redis
export const connectRedis = async (): Promise<boolean> => {
  try {
    await redisClient.connect();
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to Redis:', error);
    return false;
  }
};

// Cache utilities
export class CacheService {
  // Set cache with expiration (in seconds)
  static async set(key: string, value: any, expirationInSeconds?: number): Promise<void> {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      if (expirationInSeconds) {
        await redisClient.setEx(key, expirationInSeconds, stringValue);
      } else {
        await redisClient.set(key, stringValue);
      }
    } catch (error) {
      console.error('Cache set error:', error);
      throw error;
    }
  }

  // Get cache value
  static async get(key: string): Promise<any> {
    try {
      const value = await redisClient.get(key);
      if (!value) return null;

      // Try to parse as JSON, if it fails return as string
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  // Delete cache key
  static async delete(key: string): Promise<void> {
    try {
      await redisClient.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
      throw error;
    }
  }

  // Check if key exists
  static async exists(key: string): Promise<boolean> {
    try {
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  // Set expiration on existing key
  static async expire(key: string, seconds: number): Promise<void> {
    try {
      await redisClient.expire(key, seconds);
    } catch (error) {
      console.error('Cache expire error:', error);
      throw error;
    }
  }

  // Get multiple keys
  static async mget(keys: string[]): Promise<any[]> {
    try {
      const values = await redisClient.mGet(keys);
      return values.map(value => {
        if (!value) return null;
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      });
    } catch (error) {
      console.error('Cache mget error:', error);
      return [];
    }
  }

  // Clear all cache (use with caution)
  static async flush(): Promise<void> {
    try {
      await redisClient.flushDb();
    } catch (error) {
      console.error('Cache flush error:', error);
      throw error;
    }
  }
}

// Common cache key patterns
export const CacheKeys = {
  USER_PROFILE: (userId: string) => `user:profile:${userId}`,
  USER_LOANS: (userId: string) => `user:loans:${userId}`,
  LOAN_DETAILS: (loanId: string) => `loan:${loanId}`,
  USER_SESSION: (userId: string) => `session:${userId}`,
  RESET_PASSWORD: (token: string) => `reset:${token}`,
  EMAIL_VERIFICATION: (token: string) => `verify:${token}`,
  RATE_LIMIT: (identifier: string) => `rate_limit:${identifier}`,

  // Borrower-specific cache keys
  ALL_BORROWERS: 'borrowers:all',
  BORROWER_DETAILS: (borrowerId: string) => `borrower:${borrowerId}`,
  BORROWER_LOANS: (borrowerId: string) => `borrower:loans:${borrowerId}`,
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Closing Redis connection...');
  await redisClient.quit();
});

export default redisClient;

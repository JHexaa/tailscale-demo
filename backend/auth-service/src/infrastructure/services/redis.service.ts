import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;

  constructor(private readonly configService: ConfigService) {
    const redisUrl = this.configService.get<string>('REDIS_URL', 'redis://localhost:6379');
    this.client = new Redis(redisUrl);
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.setex(key, ttlSeconds, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  async setBlacklist(token: string, ttlSeconds: number): Promise<void> {
    await this.set(`blacklist:${token}`, '1', ttlSeconds);
  }

  async isBlacklisted(token: string): Promise<boolean> {
    return this.exists(`blacklist:${token}`);
  }

  async cacheUserPermissions(
    userId: string,
    permissions: string[],
    ttlSeconds = 300,
  ): Promise<void> {
    await this.set(
      `permissions:${userId}`,
      JSON.stringify(permissions),
      ttlSeconds,
    );
  }

  async getCachedUserPermissions(userId: string): Promise<string[] | null> {
    const cached = await this.get(`permissions:${userId}`);
    if (cached) {
      return JSON.parse(cached);
    }
    return null;
  }

  async invalidateUserPermissions(userId: string): Promise<void> {
    await this.del(`permissions:${userId}`);
  }
}

import 'server-only';
import { Redis } from '@upstash/redis';

let client: Redis | null = null;

/** Lazy so a missing KV config does not crash module load. */
export function getRedis(): Redis {
    if (!client) client = Redis.fromEnv();
    return client;
}

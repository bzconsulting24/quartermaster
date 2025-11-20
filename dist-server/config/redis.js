const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';
const parsed = new URL(redisUrl);
export const redisConnection = {
    host: parsed.hostname,
    port: Number(parsed.port || 6379),
    password: parsed.password || undefined,
    db: parsed.pathname ? Number(parsed.pathname.replace('/', '')) || 0 : 0,
    tls: parsed.protocol === 'rediss:' ? {} : undefined
};

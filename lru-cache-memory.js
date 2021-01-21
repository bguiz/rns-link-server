const lruCache = require('lru-cache');

const cacheMaxItems = process.env.CACHE_MAX ||
  2048; // maximum item count before dropping
const cacheTtl = process.env.CACHE_TTL ||
  (24 * 60); // in minutes, default to a day

const lruCacheOptions = {
  max: cacheMaxItems,
  maxAge: (cacheTtl * 60e3),
};

const cache = new lruCache(lruCacheOptions);

module.exports = cache;

// TODO note that `maxAge` based cache invalidation
// is intended only as a crude first cut approach.
// Cache invalidation strategies to consider:
//
// 1. Reply instantly using cached value,and
//    and query new value as a background task
// 2. Set up listeners over web sockets (using web3.js)
//    on the various RNS resolvers which support contenthash
//    an invalidate relevant address upon each event received

// TODO set up persistent cache (like redis) to allow
// sharing between multiple load-balanced instances
// of this server

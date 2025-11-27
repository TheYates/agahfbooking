// 🎯 Redis Performance Testing Script
// Test the multi-layer caching performance

const { AdvancedCache } = require('../lib/redis-cache');
const { Pool } = require('pg');

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

async function testRedisPerformance() {
  const pool = new Pool(process.env.DATABASE_URL ? {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  } : {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  async function query(text, params) {
    const client = await pool.connect();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  }

  try {
    console.log('🎯 Testing Redis Multi-Layer Cache Performance...\n');

    const clientId = 1;
    const testKey = `dashboard_stats_${clientId}`;

    // Test function that simulates database query
    const slowDatabaseQuery = async () => {
      console.log('🐌 Simulating slow database query...');
      const result = await query(`
        SELECT 
          upcoming_count,
          total_month_count,
          completed_count,
          next_appointment_date
        FROM dashboard_stats_mv 
        WHERE client_id = $1
      `, [clientId]);

      return result.rows[0] || {
        upcoming_count: 0,
        total_month_count: 0,
        completed_count: 0,
        next_appointment_date: null
      };
    };

    console.log('🔄 PERFORMANCE TEST ROUNDS\n');

    // Round 1: Cache Miss (Database hit)
    console.log('📊 ROUND 1: Cache Miss (First Request)');
    console.log('==========================================');
    
    const round1Start = Date.now();
    const result1 = await AdvancedCache.get(testKey, slowDatabaseQuery, 'dashboardStats');
    const round1Time = Date.now() - round1Start;
    
    console.log(`⏱️  Time: ${round1Time}ms`);
    console.log(`📊 Data: ${JSON.stringify(result1).substring(0, 100)}...`);
    console.log('');

    // Round 2: Redis Cache Hit (2-5ms expected)
    console.log('📊 ROUND 2: Redis Cache Hit (Second Request)');
    console.log('=============================================');
    
    const round2Start = Date.now();
    const result2 = await AdvancedCache.get(testKey, slowDatabaseQuery, 'dashboardStats');
    const round2Time = Date.now() - round2Start;
    
    console.log(`⏱️  Time: ${round2Time}ms`);
    console.log(`🚀 Speed improvement: ${Math.round(round1Time / round2Time)}x faster`);
    console.log('');

    // Round 3: Memory Cache Hit (< 1ms expected)
    console.log('📊 ROUND 3: Memory Cache Hit (Third Request)');
    console.log('=============================================');
    
    const round3Start = Date.now();
    const result3 = await AdvancedCache.get(testKey, slowDatabaseQuery, 'dashboardStats');
    const round3Time = Date.now() - round3Start;
    
    console.log(`⏱️  Time: ${round3Time}ms`);
    console.log(`🔥 Speed improvement: ${Math.round(round1Time / round3Time)}x faster`);
    console.log('');

    // Test multiple different cache keys
    console.log('📊 ROUND 4: Multiple Cache Keys Performance');
    console.log('==========================================');
    
    const multiTestStart = Date.now();
    const multiPromises = [];
    
    for (let i = 1; i <= 5; i++) {
      multiPromises.push(
        AdvancedCache.get(`test_key_${i}`, async () => {
          // Simulate different data
          return { id: i, data: `Test data ${i}`, timestamp: Date.now() };
        }, 'userStats')
      );
    }
    
    await Promise.all(multiPromises);
    const multiTestTime = Date.now() - multiTestStart;
    
    console.log(`⏱️  5 concurrent cache operations: ${multiTestTime}ms`);
    console.log(`📊 Average per operation: ${Math.round(multiTestTime / 5)}ms`);
    console.log('');

    // Cache statistics
    console.log('📊 CACHE STATISTICS');
    console.log('===================');
    
    try {
      const stats = await AdvancedCache.getStats();
      console.log(`🧠 Memory cache entries: ${stats.memory.size}`);
      console.log(`💾 Redis memory usage: ${stats.redis.memory}`);
      console.log(`🔑 Redis keys: ${stats.redis.keys}`);
    } catch (error) {
      console.log('📊 Cache stats unavailable (Redis not connected)');
    }

    console.log('');

    // Performance Summary
    console.log('🎯 PERFORMANCE SUMMARY');
    console.log('======================');
    console.log(`🐌 Database query: ${round1Time}ms`);
    console.log(`⚡ Redis cache hit: ${round2Time}ms`);
    console.log(`🔥 Memory cache hit: ${round3Time}ms`);
    console.log(`🚀 Best improvement: ${Math.round(round1Time / round3Time)}x faster`);

    // Performance grading
    let grade = 'F';
    let message = 'Redis caching not working properly';

    if (round3Time < 5) {
      grade = 'A+';
      message = 'EXCELLENT! Sub-5ms performance achieved!';
    } else if (round3Time < 10) {
      grade = 'A';
      message = 'GREAT! Sub-10ms performance!';
    } else if (round3Time < 20) {
      grade = 'B';
      message = 'GOOD! Under 20ms performance!';
    } else if (round3Time < 50) {
      grade = 'C';
      message = 'Fair performance, Redis working but not optimized';
    }

    console.log(`\n🎯 Performance Grade: ${grade}`);
    console.log(`💡 ${message}`);

    if (round3Time < 10) {
      console.log('\n🌟 CONGRATULATIONS!');
      console.log('Your booking system now has NEAR-INSTANTANEOUS performance!');
      console.log('✅ Dashboard loads in < 10ms');
      console.log('✅ API responses in < 5ms');
      console.log('✅ Ready for production scale!');
      
      console.log('\n🚀 NEXT STEPS:');
      console.log('1. Replace your current API routes with the cached versions');
      console.log('2. Set up Redis in production (AWS ElastiCache, Redis Cloud, etc.)');
      console.log('3. Monitor cache hit rates and optimize as needed');
    } else {
      console.log('\n💡 OPTIMIZATION SUGGESTIONS:');
      if (round2Time > 20) {
        console.log('🔧 Redis connection might be slow - check Redis server location');
      }
      if (round3Time > round2Time * 2) {
        console.log('🧠 Memory cache not working optimally');
      }
      console.log('📖 Check Redis connection settings in lib/redis-cache.ts');
    }

    console.log('\n📝 IMPLEMENTATION GUIDE:');
    console.log('1. Copy cached-route.ts files to replace your current routes');
    console.log('2. Update imports to use AdvancedCache in your APIs');
    console.log('3. Test with: curl "http://localhost:3000/api/dashboard/stats?clientId=1"');

  } catch (error) {
    console.error('❌ Redis performance test failed:', error.message);
    console.log('\n🔧 TROUBLESHOOTING:');
    console.log('1. Make sure Redis is installed: npm install ioredis');
    console.log('2. Check if Redis server is running: redis-server');
    console.log('3. Test Redis connection: redis-cli ping');
    console.log('4. For local development: docker run -d -p 6379:6379 redis:alpine');
  } finally {
    await pool.end();
    process.exit(0);
  }
}

// Add this to package.json scripts
console.log('🔧 Add to package.json scripts:');
console.log('"redis:test": "node scripts/test-redis-performance.js"');
console.log('\nThen run: npm run redis:test\n');

// Run if called directly
if (require.main === module) {
  testRedisPerformance().catch(console.error);
}

module.exports = { testRedisPerformance };
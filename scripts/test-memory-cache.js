// 🎯 Memory Cache Performance Testing (No Redis Required)
// Test immediate 3-6x performance improvement

const { MemoryCache } = require('../lib/memory-cache.js');
const { Pool } = require('pg');

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

async function testMemoryCachePerformance() {
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
    console.log('🎯 Testing Memory Cache Performance (No Redis Required)...\n');

    const clientId = 1;
    const testKey = `dashboard_stats_${clientId}`;

    // Test function that simulates database query
    const slowDatabaseQuery = async () => {
      console.log('🐌 Fetching from database (materialized view)...');
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

    console.log('🔄 MEMORY CACHE PERFORMANCE TEST\n');

    // Round 1: Cache Miss (Database hit)
    console.log('📊 ROUND 1: Cache Miss (First Request)');
    console.log('==========================================');
    
    const round1Start = Date.now();
    const result1 = await MemoryCache.get(testKey, slowDatabaseQuery, 'dashboardStats');
    const round1Time = Date.now() - round1Start;
    
    console.log(`⏱️  Time: ${round1Time}ms`);
    console.log(`📊 Data: ${JSON.stringify(result1).substring(0, 100)}...`);
    console.log('');

    // Round 2: Memory Cache Hit (< 1ms expected)
    console.log('📊 ROUND 2: Memory Cache Hit (Second Request)');
    console.log('==============================================');
    
    const round2Start = Date.now();
    const result2 = await MemoryCache.get(testKey, slowDatabaseQuery, 'dashboardStats');
    const round2Time = Date.now() - round2Start;
    
    console.log(`⏱️  Time: ${round2Time}ms`);
    console.log(`🔥 Speed improvement: ${Math.round(round1Time / round2Time)}x faster`);
    console.log('');

    // Round 3: Multiple Memory Cache Hits
    console.log('📊 ROUND 3: Multiple Cache Hits (Third+ Requests)');
    console.log('=================================================');
    
    const multiTestStart = Date.now();
    const multiPromises = [];
    
    for (let i = 0; i < 5; i++) {
      multiPromises.push(
        MemoryCache.get(testKey, slowDatabaseQuery, 'dashboardStats')
      );
    }
    
    await Promise.all(multiPromises);
    const multiTestTime = Date.now() - multiTestStart;
    
    console.log(`⏱️  5 concurrent cache hits: ${multiTestTime}ms`);
    console.log(`📊 Average per request: ${Math.round(multiTestTime / 5)}ms`);
    console.log('');

    // Test different data types
    console.log('📊 ROUND 4: Different Cache Keys');
    console.log('=================================');
    
    const diffTestStart = Date.now();
    
    // Test departments cache
    await MemoryCache.get('departments', async () => {
      const result = await query('SELECT id, name, color FROM departments WHERE is_active = true LIMIT 5');
      return result.rows;
    }, 'departments');
    
    // Test monthly stats
    await MemoryCache.get(`monthly_stats_${clientId}`, async () => {
      const result = await query(`
        SELECT * FROM monthly_stats_mv 
        WHERE client_id = $1 
        ORDER BY month DESC LIMIT 6
      `, [clientId]);
      return result.rows;
    }, 'monthlyStats');
    
    const diffTestTime = Date.now() - diffTestStart;
    console.log(`⏱️  Different data types: ${diffTestTime}ms`);
    console.log('');

    // Cache statistics
    console.log('📊 MEMORY CACHE STATISTICS');
    console.log('===========================');
    
    const stats = MemoryCache.getStats();
    console.log(`🧠 Memory cache entries: ${stats.memory.size}`);
    console.log(`🔑 Cached keys: ${stats.memory.keys.join(', ')}`);
    console.log('');

    // Performance Summary
    console.log('🎯 PERFORMANCE SUMMARY');
    console.log('======================');
    console.log(`🐌 Database query (first): ${round1Time}ms`);
    console.log(`🔥 Memory cache hit: ${round2Time}ms`);
    console.log(`⚡ Best improvement: ${Math.round(round1Time / round2Time)}x faster`);
    console.log(`📊 Multi-request avg: ${Math.round(multiTestTime / 5)}ms`);

    // Performance grading
    let grade = 'F';
    let message = 'Memory caching not working properly';

    if (round2Time < 2) {
      grade = 'A+';
      message = 'EXCELLENT! Sub-2ms memory cache performance!';
    } else if (round2Time < 5) {
      grade = 'A';
      message = 'GREAT! Sub-5ms memory cache performance!';
    } else if (round2Time < 10) {
      grade = 'B';
      message = 'GOOD! Under 10ms performance!';
    } else if (round2Time < 20) {
      grade = 'C';
      message = 'Fair - memory cache working but could be optimized';
    }

    console.log(`\n🎯 Performance Grade: ${grade}`);
    console.log(`💡 ${message}`);

    const overallImprovement = Math.round(round1Time / round2Time);
    
    if (overallImprovement >= 10) {
      console.log('\n🌟 CONGRATULATIONS!');
      console.log('Your booking system now has significantly improved performance!');
      console.log(`✅ ${overallImprovement}x speed improvement achieved`);
      console.log('✅ Memory caching working perfectly');
      console.log('✅ Ready to replace your API routes!');
      
      console.log('\n🚀 NEXT STEPS:');
      console.log('1. Replace your dashboard API with the memory-cached version');
      console.log('2. Test the improvement in your app');
      console.log('3. Apply same caching to other slow APIs');
      console.log('4. Optional: Set up Redis later for even better performance');
    } else {
      console.log('\n💡 OPTIMIZATION SUGGESTIONS:');
      console.log('🔧 Memory cache is working but improvement could be better');
      console.log('📊 Check if materialized views are being used');
      console.log('🚀 Consider optimizing database queries further');
    }

    console.log('\n📝 HOW TO ACTIVATE:');
    console.log('1. Copy memory-cached-route.ts to replace your current route');
    console.log('2. Test with: curl "http://localhost:3000/api/dashboard/stats?clientId=1"');
    console.log('3. Look for fast response times in the X-Response-Time header');

  } catch (error) {
    console.error('❌ Memory cache test failed:', error.message);
    console.log('\n🔧 TROUBLESHOOTING:');
    console.log('1. Make sure materialized views exist: npm run views:create');
    console.log('2. Check database connection');
    console.log('3. Verify client_id=1 has data in dashboard_stats_mv');
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  testMemoryCachePerformance().catch(console.error);
}

module.exports = { testMemoryCachePerformance };
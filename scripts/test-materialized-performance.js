// 🎯 Test Materialized Views Performance
// Compare old vs new query performance

const { Pool } = require('pg');

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

async function testMaterializedPerformance() {
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

  try {
    console.log('🎯 Testing Materialized Views vs Regular Queries Performance...\n');

    const clientId = 1;
    
    // Test 1: Dashboard Stats - Materialized View vs Regular Query
    console.log('📊 TEST 1: Dashboard Statistics');
    console.log('================================');
    
    // Materialized view test
    const mvStartTime = Date.now();
    const mvResult = await pool.query('SELECT * FROM dashboard_stats_mv WHERE client_id = $1', [clientId]);
    const mvTime = Date.now() - mvStartTime;
    
    // Regular query test
    const regStartTime = Date.now();
    const regResult = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE appointment_date >= CURRENT_DATE AND status NOT IN ('cancelled', 'completed', 'no_show')) as upcoming_count,
        COUNT(*) FILTER (WHERE DATE_TRUNC('month', appointment_date) = DATE_TRUNC('month', CURRENT_DATE)) as total_month_count,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
        MIN(appointment_date) FILTER (WHERE appointment_date >= CURRENT_DATE AND status NOT IN ('cancelled', 'completed', 'no_show')) as next_appointment_date
      FROM appointments 
      WHERE client_id = $1
    `, [clientId]);
    const regTime = Date.now() - regStartTime;
    
    console.log(`🚀 Materialized View: ${mvTime}ms`);
    console.log(`🐌 Regular Query: ${regTime}ms`);
    console.log(`⚡ Improvement: ${Math.round(regTime / mvTime)}x faster`);
    console.log('');

    // Test 2: Monthly Stats - Materialized View vs Regular Query
    console.log('📈 TEST 2: Monthly Statistics');
    console.log('=============================');
    
    // Materialized view test
    const mvMonthlyStart = Date.now();
    const mvMonthlyResult = await pool.query(`
      SELECT * FROM monthly_stats_mv 
      WHERE client_id = $1 
      ORDER BY month DESC 
      LIMIT 6
    `, [clientId]);
    const mvMonthlyTime = Date.now() - mvMonthlyStart;
    
    // Regular query test
    const regMonthlyStart = Date.now();
    const regMonthlyResult = await pool.query(`
      SELECT 
        date_trunc('month', appointment_date) as month,
        COUNT(*) as total_appointments,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_appointments,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_appointments
      FROM appointments
      WHERE client_id = $1
        AND appointment_date >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY date_trunc('month', appointment_date)
      ORDER BY month DESC
      LIMIT 6
    `, [clientId]);
    const regMonthlyTime = Date.now() - regMonthlyStart;
    
    console.log(`🚀 Materialized View: ${mvMonthlyTime}ms`);
    console.log(`🐌 Regular Query: ${regMonthlyTime}ms`);
    console.log(`⚡ Improvement: ${Math.round(regMonthlyTime / mvMonthlyTime)}x faster`);
    console.log('');

    // Test 3: Simple Department List (should be fast anyway)
    console.log('🏥 TEST 3: Department List');
    console.log('=========================');
    
    const deptStart = Date.now();
    const deptResult = await pool.query(`
      SELECT id, name, color, working_days
      FROM departments 
      WHERE is_active = true
      ORDER BY name
    `);
    const deptTime = Date.now() - deptStart;
    
    console.log(`🏥 Department List: ${deptTime}ms`);
    console.log('');

    // Calculate overall performance scores
    const mvAvg = Math.round((mvTime + mvMonthlyTime) / 2);
    const regAvg = Math.round((regTime + regMonthlyTime) / 2);
    const overallImprovement = Math.round(regAvg / mvAvg);
    
    console.log('🎯 PERFORMANCE SUMMARY');
    console.log('======================');
    console.log(`✅ Materialized Views Avg: ${mvAvg}ms`);
    console.log(`🐌 Regular Queries Avg: ${regAvg}ms`);
    console.log(`🚀 Overall Improvement: ${overallImprovement}x faster`);
    console.log(`📊 Department Query: ${deptTime}ms`);

    // Performance grading
    let grade = 'F';
    let message = 'Needs significant improvement';
    
    if (mvAvg < 20) {
      grade = 'A+';
      message = 'EXCELLENT! Near-instantaneous performance!';
    } else if (mvAvg < 50) {
      grade = 'A';
      message = 'GREAT! Production-ready performance!';
    } else if (mvAvg < 100) {
      grade = 'B';
      message = 'GOOD! Solid performance improvement!';
    } else if (mvAvg < 200) {
      grade = 'C';
      message = 'Fair performance, room for improvement';
    }
    
    console.log(`\n🎯 Performance Grade: ${grade}`);
    console.log(`💡 ${message}`);
    
    if (mvAvg < 50) {
      console.log('\n🌟 CONGRATULATIONS!');
      console.log('Your booking system now has near-instantaneous performance!');
      console.log('Dashboard will load in under 100ms');
      console.log('Ready for Phase 2: Redis caching for sub-10ms responses');
    } else {
      console.log('\n💡 NEXT OPTIMIZATION STEPS:');
      console.log('1. Implement Redis caching for sub-50ms responses');
      console.log('2. Set up automatic materialized view refresh');
      console.log('3. Consider connection pooling optimizations');
    }

    console.log('\n📝 HOW TO USE IN YOUR APP:');
    console.log('Update your API routes to use materialized views:');
    console.log('');
    console.log('// Dashboard stats API');
    console.log('const stats = await query("SELECT * FROM dashboard_stats_mv WHERE client_id = ?", [clientId]);');
    console.log('');
    console.log('// Monthly stats API');
    console.log('const monthly = await query("SELECT * FROM monthly_stats_mv WHERE client_id = ? ORDER BY month DESC LIMIT 6", [clientId]);');

  } catch (error) {
    console.error('❌ Error testing performance:', error.message);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  testMaterializedPerformance().catch(console.error);
}

module.exports = { testMaterializedPerformance };
// 🎯 Performance Testing Script
// Test your database performance before and after optimizations

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

// Import database connection directly
const { Pool } = require('pg');

// Create database pool with same config as app
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

// Helper function to execute queries
async function query(text, params) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

async function testPerformance() {
  console.log('🎯 Testing Database Performance...\n');

  const tests = [
    {
      name: 'Dashboard Stats Query',
      sql: `
        SELECT 
          COUNT(*) FILTER (WHERE appointment_date >= CURRENT_DATE AND status NOT IN ('cancelled', 'completed', 'no_show')) as upcoming_count,
          COUNT(*) FILTER (WHERE DATE_TRUNC('month', appointment_date) = DATE_TRUNC('month', CURRENT_DATE)) as total_month_count,
          COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
          MIN(appointment_date) FILTER (WHERE appointment_date >= CURRENT_DATE AND status NOT IN ('cancelled', 'completed', 'no_show')) as next_appointment_date
        FROM appointments 
        WHERE client_id = $1
      `,
      params: [1],
      target: 50 // Target: under 50ms
    },
    {
      name: 'Available Slots Query',
      sql: `
        SELECT DISTINCT slot_number 
        FROM appointments 
        WHERE department_id = $1 
          AND appointment_date = $2
          AND status NOT IN ('cancelled', 'completed', 'no_show')
      `,
      params: [1, new Date().toISOString().split('T')[0]],
      target: 30 // Target: under 30ms
    },
    {
      name: 'Recent Appointments',
      sql: `
        SELECT a.*, d.name as department_name
        FROM appointments a
        JOIN departments d ON a.department_id = d.id
        WHERE a.client_id = $1
        ORDER BY a.appointment_date DESC
        LIMIT 10
      `,
      params: [1],
      target: 40 // Target: under 40ms
    },
    {
      name: 'Department List',
      sql: `
        SELECT id, name, color, working_days
        FROM departments 
        WHERE is_active = true
        ORDER BY name
      `,
      params: [],
      target: 20 // Target: under 20ms
    },
    {
      name: 'Monthly Appointments Count',
      sql: `
        SELECT 
          date_trunc('month', appointment_date) as month,
          COUNT(*) as total
        FROM appointments
        WHERE client_id = $1
          AND appointment_date >= CURRENT_DATE - INTERVAL '6 months'
        GROUP BY date_trunc('month', appointment_date)
        ORDER BY month DESC
      `,
      params: [1],
      target: 60 // Target: under 60ms
    }
  ];

  let totalTests = 0;
  let passedTests = 0;
  let totalTime = 0;

  for (const test of tests) {
    try {
      console.log(`🔍 Testing: ${test.name}`);
      
      // Run the test 3 times and take average
      const times = [];
      for (let i = 0; i < 3; i++) {
        const startTime = Date.now();
        const result = await query(test.sql, test.params);
        const duration = Date.now() - startTime;
        times.push(duration);
      }
      
      const avgTime = Math.round(times.reduce((a, b) => a + b) / times.length);
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);
      
      totalTime += avgTime;
      totalTests++;
      
      if (avgTime <= test.target) {
        console.log(`✅ PASS: ${avgTime}ms (target: ${test.target}ms) [${minTime}-${maxTime}ms]`);
        passedTests++;
      } else {
        console.log(`❌ SLOW: ${avgTime}ms (target: ${test.target}ms) [${minTime}-${maxTime}ms]`);
      }
      
    } catch (error) {
      console.log(`💥 ERROR: ${error.message}`);
      totalTests++;
    }
    
    console.log(''); // Empty line for readability
  }

  // Performance Summary
  console.log('📊 PERFORMANCE SUMMARY');
  console.log('========================');
  console.log(`✅ Tests Passed: ${passedTests}/${totalTests}`);
  console.log(`⚡ Average Query Time: ${Math.round(totalTime / totalTests)}ms`);
  console.log(`🎯 Performance Score: ${Math.round((passedTests / totalTests) * 100)}%`);
  
  if (passedTests === totalTests) {
    console.log('🚀 EXCELLENT! All performance targets met!');
  } else if (passedTests >= totalTests * 0.8) {
    console.log('👍 GOOD! Most performance targets met.');
  } else {
    console.log('⚠️  NEEDS IMPROVEMENT! Consider running quick-performance-boost.sql');
  }

  // Performance Recommendations
  console.log('\n💡 RECOMMENDATIONS:');
  if (totalTime / totalTests > 50) {
    console.log('🔧 Run: node scripts/run-quick-boost.js');
    console.log('📖 See: NEAR_INSTANTANEOUS_PERFORMANCE_GUIDE.md');
  }
  if (passedTests < totalTests) {
    console.log('📊 Check slow query log for optimization opportunities');
    console.log('🚀 Consider implementing Redis caching (Phase 2)');
  }
  if (passedTests === totalTests) {
    console.log('🎯 Ready for Phase 2: Redis caching for sub-50ms responses!');
  }

  // Cleanup database connection
  await pool.end();

  return {
    passed: passedTests,
    total: totalTests,
    averageTime: Math.round(totalTime / totalTests),
    score: Math.round((passedTests / totalTests) * 100)
  };
}

// Add this to package.json scripts:
console.log('🔧 Add to package.json scripts:');
console.log('"test:perf": "node scripts/test-performance.js"');
console.log('\nThen run: npm run test:perf\n');

// Run if called directly
if (require.main === module) {
  testPerformance()
    .then(results => {
      console.log(`\n🎯 Final Score: ${results.score}% (${results.passed}/${results.total} tests passed)`);
      process.exit(results.score >= 80 ? 0 : 1);
    })
    .catch(console.error);
}

module.exports = { testPerformance };
// 🚀 Simple Materialized Views Creation
// Simplified version to avoid parsing issues

const { Pool } = require('pg');

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

async function createSimpleMaterializedViews() {
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
    console.log('🚀 Creating Materialized Views for Instant Performance...\n');

    // Step 1: Drop existing views if they exist
    console.log('⚡ Step 1: Cleaning up existing views...');
    try {
      await pool.query('DROP MATERIALIZED VIEW IF EXISTS dashboard_stats_mv');
      await pool.query('DROP MATERIALIZED VIEW IF EXISTS monthly_stats_mv');
      console.log('✅ Cleanup completed\n');
    } catch (error) {
      console.log('⏭️  No existing views to clean up\n');
    }

    // Step 2: Create Dashboard Stats View
    console.log('⚡ Step 2: Creating dashboard stats materialized view...');
    const dashboardViewStart = Date.now();
    await pool.query(`
      CREATE MATERIALIZED VIEW dashboard_stats_mv AS
      SELECT 
        a.client_id,
        COUNT(*) FILTER (WHERE a.appointment_date >= CURRENT_DATE AND a.status NOT IN ('cancelled', 'completed', 'no_show')) as upcoming_count,
        COUNT(*) FILTER (WHERE DATE_TRUNC('month', a.appointment_date) = DATE_TRUNC('month', CURRENT_DATE)) as total_month_count,
        COUNT(*) FILTER (WHERE a.status = 'completed') as completed_count,
        MIN(a.appointment_date) FILTER (WHERE a.appointment_date >= CURRENT_DATE AND a.status NOT IN ('cancelled', 'completed', 'no_show')) as next_appointment_date
      FROM appointments a
      GROUP BY a.client_id
    `);
    const dashboardViewTime = Date.now() - dashboardViewStart;
    console.log(`✅ Dashboard view created in ${dashboardViewTime}ms\n`);

    // Step 3: Create index on dashboard view
    console.log('⚡ Step 3: Creating dashboard index...');
    await pool.query('CREATE UNIQUE INDEX idx_dashboard_stats_mv_client ON dashboard_stats_mv (client_id)');
    console.log('✅ Dashboard index created\n');

    // Step 4: Create Monthly Stats View
    console.log('⚡ Step 4: Creating monthly stats materialized view...');
    const monthlyViewStart = Date.now();
    await pool.query(`
      CREATE MATERIALIZED VIEW monthly_stats_mv AS
      SELECT 
        client_id,
        date_trunc('month', appointment_date) as month,
        COUNT(*) as total_appointments,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_appointments,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_appointments,
        COUNT(*) FILTER (WHERE status = 'no_show') as no_show_appointments
      FROM appointments
      WHERE appointment_date >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY client_id, date_trunc('month', appointment_date)
    `);
    const monthlyViewTime = Date.now() - monthlyViewStart;
    console.log(`✅ Monthly view created in ${monthlyViewTime}ms\n`);

    // Step 5: Create index on monthly view
    console.log('⚡ Step 5: Creating monthly stats index...');
    await pool.query('CREATE INDEX idx_monthly_stats_mv_client_month ON monthly_stats_mv (client_id, month)');
    console.log('✅ Monthly index created\n');

    // Step 6: Test performance
    console.log('📊 Testing Materialized Views Performance...\n');

    // Test dashboard stats
    const dashboardTestStart = Date.now();
    const dashboardResult = await pool.query('SELECT * FROM dashboard_stats_mv WHERE client_id = 1');
    const dashboardTestTime = Date.now() - dashboardTestStart;
    console.log(`🎯 Dashboard Stats: ${dashboardTestTime}ms (Previous: ~1500ms) - ${dashboardResult.rows.length} rows`);

    // Test monthly stats
    const monthlyTestStart = Date.now();
    const monthlyResult = await pool.query('SELECT * FROM monthly_stats_mv WHERE client_id = 1 ORDER BY month DESC LIMIT 6');
    const monthlyTestTime = Date.now() - monthlyTestStart;
    console.log(`📈 Monthly Stats: ${monthlyTestTime}ms (Previous: ~400ms) - ${monthlyResult.rows.length} rows`);

    // Test regular query for comparison
    const regularTestStart = Date.now();
    const regularResult = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE appointment_date >= CURRENT_DATE AND status NOT IN ('cancelled', 'completed', 'no_show')) as upcoming_count,
        COUNT(*) FILTER (WHERE DATE_TRUNC('month', appointment_date) = DATE_TRUNC('month', CURRENT_DATE)) as total_month_count,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_count
      FROM appointments 
      WHERE client_id = 1
    `);
    const regularTestTime = Date.now() - regularTestStart;
    console.log(`🐌 Regular Query: ${regularTestTime}ms (for comparison)`);

    const avgMaterializedTime = Math.round((dashboardTestTime + monthlyTestTime) / 2);
    const improvement = Math.round(regularTestTime / avgMaterializedTime);

    console.log('\n🎉 MATERIALIZED VIEWS SUCCESSFULLY CREATED!');
    console.log('=============================================');
    console.log(`✅ Views created: 2`);
    console.log(`⚡ Materialized view avg: ${avgMaterializedTime}ms`);
    console.log(`🐌 Regular query: ${regularTestTime}ms`);
    console.log(`🚀 Performance improvement: ${improvement}x faster!`);

    if (avgMaterializedTime < 20) {
      console.log('\n🌟 EXCELLENT! Near-instantaneous performance achieved!');
      console.log('🎯 Dashboard will now load in < 100ms');
    } else if (avgMaterializedTime < 50) {
      console.log('\n👍 GREAT! Significant performance boost achieved');
      console.log('💡 Ready for production use');
    } else {
      console.log('\n⚡ GOOD! Performance improved significantly');
    }

    console.log('\n💡 NEXT STEPS:');
    console.log('1. Update your API routes to use materialized views:');
    console.log('   - Dashboard: SELECT * FROM dashboard_stats_mv WHERE client_id = ?');
    console.log('   - Monthly: SELECT * FROM monthly_stats_mv WHERE client_id = ? ORDER BY month DESC');
    console.log('2. Set up refresh schedule (every 30 seconds):');
    console.log('   - REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_stats_mv;');
    console.log('   - REFRESH MATERIALIZED VIEW CONCURRENTLY monthly_stats_mv;');
    console.log('3. Consider Redis caching for sub-10ms performance');

  } catch (error) {
    console.error('❌ Error creating materialized views:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  createSimpleMaterializedViews().catch(console.error);
}

module.exports = { createSimpleMaterializedViews };
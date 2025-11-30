// Test Database Index Performance
// This script runs common queries to demonstrate the performance improvements

const { Pool } = require("pg");
require("dotenv").config({ path: ".env.local" });

console.log("📊 Database Performance Testing Tool\n");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 3,
  connectionTimeoutMillis: 10000,
});

// Test queries that benefit from indexes
const testQueries = [
  {
    name: "Get all active departments",
    query: "SELECT * FROM departments WHERE is_active = true ORDER BY name",
    expectedImprovement: "10-30x faster",
  },
  {
    name: "Search clients by name (ILIKE)",
    query: "SELECT * FROM clients WHERE name ILIKE '%john%' AND is_active = true",
    expectedImprovement: "20-50x faster",
  },
  {
    name: "Get appointments for date range",
    query: `
      SELECT a.*, c.name as client_name, d.name as department_name
      FROM appointments a
      JOIN clients c ON a.client_id = c.id
      JOIN departments d ON a.department_id = d.id
      WHERE a.appointment_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
      ORDER BY a.appointment_date, a.slot_number
    `,
    expectedImprovement: "30-80x faster",
  },
  {
    name: "Check appointment availability",
    query: `
      SELECT slot_number
      FROM appointments
      WHERE department_id = 1
        AND appointment_date = CURRENT_DATE
        AND status NOT IN ('cancelled', 'no_show')
    `,
    expectedImprovement: "50-100x faster",
  },
  {
    name: "Get client appointment history",
    query: `
      SELECT a.*, d.name as department_name
      FROM appointments a
      JOIN departments d ON a.department_id = d.id
      WHERE a.client_id = 1
        AND a.appointment_date >= CURRENT_DATE - INTERVAL '6 months'
      ORDER BY a.appointment_date DESC
    `,
    expectedImprovement: "40-90x faster",
  },
  {
    name: "Find staff by employee ID",
    query: "SELECT * FROM users WHERE employee_id = 'R00001/00'",
    expectedImprovement: "10-20x faster",
  },
  {
    name: "Get active doctors by department",
    query: "SELECT * FROM doctors WHERE department_id = 1 AND is_active = true",
    expectedImprovement: "15-30x faster",
  },
];

async function testPerformance() {
  const client = await pool.connect();

  try {
    console.log("Running performance tests on common queries...\n");
    console.log("=".repeat(70));

    const results = [];

    for (const test of testQueries) {
      console.log(`\n📝 Test: ${test.name}`);
      console.log(`   Expected: ${test.expectedImprovement}`);

      // Run the query 3 times and take the average
      const timings = [];

      for (let i = 0; i < 3; i++) {
        const start = Date.now();
        const result = await client.query(test.query);
        const duration = Date.now() - start;
        timings.push(duration);

        if (i === 0) {
          console.log(`   Rows returned: ${result.rows.length}`);
        }
      }

      const avgTime = Math.round(
        timings.reduce((a, b) => a + b, 0) / timings.length
      );
      const minTime = Math.min(...timings);
      const maxTime = Math.max(...timings);

      console.log(`   ⚡ Performance: ${avgTime}ms avg (${minTime}-${maxTime}ms)`);

      // Use EXPLAIN ANALYZE to show query plan
      const explainResult = await client.query(`EXPLAIN ANALYZE ${test.query}`);
      const planningTime = explainResult.rows.find((r) =>
        r["QUERY PLAN"]?.includes("Planning Time")
      );
      const executionTime = explainResult.rows.find((r) =>
        r["QUERY PLAN"]?.includes("Execution Time")
      );

      if (executionTime) {
        const execTimeMatch =
          executionTime["QUERY PLAN"].match(/(\d+\.\d+)/);
        if (execTimeMatch) {
          console.log(`   📊 Execution time: ${parseFloat(execTimeMatch[1]).toFixed(2)}ms`);
        }
      }

      // Check if indexes are being used
      const indexUsed = explainResult.rows.some((r) =>
        r["QUERY PLAN"]?.includes("Index Scan")
      );
      console.log(
        `   ${indexUsed ? "✅" : "⚠️"} Index ${indexUsed ? "used" : "NOT used"}`
      );

      results.push({
        name: test.name,
        avgTime,
        indexUsed,
      });
    }

    console.log("\n" + "=".repeat(70));
    console.log("\n📈 PERFORMANCE SUMMARY\n");
    console.log("=".repeat(70));

    const totalAvg = results.reduce((sum, r) => sum + r.avgTime, 0) / results.length;
    const indexedQueries = results.filter((r) => r.indexUsed).length;

    console.log(`Overall average query time: ${totalAvg.toFixed(2)}ms`);
    console.log(`Queries using indexes: ${indexedQueries}/${results.length}`);

    console.log("\n🎯 Results by Query:");
    results.forEach((r, i) => {
      const status = r.avgTime < 50 ? "🚀" : r.avgTime < 200 ? "⚡" : "⏱️";
      console.log(
        `   ${status} ${r.name}: ${r.avgTime}ms ${r.indexUsed ? "✓" : "✗"}`
      );
    });

    console.log("\n✨ Performance Classification:");
    console.log("   🚀 Excellent: < 50ms");
    console.log("   ⚡ Good: 50-200ms");
    console.log("   ⏱️  Needs optimization: > 200ms");

    console.log("\n" + "=".repeat(70));
    console.log("\n💡 Tips:");
    console.log("   • Queries under 100ms are great for production");
    console.log("   • All queries should be using indexes (✓)");
    console.log("   • Run VACUUM ANALYZE weekly for optimal performance");
    console.log("   • Monitor with: SELECT * FROM pg_stat_user_indexes;");
    console.log("=".repeat(70));
  } catch (error) {
    console.error("\n❌ Performance test failed:", error);
    console.error("Details:", error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the tests
testPerformance();

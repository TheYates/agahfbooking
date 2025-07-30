// Simple database test without external dependencies
const { Pool } = require('pg');

async function testDatabase() {
  console.log('🔍 Testing database connection...');
  
  const pool = new Pool({
    connectionString: "postgresql://booking_user:booking_password_123@localhost:5432/agahf_booking"
  });

  try {
    // Test basic connection
    console.log('📡 Connecting to database...');
    const client = await pool.connect();
    console.log('✅ Database connection successful!');
    
    // Test basic query
    console.log('🔍 Testing basic query...');
    const result = await client.query('SELECT NOW()');
    console.log('✅ Basic query successful:', result.rows[0]);
    
    // Test our tables
    console.log('🔍 Checking database tables...');
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('📋 Tables found:');
    tables.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Test sample data
    console.log('🔍 Checking sample data...');
    
    const departments = await client.query('SELECT COUNT(*) FROM departments');
    console.log(`📊 Departments: ${departments.rows[0].count}`);
    
    const doctors = await client.query('SELECT COUNT(*) FROM doctors');
    console.log(`👨‍⚕️ Doctors: ${doctors.rows[0].count}`);
    
    const users = await client.query('SELECT COUNT(*) FROM users');
    console.log(`👥 Users: ${users.rows[0].count}`);
    
    // Test department colors
    const deptColors = await client.query('SELECT name, color FROM departments LIMIT 5');
    console.log('🎨 Department colors:');
    deptColors.rows.forEach(dept => {
      console.log(`  - ${dept.name}: ${dept.color}`);
    });
    
    client.release();
    console.log('🎉 Database test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    console.error('💡 Make sure PostgreSQL is running and credentials are correct');
  } finally {
    await pool.end();
  }
}

// Run the test
testDatabase();

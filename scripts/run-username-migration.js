require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔄 Starting database migration...');
    console.log('📋 Migration: Rename employee_id to username and make phone optional\n');
    
    const client = await pool.connect();
    
    try {
      // Start transaction
      await client.query('BEGIN');
      console.log('✅ Transaction started\n');
      
      // Step 1: Rename employee_id to username
      console.log('⚙️  Step 1: Renaming employee_id column to username...');
      await client.query('ALTER TABLE users RENAME COLUMN employee_id TO username');
      console.log('✅ Column renamed successfully\n');
      
      // Step 2: Make phone nullable
      console.log('⚙️  Step 2: Making phone column nullable...');
      await client.query('ALTER TABLE users ALTER COLUMN phone DROP NOT NULL');
      console.log('✅ Phone column is now nullable\n');
      
      // Commit transaction
      await client.query('COMMIT');
      console.log('✅ Transaction committed\n');
      
      console.log('✨ Migration completed successfully!');
      console.log('\n📊 Summary:');
      console.log('   ✓ Renamed employee_id column to username');
      console.log('   ✓ Made phone column nullable');
      console.log('   ✓ Preserved all existing data');
      console.log('   ✓ Maintained unique constraint on username');
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Migration failed, rolled back changes');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\n🔄 Database has been rolled back to previous state');
    throw error;
  } finally {
    await pool.end();
  }
}

runMigration().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

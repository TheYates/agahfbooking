const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function runMigration(migrationFile) {
  let pool;
  
  try {
    // Create connection pool
    if (process.env.DATABASE_URL) {
      pool = new Pool({
        connectionString: process.env.DATABASE_URL,
      });
    } else {
      pool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'booking_db',
        user: process.env.DB_USER || 'username',
        password: process.env.DB_PASSWORD || 'password',
      });
    }

    console.log('Connecting to database...');
    
    // Test connection
    const client = await pool.connect();
    console.log('Connected to database successfully!');
    
    // Read and execute the migration file
    const migrationPath = path.join(__dirname, migrationFile);
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }
    
    const migration = fs.readFileSync(migrationPath, 'utf8');
    
    console.log(`Executing migration: ${migrationFile}...`);
    await client.query(migration);
    console.log('Migration executed successfully!');
    
    client.release();
    
    // Test the migration results
    console.log('Testing migration results...');
    
    try {
      const clientsResult = await pool.query('SELECT COUNT(*) FROM clients');
      console.log(`Clients in database: ${clientsResult.rows[0].count}`);
    } catch (e) {
      console.log('Clients table not found or empty');
    }
    
    try {
      const usersResult = await pool.query('SELECT COUNT(*) FROM users');
      console.log(`Users (staff) in database: ${usersResult.rows[0].count}`);
    } catch (e) {
      console.log('Users table not found or empty');
    }
    
    try {
      const appointmentsResult = await pool.query('SELECT COUNT(*) FROM appointments');
      console.log(`Appointments in database: ${appointmentsResult.rows[0].count}`);
    } catch (e) {
      console.log('Appointments table not found or empty');
    }
    
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

// Get migration file from command line argument
const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('Usage: node run-migration.js <migration-file>');
  console.error('Example: node run-migration.js 002-separate-clients-users.sql');
  process.exit(1);
}

// Run the migration
runMigration(migrationFile);

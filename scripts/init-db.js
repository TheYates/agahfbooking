const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function initializeDatabase() {
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
    
    // Read and execute the schema file
    const schemaPath = path.join(__dirname, '001-initial-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Executing database schema...');
    await client.query(schema);
    console.log('Database schema executed successfully!');
    
    client.release();
    
    // Test some basic queries
    console.log('Testing database queries...');
    
    const doctorsResult = await pool.query('SELECT COUNT(*) FROM doctors');
    console.log(`Doctors in database: ${doctorsResult.rows[0].count}`);
    
    const usersResult = await pool.query('SELECT COUNT(*) FROM users');
    console.log(`Users in database: ${usersResult.rows[0].count}`);
    
    const settingsResult = await pool.query('SELECT COUNT(*) FROM system_settings');
    console.log(`System settings in database: ${settingsResult.rows[0].count}`);
    
    console.log('Database initialization completed successfully!');
    
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

// Run the initialization
initializeDatabase();

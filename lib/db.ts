import { Pool, PoolClient } from 'pg';

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'booking_db',
  user: process.env.DB_USER || 'username',
  password: process.env.DB_PASSWORD || 'password',
  // Connection pool settings
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
};

// Create a connection pool
let pool: Pool;

if (process.env.DATABASE_URL) {
  // Use DATABASE_URL if provided (common in production)
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
} else {
  // Use individual config variables
  pool = new Pool(dbConfig);
}

// Export the pool for direct use
export { pool };

// Helper function to execute queries
export async function query(text: string, params?: any[]): Promise<any> {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Helper function to get a client from the pool (for transactions)
export async function getClient(): Promise<PoolClient> {
  return await pool.connect();
}

// Helper function to execute queries with a specific client (for transactions)
export async function queryWithClient(client: PoolClient, text: string, params?: any[]): Promise<any> {
  try {
    const result = await client.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Graceful shutdown
export async function closePool(): Promise<void> {
  await pool.end();
}

// Test database connection
export async function testConnection(): Promise<boolean> {
  try {
    const result = await query('SELECT NOW()');
    console.log('Database connected successfully:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

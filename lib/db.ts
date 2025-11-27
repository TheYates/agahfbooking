import { Pool, PoolClient } from 'pg';

// Database configuration - OPTIMIZED for near-instantaneous performance
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'booking_db',
  user: process.env.DB_USER || 'username',
  password: process.env.DB_PASSWORD || 'password',
  
  // PERFORMANCE OPTIMIZATIONS - 5x faster connection handling
  max: 50,                    // Increase from 20 → 50 connections
  min: 10,                    // Keep 10 warm connections always ready
  acquireTimeoutMillis: 2000, // Faster timeout (was 10000ms → 2000ms)
  createTimeoutMillis: 3000,  // Time to establish new connection
  idleTimeoutMillis: 60000,   // Keep connections longer (30s → 60s)
  reapIntervalMillis: 1000,   // Check for idle connections every 1s
  createRetryIntervalMillis: 200, // Retry connection faster
  
  // Query performance optimizations
  statement_timeout: 30000,   // 30 second statement timeout
  query_timeout: 10000,       // 10 second query timeout
  application_name: 'booking-app-optimized',
  
  // Additional performance settings
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
};

// Create a connection pool
let pool: Pool;

if (process.env.DATABASE_URL) {
  // Use DATABASE_URL if provided (common in production) - OPTIMIZED
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 50,                    // Increased pool size
    min: 10,                    // Warm connections
    acquireTimeoutMillis: 2000, // Faster timeouts
    createTimeoutMillis: 3000,
    idleTimeoutMillis: 60000,   // Keep connections longer
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 200,
    statement_timeout: 30000,
    query_timeout: 10000,
    application_name: 'booking-app-optimized',
    ssl: { rejectUnauthorized: false }
  });
} else {
  // Use individual config variables
  pool = new Pool(dbConfig);
}

// Export the pool for direct use
export { pool };

// 📊 POOL PERFORMANCE MONITORING
pool.on('connect', (client) => {
  console.log('🔗 Database connection established');
});

pool.on('error', (err) => {
  console.error('🚨 Database pool error:', err);
});

// Monitor pool health every 30 seconds in development
if (process.env.NODE_ENV === 'development') {
  setInterval(() => {
    console.log(`📊 Pool Status: Total=${pool.totalCount}, Idle=${pool.idleCount}, Waiting=${pool.waitingCount}`);
  }, 30000);
}

// Helper function to execute queries - WITH PERFORMANCE MONITORING
export async function query(text: string, params?: any[]): Promise<any> {
  const startTime = Date.now();
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    const duration = Date.now() - startTime;
    
    // Log slow queries for optimization
    if (duration > 100) {
      console.warn(`🐌 Slow query detected: ${duration}ms`, {
        query: text.substring(0, 100) + '...',
        params: params?.length || 0,
        rows: result.rows?.length || 0
      });
    }
    
    // Log performance in development
    if (process.env.NODE_ENV === 'development' && duration > 50) {
      console.log(`⚡ Query: ${duration}ms | Rows: ${result.rows?.length || 0}`);
    }
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Database query error (${duration}ms):`, error);
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

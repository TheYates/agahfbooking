const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function fixEmployeeIds() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Fixing employee IDs for staff users...');
    
    // Check current state
    const currentUsers = await pool.query(`
      SELECT id, name, role, employee_id 
      FROM users 
      WHERE role IN ('admin', 'receptionist')
      ORDER BY role, id
    `);
    
    console.log('\nCurrent staff users:');
    currentUsers.rows.forEach(user => {
      console.log(`- ID: ${user.id}, Name: ${user.name}, Role: ${user.role}, Employee ID: ${user.employee_id}`);
    });
    
    // Update admin users with null employee_id
    const adminUpdate = await pool.query(`
      UPDATE users 
      SET employee_id = 'admin' 
      WHERE role = 'admin' AND employee_id IS NULL
      RETURNING id, name, employee_id
    `);
    
    if (adminUpdate.rows.length > 0) {
      console.log('\nUpdated admin users:');
      adminUpdate.rows.forEach(user => {
        console.log(`- ${user.name} (ID: ${user.id}) -> employee_id: ${user.employee_id}`);
      });
    }
    
    // Update receptionist users with null employee_id
    const receptionistUpdate = await pool.query(`
      UPDATE users 
      SET employee_id = 'receptionist' 
      WHERE role = 'receptionist' AND employee_id IS NULL
      RETURNING id, name, employee_id
    `);
    
    if (receptionistUpdate.rows.length > 0) {
      console.log('\nUpdated receptionist users:');
      receptionistUpdate.rows.forEach(user => {
        console.log(`- ${user.name} (ID: ${user.id}) -> employee_id: ${user.employee_id}`);
      });
    }
    
    // Final verification
    const finalUsers = await pool.query(`
      SELECT id, name, role, employee_id, 
             CASE WHEN password_hash IS NOT NULL THEN 'SET' ELSE 'NOT SET' END as password_status
      FROM users 
      WHERE role IN ('admin', 'receptionist')
      ORDER BY role, id
    `);
    
    console.log('\nFinal staff user status:');
    finalUsers.rows.forEach(user => {
      console.log(`- ${user.name} (${user.role}) - Employee ID: ${user.employee_id} - Password: ${user.password_status}`);
    });
    
    console.log('\nEmployee ID fix completed!');
    
  } catch (error) {
    console.error('Error fixing employee IDs:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

fixEmployeeIds();

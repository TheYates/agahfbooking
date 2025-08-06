const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function fixEmployeeIdsUnique() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Fixing employee IDs with unique values...');
    
    // Get users with null employee_id
    const nullEmployeeUsers = await pool.query(`
      SELECT id, name, role 
      FROM users 
      WHERE role IN ('admin', 'receptionist') AND employee_id IS NULL
      ORDER BY role, id
    `);
    
    console.log('\nUsers with null employee_id:');
    nullEmployeeUsers.rows.forEach(user => {
      console.log(`- ID: ${user.id}, Name: ${user.name}, Role: ${user.role}`);
    });
    
    // Update each user individually with unique employee_id
    for (const user of nullEmployeeUsers.rows) {
      let employeeId;
      if (user.role === 'admin') {
        employeeId = `admin_${user.id}`;
      } else if (user.role === 'receptionist') {
        employeeId = `receptionist_${user.id}`;
      }
      
      await pool.query(`
        UPDATE users 
        SET employee_id = $1 
        WHERE id = $2
      `, [employeeId, user.id]);
      
      console.log(`Updated user ${user.name} (ID: ${user.id}) -> employee_id: ${employeeId}`);
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
    console.log('\nYou can now log in with any of these credentials:');
    console.log('- Username: admin, Password: admin123');
    console.log('- Username: receptionist, Password: recep123');
    console.log('- Or use the specific employee_id shown above');
    
  } catch (error) {
    console.error('Error fixing employee IDs:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

fixEmployeeIdsUnique();

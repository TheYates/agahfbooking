const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: ".env.local" });

async function setupDemoPasswords() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log("Setting up demo passwords...");

    // Hash the demo passwords
    const adminPassword = await bcrypt.hash("admin123", 10);
    const receptionistPassword = await bcrypt.hash("recep123", 10);

    console.log("Passwords hashed successfully");

    // Update admin user
    await pool.query(
      `
      UPDATE users
      SET password_hash = $1, employee_id = 'admin'
      WHERE role = 'admin' AND (employee_id IS NULL OR employee_id = 'admin' OR name LIKE '%Admin%')
    `,
      [adminPassword]
    );

    console.log("Admin password set");

    // Update receptionist user
    await pool.query(
      `
      UPDATE users
      SET password_hash = $1, employee_id = 'receptionist'
      WHERE role = 'receptionist' AND (employee_id IS NULL OR employee_id = 'receptionist' OR name LIKE '%Johnson%')
    `,
      [receptionistPassword]
    );

    console.log("Receptionist password set");

    // Verify the setup
    const result = await pool.query(`
      SELECT name, role, employee_id, 
             CASE WHEN password_hash IS NOT NULL THEN 'SET' ELSE 'NOT SET' END as password_status
      FROM users 
      WHERE role IN ('admin', 'receptionist')
    `);

    console.log("\nDemo staff users:");
    result.rows.forEach((user) => {
      console.log(
        `- ${user.name} (${user.role}) - ID: ${user.employee_id} - Password: ${user.password_status}`
      );
    });

    console.log("\nDemo credentials:");
    console.log('Admin: username="admin", password="admin123"');
    console.log('Receptionist: username="receptionist", password="recep123"');
  } catch (error) {
    console.error("Error setting up demo passwords:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupDemoPasswords();

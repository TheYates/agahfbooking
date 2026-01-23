/**
 * Check what data exists in Convex
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://lovable-manatee-131.convex.cloud";

async function checkData() {
  console.log("🔍 Checking Convex Data...\n");
  
  const client = new ConvexHttpClient(CONVEX_URL);

  try {
    const [departments, users, clients, doctors, appointments] = await Promise.all([
      client.query(api.queries.getDepartments, {}),
      client.query(api.queries.getUsers, {}),
      client.query(api.queries.getClients, {}),
      client.query(api.queries.getDoctors, {}),
      client.query(api.queries.getAppointments, {}),
    ]);

    console.log("📊 Data Summary:");
    console.log(`  Departments: ${departments?.length || 0}`);
    console.log(`  Users: ${users?.length || 0}`);
    console.log(`  Clients: ${clients?.length || 0}`);
    console.log(`  Doctors: ${doctors?.length || 0}`);
    console.log(`  Appointments: ${appointments?.length || 0}`);
    
    if (appointments && appointments.length > 0) {
      console.log("\n📅 Sample Appointments:");
      appointments.slice(0, 3).forEach((apt: any) => {
        console.log(`  - ${apt.appointment_date} Slot ${apt.slot_number} (${apt.status})`);
      });
    }

  } catch (error) {
    console.error("\n❌ Error:", error);
  }
}

checkData();

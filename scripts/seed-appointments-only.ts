/**
 * Seed only appointments (simplified)
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://lovable-manatee-131.convex.cloud";

async function seedAppointments() {
  console.log("🌱 Seeding Appointments...\n");
  
  const client = new ConvexHttpClient(CONVEX_URL);

  try {
    // Get existing data
    const [departments, clients, doctors, users] = await Promise.all([
      client.query(api.queries.getDepartments, {}),
      client.query(api.queries.getClients, {}),
      client.query(api.queries.getDoctors, {}),
      client.query(api.queries.getUsers, {}),
    ]);

    console.log(`Found: ${departments?.length} departments, ${clients?.length} clients, ${doctors?.length} doctors, ${users?.length} users\n`);

    if (!departments || !clients || departments.length === 0 || clients.length === 0) {
      console.log("❌ Not enough data to create appointments");
      return;
    }

    // Create appointments for today and tomorrow
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dates = [
      today.toISOString().split("T")[0],
      tomorrow.toISOString().split("T")[0],
    ];

    let created = 0;
    
    // Create 10 appointments
    for (let i = 0; i < 10; i++) {
      try {
        const clientData = clients[i % clients.length];
        const dept = departments[i % departments.length];
        const doc = doctors && doctors.length > 0 ? doctors[i % doctors.length] : null;
        const date = dates[i % dates.length];
        const slot = (i % 20) + 1;
        const status = i % 2 === 0 ? "booked" : "confirmed";

        console.log(`Creating appointment ${i + 1}...`);
        console.log(`  Client: ${clientData._id}`);
        console.log(`  Department: ${dept._id}`);
        console.log(`  Date: ${date}, Slot: ${slot}`);
        
        await client.mutation(api.mutations.createAppointment, {
          client_id: clientData._id,
          department_id: dept._id,
          doctor_id: doc?._id,
          appointment_date: date,
          slot_number: slot,
          status: status as any,
          notes: `Test appointment ${i + 1}`,
          // booked_by is optional, will default to client_id
        });

        console.log(`  ✅ Created!\n`);
        created++;
      } catch (error: any) {
        console.error(`  ❌ Failed: ${error.message}\n`);
      }
    }

    console.log(`\n✅ Created ${created} appointments!`);

  } catch (error) {
    console.error("\n❌ Error:", error);
  }
}

seedAppointments();

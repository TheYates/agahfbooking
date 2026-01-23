/**
 * Seed appointments WITHOUT status field (it will default to "booked")
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://lovable-manatee-131.convex.cloud";

async function seedAppointments() {
  console.log("🌱 Seeding Appointments (without status)...\n");
  
  const client = new ConvexHttpClient(CONVEX_URL);

  try {
    const [departments, clients, doctors] = await Promise.all([
      client.query(api.queries.getDepartments, {}),
      client.query(api.queries.getClients, {}),
      client.query(api.queries.getDoctors, {}),
    ]);

    console.log(`Found: ${departments?.length} departments, ${clients?.length} clients, ${doctors?.length} doctors\n`);

    if (!departments || !clients || departments.length === 0 || clients.length === 0) {
      console.log("❌ Not enough data");
      return;
    }

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const dates = [
      today.toISOString().split("T")[0],
      tomorrow.toISOString().split("T")[0],
      nextWeek.toISOString().split("T")[0],
    ];

    let created = 0;
    
    for (let i = 0; i < 15; i++) {
      try {
        await client.mutation(api.mutations.createAppointment, {
          client_id: clients[i % clients.length]._id,
          department_id: departments[i % departments.length]._id,
          doctor_id: doctors && doctors.length > 0 ? doctors[i % doctors.length]._id : undefined,
          appointment_date: dates[i % dates.length],
          slot_number: (i % 20) + 1,
          notes: `Appointment ${i + 1}`,
          // No status - will default to "booked"
        });

        console.log(`✅ Created appointment ${i + 1}`);
        created++;
      } catch (error: any) {
        console.error(`❌ Failed ${i + 1}: ${error.message}`);
      }
    }

    console.log(`\n✅ Successfully created ${created} appointments!`);

  } catch (error) {
    console.error("\n❌ Error:", error);
  }
}

seedAppointments();

/**
 * Seed Convex with Complete Test Data
 * 
 * This script seeds:
 * - Departments
 * - Staff Users
 * - Clients
 * - Doctors
 * - Appointments
 * 
 * Usage: bun x tsx scripts/seed-convex-all.ts
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import bcrypt from "bcryptjs";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://lovable-manatee-131.convex.cloud";
const PASSWORD = "password123";

// Sample data
const departments = [
  {
    name: "Cardiology",
    description: "Heart and cardiovascular care",
    slots_per_day: 20,
    working_days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    working_hours: { start: "08:00", end: "17:00" },
    color: "#EF4444",
  },
  {
    name: "Pediatrics",
    description: "Children's healthcare and treatment",
    slots_per_day: 25,
    working_days: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
    working_hours: { start: "07:00", end: "18:00" },
    color: "#F59E0B",
  },
  {
    name: "General Medicine",
    description: "General health consultations and treatments",
    slots_per_day: 30,
    working_days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    working_hours: { start: "08:00", end: "16:00" },
    color: "#3B82F6",
  },
  {
    name: "Orthopedics",
    description: "Bone and joint care",
    slots_per_day: 15,
    working_days: ["monday", "wednesday", "friday"],
    working_hours: { start: "09:00", end: "15:00" },
    color: "#8B5CF6",
  },
  {
    name: "Emergency",
    description: "24/7 emergency medical care",
    slots_per_day: 50,
    working_days: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
    working_hours: { start: "00:00", end: "23:59" },
    color: "#DC2626",
  },
];

const staffUsers = [
  {
    name: "Admin User",
    phone: "+233244000001",
    role: "admin" as const,
    employee_id: "ADMIN001",
  },
  {
    name: "Jane Smith",
    phone: "+233244000002",
    role: "receptionist" as const,
    employee_id: "RECEP001",
  },
  {
    name: "Mary Johnson",
    phone: "+233244000003",
    role: "receptionist" as const,
    employee_id: "RECEP002",
  },
];

const clients = [
  {
    x_number: "X12345/67",
    name: "John Doe",
    phone: "+233244123456",
    category: "PRIVATE CASH",
    address: "123 Main Street, Accra",
    emergency_contact: "+233244123457",
  },
  {
    x_number: "X23456/78",
    name: "Alice Williams",
    phone: "+233244234567",
    category: "PUBLIC SPONSORED(NHIA)",
    address: "456 Oak Avenue, Kumasi",
  },
  {
    x_number: "X34567/89",
    name: "Bob Brown",
    phone: "+233244345678",
    category: "PRIVATE SPONSORED",
    address: "789 Pine Road, Takoradi",
    emergency_contact: "+233244345679",
  },
  {
    x_number: "X45678/90",
    name: "Sarah Davis",
    phone: "+233244456789",
    category: "PRIVATE CASH",
    address: "321 Cedar Lane, Tamale",
  },
  {
    x_number: "X56789/01",
    name: "Michael Wilson",
    phone: "+233244567890",
    category: "PRIVATE DEPENDENT",
    address: "654 Elm Street, Cape Coast",
    emergency_contact: "+233244567891",
  },
];

const doctors = [
  { name: "Dr. James Mensah", specialty: "Cardiology" },
  { name: "Dr. Grace Owusu", specialty: "Pediatrics" },
  { name: "Dr. Peter Asante", specialty: "General Medicine" },
  { name: "Dr. Ama Adjei", specialty: "Orthopedics" },
  { name: "Dr. Kwame Boateng", specialty: "Emergency" },
];

async function seedAll() {
  console.log("🌱 Seeding Convex with Complete Test Data...\n");
  
  // Hash password first
  const hashedPassword = await bcrypt.hash(PASSWORD, 10);
  console.log("🔐 Password hashed successfully\n");
  console.log(`📡 Convex URL: ${CONVEX_URL}\n`);
  console.log("=".repeat(60));

  const client = new ConvexHttpClient(CONVEX_URL);
  const results = {
    departments: 0,
    users: 0,
    clients: 0,
    doctors: 0,
    appointments: 0,
  };

  try {
    // 1. Seed Departments
    console.log("\n🏥 Seeding Departments...");
    const createdDepartments: any[] = [];
    for (const dept of departments) {
      try {
        const id = await client.mutation(api.mutations.createDepartment, dept);
        createdDepartments.push({ ...dept, id });
        console.log(`   ✅ ${dept.name}`);
        results.departments++;
      } catch (error: any) {
        if (error.message?.includes("already exists")) {
          console.log(`   ⚠️  ${dept.name} (already exists)`);
        } else {
          console.log(`   ❌ ${dept.name}: ${error.message}`);
        }
      }
    }

    // 2. Seed Staff Users
    console.log("\n👥 Seeding Staff Users...");
    for (const user of staffUsers) {
      try {
        await client.mutation(api.mutations.createUser, {
          ...user,
          password_hash: hashedPassword,
        });
        console.log(`   ✅ ${user.name} (${user.role})`);
        results.users++;
      } catch (error: any) {
        if (error.message?.includes("already exists")) {
          console.log(`   ⚠️  ${user.name} (already exists)`);
        } else {
          console.log(`   ❌ ${user.name}: ${error.message}`);
        }
      }
    }

    // 3. Seed Clients
    console.log("\n🏥 Seeding Clients...");
    const createdClients: any[] = [];
    for (const clientData of clients) {
      try {
        const id = await client.mutation(api.mutations.createClient, clientData);
        createdClients.push({ ...clientData, id });
        console.log(`   ✅ ${clientData.name} (${clientData.x_number})`);
        results.clients++;
      } catch (error: any) {
        if (error.message?.includes("already exists")) {
          console.log(`   ⚠️  ${clientData.name} (already exists)`);
        } else {
          console.log(`   ❌ ${clientData.name}: ${error.message}`);
        }
      }
    }

    // 4. Seed Doctors
    console.log("\n👨‍⚕️ Seeding Doctors...");
    const createdDoctors: any[] = [];
    
    // Get department IDs from Convex
    const allDepartments = await client.query(api.queries.getDepartments, {});
    
    for (const doctor of doctors) {
      try {
        // Find matching department
        const department = allDepartments?.find((d: any) => 
          d.name.toLowerCase().includes(doctor.specialty.toLowerCase())
        );
        
        if (department) {
          const id = await client.mutation(api.mutations.createDoctor, {
            name: doctor.name,
            department_id: department._id,
            specialty: doctor.specialty,
          });
          createdDoctors.push({ ...doctor, id });
          console.log(`   ✅ ${doctor.name} (${doctor.specialty})`);
          results.doctors++;
        } else {
          console.log(`   ⚠️  ${doctor.name} (department not found)`);
        }
      } catch (error: any) {
        console.log(`   ❌ ${doctor.name}: ${error.message}`);
      }
    }

    // 5. Seed Appointments (More comprehensive)
    console.log("\n📅 Seeding Appointments...");
    
    // Get all created data
    const allClients = await client.query(api.queries.getClients, {});
    const allDoctors = await client.query(api.queries.getDoctors, {});
    
    if (allClients && allClients.length > 0 && allDepartments && allDepartments.length > 0) {
      // Create appointments for today, tomorrow, next week, and past dates
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);

      const appointmentDates = [
        lastWeek.toISOString().split("T")[0],    // Past
        yesterday.toISOString().split("T")[0],   // Past
        today.toISOString().split("T")[0],       // Today
        tomorrow.toISOString().split("T")[0],    // Tomorrow
        nextWeek.toISOString().split("T")[0],    // Future
      ];

      const statuses = ["completed", "booked", "confirmed", "arrived", "waiting"];

      // Create multiple appointments per date
      let appointmentCount = 0;
      for (let dateIdx = 0; dateIdx < appointmentDates.length; dateIdx++) {
        const date = appointmentDates[dateIdx];
        const isToday = date === today.toISOString().split("T")[0];
        const isPast = new Date(date) < today;
        
        // Create 3-5 appointments per date
        const appointmentsPerDate = 3 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < appointmentsPerDate; i++) {
          if (appointmentCount >= allClients.length * 2) break; // Limit total
          
          try {
            const clientData = allClients[appointmentCount % allClients.length];
            const department = allDepartments[appointmentCount % allDepartments.length];
            const doctor = allDoctors && allDoctors.length > 0 
              ? allDoctors[appointmentCount % allDoctors.length] 
              : null;
            const slot = (appointmentCount % 20) + 1; // Slots 1-20
            
            // Set appropriate status based on date
            let status;
            if (isPast) {
              status = appointmentCount % 2 === 0 ? "completed" : "no_show";
            } else if (isToday) {
              status = ["booked", "confirmed", "arrived", "waiting"][appointmentCount % 4];
            } else {
              status = appointmentCount % 2 === 0 ? "booked" : "confirmed";
            }

            await client.mutation(api.mutations.createAppointment, {
              client_id: clientData._id,
              department_id: department._id,
              doctor_id: doctor?._id,
              appointment_date: date,
              slot_number: slot,
              status: status as any,
              notes: `Appointment for ${clientData.name} - ${department.name}`,
            });

            console.log(`   ✅ ${clientData.name} → ${department.name} (${date}, Slot ${slot}, ${status})`);
            appointmentCount++;
            results.appointments++;
          } catch (error: any) {
            console.log(`   ⚠️  Appointment ${appointmentCount + 1}: ${error.message}`);
          }
        }
      }
    } else {
      console.log("   ⚠️  Skipping appointments (no clients or departments)");
    }

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 Seeding Complete!");
    console.log("=".repeat(60));
    console.log(`🏥 Departments: ${results.departments} created`);
    console.log(`👥 Staff Users: ${results.users} created`);
    console.log(`🏥 Clients: ${results.clients} created`);
    console.log(`👨‍⚕️ Doctors: ${results.doctors} created`);
    console.log(`📅 Appointments: ${results.appointments} created`);
    console.log("=".repeat(60));

    // Show credentials
    console.log("\n🔑 Test Login Credentials:");
    console.log("=".repeat(60));
    console.log("\n📋 Admin Account:");
    console.log("   Employee ID: ADMIN001");
    console.log("   Password: password123");
    console.log("\n📋 Receptionist Account:");
    console.log("   Employee ID: RECEP001");
    console.log("   Password: password123");
    console.log("\n📋 Client Account (OTP):");
    console.log("   X-Number: X12345/67");
    console.log("   Phone: +233244123456");
    console.log("   (Use OTP authentication)");
    console.log("\n" + "=".repeat(60));

    console.log("\n🎯 Next Steps:");
    console.log("   1. Start Convex: bun run convex:dev");
    console.log("   2. Start Next.js: bun run dev");
    console.log("   3. Login and explore!");
    console.log("\n✅ All done! Your database is ready! 🎉\n");

  } catch (error: any) {
    console.error("\n❌ Fatal error during seeding:", error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the seeding
seedAll().catch((error) => {
  console.error("❌ Unhandled error:", error);
  process.exit(1);
});

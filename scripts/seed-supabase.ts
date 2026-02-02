/**
 * Seed Supabase with sample data for testing
 * Run with: npx tsx scripts/seed-supabase.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log("🌱 Seeding Supabase with sample data...\n");

  try {
    // ============================================
    // 1. SEED USERS (Staff)
    // ============================================
    console.log("👥 Creating users...");
    const { data: users, error: usersError } = await supabase
      .from("users")
      .upsert([
        {
          name: "Admin User",
          phone: "+233200000001",
          role: "admin",
          employee_id: "ADMIN001",
          is_active: true,
        },
        {
          name: "Dr. Sarah Johnson",
          phone: "+233200000002",
          role: "receptionist",
          employee_id: "REC001",
          is_active: true,
        },
        {
          name: "Nurse Mary Owusu",
          phone: "+233200000003",
          role: "receptionist",
          employee_id: "REC002",
          is_active: true,
        },
      ], { onConflict: "phone" })
      .select();

    if (usersError) throw usersError;
    console.log(`   ✅ Created ${users?.length || 0} users\n`);

    // ============================================
    // 2. SEED DEPARTMENTS
    // ============================================
    console.log("🏥 Creating departments...");
    const { data: departments, error: deptsError } = await supabase
      .from("departments")
      .upsert([
        {
          name: "General Medicine",
          description: "General health checkups and consultations",
          slots_per_day: 20,
          working_days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
          working_hours: { start: "08:00", end: "17:00" },
          color: "#3B82F6",
          icon: "stethoscope",
          is_active: true,
        },
        {
          name: "Pediatrics",
          description: "Child healthcare and vaccinations",
          slots_per_day: 15,
          working_days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
          working_hours: { start: "09:00", end: "16:00" },
          color: "#10B981",
          icon: "baby",
          is_active: true,
        },
        {
          name: "Dental Care",
          description: "Dental checkups, cleanings, and treatments",
          slots_per_day: 12,
          working_days: ["monday", "wednesday", "friday"],
          working_hours: { start: "09:00", end: "15:00" },
          color: "#8B5CF6",
          icon: "tooth",
          is_active: true,
        },
        {
          name: "Ophthalmology",
          description: "Eye exams and vision care",
          slots_per_day: 10,
          working_days: ["tuesday", "thursday"],
          working_hours: { start: "10:00", end: "16:00" },
          color: "#F59E0B",
          icon: "eye",
          is_active: true,
        },
        {
          name: "Laboratory",
          description: "Blood tests and diagnostic services",
          slots_per_day: 25,
          working_days: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
          working_hours: { start: "07:00", end: "14:00" },
          color: "#EF4444",
          icon: "flask",
          is_active: true,
        },
      ], { onConflict: "name" })
      .select();

    if (deptsError) throw deptsError;
    console.log(`   ✅ Created ${departments?.length || 0} departments\n`);

    // ============================================
    // 3. SEED DOCTORS
    // ============================================
    console.log("👨‍⚕️ Creating doctors...");
    
    const generalMedDept = departments?.find(d => d.name === "General Medicine");
    const pediatricsDept = departments?.find(d => d.name === "Pediatrics");
    const dentalDept = departments?.find(d => d.name === "Dental Care");
    const ophthalmologyDept = departments?.find(d => d.name === "Ophthalmology");

    const { data: doctors, error: doctorsError } = await supabase
      .from("doctors")
      .insert([
        {
          name: "Dr. Emmanuel Mensah",
          department_id: generalMedDept?.id,
          is_active: true,
        },
        {
          name: "Dr. Grace Adjei",
          department_id: generalMedDept?.id,
          is_active: true,
        },
        {
          name: "Dr. Akosua Boateng",
          department_id: pediatricsDept?.id,
          is_active: true,
        },
        {
          name: "Dr. Kwame Asante",
          department_id: dentalDept?.id,
          is_active: true,
        },
        {
          name: "Dr. Ama Osei",
          department_id: ophthalmologyDept?.id,
          is_active: true,
        },
      ])
      .select();

    if (doctorsError) throw doctorsError;
    console.log(`   ✅ Created ${doctors?.length || 0} doctors\n`);

    // ============================================
    // 4. SEED CLIENTS (Patients)
    // ============================================
    console.log("🏃 Creating sample clients...");
    const { data: clients, error: clientsError } = await supabase
      .from("clients")
      .upsert([
        {
          x_number: "X12345/26",
          name: "Kofi Mensah",
          phone: "+233241234567",
          email: "kofi.mensah@example.com",
          category: "Regular",
          emergency_contact: "+233201111111",
          address: "Accra, Ghana",
          is_active: true,
        },
        {
          x_number: "X12346/26",
          name: "Ama Darko",
          phone: "+233242345678",
          email: "ama.darko@example.com",
          category: "VIP",
          emergency_contact: "+233202222222",
          address: "Kumasi, Ghana",
          is_active: true,
        },
        {
          x_number: "X12347/26",
          name: "Kwame Osei",
          phone: "+233243456789",
          email: "kwame.osei@example.com",
          category: "Regular",
          emergency_contact: "+233203333333",
          address: "Takoradi, Ghana",
          is_active: true,
        },
        {
          x_number: "X12348/26",
          name: "Abena Boateng",
          phone: "+233244567890",
          email: "abena.boateng@example.com",
          category: "Regular",
          emergency_contact: "+233204444444",
          address: "Tema, Ghana",
          is_active: true,
        },
        {
          x_number: "X12349/26",
          name: "Yaw Frimpong",
          phone: "+233245678901",
          email: "yaw.frimpong@example.com",
          category: "VIP",
          emergency_contact: "+233205555555",
          address: "Cape Coast, Ghana",
          is_active: true,
        },
      ], { onConflict: "x_number" })
      .select();

    if (clientsError) throw clientsError;
    console.log(`   ✅ Created ${clients?.length || 0} clients\n`);

    // ============================================
    // 5. SEED APPOINTMENTS (Sample Bookings)
    // ============================================
    console.log("📅 Creating sample appointments...");
    
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const adminUser = users?.[0];
    const kofi = clients?.find(c => c.x_number === "X12345/26");
    const ama = clients?.find(c => c.x_number === "X12346/26");
    const kwame = clients?.find(c => c.x_number === "X12347/26");

    const appointments = [];

    // Today's appointments
    if (kofi && generalMedDept && adminUser) {
      appointments.push({
        client_id: kofi.id,
        department_id: generalMedDept.id,
        doctor_id: doctors?.[0]?.id,
        appointment_date: today.toISOString().split('T')[0],
        slot_number: 3,
        status: "booked",
        notes: "Annual checkup",
        booked_by: adminUser.id,
      });
    }

    if (ama && pediatricsDept && adminUser) {
      appointments.push({
        client_id: ama.id,
        department_id: pediatricsDept.id,
        doctor_id: doctors?.[2]?.id,
        appointment_date: today.toISOString().split('T')[0],
        slot_number: 5,
        status: "completed",
        notes: "Vaccination",
        booked_by: adminUser.id,
      });
    }

    // Tomorrow's appointments
    if (kwame && dentalDept && adminUser) {
      appointments.push({
        client_id: kwame.id,
        department_id: dentalDept.id,
        doctor_id: doctors?.[3]?.id,
        appointment_date: tomorrow.toISOString().split('T')[0],
        slot_number: 2,
        status: "booked",
        notes: "Dental cleaning",
        booked_by: adminUser.id,
      });
    }

    // Next week
    if (kofi && ophthalmologyDept && adminUser) {
      appointments.push({
        client_id: kofi.id,
        department_id: ophthalmologyDept.id,
        doctor_id: doctors?.[4]?.id,
        appointment_date: nextWeek.toISOString().split('T')[0],
        slot_number: 1,
        status: "booked",
        notes: "Eye exam",
        booked_by: adminUser.id,
      });
    }

    if (appointments.length > 0) {
      const { data: createdAppointments, error: aptsError } = await supabase
        .from("appointments")
        .insert(appointments)
        .select();

      if (aptsError) {
        console.error("   ⚠️  Some appointments failed:", aptsError.message);
      } else {
        console.log(`   ✅ Created ${createdAppointments?.length || 0} appointments\n`);
      }
    }

    // ============================================
    // SUMMARY
    // ============================================
    console.log("\n✅ Seeding Complete!\n");
    console.log("📊 Summary:");
    console.log(`   Users: ${users?.length || 0}`);
    console.log(`   Departments: ${departments?.length || 0}`);
    console.log(`   Doctors: ${doctors?.length || 0}`);
    console.log(`   Clients: ${clients?.length || 0}`);
    console.log(`   Appointments: ${appointments.length}\n`);

    console.log("🎉 Your database is ready!");
    console.log("\n📝 Test Login Credentials:");
    console.log("   Phone: +233200000001");
    console.log("   Role: admin");
    console.log("\n🚀 Start your app: npm run dev");

  } catch (error) {
    console.error("\n❌ Seeding failed:", error);
    throw error;
  }
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });

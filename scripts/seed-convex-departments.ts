/**
 * Seed Convex with Hospital Departments
 * 
 * Run this script to populate Convex with sample departments
 * Usage: node --loader ts-node/esm scripts/seed-convex-departments.ts
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://lovable-manatee-131.convex.cloud";

const departments = [
  {
    name: "Cardiology",
    description: "Heart and cardiovascular care",
    slots_per_day: 20,
    working_days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    working_hours: { start: "08:00", end: "17:00" },
    color: "#EF4444", // Red
  },
  {
    name: "Pediatrics",
    description: "Children's healthcare and treatment",
    slots_per_day: 25,
    working_days: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
    working_hours: { start: "07:00", end: "18:00" },
    color: "#F59E0B", // Amber
  },
  {
    name: "General Medicine",
    description: "General health consultations and treatments",
    slots_per_day: 30,
    working_days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    working_hours: { start: "08:00", end: "16:00" },
    color: "#3B82F6", // Blue
  },
  {
    name: "Orthopedics",
    description: "Bone and joint care",
    slots_per_day: 15,
    working_days: ["monday", "wednesday", "friday"],
    working_hours: { start: "09:00", end: "15:00" },
    color: "#8B5CF6", // Purple
  },
  {
    name: "Gynecology",
    description: "Women's health and reproductive care",
    slots_per_day: 18,
    working_days: ["monday", "tuesday", "thursday", "friday"],
    working_hours: { start: "08:00", end: "17:00" },
    color: "#EC4899", // Pink
  },
  {
    name: "Neurology",
    description: "Brain and nervous system care",
    slots_per_day: 12,
    working_days: ["tuesday", "wednesday", "thursday"],
    working_hours: { start: "09:00", end: "16:00" },
    color: "#06B6D4", // Cyan
  },
  {
    name: "Ophthalmology",
    description: "Eye care and vision services",
    slots_per_day: 22,
    working_days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    working_hours: { start: "08:00", end: "17:00" },
    color: "#10B981", // Green
  },
  {
    name: "Dermatology",
    description: "Skin, hair, and nail care",
    slots_per_day: 16,
    working_days: ["monday", "wednesday", "thursday", "friday"],
    working_hours: { start: "09:00", end: "16:00" },
    color: "#F97316", // Orange
  },
  {
    name: "Emergency",
    description: "24/7 emergency medical care",
    slots_per_day: 50,
    working_days: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
    working_hours: { start: "00:00", end: "23:59" },
    color: "#DC2626", // Dark Red
  },
  {
    name: "Dental",
    description: "Dental and oral health care",
    slots_per_day: 20,
    working_days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    working_hours: { start: "08:00", end: "18:00" },
    color: "#059669", // Emerald
  },
];

async function seedDepartments() {
  console.log("🏥 Seeding Convex with Hospital Departments...\n");
  console.log(`📡 Convex URL: ${CONVEX_URL}\n`);

  const client = new ConvexHttpClient(CONVEX_URL);

  try {
    // Check if departments already exist
    const existingDepartments = await client.query(api.queries.getDepartments, {});
    
    if (existingDepartments && existingDepartments.length > 0) {
      console.log(`⚠️  Found ${existingDepartments.length} existing departments.`);
      console.log("Do you want to continue? This will add more departments.\n");
    }

    let successCount = 0;
    let errorCount = 0;

    for (const dept of departments) {
      try {
        console.log(`➕ Creating: ${dept.name}...`);
        
        await client.mutation(api.mutations.createDepartment, dept);
        
        console.log(`   ✅ Created ${dept.name}`);
        console.log(`      Slots: ${dept.slots_per_day}/day`);
        console.log(`      Days: ${dept.working_days.join(", ")}`);
        console.log(`      Hours: ${dept.working_hours.start} - ${dept.working_hours.end}`);
        console.log("");
        
        successCount++;
      } catch (error: any) {
        console.error(`   ❌ Failed to create ${dept.name}: ${error.message}`);
        errorCount++;
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("📊 Seeding Results:");
    console.log(`   ✅ Successfully created: ${successCount} departments`);
    if (errorCount > 0) {
      console.log(`   ❌ Failed: ${errorCount} departments`);
    }
    console.log("=".repeat(60));

    // Fetch and display all departments
    const allDepartments = await client.query(api.queries.getDepartments, {});
    console.log(`\n🏥 Total Departments in Convex: ${allDepartments?.length || 0}`);
    
    if (allDepartments && allDepartments.length > 0) {
      console.log("\n📋 Department List:");
      allDepartments.forEach((dept: any, index: number) => {
        console.log(`   ${index + 1}. ${dept.name} (${dept.slots_per_day} slots/day)`);
      });
    }

    console.log("\n✅ Seeding complete!");
    console.log("\n🎯 Next steps:");
    console.log("   1. Start Convex dev server: bun run convex:dev");
    console.log("   2. Start Next.js: bun run dev");
    console.log("   3. Navigate to /dashboard/departments");
    console.log("   4. You should see all the departments!");

  } catch (error) {
    console.error("\n❌ Fatal error during seeding:", error);
    process.exit(1);
  }
}

// Run the seeding
seedDepartments().catch((error) => {
  console.error("❌ Unhandled error:", error);
  process.exit(1);
});

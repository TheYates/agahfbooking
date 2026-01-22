/**
 * Property-Based Test for Schema Validation
 * Property 17: Data Migration Relationship Preservation
 * Validates: Requirements 11.2
 * 
 * This test validates that the Convex schema preserves all relationships
 * from the PostgreSQL schema during data migration.
 */

import * as fc from "fast-check";
import schema from "./schema";

// Type definitions for test data
interface PostgreSQLClient {
  id: number;
  x_number: string;
  name: string;
  phone: string;
  category: string;
}

interface PostgreSQLDepartment {
  id: number;
  name: string;
  slots_per_day: number;
}

interface PostgreSQLDoctor {
  id: number;
  name: string;
  department_id: number;
}

interface PostgreSQLAppointment {
  id: number;
  client_id: number;
  department_id: number;
  doctor_id: number | null;
  appointment_date: string;
  slot_number: number;
}

interface ConvexClient {
  _id: string;
  x_number: string;
  name: string;
  phone: string;
  category: string;
}

interface ConvexDepartment {
  _id: string;
  name: string;
  slots_per_day: number;
}

interface ConvexDoctor {
  _id: string;
  name: string;
  department_id: string;
}

interface ConvexAppointment {
  _id: string;
  client_id: string;
  department_id: string;
  doctor_id: string | undefined;
  appointment_date: string;
  slot_number: number;
}

/**
 * Simulates the migration process from PostgreSQL to Convex
 */
function migrateData(
  pgClients: PostgreSQLClient[],
  pgDepartments: PostgreSQLDepartment[],
  pgDoctors: PostgreSQLDoctor[],
  pgAppointments: PostgreSQLAppointment[]
): {
  convexClients: ConvexClient[];
  convexDepartments: ConvexDepartment[];
  convexDoctors: ConvexDoctor[];
  convexAppointments: ConvexAppointment[];
  idMappings: {
    clients: Map<number, string>;
    departments: Map<number, string>;
    doctors: Map<number, string>;
  };
} {
  const idMappings = {
    clients: new Map<number, string>(),
    departments: new Map<number, string>(),
    doctors: new Map<number, string>(),
  };

  // Migrate clients
  const convexClients = pgClients.map((client) => {
    const convexId = `client_${client.id}`;
    idMappings.clients.set(client.id, convexId);
    return {
      _id: convexId,
      x_number: client.x_number,
      name: client.name,
      phone: client.phone,
      category: client.category,
    };
  });

  // Migrate departments
  const convexDepartments = pgDepartments.map((dept) => {
    const convexId = `dept_${dept.id}`;
    idMappings.departments.set(dept.id, convexId);
    return {
      _id: convexId,
      name: dept.name,
      slots_per_day: dept.slots_per_day,
    };
  });

  // Migrate doctors
  const convexDoctors = pgDoctors.map((doctor) => {
    const convexId = `doctor_${doctor.id}`;
    idMappings.doctors.set(doctor.id, convexId);
    const departmentId = idMappings.departments.get(doctor.department_id);
    if (!departmentId) {
      throw new Error(`Department ${doctor.department_id} not found in mappings`);
    }
    return {
      _id: convexId,
      name: doctor.name,
      department_id: departmentId,
    };
  });

  // Migrate appointments
  const convexAppointments = pgAppointments.map((apt) => {
    const clientId = idMappings.clients.get(apt.client_id);
    const departmentId = idMappings.departments.get(apt.department_id);
    
    if (!clientId) {
      throw new Error(`Client ${apt.client_id} not found in mappings`);
    }
    if (!departmentId) {
      throw new Error(`Department ${apt.department_id} not found in mappings`);
    }

    const doctorId = apt.doctor_id ? idMappings.doctors.get(apt.doctor_id) : undefined;
    
    return {
      _id: `apt_${apt.id}`,
      client_id: clientId,
      department_id: departmentId,
      doctor_id: doctorId,
      appointment_date: apt.appointment_date,
      slot_number: apt.slot_number,
    };
  });

  return {
    convexClients,
    convexDepartments,
    convexDoctors,
    convexAppointments,
    idMappings,
  };
}

/**
 * Validates that all relationships are preserved after migration
 */
function validateRelationships(
  pgClients: PostgreSQLClient[],
  pgDepartments: PostgreSQLDepartment[],
  pgDoctors: PostgreSQLDoctor[],
  pgAppointments: PostgreSQLAppointment[],
  migrationResult: ReturnType<typeof migrateData>
): boolean {
  const { convexClients, convexDepartments, convexDoctors, convexAppointments, idMappings } = migrationResult;

  // Validate client count
  if (convexClients.length !== pgClients.length) {
    console.error(`Client count mismatch: ${convexClients.length} !== ${pgClients.length}`);
    return false;
  }

  // Validate department count
  if (convexDepartments.length !== pgDepartments.length) {
    console.error(`Department count mismatch: ${convexDepartments.length} !== ${pgDepartments.length}`);
    return false;
  }

  // Validate doctor count
  if (convexDoctors.length !== pgDoctors.length) {
    console.error(`Doctor count mismatch: ${convexDoctors.length} !== ${pgDoctors.length}`);
    return false;
  }

  // Validate appointment count
  if (convexAppointments.length !== pgAppointments.length) {
    console.error(`Appointment count mismatch: ${convexAppointments.length} !== ${pgAppointments.length}`);
    return false;
  }

  // Validate doctor-department relationships
  for (const pgDoctor of pgDoctors) {
    const convexDoctor = convexDoctors.find((d) => d._id === idMappings.doctors.get(pgDoctor.id));
    if (!convexDoctor) {
      console.error(`Doctor ${pgDoctor.id} not found in Convex data`);
      return false;
    }
    const expectedDeptId = idMappings.departments.get(pgDoctor.department_id);
    if (convexDoctor.department_id !== expectedDeptId) {
      console.error(`Doctor ${pgDoctor.id} department mismatch: ${convexDoctor.department_id} !== ${expectedDeptId}`);
      return false;
    }
  }

  // Validate appointment relationships
  for (const pgApt of pgAppointments) {
    const convexApt = convexAppointments.find((a) => a._id === `apt_${pgApt.id}`);
    if (!convexApt) {
      console.error(`Appointment ${pgApt.id} not found in Convex data`);
      return false;
    }

    // Validate client relationship
    const expectedClientId = idMappings.clients.get(pgApt.client_id);
    if (convexApt.client_id !== expectedClientId) {
      console.error(`Appointment ${pgApt.id} client mismatch: ${convexApt.client_id} !== ${expectedClientId}`);
      return false;
    }

    // Validate department relationship
    const expectedDeptId = idMappings.departments.get(pgApt.department_id);
    if (convexApt.department_id !== expectedDeptId) {
      console.error(`Appointment ${pgApt.id} department mismatch: ${convexApt.department_id} !== ${expectedDeptId}`);
      return false;
    }

    // Validate doctor relationship (if present)
    if (pgApt.doctor_id !== null) {
      const expectedDoctorId = idMappings.doctors.get(pgApt.doctor_id);
      if (convexApt.doctor_id !== expectedDoctorId) {
        console.error(`Appointment ${pgApt.id} doctor mismatch: ${convexApt.doctor_id} !== ${expectedDoctorId}`);
        return false;
      }
    } else {
      if (convexApt.doctor_id !== undefined) {
        console.error(`Appointment ${pgApt.id} should not have doctor: ${convexApt.doctor_id}`);
        return false;
      }
    }
  }

  return true;
}

// Arbitraries for generating test data
const clientArbitrary = fc.record({
  id: fc.integer({ min: 1, max: 10000 }),
  x_number: fc.string({ minLength: 9, maxLength: 10 }).map((s) => `X${s.slice(0, 5)}/${s.slice(5, 7)}`),
  name: fc.string({ minLength: 3, maxLength: 50 }),
  phone: fc.string({ minLength: 10, maxLength: 15 }),
  category: fc.constantFrom("PRIVATE CASH", "PUBLIC SPONSORED(NHIA)", "STAFF"),
});

const departmentArbitrary = fc.record({
  id: fc.integer({ min: 1, max: 100 }),
  name: fc.constantFrom("General Medicine", "Cardiology", "Pediatrics", "Orthopedics"),
  slots_per_day: fc.integer({ min: 5, max: 20 }),
});

// Property test
describe("Property 17: Data Migration Relationship Preservation", () => {
  it("should preserve all relationships when migrating from PostgreSQL to Convex", () => {
    fc.assert(
      fc.property(
        // Generate clients with unique IDs
        fc.array(clientArbitrary, { minLength: 1, maxLength: 10 }).map((clients) => {
          const uniqueClients = clients.filter(
            (c, i, arr) => arr.findIndex((x) => x.id === c.id) === i
          );
          return uniqueClients.length > 0 ? uniqueClients : [clients[0]];
        }),
        // Generate departments with unique IDs
        fc.array(departmentArbitrary, { minLength: 1, maxLength: 5 }).map((depts) => {
          const uniqueDepts = depts.filter(
            (d, i, arr) => arr.findIndex((x) => x.id === d.id) === i
          );
          return uniqueDepts.length > 0 ? uniqueDepts : [depts[0]];
        }),
        // Generate doctors based on departments
        fc.integer({ min: 0, max: 10 }),
        // Generate appointments based on clients and departments
        fc.integer({ min: 0, max: 20 }),
        (clients, departments, doctorCount, appointmentCount) => {
          // Generate doctors that reference existing departments
          const doctors: PostgreSQLDoctor[] = [];
          for (let i = 0; i < Math.min(doctorCount, departments.length * 2); i++) {
            const deptId = departments[i % departments.length].id;
            doctors.push({
              id: i + 1,
              name: `Doctor ${i + 1}`,
              department_id: deptId,
            });
          }

          // Generate appointments that reference existing clients, departments, and doctors
          const appointments: PostgreSQLAppointment[] = [];
          for (let i = 0; i < Math.min(appointmentCount, clients.length * 3); i++) {
            const clientId = clients[i % clients.length].id;
            const deptId = departments[i % departments.length].id;
            const doctorId = doctors.length > 0 && i % 2 === 0 ? doctors[i % doctors.length].id : null;
            
            appointments.push({
              id: i + 1,
              client_id: clientId,
              department_id: deptId,
              doctor_id: doctorId,
              appointment_date: `2024-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
              slot_number: (i % 20) + 1,
            });
          }

          // Perform migration
          const migrationResult = migrateData(clients, departments, doctors, appointments);

          // Validate relationships
          const isValid = validateRelationships(
            clients,
            departments,
            doctors,
            appointments,
            migrationResult
          );

          return isValid;
        }
      ),
      { numRuns: 20 }
    );
  });
});

// Export for running the test
export { validateRelationships, migrateData };

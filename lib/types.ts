export interface User {
  id: number;
  xNumber?: string;
  name: string;
  phone?: string | null;
  email?: string;
  category?: string;
  role: "client" | "receptionist" | "admin" | "reviewer";
  username?: string;
  employeeId?: string;
}

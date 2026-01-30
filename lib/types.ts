export interface User {
  id: number;
  xNumber: string;
  name: string;
  phone: string;
  email?: string;
  category: string;
  role: "client" | "receptionist" | "admin";
}

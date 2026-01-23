export interface User {
  id: number
  xNumber: string
  name: string
  phone: string
  category: string
  role: "client" | "receptionist" | "admin"
  convexId?: string  // Convex ID for querying Convex database
}

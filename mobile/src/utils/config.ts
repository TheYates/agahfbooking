import Constants from "expo-constants";

// API Configuration
export const API_BASE_URL =
  Constants.expoConfig?.extra?.apiUrl ||
  process.env.EXPO_PUBLIC_API_URL ||
  "http://localhost:3000";

// Supabase Configuration
export const SUPABASE_URL =
  Constants.expoConfig?.extra?.supabaseUrl ||
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  "";

export const SUPABASE_ANON_KEY =
  Constants.expoConfig?.extra?.supabaseAnonKey ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  "";

// App Configuration
export const APP_NAME = "AGAHF Booking";
export const APP_VERSION = "1.0.0";

// Storage Keys
export const STORAGE_KEYS = {
  SESSION_TOKEN: "session_token",
  USER_DATA: "user_data",
  REFRESH_TOKEN: "refresh_token",
} as const;

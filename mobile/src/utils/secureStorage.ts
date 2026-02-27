import * as SecureStore from "expo-secure-store";
import { STORAGE_KEYS } from "./config";
import { Platform } from "react-native";

/**
 * Secure storage wrapper for sensitive data
 * Uses expo-secure-store for iOS/Android, localStorage for web
 */
export class SecureStorage {
  private static isWeb(): boolean {
    return Platform.OS === "web";
  }

  /**
   * Store a value securely
   */
  static async setItem(key: string, value: string): Promise<void> {
    try {
      if (this.isWeb()) {
        localStorage.setItem(key, value);
      } else {
        await SecureStore.setItemAsync(key, value);
      }
    } catch (error) {
      console.error(`Error storing ${key}:`, error);
      throw new Error(`Failed to store ${key}`);
    }
  }

  /**
   * Retrieve a value from secure storage
   */
  static async getItem(key: string): Promise<string | null> {
    try {
      if (this.isWeb()) {
        return localStorage.getItem(key);
      } else {
        return await SecureStore.getItemAsync(key);
      }
    } catch (error) {
      console.error(`Error retrieving ${key}:`, error);
      return null;
    }
  }

  /**
   * Remove a value from secure storage
   */
  static async removeItem(key: string): Promise<void> {
    try {
      if (this.isWeb()) {
        localStorage.removeItem(key);
      } else {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (error) {
      console.error(`Error removing ${key}:`, error);
    }
  }

  /**
   * Store session token
   */
  static async setSessionToken(token: string): Promise<void> {
    await this.setItem(STORAGE_KEYS.SESSION_TOKEN, token);
  }

  /**
   * Get session token
   */
  static async getSessionToken(): Promise<string | null> {
    return this.getItem(STORAGE_KEYS.SESSION_TOKEN);
  }

  /**
   * Remove session token
   */
  static async removeSessionToken(): Promise<void> {
    await this.removeItem(STORAGE_KEYS.SESSION_TOKEN);
  }

  /**
   * Store user data
   */
  static async setUserData(userData: object): Promise<void> {
    await this.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
  }

  /**
   * Get user data
   */
  static async getUserData<T>(): Promise<T | null> {
    const data = await this.getItem(STORAGE_KEYS.USER_DATA);
    if (!data) return null;
    try {
      return JSON.parse(data) as T;
    } catch {
      return null;
    }
  }

  /**
   * Remove user data
   */
  static async removeUserData(): Promise<void> {
    await this.removeItem(STORAGE_KEYS.USER_DATA);
  }

  /**
   * Clear all auth data
   */
  static async clearAll(): Promise<void> {
    await Promise.all([
      this.removeSessionToken(),
      this.removeUserData(),
      this.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
    ]);
  }
}

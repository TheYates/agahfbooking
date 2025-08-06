/**
 * Calendar Configuration Service
 * 
 * Manages calendar visibility settings for clients.
 * Allows admins to control whether clients see only their own appointments
 * or all appointments in the system.
 */

import { SystemSettingsService } from "./db-services";

export type CalendarVisibility = "own_only" | "all_appointments";

export interface CalendarConfig {
  clientVisibility: CalendarVisibility;
  description: string;
}

class CalendarConfigService {
  private readonly SETTING_KEY = 'client_calendar_visibility';
  private readonly DEFAULT_VISIBILITY: CalendarVisibility = 'own_only';
  private currentVisibility: CalendarVisibility | null = null;

  /**
   * Ensure visibility setting is loaded
   */
  private async ensureVisibilityLoaded(): Promise<void> {
    if (this.currentVisibility === null) {
      this.currentVisibility = await this.getInitialVisibility();
    }
  }

  /**
   * Get initial calendar visibility from database, or default
   */
  private async getInitialVisibility(): Promise<CalendarVisibility> {
    try {
      const savedVisibility = await SystemSettingsService.get(this.SETTING_KEY);
      if (savedVisibility === "own_only" || savedVisibility === "all_appointments") {
        return savedVisibility as CalendarVisibility;
      }
    } catch (error) {
      console.warn("Could not load calendar visibility from database:", error);
    }

    // Fallback to default
    return this.DEFAULT_VISIBILITY;
  }

  /**
   * Get current calendar visibility setting
   */
  async getCurrentVisibility(): Promise<CalendarVisibility> {
    await this.ensureVisibilityLoaded();
    return this.currentVisibility!;
  }

  /**
   * Set calendar visibility and persist to database
   */
  async setVisibility(visibility: CalendarVisibility, updatedBy?: number): Promise<void> {
    if (visibility !== "own_only" && visibility !== "all_appointments") {
      throw new Error('Invalid calendar visibility. Must be "own_only" or "all_appointments"');
    }

    // Save to database
    try {
      await SystemSettingsService.update(
        this.SETTING_KEY,
        visibility,
        updatedBy || 1
      );
      this.currentVisibility = visibility;
      console.log(
        `🔧 Calendar visibility changed to: ${visibility.toUpperCase()} and saved to database`
      );
    } catch (error) {
      console.error("Failed to save calendar visibility to database:", error);
      throw new Error("Failed to save calendar visibility to database");
    }
  }

  /**
   * Get calendar configuration
   */
  async getConfig(): Promise<CalendarConfig> {
    await this.ensureVisibilityLoaded();
    const visibility = this.currentVisibility!;
    
    return {
      clientVisibility: visibility,
      description: this.getVisibilityDescription(visibility),
    };
  }

  /**
   * Get description for visibility setting
   */
  private getVisibilityDescription(visibility: CalendarVisibility): string {
    switch (visibility) {
      case "own_only":
        return "Clients can only see their own appointments (recommended for privacy)";
      case "all_appointments":
        return "Clients can see all appointments in the system (useful for coordination)";
      default:
        return "Unknown visibility setting";
    }
  }

  /**
   * Check if clients should see all appointments
   */
  async shouldShowAllAppointments(): Promise<boolean> {
    const visibility = await this.getCurrentVisibility();
    return visibility === "all_appointments";
  }

  /**
   * Get appropriate API endpoint for user role and current settings
   */
  async getAppointmentsEndpoint(userRole: string, currentUserId: number): Promise<string> {
    if (userRole !== "client") {
      // Staff always see all appointments
      return "/api/appointments";
    }

    // For clients, check the admin setting
    const showAll = await this.shouldShowAllAppointments();
    
    if (showAll) {
      return "/api/appointments";
    } else {
      return `/api/appointments/client?clientId=${currentUserId}`;
    }
  }

  /**
   * Get status information
   */
  async getStatus(): Promise<{
    currentVisibility: CalendarVisibility;
    description: string;
    isDefault: boolean;
    lastUpdated?: string;
  }> {
    await this.ensureVisibilityLoaded();
    const visibility = this.currentVisibility!;

    return {
      currentVisibility: visibility,
      description: this.getVisibilityDescription(visibility),
      isDefault: visibility === this.DEFAULT_VISIBILITY,
    };
  }

  /**
   * Reset to default visibility
   */
  async resetToDefault(updatedBy?: number): Promise<void> {
    await this.setVisibility(this.DEFAULT_VISIBILITY, updatedBy);
  }

  /**
   * Get available visibility options
   */
  getVisibilityOptions(): Array<{
    value: CalendarVisibility;
    label: string;
    description: string;
    recommended?: boolean;
  }> {
    return [
      {
        value: "own_only",
        label: "Own Appointments Only",
        description: "Clients can only see their own appointments",
        recommended: true,
      },
      {
        value: "all_appointments",
        label: "All Appointments",
        description: "Clients can see all appointments in the system",
      },
    ];
  }

  /**
   * Validate visibility setting
   */
  isValidVisibility(visibility: string): visibility is CalendarVisibility {
    return visibility === "own_only" || visibility === "all_appointments";
  }
}

// Export singleton instance
export const calendarConfig = new CalendarConfigService();

// Export class for testing
export { CalendarConfigService };

// Export types
export type { CalendarVisibility, CalendarConfig };

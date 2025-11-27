// 🚀 MEMORY-CACHED Dashboard Stats API (No Redis Required)
// Expected performance: 20-40ms (vs 120ms+ previous) = 3-6x faster!

import { NextResponse } from "next/server";
import { query } from "@/lib/db";
const { MemoryCache } = require("@/lib/memory-cache.js");

export async function GET(request: Request) {
  const requestStart = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");

    if (!clientId) {
      return NextResponse.json(
        { error: "Client ID is required" },
        { status: 400 }
      );
    }

    // 🚀 MEMORY-CACHED: Use materialized view with memory caching
    const stats = await MemoryCache.get(
      `dashboard_stats_${clientId}`,
      async () => {
        // Single query using materialized view (10-20ms vs 120ms+ complex query)
        const result = await query(`
          SELECT 
            upcoming_count,
            total_month_count,
            completed_count,
            next_appointment_date
          FROM dashboard_stats_mv 
          WHERE client_id = $1
        `, [clientId]);

        const dashboardData = result.rows[0];
        
        if (!dashboardData) {
          // New client - return empty stats
          return {
            upcomingAppointments: 0,
            totalAppointments: 0,
            completedAppointments: 0,
            availableSlots: 0,
            daysUntilNext: null,
            recentAppointments: []
          };
        }

        // Calculate days until next appointment
        let daysUntilNext = null;
        if (dashboardData.next_appointment_date) {
          const nextDate = new Date(dashboardData.next_appointment_date);
          const today = new Date();
          today.setHours(0, 0, 0, 0); // Start of day
          daysUntilNext = Math.ceil(
            (nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );
        }

        // Get available slots from cache or calculate quickly
        const availableSlots = await MemoryCache.get(
          `available_slots_week_${clientId}`,
          async () => {
            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);

            const slotsResult = await query(`
              SELECT 
                COALESCE(SUM(dept.slots_per_day * 7), 0) as total_weekly_slots,
                COALESCE(COUNT(a.id), 0) as booked_weekly_slots
              FROM departments dept
              LEFT JOIN appointments a ON a.department_id = dept.id
                AND a.appointment_date BETWEEN $1 AND $2
                AND a.status NOT IN ('cancelled')
              WHERE dept.is_active = true
            `, [
              weekStart.toISOString().split("T")[0],
              weekEnd.toISOString().split("T")[0]
            ]);

            const slotsData = slotsResult.rows[0];
            const totalSlots = parseInt(slotsData.total_weekly_slots || "0");
            const bookedSlots = parseInt(slotsData.booked_weekly_slots || "0");
            return Math.max(0, totalSlots - bookedSlots);
          },
          'availableSlots'
        );

        // Get recent appointments separately
        const recentAppointments = await MemoryCache.get(
          `recent_appointments_${clientId}`,
          async () => {
            const recentResult = await query(`
              SELECT a.id, a.appointment_date, a.slot_number, a.status, 
                     d.name as department_name, d.color as department_color
              FROM appointments a
              JOIN departments d ON a.department_id = d.id
              WHERE a.client_id = $1
              ORDER BY a.appointment_date DESC, a.slot_number DESC
              LIMIT 5
            `, [clientId]);
            
            return recentResult.rows.map(row => ({
              id: row.id,
              date: new Date(row.appointment_date).toISOString().split("T")[0],
              slotNumber: row.slot_number,
              status: row.status,
              departmentName: row.department_name,
              departmentColor: row.department_color
            }));
          },
          'recentActivity'
        );

        return {
          upcomingAppointments: parseInt(dashboardData.upcoming_count || "0"),
          totalAppointments: parseInt(dashboardData.total_month_count || "0"),
          completedAppointments: parseInt(dashboardData.completed_count || "0"),
          availableSlots,
          daysUntilNext,
          recentAppointments
        };
      },
      'dashboardStats' // 30-second cache strategy
    );

    const responseTime = Date.now() - requestStart;
    console.log(`⚡ Dashboard API (Memory Cache): ${responseTime}ms`);

    return NextResponse.json({
      success: true,
      data: stats,
      meta: {
        responseTime: `${responseTime}ms`,
        cached: responseTime < 20, // If under 20ms, likely from memory cache
        cacheType: 'memory'
      }
    }, {
      headers: {
        // Edge caching for even faster subsequent requests
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        'X-Response-Time': `${responseTime}ms`,
        'X-Cache-Type': 'memory',
      }
    });

  } catch (error) {
    const responseTime = Date.now() - requestStart;
    console.error(`❌ Dashboard API error (${responseTime}ms):`, error);
    
    return NextResponse.json(
      {
        error: "Failed to fetch dashboard statistics",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// 🔄 Cache invalidation helper for when appointments change
export async function invalidateDashboardCache(clientId: string) {
  await MemoryCache.invalidate(`dashboard_stats_${clientId}`);
  await MemoryCache.invalidate(`available_slots_week_${clientId}`);
}

// 🌟 Expected Performance Results (Memory Cache Only):
// - First request (cache miss): 15-40ms (vs 120ms+ previous)
// - Subsequent requests (cache hit): 1-5ms (vs 120ms+ previous)  
// - Memory cache hit: < 1ms (ultra-fast)
// - Overall improvement: 3-6x faster (24-120x for cache hits)!
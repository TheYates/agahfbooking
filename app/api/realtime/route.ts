import { NextRequest } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/session-service";

/**
 * SSE endpoint for server-side realtime subscriptions
 * 
 * This endpoint:
 * 1. Validates user session from cookies
 * 2. Subscribes to Supabase realtime using service role key (bypasses RLS)
 * 3. Streams database changes to the client
 * 
 * Query parameters:
 * - table: The table to subscribe to (e.g., 'appointments')
 * - filter: Optional Supabase filter (e.g., 'client_id=eq.123')
 * - event: Event type to listen for (default: '*')
 * 
 * @example
 * const eventSource = new EventSource('/api/realtime?table=appointments&filter=client_id=eq.123')
 */

// Track active subscriptions per connection
interface SubscriptionContext {
  channel: any;
  heartbeat: NodeJS.Timeout;
}

const activeSubscriptions = new Map<string, SubscriptionContext>();

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const table = searchParams.get("table");
  const filter = searchParams.get("filter");
  const event = searchParams.get("event") || "*";

  // Validate required parameters
  if (!table) {
    return new Response(
      JSON.stringify({ error: "Missing required parameter: table" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Validate table name (security)
  const allowedTables = [
    "appointments",
    "clients",
    "users",
    "departments",
    "in_app_notifications",
    "app_feedback",
    "appointment_statuses",
    "department_availability",
  ];
  
  if (!allowedTables.includes(table)) {
    return new Response(
      JSON.stringify({ error: "Invalid table name" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Get session from cookie
  const sessionId = request.cookies.get("session_id")?.value;
  
  if (!sessionId) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  // Validate session
  const session = await getSession(sessionId);
  if (!session) {
    return new Response(
      JSON.stringify({ error: "Invalid session" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  // Role-based access control
  const userRole = session.role;
  const userId = session.userId;

  // Validate filter based on role
  if (filter) {
    const filterParts = filter.split("=");
    if (filterParts.length < 2) {
      return new Response(
        JSON.stringify({ error: "Invalid filter format" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const [filterColumn, filterValue] = filterParts;
    const cleanValue = filterValue.replace(/^eq\./, "");

    // Role-based restrictions
    if (userRole === "client" && table === "appointments") {
      // Clients can only see their own appointments
      if (filterColumn !== "client_id" || cleanValue !== String(userId)) {
        return new Response(
          JSON.stringify({ error: "Unauthorized filter for client" }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Staff can filter by their assigned departments
    if (userRole === "receptionist" && table === "appointments") {
      // Receptionists can see all appointments, but validate filter format
      const validFilters = ["client_id", "department_id", "status"];
      if (!validFilters.includes(filterColumn)) {
        return new Response(
          JSON.stringify({ error: "Invalid filter column" }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
    }
  }

  // Create SSE stream
  const encoder = new TextEncoder();
  const connectionId = `${userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const stream = new ReadableStream({
    start: async (controller) => {
      // Send initial connection message
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "connected", connectionId })}\n\n`)
      );

      // Create admin Supabase client (bypasses RLS)
      const supabase = createAdminSupabaseClient();

      // Build subscription config
      const subscriptionConfig: any = {
        event,
        schema: "public",
        table,
      };

      if (filter) {
        subscriptionConfig.filter = filter;
      }

      // Subscribe to realtime
      const channel = supabase
        .channel(`sse-${connectionId}`)
        .on(
          "postgres_changes",
          subscriptionConfig,
          (payload: any) => {
            // Send the event to the client
            const message = {
              type: "change",
              table,
              eventType: payload.eventType,
              schema: payload.schema,
              table_name: payload.table,
              old: payload.old,
              new: payload.new,
              errors: payload.errors,
              timestamp: new Date().toISOString(),
            };

            try {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(message)}\n\n`)
              );
            } catch (error) {
              console.error("[SSE] Error sending message:", error);
            }
          }
        )
        .subscribe((status: string) => {
          if (status === "SUBSCRIBED") {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "subscribed", table, filter })}\n\n`
              )
            );
          } else if (status === "CHANNEL_ERROR") {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "error", message: "Subscription error" })}\n\n`
              )
            );
          }
        });

      // Send heartbeat every 30 seconds to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`:heartbeat\n\n`));
        } catch (error) {
          // Connection closed
          clearInterval(heartbeat);
        }
      }, 30000);

      // Store subscription context
      activeSubscriptions.set(connectionId, { channel, heartbeat });

      // Handle connection close
      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        supabase.removeChannel(channel);
        activeSubscriptions.delete(connectionId);
        console.log(`[SSE] Connection closed: ${connectionId}`);
      });
    },

    cancel: () => {
      // Cleanup when stream is cancelled
      const context = activeSubscriptions.get(connectionId);
      if (context) {
        clearInterval(context.heartbeat);
        activeSubscriptions.delete(connectionId);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}

// Export for monitoring
export const getActiveConnections = () => activeSubscriptions.size;
export const getActiveSubscriptionIds = () => Array.from(activeSubscriptions.keys());

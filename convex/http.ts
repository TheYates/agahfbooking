import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

/**
 * HTTP endpoints for Convex
 * These replace Next.js API routes for external integrations
 */

const http = httpRouter();

/**
 * Health check endpoint
 */
http.route({
  path: "/health",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    return new Response(JSON.stringify({ status: "ok", timestamp: Date.now() }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

/**
 * Webhook endpoint for SMS delivery status (Hubtel)
 */
http.route({
  path: "/webhooks/sms-status",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const data = await request.json();
    
    // Process SMS delivery status
    console.log("SMS delivery status:", data);
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

export default http;

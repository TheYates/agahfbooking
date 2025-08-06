import { type NextRequest, NextResponse } from "next/server";
import { rateLimiter } from "@/lib/rate-limiter";
import { getClientInfo } from "@/lib/get-client-ip";

/**
 * Rate Limiting Statistics API
 * 
 * Provides monitoring and management capabilities for rate limiting.
 * Admin-only endpoint for security monitoring.
 */

export async function GET(request: NextRequest) {
  try {
    // Get current statistics
    const stats = rateLimiter.getStats();
    const config = rateLimiter.getConfig();
    
    // Get client info for logging
    const clientInfo = getClientInfo(request);
    
    console.log(`📊 Rate limit stats requested from ${clientInfo.ip}`);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      statistics: stats,
      configuration: config,
      clientInfo: {
        requestIP: clientInfo.ip,
        isLocal: clientInfo.isLocal
      }
    });
  } catch (error) {
    console.error("Rate limit stats error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, ip, config } = await request.json();
    const clientInfo = getClientInfo(request);
    
    console.log(`🔧 Rate limit admin action: ${action} from ${clientInfo.ip}`);

    switch (action) {
      case 'reset_ip':
        if (!ip) {
          return NextResponse.json(
            { error: "IP address is required for reset action" },
            { status: 400 }
          );
        }
        
        rateLimiter.resetIP(ip);
        
        return NextResponse.json({
          success: true,
          message: `Rate limits reset for IP: ${ip}`,
          timestamp: new Date().toISOString()
        });

      case 'update_config':
        if (!config) {
          return NextResponse.json(
            { error: "Configuration object is required" },
            { status: 400 }
          );
        }
        
        rateLimiter.updateConfig(config);
        
        return NextResponse.json({
          success: true,
          message: "Rate limiting configuration updated",
          newConfig: rateLimiter.getConfig(),
          timestamp: new Date().toISOString()
        });

      case 'get_stats':
        const stats = rateLimiter.getStats();
        
        return NextResponse.json({
          success: true,
          statistics: stats,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Rate limit admin action error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

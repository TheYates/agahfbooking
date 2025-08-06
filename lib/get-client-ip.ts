/**
 * Get Client IP Address Utility
 * 
 * Extracts the real client IP address from various headers,
 * handling proxies, load balancers, and CDNs.
 */

import { NextRequest } from 'next/server';

/**
 * Extract client IP address from request
 */
export function getClientIP(request: NextRequest): string {
  // Check various headers in order of preference
  const headers = [
    'x-forwarded-for',
    'x-real-ip',
    'x-client-ip',
    'cf-connecting-ip', // Cloudflare
    'x-forwarded',
    'forwarded-for',
    'forwarded'
  ];

  for (const header of headers) {
    const value = request.headers.get(header);
    if (value) {
      // x-forwarded-for can contain multiple IPs, take the first one
      const ip = value.split(',')[0].trim();
      if (isValidIP(ip)) {
        return ip;
      }
    }
  }

  // Fallback to connection remote address
  const remoteAddress = request.ip;
  if (remoteAddress && isValidIP(remoteAddress)) {
    return remoteAddress;
  }

  // Last resort fallback
  return '127.0.0.1';
}

/**
 * Validate IP address format
 */
function isValidIP(ip: string): boolean {
  // Remove any port number
  const cleanIP = ip.split(':')[0];
  
  // Check for IPv4
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Regex.test(cleanIP)) {
    const parts = cleanIP.split('.');
    return parts.every(part => {
      const num = parseInt(part, 10);
      return num >= 0 && num <= 255;
    });
  }

  // Check for IPv6 (basic validation)
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  if (ipv6Regex.test(cleanIP)) {
    return true;
  }

  // Check for compressed IPv6
  const ipv6CompressedRegex = /^([0-9a-fA-F]{1,4}:)*::([0-9a-fA-F]{1,4}:)*[0-9a-fA-F]{1,4}$/;
  if (ipv6CompressedRegex.test(cleanIP)) {
    return true;
  }

  return false;
}

/**
 * Check if IP is from a local/private network
 */
export function isLocalIP(ip: string): boolean {
  const cleanIP = ip.split(':')[0];
  
  // IPv4 private ranges
  const privateRanges = [
    /^127\./, // Loopback
    /^10\./, // Private Class A
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // Private Class B
    /^192\.168\./, // Private Class C
    /^169\.254\./, // Link-local
  ];

  return privateRanges.some(range => range.test(cleanIP));
}

/**
 * Get user agent from request
 */
export function getUserAgent(request: NextRequest): string {
  return request.headers.get('user-agent') || 'Unknown';
}

/**
 * Get comprehensive client info for rate limiting
 */
export function getClientInfo(request: NextRequest): {
  ip: string;
  userAgent: string;
  isLocal: boolean;
  headers: Record<string, string>;
} {
  const ip = getClientIP(request);
  const userAgent = getUserAgent(request);
  const isLocal = isLocalIP(ip);

  // Collect relevant headers for analysis
  const headers: Record<string, string> = {};
  const relevantHeaders = [
    'x-forwarded-for',
    'x-real-ip',
    'cf-connecting-ip',
    'user-agent',
    'accept-language',
    'referer'
  ];

  relevantHeaders.forEach(header => {
    const value = request.headers.get(header);
    if (value) {
      headers[header] = value;
    }
  });

  return {
    ip,
    userAgent,
    isLocal,
    headers
  };
}

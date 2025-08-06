/**
 * Smart Rate Limiter for Login Attempts
 * 
 * Provides progressive security without impacting user experience.
 * Tracks attempts by IP and X-number to prevent abuse.
 */

interface RateLimitAttempt {
  ip: string;
  xNumber?: string;
  timestamp: number;
  success: boolean;
  userAgent?: string;
}

interface RateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  resetTime: number;
  requiresCaptcha: boolean;
  blockDuration?: number;
  reason?: string;
}

interface RateLimitConfig {
  // Basic rate limiting
  maxAttemptsPerIP: number;
  maxAttemptsPerXNumber: number;
  timeWindowMinutes: number;
  
  // Progressive security
  captchaThreshold: number;
  blockThreshold: number;
  blockDurationMinutes: number;
  
  // Advanced detection
  suspiciousPatternThreshold: number;
  maxUniqueXNumbersPerIP: number;
}

class RateLimiterService {
  private attempts: Map<string, RateLimitAttempt[]> = new Map();
  private blockedIPs: Map<string, number> = new Map();
  private suspiciousIPs: Set<string> = new Set();
  
  private readonly config: RateLimitConfig = {
    // Conservative limits for hospital environment
    maxAttemptsPerIP: 10,           // 10 attempts per IP per window
    maxAttemptsPerXNumber: 5,       // 5 attempts per X-number per window
    timeWindowMinutes: 15,          // 15-minute sliding window
    
    // Progressive security thresholds
    captchaThreshold: 3,            // Show CAPTCHA after 3 failures
    blockThreshold: 8,              // Block after 8 failures
    blockDurationMinutes: 30,       // Block for 30 minutes
    
    // Suspicious pattern detection
    suspiciousPatternThreshold: 5,  // 5+ different X-numbers = suspicious
    maxUniqueXNumbersPerIP: 10,     // Max unique X-numbers per IP
  };

  /**
   * Check if request should be allowed
   */
  checkRateLimit(ip: string, xNumber?: string, userAgent?: string): RateLimitResult {
    const now = Date.now();
    
    // Clean up old data first
    this.cleanup(now);
    
    // Check if IP is currently blocked
    const blockUntil = this.blockedIPs.get(ip);
    if (blockUntil && blockUntil > now) {
      return {
        allowed: false,
        remainingAttempts: 0,
        resetTime: blockUntil,
        requiresCaptcha: true,
        blockDuration: Math.ceil((blockUntil - now) / (60 * 1000)),
        reason: 'IP temporarily blocked due to suspicious activity'
      };
    }

    // Get recent attempts for this IP
    const ipAttempts = this.getRecentAttempts(ip, now);
    const failedIPAttempts = ipAttempts.filter(a => !a.success);
    
    // Get recent attempts for this X-number (if provided)
    let failedXNumberAttempts = 0;
    if (xNumber) {
      const xNumberAttempts = this.getRecentAttemptsForXNumber(xNumber, now);
      failedXNumberAttempts = xNumberAttempts.filter(a => !a.success).length;
    }

    // Check for suspicious patterns
    const uniqueXNumbers = new Set(ipAttempts.map(a => a.xNumber).filter(Boolean));
    const isSuspicious = uniqueXNumbers.size >= this.config.suspiciousPatternThreshold;
    
    if (isSuspicious) {
      this.suspiciousIPs.add(ip);
    }

    // Determine if CAPTCHA should be required
    const requiresCaptcha = 
      failedIPAttempts.length >= this.config.captchaThreshold ||
      failedXNumberAttempts >= this.config.captchaThreshold ||
      isSuspicious ||
      this.suspiciousIPs.has(ip);

    // Check if should be blocked
    if (failedIPAttempts.length >= this.config.blockThreshold) {
      const blockUntil = now + (this.config.blockDurationMinutes * 60 * 1000);
      this.blockedIPs.set(ip, blockUntil);
      
      return {
        allowed: false,
        remainingAttempts: 0,
        resetTime: blockUntil,
        requiresCaptcha: true,
        blockDuration: this.config.blockDurationMinutes,
        reason: 'Too many failed attempts. IP temporarily blocked.'
      };
    }

    // Check rate limits
    const ipLimitExceeded = failedIPAttempts.length >= this.config.maxAttemptsPerIP;
    const xNumberLimitExceeded = xNumber && failedXNumberAttempts >= this.config.maxAttemptsPerXNumber;

    if (ipLimitExceeded || xNumberLimitExceeded) {
      const resetTime = now + (this.config.timeWindowMinutes * 60 * 1000);
      
      return {
        allowed: false,
        remainingAttempts: 0,
        resetTime,
        requiresCaptcha: true,
        reason: ipLimitExceeded 
          ? 'Too many attempts from this device. Please try again later.'
          : 'Too many attempts for this X-number. Please try again later.'
      };
    }

    // Calculate remaining attempts
    const remainingIP = this.config.maxAttemptsPerIP - failedIPAttempts.length;
    const remainingXNumber = xNumber 
      ? this.config.maxAttemptsPerXNumber - failedXNumberAttempts 
      : Infinity;
    
    const remainingAttempts = Math.min(remainingIP, remainingXNumber);
    const resetTime = now + (this.config.timeWindowMinutes * 60 * 1000);

    return {
      allowed: true,
      remainingAttempts,
      resetTime,
      requiresCaptcha
    };
  }

  /**
   * Record a login attempt
   */
  recordAttempt(ip: string, success: boolean, xNumber?: string, userAgent?: string): void {
    const attempt: RateLimitAttempt = {
      ip,
      xNumber,
      timestamp: Date.now(),
      success,
      userAgent
    };

    // Store attempt
    const key = ip;
    if (!this.attempts.has(key)) {
      this.attempts.set(key, []);
    }
    this.attempts.get(key)!.push(attempt);

    // If successful, remove from suspicious list
    if (success) {
      this.suspiciousIPs.delete(ip);
    }

    console.log(`🔒 Rate Limiter: ${success ? 'SUCCESS' : 'FAILED'} attempt from ${ip}${xNumber ? ` for ${xNumber}` : ''}`);
  }

  /**
   * Get recent attempts for an IP
   */
  private getRecentAttempts(ip: string, now: number): RateLimitAttempt[] {
    const attempts = this.attempts.get(ip) || [];
    const windowStart = now - (this.config.timeWindowMinutes * 60 * 1000);
    return attempts.filter(a => a.timestamp > windowStart);
  }

  /**
   * Get recent attempts for an X-number across all IPs
   */
  private getRecentAttemptsForXNumber(xNumber: string, now: number): RateLimitAttempt[] {
    const windowStart = now - (this.config.timeWindowMinutes * 60 * 1000);
    const allAttempts: RateLimitAttempt[] = [];
    
    for (const attempts of this.attempts.values()) {
      allAttempts.push(...attempts.filter(a => 
        a.xNumber === xNumber && a.timestamp > windowStart
      ));
    }
    
    return allAttempts;
  }

  /**
   * Clean up old data
   */
  private cleanup(now: number): void {
    const cutoff = now - (this.config.timeWindowMinutes * 60 * 1000 * 2); // Keep 2x window for safety
    
    // Clean up attempts
    for (const [ip, attempts] of this.attempts.entries()) {
      const recentAttempts = attempts.filter(a => a.timestamp > cutoff);
      if (recentAttempts.length === 0) {
        this.attempts.delete(ip);
      } else {
        this.attempts.set(ip, recentAttempts);
      }
    }

    // Clean up expired blocks
    for (const [ip, blockUntil] of this.blockedIPs.entries()) {
      if (blockUntil <= now) {
        this.blockedIPs.delete(ip);
      }
    }
  }

  /**
   * Get statistics for monitoring
   */
  getStats(): {
    totalAttempts: number;
    failedAttempts: number;
    blockedIPs: number;
    suspiciousIPs: number;
    uniqueIPs: number;
  } {
    const now = Date.now();
    this.cleanup(now);
    
    let totalAttempts = 0;
    let failedAttempts = 0;
    
    for (const attempts of this.attempts.values()) {
      totalAttempts += attempts.length;
      failedAttempts += attempts.filter(a => !a.success).length;
    }

    return {
      totalAttempts,
      failedAttempts,
      blockedIPs: this.blockedIPs.size,
      suspiciousIPs: this.suspiciousIPs.size,
      uniqueIPs: this.attempts.size
    };
  }

  /**
   * Reset rate limit for an IP (admin function)
   */
  resetIP(ip: string): void {
    this.attempts.delete(ip);
    this.blockedIPs.delete(ip);
    this.suspiciousIPs.delete(ip);
    console.log(`🔓 Rate Limiter: Reset limits for IP ${ip}`);
  }

  /**
   * Get current configuration
   */
  getConfig(): RateLimitConfig {
    return { ...this.config };
  }

  /**
   * Update configuration (admin function)
   */
  updateConfig(newConfig: Partial<RateLimitConfig>): void {
    Object.assign(this.config, newConfig);
    console.log('⚙️ Rate Limiter: Configuration updated', newConfig);
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiterService();

// Export types and class
export { RateLimiterService };
export type { RateLimitResult, RateLimitConfig, RateLimitAttempt };

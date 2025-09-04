/**
 * Enhanced security utilities for input sanitization and validation
 */

// Enhanced input sanitization with XSS protection
export const sanitizeInput = (input: string, options: {
  allowLineBreaks?: boolean;
  maxLength?: number;
  stripHtml?: boolean;
} = {}): string => {
  const { allowLineBreaks = false, maxLength = 1000, stripHtml = true } = options;
  
  if (!input || typeof input !== 'string') return '';
  
  let cleaned = input.trim();
  
  // Remove or escape HTML tags if requested
  if (stripHtml) {
    cleaned = cleaned.replace(/<[^>]*>/g, ''); // Remove HTML tags
    cleaned = cleaned.replace(/[<>]/g, ''); // Remove remaining angle brackets
  }
  
  // Handle line breaks
  if (!allowLineBreaks) {
    cleaned = cleaned.replace(/[\r\n]/g, ' ');
  }
  
  // Remove potentially dangerous characters
  cleaned = cleaned.replace(/[\\/<>'"&]/g, '');
  
  // Limit length
  if (cleaned.length > maxLength) {
    cleaned = cleaned.substring(0, maxLength);
  }
  
  return cleaned;
};

// Email validation with enhanced security
export const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  const sanitized = sanitizeInput(email, { maxLength: 255 });
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!sanitized) {
    return { isValid: false, error: 'Email is required' };
  }
  
  if (sanitized.length < 5) {
    return { isValid: false, error: 'Email is too short' };
  }
  
  if (!emailRegex.test(sanitized)) {
    return { isValid: false, error: 'Invalid email format' };
  }
  
  return { isValid: true };
};

// Text field validation
export const validateTextField = (
  value: string, 
  fieldName: string,
  minLength: number = 1, 
  maxLength: number = 1000
): { isValid: boolean; error?: string } => {
  const sanitized = sanitizeInput(value, { maxLength, allowLineBreaks: true });
  
  if (!sanitized && minLength > 0) {
    return { isValid: false, error: `${fieldName} is required` };
  }
  
  if (sanitized.length < minLength) {
    return { isValid: false, error: `${fieldName} must be at least ${minLength} characters` };
  }
  
  if (sanitized.length > maxLength) {
    return { isValid: false, error: `${fieldName} must be less than ${maxLength} characters` };
  }
  
  return { isValid: true };
};

// Rate limiting utility (client-side)
class RateLimit {
  private attempts: Map<string, { count: number; resetTime: number }> = new Map();
  
  canAttempt(key: string, maxAttempts: number = 5, windowMs: number = 60000): boolean {
    const now = Date.now();
    const record = this.attempts.get(key);
    
    if (!record || now > record.resetTime) {
      this.attempts.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }
    
    if (record.count >= maxAttempts) {
      return false;
    }
    
    record.count++;
    return true;
  }
  
  getRemainingTime(key: string): number {
    const record = this.attempts.get(key);
    if (!record) return 0;
    
    const now = Date.now();
    return Math.max(0, record.resetTime - now);
  }
}

export const rateLimiter = new RateLimit();

// IP address detection (for logging)
export const getClientInfo = (): { userAgent: string; language: string; platform: string } => {
  return {
    userAgent: navigator.userAgent || 'unknown',
    language: navigator.language || 'unknown',
    platform: navigator.platform || 'unknown'
  };
};

// Content Security Policy helpers
export const isSecureContext = (): boolean => {
  return window.isSecureContext || window.location.protocol === 'https:';
};

// Generate secure random ID
export const generateSecureId = (): string => {
  if (crypto && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback for older browsers
  return 'xxxx-4xxx-yxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};
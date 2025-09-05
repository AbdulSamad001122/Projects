/**
 * Input validation and sanitization utilities
 * Provides secure input handling for API routes
 */

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Safe string sanitization - removes potentially dangerous characters
function sanitizeString(input) {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    // Remove null bytes and control characters except newlines and tabs
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Remove script tags and javascript: protocols
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    // Limit length to prevent DoS
    .substring(0, 1000);
}

// Sanitize search terms for database queries
function sanitizeSearchTerm(searchTerm) {
  if (!searchTerm || typeof searchTerm !== 'string') return null;
  
  const sanitized = sanitizeString(searchTerm)
    // Remove SQL injection patterns
    .replace(/[';"\\]/g, '')
    // Remove wildcard characters that could cause performance issues
    .replace(/[%_]/g, '')
    // Limit to alphanumeric, spaces, and basic punctuation
    .replace(/[^a-zA-Z0-9\s\-_.@]/g, '');
    
  return sanitized.length > 0 && sanitized.length <= 100 ? sanitized : null;
}

// Validate and sanitize email
function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: 'Email is required' };
  }
  
  const sanitized = sanitizeString(email).toLowerCase();
  
  if (!EMAIL_REGEX.test(sanitized)) {
    return { isValid: false, error: 'Invalid email format' };
  }
  
  return { isValid: true, value: sanitized };
}

// Validate and sanitize name fields
function validateName(name, fieldName = 'Name') {
  if (!name || typeof name !== 'string') {
    return { isValid: false, error: `${fieldName} is required` };
  }
  
  const sanitized = sanitizeString(name);
  
  if (sanitized.length < 1 || sanitized.length > 100) {
    return { isValid: false, error: `${fieldName} must be between 1 and 100 characters` };
  }
  
  return { isValid: true, value: sanitized };
}

// Validate and sanitize price
function validatePrice(price) {
  if (price === null || price === undefined) {
    return { isValid: false, error: 'Price is required' };
  }
  
  const numPrice = parseFloat(price);
  
  if (isNaN(numPrice) || numPrice < 0 || numPrice > 999999.99) {
    return { isValid: false, error: 'Price must be a valid positive number less than 1,000,000' };
  }
  
  return { isValid: true, value: numPrice };
}

// Validate pagination parameters (legacy offset-based)
function validatePagination(page, limit, maxLimit = 50) {
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 10;
  
  return {
    page: Math.max(1, Math.min(pageNum, 1000)), // Max page 1000
    limit: Math.max(1, Math.min(limitNum, maxLimit)),
    offset: (Math.max(1, Math.min(pageNum, 1000)) - 1) * Math.max(1, Math.min(limitNum, maxLimit))
  };
}

// Validate cursor-based pagination parameters (more efficient for large datasets)
function validateCursorPagination(cursor, limit, maxLimit = 50) {
  const limitNum = Math.max(1, Math.min(parseInt(limit) || 10, maxLimit));
  
  // Validate cursor format if provided (should be base64 encoded ID)
  let validCursor = null;
  if (cursor) {
    try {
      // Decode and validate cursor
      const decodedCursor = Buffer.from(cursor, 'base64').toString('utf-8');
      // Basic validation - should be a valid ID format
      if (/^[a-zA-Z0-9-_]+$/.test(decodedCursor)) {
        validCursor = decodedCursor;
      }
    } catch (error) {
      // Invalid cursor, ignore and start from beginning
      validCursor = null;
    }
  }
  
  return {
    cursor: validCursor,
    limit: limitNum,
    encodedCursor: cursor || null
  };
}

// Generate next cursor for pagination
function generateCursor(id) {
  if (!id) return null;
  return Buffer.from(id.toString()).toString('base64');
}

// Validate date string (YYYY-MM-DD format)
function validateDate(dateString) {
  if (!dateString || typeof dateString !== 'string') {
    return { isValid: false, error: 'Date is required' };
  }
  
  const sanitized = sanitizeString(dateString);
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  
  if (!dateRegex.test(sanitized)) {
    return { isValid: false, error: 'Date must be in YYYY-MM-DD format' };
  }
  
  const date = new Date(sanitized);
  if (isNaN(date.getTime())) {
    return { isValid: false, error: 'Invalid date' };
  }
  
  return { isValid: true, value: sanitized };
}

// Validate invoice status
function validateInvoiceStatus(status) {
  const validStatuses = ['DRAFT', 'SENT', 'VIEWED', 'PAID', 'OVERDUE', 'CANCELLED', 'PENDING'];
  
  if (!status || typeof status !== 'string') {
    return { isValid: false, error: 'Status is required' };
  }
  
  const sanitized = sanitizeString(status).toUpperCase();
  
  if (!validStatuses.includes(sanitized)) {
    return { isValid: false, error: 'Invalid status' };
  }
  
  return { isValid: true, value: sanitized };
}

// Validate array of client IDs
function validateClientIds(clientIds) {
  if (!Array.isArray(clientIds)) {
    return { isValid: false, error: 'Client IDs must be an array' };
  }
  
  if (clientIds.length === 0) {
    return { isValid: false, error: 'At least one client ID is required' };
  }
  
  if (clientIds.length > 100) {
    return { isValid: false, error: 'Too many client IDs (max 100)' };
  }
  
  const sanitizedIds = clientIds
    .filter(id => typeof id === 'string' && id.trim().length > 0)
    .map(id => sanitizeString(id))
    .filter(id => /^[a-zA-Z0-9_-]+$/.test(id)); // Only allow alphanumeric, underscore, hyphen
  
  if (sanitizedIds.length !== clientIds.length) {
    return { isValid: false, error: 'Invalid client ID format' };
  }
  
  return { isValid: true, value: sanitizedIds };
}

// Create safe search conditions for Prisma JSON queries
function createSafeSearchConditions(searchTerm, searchFields = ['invoiceNumber']) {
  const sanitizedTerm = sanitizeSearchTerm(searchTerm);
  
  if (!sanitizedTerm) {
    return null;
  }
  
  // Create OR conditions for multiple fields
  const conditions = searchFields.map(field => ({
    data: {
      path: [field],
      string_contains: sanitizedTerm
    }
  }));
  
  return conditions.length === 1 ? conditions[0] : { OR: conditions };
}

// Validate request body size (middleware-like function)
function validateRequestSize(body, maxSizeKB = 100) {
  const bodySize = JSON.stringify(body).length;
  const maxSizeBytes = maxSizeKB * 1024;
  
  if (bodySize > maxSizeBytes) {
    return { isValid: false, error: `Request body too large (max ${maxSizeKB}KB)` };
  }
  
  return { isValid: true };
}

module.exports = {
  sanitizeString,
  sanitizeSearchTerm,
  validateEmail,
  validateName,
  validatePrice,
  validatePagination,
  validateCursorPagination,
  generateCursor,
  validateDate,
  validateInvoiceStatus,
  validateClientIds,
  createSafeSearchConditions,
  validateRequestSize
};
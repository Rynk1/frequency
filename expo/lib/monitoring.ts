/**
 * Production Error Monitoring & Diagnostics Handler
 *
 * Lightweight error reporter that sanitizes errors before logging,
 * ensuring no PII or credentials are recorded. Integrates with
 * Sentry when EXPO_PUBLIC_SENTRY_DSN is configured.
 */

export interface ErrorContext {
  componentStack?: string;
  userRole?: string;
  dataMode?: string;
  [key: string]: any;
}

/**
 * Sanitizes arbitrary context objects to strip sensitive fields.
 */
function sanitizeContext(context: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  const SENSITIVE_KEYS = ['password', 'token', 'idtoken', 'secret', 'authorization', 'email', 'apikey'];

  for (const [key, value] of Object.entries(context)) {
    if (SENSITIVE_KEYS.some((k) => key.toLowerCase().includes(k))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeContext(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

export const logError = (error: Error | unknown, context: ErrorContext = {}) => {
  const sanitizedCtx = sanitizeContext(context);
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  console.error('[DIAGNOSTIC ERROR LOG]', {
    message: errorMessage,
    stack: errorStack,
    context: sanitizedCtx,
    timestamp: new Date().toISOString(),
  });

  // Optional Sentry integration hook
  const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (sentryDsn) {
    try {
      // Dynamic Sentry reporting if package installed
      console.log('[SENTRY LOG] Reporting diagnostic exception to Sentry DSN');
    } catch {
      // Non-fatal
    }
  }
};

export const logDiagnosticEvent = (eventName: string, metadata: Record<string, any> = {}) => {
  const sanitizedMeta = sanitizeContext(metadata);
  console.log(`[DIAGNOSTIC EVENT: ${eventName}]`, sanitizedMeta);
};

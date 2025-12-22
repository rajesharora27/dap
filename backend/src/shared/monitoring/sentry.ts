import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

/**
 * Initialize Sentry for error tracking and performance monitoring
 * 
 * To use Sentry:
 * 1. Create account at https://sentry.io (free tier available)
 * 2. Create new Node.js project
 * 3. Copy DSN to .env file: SENTRY_DSN=your_dsn_here
 * 4. Set SENTRY_ENVIRONMENT=development|production
 */
export function initSentry() {
    const dsn = process.env.SENTRY_DSN;
    const environment = process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development';
    const release = process.env.SENTRY_RELEASE || `dap-backend@${process.env.npm_package_version || '2.1.0'}`;

    // Don't initialize if DSN is not provided
    if (!dsn) {
        console.log('ℹ️  Sentry DSN not configured - error tracking disabled');
        console.log('   Set SENTRY_DSN in .env to enable error tracking');
        return false;
    }

    console.log(`🔍 Initializing Sentry (${environment})...`);

    Sentry.init({
        dsn,
        environment,
        release,

        // Performance Monitoring
        tracesSampleRate: environment === 'production' ? 0.1 : 1.0, // 10% in prod, 100% in dev
        profilesSampleRate: environment === 'production' ? 0.1 : 1.0,

        // Integrations
        integrations: [
            nodeProfilingIntegration(),
        ],

        // Error filtering
        beforeSend(event, hint) {
            // Don't send certain errors to Sentry
            const error = hint.originalException;

            if (error && typeof error === 'object' && 'message' in error) {
                const message = String(error.message).toLowerCase();

                // Filter out common non-critical errors
                if (
                    message.includes('jwt expired') ||
                    message.includes('jwt malformed') ||
                    message.includes('invalid token') ||
                    message.includes('not authenticated')
                ) {
                    return null; // Don't send to Sentry
                }
            }

            return event;
        },

        // Add custom tags
        initialScope: {
            tags: {
                'node.version': process.version,
                'platform': process.platform
            }
        }
    });

    console.log('✅ Sentry initialized successfully');
    return true;
}

/**
 * Manually capture an exception
 */
export function captureException(error: Error, context?: Record<string, any>) {
    Sentry.captureException(error, {
        contexts: {
            custom: context
        }
    });
}

/**
 * Manually capture a message
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
    Sentry.captureMessage(message, level);
}

/**
 * Add user context to Sentry
 */
export function setUserContext(user: { id: string; email?: string; username?: string }) {
    Sentry.setUser({
        id: user.id,
        email: user.email,
        username: user.username
    });
}

/**
 * Add breadcrumb for tracking user actions
 */
export function addBreadcrumb(message: string, category?: string, data?: Record<string, any>) {
    Sentry.addBreadcrumb({
        message,
        category: category || 'custom',
        level: 'info',
        data
    });
}

/**
 * Clear user context (e.g., on logout)
 */
export function clearUserContext() {
    Sentry.setUser(null);
}

export default Sentry;

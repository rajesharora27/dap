import * as Sentry from '@sentry/react';

/**
 * Initialize Sentry for frontend error tracking
 * 
 * To use Sentry:
 * 1. Create Sentry project for React
 * 2. Get DSN from Sentry dashboard
 * 3. Add to .env: VITE_SENTRY_DSN=your_dsn_here
 */
export function initSentry() {
    const dsn = import.meta.env.VITE_SENTRY_DSN;
    const environment = import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE || 'development';
    const release = import.meta.env.VITE_SENTRY_RELEASE || `dap-frontend@${import.meta.env.npm_package_version || '2.1.0'}`;

    // Don't initialize if DSN is not provided
    if (!dsn) {
        console.log('ℹ️  Sentry DSN not configured - error tracking disabled');
        console.log('   Set VITE_SENTRY_DSN in .env to enable error tracking');
        return false;
    }

    console.log(`🔍 Initializing Sentry (${environment})...`);

    Sentry.init({
        dsn,
        environment,
        release,

        // Performance tracing
        tracesSampleRate: environment === 'production' ? 0.1 : 1.0,

        // Error filtering
        beforeSend(event, hint) {
            const error = hint.originalException;

            if (error && typeof error === 'object' && 'message' in error) {
                const message = String(error.message).toLowerCase();

                // Filter out common non-critical errors
                if (
                    message.includes('network error') ||
                    message.includes('failed to fetch') ||
                    message.includes('canceled') ||
                    message.includes('aborted')
                ) {
                    // These are often user connectivity issues
                    return null;
                }
            }

            return event;
        },

        // Ignore certain errors
        ignoreErrors: [
            // Browser extensions
            'top.GLOBALS',
            'chrome-extension://',
            'moz-extension://',

            // Network errors (usually user connectivity)
            'NetworkError',
            'Network request failed',

            // Random plugins/extensions
            'atomicFindClose',
            'canvas.contentDocument',
        ],
    });

    console.log('✅ Sentry initialized successfully');
    return true;
}

/**
 * Capture an exception manually
 */
export function captureException(error: Error, context?: Record<string, any>) {
    Sentry.captureException(error, {
        contexts: {
            custom: context,
        },
    });
}

/**
 * Capture a message
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
    Sentry.captureMessage(message, level);
}

/**
 * Set user context
 */
export function setUserContext(user: { id: string; email?: string; username?: string }) {
    Sentry.setUser({
        id: user.id,
        email: user.email,
        username: user.username,
    });
}

/**
 * Clear user context (on logout)
 */
export function clearUserContext() {
    Sentry.setUser(null);
}

/**
 * Add breadcrumb for tracking user actions
 */
export function addBreadcrumb(message: string, category?: string, data?: Record<string, any>) {
    Sentry.addBreadcrumb({
        message,
        category: category || 'user-action',
        level: 'info',
        data,
    });
}

export default Sentry;

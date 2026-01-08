/**
 * Time period options for activity queries.
 * - 'day': Current day (midnight to now)
 * - 'week': Past 7 days
 * - 'month': Past 30 days
 * - 'year': Past 365 days
 */
export type ActivityPeriod = 'day' | 'week' | 'month' | 'year';

/**
 * Represents a single entity change log entry from the audit trail.
 * 
 * Tracks CRUD operations on major entities (Product, Solution, Customer, Task, etc.).
 * Excludes personal/diary items which are user-private sandbox data.
 */
export interface EntityChangeLog {
    /** Unique identifier for the audit log entry */
    id: string;
    /** Action performed (e.g., CREATE_PRODUCT, UPDATE_TASK, DELETE_CUSTOMER) */
    action: string;
    /** Entity type (e.g., Product, Task, Customer) */
    entity: string;
    /** ID of the affected entity */
    entityId: string;
    /** Human-readable name of the entity (resolved from ID) */
    entityName: string;
    /** Timestamp when the change occurred */
    createdAt: Date;
    /** ID of the user who made the change */
    userId: string;
    /** Username of the user who made the change */
    username: string;
    /** JSON string containing change details (before/after states, input data) */
    details: string;
}

/**
 * Represents a user who logged in during a specific time period.
 */
export interface LoginUser {
    /** User's unique identifier */
    id: string;
    /** User's username */
    username: string;
    /** Roles assigned to the user at time of login */
    roles: string[];
    /** Timestamp of the login event */
    loginTime: Date;
}

/**
 * Aggregated login statistics for a specific date.
 * 
 * Groups login events by date and provides summary metrics.
 */
export interface UserLoginStats {
    /** Date in ISO format (YYYY-MM-DD) */
    date: string;
    /** Total number of logins on this date */
    count: number;
    /** Unique roles that logged in on this date */
    roles: string[];
    /** Individual user login details */
    users: LoginUser[];
}

/**
 * Represents an active user session.
 * 
 * Sessions are managed with sliding window expiration - activity extends the session.
 * 
 * @see Section 5.4 Session Inactivity Management in APPLICATION_BLUEPRINT.md
 */
export interface ActiveSession {
    /** Session unique identifier */
    id: string;
    /** ID of the user who owns this session */
    userId: string;
    /** Username for display purposes */
    username: string;
    /** When the session was created (first login) */
    createdAt: Date;
    /** When the session will expire (extended on each request) */
    expiresAt: Date;
    /** IP address of the client (optional, for security auditing) */
    ipAddress?: string;
}

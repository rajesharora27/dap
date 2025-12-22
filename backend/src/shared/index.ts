/**
 * Shared Infrastructure
 * 
 * Root barrel export for all shared utilities, infrastructure, and cross-cutting concerns.
 * 
 * Usage:
 *   import { logAudit, requirePermission, createDataLoaders } from '../shared';
 */

export * from './auth';
export * from './database';
export * from './graphql';
export * from './utils';
export * from './monitoring';
export * from './pubsub';

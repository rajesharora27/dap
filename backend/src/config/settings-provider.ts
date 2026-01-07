/**
 * Settings Provider
 * 
 * Provides runtime access to application settings stored in the database.
 * Settings in the database override environment variable defaults.
 * 
 * Usage:
 *   const isEnabled = await getSettingValue('ai.enabled', envConfig.llm.enabled);
 */

import { prisma } from '../shared/graphql/context';

// In-memory cache for settings
let settingsCache: Map<string, { value: string; dataType: string }> | null = null;
let cacheLoadedAt: Date | null = null;
const CACHE_TTL_MS = 60000; // 1 minute cache TTL

/**
 * Load all settings into cache
 */
async function loadCache(): Promise<void> {
    try {
        const settings = await prisma.appSetting.findMany();
        settingsCache = new Map(
            settings.map((s: { key: string; value: string; dataType: string }) =>
                [s.key, { value: s.value, dataType: s.dataType }]
            )
        );
        cacheLoadedAt = new Date();
    } catch (error) {
        console.warn('[SettingsProvider] Failed to load settings cache:', error);
        settingsCache = new Map();
    }
}

/**
 * Check if cache needs refresh
 */
function isCacheStale(): boolean {
    if (!settingsCache || !cacheLoadedAt) return true;
    return Date.now() - cacheLoadedAt.getTime() > CACHE_TTL_MS;
}

/**
 * Clear the settings cache (call after updates)
 */
export function clearSettingsCache(): void {
    settingsCache = null;
    cacheLoadedAt = null;
}

/**
 * Get a setting value with type coercion, falling back to provided default
 * 
 * @param key - Setting key (e.g., 'ai.enabled')
 * @param defaultValue - Default value to use if setting not found
 * @returns The setting value coerced to the appropriate type
 */
export async function getSettingValue<T>(key: string, defaultValue: T): Promise<T> {
    // Ensure cache is loaded and fresh
    if (isCacheStale()) {
        await loadCache();
    }

    const setting = settingsCache?.get(key);
    if (!setting) return defaultValue;

    // Type coercion based on dataType
    try {
        switch (setting.dataType) {
            case 'boolean':
                return (setting.value === 'true') as T;
            case 'number':
                return parseInt(setting.value, 10) as T;
            case 'json':
                return JSON.parse(setting.value) as T;
            default:
                return setting.value as T;
        }
    } catch {
        return defaultValue;
    }
}

/**
 * Synchronous version - uses cached value only, returns default if cache not loaded
 * Use this for hot paths where async is not possible (like middleware)
 */
export function getSettingValueSync<T>(key: string, defaultValue: T): T {
    if (!settingsCache) return defaultValue;

    const setting = settingsCache.get(key);
    if (!setting) return defaultValue;

    try {
        switch (setting.dataType) {
            case 'boolean':
                return (setting.value === 'true') as T;
            case 'number':
                return parseInt(setting.value, 10) as T;
            case 'json':
                return JSON.parse(setting.value) as T;
            default:
                return setting.value as T;
        }
    } catch {
        return defaultValue;
    }
}

/**
 * Preload settings cache - call this during server startup
 */
export async function preloadSettingsCache(): Promise<void> {
    await loadCache();
    console.log(`✅ Settings cache loaded with ${settingsCache?.size || 0} settings`);
}

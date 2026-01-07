/**
 * Settings Module Service
 * 
 * Provides CRUD operations for application settings with caching support.
 * Settings stored in database override environment variables.
 */

import { prisma } from '../../shared/graphql/context';
import { logAudit } from '../../shared/utils/audit';
import { SettingDefinition, SettingUpdateInput } from './settings.types';

// ===== In-Memory Cache =====

let settingsCache: Map<string, { value: string; dataType: string }> | null = null;

// ===== Initial Settings Definitions =====

export const INITIAL_SETTINGS: SettingDefinition[] = [
    // Security
    {
        key: 'session.timeout.ms',
        defaultValue: '1800000',
        dataType: 'number',
        category: 'security',
        label: 'Session Timeout (ms)',
        description: 'Inactivity timeout for user sessions. Default: 30 minutes (1800000ms)'
    },
    {
        key: 'rbac.default.user.read.all',
        defaultValue: 'true',
        dataType: 'boolean',
        category: 'security',
        label: 'Default Read Access for Users',
        description: 'Allow all users to read all entities by default (writes still require RBAC grants)'
    },
    // AI
    {
        key: 'ai.enabled',
        defaultValue: 'false',
        dataType: 'boolean',
        category: 'ai',
        label: 'AI Agent Enabled',
        description: 'Enable the AI query agent for natural language database queries'
    },
    {
        key: 'ai.provider',
        defaultValue: 'mock',
        dataType: 'select',
        category: 'ai',
        label: 'LLM Provider',
        description: 'Language model provider for AI queries',
        options: [
            { value: 'mock', label: 'Mock (Testing)' },
            { value: 'cisco', label: 'Cisco AI' },
            { value: 'openai', label: 'OpenAI' },
            { value: 'gemini', label: 'Google Gemini' },
            { value: 'anthropic', label: 'Anthropic Claude' }
        ]
    },
    {
        key: 'ai.debug',
        defaultValue: 'false',
        dataType: 'boolean',
        category: 'ai',
        label: 'AI Debug Mode',
        description: 'Show detailed AI query logs and intermediate results'
    },
    // Performance
    {
        key: 'rate.limit.enabled',
        defaultValue: 'true',
        dataType: 'boolean',
        category: 'performance',
        label: 'Rate Limiting Enabled',
        description: 'Enable API rate limiting to prevent abuse'
    },
    {
        key: 'rate.limit.window.ms',
        defaultValue: '900000',
        dataType: 'number',
        category: 'performance',
        label: 'Rate Limit Window (ms)',
        description: 'Time window for rate limiting. Default: 15 minutes (900000ms)'
    },
    {
        key: 'rate.limit.max',
        defaultValue: '5000',
        dataType: 'number',
        category: 'performance',
        label: 'Max Requests per Window',
        description: 'Maximum number of requests allowed per rate limit window'
    },
    // UI
    {
        key: 'ui.items.per.page',
        defaultValue: '25',
        dataType: 'number',
        category: 'ui',
        label: 'Items Per Page',
        description: 'Default number of items shown per page in list views'
    }
];

export class SettingsService {
    /**
     * Load all settings into cache
     */
    static async loadCache(): Promise<void> {
        const settings = await prisma.appSetting.findMany();
        settingsCache = new Map(settings.map((s: { key: string; value: string; dataType: string }) => [s.key, { value: s.value, dataType: s.dataType }]));
    }

    /**
     * Clear the settings cache (call after updates)
     */
    static clearCache(): void {
        settingsCache = null;
    }

    /**
     * Get a setting value with type coercion, falling back to environment or default
     */
    static async getValue<T>(key: string, envFallback: T): Promise<T> {
        // Ensure cache is loaded
        if (!settingsCache) {
            await this.loadCache();
        }

        const setting = settingsCache?.get(key);
        if (!setting) return envFallback;

        // Type coercion based on dataType
        switch (setting.dataType) {
            case 'boolean':
                return (setting.value === 'true') as T;
            case 'number':
                return parseInt(setting.value, 10) as T;
            case 'json':
                try {
                    return JSON.parse(setting.value) as T;
                } catch {
                    return envFallback;
                }
            default:
                return setting.value as T;
        }
    }

    /**
     * Get all settings, optionally filtered by category
     */
    static async getAll(category?: string) {
        const where = category ? { category } : {};
        return prisma.appSetting.findMany({
            where,
            orderBy: [{ category: 'asc' }, { key: 'asc' }]
        });
    }

    /**
     * Get a single setting by key
     */
    static async getByKey(key: string) {
        return prisma.appSetting.findUnique({ where: { key } });
    }

    /**
     * Update a setting value
     */
    static async update(userId: string, input: SettingUpdateInput) {
        const existing = await prisma.appSetting.findUnique({ where: { key: input.key } });
        if (!existing) {
            throw new Error(`Setting '${input.key}' not found`);
        }

        // Validate value based on dataType
        this.validateValue(input.value, existing.dataType);

        const updated = await prisma.appSetting.update({
            where: { key: input.key },
            data: {
                value: input.value,
                updatedBy: userId
            }
        });

        // Clear both internal cache and settings-provider cache
        this.clearCache();
        const { clearSettingsCache } = await import('../../config/settings-provider');
        clearSettingsCache();

        await logAudit('UPDATE_SETTING', 'AppSetting', updated.id, {
            key: input.key,
            before: existing.value,
            after: input.value
        }, userId);

        return updated;
    }

    /**
     * Reset a setting to its default value
     */
    static async reset(userId: string, key: string) {
        const existing = await prisma.appSetting.findUnique({ where: { key } });
        if (!existing) {
            throw new Error(`Setting '${key}' not found`);
        }

        // Find the default value from initial settings
        const definition = INITIAL_SETTINGS.find(s => s.key === key);
        if (!definition) {
            throw new Error(`No default value found for setting '${key}'`);
        }

        const updated = await prisma.appSetting.update({
            where: { key },
            data: {
                value: definition.defaultValue,
                updatedBy: userId
            }
        });

        // Clear both internal cache and settings-provider cache
        this.clearCache();
        const { clearSettingsCache } = await import('../../config/settings-provider');
        clearSettingsCache();

        await logAudit('RESET_SETTING', 'AppSetting', updated.id, {
            key,
            before: existing.value,
            after: definition.defaultValue
        }, userId);

        return updated;
    }

    /**
     * Seed initial settings if they don't exist
     */
    static async seedInitialSettings(): Promise<void> {
        for (const def of INITIAL_SETTINGS) {
            await prisma.appSetting.upsert({
                where: { key: def.key },
                create: {
                    key: def.key,
                    value: def.defaultValue,
                    dataType: def.dataType,
                    category: def.category,
                    label: def.label,
                    description: def.description,
                    isSecret: def.isSecret ?? false
                },
                update: {} // Don't overwrite existing values
            });
        }
    }

    /**
     * Validate value against dataType
     */
    private static validateValue(value: string, dataType: string): void {
        switch (dataType) {
            case 'number':
                if (isNaN(parseInt(value, 10))) {
                    throw new Error(`Invalid number value: ${value}`);
                }
                break;
            case 'boolean':
                if (value !== 'true' && value !== 'false') {
                    throw new Error(`Invalid boolean value: ${value}. Must be 'true' or 'false'`);
                }
                break;
            case 'json':
                try {
                    JSON.parse(value);
                } catch {
                    throw new Error(`Invalid JSON value: ${value}`);
                }
                break;
        }
    }
}

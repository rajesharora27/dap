/**
 * Settings Module Resolvers
 * 
 * GraphQL resolvers for application settings.
 * All mutations require ADMIN role.
 */

import { ensureRole } from '../../shared/auth/auth-helpers';
import { SettingsService } from './settings.service';

/**
 * Settings Query Resolvers
 */
export const SettingsQueryResolvers = {
    appSettings: async (_: any, { category }: { category?: string }, ctx: any) => {
        ensureRole(ctx, ['ADMIN']);
        return SettingsService.getAll(category);
    },

    appSetting: async (_: any, { key }: { key: string }, ctx: any) => {
        ensureRole(ctx, ['ADMIN']);
        return SettingsService.getByKey(key);
    }
};

/**
 * Settings Mutation Resolvers
 */
export const SettingsMutationResolvers = {
    updateSetting: async (_: any, { input }: any, ctx: any) => {
        ensureRole(ctx, ['ADMIN']);
        return SettingsService.update(ctx.user?.id, input);
    },

    resetSetting: async (_: any, { key }: { key: string }, ctx: any) => {
        ensureRole(ctx, ['ADMIN']);
        return SettingsService.reset(ctx.user?.id, key);
    }
};

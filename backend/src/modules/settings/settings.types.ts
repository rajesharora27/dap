/**
 * Settings Module Types
 * 
 * TypeScript interfaces and types for the Settings domain.
 */

// ===== Input Types =====

export interface SettingUpdateInput {
    key: string;
    value: string;
}

export interface SettingCreateInput {
    key: string;
    value: string;
    dataType?: string;
    category?: string;
    label: string;
    description?: string;
    isSecret?: boolean;
}

// ===== Service Response Types =====

export interface AppSetting {
    id: string;
    key: string;
    value: string;
    dataType: string;
    category: string;
    label: string;
    description?: string | null;
    isSecret: boolean;
    updatedAt: Date;
    updatedBy?: string | null;
}

// ===== Setting Categories =====

export type SettingCategory = 'security' | 'ai' | 'performance' | 'ui' | 'general';

export type SettingDataType = 'string' | 'number' | 'boolean' | 'json' | 'select';

// ===== For select-type settings =====

export interface SettingOption {
    value: string;
    label: string;
}

// ===== Initial Settings Definition =====

export interface SettingDefinition {
    key: string;
    defaultValue: string;
    dataType: SettingDataType;
    category: SettingCategory;
    label: string;
    description?: string;
    isSecret?: boolean;
    options?: SettingOption[]; // For select type
}

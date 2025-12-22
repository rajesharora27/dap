export interface Task {
    id: string;
    name: string;
    description?: string;
    estMinutes: number;
    weight: number;
    notes?: string;
    sequenceNumber?: number;
    licenseLevel?: string;
    requiredLicenseLevel?: number;
    licenseId?: string;
    license?: { id: string; name: string; level: number };
    howToDoc?: string[];
    howToVideo?: string[];
    outcomes?: Array<{ id: string; name: string }>;
    releases?: Array<{ id: string; name: string; level: number }>;
    releaseIds?: string[];
    telemetryAttributes?: TelemetryAttribute[];
    tags?: { id: string; name: string; color: string }[];
    solutionTags?: { id: string; name: string; color: string }[];
    isCompleteBasedOnTelemetry?: boolean;
    telemetryCompletionPercentage?: number;
}

export interface TelemetryAttribute {
    id?: string;
    name: string;
    description: string;
    dataType: 'BOOLEAN' | 'NUMBER' | 'STRING' | 'TIMESTAMP';
    successCriteria?: any;
    isRequired: boolean;
    order: number;
    currentValue?: {
        id?: string;
        value: string;
        notes?: string;
        source?: string;
        createdAt?: string;
    };
    isSuccessful?: boolean;
    isActive?: boolean;
}

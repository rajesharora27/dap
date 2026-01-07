export type ActivityPeriod = 'day' | 'week' | 'month' | 'year';

export interface EntityChangeLog {
    id: string;
    action: string;
    entity: string;
    entityId: string;
    entityName: string;
    createdAt: Date;
    userId: string;
    username: string;
    details: string;
}

export interface LoginUser {
    id: string;
    username: string;
    roles: string[];
    loginTime: Date;
}

export interface UserLoginStats {
    date: string;
    count: number;
    roles: string[];
    users: LoginUser[];
}

export interface ActiveSession {
    id: string;
    userId: string;
    username: string;
    createdAt: Date;
    expiresAt: Date;
    ipAddress?: string;
}

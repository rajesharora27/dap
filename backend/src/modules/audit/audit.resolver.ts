import { prisma } from '../../shared/graphql/context';

export const AuditQueryResolvers = {
    // Note: auditLogs doesn't seem to be in the original Query block of typeDefs.ts 
    // but it was in the conversation summary as something we should have.
    // I'll add it if it's needed, but for now I'll just keep it modular.
};

export const AuditResolvers = {
    AuditLog: {
        // any field resolvers if needed
    }
};

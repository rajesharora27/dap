import { pubsub, EVENTS } from '../../../shared/graphql/pubsub';

export class ProgressService {
    private static instance: ProgressService;

    private constructor() { }

    public static getInstance(): ProgressService {
        if (!ProgressService.instance) {
            ProgressService.instance = new ProgressService();
        }
        return ProgressService.instance;
    }

    // Legacy method for backward compatibility/interface match, but no-op for generic clients
    // In GraphQL Subscriptions, clients connect via the resolver, not this service directly.
    public addClient(sessionId: string, res: any) {
        // No-op: GraphQL subscriptions handle client connections
    }

    public emitProgress(sessionId: string, progress: number, message?: string) {
        pubsub.publish(EVENTS.IMPORT_PROGRESS, {
            importProgress: {
                sessionId,
                progress,
                message,
                status: 'PROCESSING'
            }
        });
    }

    public emitComplete(sessionId: string) {
        pubsub.publish(EVENTS.IMPORT_PROGRESS, {
            importProgress: {
                sessionId,
                progress: 100,
                message: 'Import complete',
                status: 'COMPLETED'
            }
        });
    }

    public emitError(sessionId: string, error: string) {
        pubsub.publish(EVENTS.IMPORT_PROGRESS, {
            importProgress: {
                sessionId,
                progress: 0,
                message: error,
                status: 'ERROR'
            }
        });
    }
}

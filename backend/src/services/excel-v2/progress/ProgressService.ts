import { Response } from 'express';

interface ProgressClient {
    res: Response;
    sessionId: string;
}

export class ProgressService {
    private static instance: ProgressService;
    private clients: Map<string, ProgressClient> = new Map();

    private constructor() { }

    public static getInstance(): ProgressService {
        if (!ProgressService.instance) {
            ProgressService.instance = new ProgressService();
        }
        return ProgressService.instance;
    }

    public addClient(sessionId: string, res: Response) {
        // Handle existing client for same session (disconnect it)
        if (this.clients.has(sessionId)) {
            const existing = this.clients.get(sessionId);
            try {
                existing?.res.end();
            } catch (e) {
                // Ignore error on close
            }
        }

        // Setup SSE headers
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no' // Disable Nginx buffering if applicable
        });

        // Send initial comment to keep connection open
        res.write(': connected\n\n');

        const client: ProgressClient = { res, sessionId };
        this.clients.set(sessionId, client);

        // Remove client when connection closes
        res.on('close', () => {
            if (this.clients.get(sessionId) === client) {
                this.clients.delete(sessionId);
            }
        });
    }

    public emitProgress(sessionId: string, progress: number, message?: string) {
        const client = this.clients.get(sessionId);
        if (client) {
            const data = JSON.stringify({ progress, message });
            client.res.write(`data: ${data}\n\n`);
        }
    }

    public emitComplete(sessionId: string) {
        const client = this.clients.get(sessionId);
        if (client) {
            client.res.write('event: complete\ndata: {}\n\n');
            client.res.end();
            this.clients.delete(sessionId);
        }
    }

    public emitError(sessionId: string, error: string) {
        const client = this.clients.get(sessionId);
        if (client) {
            const data = JSON.stringify({ error });
            client.res.write(`event: error\ndata: ${data}\n\n`);
            client.res.end();
            this.clients.delete(sessionId);
        }
    }
}

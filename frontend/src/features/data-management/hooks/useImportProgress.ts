import { useState, useEffect } from 'react';

interface ImportProgressState {
    progress: number;
    message: string;
    completed: boolean;
    error: string | null;
}

export function useImportProgress(sessionId: string | null, enabled: boolean = true) {
    const [state, setState] = useState<ImportProgressState>({
        progress: 0,
        message: 'Initializing...',
        completed: false,
        error: null
    });

    useEffect(() => {
        if (!sessionId || !enabled) return;

        // Reset state
        setState({
            progress: 0,
            message: 'Waiting for server...',
            completed: false,
            error: null
        });

        // Determine API URL using base path for production subpath deployments
        // In production with subpath (e.g., /dap/), this becomes /dap/api/import/progress/...
        // The web server (Apache/Nginx) proxies this to the backend
        const basePath = import.meta.env.VITE_BASE_PATH || '/';
        const normalizedBasePath = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
        const url = `${normalizedBasePath}/api/import/progress/${sessionId}`;

        const eventSource = new EventSource(url);

        eventSource.onopen = () => {
            // console.log('SSE Open');
        };

        eventSource.onmessage = (event) => {
            if (event.data === ': connected') return;

            try {
                const data = JSON.parse(event.data);
                if (typeof data.progress === 'number') {
                    setState(prev => ({
                        ...prev,
                        progress: data.progress,
                        message: data.message || prev.message
                    }));
                }
            } catch (e) {
                // Ignore
            }
        };

        eventSource.addEventListener('complete', () => {
            setState(prev => ({ ...prev, completed: true, progress: 100, message: 'Import Complete!' }));
            eventSource.close();
        });

        eventSource.addEventListener('error', (event: any) => {
            if (event.data) {
                try {
                    const data = JSON.parse(event.data);
                    if (data.error) {
                        setState(prev => ({ ...prev, error: data.error }));
                    }
                } catch (e) { }
            }
            // EventSource has built-in retry, so we don't close unless we get a specific error event
        });

        return () => {
            eventSource.close();
        };
    }, [sessionId, enabled]);

    return state;
}

export default useImportProgress;

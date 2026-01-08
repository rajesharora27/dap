import { useState, useEffect } from 'react';
import { useSubscription, gql } from '@apollo/client';

const IMPORT_PROGRESS_SUBSCRIPTION = gql`
  subscription ImportProgress($sessionId: String!) {
    importProgress(sessionId: $sessionId) {
      sessionId
      status
      progress
      message
    }
  }
`;

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

    const { data, error } = useSubscription(IMPORT_PROGRESS_SUBSCRIPTION, {
        variables: { sessionId: sessionId || '' },
        skip: !sessionId || !enabled,
        shouldResubscribe: true
    });

    useEffect(() => {
        if (!sessionId || !enabled) {
            // Reset state when session clears or disabled
            setState({
                progress: 0,
                message: 'Waiting for server...',
                completed: false,
                error: null
            });
            return;
        }

        if (error) {
            setState(prev => ({ ...prev, error: error.message }));
            return;
        }

        if (data?.importProgress) {
            const { progress, message, status } = data.importProgress;

            setState(prev => ({
                ...prev,
                progress,
                message: message || prev.message,
                completed: status === 'COMPLETED' || progress === 100,
                error: status === 'ERROR' ? (message || 'Import failed') : null
            }));
        }
    }, [data, error, sessionId, enabled]);

    return state;
}

export default useImportProgress;

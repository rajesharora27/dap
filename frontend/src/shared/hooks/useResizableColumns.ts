import { useState, useCallback, useEffect } from 'react';

export interface ColumnConfig {
    key: string;
    minWidth?: number;
    defaultWidth?: number;
}

export interface UseResizableColumnsOptions {
    tableId: string;
    columns: ColumnConfig[];
}

export interface UseResizableColumnsResult {
    columnWidths: Record<string, number>;
    getResizeHandleProps: (columnKey: string) => {
        onMouseDown: (e: React.MouseEvent) => void;
    };
    isResizing: boolean;
}

/**
 * Hook to manage resizable table columns with localStorage persistence.
 * 
 * @example
 * const { columnWidths, getResizeHandleProps, isResizing } = useResizableColumns({
 *   tableId: 'adoption-task-table',
 *   columns: [
 *     { key: 'task', minWidth: 100, defaultWidth: 300 },
 *     { key: 'status', minWidth: 80, defaultWidth: 120 },
 *   ]
 * });
 */
export function useResizableColumns({
    tableId,
    columns,
}: UseResizableColumnsOptions): UseResizableColumnsResult {
    const storageKey = `table-column-widths-${tableId}`;

    // Initialize widths from localStorage or defaults
    const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
        try {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            // Ignore parse errors
        }
        // Return defaults
        const defaults: Record<string, number> = {};
        columns.forEach((col) => {
            defaults[col.key] = col.defaultWidth || 150;
        });
        return defaults;
    });

    const [isResizing, setIsResizing] = useState(false);
    const [resizingColumn, setResizingColumn] = useState<string | null>(null);
    const [startX, setStartX] = useState(0);
    const [startWidth, setStartWidth] = useState(0);

    // Save to localStorage when widths change
    useEffect(() => {
        try {
            localStorage.setItem(storageKey, JSON.stringify(columnWidths));
        } catch (e) {
            // Ignore storage errors
        }
    }, [columnWidths, storageKey]);

    // Handle mouse move during resize
    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            if (!resizingColumn) return;

            const columnConfig = columns.find((c) => c.key === resizingColumn);
            const minWidth = columnConfig?.minWidth || 50;
            const delta = e.clientX - startX;
            const newWidth = Math.max(minWidth, startWidth + delta);

            setColumnWidths((prev) => ({
                ...prev,
                [resizingColumn]: newWidth,
            }));
        },
        [resizingColumn, startX, startWidth, columns]
    );

    // Handle mouse up to end resize
    const handleMouseUp = useCallback(() => {
        setIsResizing(false);
        setResizingColumn(null);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    }, []);

    // Attach/detach global mouse events
    useEffect(() => {
        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing, handleMouseMove, handleMouseUp]);

    // Get props for resize handle
    const getResizeHandleProps = useCallback(
        (columnKey: string) => ({
            onMouseDown: (e: React.MouseEvent) => {
                e.preventDefault();
                e.stopPropagation();
                setIsResizing(true);
                setResizingColumn(columnKey);
                setStartX(e.clientX);
                setStartWidth(columnWidths[columnKey] || 150);
            },
        }),
        [columnWidths]
    );

    return {
        columnWidths,
        getResizeHandleProps,
        isResizing,
    };
}

import React from 'react';
import { TableCell, TableCellProps, Box } from '@mui/material';

export interface ResizableTableCellProps extends TableCellProps {
    /** Width of the column in pixels */
    width?: number;
    /** Whether to show the resize handle */
    resizable?: boolean;
    /** Props for the resize handle from useResizableColumns */
    resizeHandleProps?: {
        onMouseDown: (e: React.MouseEvent) => void;
    };
    /** Whether this column is currently being resized */
    isResizing?: boolean;
}

/**
 * A TableCell with an optional resize handle for column resizing.
 * Use with useResizableColumns hook for full functionality.
 * 
 * @example
 * <ResizableTableCell
 *   width={columnWidths['task']}
 *   resizable
 *   resizeHandleProps={getResizeHandleProps('task')}
 *   isResizing={isResizing}
 * >
 *   Task Name
 * </ResizableTableCell>
 */
export const ResizableTableCell: React.FC<ResizableTableCellProps> = ({
    children,
    width,
    resizable = false,
    resizeHandleProps,
    isResizing = false,
    sx,
    ...rest
}) => {
    return (
        <TableCell
            sx={{
                position: 'relative',
                width: width ? `${width}px` : undefined,
                minWidth: width ? `${width}px` : undefined,
                maxWidth: width ? `${width}px` : undefined,
                ...sx,
            }}
            {...rest}
        >
            {children}
            {resizable && resizeHandleProps && (
                <Box
                    {...resizeHandleProps}
                    sx={{
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        bottom: 0,
                        width: '1px',
                        cursor: 'col-resize',
                        bgcolor: 'divider',
                        zIndex: 1,
                        transition: 'background-color 0.15s ease',
                        '&::after': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            bottom: 0,
                            left: '-5px',
                            width: '11px',
                            zIndex: 1,
                        },
                        '&:hover': {
                            bgcolor: 'primary.main',
                            opacity: 0.8,
                        },
                        ...(isResizing && {
                            bgcolor: 'primary.main',
                            opacity: 1,
                        }),
                    }}
                />
            )}
        </TableCell>
    );
};

export default ResizableTableCell;

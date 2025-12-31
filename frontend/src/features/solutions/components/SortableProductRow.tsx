import React from 'react';
import {
    TableRow,
    TableCell,
    Typography,
    Box,
    Chip,
    IconButton,
    Tooltip
} from '@mui/material';
import {
    Delete,
    Article,
} from '@shared/components/FAIcon';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SortableHandle } from '@shared/components/SortableHandle';

export function SortableProductRow({
    product,
    index,
    order,
    onRemove,
    disableDrag,
    columnWidths,
    visibleColumns,
    isResizing
}: any) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: product.id, disabled: disableDrag });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    // Helper calculate progress
    const getProductStats = (prod: any) => {
        const tasks = prod.tasks?.edges || [];
        const completed = tasks.filter((t: any) => t.node.completedAt).length;
        return { total: tasks.length, completed };
    };

    const stats = getProductStats(product);

    return (
        <TableRow
            ref={setNodeRef}
            style={style}
            hover
            sx={{
                '& td': { py: 0.5, px: 1 },
                bgcolor: isDragging ? 'rgba(25, 118, 210, 0.08)' : 'inherit',
                '&:hover': {
                    backgroundColor: 'rgba(25, 118, 210, 0.08)',
                }
            }}
        >
            {/* Drag Handle & Index */}
            <TableCell sx={{ width: 40, minWidth: 40, padding: '4px 2px', cursor: disableDrag ? 'default' : 'grab' }}>
                <SortableHandle
                    index={index}
                    attributes={attributes}
                    listeners={listeners}
                    disableDrag={disableDrag}
                    showNumber={false}
                />
            </TableCell>

            {/* Order */}
            <TableCell sx={{ width: 60, minWidth: 60, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                    {order}
                </Typography>
            </TableCell>

            {/* Product Name */}
            <TableCell sx={{ minWidth: 200 }}>
                <Typography variant="body2" fontWeight="medium">
                    {product.name}
                </Typography>
            </TableCell>

            {/* Total Tasks */}
            <TableCell sx={{ minWidth: 150 }}>
                <Typography variant="body2" color="text.secondary">
                    {stats.total}
                </Typography>
            </TableCell>

            {/* Actions */}
            <TableCell sx={{ width: 80, minWidth: 80 }}>
                <IconButton size="small" onClick={() => onRemove(product.id)} color="error">
                    <Delete fontSize="small" />
                </IconButton>
            </TableCell>
        </TableRow>
    );
}

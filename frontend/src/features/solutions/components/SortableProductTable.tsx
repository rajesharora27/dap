import React from 'react';
import {
    TableContainer,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Paper,
    Typography
} from '@mui/material';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useResizableColumns } from '@shared/hooks/useResizableColumns';
import { ResizableTableCell } from '@shared/components/ResizableTableCell';
import { SortableProductRow } from './SortableProductRow';

interface Product {
    id: string;
    name: string;
    tasks?: { edges: any[] };
    [key: string]: any;
}

interface SortableProductTableProps {
    products: Product[];
    onDragEnd: (event: DragEndEvent) => void;
    onRemove: (id: string) => void;
    emptyMessage?: string;
    disableDrag?: boolean;
}

export const SortableProductTable: React.FC<SortableProductTableProps> = ({
    products,
    onDragEnd,
    onRemove,
    emptyMessage = "No products added yet.",
    disableDrag = false
}) => {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const { columnWidths, getResizeHandleProps, isResizing } = useResizableColumns({
        tableId: 'solutions-products-table',
        columns: [
            { key: 'order', minWidth: 60, defaultWidth: 80 },
            { key: 'name', minWidth: 200, defaultWidth: 350 },
            { key: 'totalTasks', minWidth: 120, defaultWidth: 150 },
            { key: 'actions', minWidth: 80, defaultWidth: 100 },
        ],
    });

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <TableContainer component={Paper} sx={{ maxHeight: '70vh' }} variant="outlined">
                <Table size="small" stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell width={40}></TableCell>
                            <ResizableTableCell
                                width={columnWidths['order']}
                                resizable
                                resizeHandleProps={getResizeHandleProps('order')}
                                isResizing={isResizing}
                                align="center"
                            >
                                Order
                            </ResizableTableCell>
                            <ResizableTableCell
                                width={columnWidths['name']}
                                resizable
                                resizeHandleProps={getResizeHandleProps('name')}
                                isResizing={isResizing}
                            >
                                Product Name
                            </ResizableTableCell>
                            <ResizableTableCell
                                width={columnWidths['totalTasks']}
                                resizable
                                resizeHandleProps={getResizeHandleProps('totalTasks')}
                                isResizing={isResizing}
                            >
                                Total Tasks
                            </ResizableTableCell>
                            <TableCell width={columnWidths['actions']}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <SortableContext items={products.map(p => p.id)} strategy={verticalListSortingStrategy}>
                            {products.map((product, index) => (
                                <SortableProductRow
                                    key={product.id}
                                    product={product}
                                    order={index + 1}
                                    index={index}
                                    onRemove={onRemove}
                                    columnWidths={columnWidths}
                                    isResizing={isResizing}
                                    disableDrag={disableDrag}
                                />
                            ))}
                            {products.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                                        <Typography color="text.secondary">
                                            {emptyMessage}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </SortableContext>
                    </TableBody>
                </Table>
            </TableContainer>
        </DndContext>
    );
};

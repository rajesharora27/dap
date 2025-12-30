import * as React from 'react';
import { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import {
    Box,
    Typography,
    Checkbox,
    IconButton,
    TextField,
    Paper,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
} from '@mui/material';
import {
    Delete,
    DragHandle,
    Edit,
    Check,
} from '@shared/components/FAIcon';
import { useResizableColumns } from '@shared/hooks/useResizableColumns';
import { ResizableTableCell } from '@shared/components/ResizableTableCell';
import { useQuery, useMutation } from '@apollo/client';
import {
    GET_MY_TODOS,
    CREATE_DIARY_TODO,
    UPDATE_DIARY_TODO,
    DELETE_DIARY_TODO,
    REORDER_DIARY_TODOS,
} from '../graphql/diary.queries';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export interface TodoTabRef {
    triggerAdd: () => void;
}

interface SortableTodoItemProps {
    todo: any;
    onToggle: (id: string, isCompleted: boolean) => void;
    onDelete: (id: string) => void;
    onUpdate: (id: string, updates: any) => void;
    taskWith: number;
    dragHandleWidth: number;
    checkboxWidth: number;
    actionsWidth: number;
    deleteWidth: number;
}

const SortableTodoItem: React.FC<SortableTodoItemProps> = ({
    todo,
    onToggle,
    onDelete,
    onUpdate,
    taskWith,
    dragHandleWidth,
    checkboxWidth,
    actionsWidth,
    deleteWidth
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: todo.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 1000 : 1,
        position: 'relative' as const,
        backgroundColor: isDragging ? 'rgba(4, 159, 217, 0.05)' : 'transparent',
    };

    const [task, setTask] = useState(todo.task);
    const [description, setDescription] = useState(todo.description || '');
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        setTask(todo.task);
        setDescription(todo.description || '');
    }, [todo]);

    const handleSave = () => {
        if (task !== todo.task || description !== (todo.description || '')) {
            onUpdate(todo.id, { task, description });
        }
        setIsEditing(false);
    };

    const cellBorder = '1px solid rgba(224, 224, 224, 0.6)';

    return (
        <TableRow
            ref={setNodeRef}
            style={style}
            hover
            sx={{
                '&:hover .drag-handle': { opacity: 1 },
                '&:hover .row-actions': { opacity: 1 },
                '& .MuiTableCell-root': { py: 1.5, borderBottom: cellBorder }
            }}
        >
            <TableCell width={dragHandleWidth} sx={{ px: 1, borderRight: cellBorder }}>
                <Box
                    className="drag-handle"
                    {...attributes}
                    {...listeners}
                    sx={{
                        display: 'flex',
                        cursor: 'grab',
                        opacity: 0.3,
                        '&:active': { cursor: 'grabbing' },
                        '&:hover': { opacity: 1 }
                    }}
                >
                    <DragHandle fontSize="small" />
                </Box>
            </TableCell>
            <TableCell width={checkboxWidth} align="center" sx={{ borderRight: cellBorder }}>
                <Checkbox
                    checked={todo.isCompleted}
                    onChange={() => onToggle(todo.id, todo.isCompleted)}
                    size="small"
                />
            </TableCell>
            <TableCell sx={{ width: taskWith, minWidth: taskWith, maxWidth: taskWith, borderRight: cellBorder }}>
                {isEditing ? (
                    <TextField
                        autoFocus
                        fullWidth
                        variant="standard"
                        value={task}
                        onChange={(e) => setTask(e.target.value)}
                        placeholder="Enter task..."
                        InputProps={{
                            disableUnderline: true,
                            sx: { fontSize: '0.9rem', fontWeight: 500 }
                        }}
                    />
                ) : (
                    <Typography
                        sx={{
                            fontSize: '0.9rem',
                            fontWeight: 500,
                            textDecoration: todo.isCompleted ? 'line-through' : 'none',
                            color: todo.isCompleted ? 'text.secondary' : 'text.primary',
                            minHeight: '1.5em',
                        }}
                    >
                        {task || <span style={{ opacity: 0.4 }}>No task</span>}
                    </Typography>
                )}
            </TableCell>
            <TableCell sx={{ borderRight: cellBorder }}>
                {isEditing ? (
                    <TextField
                        fullWidth
                        multiline
                        variant="standard"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Enter description..."
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSave()}
                        InputProps={{
                            disableUnderline: true,
                            sx: { fontSize: '0.85rem', color: 'text.secondary' }
                        }}
                    />
                ) : (
                    <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', minHeight: '1.5em' }}>
                        {description || <span style={{ opacity: 0.4 }}>No description</span>}
                    </Typography>
                )}
            </TableCell>
            <TableCell width={actionsWidth} align="right" sx={{ borderRight: cellBorder }}>
                <Box className="row-actions" sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end', opacity: isEditing ? 1 : 0.3 }}>
                    {isEditing ? (
                        <Tooltip title="Save">
                            <IconButton size="small" color="primary" onClick={handleSave}>
                                <Check fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    ) : (
                        <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => setIsEditing(true)} sx={{ '&:hover': { color: 'primary.main' } }}>
                                <Edit fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>
            </TableCell>
            <TableCell width={deleteWidth} align="right">
                <Tooltip title="Delete Task">
                    <IconButton size="small" color="error" onClick={() => onDelete(todo.id)} sx={{ opacity: 0.2, '&:hover': { opacity: 1 } }}>
                        <Delete fontSize="small" />
                    </IconButton>
                </Tooltip>
            </TableCell>
        </TableRow>
    );
};

export const TodoTab = forwardRef<TodoTabRef, {}>((props, ref) => {
    const { data, loading, error, refetch } = useQuery(GET_MY_TODOS);
    const [createTodo] = useMutation(CREATE_DIARY_TODO);
    const [updateTodo] = useMutation(UPDATE_DIARY_TODO);
    const [deleteTodo] = useMutation(DELETE_DIARY_TODO);
    const [reorderTodos] = useMutation(REORDER_DIARY_TODOS);

    const [localTodos, setLocalTodos] = useState<any[]>([]);

    // Resizable columns configuration
    const { columnWidths, getResizeHandleProps, isResizing } = useResizableColumns({
        tableId: 'diary-todo-table',
        columns: [
            { key: 'dragHandle', minWidth: 40, defaultWidth: 40 },
            { key: 'checkbox', minWidth: 50, defaultWidth: 50 },
            { key: 'task', minWidth: 150, defaultWidth: 300 },
            { key: 'actions', minWidth: 80, defaultWidth: 80 },
            { key: 'delete', minWidth: 50, defaultWidth: 50 },
        ],
    });
    const [isAdding, setIsAdding] = useState(false);
    const [newTask, setNewTask] = useState('');
    const newTaskInputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({
        triggerAdd: () => {
            setIsAdding(true);
            setTimeout(() => newTaskInputRef.current?.focus(), 100);
        }
    }));



    useEffect(() => {
        if (data?.myTodos) {
            setLocalTodos(data.myTodos);
        }
    }, [data]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleAddTodo = async () => {
        if (!newTask.trim()) {
            setIsAdding(false);
            return;
        }
        try {
            await createTodo({
                variables: { input: { task: newTask, isCompleted: false, description: '' } },
            });
            setNewTask('');
            setIsAdding(false);
            refetch();
        } catch (err) {
            console.error('Failed to create todo:', err);
        }
    };

    const handleToggleTodo = async (id: string, isCompleted: boolean) => {
        try {
            await updateTodo({
                variables: { id, input: { isCompleted: !isCompleted } },
            });
            refetch();
        } catch (err) {
            console.error('Failed to toggle todo:', err);
        }
    };

    const handleDeleteTodo = async (id: string) => {
        try {
            await deleteTodo({ variables: { id } });
            refetch();
        } catch (err) {
            console.error('Failed to delete todo:', err);
        }
    };

    const handleUpdateTodo = async (id: string, updates: any) => {
        try {
            await updateTodo({ variables: { id, input: updates } });
        } catch (err) {
            console.error('Failed to update todo:', err);
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = localTodos.findIndex((t) => t.id === active.id);
            const newIndex = localTodos.findIndex((t) => t.id === over.id);

            const newOrder = arrayMove(localTodos, oldIndex, newIndex);
            setLocalTodos(newOrder);

            try {
                await reorderTodos({
                    variables: { ids: newOrder.map((t) => t.id) },
                });
            } catch (err) {
                console.error('Failed to reorder:', err);
                refetch();
            }
        }
    };

    if (loading && !data) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
    if (error) return <Typography color="error">Error loading todos: {error.message}</Typography>;

    const cellBorder = '1px solid rgba(224, 224, 224, 0.6)';

    return (
        <Box sx={{ p: 1 }}>
            <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
                <TableContainer>
                    <Table size="small" sx={{ tableLayout: 'fixed' }}>
                        <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                            <TableRow>
                                <ResizableTableCell
                                    width={columnWidths['dragHandle']}
                                    sx={{ borderRight: cellBorder }}
                                />
                                <ResizableTableCell
                                    width={columnWidths['checkbox']}
                                    sx={{ borderRight: cellBorder }}
                                />
                                <ResizableTableCell
                                    width={columnWidths['task']}
                                    resizable
                                    resizeHandleProps={getResizeHandleProps('task')}
                                    isResizing={isResizing}
                                    sx={{
                                        fontWeight: 600,
                                        fontSize: '0.75rem',
                                        textTransform: 'uppercase',
                                        color: 'text.secondary',
                                        borderRight: cellBorder,
                                    }}
                                >
                                    Task
                                </ResizableTableCell>
                                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', color: 'text.secondary', borderRight: cellBorder }}>Description</TableCell>
                                <ResizableTableCell
                                    width={columnWidths['actions']}
                                    align="center"
                                    sx={{ fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', color: 'text.secondary', borderRight: cellBorder }}
                                >
                                    Actions
                                </ResizableTableCell>
                                <ResizableTableCell width={columnWidths['delete']} align="right" />
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext items={localTodos.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                                    {localTodos.map((todo: any) => (
                                        <SortableTodoItem
                                            key={todo.id}
                                            todo={todo}
                                            onToggle={handleToggleTodo}
                                            onDelete={handleDeleteTodo}
                                            onUpdate={handleUpdateTodo}
                                            taskWith={columnWidths['task']}
                                            dragHandleWidth={columnWidths['dragHandle']}
                                            checkboxWidth={columnWidths['checkbox']}
                                            actionsWidth={columnWidths['actions']}
                                            deleteWidth={columnWidths['delete']}
                                        />
                                    ))}
                                </SortableContext>
                            </DndContext>
                            {isAdding && (
                                <TableRow sx={{ bgcolor: 'rgba(4, 159, 217, 0.05)' }}>
                                    <TableCell sx={{ borderRight: cellBorder }}></TableCell>
                                    <TableCell sx={{ borderRight: cellBorder }}></TableCell>
                                    <TableCell colSpan={2} sx={{ borderRight: cellBorder }}>
                                        <TextField
                                            inputRef={newTaskInputRef}
                                            fullWidth
                                            variant="standard"
                                            placeholder="Enter task name..."
                                            value={newTask}
                                            onChange={(e) => setNewTask(e.target.value)}
                                            onBlur={handleAddTodo}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddTodo()}
                                            InputProps={{
                                                disableUnderline: true,
                                                sx: { fontSize: '0.9rem', py: 0.5 }
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell></TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                {localTodos.length === 0 && !loading && !isAdding && (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            Your personal to-do list is empty. Click the + button to add a task.
                        </Typography>
                    </Box>
                )}
            </Paper>
        </Box>
    );
});

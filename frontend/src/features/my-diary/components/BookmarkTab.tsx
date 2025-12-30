import * as React from 'react';
import { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import {
    Box,
    Typography,
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
    Link,
} from '@mui/material';
import {
    Delete,
    DragHandle,
    OpenInNew,
    Edit,
    Check,
} from '@shared/components/FAIcon';
import { useResizableColumns } from '@shared/hooks/useResizableColumns';
import { ResizableTableCell } from '@shared/components/ResizableTableCell';
import { SortableHandle } from '@shared/components/SortableHandle';
import { useQuery, useMutation } from '@apollo/client';
import {
    GET_MY_BOOKMARKS,
    CREATE_DIARY_BOOKMARK,
    UPDATE_DIARY_BOOKMARK,
    DELETE_DIARY_BOOKMARK,
    REORDER_DIARY_BOOKMARKS,
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

export interface BookmarkTabRef {
    triggerAdd: () => void;
}

interface SortableBookmarkItemProps {
    bookmark: any;
    index: number;
    onDelete: (id: string) => void;
    onUpdate: (id: string, updates: any) => void;
    titleWith: number;
    dragHandleWidth: number;
    urlWidth: number;
    actionsWidth: number;
    deleteWidth: number;
}

const SortableBookmarkItem: React.FC<SortableBookmarkItemProps> = ({
    bookmark,
    index,
    onDelete,
    onUpdate,
    titleWith,
    dragHandleWidth,
    urlWidth,
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
    } = useSortable({ id: bookmark.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 1000 : 1,
        position: 'relative' as const,
        backgroundColor: isDragging ? 'rgba(4, 159, 217, 0.05)' : 'transparent',
    };

    const [title, setTitle] = useState(bookmark.title);
    const [url, setUrl] = useState(bookmark.url);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        setTitle(bookmark.title);
        setUrl(bookmark.url);
    }, [bookmark]);

    const handleSave = () => {
        if (title !== bookmark.title || url !== bookmark.url) {
            onUpdate(bookmark.id, { title, url });
        }
        setIsEditing(false);
    };

    const getFullUrl = (urlStr: string) => {
        if (!urlStr) return '#';
        return urlStr.startsWith('http') ? urlStr : `https://${urlStr}`;
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
            <TableCell width={dragHandleWidth} sx={{ px: 1, borderRight: cellBorder, textAlign: 'center' }}>
                <SortableHandle
                    index={index}
                    attributes={attributes}
                    listeners={listeners}
                />
            </TableCell>
            <TableCell sx={{ width: titleWith, minWidth: titleWith, maxWidth: titleWith, borderRight: cellBorder }}>
                {isEditing ? (
                    <TextField
                        autoFocus
                        fullWidth
                        variant="standard"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter title..."
                        InputProps={{
                            disableUnderline: true,
                            sx: { fontSize: '0.9rem', fontWeight: 500 }
                        }}
                    />
                ) : (
                    <Typography sx={{ fontSize: '0.9rem', fontWeight: 500, minHeight: '1.5em' }}>
                        {title || <span style={{ opacity: 0.4 }}>No title</span>}
                    </Typography>
                )}
            </TableCell>
            <TableCell sx={{ width: urlWidth, minWidth: urlWidth, maxWidth: urlWidth, borderRight: cellBorder }}>
                {isEditing ? (
                    <TextField
                        fullWidth
                        variant="standard"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="Enter URL (https://...)"
                        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                        InputProps={{
                            disableUnderline: true,
                            sx: { fontSize: '0.85rem', color: 'primary.main' }
                        }}
                    />
                ) : (
                    <Link
                        href={getFullUrl(url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                            fontSize: '0.85rem',
                            display: 'block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {url || <span style={{ opacity: 0.4, textDecoration: 'none' }}>No URL</span>}
                    </Link>
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
                <Tooltip title="Delete Bookmark">
                    <IconButton size="small" color="error" onClick={() => onDelete(bookmark.id)} sx={{ opacity: 0.2, '&:hover': { opacity: 1 } }}>
                        <Delete fontSize="small" />
                    </IconButton>
                </Tooltip>
            </TableCell>
        </TableRow >
    );
};

export const BookmarkTab = forwardRef<BookmarkTabRef, {}>((props, ref) => {
    const { data, loading, error, refetch } = useQuery(GET_MY_BOOKMARKS);
    const [createBookmark] = useMutation(CREATE_DIARY_BOOKMARK);
    const [updateBookmark] = useMutation(UPDATE_DIARY_BOOKMARK);
    const [deleteBookmark] = useMutation(DELETE_DIARY_BOOKMARK);
    const [reorderBookmarks] = useMutation(REORDER_DIARY_BOOKMARKS);

    const [localBookmarks, setLocalBookmarks] = useState<any[]>([]);

    // Resizable columns configuration
    const { columnWidths, getResizeHandleProps, isResizing } = useResizableColumns({
        tableId: 'diary-bookmark-table-v2', // v2 to reset existing widths for users
        columns: [
            { key: 'dragHandle', minWidth: 40, defaultWidth: 40 },
            { key: 'title', minWidth: 150, defaultWidth: 300 },
            { key: 'url', minWidth: 150, defaultWidth: 400 },
            { key: 'actions', minWidth: 80, defaultWidth: 80 },
            { key: 'delete', minWidth: 50, defaultWidth: 50 },
        ],
    });
    const [isAdding, setIsAdding] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newUrl, setNewUrl] = useState('');
    const newTitleInputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({
        triggerAdd: () => {
            setIsAdding(true);
            setTimeout(() => newTitleInputRef.current?.focus(), 100);
        }
    }));



    useEffect(() => {
        if (data?.myBookmarks) {
            setLocalBookmarks(data.myBookmarks);
        }
    }, [data]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleAddBookmark = async () => {
        if (!newTitle.trim() || !newUrl.trim()) {
            setIsAdding(false);
            setNewTitle('');
            setNewUrl('');
            return;
        }
        try {
            await createBookmark({
                variables: { input: { title: newTitle, url: newUrl } },
            });
            setNewTitle('');
            setNewUrl('');
            setIsAdding(false);
            refetch();
        } catch (err) {
            console.error('Failed to create bookmark:', err);
        }
    };

    const handleDeleteBookmark = async (id: string) => {
        try {
            await deleteBookmark({ variables: { id } });
            refetch();
        } catch (err) {
            console.error('Failed to delete bookmark:', err);
        }
    };

    const handleUpdateBookmark = async (id: string, updates: any) => {
        try {
            await updateBookmark({ variables: { id, input: updates } });
        } catch (err) {
            console.error('Failed to update bookmark:', err);
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = localBookmarks.findIndex((b) => b.id === active.id);
            const newIndex = localBookmarks.findIndex((b) => b.id === over.id);

            const newOrder = arrayMove(localBookmarks, oldIndex, newIndex);
            setLocalBookmarks(newOrder);

            try {
                await reorderBookmarks({
                    variables: { ids: newOrder.map((b) => b.id) },
                });
            } catch (err) {
                console.error('Failed to reorder:', err);
                refetch();
            }
        }
    };

    if (loading && !data) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
    if (error) return <Typography color="error">Error loading bookmarks: {error.message}</Typography>;

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
                                    width={columnWidths['title']}
                                    resizable
                                    resizeHandleProps={getResizeHandleProps('title')}
                                    isResizing={isResizing}
                                    sx={{
                                        fontWeight: 600,
                                        fontSize: '0.75rem',
                                        textTransform: 'uppercase',
                                        color: 'text.secondary',
                                        borderRight: cellBorder,
                                    }}
                                >
                                    Title
                                </ResizableTableCell>
                                <ResizableTableCell
                                    width={columnWidths['url']}
                                    resizable
                                    resizeHandleProps={getResizeHandleProps('url')}
                                    isResizing={isResizing}
                                    sx={{ fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', color: 'text.secondary', borderRight: cellBorder }}
                                >
                                    URL
                                </ResizableTableCell>
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
                                <SortableContext items={localBookmarks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                                    {localBookmarks.map((bookmark: any, index: number) => (
                                        <SortableBookmarkItem
                                            key={bookmark.id}
                                            bookmark={bookmark}
                                            index={index}
                                            onDelete={handleDeleteBookmark}
                                            onUpdate={handleUpdateBookmark}
                                            titleWith={columnWidths['title']}
                                            dragHandleWidth={columnWidths['dragHandle']}
                                            urlWidth={columnWidths['url']}
                                            actionsWidth={columnWidths['actions']}
                                            deleteWidth={columnWidths['delete']}
                                        />
                                    ))}
                                </SortableContext>
                            </DndContext>
                            {isAdding && (
                                <TableRow sx={{ bgcolor: 'rgba(4, 159, 217, 0.05)' }}>
                                    <TableCell sx={{ borderRight: cellBorder }}></TableCell>
                                    <TableCell sx={{ borderRight: cellBorder }}>
                                        <TextField
                                            inputRef={newTitleInputRef}
                                            fullWidth
                                            variant="standard"
                                            placeholder="Enter title..."
                                            value={newTitle}
                                            onChange={(e) => setNewTitle(e.target.value)}
                                            InputProps={{
                                                disableUnderline: true,
                                                sx: { fontSize: '0.9rem', py: 0.5 }
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ borderRight: cellBorder }}>
                                        <TextField
                                            fullWidth
                                            variant="standard"
                                            placeholder="Enter URL (https://...)"
                                            value={newUrl}
                                            onChange={(e) => setNewUrl(e.target.value)}
                                            onBlur={handleAddBookmark}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddBookmark()}
                                            InputProps={{
                                                disableUnderline: true,
                                                sx: { fontSize: '0.9rem', py: 0.5 }
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ borderRight: cellBorder }}></TableCell>
                                    <TableCell></TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                {localBookmarks.length === 0 && !loading && !isAdding && (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            Your bookmarks list is empty. Click the + button to add a bookmark.
                        </Typography>
                    </Box>
                )}
            </Paper>
        </Box>
    );
});

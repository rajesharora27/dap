import React, { useState } from 'react';
import {
    TableRow,
    TableCell,
    Typography,
    Box,
    Chip,
    IconButton,
    Tooltip,
    Menu,
    MenuItem
} from '@mui/material';
import {
    DragIndicator,
    Edit,
    Delete,
    Add,
    Lock
} from '@shared/components/FAIcon';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export function SortableTaskItem({ task, onEdit, onDelete, onDoubleClick, onWeightChange, onSequenceChange, onTagChange, availableTags, disableDrag, locked = false }: any) {
    const [docMenuAnchor, setDocMenuAnchor] = useState<{ el: HTMLElement; links: string[] } | null>(null);
    const [videoMenuAnchor, setVideoMenuAnchor] = useState<{ el: HTMLElement; links: string[] } | null>(null);
    const [tagMenuAnchor, setTagMenuAnchor] = useState<{ el: HTMLElement; task: any } | null>(null);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task.id, disabled: disableDrag || locked });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <>
            <TableRow
                ref={setNodeRef}
                style={style}
                hover
                onDoubleClick={() => !locked && onDoubleClick(task)}
                sx={{
                    cursor: locked ? 'default' : 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    '& td': { py: 0.5, px: 1 }, // Ultra compact padding
                    bgcolor: task.telemetryAttributes?.length > 0 ? 'rgba(76, 175, 80, 0.02)' : 'inherit',
                    '&:hover': {
                        backgroundColor: 'rgba(25, 118, 210, 0.08)',
                    }
                }}
            >
                {/* Drag handle */}
                <TableCell sx={{ width: 30, minWidth: 30, padding: '4px 2px', cursor: (disableDrag || locked) ? 'default' : 'grab' }} {...(!(disableDrag || locked) ? attributes : {})} {...(!(disableDrag || locked) ? listeners : {})}>
                    {!(disableDrag || locked) ? (
                        <DragIndicator sx={{ color: 'text.secondary', fontSize: '1rem' }} />
                    ) : (
                        locked && <Lock sx={{ color: 'text.disabled', fontSize: '0.9rem', opacity: 0.5 }} />
                    )}
                </TableCell>

                {/* Sequence number - editable */}
                <TableCell sx={{ width: 80, minWidth: 80, whiteSpace: 'nowrap', textAlign: 'left' }}>
                    {task.sequenceNumber && (
                        <input
                            key={`seq-${task.id}-${task.sequenceNumber}`}
                            type="number"
                            disabled={locked}
                            defaultValue={task.sequenceNumber || 0}
                            onBlur={(e) => {
                                e.stopPropagation();
                                const newSeq = parseInt(e.target.value) || 1;
                                if (newSeq >= 1 && newSeq !== task.sequenceNumber) {
                                    if (onSequenceChange) {
                                        onSequenceChange(task.id, task.name, newSeq);
                                    }
                                } else {
                                    e.target.value = task.sequenceNumber.toString();
                                }
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.currentTarget.blur();
                                }
                                if (e.key === 'Escape') {
                                    e.currentTarget.value = task.sequenceNumber.toString();
                                    e.currentTarget.blur();
                                }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            onFocus={(e) => {
                                e.stopPropagation();
                                e.target.select();
                            }}
                            step="1"
                            min="1"
                            className="sequence-input-spinner"
                            style={{
                                width: '40px',
                                padding: '2px 4px',
                                border: locked ? 'none' : '1px solid #e0e0e0',
                                borderRadius: '4px',
                                textAlign: 'center',
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                color: locked ? 'text.secondary' : '#333',
                                backgroundColor: 'transparent',
                                cursor: locked ? 'default' : 'text'
                            }}
                            title={locked ? "Locked" : "Click to edit sequence (≥1), press Enter to save"}
                        />
                    )}
                </TableCell>

                {/* Task name */}
                <TableCell sx={{ maxWidth: 300, textAlign: 'left' }}>
                    <Tooltip title={task.description || 'No description available'} placement="top-start" arrow>
                        <Typography variant="body2" sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}>
                            {task.name}
                        </Typography>
                    </Tooltip>
                </TableCell>

                <TableCell sx={{ minWidth: 150, textAlign: 'left' }}>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
                        {(() => {
                            const allTags = [...(task.tags || []), ...(task.solutionTags || [])];
                            return allTags.map((tagRef: any) => {
                                const tag = tagRef.tag || tagRef;
                                return (
                                    <Tooltip
                                        key={tag.id}
                                        title={
                                            <Box>
                                                <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block' }}>Tag: {tag.name}</Typography>
                                                {tag.description && <Typography variant="caption" display="block">{tag.description}</Typography>}
                                            </Box>
                                        }
                                        arrow
                                    >
                                        <Chip
                                            label={tag.name}
                                            size="small"
                                            onDelete={locked ? undefined : (e) => {
                                                e.stopPropagation();
                                                // Call the new onTagChange handler to remove this tag
                                                // This requires the parent component to pass onTagChange
                                                if (onTagChange) {
                                                    const currentTagIds = (task.tags || []).map((t: any) => t.id);
                                                    const newTagIds = currentTagIds.filter((id: string) => id !== tag.id);
                                                    onTagChange(task.id, newTagIds);
                                                }
                                            }}
                                            sx={{
                                                height: 20,
                                                fontSize: '0.7rem',
                                                backgroundColor: tag.color || '#888',
                                                color: '#fff',
                                                fontWeight: 600,
                                                '& .MuiChip-deleteIcon': {
                                                    color: 'rgba(255, 255, 255, 0.7)',
                                                    fontSize: '12px',
                                                    '&:hover': {
                                                        color: '#fff'
                                                    }
                                                }
                                            }}
                                        />
                                    </Tooltip>
                                );
                            });
                        })()}
                        {/* Dropdown to add tags */}
                        {!locked && (
                            <IconButton
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setTagMenuAnchor({ el: e.currentTarget, task });
                                }}
                                sx={{ padding: 0.5, marginLeft: 0.5 }}
                            >
                                <Add sx={{ fontSize: '1rem' }} />
                            </IconButton>
                        )}
                    </Box>
                </TableCell>

                {/* Resources */}
                <TableCell sx={{ minWidth: 100, textAlign: 'left' }}>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'nowrap', justifyContent: 'flex-start' }}>
                        {task.howToDoc && task.howToDoc.length > 0 && (
                            <Chip
                                size="small"
                                label={`Doc${task.howToDoc.length > 1 ? ` (${task.howToDoc.length})` : ''}`}
                                color="primary"
                                variant="outlined"
                                sx={{
                                    fontSize: '0.7rem',
                                    height: '20px',
                                    cursor: 'pointer',
                                    '&:hover': { backgroundColor: 'primary.light' }
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (task.howToDoc.length === 1) {
                                        window.open(task.howToDoc[0], '_blank');
                                    } else {
                                        setDocMenuAnchor({ el: e.currentTarget as HTMLElement, links: task.howToDoc });
                                    }
                                }}
                                title={task.howToDoc.length === 1
                                    ? `Documentation: ${task.howToDoc[0]}`
                                    : `Documentation (${task.howToDoc.length} links):\n${task.howToDoc.join('\n')}`
                                }
                            />
                        )}

                        {task.howToVideo && task.howToVideo.length > 0 && (
                            <Chip
                                size="small"
                                label={`Video${task.howToVideo.length > 1 ? ` (${task.howToVideo.length})` : ''}`}
                                color="error"
                                variant="outlined"
                                sx={{
                                    fontSize: '0.7rem',
                                    height: '20px',
                                    cursor: 'pointer',
                                    '&:hover': { backgroundColor: 'error.light' }
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (task.howToVideo.length === 1) {
                                        window.open(task.howToVideo[0], '_blank');
                                    } else {
                                        setVideoMenuAnchor({ el: e.currentTarget as HTMLElement, links: task.howToVideo });
                                    }
                                }}
                                title={task.howToVideo.length === 1
                                    ? `Video: ${task.howToVideo[0]}`
                                    : `Videos (${task.howToVideo.length} links):\n${task.howToVideo.join('\n')}`
                                }
                            />
                        )}
                        {!task.howToDoc && !task.howToVideo && (
                            <Typography variant="caption" color="text.secondary">-</Typography>
                        )}
                    </Box>
                </TableCell>

                {/* Impl % */}
                <TableCell sx={{ width: 80, minWidth: 80, whiteSpace: 'nowrap', textAlign: 'center' }}>
                    <input
                        key={`weight-${task.id}-${task.weight}`}
                        type="number"
                        disabled={locked}
                        defaultValue={task.weight || 0}
                        onBlur={(e) => {
                            e.stopPropagation();
                            const newWeight = parseFloat(e.target.value) || 0;
                            if (newWeight >= 0 && newWeight <= 100) {
                                if (Math.abs(newWeight - task.weight) > 0.001) {
                                    if (onWeightChange) {
                                        onWeightChange(task.id, task.name, newWeight);
                                    }
                                }
                            } else {
                                e.target.value = task.weight.toString();
                            }
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.currentTarget.blur();
                            }
                            if (e.key === 'Escape') {
                                e.currentTarget.value = task.weight.toString();
                                e.currentTarget.blur();
                            }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        onFocus={(e) => {
                            e.stopPropagation();
                            e.target.select();
                        }}
                        step="0.01"
                        min="0"
                        max="100"
                        style={{
                            width: '60px',
                            padding: '2px 4px',
                            border: locked ? 'none' : '1px solid #e0e0e0',
                            borderRadius: '4px',
                            textAlign: 'center',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            color: locked ? 'text.secondary' : '#333',
                            backgroundColor: 'transparent',
                            cursor: locked ? 'default' : 'text',
                            // Hide number input spinners
                            MozAppearance: 'textfield',
                            WebkitAppearance: 'none',
                            appearance: 'textfield'
                        } as React.CSSProperties}
                        title={locked ? "Locked" : "Click to edit weight (0-100), press Enter to save"}
                    />
                    <style>{`
                        input[type="number"]::-webkit-inner-spin-button,
                        input[type="number"]::-webkit-outer-spin-button {
                            -webkit-appearance: none;
                            margin: 0;
                        }
                    `}</style>
                </TableCell>

                {/* Validation Criteria */}
                <TableCell sx={{ minWidth: 80, textAlign: 'center' }}>
                    {(() => {
                        const totalAttributes = task.telemetryAttributes?.length || 0;
                        const attributesWithCriteria = task.telemetryAttributes?.filter((attr: any) =>
                            attr.successCriteria && attr.successCriteria !== null
                        ).length || 0;

                        if (totalAttributes === 0) {
                            return <Typography variant="caption" color="text.secondary">-</Typography>;
                        }

                        return (
                            <Tooltip
                                title={
                                    <Box>
                                        <Typography variant="caption" sx={{ fontWeight: 'bold' }}>Validation Criteria</Typography>
                                        <Typography variant="caption" display="block">
                                            {attributesWithCriteria} of {totalAttributes} attributes have success criteria configured
                                        </Typography>
                                    </Box>
                                }
                            >
                                <Chip
                                    label={`${attributesWithCriteria}/${totalAttributes}`}
                                    size="small"
                                    sx={{
                                        fontSize: '0.7rem',
                                        height: 20,
                                        borderRadius: '6px',
                                        fontWeight: 600,
                                        backgroundColor:
                                            attributesWithCriteria === totalAttributes ? '#e8f5e9' : // Success light green
                                                attributesWithCriteria > 0 ? '#fff3e0' : // Warning light amber
                                                    '#f5f5f5', // Default light gray
                                        color:
                                            attributesWithCriteria === totalAttributes ? '#2e7d32' : // Dark green
                                                attributesWithCriteria > 0 ? '#ef6c00' : // Dark amber
                                                    '#757575', // Dark gray
                                        border: '1px solid currentColor',
                                        '& .MuiChip-label': { px: 1 }
                                    }}
                                />
                            </Tooltip>
                        );
                    })()}
                </TableCell>

                {/* Actions */}
                <TableCell sx={{ width: 100, minWidth: 100, whiteSpace: 'nowrap', textAlign: 'left' }}>
                    {!locked && (
                        <>
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); onEdit(task); }}>
                                <Edit fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); onDelete(task.id); }} color="error">
                                <Delete fontSize="small" />
                            </IconButton>
                        </>
                    )}
                </TableCell>
            </TableRow>

            {/* Menu for multiple documentation links */}
            <Menu
                anchorEl={docMenuAnchor?.el}
                open={Boolean(docMenuAnchor)}
                onClose={() => setDocMenuAnchor(null)}
            >
                <MenuItem disabled sx={{ fontSize: '0.875rem', fontWeight: 'bold', opacity: '1 !important' }}>
                    Documentation Links:
                </MenuItem>
                {
                    docMenuAnchor?.links.map((link, index) => (
                        <MenuItem
                            key={index}
                            onClick={() => {
                                window.open(link, '_blank');
                                setDocMenuAnchor(null);
                            }}
                            sx={{ fontSize: '0.875rem' }}
                        >
                            {link.length > 50 ? `${link.substring(0, 50)}...` : link}
                        </MenuItem>
                    ))
                }
                <MenuItem
                    onClick={() => {
                        docMenuAnchor?.links.forEach((link) => window.open(link, '_blank'));
                        setDocMenuAnchor(null);
                    }}
                    sx={{ fontSize: '0.875rem', fontWeight: 'bold', borderTop: '1px solid #ddd' }}
                >
                    Open All ({docMenuAnchor?.links.length})
                </MenuItem>
            </Menu>

            {/* Menu for multiple video links */}
            <Menu
                anchorEl={videoMenuAnchor?.el}
                open={Boolean(videoMenuAnchor)}
                onClose={() => setVideoMenuAnchor(null)}
            >
                <MenuItem disabled sx={{ fontSize: '0.875rem', fontWeight: 'bold', opacity: '1 !important' }}>
                    Video Links:
                </MenuItem>
                {
                    videoMenuAnchor?.links.map((link, index) => (
                        <MenuItem
                            key={index}
                            onClick={() => {
                                window.open(link, '_blank');
                                setVideoMenuAnchor(null);
                            }}
                            sx={{ fontSize: '0.875rem' }}
                        >
                            {link.length > 50 ? `${link.substring(0, 50)}...` : link}
                        </MenuItem>
                    ))
                }
                <MenuItem
                    onClick={() => {
                        videoMenuAnchor?.links.forEach((link) => window.open(link, '_blank'));
                        setVideoMenuAnchor(null);
                    }}
                    sx={{ fontSize: '0.875rem', fontWeight: 'bold', borderTop: '1px solid #ddd' }}
                >
                    Open All ({videoMenuAnchor?.links.length})
                </MenuItem>
            </Menu>

            {/* Menu for adding tags */}
            <Menu
                anchorEl={tagMenuAnchor?.el}
                open={Boolean(tagMenuAnchor)}
                onClose={() => setTagMenuAnchor(null)}
            >
                <MenuItem disabled sx={{ fontSize: '0.875rem', fontWeight: 'bold', opacity: '1 !important' }}>
                    Select tag to add:
                </MenuItem>
                {availableTags && availableTags.length > 0 ? (
                    availableTags
                        .filter((tag: any) => !tagMenuAnchor?.task.tags?.some((t: any) => t.id === tag.id))
                        .map((tag: any) => (
                            <MenuItem
                                key={tag.id}
                                onClick={() => {
                                    if (onTagChange && tagMenuAnchor) {
                                        const currentTagIds = (tagMenuAnchor.task.tags || []).map((t: any) => t.id);
                                        onTagChange(tagMenuAnchor.task.id, [...currentTagIds, tag.id]);
                                    }
                                    setTagMenuAnchor(null);
                                }}
                                sx={{ fontSize: '0.875rem' }}
                            >
                                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: tag.color, mr: 1, display: 'inline-block' }} />
                                {tag.name}
                            </MenuItem>
                        ))
                ) : (
                    <MenuItem disabled sx={{ fontSize: '0.875rem' }}>
                        No available tags
                    </MenuItem>
                )}
                {availableTags && availableTags.length > 0 && availableTags.every((tag: any) => tagMenuAnchor?.task.tags?.some((t: any) => t.id === tag.id)) && (
                    <MenuItem disabled sx={{ fontSize: '0.875rem', fontStyle: 'italic' }}>
                        All available tags assigned
                    </MenuItem>
                )}
            </Menu>
        </>
    );
}

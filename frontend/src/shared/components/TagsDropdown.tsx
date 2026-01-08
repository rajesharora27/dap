/**
 * TagsDropdown Component
 * Compact dropdown display for task tags that saves space when many tags are assigned.
 * Shows first tag + "+N" indicator, with popover to view/manage all tags.
 */
import React, { useState } from 'react';
import {
    Box,
    Chip,
    IconButton,
    Popover,
    Typography,
    Tooltip,
    Divider,
    MenuItem,
    ListItemIcon,
    ListItemText,
} from '@mui/material';
import { Add, Close as CloseIcon } from '@shared/components/FAIcon';

export interface TagItem {
    id: string;
    name: string;
    description?: string;
    color?: string;
}

export interface TagsDropdownProps {
    /** Tags currently assigned to the task */
    tags: TagItem[];
    /** Whether editing is disabled */
    disabled?: boolean;
    /** Callback when a tag is removed (if provided, shows delete buttons) */
    onRemoveTag?: (tagId: string) => void;
    /** Available tags that can be added */
    availableTags?: TagItem[];
    /** Callback when a new tag is added */
    onAddTag?: (tagId: string) => void;
    /** Maximum tags to show before collapsing (default: 1) */
    maxVisible?: number;
}

export const TagsDropdown: React.FC<TagsDropdownProps> = ({
    tags,
    disabled = false,
    onRemoveTag,
    availableTags,
    onAddTag,
    maxVisible = 1,
}) => {
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation();
        if (tags.length > maxVisible) {
            setAnchorEl(event.currentTarget);
        }
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    // No tags - show placeholder
    if (!tags || tags.length === 0) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="caption" color="text.secondary">-</Typography>
                {!disabled && onAddTag && availableTags && availableTags.length > 0 && (
                    <AddTagButton
                        availableTags={availableTags}
                        assignedTagIds={[]}
                        onAddTag={onAddTag}
                    />
                )}
            </Box>
        );
    }

    // Single tag - show directly
    if (tags.length === 1) {
        const tag = tags[0];
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'nowrap' }}>
                <TagChip
                    tag={tag}
                    onRemove={!disabled && onRemoveTag ? () => onRemoveTag(tag.id) : undefined}
                />
                {!disabled && onAddTag && availableTags && (
                    <AddTagButton
                        availableTags={availableTags}
                        assignedTagIds={tags.map(t => t.id)}
                        onAddTag={onAddTag}
                    />
                )}
            </Box>
        );
    }

    // Multiple tags - show first + "+N" indicator
    const visibleTags = tags.slice(0, maxVisible);
    const hiddenCount = tags.length - maxVisible;
    const unassignedTags = availableTags?.filter(t => !tags.some(at => at.id === t.id)) || [];

    return (
        <>
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    flexWrap: 'nowrap',
                    cursor: 'pointer',
                }}
                onClick={handleClick}
            >
                {visibleTags.map(tag => (
                    <TagChip key={tag.id} tag={tag} compact />
                ))}
                {hiddenCount > 0 && (
                    <Tooltip title={`+${hiddenCount} more tags (click to expand)`}>
                        <Chip
                            label={`+${hiddenCount}`}
                            size="small"
                            variant="outlined"
                            sx={{
                                height: 20,
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                '&:hover': {
                                    backgroundColor: 'action.hover',
                                },
                            }}
                        />
                    </Tooltip>
                )}
                {!disabled && onAddTag && availableTags && unassignedTags.length > 0 && (
                    <AddTagButton
                        availableTags={availableTags}
                        assignedTagIds={tags.map(t => t.id)}
                        onAddTag={onAddTag}
                        compact
                    />
                )}
            </Box>

            {/* Popover for all tags */}
            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                onClick={(e) => e.stopPropagation()}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
                slotProps={{
                    paper: {
                        sx: { p: 1.5, minWidth: 200, maxWidth: 300 }
                    }
                }}
            >
                <Typography variant="caption" fontWeight="bold" sx={{ mb: 1, display: 'block' }}>
                    Tags ({tags.length})
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {tags.map(tag => (
                        <TagChip
                            key={tag.id}
                            tag={tag}
                            onRemove={!disabled && onRemoveTag ? () => { onRemoveTag(tag.id); } : undefined}
                        />
                    ))}
                </Box>

                {/* Add tag section in popover */}
                {!disabled && onAddTag && unassignedTags.length > 0 && (
                    <>
                        <Divider sx={{ my: 1 }} />
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                            Add tag:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {unassignedTags.slice(0, 5).map(tag => (
                                <Chip
                                    key={tag.id}
                                    label={tag.name}
                                    size="small"
                                    variant="outlined"
                                    onClick={() => {
                                        onAddTag(tag.id);
                                    }}
                                    sx={{
                                        height: 20,
                                        fontSize: '0.7rem',
                                        cursor: 'pointer',
                                        borderColor: tag.color || '#888',
                                        color: tag.color || '#888',
                                        '&:hover': {
                                            backgroundColor: `${tag.color || '#888'}20`,
                                        },
                                    }}
                                />
                            ))}
                            {unassignedTags.length > 5 && (
                                <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
                                    +{unassignedTags.length - 5} more
                                </Typography>
                            )}
                        </Box>
                    </>
                )}
            </Popover>
        </>
    );
};

/**
 * Individual tag chip component
 */
interface TagChipProps {
    tag: TagItem;
    onRemove?: () => void;
    compact?: boolean;
}

const TagChip: React.FC<TagChipProps> = ({ tag, onRemove, compact }) => {
    return (
        <Tooltip
            title={
                <Box>
                    <Typography variant="caption" fontWeight="bold">{tag.name}</Typography>
                    {tag.description && (
                        <Typography variant="caption" display="block">{tag.description}</Typography>
                    )}
                </Box>
            }
            arrow
        >
            <Chip
                label={tag.name}
                size="small"
                onDelete={onRemove}
                deleteIcon={<CloseIcon style={{ fontSize: 12 }} />}
                sx={{
                    height: 20,
                    fontSize: '0.7rem',
                    backgroundColor: tag.color || '#888',
                    color: '#fff',
                    fontWeight: 600,
                    maxWidth: compact ? 80 : undefined,
                    '& .MuiChip-label': {
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    },
                    '& .MuiChip-deleteIcon': {
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontSize: '12px',
                        '&:hover': {
                            color: '#fff',
                        },
                    },
                }}
            />
        </Tooltip>
    );
};

/**
 * Add tag button with menu
 */
interface AddTagButtonProps {
    availableTags: TagItem[];
    assignedTagIds: string[];
    onAddTag: (tagId: string) => void;
    compact?: boolean;
}

const AddTagButton: React.FC<AddTagButtonProps> = ({
    availableTags,
    assignedTagIds,
    onAddTag,
    compact,
}) => {
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

    const unassignedTags = availableTags.filter(t => !assignedTagIds.includes(t.id));

    if (unassignedTags.length === 0) {
        return null;
    }

    return (
        <>
            <IconButton
                size="small"
                onClick={(e) => {
                    e.stopPropagation();
                    setAnchorEl(e.currentTarget);
                }}
                sx={{
                    padding: 0.25,
                    opacity: compact ? 0 : 0.5,
                    transition: 'opacity 0.2s',
                    '.MuiTableRow-root:hover &': { opacity: 1 },
                    '&:hover': { opacity: 1 },
                }}
            >
                <Add sx={{ fontSize: '0.9rem' }} />
            </IconButton>
            <Popover
                open={Boolean(anchorEl)}
                anchorEl={anchorEl}
                onClose={() => setAnchorEl(null)}
                onClick={(e) => e.stopPropagation()}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            >
                <Box sx={{ p: 1, minWidth: 150 }}>
                    <Typography variant="caption" fontWeight="bold" sx={{ mb: 0.5, display: 'block' }}>
                        Add tag
                    </Typography>
                    {unassignedTags.map(tag => (
                        <MenuItem
                            key={tag.id}
                            onClick={() => {
                                onAddTag(tag.id);
                                setAnchorEl(null);
                            }}
                            sx={{ fontSize: '0.8rem', py: 0.5, minHeight: 'auto' }}
                        >
                            <ListItemIcon sx={{ minWidth: 24 }}>
                                <Box
                                    sx={{
                                        width: 12,
                                        height: 12,
                                        borderRadius: '50%',
                                        backgroundColor: tag.color || '#888',
                                    }}
                                />
                            </ListItemIcon>
                            <ListItemText primary={tag.name} primaryTypographyProps={{ fontSize: '0.8rem' }} />
                        </MenuItem>
                    ))}
                </Box>
            </Popover>
        </>
    );
};

export default TagsDropdown;

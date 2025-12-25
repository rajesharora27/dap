import React, { useState } from 'react';
import {
    Button,
    Menu,
    MenuItem,
    Checkbox,
    ListItemText,
    Box
} from '@mui/material';
import { TableChart } from '@shared/components/FAIcon';

// Column configuration for task tables
export interface ColumnConfig {
    key: string;
    label: string;
    alwaysVisible: boolean;
}

// Default task columns configuration
export const TASK_COLUMNS: ColumnConfig[] = [
    { key: 'tags', label: 'Tags', alwaysVisible: false },
    { key: 'resources', label: 'Resources', alwaysVisible: false },
    { key: 'implPercent', label: 'Impl %', alwaysVisible: false },
    { key: 'validationCriteria', label: 'Validation Criteria', alwaysVisible: false },
];

// Default visible columns (all visible by default)
export const DEFAULT_VISIBLE_COLUMNS = TASK_COLUMNS.map(c => c.key);

interface ColumnVisibilityToggleProps {
    visibleColumns: string[];
    onToggleColumn: (columnKey: string) => void;
    columns?: ColumnConfig[];
}

export function ColumnVisibilityToggle({
    visibleColumns,
    onToggleColumn,
    columns = TASK_COLUMNS
}: ColumnVisibilityToggleProps) {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const hideableColumns = columns.filter(c => !c.alwaysVisible);

    return (
        <Box sx={{ display: 'inline-flex' }}>
            <Button
                size="small"
                variant="outlined"
                onClick={handleClick}
                startIcon={<TableChart fontSize="small" />}
                sx={{
                    textTransform: 'none',
                    fontSize: '0.8rem',
                    py: 0.5,
                    px: 1.5,
                    borderColor: 'divider',
                    color: 'text.secondary',
                    '&:hover': {
                        borderColor: 'primary.main',
                        color: 'primary.main'
                    }
                }}
            >
                Columns
            </Button>
            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
            >
                {hideableColumns.map((col) => (
                    <MenuItem
                        key={col.key}
                        onClick={() => onToggleColumn(col.key)}
                        dense
                        sx={{ py: 0.5 }}
                    >
                        <Checkbox
                            checked={visibleColumns.includes(col.key)}
                            size="small"
                            sx={{ p: 0.5, mr: 1 }}
                        />
                        <ListItemText
                            primary={col.label}
                            primaryTypographyProps={{ fontSize: '0.875rem' }}
                        />
                    </MenuItem>
                ))}
            </Menu>
        </Box>
    );
}

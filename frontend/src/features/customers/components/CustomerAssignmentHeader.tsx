import * as React from 'react';
import {
    Box,
    Paper,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Divider,
    Stack,
    Tooltip,
    IconButton,
    Typography
} from '@mui/material';
import { Add } from '@shared/components/FAIcon';

interface AssignmentHeaderItem {
    id: string;
    label: React.ReactNode;
}

interface AssignmentHeaderAction {
    id: string;
    label: string;
    icon: React.ReactElement;
    onClick: () => void;
    color?: "inherit" | "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning";
    disabled?: boolean;
    tooltip?: string;
}

interface CustomerAssignmentHeaderProps {
    selectedId: string | null;
    onSelect: (id: string) => void;
    items: AssignmentHeaderItem[];
    onAssignNew: () => void;
    assignNewLabel: string;
    actions?: AssignmentHeaderAction[];
    selectLabel?: string;
    emptyMessage?: React.ReactNode;
    themeColor?: string;
}

export const CustomerAssignmentHeader: React.FC<CustomerAssignmentHeaderProps> = ({
    selectedId,
    onSelect,
    items,
    onAssignNew,
    assignNewLabel,
    actions = [],
    selectLabel = "Select Deployment",
    emptyMessage,
    themeColor
}) => {
    return (
        <Paper
            elevation={0}
            sx={{
                p: { xs: 1.5, sm: 2, md: 2.5 },
                mb: 3,
                bgcolor: 'background.paper',
                borderRadius: 2,
                border: '1.5px solid #E0E0E0'
            }}
        >
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                <FormControl sx={{ minWidth: 300, flexGrow: { xs: 1, sm: 0 } }} size="small">
                    <InputLabel>{selectLabel}</InputLabel>
                    <Select
                        value={selectedId || ''}
                        onChange={(e) => {
                            if (e.target.value === '__NEW__') onAssignNew();
                            else onSelect(e.target.value);
                        }}
                        label={selectLabel}
                    >
                        {items.map((item) => (
                            <MenuItem key={item.id} value={item.id}>
                                {item.label}
                            </MenuItem>
                        ))}
                        <Divider />
                        <MenuItem value="__NEW__" sx={{ color: themeColor || 'primary.main', fontWeight: 600 }}>
                            <Add fontSize="small" sx={{ mr: 1, color: themeColor }} /> {assignNewLabel}
                        </MenuItem>
                    </Select>
                </FormControl>

                {selectedId && actions.length > 0 && (
                    <Stack direction="row" spacing={1}>
                        {actions.map((action) => (
                            <Tooltip key={action.id} title={action.tooltip || action.label}>
                                <span>
                                    <IconButton
                                        size="small"
                                        onClick={action.onClick}
                                        color={action.color || "primary"}
                                        disabled={action.disabled}
                                    >
                                        {React.cloneElement(action.icon, { fontSize: 'small' })}
                                    </IconButton>
                                </span>
                            </Tooltip>
                        ))}
                    </Stack>
                )}
            </Box>

            {items.length === 0 && emptyMessage && (
                <Box sx={{ mt: 2 }}>
                    {emptyMessage}
                </Box>
            )}
        </Paper>
    );
};

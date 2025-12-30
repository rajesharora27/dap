import React from 'react';
import { Box } from '@mui/material';
import { Lock, DragIndicator } from './FAIcon';

interface SortableHandleProps {
    attributes?: any;
    listeners?: any;
    index: number;
    locked?: boolean;
    disableDrag?: boolean;
    showNumber?: boolean; // When false, shows drag icon instead of number
}

export const SortableHandle: React.FC<SortableHandleProps> = ({
    attributes,
    listeners,
    index,
    locked,
    disableDrag,
    showNumber = true
}) => {
    const isDisabled = locked || disableDrag;

    return (
        <Box
            className="drag-handle"
            sx={{
                opacity: isDisabled ? 0.3 : 0.5,
                cursor: isDisabled ? 'default' : 'grab',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'text.secondary',
                userSelect: 'none',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                transition: 'opacity 0.2s',
                '&:hover': {
                    opacity: isDisabled ? 0.3 : 1
                }
            }}
            {...(isDisabled ? {} : attributes)}
            {...(isDisabled ? {} : listeners)}
        >
            {locked ? (
                <Lock sx={{ fontSize: '0.9rem', opacity: 0.5 }} />
            ) : showNumber ? (
                index + 1
            ) : (
                <DragIndicator sx={{ fontSize: '1rem' }} />
            )}
        </Box>
    );
};

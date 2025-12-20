/**
 * SuggestionChips Component
 * 
 * Displays clickable suggestion chips for AI follow-up questions.
 * 
 * @version 1.0.0
 * @created 2025-12-06
 */

import React from 'react';
import {
    Box,
    Chip,
    Typography,
    useTheme,
    alpha,
} from '@mui/material';
import { Lightbulb, AutoAwesome } from '../../components/common/FAIcon';

export interface SuggestionChipsProps {
    /** List of suggestion strings */
    suggestions: string[];
    /** Callback when a suggestion is clicked */
    onSuggestionClick: (suggestion: string) => void;
    /** Optional title (default: "Try asking:") */
    title?: string;
    /** Show icon before title */
    showIcon?: boolean;
    /** Compact mode (smaller chips) */
    compact?: boolean;
    /** Maximum suggestions to show */
    maxSuggestions?: number;
    /** Variant style */
    variant?: 'default' | 'outlined' | 'filled';
}

export const SuggestionChips: React.FC<SuggestionChipsProps> = ({
    suggestions,
    onSuggestionClick,
    title = 'Try asking:',
    showIcon = true,
    compact = false,
    maxSuggestions = 5,
    variant = 'default',
}) => {
    const theme = useTheme();

    if (!suggestions || suggestions.length === 0) {
        return null;
    }

    const displayedSuggestions = suggestions.slice(0, maxSuggestions);

    const getChipStyles = () => {
        switch (variant) {
            case 'outlined':
                return {
                    borderColor: alpha(theme.palette.primary.main, 0.3),
                    bgcolor: 'transparent',
                    '&:hover': {
                        borderColor: theme.palette.primary.main,
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                    },
                };
            case 'filled':
                return {
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.2),
                    },
                };
            default:
                return {
                    bgcolor: alpha(theme.palette.grey[500], 0.1),
                    '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.15),
                        color: theme.palette.primary.main,
                    },
                };
        }
    };

    return (
        <Box>
            {title && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                    {showIcon && (
                        <Lightbulb
                            sx={{
                                fontSize: compact ? 14 : 16,
                                color: 'warning.main',
                            }}
                        />
                    )}
                    <Typography
                        variant={compact ? 'caption' : 'body2'}
                        color="text.secondary"
                    >
                        {title}
                    </Typography>
                </Box>
            )}

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                {displayedSuggestions.map((suggestion, index) => (
                    <Chip
                        key={index}
                        label={suggestion}
                        size={compact ? 'small' : 'medium'}
                        variant={variant === 'outlined' ? 'outlined' : 'filled'}
                        onClick={() => onSuggestionClick(suggestion)}
                        sx={{
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            fontWeight: 400,
                            ...getChipStyles(),
                        }}
                    />
                ))}

                {suggestions.length > maxSuggestions && (
                    <Chip
                        label={`+${suggestions.length - maxSuggestions} more`}
                        size={compact ? 'small' : 'medium'}
                        variant="outlined"
                        sx={{
                            fontStyle: 'italic',
                            opacity: 0.7,
                        }}
                    />
                )}
            </Box>
        </Box>
    );
};

export default SuggestionChips;

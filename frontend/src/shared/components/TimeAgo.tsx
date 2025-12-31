import React, { useState, useEffect } from 'react';
import { Typography, TypographyProps } from '@mui/material';

interface TimeAgoProps extends TypographyProps {
    date?: string | Date | null;
    refreshInterval?: number; // ms, default 60000 (1 min)
}

export const TimeAgo: React.FC<TimeAgoProps> = ({
    date,
    refreshInterval = 60000,
    ...typographyProps
}) => {
    const [timeString, setTimeString] = useState<string>('Never');

    useEffect(() => {
        if (!date) {
            setTimeString('Never');
            return;
        }

        const updateTime = () => {
            try {
                const dateObj = typeof date === 'string' ? new Date(date) : date;
                const diff = Date.now() - dateObj.getTime();

                // Allow for small clock drift (future dates < 1 min show "Just now")
                if (diff < 0 && diff > -60000) {
                    setTimeString('Just now');
                    return;
                }

                if (diff < 0) {
                    // Future date detection
                    setTimeString(dateObj.toLocaleDateString());
                    return;
                }

                const mins = Math.floor(diff / 60000);
                const hrs = Math.floor(mins / 60);
                const days = Math.floor(hrs / 24);

                if (days > 0) setTimeString(`${days}d ago`);
                else if (hrs > 0) setTimeString(`${hrs}h ago`);
                else if (mins > 0) setTimeString(`${mins}m ago`);
                else setTimeString('Just now');
            } catch (e) {
                setTimeString('Invalid date');
            }
        };

        updateTime();
        const interval = setInterval(updateTime, refreshInterval);

        return () => clearInterval(interval);
    }, [date, refreshInterval]);

    return (
        <Typography variant="body2" {...typographyProps}>
            {timeString}
        </Typography>
    );
};

import React, { useState, useEffect } from 'react';
import { Typography, TypographyProps, Tooltip } from '@mui/material';

interface TimeAgoProps extends TypographyProps {
    date?: string | Date | null;
    refreshInterval?: number; // ms, default 60000 (1 min)
}

export const TimeAgo: React.FC<TimeAgoProps> = ({
    date,
    refreshInterval = 5000, // Update every 5s for smoother feedback
    ...typographyProps
}) => {
    const [timeString, setTimeString] = useState<string>('Never');
    const [fullDate, setFullDate] = useState<string>('');

    useEffect(() => {
        if (!date) {
            setTimeString('Never');
            return;
        }

        let dateObj: Date;
        try {
            // Handle string timestamp (if API returns "170000..." string)
            if (typeof date === 'string' && !isNaN(Number(date)) && !date.includes('-')) {
                dateObj = new Date(Number(date));
            } else {
                dateObj = typeof date === 'string' ? new Date(date) : date;
            }
        } catch (e) {
            setTimeString('Date Error');
            setFullDate(`Error parsing: ${date}`);
            return;
        }

        if (isNaN(dateObj.getTime())) {
            setTimeString('Invalid Date');
            setFullDate(`Raw value: ${JSON.stringify(date)} (Type: ${typeof date})`);
            return;
        }

        setFullDate(dateObj.toLocaleString());

        const updateTime = () => {
            try {
                const now = Date.now();
                const diff = now - dateObj.getTime();

                // Allow for small clock drift
                if (diff < 0 && diff > -60000) {
                    setTimeString('Just now');
                    return;
                }

                if (diff < 0) {
                    setTimeString(dateObj.toLocaleDateString());
                    return;
                }

                const secs = Math.floor(diff / 1000);
                const mins = Math.floor(secs / 60);
                const hrs = Math.floor(mins / 60);
                const days = Math.floor(hrs / 24);

                if (days > 0) setTimeString(`${days}d ago`);
                else if (hrs > 0) setTimeString(`${hrs}h ago`);
                else if (mins > 0) setTimeString(`${mins}m ago`);
                else setTimeString(`${secs}s ago`);
            } catch (e) {
                setTimeString('Calc Error');
            }
        };

        updateTime();
        const interval = setInterval(updateTime, refreshInterval);

        return () => clearInterval(interval);
    }, [date, refreshInterval]);

    return (
        <Tooltip title={fullDate} arrow>
            <Typography variant="body2" {...typographyProps} sx={{ cursor: 'help', ...typographyProps.sx }}>
                {timeString}
            </Typography>
        </Tooltip>
    );
};

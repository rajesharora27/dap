/**
 * Shared utility for progress-related calculations and styling
 */

/**
 * Returns a color based on completion percentage
 * - < 33%: Red
 * - 33% - 66%: Amber
 * - > 66%: Green
 * 
 * @param percentage Completion percentage (0-100)
 * @returns Hex color string
 */
export const getProgressColor = (percentage: number): string => {
    if (percentage < 33) {
        return '#EF4444'; // Red
    } else if (percentage < 66) {
        return '#F59E0B'; // Amber
    } else {
        return '#10B981'; // Green
    }
};

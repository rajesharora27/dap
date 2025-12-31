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
    if (percentage < 10) return '#EF4444';      // 0-10%: Red 500 (Critical)
    if (percentage < 20) return '#F97316';      // 10-20%: Orange 500
    if (percentage < 30) return '#F59E0B';      // 20-30%: Amber 500
    if (percentage < 40) return '#EAB308';      // 30-40%: Yellow 500
    if (percentage < 50) return '#84CC16';      // 40-50%: Lime 500 (Good)
    if (percentage < 60) return '#22C55E';      // 50-60%: Green 500
    if (percentage < 70) return '#10B981';      // 60-70%: Emerald 500
    if (percentage < 80) return '#14B8A6';      // 70-80%: Teal 500
    return '#059669';                           // 80%+: Emerald 600 (Excellent)
};

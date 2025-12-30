import * as React from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    Chip,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    OutlinedInput,
    Checkbox,
    ListItemText,
    Alert
} from '@mui/material';
import { FilterList } from '@shared/components/FAIcon';
import { ColumnVisibilityToggle } from '@shared/components/ColumnVisibilityToggle';

const ALL_RELEASES_ID = '__ALL_RELEASES__';
const ALL_OUTCOMES_ID = '__ALL_OUTCOMES__';
const ALL_TAGS_ID = '__ALL_TAGS__';

interface AdoptionPlanFilterSectionProps {
    filterTags: string[];
    setFilterTags: (tags: string[]) => void;
    availableTags: any[];
    filterOutcomes: string[];
    setFilterOutcomes: (outcomes: string[]) => void;
    availableOutcomes: any[];
    filterReleases: string[];
    setFilterReleases: (releases: string[]) => void;
    availableReleases: any[];
    visibleColumns: string[];
    onToggleColumn: (key: string) => void;
    columns: any[];
    totalFilteredTasks: number;
    totalTasks: number;
    title?: string;
}

export const AdoptionPlanFilterSection: React.FC<AdoptionPlanFilterSectionProps> = ({
    filterTags,
    setFilterTags,
    availableTags,
    filterOutcomes,
    setFilterOutcomes,
    availableOutcomes,
    filterReleases,
    setFilterReleases,
    availableReleases,
    visibleColumns,
    onToggleColumn,
    columns,
    totalFilteredTasks,
    totalTasks,
    title = 'Filter Tasks'
}) => {
    const hasActiveFilters = (filterReleases.length > 0 && !filterReleases.includes(ALL_RELEASES_ID)) ||
        (filterOutcomes.length > 0 && !filterOutcomes.includes(ALL_OUTCOMES_ID)) ||
        (filterTags.length > 0 && !filterTags.includes(ALL_TAGS_ID));

    const handleClearFilters = () => {
        setFilterReleases([]);
        setFilterOutcomes([]);
        setFilterTags([]);
    };

    return (
        <Paper
            elevation={0}
            sx={{
                p: 2,
                mb: 0,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '8px 8px 0 0',
                borderBottom: 'none'
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <FilterList fontSize="small" sx={{ color: 'text.secondary' }} />
                <Typography variant="subtitle2" fontWeight="600" color="text.secondary">
                    {title}
                </Typography>
                {hasActiveFilters && (
                    <Chip
                        label={`Showing ${totalFilteredTasks} of ${totalTasks} tasks`}
                        size="small"
                        color="primary"
                        sx={{ ml: 1, fontWeight: 600 }}
                    />
                )}
            </Box>

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {/* Tags Filter */}
                <FormControl sx={{ minWidth: 200 }} size="small">
                    <InputLabel>Tags</InputLabel>
                    <Select
                        multiple
                        value={filterTags}
                        onChange={(e) => {
                            const value = typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value;
                            if (value.includes(ALL_TAGS_ID)) {
                                setFilterTags(filterTags.includes(ALL_TAGS_ID) ? [] : [ALL_TAGS_ID]);
                            } else {
                                setFilterTags(value);
                            }
                        }}
                        input={<OutlinedInput label="Tags" />}
                        renderValue={(selected) => {
                            if (selected.includes(ALL_TAGS_ID)) return 'All Tags';
                            if (selected.length === 0) return 'All Tags';
                            return (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {selected.map((value) => {
                                        const tag = availableTags.find((t: any) => t.id === value);
                                        return (
                                            <Chip
                                                key={value}
                                                label={tag?.name || 'Unknown'}
                                                size="small"
                                                sx={{
                                                    bgcolor: tag?.color,
                                                    color: '#fff',
                                                    height: 20,
                                                    '& .MuiChip-label': { px: 1, fontSize: '0.75rem', fontWeight: 600 }
                                                }}
                                            />
                                        );
                                    })}
                                </Box>
                            );
                        }}
                    >
                        {availableTags.length > 0 && (
                            <MenuItem value={ALL_TAGS_ID}>
                                <Checkbox checked={filterTags.includes(ALL_TAGS_ID) || filterTags.length === 0} />
                                <ListItemText primary="All Tags" />
                            </MenuItem>
                        )}
                        {availableTags.map((tag: any) => (
                            <MenuItem key={tag.id} value={tag.id}>
                                <Checkbox checked={filterTags.indexOf(tag.id) > -1} disabled={filterTags.includes(ALL_TAGS_ID)} />
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: tag.color }} />
                                    <ListItemText primary={tag.name} />
                                </Box>
                            </MenuItem>
                        ))}
                        {availableTags.length === 0 && <MenuItem disabled>No tags available</MenuItem>}
                    </Select>
                </FormControl>

                {/* Outcomes Filter */}
                <FormControl sx={{ minWidth: 200 }} size="small">
                    <InputLabel>Outcomes</InputLabel>
                    <Select
                        multiple
                        value={filterOutcomes}
                        onChange={(e) => {
                            const value = typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value;
                            if (value.includes(ALL_OUTCOMES_ID)) {
                                setFilterOutcomes(filterOutcomes.includes(ALL_OUTCOMES_ID) ? [] : [ALL_OUTCOMES_ID]);
                            } else {
                                setFilterOutcomes(value);
                            }
                        }}
                        input={<OutlinedInput label="Outcomes" />}
                        renderValue={(selected) => {
                            if (selected.includes(ALL_OUTCOMES_ID)) return 'All Outcomes';
                            if (selected.length === 0) return 'All Outcomes';
                            return `${selected.length} Selected`;
                        }}
                    >
                        {availableOutcomes.length > 0 && (
                            <MenuItem value={ALL_OUTCOMES_ID}>
                                <Checkbox checked={filterOutcomes.includes(ALL_OUTCOMES_ID) || filterOutcomes.length === 0} />
                                <ListItemText primary="All Outcomes" />
                            </MenuItem>
                        )}
                        {availableOutcomes.map((o: any) => (
                            <MenuItem key={o.id} value={o.id}>
                                <Checkbox checked={filterOutcomes.indexOf(o.id) > -1} disabled={filterOutcomes.includes(ALL_OUTCOMES_ID)} />
                                <ListItemText primary={o.name} />
                            </MenuItem>
                        ))}
                        {availableOutcomes.length === 0 && <MenuItem disabled>No outcomes available</MenuItem>}
                    </Select>
                </FormControl>

                {/* Releases Filter */}
                <FormControl sx={{ minWidth: 200 }} size="small">
                    <InputLabel>Releases</InputLabel>
                    <Select
                        multiple
                        value={filterReleases}
                        onChange={(e) => {
                            const value = typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value;
                            if (value.includes(ALL_RELEASES_ID)) {
                                setFilterReleases(filterReleases.includes(ALL_RELEASES_ID) ? [] : [ALL_RELEASES_ID]);
                            } else {
                                setFilterReleases(value);
                            }
                        }}
                        input={<OutlinedInput label="Releases" />}
                        renderValue={(selected) => {
                            if (selected.includes(ALL_RELEASES_ID)) return 'All Releases';
                            if (selected.length === 0) return 'All Releases';
                            return `${selected.length} Selected`;
                        }}
                    >
                        {availableReleases.length > 0 && (
                            <MenuItem value={ALL_RELEASES_ID}>
                                <Checkbox checked={filterReleases.includes(ALL_RELEASES_ID) || filterReleases.length === 0} />
                                <ListItemText primary="All Releases" />
                            </MenuItem>
                        )}
                        {availableReleases.map((r: any) => (
                            <MenuItem key={r.id} value={r.id}>
                                <Checkbox checked={filterReleases.indexOf(r.id) > -1} disabled={filterReleases.includes(ALL_RELEASES_ID)} />
                                <ListItemText primary={`${r.name}${r.level ? ` (v${r.level})` : ''}`} />
                            </MenuItem>
                        ))}
                        {availableReleases.length === 0 && <MenuItem disabled>No releases available</MenuItem>}
                    </Select>
                </FormControl>

                {/* Clear Filters */}
                {hasActiveFilters && (
                    <Button size="small" onClick={handleClearFilters}>
                        Clear Filters
                    </Button>
                )}

                {/* Column Toggle */}
                <ColumnVisibilityToggle
                    visibleColumns={visibleColumns}
                    onToggleColumn={onToggleColumn}
                    columns={columns}
                />
            </Box>
        </Paper>
    );
};

/**
 * Product Adoption Group Component
 * Displays a product with its adoption tasks using the shared AdoptionTaskTable
 * Includes filtering by outcomes, releases, and tags
 */
import * as React from 'react';
import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Collapse,
  IconButton,
  LinearProgress,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Checkbox,
  ListItemText,
  Chip,
  Button,
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  Download,
  Upload,
  FilterList,
  Clear,
} from '@shared/components/FAIcon';
import { AdoptionTaskTable, TaskData } from '../shared/AdoptionTaskTable';
import { adoptionPlanColors } from '../../utils/tabStyles';

const ALL_RELEASES_ID = '__ALL_RELEASES__';
const ALL_OUTCOMES_ID = '__ALL_OUTCOMES__';
const ALL_TAGS_ID = '__ALL_TAGS__';

interface ProductAdoptionGroupProps {
  product: {
    productId: string;
    productName: string;
    status: string;
    progressPercentage: number;
    totalTasks: number;
    completedTasks: number;
    productAdoptionPlanId?: string;
  };
  tasks: Array<{
    id: string;
    name: string;
    description?: string;
    notes?: string;
    status: string;
    weight: number;
    sequenceNumber: number;
    statusUpdatedAt?: string;
    statusUpdatedBy?: string;
    statusUpdateSource?: string;
    statusNotes?: string;
    licenseLevel?: string;
    howToDoc?: string[];
    howToVideo?: string[];
    releases?: Array<{ id: string; name: string; version?: string; level?: string }>;
    outcomes?: Array<{ id: string; name: string }>;
    tags?: Array<{ id: string; name: string; color?: string }>;
    telemetryAttributes?: Array<{
      id: string;
      name: string;
      description?: string;
      dataType: string;
      successCriteria?: string;
      isMet?: boolean;
      values?: Array<{
        id: string;
        value: any;
        criteriaMet?: boolean;
        createdAt?: string;
        notes?: string;
      }>;
    }>;
  }>;
  onUpdateTaskStatus?: (taskId: string, newStatus: string, notes?: string) => void;
  onViewProductPlan?: (productAdoptionPlanId: string) => void;
  onExportTelemetry?: (adoptionPlanId: string) => void;
  onImportTelemetry?: (adoptionPlanId: string, file: File) => void;
  filterInfo?: string;
}

export const ProductAdoptionGroup: React.FC<ProductAdoptionGroupProps> = ({
  product,
  tasks,
  onUpdateTaskStatus,
  onExportTelemetry,
  onImportTelemetry,
  filterInfo,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterReleases, setFilterReleases] = useState<string[]>([]);
  const [filterOutcomes, setFilterOutcomes] = useState<string[]>([]);
  const [filterTags, setFilterTags] = useState<string[]>([]);

  const colors = adoptionPlanColors.product;

  // Extract available filter options from tasks
  const availableReleases = useMemo(() => {
    const releaseMap = new Map<string, { id: string; name: string }>();
    tasks.forEach(task => {
      task.releases?.forEach(release => {
        if (!releaseMap.has(release.id)) {
          releaseMap.set(release.id, release);
        }
      });
    });
    return Array.from(releaseMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [tasks]);

  const availableOutcomes = useMemo(() => {
    const outcomeMap = new Map<string, { id: string; name: string }>();
    tasks.forEach(task => {
      task.outcomes?.forEach(outcome => {
        if (!outcomeMap.has(outcome.id)) {
          outcomeMap.set(outcome.id, outcome);
        }
      });
    });
    return Array.from(outcomeMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [tasks]);

  const availableTags = useMemo(() => {
    const tagMap = new Map<string, { id: string; name: string; color?: string }>();
    tasks.forEach(task => {
      task.tags?.forEach(tag => {
        if (tag && !tagMap.has(tag.id)) {
          tagMap.set(tag.id, tag);
        }
      });
    });
    return Array.from(tagMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [tasks]);

  // Filter tasks based on selected filters
  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    // Filter by releases
    if (filterReleases.length > 0 && !filterReleases.includes(ALL_RELEASES_ID)) {
      result = result.filter(task =>
        task.releases?.some(release => filterReleases.includes(release.id))
      );
    }

    // Filter by outcomes
    if (filterOutcomes.length > 0 && !filterOutcomes.includes(ALL_OUTCOMES_ID)) {
      result = result.filter(task =>
        task.outcomes?.some(outcome => filterOutcomes.includes(outcome.id))
      );
    }

    // Filter by tags
    if (filterTags.length > 0 && !filterTags.includes(ALL_TAGS_ID)) {
      result = result.filter(task =>
        task.tags?.some(tag => tag && filterTags.includes(tag.id))
      );
    }

    return result;
  }, [tasks, filterReleases, filterOutcomes, filterTags]);

  // Calculate status based on filtered tasks
  const applicableTasks = filteredTasks.filter(t => t.status !== 'NOT_APPLICABLE');
  const completedTasks = applicableTasks.filter(t => t.status === 'DONE' || t.status === 'COMPLETED').length;
  const progress = applicableTasks.length > 0 ? Math.round((completedTasks / applicableTasks.length) * 100) : 0;

  const hasActiveFilters = filterReleases.length > 0 || filterOutcomes.length > 0 || filterTags.length > 0;

  const clearFilters = () => {
    setFilterReleases([]);
    setFilterOutcomes([]);
    setFilterTags([]);
  };

  // Map tasks to TaskData format (include all fields for TaskDetailsDialog)
  const taskData: TaskData[] = filteredTasks.map(t => ({
    id: t.id,
    name: t.name,
    description: t.description,
    notes: t.notes,
    status: t.status,
    sequenceNumber: t.sequenceNumber,
    weight: t.weight,
    licenseLevel: t.licenseLevel,
    statusUpdatedAt: t.statusUpdatedAt,
    statusUpdatedBy: t.statusUpdatedBy,
    statusUpdateSource: t.statusUpdateSource,
    statusNotes: t.statusNotes,
    howToDoc: t.howToDoc,
    howToVideo: t.howToVideo,
    releases: t.releases,
    outcomes: t.outcomes,
    telemetryAttributes: t.telemetryAttributes,
  }));

  return (
    <Paper
      elevation={1}
      sx={{
        mb: 2,
        border: '1.5px solid',
        borderColor: '#E0E0E0',
        borderRadius: 2,
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: colors.bgColor,
          cursor: 'pointer',
          borderLeft: '4px solid',
          borderLeftColor: colors.borderColor,
          transition: 'all 0.2s ease',
          '&:hover': {
            filter: 'brightness(0.97)',
          }
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
          <IconButton size="small" sx={{ color: colors.titleColor }}>
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>

          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Typography variant="h6" sx={{ color: colors.titleColor, fontWeight: 600 }}>
                {product.productName}
              </Typography>

              {/* Progress bar with stats */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, maxWidth: 300 }}>
                <LinearProgress
                  variant="determinate"
                  value={progress}
                  sx={{
                    flex: 1,
                    height: 8,
                    borderRadius: 4,
                    bgcolor: 'rgba(0,0,0,0.1)',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: colors.titleColor,
                      borderRadius: 4,
                    }
                  }}
                />
                <Typography variant="body2" sx={{ color: colors.titleColor, fontWeight: 600, minWidth: 40 }}>
                  {progress}%
                </Typography>
              </Box>

              <Typography variant="body2" sx={{ color: colors.titleColor, opacity: 0.8 }}>
                {completedTasks} of {applicableTasks.length} tasks
                {hasActiveFilters && ` (filtered from ${tasks.length})`}
              </Typography>

              {/* Filter toggle button */}
              <Tooltip title={showFilters ? "Hide Filters" : "Show Filters"}>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowFilters(!showFilters);
                  }}
                  sx={{
                    color: hasActiveFilters ? colors.borderColor : colors.titleColor,
                    bgcolor: hasActiveFilters ? 'rgba(46, 125, 50, 0.1)' : 'transparent'
                  }}
                >
                  <FilterList fontSize="small" />
                </IconButton>
              </Tooltip>

              {/* Telemetry buttons */}
              {product.productAdoptionPlanId && (
                <Box sx={{ display: 'flex', gap: 0.5, ml: 'auto' }} onClick={(e) => e.stopPropagation()}>
                  <Tooltip title="Export Telemetry Template">
                    <IconButton
                      size="small"
                      onClick={() => onExportTelemetry?.(product.productAdoptionPlanId!)}
                      sx={{ color: colors.titleColor }}
                    >
                      <Download fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Import Telemetry">
                    <IconButton
                      size="small"
                      component="label"
                      sx={{ color: colors.titleColor }}
                    >
                      <Upload fontSize="small" />
                      <input
                        type="file"
                        hidden
                        accept=".xlsx,.xls"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file && product.productAdoptionPlanId) {
                            onImportTelemetry?.(product.productAdoptionPlanId, file);
                          }
                          e.target.value = '';
                        }}
                      />
                    </IconButton>
                  </Tooltip>
                </Box>
              )}
            </Box>
            {filterInfo && (
              <Typography variant="caption" sx={{ color: colors.titleColor, opacity: 0.7, mt: 0.5, display: 'block' }}>
                Filter: {filterInfo}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

      {/* Filter Section */}
      <Collapse in={showFilters}>
        <Box
          sx={{
            p: 2,
            bgcolor: 'grey.50',
            borderTop: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            gap: 2,
            flexWrap: 'wrap',
            alignItems: 'center'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Release Filter */}
          {availableReleases.length > 0 && (
            <FormControl sx={{ minWidth: 180 }} size="small">
              <InputLabel>Releases</InputLabel>
              <Select
                multiple
                value={filterReleases}
                onChange={(e) => {
                  const value = typeof e.target.value === 'string' ? [e.target.value] : e.target.value;
                  if (value.includes(ALL_RELEASES_ID)) {
                    setFilterReleases([]);
                  } else {
                    setFilterReleases(value);
                  }
                }}
                input={<OutlinedInput label="Releases" />}
                renderValue={(selected) => {
                  if (selected.length === 0) return 'All Releases';
                  const names = selected.map(id => availableReleases.find(r => r.id === id)?.name || '').filter(Boolean);
                  return names.join(', ');
                }}
              >
                <MenuItem value={ALL_RELEASES_ID}>
                  <Checkbox checked={filterReleases.length === 0} />
                  <ListItemText primary="All Releases" />
                </MenuItem>
                {availableReleases.map((release) => (
                  <MenuItem key={release.id} value={release.id}>
                    <Checkbox checked={filterReleases.includes(release.id)} />
                    <ListItemText primary={release.name} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {/* Outcome Filter */}
          {availableOutcomes.length > 0 && (
            <FormControl sx={{ minWidth: 180 }} size="small">
              <InputLabel>Outcomes</InputLabel>
              <Select
                multiple
                value={filterOutcomes}
                onChange={(e) => {
                  const value = typeof e.target.value === 'string' ? [e.target.value] : e.target.value;
                  if (value.includes(ALL_OUTCOMES_ID)) {
                    setFilterOutcomes([]);
                  } else {
                    setFilterOutcomes(value);
                  }
                }}
                input={<OutlinedInput label="Outcomes" />}
                renderValue={(selected) => {
                  if (selected.length === 0) return 'All Outcomes';
                  const names = selected.map(id => availableOutcomes.find(o => o.id === id)?.name || '').filter(Boolean);
                  return names.join(', ');
                }}
              >
                <MenuItem value={ALL_OUTCOMES_ID}>
                  <Checkbox checked={filterOutcomes.length === 0} />
                  <ListItemText primary="All Outcomes" />
                </MenuItem>
                {availableOutcomes.map((outcome) => (
                  <MenuItem key={outcome.id} value={outcome.id}>
                    <Checkbox checked={filterOutcomes.includes(outcome.id)} />
                    <ListItemText primary={outcome.name} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {/* Tag Filter */}
          {availableTags.length > 0 && (
            <FormControl sx={{ minWidth: 180 }} size="small">
              <InputLabel>Tags</InputLabel>
              <Select
                multiple
                value={filterTags}
                onChange={(e) => {
                  const value = typeof e.target.value === 'string' ? [e.target.value] : e.target.value;
                  if (value.includes(ALL_TAGS_ID)) {
                    setFilterTags([]);
                  } else {
                    setFilterTags(value);
                  }
                }}
                input={<OutlinedInput label="Tags" />}
                renderValue={(selected) => {
                  if (selected.length === 0) return 'All Tags';
                  return (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => {
                        const tag = availableTags.find(t => t.id === value);
                        return tag ? (
                          <Chip
                            key={value}
                            label={tag.name}
                            size="small"
                            sx={{
                              bgcolor: tag.color,
                              color: '#fff',
                              height: 20,
                              '& .MuiChip-label': { px: 1, fontSize: '0.75rem' }
                            }}
                          />
                        ) : null;
                      })}
                    </Box>
                  );
                }}
              >
                <MenuItem value={ALL_TAGS_ID}>
                  <Checkbox checked={filterTags.length === 0} />
                  <ListItemText primary="All Tags" />
                </MenuItem>
                {availableTags.map((tag) => (
                  <MenuItem key={tag.id} value={tag.id}>
                    <Checkbox checked={filterTags.includes(tag.id)} />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          bgcolor: tag.color
                        }}
                      />
                      <ListItemText primary={tag.name} />
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <Button
              size="small"
              startIcon={<Clear />}
              onClick={clearFilters}
              sx={{ color: 'text.secondary' }}
            >
              Clear Filters
            </Button>
          )}
        </Box>
      </Collapse>

      {/* Task Table */}
      <Collapse in={expanded}>
        <Box sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
          <AdoptionTaskTable
            tasks={taskData}
            onUpdateTaskStatus={onUpdateTaskStatus}
            title=""
            titleIcon=""
            titleColor={colors.titleColor}
            bgColor="transparent"
            borderColor="transparent"
            showHeader={false}
          />
        </Box>
      </Collapse>
    </Paper>
  );
};

/**
 * Solution Tasks Group Component
 * Displays solution-specific tasks using the shared AdoptionTaskTable
 */
import * as React from 'react';
import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Collapse,
  IconButton,
  Chip,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  Download,
  Upload,
} from '@shared/components/FAIcon';
import { AdoptionTaskTable, TaskData } from './AdoptionTaskTable';
import { adoptionPlanColors } from '@shared/theme/tabStyles';
import { getProgressColor } from '@shared/utils/progressUtils';

interface SolutionTasksGroupProps {
  progress: number;
  totalTasks: number;
  completedTasks: number;
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
    tags?: Array<{
      id: string;
      name: string;
      description?: string;
      color?: string;
    }>;
  }>;
  onUpdateTaskStatus?: (taskId: string, newStatus: string, notes?: string) => void;
  onExportTelemetry?: () => void;
  onImportTelemetry?: (file: File) => void;
  filterInfo?: string;
  visibleColumns?: string[];
}

export const SolutionTasksGroup: React.FC<SolutionTasksGroupProps> = ({
  progress,
  totalTasks,
  completedTasks,
  tasks,
  onUpdateTaskStatus,
  onExportTelemetry,
  onImportTelemetry,
  filterInfo,
  visibleColumns,
}) => {
  const [expanded, setExpanded] = useState(true);
  const colors = adoptionPlanColors.solution;

  // Map tasks to TaskData format (include all fields for TaskDetailsDialog)
  const taskData: TaskData[] = tasks.map(t => ({
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
    tags: t.tags,
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
          p: 2.5,
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
                Solution Tasks ({tasks.length})
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
                      bgcolor: getProgressColor(progress),
                      borderRadius: 4,
                    }
                  }}
                />
                <Typography variant="body2" sx={{ color: colors.titleColor, fontWeight: 600, minWidth: 40 }}>
                  {Math.round(progress)}%
                </Typography>
              </Box>

              <Typography variant="body2" sx={{ color: colors.titleColor, opacity: 0.8 }}>
                {completedTasks} of {totalTasks} tasks
              </Typography>

              {/* Telemetry buttons */}
              <Box sx={{ display: 'flex', gap: 0.5, ml: 'auto' }} onClick={(e) => e.stopPropagation()}>
                <Tooltip title="Export Telemetry Template">
                  <IconButton
                    size="small"
                    onClick={() => onExportTelemetry?.()}
                    sx={{ 
                      border: '1px solid #10B981', 
                      color: '#10B981',
                      '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.08)' }
                    }}
                  >
                    <Download fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Import Telemetry">
                  <IconButton
                    size="small"
                    component="label"
                    sx={{ 
                      border: '1px solid #10B981', 
                      color: '#10B981',
                      '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.08)' }
                    }}
                  >
                    <Upload fontSize="small" />
                    <input
                      type="file"
                      hidden
                      accept=".xlsx,.xls"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          onImportTelemetry?.(file);
                        }
                        e.target.value = '';
                      }}
                    />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            {filterInfo && (
              <Typography variant="caption" sx={{ color: colors.titleColor, opacity: 0.7, mt: 0.5, display: 'block' }}>
                Filter: {filterInfo}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

      {/* Task Table */}
      <Collapse in={expanded}>
        <Box sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
          <AdoptionTaskTable
            tasks={taskData}
            onUpdateTaskStatus={onUpdateTaskStatus}
            showHeader={false}
            visibleColumns={visibleColumns}
          />
        </Box>
      </Collapse>
    </Paper>
  );
};

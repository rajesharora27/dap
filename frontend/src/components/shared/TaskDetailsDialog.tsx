/**
 * Shared Task Details Dialog Component
 * Used consistently across Products and Solutions tabs
 */
import * as React from 'react';
import { useState } from 'react';
import {
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  Card,
  CardContent,
  Paper,
  Divider,
  Tabs,
  Tab,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  Article,
  OndemandVideo,
} from '../../components/common/FAIcon';
import { getStatusBackgroundColor, getStatusColor } from '../../utils/statusStyles';
import { formatSuccessCriteria } from '../../utils/criteriaFormatter';

export interface TaskDetailsData {
  id: string;
  name: string;
  description?: string;
  notes?: string;
  status: string;
  sequenceNumber: number;
  weight?: number | string;
  licenseLevel?: string;
  estMinutes?: number;
  priority?: string;
  statusUpdatedAt?: string;
  statusUpdatedBy?: string;
  statusUpdateSource?: string;
  statusNotes?: string;
  howToDoc?: string[];
  howToVideo?: string[];
  releases?: Array<{ id: string; name: string; version?: string }>;
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
    }>;
  }>;
  tags?: Array<{ id: string; name: string; color?: string; description?: string }>;
  solutionTags?: Array<{ id: string; name: string; color?: string; description?: string }>;
}

interface TaskDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  task: TaskDetailsData | null;
}

// Helper to get status chip color
const getStatusChipColor = (status: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
  switch (status) {
    case 'DONE':
    case 'COMPLETED':
      return 'success';
    case 'IN_PROGRESS':
      return 'info';
    case 'NOT_STARTED':
      return 'default';
    case 'NO_LONGER_USING':
    case 'BLOCKED':
      return 'error';
    default:
      return 'default';
  }
};

export const TaskDetailsDialog: React.FC<TaskDetailsDialogProps> = ({
  open,
  onClose,
  task,
}) => {
  const [activeTab, setActiveTab] = useState(0);

  // Reset tab when dialog closes
  const handleClose = () => {
    setActiveTab(0);
    onClose();
  };

  if (!task) return null;

  const hasTelemetry = task.telemetryAttributes && task.telemetryAttributes.length > 0;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        Adoption Plan - Task Details
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            {task.name}
          </Typography>

          {task.description && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Description
              </Typography>
              <Typography variant="body2">
                {task.description}
              </Typography>
            </Box>
          )}

          {/* Tabs for organizing content */}
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              mb: 2,
              minHeight: '40px',
              '& .MuiTab-root': {
                minHeight: '40px',
                py: 1
              }
            }}
          >
            <Tab label="Details" />
            <Tab label="Telemetry" disabled={!hasTelemetry} />
          </Tabs>

          {/* Tab 0: Details */}
          {activeTab === 0 && (
            <Box>
              {/* Overview Section - Key Metrics */}
              <Card variant="outlined" sx={{ mb: 3, bgcolor: 'grey.50' }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                    Overview
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 2 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                        Sequence
                      </Typography>
                      <Chip label={`#${task.sequenceNumber}`} size="small" color="primary" />
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                        Status
                      </Typography>
                      <Chip
                        label={task.status.replace(/_/g, ' ')}
                        color={getStatusChipColor(task.status)}
                        size="small"
                      />
                    </Box>

                    {task.weight !== undefined && (
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                          Weight
                        </Typography>
                        <Chip label={`${task.weight}%`} size="small" variant="outlined" />
                      </Box>
                    )}

                    {task.licenseLevel && (
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                          License Level
                        </Typography>
                        <Chip label={task.licenseLevel} size="small" color="secondary" />
                      </Box>
                    )}

                    {task.estMinutes && (
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                          Estimated Time
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {task.estMinutes} min
                        </Typography>
                      </Box>
                    )}

                    {task.priority && (
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                          Priority
                        </Typography>
                        <Chip label={task.priority} size="small" />
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>

              {/* Releases and Outcomes Section */}
              {((task.releases && task.releases.length > 0) ||
                (task.outcomes && task.outcomes.length > 0)) && (
                  <Card variant="outlined" sx={{ mb: 3 }}>
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                        Features & Outcomes
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {task.releases && task.releases.length > 0 && (
                          <Box>
                            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                              Associated Releases
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                              {task.releases.map((release) => (
                                <Chip
                                  key={release.id}
                                  label={`${release.name}${release.version ? ` ${release.version}` : ''}`}
                                  color="info"
                                  size="small"
                                  variant="outlined"
                                />
                              ))}
                            </Box>
                          </Box>
                        )}

                        {task.outcomes && task.outcomes.length > 0 && (
                          <Box>
                            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                              Expected Outcomes
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                              {task.outcomes.map((outcome) => (
                                <Chip
                                  key={outcome.id}
                                  label={outcome.name}
                                  color="success"
                                  size="small"
                                  variant="outlined"
                                />
                              ))}
                            </Box>
                          </Box>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                )}

              {/* Tags Section */}
              {((task.tags && task.tags.length > 0) ||
                (task.solutionTags && task.solutionTags.length > 0)) && (
                  <Card variant="outlined" sx={{ mb: 3 }}>
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                        Tags
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {task.tags && task.tags.map((tag) => (
                          <Tooltip key={tag.id} title={tag.description || tag.name} arrow>
                            <Chip
                              label={tag.name}
                              size="small"
                              sx={{
                                backgroundColor: tag.color || '#888',
                                color: '#fff',
                                fontWeight: 500
                              }}
                            />
                          </Tooltip>
                        ))}
                        {task.solutionTags && task.solutionTags.map((tag) => (
                          <Tooltip key={tag.id} title={tag.description || tag.name} arrow>
                            <Chip
                              label={tag.name}
                              size="small"
                              sx={{
                                backgroundColor: tag.color || '#888',
                                color: '#fff',
                                fontWeight: 500
                              }}
                            />
                          </Tooltip>
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                )}

              {/* Resources Section */}
              {((task.howToDoc && task.howToDoc.length > 0) ||
                (task.howToVideo && task.howToVideo.length > 0)) && (
                  <Card variant="outlined" sx={{ mb: 3 }}>
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                        Resources
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {task.howToDoc && task.howToDoc.length > 0 && (
                          <Box>
                            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                              Documentation
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              {task.howToDoc.map((doc, index) => (
                                <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Article fontSize="small" color="primary" />
                                  <Typography
                                    variant="body2"
                                    component="a"
                                    href={doc}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                                  >
                                    {doc.length > 60 ? `${doc.substring(0, 60)}...` : doc}
                                  </Typography>
                                </Box>
                              ))}
                            </Box>
                          </Box>
                        )}

                        {task.howToVideo && task.howToVideo.length > 0 && (
                          <Box>
                            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                              Video Tutorials
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              {task.howToVideo.map((video, index) => (
                                <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <OndemandVideo fontSize="small" color="error" />
                                  <Typography
                                    variant="body2"
                                    component="a"
                                    href={video}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                                  >
                                    {video.length > 60 ? `${video.substring(0, 60)}...` : video}
                                  </Typography>
                                </Box>
                              ))}
                            </Box>
                          </Box>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                )}

              {/* Notes Section */}
              {(task.notes || task.statusNotes) && (
                <Card variant="outlined" sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                      Notes
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {task.notes && (
                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                            Task Notes
                          </Typography>
                          <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                            <Typography variant="body2">
                              {task.notes}
                            </Typography>
                          </Paper>
                        </Box>
                      )}

                      {task.statusNotes && (
                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                            Adoption Notes History
                          </Typography>
                          <Paper variant="outlined" sx={{ p: 2, bgcolor: '#E0F2F1', maxHeight: '300px', overflow: 'auto' }}>
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                              {task.statusNotes}
                            </Typography>
                          </Paper>
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              )}

              {/* Last Status Update */}
              {task.statusUpdatedAt && (() => {
                try {
                  const date = new Date(task.statusUpdatedAt);
                  if (isNaN(date.getTime())) return null;

                  return (
                    <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                        Last Status Update
                      </Typography>
                      <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        {date.toLocaleString()}
                        {task.statusUpdatedBy && ` • by ${task.statusUpdatedBy}`}
                        {task.statusUpdateSource && (
                          <Chip
                            label={task.statusUpdateSource}
                            size="small"
                            sx={{ height: 20, fontSize: '0.7rem' }}
                            color={
                              task.statusUpdateSource === 'MANUAL' ? 'primary' :
                                task.statusUpdateSource === 'TELEMETRY' ? 'success' :
                                  task.statusUpdateSource === 'IMPORT' ? 'info' :
                                    'default'
                            }
                          />
                        )}
                      </Typography>
                    </Box>
                  );
                } catch (e) {
                  return null;
                }
              })()}
            </Box>
          )}

          {/* Tab 1: Telemetry */}
          {activeTab === 1 && (
            <Box>
              {hasTelemetry ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {task.telemetryAttributes!.map((attr) => {
                    const latestValue = attr.values && attr.values.length > 0
                      ? attr.values[attr.values.length - 1]
                      : null;

                    // Use shared formatter for consistent criteria display
                    const criteriaText = formatSuccessCriteria(attr.successCriteria);

                    return (
                      <Card key={attr.id} variant="outlined">
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                            <Box sx={{ flex: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                  {attr.name}
                                </Typography>
                                <Chip
                                  label={attr.dataType}
                                  size="small"
                                  variant="outlined"
                                  sx={{
                                    height: 18,
                                    fontSize: '0.65rem',
                                    fontWeight: 600,
                                    borderColor:
                                      attr.dataType === 'BOOLEAN' ? '#9c27b0' :
                                        attr.dataType === 'NUMBER' ? '#2196f3' :
                                          attr.dataType === 'STRING' ? '#4caf50' :
                                            attr.dataType === 'TIMESTAMP' ? '#ff9800' :
                                              '#757575',
                                    color:
                                      attr.dataType === 'BOOLEAN' ? '#9c27b0' :
                                        attr.dataType === 'NUMBER' ? '#2196f3' :
                                          attr.dataType === 'STRING' ? '#4caf50' :
                                            attr.dataType === 'TIMESTAMP' ? '#ff9800' :
                                              '#757575'
                                  }}
                                />
                              </Box>
                              {attr.description && (
                                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                                  {attr.description}
                                </Typography>
                              )}
                            </Box>
                            <Chip
                              label={
                                task.status === 'NO_LONGER_USING' && task.statusUpdateSource === 'TELEMETRY'
                                  ? 'Telemetry Not Available'
                                  : (latestValue && attr.isMet) ? 'Criteria Met ✓' : 'Criteria Not Met'
                              }
                              size="small"
                              color={
                                task.status === 'NO_LONGER_USING' && task.statusUpdateSource === 'TELEMETRY'
                                  ? 'warning'
                                  : (latestValue && attr.isMet) ? 'success' : 'default'
                              }
                              variant="outlined"
                              sx={{ ml: 2, flexShrink: 0 }}
                            />
                          </Box>

                          <Divider sx={{ my: 1 }} />

                          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 2 }}>
                            <Box>
                              <Typography variant="caption" color="text.secondary" display="block">
                                Success Criteria
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {criteriaText}
                              </Typography>
                            </Box>

                            <Box>
                              <Typography variant="caption" color="text.secondary" display="block">
                                Last Imported Value
                              </Typography>
                              {latestValue ? (
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: 600,
                                    color: latestValue.criteriaMet ? 'success.main' : 'text.primary'
                                  }}
                                >
                                  {typeof latestValue.value === 'object'
                                    ? JSON.stringify(latestValue.value)
                                    : String(latestValue.value)}
                                </Typography>
                              ) : (
                                <Typography variant="body2" color="text.secondary" fontStyle="italic">
                                  No value imported yet
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    );
                  })}

                  {/* Summary Box */}
                  <Card variant="outlined" sx={{ bgcolor: 'grey.50', mt: 1 }}>
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                        Summary
                      </Typography>
                      {(() => {
                        const totalAttributes = task.telemetryAttributes!.length;
                        const attributesWithValues = task.telemetryAttributes!.filter((attr) =>
                          attr.values && attr.values.length > 0
                        ).length;
                        const attributesWithCriteriaMet = task.telemetryAttributes!.filter((attr) =>
                          attr.isMet === true
                        ).length;
                        const attributesWithCriteria = task.telemetryAttributes!.filter((attr) =>
                          attr.successCriteria && attr.successCriteria !== 'No criteria'
                        ).length;
                        const allCriteriaMet = attributesWithCriteria > 0 && attributesWithCriteriaMet === attributesWithCriteria;

                        return (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Typography variant="body2">
                              <strong>{attributesWithValues}</strong> out of <strong>{totalAttributes}</strong> attributes have imported values
                            </Typography>
                            {attributesWithCriteria > 0 && (
                              <Typography variant="body2">
                                <strong>{attributesWithCriteriaMet}</strong> out of <strong>{attributesWithCriteria}</strong> success criteria are met
                              </Typography>
                            )}
                            {allCriteriaMet && (
                              <Alert severity="success" sx={{ mt: 1 }}>
                                ✓ All telemetry criteria met! This task can be marked as "Done via Telemetry"
                              </Alert>
                            )}
                            {!allCriteriaMet && attributesWithCriteria > 0 && attributesWithCriteriaMet > 0 && (
                              <Alert severity="info" sx={{ mt: 1 }}>
                                {Math.round((attributesWithCriteriaMet / attributesWithCriteria) * 100)}% of criteria met.
                                Keep monitoring telemetry values.
                              </Alert>
                            )}
                          </Box>
                        );
                      })()}
                    </CardContent>
                  </Card>
                </Box>
              ) : (
                <Alert severity="info">
                  No telemetry attributes configured for this task
                </Alert>
              )}
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};


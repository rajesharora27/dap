/**
 * Bulk Import Dialog V2
 * 
 * A modern, two-phase import dialog with:
 * - File upload with drag & drop
 * - Dry run preview with diffs
 * - Commit confirmation
 * - Error/warning display
 */
import * as React from 'react';
import { useState, useCallback, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    Card,
    CardContent,
    Chip,
    Alert,
    CircularProgress,
    LinearProgress,
    Stepper,
    Step,
    StepLabel,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    IconButton,
    Tooltip,
} from '@mui/material';
import {
    CloudUpload as UploadIcon,
    ExpandMore as ExpandMoreIcon,
    CheckCircle as CheckIcon,
    Error as ErrorIcon,
    Warning as WarningIcon,
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Remove as SkipIcon,
    Refresh as RefreshIcon,
    Close as CloseIcon,
    Article,
} from '@shared/components/FAIcon';
import { useImportProgress } from '../hooks/useImportProgress';
import { useMutation, gql } from '@apollo/client';

// ============================================================================
// GraphQL Mutations
// ============================================================================

const IMPORT_DRY_RUN = gql`
  mutation ImportDryRun($content: String!, $entityType: EntityType) {
    importDryRun(content: $content, entityType: $entityType) {
      sessionId
      isValid
      entityType
      entitySummary {
        name
        action
        existingId
      }
      records {
        tasks { rowNumber action data existingId changes { field displayOld displayNew } }
        licenses { rowNumber action data existingId changes { field displayOld displayNew } }
        outcomes { rowNumber action data existingId changes { field displayOld displayNew } }
        releases { rowNumber action data existingId changes { field displayOld displayNew } }
        tags { rowNumber action data existingId changes { field displayOld displayNew } }
        customAttributes { rowNumber action data existingId changes { field displayOld displayNew } }
        telemetryAttributes { rowNumber action data existingId changes { field displayOld displayNew } }
        resources { rowNumber action data existingId changes { field displayOld displayNew } }
      }
      errors { sheet row column field message code severity }
      warnings { sheet row column field message code severity }
      summary {
        totalRecords
        toCreate
        toUpdate
        toDelete
        toSkip
        errorCount
        warningCount
      }
    }
  }
`;

const IMPORT_COMMIT = gql`
  mutation ImportCommit($sessionId: String!) {
    importCommit(sessionId: $sessionId) {
      success
      entityId
      entityName
      stats {
        tasksCreated tasksUpdated tasksDeleted tasksSkipped
        licensesCreated licensesUpdated licensesDeleted
        outcomesCreated outcomesUpdated outcomesDeleted
        releasesCreated releasesUpdated releasesDeleted
        tagsCreated tagsUpdated tagsDeleted
        customAttributesCreated customAttributesUpdated customAttributesDeleted
        telemetryAttributesCreated telemetryAttributesUpdated telemetryAttributesDeleted
      }
      message
      errors { sheet row message }
    }
  }
`;

const IMPORT_EXTEND_SESSION = gql`
  mutation ImportExtendSession($sessionId: String!) {
    importExtendSession(sessionId: $sessionId)
  }
`;

// ============================================================================
// Types
// ============================================================================

interface RecordPreview {
    rowNumber: number;
    action: string;
    data: Record<string, unknown>;
    existingId?: string;
    changes?: Array<{ field: string; displayOld: string; displayNew: string }>;
}

interface DryRunResult {
    sessionId: string;
    isValid: boolean;
    entityType: string;
    entitySummary: { name: string; action: string; existingId?: string };
    records: {
        tasks: RecordPreview[];
        licenses: RecordPreview[];
        outcomes: RecordPreview[];
        releases: RecordPreview[];
        tags: RecordPreview[];
        customAttributes: RecordPreview[];
        telemetryAttributes: RecordPreview[];
        resources: RecordPreview[];
        productRefs: RecordPreview[];
    };
    errors: Array<{ sheet: string; row: number; column?: string; field?: string; message: string; code: string }>;
    warnings: Array<{ sheet: string; row: number; message: string }>;
    summary: {
        totalRecords: number;
        toCreate: number;
        toUpdate: number;
        toDelete: number;
        toSkip: number;
        errorCount: number;
        warningCount: number;
    };
}

interface BulkImportDialogProps {
    open: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    entityType?: 'PRODUCT' | 'SOLUTION';
}

type ImportStep = 'upload' | 'preview' | 'committing' | 'complete';

// ============================================================================
// Component
// ============================================================================

export const BulkImportDialog: React.FC<BulkImportDialogProps> = ({
    open,
    onClose,
    onSuccess,
    entityType,
}) => {
    const [step, setStep] = useState<ImportStep>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [dryRunResult, setDryRunResult] = useState<DryRunResult | null>(null);
    const [commitError, setCommitError] = useState<string | null>(null);
    const [dragActive, setDragActive] = useState(false);

    const { progress, message } = useImportProgress(
        dryRunResult?.sessionId || null,
        step === 'committing'
    );

    const [dryRun, { loading: dryRunLoading }] = useMutation(IMPORT_DRY_RUN);
    const [commit, { loading: commitLoading }] = useMutation(IMPORT_COMMIT);
    const [extendSession] = useMutation(IMPORT_EXTEND_SESSION);

    // Keep session alive while reviewing
    useEffect(() => {
        if (step === 'preview' && dryRunResult?.sessionId) {
            const interval = setInterval(() => {
                extendSession({ variables: { sessionId: dryRunResult.sessionId } });
            }, 2 * 60 * 1000); // Every 2 minutes
            return () => clearInterval(interval);
        }
    }, [step, dryRunResult?.sessionId, extendSession]);

    // Reset on close
    useEffect(() => {
        if (!open) {
            setStep('upload');
            setFile(null);
            setDryRunResult(null);
            setCommitError(null);
        }
    }, [open]);

    // Handle file selection
    const handleFileSelect = useCallback(async (selectedFile: File) => {
        setFile(selectedFile);

        try {
            // Read file as base64
            const base64 = await fileToBase64(selectedFile);

            // Run dry run validation
            const result = await dryRun({
                variables: {
                    content: base64,
                    entityType: entityType,
                },
            });

            setDryRunResult(result.data.importDryRun);
            setStep('preview');
        } catch (error) {
            console.error('Dry run failed:', error);
            setCommitError(`Failed to validate file: ${error instanceof Error ? error.message : String(error)}`);
        }
    }, [dryRun, entityType]);

    // Handle commit
    const handleCommit = useCallback(async () => {
        if (!dryRunResult?.sessionId) return;

        setStep('committing');
        setCommitError(null);

        try {
            const result = await commit({
                variables: { sessionId: dryRunResult.sessionId },
            });

            if (result.data.importCommit.success) {
                setStep('complete');
                onSuccess?.();
            } else {
                setCommitError(result.data.importCommit.message);
                setStep('preview');
            }

        } catch (error) {
            console.error('Commit failed:', error);
            setCommitError(`Import failed: ${error instanceof Error ? error.message : String(error)}`);
            setStep('preview');
        }
    }, [commit, dryRunResult?.sessionId, onSuccess]);

    // Drag and drop handlers
    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    }, [handleFileSelect]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0]);
        }
    }, [handleFileSelect]);

    const stepIndex = step === 'upload' ? 0 : step === 'preview' ? 1 : 2;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{
                sx: { minHeight: '60vh' }
            }}
        >
            <DialogTitle sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: 1,
                borderColor: 'divider',
                pb: 2,
            }}>
                <Box>
                    <Typography variant="h5" fontWeight={600}>
                        📥 Import from Excel
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {entityType === 'SOLUTION' ? 'Import a solution' : 'Import a product'} and all related data
                    </Typography>
                </Box>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ pt: 3 }}>
                {/* Stepper */}
                <Stepper activeStep={stepIndex} sx={{ mb: 4 }}>
                    <Step>
                        <StepLabel>Upload File</StepLabel>
                    </Step>
                    <Step>
                        <StepLabel>Review Changes</StepLabel>
                    </Step>
                    <Step>
                        <StepLabel>Import</StepLabel>
                    </Step>
                </Stepper>

                {/* Step: Upload */}
                {step === 'upload' && (
                    <UploadStep
                        loading={dryRunLoading}
                        dragActive={dragActive}
                        onDrag={handleDrag}
                        onDrop={handleDrop}
                        onInputChange={handleInputChange}
                        error={commitError}
                    />
                )}

                {/* Step: Preview */}
                {step === 'preview' && dryRunResult && (
                    <PreviewStep result={dryRunResult} />
                )}

                {/* Step: Committing */}
                {step === 'committing' && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8, gap: 3, width: '100%', maxWidth: 400, mx: 'auto' }}>
                        <Box sx={{ width: '100%', position: 'relative' }}>
                            <LinearProgress
                                variant="determinate"
                                value={progress}
                                sx={{ height: 10, borderRadius: 5 }}
                            />
                            <Typography variant="body2" sx={{ position: 'absolute', right: 0, top: -24, fontWeight: 'bold' }}>
                                {progress}%
                            </Typography>
                        </Box>

                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h6" gutterBottom>Importing data...</Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                {message}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Please don't close this dialog.
                            </Typography>
                        </Box>
                    </Box>
                )}

                {/* Step: Complete */}
                {step === 'complete' && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, gap: 2 }}>
                            <CheckIcon sx={{ fontSize: 64, color: 'success.main' }} />
                            <Typography variant="h5" fontWeight={600}>Import Complete!</Typography>
                            <Typography color="text.secondary" textAlign="center">
                                Successfully updated <strong>{dryRunResult?.entitySummary.name}</strong>
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${dryRunResult?.summary.toDelete ? 4 : 3}, 1fr)`, gap: 2 }}>
                            <StatCard label="Created" value={dryRunResult?.summary.toCreate || 0} color="success.main" />
                            <StatCard label="Updated" value={dryRunResult?.summary.toUpdate || 0} color="info.main" />
                            {dryRunResult?.summary.toDelete ? (
                                <StatCard label="Deleted" value={dryRunResult?.summary.toDelete || 0} color="error.main" />
                            ) : null}
                            <StatCard label="Skipped" value={dryRunResult?.summary.toSkip || 0} color="text.secondary" />
                        </Box>

                        <Box>
                            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Article sx={{ fontSize: 18 }} />
                                Detailed Report
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <RecordSection title="Tasks" records={dryRunResult?.records.tasks || []} />
                                <RecordSection title="Licenses" records={dryRunResult?.records.licenses || []} />
                                <RecordSection title="Outcomes" records={dryRunResult?.records.outcomes || []} />
                                <RecordSection title="Releases" records={dryRunResult?.records.releases || []} />
                                <RecordSection title="Tags" records={dryRunResult?.records.tags || []} />
                                <RecordSection title="Custom Attributes" records={dryRunResult?.records.customAttributes || []} />
                                <RecordSection title="Telemetry Attributes" records={dryRunResult?.records.telemetryAttributes || []} />
                                <RecordSection title="Resources" records={dryRunResult?.records.resources || []} />
                            </Box>
                        </Box>
                    </Box>
                )}

                {/* Error Display */}
                {commitError && step !== 'upload' && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        {commitError}
                    </Alert>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider' }}>
                {step === 'upload' && (
                    <Button onClick={onClose}>Cancel</Button>
                )}
                {step === 'preview' && (
                    <>
                        <Button onClick={() => { setStep('upload'); setFile(null); setDryRunResult(null); }}>
                            <RefreshIcon sx={{ mr: 1 }} /> Try Different File
                        </Button>
                        <Box sx={{ flex: 1 }} />
                        <Button onClick={onClose}>Cancel</Button>
                        <Button
                            variant="contained"
                            disabled={!dryRunResult?.isValid || commitLoading}
                            onClick={handleCommit}
                            sx={{ minWidth: 140 }}
                        >
                            {commitLoading ? <CircularProgress size={20} /> : 'Import Now'}
                        </Button>
                    </>
                )}
                {step === 'complete' && (
                    <Button variant="contained" onClick={onClose}>
                        Done
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

// ============================================================================
// Sub-components
// ============================================================================

interface UploadStepProps {
    loading: boolean;
    dragActive: boolean;
    onDrag: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
    onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    error?: string | null;
}

const UploadStep: React.FC<UploadStepProps> = ({
    loading,
    dragActive,
    onDrag,
    onDrop,
    onInputChange,
    error,
}) => (
    <Box>
        <Box
            onDragEnter={onDrag}
            onDragLeave={onDrag}
            onDragOver={onDrag}
            onDrop={onDrop}
            sx={{
                border: 3,
                borderStyle: 'dashed',
                borderColor: dragActive ? 'primary.main' : 'grey.300',
                borderRadius: 3,
                bgcolor: dragActive ? 'primary.50' : 'grey.50',
                p: 6,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'primary.50',
                },
            }}
        >
            {loading ? (
                <>
                    <CircularProgress size={48} />
                    <Typography variant="h6">Validating file...</Typography>
                </>
            ) : (
                <>
                    <UploadIcon sx={{ fontSize: 64, color: 'primary.main' }} />
                    <Typography variant="h6">Drop Excel file here</Typography>
                    <Typography color="text.secondary">
                        or click to browse
                    </Typography>
                    <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={onInputChange}
                        style={{
                            position: 'absolute',
                            opacity: 0,
                            width: '100%',
                            height: '100%',
                            cursor: 'pointer',
                        }}
                    />
                    <Button variant="outlined" component="label">
                        Choose File
                        <input type="file" accept=".xlsx,.xls" hidden onChange={onInputChange} />
                    </Button>
                </>
            )}
        </Box>
        {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
                {error}
            </Alert>
        )}
        <Alert severity="info" sx={{ mt: 2 }} icon={false}>
            <Typography variant="body2">
                📋 <strong>Supported format:</strong> Excel (.xlsx) files exported from this application or matching the template structure.
            </Typography>
        </Alert>
    </Box>
);

interface PreviewStepProps {
    result: DryRunResult;
}

const PreviewStep: React.FC<PreviewStepProps> = ({ result }) => {
    const hasErrors = result.summary.errorCount > 0;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Entity Summary */}
            <Card variant="outlined">
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" fontWeight={600}>
                                {result.entitySummary.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {result.entityType.toLowerCase()} • {result.entitySummary.action === 'create' ? 'New' : 'Update existing'}
                            </Typography>
                        </Box>
                        <Chip
                            label={result.isValid ? 'Ready to import' : 'Has errors'}
                            color={result.isValid ? 'success' : 'error'}
                            icon={result.isValid ? <CheckIcon /> : <ErrorIcon />}
                        />
                    </Box>
                </CardContent>
            </Card>

            {/* Statistics */}
            <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${result.summary.toDelete > 0 ? 5 : 4}, 1fr)`, gap: 2 }}>
                <StatCard label="Total Records" value={result.summary.totalRecords} />
                <StatCard label="To Create" value={result.summary.toCreate} color="success.main" />
                <StatCard label="To Update" value={result.summary.toUpdate} color="info.main" />
                {result.summary.toDelete > 0 && (
                    <StatCard label="To Delete" value={result.summary.toDelete} color="error.main" />
                )}
                <StatCard label="Unchanged" value={result.summary.toSkip} color="text.secondary" />
            </Box>

            {/* Errors */}
            {hasErrors && (
                <Alert severity="error">
                    <Typography variant="subtitle2" gutterBottom>
                        {result.summary.errorCount} validation error(s) must be fixed before importing:
                    </Typography>
                    <Box component="ul" sx={{ m: 0, pl: 2 }}>
                        {result.errors.slice(0, 10).map((err, i) => (
                            <li key={i}>
                                <Typography variant="body2">
                                    <strong>{err.sheet}</strong> Row {err.row}: {err.message}
                                </Typography>
                            </li>
                        ))}
                        {result.errors.length > 10 && (
                            <li><Typography variant="body2">... and {result.errors.length - 10} more</Typography></li>
                        )}
                    </Box>
                </Alert>
            )}

            {/* Warnings */}
            {result.summary.warningCount > 0 && (
                <Alert severity="warning">
                    <Typography variant="subtitle2" gutterBottom>
                        {result.summary.warningCount} warning(s):
                    </Typography>
                    <Box component="ul" sx={{ m: 0, pl: 2 }}>
                        {result.warnings.slice(0, 5).map((warn, i) => (
                            <li key={i}>
                                <Typography variant="body2">
                                    {warn.sheet} Row {warn.row}: {warn.message}
                                </Typography>
                            </li>
                        ))}
                    </Box>
                </Alert>
            )}

            {/* Record Details */}
            <RecordSection title="Tasks" records={result.records.tasks} />
            <RecordSection title="Licenses" records={result.records.licenses} />
            <RecordSection title="Outcomes" records={result.records.outcomes} />
            <RecordSection title="Releases" records={result.records.releases} />
            <RecordSection title="Tags" records={result.records.tags} />
            <RecordSection title="Custom Attributes" records={result.records.customAttributes} />
            <RecordSection title="Telemetry Attributes" records={result.records.telemetryAttributes} />
            <RecordSection title="Resources" records={result.records.resources || []} />
        </Box>
    );
};

const StatCard: React.FC<{ label: string; value: number; color?: string }> = ({ label, value, color }) => (
    <Card variant="outlined">
        <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
            <Typography variant="h4" fontWeight={600} color={color}>
                {value}
            </Typography>
            <Typography variant="caption" color="text.secondary">
                {label}
            </Typography>
        </CardContent>
    </Card>
);

const RecordSection: React.FC<{ title: string; records: RecordPreview[] }> = ({ title, records }) => {
    if (records.length === 0) return null;

    const creates = records.filter(r => r.action === 'create').length;
    const updates = records.filter(r => r.action === 'update').length;
    const deletes = records.filter(r => r.action === 'delete').length;

    return (
        <Accordion defaultExpanded={updates > 0 || deletes > 0}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                    <Typography fontWeight={600}>{title}</Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        {creates > 0 && <Chip size="small" label={`+${creates}`} color="success" />}
                        {updates > 0 && <Chip size="small" label={`~${updates}`} color="info" />}
                        {deletes > 0 && <Chip size="small" label={`-${deletes}`} color="error" />}
                    </Box>
                </Box>
            </AccordionSummary>
            <AccordionDetails>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell width={60}>Row</TableCell>
                            <TableCell width={80}>Action</TableCell>
                            <TableCell>Name</TableCell>
                            <TableCell>Details</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {records.filter(r => r.action !== 'skip').map((record, i) => (
                            <TableRow key={i}>
                                <TableCell>{record.rowNumber || '-'}</TableCell>
                                <TableCell>
                                    <ActionChip action={record.action} />
                                </TableCell>
                                <TableCell>
                                    {renderRecordName(title, record.data)}
                                </TableCell>
                                <TableCell>
                                    {record.action === 'create' ? (
                                        <RecordDataSummary title={title} data={record.data} />
                                    ) : record.changes && record.changes.length > 0 ? (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {record.changes.map((change, j) => (
                                                <Tooltip
                                                    key={j}
                                                    title={`${change.displayOld} → ${change.displayNew}`}
                                                    arrow
                                                >
                                                    <Chip
                                                        size="small"
                                                        label={`${change.field}: ${change.displayNew}`}
                                                        sx={{ fontSize: '0.7rem', maxWidth: 200 }}
                                                    />
                                                </Tooltip>
                                            ))}
                                        </Box>
                                    ) : (
                                        <Typography variant="caption" color="text.secondary">No changes detected</Typography>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </AccordionDetails>
        </Accordion>
    );
};

const ActionChip: React.FC<{ action: string }> = ({ action }) => {
    switch (action) {
        case 'create':
            return <Chip size="small" label="New" color="success" icon={<AddIcon />} />;
        case 'update':
            return <Chip size="small" label="Update" color="info" icon={<EditIcon />} />;
        case 'delete':
            return <Chip size="small" label="Delete" color="error" icon={<DeleteIcon />} />;
        case 'skip':
            return <Chip size="small" label="Skip" icon={<SkipIcon />} />;
        default:
            return <Chip size="small" label={action} />;
    }
};

// ============================================================================
// Utilities
// ============================================================================

const renderRecordName = (title: string, data: any) => {
    if (title === 'Telemetry Attributes') {
        return (
            <Box>
                <Typography variant="body2" fontWeight={600}>{data.attributeName}</Typography>
                <Typography variant="caption" color="text.secondary">Task: {data.taskName}</Typography>
            </Box>
        );
    }
    if (title === 'Custom Attributes') {
        return data.key || '-';
    }
    return data.name || '-';
};

const RecordDataSummary: React.FC<{ title: string; data: any }> = ({ title, data }) => {
    const fields = Object.entries(data)
        .filter(([key, val]) => {
            if (['id', 'name', 'key', 'taskName', 'attributeName', '__typename'].includes(key)) return false;
            if (val === null || val === undefined || val === '') return false;
            return true;
        })
        .slice(0, 5); // Show first 5 important fields

    if (fields.length === 0) return <Typography variant="caption" color="text.secondary">New record</Typography>;

    return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {fields.map(([key, val], i) => {
                let displayVal = Array.isArray(val) ? val.length + ' items' : String(val);
                if (key === 'expectedValue' && displayVal.length > 30) {
                    displayVal = displayVal.substring(0, 27) + '...';
                }

                return (
                    <Chip
                        key={i}
                        size="small"
                        variant="outlined"
                        label={`${key}: ${displayVal}`}
                        sx={{ fontSize: '0.65rem', height: 20 }}
                    />
                );
            })}
            {Object.keys(data).length > 5 && <Typography variant="caption">...</Typography>}
        </Box>
    );
};

function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            // Remove data URL prefix (e.g., "data:application/...;base64,")
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
    });
}

export default BulkImportDialog;

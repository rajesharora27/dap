import * as React from 'react';
import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import { 
  CloudUpload as UploadIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { gql, useMutation, useApolloClient } from '@apollo/client';

const IMPORT_PRODUCT_FROM_EXCEL = gql`
  mutation ImportProductFromExcel($content: String!, $mode: ImportMode!) {
    importProductFromExcel(content: $content, mode: $mode) {
      success
      productId
      productName
      stats {
        tasksImported
        outcomesImported
        releasesImported
        licensesImported
        customAttributesImported
        telemetryAttributesImported
      }
      errors {
        tab
        row
        field
        message
        severity
      }
    }
  }
`;

const PREVIEW_PRODUCT_IMPORT = gql`
  mutation PreviewProductImport($content: String!, $mode: ImportMode!) {
    previewProductImport(content: $content, mode: $mode) {
      productName
      mode
      willCreate
      willUpdate
      changes {
        productFields
        tasksToCreate
        tasksToUpdate
        outcomesToCreate
        releasesToCreate
        licensesToCreate
        customAttributesToCreate
      }
      validationErrors {
        tab
        row
        field
        message
        severity
      }
      validationWarnings {
        tab
        row
        field
        message
        severity
      }
    }
  }
`;

interface ImportProductDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ImportProductDialog({ open, onClose, onSuccess }: ImportProductDialogProps) {
  const client = useApolloClient();
  const [file, setFile] = useState<File | null>(null);
  const [importMode, setImportMode] = useState('CREATE_OR_UPDATE');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [importResult, setImportResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload');

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.xlsx')) {
        setError('Please select an Excel file (.xlsx)');
        return;
      }
      setFile(selectedFile);
      setError(null);
      setPreview(null);
      setImportResult(null);
    }
  };

  const handlePreview = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      // Read file as base64
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64Content = buffer.toString('base64');

      // Call preview mutation
      const { data } = await client.mutate({
        mutation: PREVIEW_PRODUCT_IMPORT,
        variables: {
          content: base64Content,
          mode: importMode
        }
      });

      setPreview(data.previewProductImport);
      
      // Check for validation errors
      if (data.previewProductImport.validationErrors.length > 0) {
        setStep('preview');
      } else {
        setStep('preview');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to preview import');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      // Read file as base64
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64Content = buffer.toString('base64');

      // Call import mutation
      const { data } = await client.mutate({
        mutation: IMPORT_PRODUCT_FROM_EXCEL,
        variables: {
          content: base64Content,
          mode: importMode
        }
      });

      setImportResult(data.importProductFromExcel);
      setStep('result');

      if (data.importProductFromExcel.success) {
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to import product');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setImportMode('CREATE_OR_UPDATE');
    setPreview(null);
    setImportResult(null);
    setError(null);
    setStep('upload');
    onClose();
  };

  const renderUploadStep = () => (
    <Box>
      <Typography variant="body1" gutterBottom>
        Select an Excel file (.xlsx) to import a product with all its data.
      </Typography>
      
      <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
        <InputLabel>Import Mode</InputLabel>
        <Select
          value={importMode}
          onChange={(e) => setImportMode(e.target.value)}
          label="Import Mode"
        >
          <MenuItem value="CREATE_NEW">Create New (fail if exists)</MenuItem>
          <MenuItem value="UPDATE_EXISTING">Update Existing (fail if not exists)</MenuItem>
          <MenuItem value="CREATE_OR_UPDATE">Create or Update</MenuItem>
        </Select>
      </FormControl>

      <Box
        sx={{
          border: '2px dashed #ccc',
          borderRadius: 2,
          p: 4,
          textAlign: 'center',
          cursor: 'pointer',
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: 'action.hover'
          }
        }}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <input
          id="file-input"
          type="file"
          accept=".xlsx"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="body1" color="text.secondary">
          {file ? file.name : 'Click to select Excel file'}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Supports .xlsx files exported from this application
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );

  const renderPreviewStep = () => {
    if (!preview) return null;

    const hasErrors = preview.validationErrors.length > 0;

    return (
      <Box>
        <Alert severity={hasErrors ? 'error' : 'info'} sx={{ mb: 2 }}>
          <Typography variant="subtitle2">
            Product: {preview.productName}
          </Typography>
          <Typography variant="body2">
            {preview.willCreate && 'Will create new product'}
            {preview.willUpdate && 'Will update existing product'}
          </Typography>
        </Alert>

        {hasErrors && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="error" gutterBottom>
              Validation Errors:
            </Typography>
            <List dense>
              {preview.validationErrors.map((err: any, idx: number) => (
                <ListItem key={idx}>
                  <ListItemText
                    primary={err.message}
                    secondary={`${err.tab} - ${err.field}`}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {!hasErrors && preview.changes && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Changes to be made:
            </Typography>
            <List dense>
              {preview.changes.tasksToCreate > 0 && (
                <ListItem>
                  <ListItemText primary={`${preview.changes.tasksToCreate} tasks will be created`} />
                </ListItem>
              )}
              {preview.changes.tasksToUpdate > 0 && (
                <ListItem>
                  <ListItemText primary={`${preview.changes.tasksToUpdate} tasks will be updated`} />
                </ListItem>
              )}
              {preview.changes.outcomesToCreate > 0 && (
                <ListItem>
                  <ListItemText primary={`${preview.changes.outcomesToCreate} outcomes will be created`} />
                </ListItem>
              )}
              {preview.changes.releasesToCreate > 0 && (
                <ListItem>
                  <ListItemText primary={`${preview.changes.releasesToCreate} releases will be created`} />
                </ListItem>
              )}
              {preview.changes.licensesToCreate > 0 && (
                <ListItem>
                  <ListItemText primary={`${preview.changes.licensesToCreate} licenses will be created`} />
                </ListItem>
              )}
              {preview.changes.customAttributesToCreate > 0 && (
                <ListItem>
                  <ListItemText primary={`${preview.changes.customAttributesToCreate} custom attributes will be created`} />
                </ListItem>
              )}
            </List>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Box>
    );
  };

  const renderResultStep = () => {
    if (!importResult) return null;

    return (
      <Box>
        {importResult.success ? (
          <>
            <Alert severity="success" sx={{ mb: 2 }}>
              <Box display="flex" alignItems="center" gap={1}>
                <SuccessIcon />
                <Typography variant="subtitle1">
                  Product "{importResult.productName}" imported successfully!
                </Typography>
              </Box>
            </Alert>

            <Typography variant="subtitle2" gutterBottom>
              Import Statistics:
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary={`Tasks: ${importResult.stats.tasksImported}`} />
              </ListItem>
              <ListItem>
                <ListItemText primary={`Outcomes: ${importResult.stats.outcomesImported}`} />
              </ListItem>
              <ListItem>
                <ListItemText primary={`Releases: ${importResult.stats.releasesImported}`} />
              </ListItem>
              <ListItem>
                <ListItemText primary={`Licenses: ${importResult.stats.licensesImported}`} />
              </ListItem>
              <ListItem>
                <ListItemText primary={`Custom Attributes: ${importResult.stats.customAttributesImported}`} />
              </ListItem>
              <ListItem>
                <ListItemText primary={`Telemetry Attributes: ${importResult.stats.telemetryAttributesImported}`} />
              </ListItem>
            </List>
          </>
        ) : (
          <>
            <Alert severity="error" sx={{ mb: 2 }}>
              <Box display="flex" alignItems="center" gap={1}>
                <ErrorIcon />
                <Typography variant="subtitle1">
                  Import failed
                </Typography>
              </Box>
            </Alert>

            {importResult.errors && importResult.errors.length > 0 && (
              <List dense>
                {importResult.errors.map((err: any, idx: number) => (
                  <ListItem key={idx}>
                    <ListItemText
                      primary={err.message}
                      secondary={`${err.tab} - ${err.field}`}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </>
        )}
      </Box>
    );
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Import Product from Excel
        {loading && <LinearProgress sx={{ mt: 1 }} />}
      </DialogTitle>
      
      <DialogContent>
        {step === 'upload' && renderUploadStep()}
        {step === 'preview' && renderPreviewStep()}
        {step === 'result' && renderResultStep()}
      </DialogContent>
      
      <DialogActions>
        {step === 'upload' && (
          <>
            <Button onClick={handleClose}>Cancel</Button>
            <Button
              onClick={handlePreview}
              disabled={!file || loading}
              variant="contained"
            >
              Preview Import
            </Button>
          </>
        )}
        {step === 'preview' && (
          <>
            <Button onClick={() => setStep('upload')} disabled={loading}>
              Back
            </Button>
            <Button
              onClick={handleImport}
              disabled={loading || (preview && preview.validationErrors.length > 0)}
              variant="contained"
              color="primary"
            >
              {loading ? <CircularProgress size={24} /> : 'Import Now'}
            </Button>
          </>
        )}
        {step === 'result' && (
          <Button onClick={handleClose} variant="contained">
            Close
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

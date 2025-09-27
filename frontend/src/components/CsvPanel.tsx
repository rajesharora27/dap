import * as React from 'react';
import { gql, useMutation } from '@apollo/client';
import { Card, CardHeader, CardContent, Button, TextField, Typography } from '@mui/material';

const IMPORT_PRODUCTS = gql`mutation ImportProducts($csv: String!) { importProductsCsv(csv: $csv) }
`;
const EXPORT_PRODUCTS = gql`mutation ExportProducts { exportProductsCsv }
`;
const IMPORT_TASKS = gql`mutation ImportTasks($productId: ID!, $csv: String!) { importTasksCsv(productId: $productId, csv: $csv) }
`;
const EXPORT_TASKS = gql`mutation ExportTasks($productId: ID!) { exportTasksCsv(productId: $productId) }
`;

interface Props { productId: string | null }
export function CsvPanel({ productId }: Props) {
  const [importProducts] = useMutation(IMPORT_PRODUCTS);
  const [exportProducts] = useMutation(EXPORT_PRODUCTS);
  const [importTasks] = useMutation(IMPORT_TASKS);
  const [exportTasks] = useMutation(EXPORT_TASKS);
  const [csvText, setCsvText] = React.useState('');
  const [download, setDownload] = React.useState<string | null>(null);
  const runImport = async (kind: 'products' | 'tasks') => {
    if (!csvText.trim()) return;
    if (kind === 'products') await importProducts({ variables: { csv: csvText } });
    else if (productId) await importTasks({ variables: { productId, csv: csvText } });
    setCsvText('');
  };
  const runExport = async (kind: 'products' | 'tasks') => {
    if (kind === 'products') {
      const res = await exportProducts();
      setDownload(res.data?.exportProductsCsv ?? null);
    } else if (productId) {
      const res = await exportTasks({ variables: { productId } });
      setDownload(res.data?.exportTasksCsv ?? null);
    }
  };
  return (
    <Card sx={{ mt: 2 }}>
      <CardHeader title="CSV Import / Export" subheader={productId ? `Product ${productId}` : 'Select a product for task CSV'} />
      <CardContent>
        <Typography variant="body2">Import</Typography>
        <TextField multiline minRows={4} fullWidth value={csvText} onChange={e => setCsvText(e.target.value)} sx={{ my: 1 }} placeholder="Paste CSV rows..." />
        <Button size="small" onClick={() => runImport('products')} sx={{ mr: 1 }} variant="contained">Import Products</Button>
        <Button size="small" onClick={() => runImport('tasks')} variant="contained" disabled={!productId}>Import Tasks</Button>
        <Typography variant="body2" sx={{ mt: 2 }}>Export</Typography>
        <Button size="small" onClick={() => runExport('products')} sx={{ mr: 1 }} variant="outlined">Export Products</Button>
        <Button size="small" onClick={() => runExport('tasks')} variant="outlined" disabled={!productId}>Export Tasks</Button>
        {download && (
          <TextField multiline minRows={4} fullWidth value={download} sx={{ mt: 2 }} label="Exported CSV" />
        )}
      </CardContent>
    </Card>
  );
}

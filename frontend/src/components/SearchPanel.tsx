import * as React from 'react';
import { gql, useLazyQuery } from '@apollo/client';
import { Card, CardHeader, CardContent, TextField, Button, List, ListItem, ListItemButton, ListItemText, Typography } from '@mui/material';

// Adapted to actual GraphQL union. We request __typename plus common fields.
const SEARCH = gql`query Search($query: String!) {
  search(query: $query) {
    __typename
    ... on Product { id name description }
    ... on Task { id name description }
    ... on Solution { id name description }
    ... on Customer { id name description }
  }
}`;

type RawResult = { __typename: string; id: string; name: string; description?: string };
interface Props { onSelectProduct?: (id: string) => void; onSelectTask?: (id: string) => void }

export function SearchPanel({ onSelectProduct, onSelectTask }: Props) {
  const [q, setQ] = React.useState('');
  const [run, { data, loading }] = useLazyQuery(SEARCH);
  const submit = () => { if (q.trim()) run({ variables: { query: q } }); };
  return (
    <Card sx={{ mt: 2 }}>
      <CardHeader title="Search" />
      <CardContent>
        <TextField size="small" label="Query" value={q} onChange={e => setQ(e.target.value)} sx={{ mr: 1 }} />
        <Button variant="contained" size="small" onClick={submit} disabled={loading}>Go</Button>
        {loading && <Typography variant="caption" sx={{ ml:1 }}>Loading...</Typography>}
        <List dense>
          {data?.search?.map((r: RawResult) => {
            const label = `${r.__typename}: ${r.name}`;
            const handle = () => {
              if (r.__typename === 'Product') onSelectProduct?.(r.id);
              if (r.__typename === 'Task') onSelectTask?.(r.id);
            };
            return (
              <ListItem disablePadding key={`${r.__typename}:${r.id}`}>
                <ListItemButton onClick={handle}>
                  <ListItemText primary={label} secondary={r.description || undefined} />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </CardContent>
    </Card>
  );
}

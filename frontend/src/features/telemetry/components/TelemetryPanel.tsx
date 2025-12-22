import * as React from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import { Card, CardHeader, CardContent, TextField, Button, List, ListItem, Typography } from '@mui/material';

const TELEMETRY_QUERY = gql`
  query Telemetry($taskId: ID!, $limit: Int) {
    telemetry(taskId: $taskId, limit: $limit) { id data createdAt }
  }
`;
const ADD_TELEMETRY = gql`
  mutation AddTelemetry($taskId: ID!, $data: JSON!) { addTelemetry(taskId: $taskId, data: $data) }
`;

interface Props { taskId: string | null }
export function TelemetryPanel({ taskId }: Props) {
  const { data, refetch } = useQuery(TELEMETRY_QUERY, { variables: { taskId: taskId || '0', limit: 25 }, skip: !taskId, fetchPolicy: 'cache-and-network' });
  const [addTelemetry] = useMutation(ADD_TELEMETRY);
  const [payload, setPayload] = React.useState('{"metric":1}');
  const submit = async () => {
    if (!taskId) return;
    try {
      const parsed = JSON.parse(payload);
      await addTelemetry({ variables: { taskId, data: parsed } });
      setPayload('{"metric":1}');
      refetch();
    } catch (e) {
      // ignore parse error for now
    }
  };
  return (
    <Card sx={{ mt: 2, opacity: taskId ? 1 : 0.5 }}>
      <CardHeader title="Telemetry" subheader={taskId ? `Task ${taskId}` : 'Select a task'} />
      <CardContent>
        <Typography variant="body2" sx={{ mb: 1 }}>Recent events</Typography>
        <List dense>
          {data?.telemetry?.map((t: any) => (
            <ListItem key={t.id}>{t.createdAt} - {JSON.stringify(t.data)}</ListItem>
          ))}
        </List>
        <TextField label="JSON" size="small" value={payload} onChange={e => setPayload(e.target.value)} sx={{ mr: 1 }} fullWidth multiline minRows={2} />
        <Button variant="contained" onClick={submit} disabled={!taskId}>Add</Button>
      </CardContent>
    </Card>
  );
}

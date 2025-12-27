import * as React from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import { Card, CardHeader, CardContent, TextField, Button, List, ListItem, Typography, IconButton, Tooltip } from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@shared/components/FAIcon';

const DEP_QUERY = gql`query Deps($taskId: ID!) { taskDependencies(taskId: $taskId) { id taskId dependsOnId createdAt } }`;
const ADD_DEP = gql`mutation AddDep($taskId: ID!, $dependsOnId: ID!) { addTaskDependency(taskId: $taskId, dependsOnId: $dependsOnId) { id } }`;
const REMOVE_DEP = gql`mutation RemoveDep($taskId: ID!, $dependsOnId: ID!) { removeTaskDependency(taskId: $taskId, dependsOnId: $dependsOnId) }`;

interface Props { taskId: string | null }
export function DependenciesPanel({ taskId }: Props) {
  const { data, refetch } = useQuery(DEP_QUERY, { variables: { taskId: taskId || '0' }, skip: !taskId, fetchPolicy: 'cache-and-network' });
  const [addDep] = useMutation(ADD_DEP);
  const [removeDep] = useMutation(REMOVE_DEP);
  const [dependsOnId, setDependsOnId] = React.useState('');
  const submit = async () => {
    if (!taskId || !dependsOnId) return;
    await addDep({ variables: { taskId, dependsOnId } });
    setDependsOnId('');
    refetch();
  };
  const del = async (dependsOnIdDel: string) => { if (!taskId) return; await removeDep({ variables: { taskId, dependsOnId: dependsOnIdDel } }); refetch(); };
  return (
    <Card sx={{ mt: 2, opacity: taskId ? 1 : 0.5 }}>
      <CardHeader title="Dependencies" subheader={taskId ? `Task ${taskId}` : 'Select a task'} />
      <CardContent>
        <Typography variant="body2" sx={{ mb: 1 }}>Edges</Typography>
        <List dense>
          {data?.taskDependencies?.map((d: any) => (
            <ListItem key={d.id} secondaryAction={
              <Tooltip title="Remove Dependency">
                <IconButton size="small" onClick={() => del(d.dependsOnId)} color="error"><DeleteIcon /></IconButton>
              </Tooltip>
            }>
              {d.taskId} &rarr; {d.dependsOnId}
            </ListItem>
          ))}
        </List>
        <TextField label="Depends On ID" size="small" value={dependsOnId} onChange={e => setDependsOnId(e.target.value)} sx={{ mr: 1 }} />
        <Tooltip title="Add Dependency">
          <IconButton onClick={submit} disabled={!taskId} color="primary"><AddIcon /></IconButton>
        </Tooltip>
      </CardContent>
    </Card>
  );
}

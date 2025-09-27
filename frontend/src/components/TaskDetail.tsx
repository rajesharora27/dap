import * as React from 'react';
import { gql, useQuery } from '@apollo/client';
import { Box, Typography, Divider, Stack, Chip } from '@mui/material';

const TASK = gql`query TaskNode($id:ID!){ node(id:$id){ ... on Task { id name description estMinutes weight notes completedAt completedReason status { label } } } }`;

interface Props { taskId: string | null }
export const TaskDetail: React.FC<Props> = ({ taskId }) => {
  const { data } = useQuery(TASK,{ variables:{ id: taskId! }, skip: !taskId });
  const task = data?.node;
  if (!taskId) return <Box p={2}><Typography variant="body2" color="text.secondary">Select a task</Typography></Box>;
  if (!task) return <Box p={2}><Typography variant="body2">Loading task...</Typography></Box>;
  return <Box p={2} sx={{ maxHeight: 400, overflow:'auto' }}>
    <Typography variant="h6" gutterBottom>{task.name}</Typography>
    <Stack direction="row" spacing={1} mb={1}>
      <Chip size="small" label={`Status: ${task.status?.label||'?'}`} />
      <Chip size="small" label={`Weight: ${task.weight}`} />
      <Chip size="small" label={`Est: ${task.estMinutes}m`} />
      {task.completedAt && <Chip size="small" color="success" label="Completed" />}
    </Stack>
    {task.description && <Typography variant="body2" paragraph>{task.description}</Typography>}
    {task.notes && <><Divider sx={{ my:1 }} /><Typography variant="subtitle2">Notes</Typography><Typography variant="body2" style={{ whiteSpace:'pre-wrap' }}>{task.notes}</Typography></>}
    {task.completedReason && <><Divider sx={{ my:1 }} /><Typography variant="subtitle2">Completion Reason</Typography><Typography variant="body2">{task.completedReason}</Typography></>}
  </Box>;
};

export default TaskDetail;

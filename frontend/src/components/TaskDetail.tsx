import * as React from 'react';
import { gql, useQuery } from '@apollo/client';
import { Box, Typography, Divider, Stack, Chip } from '@mui/material';

const TASK = gql`query TaskNode($id:ID!){ node(id:$id){ ... on Task { id name licenseLevel howToDoc howToVideo outcomes { id name } } } }`;

interface Props { taskId: string | null }
export const TaskDetail: React.FC<Props> = ({ taskId }) => {
  const { data } = useQuery(TASK,{ variables:{ id: taskId! }, skip: !taskId });
  const task = data?.node;
  if (!taskId) return <Box p={2}><Typography variant="body2" color="text.secondary">Select a task</Typography></Box>;
  if (!task) return <Box p={2}><Typography variant="body2">Loading task...</Typography></Box>;
  return <Box p={2} sx={{ maxHeight: 400, overflow:'auto' }}>
    <Typography variant="h6" gutterBottom>{task.name}</Typography>
    <Stack direction="row" spacing={1} mb={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
      {task.licenseLevel && (
        <Chip size="small" label={`License: ${task.licenseLevel}`} color="info" />
      )}
      {task.outcomes && task.outcomes.map((outcome: any) => (
        <Chip key={outcome.id} size="small" label={outcome.name} color="success" variant="outlined" />
      ))}
      {task.howToDoc && (
        <Chip 
          size="small" 
          label="📄 Documentation" 
          color="primary"
          onClick={() => window.open(task.howToDoc, '_blank')}
          sx={{ cursor: 'pointer' }}
        />
      )}
      {task.howToVideo && (
        <Chip 
          size="small" 
          label="🎥 Video" 
          color="primary"
          onClick={() => window.open(task.howToVideo, '_blank')}
          sx={{ cursor: 'pointer' }}
        />
      )}
    </Stack>
  </Box>;
};

export default TaskDetail;

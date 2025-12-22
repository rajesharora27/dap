import React from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import { List, ListItem, ListItemText, Button, Box, Typography } from '@mui/material';
const CHANGESETS = gql`query CS { changeSets(limit:20){ id committedAt items { id } } }`;
const REVERT = gql`mutation Revert($id:ID!){ revertChangeSet(id:$id) }`;
export const ChangeSetsPanel: React.FC = () => {
  const { data, refetch } = useQuery(CHANGESETS,{ pollInterval:5000 });
  const [revert] = useMutation(REVERT);
  return <Box>
    <Typography variant="subtitle2" sx={{ pl:1, pt:1 }}>Change Sets</Typography>
    <List dense>{data?.changeSets.map((c:any)=>(<ListItem key={c.id} secondaryAction={!c.committedAt?null:<Button size="small" onClick={async()=>{ await revert({ variables:{ id:c.id }}); refetch(); }}>Revert</Button>}><ListItemText primary={c.id} secondary={`${c.items.length} items ${c.committedAt? 'committed':''}`} /></ListItem>))}</List>
  </Box>;
};

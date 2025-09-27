import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { List, ListItem, ListItemText, Typography } from '@mui/material';
const AUDIT = gql`query Audit($limit:Int){ auditLogs(limit:$limit){ id action entity entityId createdAt } }`;
export const AuditPanel: React.FC = () => {
  const { data } = useQuery(AUDIT,{ variables:{ limit:50 }, pollInterval:5000 });
  return <>
    <Typography variant="subtitle2" sx={{ pl:1, pt:1 }}>Audit Log</Typography>
    <List dense>{data?.auditLogs.map((l:any)=>(<ListItem key={l.id}><ListItemText primary={`${l.action} ${l.entity||''} ${l.entityId||''}`} secondary={new Date(l.createdAt).toLocaleTimeString()} /></ListItem>))}</List>
  </>;
};

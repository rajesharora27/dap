import gql from 'graphql-tag';

export const auditTypeDefs = gql`
  type AuditLog implements Node { 
    id: ID! 
    action: String! 
    entity: String 
    entityId: String 
    details: JSON 
    createdAt: String! 
  }
`;

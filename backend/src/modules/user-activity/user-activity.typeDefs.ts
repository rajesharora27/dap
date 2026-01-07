import gql from 'graphql-tag';

export const userActivityTypeDefs = gql`
  type ActiveSession {
    id: ID!
    userId: String!
    username: String!
    createdAt: DateTime!
    expiresAt: DateTime!
    ipAddress: String
  }

  type UserLoginStats {
    date: String!
    count: Int!
    roles: [String!]!
  }

  type EntityChangeLog {
    id: ID!
    action: String!
    entity: String!
    entityId: String!
    entityName: String!
    createdAt: DateTime!
    userId: String!
    username: String!
    details: String
  }

  extend type Query {
    """
    Get all currently active user sessions (admin only)
    """
    activeSessions: [ActiveSession!]!

    """
    Get user login statistics over a period (admin only)
    """
    loginStats(period: String!): [UserLoginStats!]!

    """
    Get detailed entity change logs (admin only)
    """
    entityChangeLogs(period: String!): [EntityChangeLog!]!
  }
`;

import gql from 'graphql-tag';

export const changeTrackingTypeDefs = gql`
  type ChangeItem implements Node { 
    id: ID! 
    entityType: String! 
    entityId: String! 
    before: JSON 
    after: JSON 
  }

  type ChangeSet implements Node { 
    id: ID! 
    createdAt: String! 
    committedAt: String 
    items: [ChangeItem!]! 
  }

  extend type Query {
    changeSets(limit: Int = 50): [ChangeSet!]!
    changeSet(id: ID!): ChangeSet
  }

  extend type Mutation {
    beginChangeSet: ID!
    commitChangeSet(id: ID!): Boolean!
    undoChangeSet(id: ID!): Boolean!
    revertChangeSet(id: ID!): Boolean!
  }
`;

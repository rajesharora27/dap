import gql from 'graphql-tag';

export const authTypeDefs = gql`
  type User implements Node { 
    id: ID! 
    email: String! 
    username: String 
    name: String 
    role: Role! 
  }

  extend type Mutation {
    signup(email: String!, username: String, password: String!, role: Role = USER, name: String): String! # returns JWT
    login(email: String, username: String, password: String!): String! # returns JWT (identify by email or username)
    simpleLogin(username: String!, password: String!): String! # convenience alias
  }
`;

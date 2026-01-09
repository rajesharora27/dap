import gql from 'graphql-tag';

export const authTypeDefs = gql`
  type User implements Node { 
    id: ID! 
    email: String! 
    username: String 
    name: String 
    role: Role! 
  }

  """
  Result returned when an admin starts impersonating another user.
  Contains the impersonated user's data and new tokens.
  """
  type ImpersonationResult {
    "The user being impersonated"
    user: UserExtended!
    "JWT access token for the impersonated session"
    token: String!
    "Refresh token for the impersonated session"
    refreshToken: String!
  }

  extend type Mutation {
    signup(email: String!, username: String, password: String!, role: Role = USER, name: String): String! # returns JWT
    login(email: String, username: String, password: String!): String! # returns JWT (identify by email or username)
    simpleLogin(username: String!, password: String!): String! # convenience alias
    
    """
    Start impersonating a user (admin only).
    Returns tokens that give the admin access as the target user.
    The admin's original session remains valid for returning to admin mode.
    """
    startImpersonation(targetUserId: ID!): ImpersonationResult!
    
    """
    End the current impersonation session.
    Should be called before restoring the original admin token on the client.
    """
    endImpersonation: Boolean!
  }
`;


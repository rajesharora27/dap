import gql from 'graphql-tag';

/**
 * Start impersonating another user (admin only).
 * Returns the impersonated user's data and tokens.
 */
export const START_IMPERSONATION = gql`
  mutation StartImpersonation($targetUserId: ID!) {
    startImpersonation(targetUserId: $targetUserId) {
      user {
        id
        username
        email
        fullName
        isAdmin
        isActive
        role
      }
      token
      refreshToken
    }
  }
`;

/**
 * End the current impersonation session.
 * Call this before restoring the original admin token on the client.
 */
export const END_IMPERSONATION = gql`
  mutation EndImpersonation {
    endImpersonation
  }
`;

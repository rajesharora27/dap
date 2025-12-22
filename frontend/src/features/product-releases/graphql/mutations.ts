import { gql } from '@apollo/client';

export const CREATE_RELEASE = gql`
  mutation CreateRelease($input: ReleaseInput!) {
    createRelease(input: $input) {
      id
      name
      description
      level
      isActive
      customAttrs
    }
  }
`;

export const UPDATE_RELEASE = gql`
  mutation UpdateRelease($id: ID!, $input: ReleaseInput!) {
    updateRelease(id: $id, input: $input) {
      id
      name
      description
      level
      isActive
      customAttrs
    }
  }
`;

export const DELETE_RELEASE = gql`
  mutation DeleteRelease($id: ID!) {
    deleteRelease(id: $id)
  }
`;

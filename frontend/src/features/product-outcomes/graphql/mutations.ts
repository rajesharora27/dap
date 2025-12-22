import { gql } from '@apollo/client';

export const CREATE_OUTCOME = gql`
  mutation CreateOutcome($input: OutcomeInput!) {
    createOutcome(input: $input) {
      id
      name
      description
    }
  }
`;

export const UPDATE_OUTCOME = gql`
  mutation UpdateOutcome($id: ID!, $input: OutcomeInput!) {
    updateOutcome(id: $id, input: $input) {
      id
      name
      description
    }
  }
`;

export const DELETE_OUTCOME = gql`
  mutation DeleteOutcome($id: ID!) {
    deleteOutcome(id: $id)
  }
`;

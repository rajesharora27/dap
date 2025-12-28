import { gql } from '@apollo/client';

export const CREATE_TELEMETRY_ATTRIBUTE = gql`
  mutation CreateTelemetryAttribute($input: TelemetryAttributeInput!) {
    createTelemetryAttribute(input: $input) {
      id
      taskId
      name
      description
      dataType
      isRequired
      successCriteria
      order
      isActive
    }
  }
`;

export const UPDATE_TELEMETRY_ATTRIBUTE = gql`
  mutation UpdateTelemetryAttribute($id: ID!, $input: TelemetryAttributeUpdateInput!) {
    updateTelemetryAttribute(id: $id, input: $input) {
      id
      taskId
      name
      description
      dataType
      isRequired
      successCriteria
      order
      isActive
    }
  }
`;

export const DELETE_TELEMETRY_ATTRIBUTE = gql`
  mutation DeleteTelemetryAttribute($id: ID!) {
    deleteTelemetryAttribute(id: $id)
  }
`;

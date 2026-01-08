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

export const IMPORT_ADOPTION_PLAN_TELEMETRY = gql`
  mutation ImportAdoptionPlanTelemetry($adoptionPlanId: ID!, $file: Upload!) {
  importAdoptionPlanTelemetry(adoptionPlanId: $adoptionPlanId, file: $file) {
    success
    batchId
      summary {
      tasksProcessed
      attributesUpdated
      criteriaEvaluated
      errors
    }
      taskResults {
      taskId
      taskName
      attributesUpdated
      criteriaMet
      criteriaTotal
      completionPercentage
      errors
    }
  }
}
`;

export const IMPORT_SOLUTION_ADOPTION_PLAN_TELEMETRY = gql`
  mutation ImportSolutionAdoptionPlanTelemetry($solutionAdoptionPlanId: ID!, $file: Upload!) {
  importSolutionAdoptionPlanTelemetry(solutionAdoptionPlanId: $solutionAdoptionPlanId, file: $file) {
    success
    batchId
      summary {
      tasksProcessed
      attributesUpdated
      criteriaEvaluated
      errors
    }
    taskResults {
      taskId
      taskName
      attributesUpdated
      criteriaMet
      criteriaTotal
      completionPercentage
      errors
    }
  }
}
`;

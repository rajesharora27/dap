import { gql } from '@apollo/client';

export const CREATE_CUSTOMER = gql`
  mutation CreateCustomer($input: CustomerInput!) {
    createCustomer(input: $input) {
      id
      name
      description
    }
  }
`;

export const UPDATE_CUSTOMER = gql`
  mutation UpdateCustomer($id: ID!, $input: CustomerInput!) {
    updateCustomer(id: $id, input: $input) {
      id
      name
      description
    }
  }
`;

export const DELETE_CUSTOMER = gql`
  mutation DeleteCustomer($id: ID!) {
    deleteCustomer(id: $id)
  }
`;

export const UPDATE_TASK_STATUS = gql`
  mutation UpdateTaskStatus($input: UpdateCustomerTaskStatusInput!) {
    updateCustomerTaskStatus(input: $input) {
      id
      status
      statusUpdatedAt
      statusUpdatedBy
      statusUpdateSource
      statusNotes
      adoptionPlan {
        id
        totalTasks
        completedTasks
        progressPercentage
      }
      tags {
        id
        name
        color
        description
      }
    }
  }
`;

export const UPDATE_FILTER_PREFERENCE = gql`
  mutation UpdateAdoptionPlanFilterPreference($input: UpdateFilterPreferenceInput!) {
    updateAdoptionPlanFilterPreference(input: $input) {
      id
      adoptionPlanId
      filterReleases
      filterOutcomes
      filterTags
    }
  }
`;

export const SYNC_ADOPTION_PLAN = gql`
  mutation SyncAdoptionPlan($adoptionPlanId: ID!) {
    syncAdoptionPlan(adoptionPlanId: $adoptionPlanId) {
      id
      progressPercentage
      totalTasks
      completedTasks
      needsSync
      lastSyncedAt
      customerProduct {
        id
      }
      licenseLevel
      selectedOutcomes {
        id
        name
      }
      selectedReleases {
        id
        name
        level
      }
      tasks {
        id
        name
        description
        notes
        status
        weight
        sequenceNumber
        statusUpdatedAt
        statusUpdatedBy
        statusUpdateSource
        statusNotes
        licenseLevel
        howToDoc
        howToVideo
        telemetryAttributes {
          id
          name
          description
          dataType
          successCriteria
          isMet
          values {
            id
            value
            criteriaMet
          }
        }
        outcomes {
          id
          name
        }
        releases {
          id
          name
          level
        }
        tags {
          id
          name
          color
          description
        }
      }
    }
  }
`;

export const UPDATE_CUSTOMER_PRODUCT = gql`
  mutation UpdateCustomerProduct($id: ID!, $input: UpdateCustomerProductInput!) {
    updateCustomerProduct(id: $id, input: $input) {
      id
      licenseLevel
      selectedOutcomes {
        id
        name
        description
      }
      selectedReleases {
        id
        name
        level
      }
      adoptionPlan {
        id
        needsSync
        licenseLevel
        selectedOutcomes {
          id
          name
        }
        selectedReleases {
          id
          name
          level
        }
        tasks {
          id
          name
          description
          notes
          status
          weight
          sequenceNumber
          statusUpdatedAt
          statusUpdatedBy
          statusUpdateSource
          statusNotes
          licenseLevel
          howToDoc
          howToVideo
          telemetryAttributes {
            id
            name
            description
            dataType
            successCriteria
            isMet
            values {
              id
              value
              criteriaMet
            }
          }
          outcomes {
            id
            name
          }
          releases {
            id
            name
            level
          }
          tags {
            id
            name
            color
          }
        }
      }
    }
  }
`;

export const REMOVE_PRODUCT_FROM_CUSTOMER = gql`
  mutation RemoveProductFromCustomer($id: ID!) {
    removeProductFromCustomerEnhanced(id: $id) {
      success
      message
    }
  }
`;

export const REMOVE_SOLUTION_FROM_CUSTOMER = gql`
  mutation RemoveSolutionFromCustomer($id: ID!) {
    removeSolutionFromCustomerEnhanced(id: $id) {
      success
      message
    }
  }
`;

export const SYNC_SOLUTION_ADOPTION_PLAN = gql`
  mutation SyncSolutionAdoptionPlan($solutionAdoptionPlanId: ID!) {
    syncSolutionAdoptionPlan(solutionAdoptionPlanId: $solutionAdoptionPlanId) {
      id
      progressPercentage
      totalTasks
      completedTasks
      needsSync
      lastSyncedAt
      tasks {
        id
        tags {
          id
          name
          color
          description
        }
      }
      products {
        id
        productAdoptionPlan {
          id
          lastSyncedAt
          customerProduct {
            tags {
              id
              name
              color
              description
            }
          }
          tasks {
            id
            tags {
              id
              name
              color
              description
            }
          }
        }
      }
    }
  }
`;

export const EXPORT_CUSTOMER_ADOPTION = gql`
  mutation ExportCustomerAdoption($customerId: ID!, $customerProductId: ID!) {
    exportCustomerAdoptionToExcel(customerId: $customerId, customerProductId: $customerProductId) {
      filename
      content
      mimeType
      size
    }
  }
`;

export const IMPORT_CUSTOMER_ADOPTION = gql`
  mutation ImportCustomerAdoption($content: String!) {
    importCustomerAdoptionFromExcel(content: $content) {
      success
      message
      stats {
        telemetryValuesAdded
      }
    }
  }
`;

export const EXPORT_TELEMETRY_TEMPLATE = gql`
  mutation ExportTelemetryTemplate($adoptionPlanId: ID!) {
    exportAdoptionPlanTelemetryTemplate(adoptionPlanId: $adoptionPlanId) {
      url
      filename
      taskCount
      attributeCount
    }
  }
`;

export const IMPORT_TELEMETRY = gql`
  mutation ImportTelemetry($adoptionPlanId: ID!, $file: Upload!) {
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

export const EXPORT_SOLUTION_TELEMETRY_TEMPLATE = gql`
  mutation ExportSolutionTelemetryTemplate($solutionAdoptionPlanId: ID!) {
    exportSolutionAdoptionPlanTelemetryTemplate(solutionAdoptionPlanId: $solutionAdoptionPlanId) {
      url
      filename
      taskCount
      attributeCount
    }
  }
`;

export const IMPORT_SOLUTION_TELEMETRY = gql`
  mutation ImportSolutionTelemetry($solutionAdoptionPlanId: ID!, $file: Upload!) {
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

export const EVALUATE_ALL_SOLUTION_TASKS_TELEMETRY = gql`
  mutation EvaluateAllSolutionTasksTelemetry($solutionAdoptionPlanId: ID!) {
    evaluateAllSolutionTasksTelemetry(solutionAdoptionPlanId: $solutionAdoptionPlanId) {
      id
      progressPercentage
      totalTasks
      completedTasks
      tasks {
        id
        name
        status
        statusUpdatedAt
        statusUpdatedBy
        statusUpdateSource
        telemetryAttributes {
          id
          isMet
        }
      }
    }
  }
`;

export const CREATE_SOLUTION_ADOPTION_PLAN = gql`
  mutation CreateSolutionAdoptionPlan($customerSolutionId: ID!) {
    createSolutionAdoptionPlan(customerSolutionId: $customerSolutionId) {
      id
      progressPercentage
    }
  }
`;

export const ASSIGN_SOLUTION_TO_CUSTOMER = gql`
  mutation AssignSolutionToCustomer($input: AssignSolutionToCustomerInput!) {
    assignSolutionToCustomerEnhanced(input: $input) {
      id
      name
      solution {
        id
        name
      }
    }
  }
`;

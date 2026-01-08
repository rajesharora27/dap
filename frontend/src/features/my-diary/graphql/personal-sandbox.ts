/**
 * Personal Sandbox GraphQL Operations
 */

import { gql } from '@apollo/client';

// ===================
// FRAGMENTS
// ===================

export const PERSONAL_TASK_FRAGMENT = gql`
  fragment PersonalTaskFragment on PersonalTask {
    id
    name
    description
    estMinutes
    weight
    sequenceNumber
    howToDoc
    howToVideo
    outcomes {
      id
      name
    }
    releases {
      id
      name
    }
    tags {
      id
      name
      color
    }
    telemetryAttributes {
      id
      name
      description
      dataType
      isRequired
      successCriteria
      order
      isActive
      isMet
      lastCheckedAt
    }
    telemetryProgress {
      totalAttributes
      requiredAttributes
      metAttributes
      metRequiredAttributes
      completionPercentage
      allRequiredMet
    }
    status
    statusNotes
    statusUpdatedAt
    statusUpdateSource
    licenseLevel
  }
`;

export const PERSONAL_PRODUCT_FRAGMENT = gql`
  fragment PersonalProductFragment on PersonalProduct {
    id
    name
    description
    resources
    customAttrs
    createdAt
    updatedAt
    taskCount
    progress
    outcomes {
      id
      name
      description
    }
    releases {
      id
      name
      description
      level
      version
      releaseDate
    }
    licenses {
      id
      name
      description
      level
      isActive
      customAttrs
      displayOrder
      taskCount
    }
    tags {
      id
      name
      description
      color
      displayOrder
    }
  }
`;

// ... existing code ...

export const COPY_GLOBAL_PRODUCT_TO_PERSONAL = gql`
  ${PERSONAL_PRODUCT_FRAGMENT}
  ${PERSONAL_TASK_FRAGMENT}
  mutation CopyGlobalProductToPersonal($productId: ID!) {
    copyGlobalProductToPersonal(productId: $productId) {
      ...PersonalProductFragment
      tasks {
        ...PersonalTaskFragment
      }
    }
  }
`;

export const PERSONAL_ASSIGNMENT_FRAGMENT = gql`
  fragment PersonalAssignmentFragment on PersonalAssignment {
    id
    name
    createdAt
    updatedAt
    progress
    taskCount
    completedCount
    personalProduct {
      id
      name
    }
  }
`;

// ===================
// QUERIES
// ===================

export const GET_MY_PERSONAL_PRODUCTS = gql`
  ${PERSONAL_PRODUCT_FRAGMENT}
  ${PERSONAL_TASK_FRAGMENT}
  query GetMyPersonalProducts {
    myPersonalProducts {
      ...PersonalProductFragment
      tasks {
        ...PersonalTaskFragment
      }
    }
  }
`;

export const GET_PERSONAL_PRODUCT = gql`
  ${PERSONAL_PRODUCT_FRAGMENT}
  ${PERSONAL_TASK_FRAGMENT}
  query GetPersonalProduct($id: ID!) {
    personalProduct(id: $id) {
      ...PersonalProductFragment
      tasks {
        ...PersonalTaskFragment
      }
    }
  }
`;

// Export personal product (same pattern as main products)
export const EXPORT_PERSONAL_PRODUCT = gql`
  query ExportPersonalProduct($personalProductId: ID!) {
    exportPersonalProduct(personalProductId: $personalProductId) {
      filename
      content
      mimeType
      size
      stats {
        tasksExported
        outcomesExported
        releasesExported
        customAttributesExported
        licensesExported
        telemetryAttributesExported
      }
    }
  }
`;

export const GET_MY_PERSONAL_ASSIGNMENTS = gql`
  ${PERSONAL_ASSIGNMENT_FRAGMENT}
  query GetMyPersonalAssignments {
    myPersonalAssignments {
      ...PersonalAssignmentFragment
      tasks {
        id
        status
        statusNotes
        statusUpdatedAt
        sequenceNumber
        personalTask {
          id
          name
          description
          estMinutes
          weight
        }
      }
    }
  }
`;

// ===================
// MUTATIONS
// ===================

export const CREATE_PERSONAL_PRODUCT = gql`
  ${PERSONAL_PRODUCT_FRAGMENT}
  mutation CreatePersonalProduct($input: CreatePersonalProductInput!) {
    createPersonalProduct(input: $input) {
      ...PersonalProductFragment
    }
  }
`;

export const UPDATE_PERSONAL_PRODUCT = gql`
  ${PERSONAL_PRODUCT_FRAGMENT}
  mutation UpdatePersonalProduct($id: ID!, $input: UpdatePersonalProductInput!) {
    updatePersonalProduct(id: $id, input: $input) {
      ...PersonalProductFragment
    }
  }
`;

export const DELETE_PERSONAL_PRODUCT = gql`
  mutation DeletePersonalProduct($id: ID!) {
    deletePersonalProduct(id: $id)
  }
`;

export const CREATE_PERSONAL_TASK = gql`
  ${PERSONAL_TASK_FRAGMENT}
  mutation CreatePersonalTask($input: CreatePersonalTaskInput!) {
    createPersonalTask(input: $input) {
      ...PersonalTaskFragment
    }
  }
`;

export const UPDATE_PERSONAL_TASK = gql`
  ${PERSONAL_TASK_FRAGMENT}
  mutation UpdatePersonalTask($id: ID!, $input: UpdatePersonalTaskInput!) {
    updatePersonalTask(id: $id, input: $input) {
      ...PersonalTaskFragment
    }
  }
`;

export const DELETE_PERSONAL_TASK = gql`
  mutation DeletePersonalTask($id: ID!) {
    deletePersonalTask(id: $id)
  }
`;

export const REORDER_PERSONAL_TASKS = gql`
  mutation ReorderPersonalTasks($personalProductId: ID!, $taskIds: [ID!]!) {
    reorderPersonalTasks(personalProductId: $personalProductId, taskIds: $taskIds)
  }
`;

export const CREATE_PERSONAL_OUTCOME = gql`
  mutation CreatePersonalOutcome($input: CreatePersonalOutcomeInput!) {
    createPersonalOutcome(input: $input) {
      id
      name
      description
    }
  }
`;

export const DELETE_PERSONAL_OUTCOME = gql`
  mutation DeletePersonalOutcome($id: ID!) {
    deletePersonalOutcome(id: $id)
  }
`;

export const UPDATE_PERSONAL_OUTCOME = gql`
  mutation UpdatePersonalOutcome($id: ID!, $input: UpdatePersonalOutcomeInput!) {
    updatePersonalOutcome(id: $id, input: $input) {
      id
      name
      description
    }
  }
`;


export const CREATE_PERSONAL_RELEASE = gql`
  mutation CreatePersonalRelease($input: CreatePersonalReleaseInput!) {
    createPersonalRelease(input: $input) {
      id
      name
      version
      releaseDate
    }
  }
`;

export const DELETE_PERSONAL_RELEASE = gql`
  mutation DeletePersonalRelease($id: ID!) {
    deletePersonalRelease(id: $id)
  }
`;

export const UPDATE_PERSONAL_RELEASE = gql`
  mutation UpdatePersonalRelease($id: ID!, $input: UpdatePersonalReleaseInput!) {
    updatePersonalRelease(id: $id, input: $input) {
      id
      name
      version
      releaseDate
      description
    }
  }
`;

// ===================================
// LICENSES
// ===================================
export const CREATE_PERSONAL_LICENSE = gql`
    mutation createPersonalLicense($input: CreatePersonalLicenseInput!) {
        createPersonalLicense(input: $input) {
            id
            name
            description
            level
            isActive
            customAttrs
            displayOrder
        }
    }
`;

export const UPDATE_PERSONAL_LICENSE = gql`
    mutation updatePersonalLicense($id: ID!, $input: UpdatePersonalLicenseInput!) {
        updatePersonalLicense(id: $id, input: $input) {
            id
            name
            description
            level
            isActive
            customAttrs
            displayOrder
        }
    }
`;

export const DELETE_PERSONAL_LICENSE = gql`
    mutation deletePersonalLicense($id: ID!) {
        deletePersonalLicense(id: $id)
    }
`;

export const REORDER_PERSONAL_LICENSES = gql`
    mutation reorderPersonalLicenses($ids: [ID!]!) {
        reorderPersonalLicenses(ids: $ids)
    }
`;

// ===================================
// TAGS
// ===================================
export const CREATE_PERSONAL_TAG = gql`
    mutation createPersonalTag($input: CreatePersonalTagInput!) {
        createPersonalTag(input: $input) {
            id
            name
            description
            color
            displayOrder
        }
    }
`;

export const UPDATE_PERSONAL_TAG = gql`
    mutation updatePersonalTag($id: ID!, $input: UpdatePersonalTagInput!) {
        updatePersonalTag(id: $id, input: $input) {
            id
            name
            description
            color
            displayOrder
        }
    }
`;

export const DELETE_PERSONAL_TAG = gql`
    mutation deletePersonalTag($id: ID!) {
        deletePersonalTag(id: $id)
    }
`;

export const REORDER_PERSONAL_TAGS = gql`
    mutation reorderPersonalTags($ids: [ID!]!) {
        reorderPersonalTags(ids: $ids)
    }
`;

// ===================================
// TELEMETRY
// ===================================
export const CREATE_PERSONAL_TELEMETRY_ATTRIBUTE = gql`
    mutation createPersonalTelemetryAttribute($input: CreatePersonalTelemetryAttributeInput!) {
        createPersonalTelemetryAttribute(input: $input) {
            id
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

export const UPDATE_PERSONAL_TELEMETRY_ATTRIBUTE = gql`
    mutation updatePersonalTelemetryAttribute($id: ID!, $input: UpdatePersonalTelemetryAttributeInput!) {
        updatePersonalTelemetryAttribute(id: $id, input: $input) {
            id
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

export const DELETE_PERSONAL_TELEMETRY_ATTRIBUTE = gql`
    mutation deletePersonalTelemetryAttribute($id: ID!) {
        deletePersonalTelemetryAttribute(id: $id)
    }
`;

export const REORDER_PERSONAL_TELEMETRY_ATTRIBUTES = gql`
    mutation reorderPersonalTelemetryAttributes($ids: [ID!]!) {
        reorderPersonalTelemetryAttributes(ids: $ids)
    }
`;


export const IMPORT_PERSONAL_PRODUCT = gql`
  ${PERSONAL_PRODUCT_FRAGMENT}
  mutation ImportPersonalProduct($exportData: JSON!) {
    importPersonalProduct(exportData: $exportData) {
      ...PersonalProductFragment
    }
  }
`;

export const CREATE_PERSONAL_ASSIGNMENT = gql`
  ${PERSONAL_ASSIGNMENT_FRAGMENT}
  mutation CreatePersonalAssignment($input: CreatePersonalAssignmentInput!) {
    createPersonalAssignment(input: $input) {
      ...PersonalAssignmentFragment
    }
  }
`;

export const DELETE_PERSONAL_ASSIGNMENT = gql`
  mutation DeletePersonalAssignment($id: ID!) {
    deletePersonalAssignment(id: $id)
  }
`;

export const SYNC_PERSONAL_ASSIGNMENT = gql`
  ${PERSONAL_ASSIGNMENT_FRAGMENT}
  mutation SyncPersonalAssignment($id: ID!) {
    syncPersonalAssignment(id: $id) {
      ...PersonalAssignmentFragment
    }
  }
`;

export const UPDATE_PERSONAL_ASSIGNMENT_TASK_STATUS = gql`
  mutation UpdatePersonalAssignmentTaskStatus($taskId: ID!, $input: UpdatePersonalAssignmentTaskInput!) {
    updatePersonalAssignmentTaskStatus(taskId: $taskId, input: $input) {
      id
      status
      statusNotes
      statusUpdatedAt
    }
  }
`;

// ===================================
// TELEMETRY IMPORT/EXPORT
// ===================================

export const EXPORT_PERSONAL_TELEMETRY_TEMPLATE = gql`
  mutation ExportPersonalTelemetryTemplate($personalProductId: ID!) {
    exportPersonalTelemetryTemplate(personalProductId: $personalProductId) {
      filename
      content
      mimeType
      size
    }
  }
`;

export const IMPORT_PERSONAL_TELEMETRY = gql`
  mutation ImportPersonalTelemetry($personalProductId: ID!, $file: Upload!) {
    importPersonalTelemetry(personalProductId: $personalProductId, file: $file) {
      success
      summary {
        tasksProcessed
        attributesUpdated
        errors
      }
    }
  }
`;

export const EVALUATE_PERSONAL_TASK_TELEMETRY = gql`
  ${PERSONAL_TASK_FRAGMENT}
  mutation EvaluatePersonalTaskTelemetry($personalTaskId: ID!) {
    evaluatePersonalTaskTelemetry(personalTaskId: $personalTaskId) {
      ...PersonalTaskFragment
    }
  }
`;

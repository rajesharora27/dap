import { gql } from '@apollo/client';

export const REORDER_TASKS = gql`
  mutation ReorderTasks($productId: ID, $solutionId: ID, $order: [ID!]!) {
    reorderTasks(productId: $productId, solutionId: $solutionId, order: $order)
  }
`;

export const CREATE_PRODUCT = gql`
  mutation CreateProduct($input: ProductInput!) {
    createProduct(input: $input) {
      id
      name
      description
      statusPercent
    }
  }
`;

export const UPDATE_PRODUCT = gql`
  mutation UpdateProduct($id: ID!, $input: ProductInput!) {
    updateProduct(id: $id, input: $input) {
      id
      name
      description
      statusPercent
      customAttrs
    }
  }
`;

export const DELETE_PRODUCT = gql`
  mutation DeleteProduct($id: ID!) {
    deleteProduct(id: $id)
  }
`;

export const CREATE_TASK = gql`
  mutation CreateTask($input: TaskCreateInput!) {
    createTask(input: $input) {
      id
      name
      description
      estMinutes
      weight
      sequenceNumber
      licenseLevel
      notes
      howToDoc
      howToVideo
      license {
        id
        name
        level
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
      telemetryAttributes {
        id
        name
        description
        dataType
        isRequired
        successCriteria
        order
        isActive
        isSuccessful
        currentValue {
          id
          value
          source
          createdAt
        }
      }
    }
  }
`;

export const UPDATE_TASK = gql`
  mutation UpdateTask($id: ID!, $input: TaskUpdateInput!) {
    updateTask(id: $id, input: $input) {
      id
      name
      description
      estMinutes
      weight
      sequenceNumber
      licenseLevel
      notes
      howToDoc
      howToVideo
      license {
        id
        name
        level
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
      telemetryAttributes {
        id
        name
        description
        dataType
        isRequired
        successCriteria
        order
        isActive
        isSuccessful
        currentValue {
          id
          value
          source
          createdAt
        }
      }
    }
  }
`;

export const DELETE_TASK = gql`
  mutation DeleteTask($id: ID!) {
    queueTaskSoftDelete(id: $id)
  }
`;

export const PROCESS_DELETION_QUEUE = gql`
  mutation ProcessDeletionQueue {
    processDeletionQueue
  }
`;

export const DELETE_SOLUTION = gql`
  mutation DeleteSolution($id: ID!) {
    deleteSolution(id: $id)
  }
`;

export const CREATE_LICENSE = gql`
  mutation CreateLicense($input: LicenseInput!) {
    createLicense(input: $input) {
      id
      name
      description
      level
      isActive
    }
  }
`;

export const UPDATE_LICENSE = gql`
  mutation UpdateLicense($id: ID!, $input: LicenseInput!) {
    updateLicense(id: $id, input: $input) {
      id
      name
      description
      level
      isActive
    }
  }
`;

export const DELETE_LICENSE = gql`
  mutation DeleteLicense($id: ID!) {
    deleteLicense(id: $id)
  }
`;

export const CREATE_RELEASE = gql`
  mutation CreateRelease($input: ReleaseInput!) {
    createRelease(input: $input) {
      id
      name
      description
      level
      isActive
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
    }
  }
`;

export const DELETE_RELEASE = gql`
  mutation DeleteRelease($id: ID!) {
    deleteRelease(id: $id)
  }
`;

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

export const ADD_PRODUCT_TO_SOLUTION_ENHANCED = gql`
  mutation AddProductToSolution($solutionId: ID!, $productId: ID!, $order: Int) {
    addProductToSolution(solutionId: $solutionId, productId: $productId, order: $order)
  }
`;

export const REMOVE_PRODUCT_FROM_SOLUTION_ENHANCED = gql`
  mutation RemoveProductFromSolution($solutionId: ID!, $productId: ID!) {
    removeProductFromSolution(solutionId: $solutionId, productId: $productId)
  }
`;

export const REORDER_PRODUCTS_IN_SOLUTION = gql`
  mutation ReorderProductsInSolution($solutionId: ID!, $productOrders: [SolutionProductOrderInput!]!) {
    reorderProductsInSolution(solutionId: $solutionId, productOrders: $productOrders)
  }
`;

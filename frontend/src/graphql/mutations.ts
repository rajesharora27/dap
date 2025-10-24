import { gql } from '@apollo/client';

// Product mutations
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

// Task mutations
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
    }
  }
`;

export const DELETE_TASK = gql`
  mutation DeleteTask($id: ID!) {
    queueTaskSoftDelete(id: $id)
  }
`;

export const REORDER_TASKS = gql`
  mutation ReorderTasks($productId: ID!, $order: [ID!]!) {
    reorderTasks(productId: $productId, order: $order)
  }
`;

export const PROCESS_DELETION_QUEUE = gql`
  mutation ProcessDeletionQueue {
    processDeletionQueue
  }
`;

// License mutations
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

// Release mutations
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

// Outcome mutations
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

// Telemetry mutations
export const CREATE_TELEMETRY_ATTRIBUTE = gql`
  mutation CreateTelemetryAttribute($input: TelemetryAttributeInput!) {
    createTelemetryAttribute(input: $input) {
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

export const UPDATE_TELEMETRY_ATTRIBUTE = gql`
  mutation UpdateTelemetryAttribute($id: ID!, $input: TelemetryAttributeUpdateInput!) {
    updateTelemetryAttribute(id: $id, input: $input) {
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

export const DELETE_TELEMETRY_ATTRIBUTE = gql`
  mutation DeleteTelemetryAttribute($id: ID!) {
    deleteTelemetryAttribute(id: $id)
  }
`;

// Solution mutations
export const CREATE_SOLUTION = gql`
  mutation CreateSolution($input: SolutionInput!) {
    createSolution(input: $input) {
      id
      name
      description
      customAttrs
    }
  }
`;

export const UPDATE_SOLUTION = gql`
  mutation UpdateSolution($id: ID!, $input: SolutionInput!) {
    updateSolution(id: $id, input: $input) {
      id
      name
      description
      customAttrs
    }
  }
`;

export const DELETE_SOLUTION = gql`
  mutation DeleteSolution($id: ID!) {
    deleteSolution(id: $id)
  }
`;

export const ADD_PRODUCT_TO_SOLUTION_ENHANCED = gql`
  mutation AddProductToSolutionEnhanced($solutionId: ID!, $productId: ID!, $order: Int) {
    addProductToSolutionEnhanced(solutionId: $solutionId, productId: $productId, order: $order)
  }
`;

export const REMOVE_PRODUCT_FROM_SOLUTION_ENHANCED = gql`
  mutation RemoveProductFromSolutionEnhanced($solutionId: ID!, $productId: ID!) {
    removeProductFromSolutionEnhanced(solutionId: $solutionId, productId: $productId)
  }
`;

export const REORDER_PRODUCTS_IN_SOLUTION = gql`
  mutation ReorderProductsInSolution($solutionId: ID!, $productOrders: [ProductOrderInput!]!) {
    reorderProductsInSolution(solutionId: $solutionId, productOrders: $productOrders)
  }
`;

// Solution Adoption mutations
export const ASSIGN_SOLUTION_TO_CUSTOMER = gql`
  mutation AssignSolutionToCustomer($input: AssignSolutionToCustomerInput!) {
    assignSolutionToCustomer(input: $input) {
      id
      name
      licenseLevel
      purchasedAt
      customer {
        id
        name
      }
      solution {
        id
        name
      }
    }
  }
`;

export const CREATE_SOLUTION_ADOPTION_PLAN = gql`
  mutation CreateSolutionAdoptionPlan($customerSolutionId: ID!) {
    createSolutionAdoptionPlan(customerSolutionId: $customerSolutionId) {
      id
      solutionName
      totalTasks
      completedTasks
      progressPercentage
    }
  }
`;

export const UPDATE_CUSTOMER_SOLUTION_TASK_STATUS = gql`
  mutation UpdateCustomerSolutionTaskStatus($input: UpdateCustomerSolutionTaskStatusInput!) {
    updateCustomerSolutionTaskStatus(input: $input) {
      id
      status
      isComplete
      completedAt
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
    }
  }
`;

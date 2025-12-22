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
      tags {
        id
        name
        color
        description
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
      tags {
        id
        name
        color
        description
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

export const CREATE_LICENSE = gql`
  mutation CreateLicense($input: LicenseInput!) {
    createLicense(input: $input) {
      id
      name
      description
      level
      isActive
      customAttrs
      customAttrs
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
      level
      isActive
      customAttrs
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
    addProductToSolutionEnhanced(solutionId: $solutionId, productId: $productId, order: $order)
  }
`;

export const REMOVE_PRODUCT_FROM_SOLUTION_ENHANCED = gql`
  mutation RemoveProductFromSolution($solutionId: ID!, $productId: ID!) {
    removeProductFromSolutionEnhanced(solutionId: $solutionId, productId: $productId)
  }
`;


export const REORDER_PRODUCTS_IN_SOLUTION = gql`
  mutation ReorderProductsInSolution($solutionId: ID!, $productOrders: [ProductOrderInput!]!) {
    reorderProductsInSolution(solutionId: $solutionId, productOrders: $productOrders)
  }
`;

export const IMPORT_PRODUCT_FROM_EXCEL = gql`
  mutation ImportProductFromExcel($content: String!, $mode: ImportMode!) {
    importProductFromExcel(content: $content, mode: $mode) {
      success
      productId
      productName
      stats {
        tasksImported
        outcomesImported
        releasesImported
        licensesImported
        customAttributesImported
        telemetryAttributesImported
      }
      errors {
        sheet
        row
        column
        field
        message
        severity
      }
      warnings {
        sheet
        row
        column
        field
        message
        severity
      }
    }
  }
`;

export const CREATE_PRODUCT_TAG = gql`
  mutation CreateProductTag($input: ProductTagInput!) {
    createProductTag(input: $input) {
      id
      productId
      name
      color
      description
      displayOrder
    }
  }
`;

export const UPDATE_PRODUCT_TAG = gql`
  mutation UpdateProductTag($id: ID!, $input: ProductTagUpdateInput!) {
    updateProductTag(id: $id, input: $input) {
      id
      productId
      name
      color
      description
      displayOrder
    }
  }
`;

export const DELETE_PRODUCT_TAG = gql`
  mutation DeleteProductTag($id: ID!) {
    deleteProductTag(id: $id)
  }
`;

export const SET_TASK_TAGS = gql`
  mutation SetTaskTags($taskId: ID!, $tagIds: [ID!]!) {
    setTaskTags(taskId: $taskId, tagIds: $tagIds) {
      id
      tags {
        id
        name
        color
        description
      }
    }
  }
`;

export const ADD_TAG_TO_TASK = gql`
  mutation AddTagToTask($taskId: ID!, $tagId: ID!) {
    addTagToTask(taskId: $taskId, tagId: $tagId) {
      id
      tags {
        id
        name
        color
        description
      }
    }
  }
`;

export const REMOVE_TAG_FROM_TASK = gql`
  mutation RemoveTagFromTask($taskId: ID!, $tagId: ID!) {
    removeTagFromTask(taskId: $taskId, tagId: $tagId) {
      id
      tags {
        id
        name
        color
        description
      }
    }
  }
`;

export const CREATE_SOLUTION_TAG = gql`
  mutation CreateSolutionTag($input: SolutionTagInput!) {
    createSolutionTag(input: $input) {
      id
      solutionId
      name
      color
      description
      displayOrder
    }
  }
`;

export const UPDATE_SOLUTION_TAG = gql`
  mutation UpdateSolutionTag($id: ID!, $input: SolutionTagUpdateInput!) {
    updateSolutionTag(id: $id, input: $input) {
      id
      solutionId
      name
      color
      description
      displayOrder
    }
  }
`;

export const DELETE_SOLUTION_TAG = gql`
  mutation DeleteSolutionTag($id: ID!) {
     deleteSolutionTag(id: $id)
  }
`;

export const SET_SOLUTION_TASK_TAGS = gql`
  mutation SetSolutionTaskTags($taskId: ID!, $tagIds: [ID!]!) {
     setSolutionTaskTags(taskId: $taskId, tagIds: $tagIds) {
       id
       solutionTags {
         id
         name
         color
         description
       }
     }
  }
`;

export const ADD_SOLUTION_TAG_TO_TASK = gql`
  mutation AddSolutionTagToTask($taskId: ID!, $tagId: ID!) {
    addSolutionTagToTask(taskId: $taskId, tagId: $tagId) {
      id
      solutionTags {
        id
        name
        color
        description
      }
    }
  }
`;

export const REMOVE_SOLUTION_TAG_FROM_TASK = gql`
  mutation RemoveSolutionTagFromTask($taskId: ID!, $tagId: ID!) {
    removeSolutionTagFromTask(taskId: $taskId, tagId: $tagId) {
      id
      solutionTags {
        id
        name
        color
        description
      }
    }
  }
`;

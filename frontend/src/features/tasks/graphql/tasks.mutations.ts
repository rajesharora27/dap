import { gql } from '@apollo/client';

export const REORDER_TASKS = gql`
  mutation ReorderTasks($productId: ID, $solutionId: ID, $order: [ID!]!) {
    reorderTasks(productId: $productId, solutionId: $solutionId, order: $order)
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

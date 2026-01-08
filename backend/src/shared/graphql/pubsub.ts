import { PubSub } from 'graphql-subscriptions';

// Single instance for the application
export const pubsub = new PubSub();

export const EVENTS = {
    IMPORT_PROGRESS: 'IMPORT_PROGRESS',
};

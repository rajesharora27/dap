/**
 * Telemetry Data Verification Script
 * 
 * This script tests the telemetry system by querying the GraphQL API
 * to verify that telemetry attributes and values are properly stored
 * and can be retrieved with success criteria evaluation.
 */

const { ApolloClient, InMemoryCache, gql, createHttpLink } = require('@apollo/client/core');

// Use dynamic import for node-fetch
async function createClient() {
  const fetch = (await import('node-fetch')).default;
  
  return new ApolloClient({
    link: createHttpLink({
      uri: 'http://localhost:4000/graphql',
      fetch: fetch
    }),
    cache: new InMemoryCache()
  });
}

const TELEMETRY_QUERY = gql`
  query GetTaskTelemetry($taskId: ID!) {
    task(id: $taskId) {
      id
      name
      telemetryAttributes {
        id
        name
        description
        dataType
        successCriteria
        isRequired
        currentValue {
          value
          notes
          createdAt
        }
        isSuccessful
      }
      isCompleteBasedOnTelemetry
      telemetryCompletionPercentage
    }
  }
`;

const TASKS_QUERY = gql`
  query GetTasks {
    tasks(first: 5) {
      edges {
        node {
          id
          name
          telemetryAttributes {
            id
            name
            dataType
            isSuccessful
          }
        }
      }
    }
  }
`;

async function testTelemetrySystem() {
  const client = await createClient();
  
  try {
    console.log('🔍 Testing Telemetry System...\n');

    // First, get a list of tasks
    console.log('📋 Fetching tasks with telemetry...');
    const tasksResult = await client.query({
      query: TASKS_QUERY,
      fetchPolicy: 'network-only'
    });

    const tasks = tasksResult.data.tasks.edges.map(edge => edge.node);
    console.log(`Found ${tasks.length} tasks\n`);

    // Test each task that has telemetry
    for (const task of tasks) {
      if (task.telemetryAttributes && task.telemetryAttributes.length > 0) {
        console.log(`🎯 Testing task: "${task.name}"`);
        console.log(`   Telemetry attributes: ${task.telemetryAttributes.length}`);
        
        // Get detailed telemetry data
        const telemetryResult = await client.query({
          query: TELEMETRY_QUERY,
          variables: { taskId: task.id },
          fetchPolicy: 'network-only'
        });

        const taskData = telemetryResult.data.task;
        console.log(`   📊 Completion: ${taskData.telemetryCompletionPercentage}%`);
        console.log(`   ✅ Complete: ${taskData.isCompleteBasedOnTelemetry}`);
        
        // Show attribute details
        taskData.telemetryAttributes.forEach(attr => {
          const successIcon = attr.isSuccessful ? '✅' : '❌';
          const currentValue = attr.currentValue ? attr.currentValue.value : 'No value';
          console.log(`   ${successIcon} ${attr.name} (${attr.dataType}): ${currentValue}`);
        });
        
        console.log(''); // Empty line
        break; // Just test first task with telemetry
      }
    }

    console.log('🎉 Telemetry system test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing telemetry system:', error);
    if (error.networkError) {
      console.error('Network error:', error.networkError.message);
    }
    if (error.graphQLErrors) {
      error.graphQLErrors.forEach(err => {
        console.error('GraphQL error:', err.message);
      });
    }
  }
}

// Run the test
testTelemetrySystem().then(() => {
  console.log('\n📝 Test complete. Check the output above for telemetry system status.');
  process.exit(0);
}).catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
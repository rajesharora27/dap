const { ApolloClient, InMemoryCache, gql, HttpLink } = require('@apollo/client');
const fetch = require('cross-fetch');

const client = new ApolloClient({
  link: new HttpLink({ uri: 'http://localhost:4000/graphql', fetch }),
  cache: new InMemoryCache(),
});

// GraphQL Mutations and Queries
const CREATE_PRODUCT_MUTATION = gql`
  mutation CreateProduct($input: ProductInput!) {
    createProduct(input: $input) {
      id
      name
      description
      customAttrs
    }
  }
`;

const CREATE_LICENSE_MUTATION = gql`
  mutation CreateLicense($input: LicenseInput!) {
    createLicense(input: $input) {
      id
      name
      level
      description
      isActive
    }
  }
`;

const CREATE_OUTCOME_MUTATION = gql`
  mutation CreateOutcome($input: OutcomeInput!) {
    createOutcome(input: $input) {
      id
      name
      description
    }
  }
`;

const CREATE_RELEASE_MUTATION = gql`
  mutation CreateRelease($input: ReleaseInput!) {
    createRelease(input: $input) {
      id
      name
      level
      description
      isActive
    }
  }
`;

const CREATE_TASK_MUTATION = gql`
  mutation CreateTask($input: TaskInput!) {
    createTask(input: $input) {
      id
      name
      description
      howToDoc
      howToVideo
      weight
      estMinutes
      priority
      notes
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
      }
      isCompleteBasedOnTelemetry
      telemetryCompletionPercentage
    }
  }
`;

const CREATE_TELEMETRY_ATTRIBUTE_MUTATION = gql`
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
      isSuccessful
    }
  }
`;

const CREATE_TELEMETRY_VALUE_MUTATION = gql`
  mutation AddTelemetryValue($input: TelemetryValueInput!) {
    addTelemetryValue(input: $input) {
      id
      attributeId
      value
      source
      batchId
      notes
      createdAt
    }
  }
`;

const GET_COMPREHENSIVE_PRODUCT_QUERY = gql`
  query GetComprehensiveProduct($id: ID!) {
    product(id: $id) {
      id
      name
      description
      customAttrs
      licenses {
        id
        name
        level
        description
        isActive
      }
      outcomes {
        id
        name
        description
      }
      releases {
        id
        name
        level
        description
        isActive
      }
    }
    tasks(productId: $id, first: 50) {
      edges {
        node {
          id
          name
          description
          howToDoc
          howToVideo
          weight
          estMinutes
          priority
          notes
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
          isCompleteBasedOnTelemetry
          telemetryCompletionPercentage
        }
      }
    }
  }
`;

async function runComprehensiveTelemetryTest() {
  console.log('🚀 Starting COMPREHENSIVE Telemetry End-to-End Test...');
  console.log('='.repeat(70));

  const timestamp = Date.now();
  
  // Step 1: Create Product with all attributes
  console.log('\n📦 Step 1: Creating comprehensive product...');
  const productInput = {
    name: `TelemetryTestProduct-${timestamp}`,
    description: 'Full-featured test product with telemetry capabilities',
    customAttrs: {
      version: '2.0.0',
      environment: 'test',
      category: 'telemetry-test',
      priority: 'high',
      telemetryEnabled: true
    }
  };

  let productId;
  try {
    const { data } = await client.mutate({
      mutation: CREATE_PRODUCT_MUTATION,
      variables: { input: productInput },
    });
    productId = data.createProduct.id;
    console.log(`   ✅ Product created: ${data.createProduct.name} (${productId})`);
    console.log(`   📄 Description: ${data.createProduct.description}`);
    console.log(`   ⚙️ Custom Attrs: ${JSON.stringify(data.createProduct.customAttrs, null, 2)}`);
  } catch (error) {
    console.error('❌ Failed to create product:', error.message);
    return;
  }

  // Step 2: Create Licenses
  console.log('\n🔑 Step 2: Creating licenses...');
  const licenses = [
    { name: 'Basic License', level: 1, description: 'Basic tier license', productId },
    { name: 'Professional License', level: 2, description: 'Professional tier license', productId },
    { name: 'Enterprise License', level: 3, description: 'Enterprise tier license', productId }
  ];

  const createdLicenses = [];
  for (const license of licenses) {
    try {
      const { data } = await client.mutate({
        mutation: CREATE_LICENSE_MUTATION,
        variables: { input: license },
      });
      createdLicenses.push(data.createLicense);
      console.log(`   ✅ License: ${data.createLicense.name} (Level ${data.createLicense.level})`);
    } catch (error) {
      console.error(`❌ Failed to create license ${license.name}:`, error.message);
    }
  }

  // Step 3: Create Outcomes
  console.log('\n🎯 Step 3: Creating outcomes...');
  const outcomes = [
    { name: 'User Authentication', description: 'Users can authenticate securely', productId },
    { name: 'Data Processing', description: 'System processes data efficiently', productId },
    { name: 'Performance Metrics', description: 'System meets performance benchmarks', productId }
  ];

  const createdOutcomes = [];
  for (const outcome of outcomes) {
    try {
      const { data } = await client.mutate({
        mutation: CREATE_OUTCOME_MUTATION,
        variables: { input: outcome },
      });
      createdOutcomes.push(data.createOutcome);
      console.log(`   ✅ Outcome: ${data.createOutcome.name}`);
    } catch (error) {
      console.error(`❌ Failed to create outcome ${outcome.name}:`, error.message);
    }
  }

  // Step 4: Create Releases
  console.log('\n🚀 Step 4: Creating releases...');
  const releases = [
    { name: 'Alpha Release', level: 0.1, description: 'Initial alpha release', productId, isActive: true },
    { name: 'Beta Release', level: 0.9, description: 'Beta testing release', productId, isActive: true },
    { name: 'Production Release', level: 1.0, description: 'Production ready release', productId, isActive: true }
  ];

  const createdReleases = [];
  for (const release of releases) {
    try {
      const { data } = await client.mutate({
        mutation: CREATE_RELEASE_MUTATION,
        variables: { input: release },
      });
      createdReleases.push(data.createRelease);
      console.log(`   ✅ Release: ${data.createRelease.name} (Level ${data.createRelease.level})`);
    } catch (error) {
      console.error(`❌ Failed to create release ${release.name}:`, error.message);
    }
  }

  // Step 5: Create Tasks with Telemetry
  console.log('\n📋 Step 5: Creating tasks with telemetry integration...');
  const tasks = [
    {
      productId,
      name: 'Implement User Registration',
      description: 'Create user registration functionality with validation',
      estMinutes: 120,
      weight: 8.0,
      priority: 'High',
      howToDoc: 'https://docs.example.com/user-registration',
      howToVideo: 'https://videos.example.com/user-registration',
      notes: 'Include email validation and password strength requirements',
      outcomeIds: createdOutcomes.filter(o => o.name.includes('Authentication')).map(o => o.id),
      licenseId: createdLicenses[0]?.id,
      releaseIds: [createdReleases[0]?.id, createdReleases[1]?.id]
    },
    {
      productId,
      name: 'Setup Database Performance Monitoring',
      description: 'Implement comprehensive database performance monitoring',
      estMinutes: 180,
      weight: 6.5,
      priority: 'medium',
      howToDoc: 'https://docs.example.com/db-monitoring',
      notes: 'Monitor query performance, connection pools, and resource usage',
      outcomeIds: createdOutcomes.filter(o => o.name.includes('Performance')).map(o => o.id),
      licenseId: createdLicenses[1]?.id,
      releaseIds: [createdReleases[1]?.id, createdReleases[2]?.id]
    },
    {
      productId,
      name: 'Data Processing Pipeline',
      description: 'Build automated data processing pipeline',
      estMinutes: 240,
      weight: 9.0,
      priority: 'High',
      howToDoc: 'https://docs.example.com/data-pipeline',
      howToVideo: 'https://videos.example.com/data-pipeline',
      notes: 'Handle batch and real-time data processing',
      outcomeIds: createdOutcomes.filter(o => o.name.includes('Data Processing')).map(o => o.id),
      licenseId: createdLicenses[2]?.id,
      releaseIds: [createdReleases[2]?.id]
    }
  ];

  const createdTasks = [];
  for (const [index, task] of tasks.entries()) {
    try {
      const { data } = await client.mutate({
        mutation: CREATE_TASK_MUTATION,
        variables: { input: task },
      });
      createdTasks.push(data.createTask);
      console.log(`   ✅ Task ${index + 1}: ${data.createTask.name} (${data.createTask.id})`);
      console.log(`      📊 Weight: ${data.createTask.weight}, Est: ${data.createTask.estMinutes} min`);
      console.log(`      📄 How-to Doc: ${data.createTask.howToDoc || 'None'}`);
      console.log(`      🎥 How-to Video: ${data.createTask.howToVideo || 'None'}`);
      console.log(`      🔗 Outcomes: ${data.createTask.outcomes?.length || 0}`);
      console.log(`      🔑 License: ${data.createTask.license?.name || 'None'}`);
      console.log(`      🚀 Releases: ${data.createTask.releases?.length || 0}`);
    } catch (error) {
      console.error(`❌ Failed to create task ${task.name}:`, error.message);
    }
  }

  // Step 6: Create Telemetry Attributes for Tasks
  console.log('\n📊 Step 6: Creating telemetry attributes...');
  const telemetryAttributesData = [
    // For User Registration Task
    {
      taskId: createdTasks[0]?.id,
      name: 'Registration Success Rate',
      description: 'Percentage of successful user registrations',
      dataType: 'NUMBER',
      isRequired: true,
      successCriteria: JSON.stringify({ operator: 'gte', value: 95 }),
      order: 1
    },
    {
      taskId: createdTasks[0]?.id,
      name: 'Registration Response Time',
      description: 'Average response time for registration requests',
      dataType: 'NUMBER',
      isRequired: true,
      successCriteria: JSON.stringify({ operator: 'lte', value: 2000 }),
      order: 2
    },
    {
      taskId: createdTasks[0]?.id,
      name: 'Email Validation Rate',
      description: 'Percentage of emails successfully validated',
      dataType: 'NUMBER',
      isRequired: false,
      successCriteria: JSON.stringify({ operator: 'gte', value: 98 }),
      order: 3
    },
    // For Database Performance Task
    {
      taskId: createdTasks[1]?.id,
      name: 'Query Performance',
      description: 'Average database query execution time',
      dataType: 'NUMBER',
      isRequired: true,
      successCriteria: JSON.stringify({ operator: 'lte', value: 100 }),
      order: 1
    },
    {
      taskId: createdTasks[1]?.id,
      name: 'Connection Pool Health',
      description: 'Database connection pool utilization percentage',
      dataType: 'NUMBER',
      isRequired: true,
      successCriteria: JSON.stringify({ operator: 'and', conditions: [
        { operator: 'gte', value: 10 },
        { operator: 'lte', value: 80 }
      ]}),
      order: 2
    },
    {
      taskId: createdTasks[1]?.id,
      name: 'Monitoring System Active',
      description: 'Whether monitoring system is active and reporting',
      dataType: 'BOOLEAN',
      isRequired: true,
      successCriteria: JSON.stringify({ operator: 'eq', value: true }),
      order: 3
    },
    // For Data Processing Pipeline Task
    {
      taskId: createdTasks[2]?.id,
      name: 'Processing Throughput',
      description: 'Records processed per minute',
      dataType: 'NUMBER',
      isRequired: true,
      successCriteria: JSON.stringify({ operator: 'gte', value: 1000 }),
      order: 1
    },
    {
      taskId: createdTasks[2]?.id,
      name: 'Error Rate',
      description: 'Percentage of processing errors',
      dataType: 'NUMBER',
      isRequired: true,
      successCriteria: JSON.stringify({ operator: 'lte', value: 1 }),
      order: 2
    },
    {
      taskId: createdTasks[2]?.id,
      name: 'Pipeline Status',
      description: 'Current status of the data pipeline',
      dataType: 'STRING',
      isRequired: true,
      successCriteria: JSON.stringify({ operator: 'eq', value: 'running' }),
      order: 3
    }
  ];

  const createdTelemetryAttributes = [];
  for (const [index, attr] of telemetryAttributesData.entries()) {
    if (!attr.taskId) {
      console.log(`   ⚠️ Skipping attribute ${index + 1} - no task ID`);
      continue;
    }
    
    try {
      const { data } = await client.mutate({
        mutation: CREATE_TELEMETRY_ATTRIBUTE_MUTATION,
        variables: { input: attr },
      });
      createdTelemetryAttributes.push(data.createTelemetryAttribute);
      console.log(`   ✅ Telemetry Attribute ${index + 1}: ${data.createTelemetryAttribute.name}`);
      console.log(`      📊 Type: ${data.createTelemetryAttribute.dataType}, Required: ${data.createTelemetryAttribute.isRequired}`);
      console.log(`      🎯 Success Criteria: ${JSON.stringify(data.createTelemetryAttribute.successCriteria)}`);
    } catch (error) {
      console.error(`❌ Failed to create telemetry attribute ${attr.name}:`, error.message);
    }
  }

  // Step 7: Create Sample Telemetry Values
  console.log('\n📈 Step 7: Creating sample telemetry values...');
  const telemetryValues = [
    // Registration Success Rate values
    { attributeId: createdTelemetryAttributes[0]?.id, value: 97.5, source: 'analytics_system', notes: 'Daily average' },
    { attributeId: createdTelemetryAttributes[0]?.id, value: 96.8, source: 'analytics_system', notes: 'Weekly average' },
    
    // Registration Response Time values
    { attributeId: createdTelemetryAttributes[1]?.id, value: 1800, source: 'performance_monitor', notes: 'Average response time in ms' },
    { attributeId: createdTelemetryAttributes[1]?.id, value: 1750, source: 'performance_monitor', notes: 'Optimized response time' },
    
    // Email Validation Rate values
    { attributeId: createdTelemetryAttributes[2]?.id, value: 99.2, source: 'email_service', notes: 'Email validation success rate' },
    
    // Query Performance values
    { attributeId: createdTelemetryAttributes[3]?.id, value: 85, source: 'db_monitor', notes: 'Average query time in ms' },
    { attributeId: createdTelemetryAttributes[3]?.id, value: 78, source: 'db_monitor', notes: 'Optimized query time' },
    
    // Connection Pool Health values
    { attributeId: createdTelemetryAttributes[4]?.id, value: 65, source: 'db_monitor', notes: 'Connection pool utilization %' },
    
    // Monitoring System Active values
    { attributeId: createdTelemetryAttributes[5]?.id, value: true, source: 'system_health', notes: 'Monitoring system status' },
    
    // Processing Throughput values
    { attributeId: createdTelemetryAttributes[6]?.id, value: 1250, source: 'pipeline_monitor', notes: 'Records per minute' },
    { attributeId: createdTelemetryAttributes[6]?.id, value: 1350, source: 'pipeline_monitor', notes: 'Peak throughput' },
    
    // Error Rate values
    { attributeId: createdTelemetryAttributes[7]?.id, value: 0.5, source: 'pipeline_monitor', notes: 'Processing error percentage' },
    
    // Pipeline Status values
    { attributeId: createdTelemetryAttributes[8]?.id, value: 'running', source: 'pipeline_monitor', notes: 'Current pipeline status' }
  ];

  const createdTelemetryValues = [];
  for (const [index, value] of telemetryValues.entries()) {
    if (!value.attributeId) {
      console.log(`   ⚠️ Skipping value ${index + 1} - no attribute ID`);
      continue;
    }
    
    try {
      const { data } = await client.mutate({
        mutation: CREATE_TELEMETRY_VALUE_MUTATION,
        variables: { input: value },
      });
      createdTelemetryValues.push(data.addTelemetryValue);
      console.log(`   ✅ Telemetry Value ${index + 1}: ${JSON.stringify(data.addTelemetryValue.value)} (${data.addTelemetryValue.source})`);
    } catch (error) {
      console.error(`❌ Failed to create telemetry value ${index + 1}:`, error.message);
    }
  }

  // Step 8: Comprehensive Verification with Telemetry
  console.log('\n🔍 Step 8: Comprehensive verification with telemetry...');
  try {
    const { data } = await client.query({
      query: GET_COMPREHENSIVE_PRODUCT_QUERY,
      variables: { id: productId },
      fetchPolicy: 'network-only', // Force fresh data
    });

    console.log('\n📊 FINAL VERIFICATION RESULTS:');
    console.log('='.repeat(50));
    
    console.log(`\n📦 Product: ${data.product.name}`);
    console.log(`   📄 Description: ${data.product.description}`);
    console.log(`   ⚙️ Custom Attributes: ${JSON.stringify(data.product.customAttrs, null, 2)}`);
    
    console.log(`\n🔑 Licenses (${data.product.licenses.length}):`);
    data.product.licenses.forEach(license => {
      console.log(`   • ${license.name} (Level ${license.level}) - Active: ${license.isActive}`);
    });
    
    console.log(`\n🎯 Outcomes (${data.product.outcomes.length}):`);
    data.product.outcomes.forEach(outcome => {
      console.log(`   • ${outcome.name}: ${outcome.description}`);
    });
    
    console.log(`\n🚀 Releases (${data.product.releases.length}):`);
    data.product.releases.forEach(release => {
      console.log(`   • ${release.name} (Level ${release.level}) - Active: ${release.isActive}`);
    });
    
    console.log(`\n📋 Tasks with Telemetry (${data.tasks.edges.length}):`);
    data.tasks.edges.forEach((edge, index) => {
      const task = edge.node;
      console.log(`\n   Task ${index + 1}: ${task.name}`);
      console.log(`   📊 Weight: ${task.weight}, Est: ${task.estMinutes} min, Priority: ${task.priority}`);
      console.log(`   🔗 Outcomes: ${task.outcomes?.length || 0}, License: ${task.license?.name || 'None'}`);
      console.log(`   🚀 Releases: ${task.releases?.length || 0}`);
      console.log(`   📄 How-to Doc: ${task.howToDoc || 'None'}`);
      console.log(`   🎥 How-to Video: ${task.howToVideo || 'None'}`);
      console.log(`   📊 Telemetry Completion: ${task.telemetryCompletionPercentage}%`);
      console.log(`   ✅ Complete Based on Telemetry: ${task.isCompleteBasedOnTelemetry}`);
      
      if (task.telemetryAttributes && task.telemetryAttributes.length > 0) {
        console.log(`   📈 Telemetry Attributes (${task.telemetryAttributes.length}):`);
        task.telemetryAttributes.forEach(attr => {
          console.log(`      • ${attr.name} (${attr.dataType}${attr.isRequired ? ', Required' : ''})`);
          console.log(`        🎯 Success: ${attr.isSuccessful}, Current: ${attr.currentValue ? JSON.stringify(attr.currentValue.value) : 'None'}`);
          console.log(`        📋 Criteria: ${JSON.stringify(attr.successCriteria)}`);
        });
      } else {
        console.log(`   📈 No telemetry attributes configured`);
      }
    });

    // Summary Statistics
    const totalTasks = data.tasks.edges.length;
    const tasksWithTelemetry = data.tasks.edges.filter(edge => 
      edge.node.telemetryAttributes && edge.node.telemetryAttributes.length > 0
    ).length;
    const totalTelemetryAttributes = data.tasks.edges.reduce((sum, edge) => 
      sum + (edge.node.telemetryAttributes?.length || 0), 0
    );
    const completedTasksByTelemetry = data.tasks.edges.filter(edge => 
      edge.node.isCompleteBasedOnTelemetry
    ).length;
    const avgTelemetryCompletion = data.tasks.edges.reduce((sum, edge) => 
      sum + edge.node.telemetryCompletionPercentage, 0
    ) / totalTasks;

    console.log('\n📊 TELEMETRY SUMMARY STATISTICS:');
    console.log('='.repeat(50));
    console.log(`📋 Total Tasks: ${totalTasks}`);
    console.log(`📈 Tasks with Telemetry: ${tasksWithTelemetry} (${((tasksWithTelemetry/totalTasks)*100).toFixed(1)}%)`);
    console.log(`📊 Total Telemetry Attributes: ${totalTelemetryAttributes}`);
    console.log(`✅ Tasks Completed by Telemetry: ${completedTasksByTelemetry}`);
    console.log(`📈 Average Telemetry Completion: ${avgTelemetryCompletion.toFixed(1)}%`);

  } catch (error) {
    console.error('❌ Failed final verification:', error.message);
    if (error.graphQLErrors) {
      error.graphQLErrors.forEach(err => console.error('   GraphQL Error:', err.message));
    }
  }

  console.log('\n✅ COMPREHENSIVE TELEMETRY TEST COMPLETED!');
  console.log('='.repeat(70));
}

// Run the test
runComprehensiveTelemetryTest().catch(console.error);
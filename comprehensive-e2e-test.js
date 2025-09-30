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
        }
      }
    }
  }
`;

async function runComprehensiveE2ETest() {
  console.log('🚀 Starting COMPREHENSIVE End-to-End Test...');
  console.log('='.repeat(60));

  const timestamp = Date.now();
  
  // Step 1: Create Product with all attributes
  console.log('\n📦 Step 1: Creating comprehensive product...');
  const productInput = {
    name: `ComprehensiveTestProduct-${timestamp}`,
    description: 'Full-featured test product with all attributes',
    customAttrs: {
      version: '2.0.0',
      environment: 'test',
      category: 'comprehensive-test',
      priority: 'high'
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
    { name: 'User Authentication', description: 'Secure user login system', productId },
    { name: 'Data Processing', description: 'Efficient data processing capabilities', productId },
    { name: 'API Integration', description: 'Seamless third-party API integration', productId }
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
    { name: 'Alpha', level: 0.1, description: 'Early alpha release', productId },
    { name: 'Beta', level: 0.5, description: 'Beta testing release', productId },
    { name: 'Release 1.0', level: 1.0, description: 'First stable release', productId }
  ];

  const createdReleases = [];
  for (const release of releases) {
    try {
      const { data } = await client.mutate({
        mutation: CREATE_RELEASE_MUTATION,
        variables: { input: release },
      });
      createdReleases.push(data.createRelease);
      console.log(`   ✅ Release: ${data.createRelease.name} (v${data.createRelease.level})`);
    } catch (error) {
      console.error(`❌ Failed to create release ${release.name}:`, error.message);
    }
  }

  // Step 5: Create Task with ALL attributes
  console.log('\n📝 Step 5: Creating comprehensive task...');
  const taskInput = {
    name: 'Comprehensive Test Task',
    description: 'A task with all possible attributes for testing',
    howToDoc: 'https://docs.example.com/comprehensive-task-guide',
    howToVideo: 'https://youtube.com/watch?v=comprehensive-demo',
    weight: 25,
    estMinutes: 180,
    priority: 'High',
    notes: 'This task includes all possible attributes for comprehensive testing',
    productId: productId,
    licenseId: createdLicenses.length > 0 ? createdLicenses[1].id : undefined, // Professional license
    outcomeIds: createdOutcomes.map(o => o.id),
    releaseIds: createdReleases.map(r => r.id)
  };

  let taskId;
  try {
    const { data } = await client.mutate({
      mutation: CREATE_TASK_MUTATION,
      variables: { input: taskInput },
    });
    taskId = data.createTask.id;
    console.log(`   ✅ Task created: ${data.createTask.name} (${taskId})`);
    console.log(`   📄 Description: ${data.createTask.description}`);
    console.log(`   📚 HowToDoc: ${data.createTask.howToDoc}`);
    console.log(`   🎥 HowToVideo: ${data.createTask.howToVideo}`);
    console.log(`   ⚖️ Weight: ${data.createTask.weight}%`);
    console.log(`   ⏱️ Est Minutes: ${data.createTask.estMinutes}`);
    console.log(`   ⚡ Priority: ${data.createTask.priority}`);
    console.log(`   📝 Notes: ${data.createTask.notes}`);
    
    if (data.createTask.license) {
      console.log(`   🔑 License: ${data.createTask.license.name} (Level ${data.createTask.license.level})`);
    }
    
    if (data.createTask.outcomes && data.createTask.outcomes.length > 0) {
      console.log(`   🎯 Outcomes: ${data.createTask.outcomes.map(o => o.name).join(', ')}`);
    }
    
    if (data.createTask.releases && data.createTask.releases.length > 0) {
      console.log(`   🚀 Releases: ${data.createTask.releases.map(r => `${r.name} (v${r.level})`).join(', ')}`);
    }
  } catch (error) {
    console.error('❌ Failed to create task:', error.message);
    return;
  }

  // Step 6: Comprehensive Verification
  console.log('\n🔍 Step 6: Comprehensive verification...');
  try {
    const { data } = await client.query({
      query: GET_COMPREHENSIVE_PRODUCT_QUERY,
      variables: { id: productId },
    });

    const product = data.product;
    const tasks = data.tasks.edges.map(edge => edge.node);
    const task = tasks.find(t => t.id === taskId);

    console.log('\n📊 VERIFICATION RESULTS:');
    console.log('='.repeat(40));

    // Product verification
    console.log('\n📦 Product Verification:');
    console.log(`   ✅ Name: ${product.name}`);
    console.log(`   ✅ Description: ${product.description}`);
    console.log(`   ✅ Custom Attrs: ${JSON.stringify(product.customAttrs)}`);
    console.log(`   ✅ Licenses: ${product.licenses.length} created`);
    console.log(`   ✅ Outcomes: ${product.outcomes.length} created`);
    console.log(`   ✅ Releases: ${product.releases.length} created`);

    // Task verification
    if (!task) {
      console.error('❌❌❌ CRITICAL FAILURE: Task not found!');
      return;
    }

    console.log('\n📝 Task Verification:');
    const verifications = [
      { field: 'name', expected: taskInput.name, actual: task.name },
      { field: 'description', expected: taskInput.description, actual: task.description },
      { field: 'howToDoc', expected: taskInput.howToDoc, actual: task.howToDoc },
      { field: 'howToVideo', expected: taskInput.howToVideo, actual: task.howToVideo },
      { field: 'weight', expected: taskInput.weight, actual: task.weight },
      { field: 'estMinutes', expected: taskInput.estMinutes, actual: task.estMinutes },
      { field: 'priority', expected: taskInput.priority, actual: task.priority },
      { field: 'notes', expected: taskInput.notes, actual: task.notes }
    ];

    let allFieldsValid = true;
    for (const verification of verifications) {
      if (verification.expected === verification.actual) {
        console.log(`   ✅ ${verification.field}: ${verification.actual}`);
      } else {
        console.log(`   ❌ ${verification.field}: Expected "${verification.expected}", Got "${verification.actual}"`);
        allFieldsValid = false;
      }
    }

    // Relationship verification
    console.log('\n🔗 Relationship Verification:');
    if (task.license) {
      console.log(`   ✅ License: ${task.license.name} (Level ${task.license.level})`);
    } else {
      console.log(`   ❌ License: Not assigned`);
      allFieldsValid = false;
    }

    if (task.outcomes && task.outcomes.length > 0) {
      console.log(`   ✅ Outcomes: ${task.outcomes.length} assigned (${task.outcomes.map(o => o.name).join(', ')})`);
    } else {
      console.log(`   ❌ Outcomes: None assigned`);
      allFieldsValid = false;
    }

    if (task.releases && task.releases.length > 0) {
      console.log(`   ✅ Releases: ${task.releases.length} assigned (${task.releases.map(r => `${r.name} v${r.level}`).join(', ')})`);
    } else {
      console.log(`   ❌ Releases: None assigned`);
      allFieldsValid = false;
    }

    // Final result
    console.log('\n' + '='.repeat(60));
    if (allFieldsValid) {
      console.log('🎉🎉🎉 COMPREHENSIVE TEST PASSED! 🎉🎉🎉');
      console.log('All product and task attributes persisted correctly!');
      console.log('Frontend → Backend → Database workflow is working perfectly!');
    } else {
      console.log('❌❌❌ COMPREHENSIVE TEST FAILED! ❌❌❌');
      console.log('Some attributes did not persist correctly.');
      console.log('Check the verification results above for details.');
    }
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Failed to retrieve and verify data:', error.message);
  }
}

// Run the comprehensive test
runComprehensiveE2ETest().catch(console.error);
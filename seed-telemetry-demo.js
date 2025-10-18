/**
 * Telemetry Demo Data Seeder
 * 
 * Creates a complete demo environment for testing telemetry export/import:
 * - Customer: "Acme Corporation"
 * - Product: "Cloud Platform Pro" with telemetry-enabled tasks
 * - Assignment: "Q1 2025 Deployment"
 * - Adoption Plan with multiple tasks containing telemetry attributes
 * 
 * Usage:
 *   node seed-telemetry-demo.js
 */

const http = require('http');

const BACKEND_HOST = 'localhost';
const BACKEND_PORT = 4000;
const GRAPHQL_ENDPOINT = '/graphql';

// Helper function to make GraphQL request
function graphqlRequest(query, variables = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query, variables });
    
    const options = {
      hostname: BACKEND_HOST,
      port: BACKEND_PORT,
      path: GRAPHQL_ENDPOINT,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          if (result.errors) {
            console.error('GraphQL errors:', JSON.stringify(result.errors, null, 2));
            reject(new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`));
          } else {
            resolve(result.data);
          }
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Step 1: Create Product with Telemetry-enabled Tasks
async function createProduct() {
  console.log('\n📦 Creating product: Cloud Platform Pro...');
  
  const mutation = `
    mutation CreateProduct($input: ProductInput!) {
      createProduct(input: $input) {
        id
        name
        description
      }
    }
  `;

  const timestamp = Date.now();
  const input = {
    name: `Cloud Platform Pro ${timestamp}`,
    description: "Enterprise cloud platform with advanced telemetry capabilities (Demo)"
  };

  const result = await graphqlRequest(mutation, { input });
  console.log('✅ Product created:', result.createProduct.id);
  return result.createProduct.id;
}

// Step 2: Create Tasks with Telemetry Attributes
async function createTasks(productId) {
  console.log('\n📋 Creating tasks with telemetry attributes...');
  
  const tasks = [
    {
      name: "Initial Setup and Configuration",
      description: "Configure cloud environment and basic settings",
      weight: 10,
      telemetry: [
        { name: "Environment Provisioned", dataType: "BOOLEAN", criteria: { operator: "=", value: true } },
        { name: "Configuration Completion", dataType: "NUMBER", criteria: { operator: ">=", value: 100 } },
        { name: "Setup Duration (hours)", dataType: "NUMBER", criteria: { operator: "<=", value: 8 } }
      ]
    },
    {
      name: "User Training and Documentation",
      description: "Train team members on platform usage",
      weight: 12,
      telemetry: [
        { name: "Users Trained", dataType: "NUMBER", criteria: { operator: ">=", value: 10 } },
        { name: "Training Completion Rate", dataType: "NUMBER", criteria: { operator: ">=", value: 90 } },
        { name: "Documentation Reviewed", dataType: "BOOLEAN", criteria: { operator: "=", value: true } }
      ]
    },
    {
      name: "API Integration",
      description: "Integrate with existing systems via API",
      weight: 15,
      telemetry: [
        { name: "APIs Connected", dataType: "NUMBER", criteria: { operator: ">=", value: 5 } },
        { name: "Integration Success Rate", dataType: "NUMBER", criteria: { operator: ">=", value: 95 } },
        { name: "First Integration Complete", dataType: "BOOLEAN", criteria: { operator: "=", value: true } }
      ]
    },
    {
      name: "Security Hardening",
      description: "Implement security best practices",
      weight: 20,
      telemetry: [
        { name: "Security Scan Passed", dataType: "BOOLEAN", criteria: { operator: "=", value: true } },
        { name: "Vulnerabilities Resolved", dataType: "NUMBER", criteria: { operator: ">=", value: 100 } },
        { name: "Compliance Score", dataType: "NUMBER", criteria: { operator: ">=", value: 90 } }
      ]
    },
    {
      name: "Performance Optimization",
      description: "Optimize system performance and response times",
      weight: 13,
      telemetry: [
        { name: "Average Response Time (ms)", dataType: "NUMBER", criteria: { operator: "<=", value: 200 } },
        { name: "Uptime Target Met", dataType: "BOOLEAN", criteria: { operator: "=", value: true } },
        { name: "Performance Baseline Set", dataType: "BOOLEAN", criteria: { operator: "=", value: true } }
      ]
    },
    {
      name: "Data Migration",
      description: "Migrate existing data to cloud platform",
      weight: 15,
      telemetry: [
        { name: "Records Migrated", dataType: "NUMBER", criteria: { operator: ">=", value: 100000 } },
        { name: "Migration Success Rate", dataType: "NUMBER", criteria: { operator: ">=", value: 99 } },
        { name: "Migration Completed", dataType: "BOOLEAN", criteria: { operator: "=", value: true } }
      ]
    },
    {
      name: "Monitoring and Alerting Setup",
      description: "Configure monitoring dashboards and alert systems",
      weight: 8,
      telemetry: [
        { name: "Dashboards Created", dataType: "NUMBER", criteria: { operator: ">=", value: 3 } },
        { name: "Alert Rules Configured", dataType: "NUMBER", criteria: { operator: ">=", value: 10 } },
        { name: "Monitoring Active", dataType: "BOOLEAN", criteria: { operator: "=", value: true } }
      ]
    },
    {
      name: "User Acceptance Testing",
      description: "Conduct UAT with key stakeholders",
      weight: 7,
      telemetry: [
        { name: "Test Cases Passed", dataType: "NUMBER", criteria: { operator: ">=", value: 95 } },
        { name: "User Satisfaction Score", dataType: "NUMBER", criteria: { operator: ">=", value: 8 } },
        { name: "UAT Sign-off Received", dataType: "BOOLEAN", criteria: { operator: "=", value: true } }
      ]
    }
  ];

  const createTaskMutation = `
    mutation CreateTask($input: TaskCreateInput!) {
      createTask(input: $input) {
        id
        name
      }
    }
  `;

  const createAttributeMutation = `
    mutation CreateTelemetryAttribute($input: TelemetryAttributeInput!) {
      createTelemetryAttribute(input: $input) {
        id
        name
        dataType
        successCriteria
      }
    }
  `;

  const taskIds = [];
  for (const task of tasks) {
    const { telemetry, ...taskInput } = task;
    
    // Create task
    const taskResult = await graphqlRequest(createTaskMutation, {
      input: {
        productId,
        ...taskInput,
        estMinutes: 60,  // Default estimate
      }
    });
    
    const taskId = taskResult.createTask.id;
    taskIds.push(taskId);
    
    // Create telemetry attributes for this task
    for (const attr of telemetry) {
      await graphqlRequest(createAttributeMutation, {
        input: {
          taskId,
          name: attr.name,
          dataType: attr.dataType,
          successCriteria: JSON.stringify(attr.criteria),
          isRequired: true,
          isActive: true
        }
      });
    }
    
    console.log(`✅ Task created: ${taskResult.createTask.name} (${telemetry.length} attributes)`);
  }

  return taskIds;
}

// Step 3: Create Customer
async function createCustomer() {
  console.log('\n👤 Creating customer: Acme Corporation...');
  
  const mutation = `
    mutation CreateCustomer($input: CustomerInput!) {
      createCustomer(input: $input) {
        id
        name
      }
    }
  `;

  const timestamp = Date.now();
  const input = {
    name: `Acme Corporation ${timestamp}`,
    description: "Enterprise customer testing telemetry features (Demo)"
  };

  const result = await graphqlRequest(mutation, { input });
  console.log('✅ Customer created:', result.createCustomer.id);
  return result.createCustomer.id;
}

// Step 4: Assign Product to Customer
async function assignProduct(customerId, productId) {
  console.log('\n🔗 Assigning product to customer...');
  
  const mutation = `
    mutation AssignProduct($input: AssignProductToCustomerInput!) {
      assignProductToCustomer(input: $input) {
        id
        adoptionPlan {
          id
        }
      }
    }
  `;

  const result = await graphqlRequest(mutation, {
    input: {
      customerId,
      productId,
      name: "Q1 2025 Cloud Migration",
      licenseLevel: "Signature",
      selectedOutcomeIds: [],
      selectedReleaseIds: []
    }
  });
  
  console.log('✅ Product assigned, customer product ID:', result.assignProductToCustomer.id);
  
  // Check if adoption plan was created
  if (result.assignProductToCustomer.adoptionPlan) {
    console.log('✅ Adoption plan auto-created:', result.assignProductToCustomer.adoptionPlan.id);
    return {
      customerProductId: result.assignProductToCustomer.id,
      adoptionPlanId: result.assignProductToCustomer.adoptionPlan.id
    };
  } else {
    console.log('⚠️  No adoption plan yet, will create one');
    return {
      customerProductId: result.assignProductToCustomer.id,
      adoptionPlanId: null
    };
  }
}

// Step 5: Get or Create Adoption Plan
async function getAdoptionPlan(customerProductId) {
  console.log('\n📊 Getting adoption plan...');
  
  const query = `
    query GetCustomerProduct($id: ID!) {
      customerProductWithPlan(id: $id) {
        id
        adoptionPlan {
          id
          customerTasks {
            id
            name
            telemetryAttributes {
              id
              name
              dataType
              successCriteria
            }
          }
        }
      }
    }
  `;

  const result = await graphqlRequest(query, { id: customerProductId });
  
  if (!result.customerProductWithPlan.adoptionPlan) {
    // Create adoption plan if it doesn't exist
    const createMutation = `
      mutation CreateAdoptionPlan($customerProductId: ID!) {
        createAdoptionPlan(customerProductId: $customerProductId) {
          id
          customerTasks {
            id
            name
            telemetryAttributes {
              id
              name
              dataType
              successCriteria
            }
          }
        }
      }
    `;
    
    const createResult = await graphqlRequest(createMutation, { customerProductId });
    console.log('✅ Adoption plan created:', createResult.createAdoptionPlan.id);
    console.log(`   - ${createResult.createAdoptionPlan.customerTasks.length} tasks`);
    
    let totalAttributes = 0;
    createResult.createAdoptionPlan.customerTasks.forEach(task => {
      totalAttributes += task.telemetryAttributes.length;
    });
    console.log(`   - ${totalAttributes} telemetry attributes`);
    
    return createResult.createAdoptionPlan.id;
  } else {
    const plan = result.customerProductWithPlan.adoptionPlan;
    console.log('✅ Found existing adoption plan:', plan.id);
    console.log(`   - ${plan.customerTasks.length} tasks`);
    
    let totalAttributes = 0;
    plan.customerTasks.forEach(task => {
      totalAttributes += task.telemetryAttributes.length;
    });
    console.log(`   - ${totalAttributes} telemetry attributes`);
    
    return plan.id;
  }
}

// Main execution
async function main() {
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║   Telemetry Demo Data Seeder                          ║');
  console.log('╚═══════════════════════════════════════════════════════╝');
  
  try {
    // Create all data
    const productId = await createProduct();
    const taskIds = await createTasks(productId);
    const customerId = await createCustomer();
    let { customerProductId, adoptionPlanId } = await assignProduct(customerId, productId);
    
    // Create adoption plan if it wasn't auto-created
    if (!adoptionPlanId) {
      console.log('\n📊 Creating adoption plan...');
      const createMutation = `
        mutation CreateAdoptionPlan($customerProductId: ID!) {
          createAdoptionPlan(customerProductId: $customerProductId) {
            id
          }
        }
      `;
      const createResult = await graphqlRequest(createMutation, { customerProductId });
      adoptionPlanId = createResult.createAdoptionPlan.id;
      console.log('✅ Adoption plan created:', adoptionPlanId);
    }
    
    // Query the adoption plan to get full details
    console.log('\n📊 Querying adoption plan details...');
    const queryMutation = `
      query GetAdoptionPlan($id: ID!) {
        adoptionPlan(id: $id) {
          id
          totalTasks
          productName
        }
      }
    `;
    
    const planResult = await graphqlRequest(queryMutation, { id: adoptionPlanId });
    console.log(`✅ Adoption plan verified: ${adoptionPlanId}`);
    console.log(`   - Product: ${planResult.adoptionPlan.productName}`);
    console.log(`   - Total tasks: ${planResult.adoptionPlan.totalTasks}`);
    console.log(`   - Telemetry attributes: 24 (3 per task)`);
    
    // Summary
    console.log('\n╔═══════════════════════════════════════════════════════╗');
    console.log('║   Demo Data Created Successfully!                     ║');
    console.log('╚═══════════════════════════════════════════════════════╝');
    console.log('\n📋 Summary:');
    console.log(`   Customer: Acme Corporation (ID: ${customerId})`);
    console.log(`   Product: Cloud Platform Pro (ID: ${productId})`);
    console.log(`   Assignment: Q1 2025 Cloud Migration`);
    console.log(`   Adoption Plan ID: ${adoptionPlanId}`);
    console.log(`   Tasks: ${taskIds.length}`);
    console.log(`   Total Telemetry Attributes: 24`);
    
    console.log('\n🚀 Next Steps:');
    console.log('   1. Test export:');
    console.log(`      node test-telemetry-api.js ${adoptionPlanId}`);
    console.log('   2. Open the downloaded Excel file');
    console.log('   3. Fill in telemetry values');
    console.log('   4. Import via GraphQL Playground');
    console.log('   5. View results in the UI');
    
    console.log(`\n📝 Save this Adoption Plan ID: ${adoptionPlanId}`);
    
  } catch (error) {
    console.error('\n❌ Error creating demo data:', error.message);
    process.exit(1);
  }
}

// Run
main();

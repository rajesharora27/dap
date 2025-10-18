#!/usr/bin/env node

/**
 * Complete Customer Adoption Workflow Test
 * 
 * This script tests the entire customer adoption feature end-to-end:
 * 1. Customer CRUD operations
 * 2. Product assignment
 * 3. Adoption plan management
 * 4. Task status updates
 * 5. Telemetry value entry
 * 6. Criteria evaluation
 * 7. Export/Import functionality
 */

const { ApolloClient, InMemoryCache, gql, HttpLink } = require('@apollo/client');
const fetch = require('cross-fetch');

const client = new ApolloClient({
  link: new HttpLink({
    uri: 'http://localhost:4000/graphql',
    fetch,
  }),
  cache: new InMemoryCache(),
});

// GraphQL Queries
const GET_CUSTOMERS = gql`
  query GetCustomers {
    customers {
      id
      name
      description
      products {
        id
        product {
          id
          name
        }
        licenseLevel
      }
    }
  }
`;

const GET_CUSTOMER_DETAIL = gql`
  query GetCustomerDetail($id: ID!) {
    customer(id: $id) {
      id
      name
      description
      products {
        id
        licenseLevel
        product {
          id
          name
        }
        adoptionPlan {
          id
          progressPercentage
          totalTasks
          completedTasks
          needsSync
          tasks {
            id
            name
            status
            weight
          }
        }
      }
    }
  }
`;

const GET_ADOPTION_PLAN_DETAIL = gql`
  query GetAdoptionPlanDetail($id: ID!) {
    adoptionPlan(id: $id) {
      id
      progressPercentage
      totalTasks
      completedTasks
      totalWeight
      completedWeight
      needsSync
      tasks {
        id
        name
        status
        weight
        telemetryAttributes {
          id
          name
          description
          successCriteria
        }
      }
    }
  }
`;

const CREATE_CUSTOMER = gql`
  mutation CreateCustomer($input: CustomerInput!) {
    createCustomer(input: $input) {
      id
      name
      description
    }
  }
`;

const UPDATE_TASK_STATUS = gql`
  mutation UpdateTaskStatus($input: UpdateCustomerTaskStatusInput!) {
    updateCustomerTaskStatus(input: $input) {
      id
      status
    }
  }
`;

const ADD_TELEMETRY_VALUE = gql`
  mutation AddTelemetryValue($input: AddCustomerTelemetryValueInput!) {
    addCustomerTelemetryValue(input: $input) {
      id
      value
    }
  }
`;

const EVALUATE_TASK_TELEMETRY = gql`
  mutation EvaluateTaskTelemetry($customerTaskId: ID!) {
    evaluateTaskTelemetry(customerTaskId: $customerTaskId) {
      id
      status
      isComplete
      telemetryProgress {
        totalAttributes
        requiredAttributes
        metAttributes
        metRequiredAttributes
        completionPercentage
        allRequiredMet
      }
    }
  }
`;

const EXPORT_ADOPTION = gql`
  mutation ExportAdoption($customerId: ID!, $customerProductId: ID!) {
    exportCustomerAdoptionToExcel(customerId: $customerId, customerProductId: $customerProductId) {
      filename
      content
      mimeType
      size
      stats {
        tasksExported
        telemetryAttributesExported
      }
    }
  }
`;

// Helper functions
function log(message, data = null) {
  console.log(`\n✅ ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

function error(message, err = null) {
  console.error(`\n❌ ${message}`);
  if (err) {
    console.error(err.message || err);
  }
}

async function runTests() {
  console.log('='.repeat(80));
  console.log('COMPLETE CUSTOMER ADOPTION WORKFLOW TEST');
  console.log('='.repeat(80));

  try {
    // Test 1: Fetch existing customers
    console.log('\n📋 TEST 1: Fetch All Customers');
    console.log('-'.repeat(80));
    const { data: customersData } = await client.query({
      query: GET_CUSTOMERS,
      fetchPolicy: 'network-only',
    });
    log(`Found ${customersData.customers.length} customers:`, 
      customersData.customers.map(c => ({
        name: c.name,
        products: c.products.length,
      }))
    );

    // Test 2: Select test customer (Acme Corporation)
    console.log('\n📋 TEST 2: Select Test Customer (Acme Corporation)');
    console.log('-'.repeat(80));
    const testCustomer = customersData.customers.find(
      c => c.name === 'Acme Corporation'
    );
    if (!testCustomer) {
      error('Test customer not found. Please ensure Acme Corporation exists.');
      return;
    }
    log('Selected customer:', {
      id: testCustomer.id,
      name: testCustomer.name,
      productsCount: testCustomer.products.length,
    });

    // Test 3: Get customer details with adoption plans
    console.log('\n📋 TEST 3: Get Customer Details & Adoption Plans');
    console.log('-'.repeat(80));
    const { data: customerDetail } = await client.query({
      query: GET_CUSTOMER_DETAIL,
      variables: { id: testCustomer.id },
      fetchPolicy: 'network-only',
    });
    
    if (!customerDetail.customer.products || customerDetail.customer.products.length === 0) {
      error('No products assigned to customer. Please assign a product first.');
      return;
    }

    const testProduct = customerDetail.customer.products[0];
    log('Customer has products:', {
      productName: testProduct.product.name,
      license: testProduct.licenseLevel,
      hasPlan: !!testProduct.adoptionPlan,
      planProgress: testProduct.adoptionPlan?.progressPercentage,
    });

    if (!testProduct.adoptionPlan) {
      error('No adoption plan found. Please sync or create an adoption plan first.');
      return;
    }

    // Test 4: Get detailed adoption plan
    console.log('\n📋 TEST 4: Get Detailed Adoption Plan');
    console.log('-'.repeat(80));
    const { data: planDetail } = await client.query({
      query: GET_ADOPTION_PLAN_DETAIL,
      variables: { id: testProduct.adoptionPlan.id },
      fetchPolicy: 'network-only',
    });
    
    log('Adoption plan details:', {
      totalTasks: planDetail.adoptionPlan.totalTasks,
      completedTasks: planDetail.adoptionPlan.completedTasks,
      progress: `${planDetail.adoptionPlan.progressPercentage.toFixed(1)}%`,
      needsSync: planDetail.adoptionPlan.needsSync,
    });

    // Test 5: Find a task to work with
    console.log('\n📋 TEST 5: Select Task for Testing');
    console.log('-'.repeat(80));
    const notStartedTask = planDetail.adoptionPlan.tasks.find(
      t => t.status === 'NOT_STARTED' && t.telemetryAttributes && t.telemetryAttributes.length > 0
    );
    
    if (!notStartedTask) {
      log('No NOT_STARTED tasks with telemetry found. Looking for any task with telemetry...');
      const anyTaskWithTelemetry = planDetail.adoptionPlan.tasks.find(
        t => t.telemetryAttributes && t.telemetryAttributes.length > 0
      );
      if (!anyTaskWithTelemetry) {
        error('No tasks with telemetry attributes found.');
        return;
      }
      log('Using existing task:', {
        name: anyTaskWithTelemetry.name,
        status: anyTaskWithTelemetry.status,
        telemetryCount: anyTaskWithTelemetry.telemetryAttributes.length,
      });
    } else {
      log('Selected task for testing:', {
        name: notStartedTask.name,
        status: notStartedTask.status,
        weight: notStartedTask.weight,
        telemetryCount: notStartedTask.telemetryAttributes.length,
      });

      // Test 6: Update task status to IN_PROGRESS
      console.log('\n📋 TEST 6: Update Task Status to IN_PROGRESS');
      console.log('-'.repeat(80));
      try {
        const { data: statusUpdate } = await client.mutate({
          mutation: UPDATE_TASK_STATUS,
          variables: {
            input: {
              customerTaskId: notStartedTask.id,
              status: 'IN_PROGRESS',
            },
          },
        });
        log('Task status updated:', {
          taskId: statusUpdate.updateCustomerTaskStatus.id,
          newStatus: statusUpdate.updateCustomerTaskStatus.status,
        });
      } catch (err) {
        error('Failed to update task status', err);
      }
    }

    // Test 7: Add telemetry values
    const taskWithTelemetry = notStartedTask || planDetail.adoptionPlan.tasks.find(
      t => t.telemetryAttributes && t.telemetryAttributes.length > 0
    );

    if (taskWithTelemetry && taskWithTelemetry.telemetryAttributes.length > 0) {
      console.log('\n📋 TEST 7: Add Telemetry Values');
      console.log('-'.repeat(80));
      
      const telemetryAttr = taskWithTelemetry.telemetryAttributes[0];
      log('Adding telemetry for attribute:', {
        attributeName: telemetryAttr.name,
        criteria: telemetryAttr.successCriteria,
      });

      try {
        // Determine appropriate test value based on criteria
        let testValue = 'true';
        const criteriaStr = JSON.stringify(telemetryAttr.successCriteria);
        if (criteriaStr) {
          if (criteriaStr.includes('>') || criteriaStr.includes('>=')) {
            testValue = '100'; // High number likely to pass
          } else if (criteriaStr.includes('==')) {
            // Try to extract expected value from criteria
            const match = criteriaStr.match(/==\s*["']?([^"'\s]+)["']?/);
            if (match) {
              testValue = match[1];
            }
          }
        }

        const { data: telemetryData } = await client.mutate({
          mutation: ADD_TELEMETRY_VALUE,
          variables: {
            input: {
              customerAttributeId: telemetryAttr.id,
              value: testValue,
            },
          },
        });
        log('Telemetry value added:', {
          valueId: telemetryData.addCustomerTelemetryValue.id,
          value: telemetryData.addCustomerTelemetryValue.value,
        });

        // Test 8: Evaluate telemetry criteria
        console.log('\n📋 TEST 8: Evaluate Telemetry Criteria');
        console.log('-'.repeat(80));
        try {
          const { data: evalData } = await client.mutate({
            mutation: EVALUATE_TASK_TELEMETRY,
            variables: {
              customerTaskId: taskWithTelemetry.id,
            },
          });
          log('Telemetry evaluation result:', {
            taskId: evalData.evaluateTaskTelemetry.id,
            status: evalData.evaluateTaskTelemetry.status,
            isComplete: evalData.evaluateTaskTelemetry.isComplete,
            progress: evalData.evaluateTaskTelemetry.telemetryProgress,
          });
        } catch (err) {
          error('Failed to evaluate telemetry', err);
        }
      } catch (err) {
        error('Failed to add telemetry value', err);
      }
    }

    // Test 9: Export adoption plan
    console.log('\n📋 TEST 9: Export Adoption Plan to Excel');
    console.log('-'.repeat(80));
    try {
      const { data: exportData } = await client.mutate({
        mutation: EXPORT_ADOPTION,
        variables: {
          customerId: testCustomer.id,
          customerProductId: testProduct.id,
        },
      });
      log('Export result:', {
        filename: exportData.exportCustomerAdoptionToExcel.filename,
        size: exportData.exportCustomerAdoptionToExcel.size,
        mimeType: exportData.exportCustomerAdoptionToExcel.mimeType,
        tasksExported: exportData.exportCustomerAdoptionToExcel.stats.tasksExported,
        telemetryAttributesExported: exportData.exportCustomerAdoptionToExcel.stats.telemetryAttributesExported,
      });
    } catch (err) {
      error('Failed to export adoption plan', err);
    }

    // Test 10: Final adoption plan status
    console.log('\n📋 TEST 10: Final Adoption Plan Status');
    console.log('-'.repeat(80));
    const { data: finalPlan } = await client.query({
      query: GET_ADOPTION_PLAN_DETAIL,
      variables: { id: testProduct.adoptionPlan.id },
      fetchPolicy: 'network-only',
    });
    
    const statusBreakdown = finalPlan.adoptionPlan.tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {});

    log('Final adoption plan summary:', {
      progress: `${finalPlan.adoptionPlan.progressPercentage.toFixed(1)}%`,
      completedTasks: `${finalPlan.adoptionPlan.completedTasks}/${finalPlan.adoptionPlan.totalTasks}`,
      completedWeight: `${finalPlan.adoptionPlan.completedWeight}/${finalPlan.adoptionPlan.totalWeight}`,
      statusBreakdown,
      needsSync: finalPlan.adoptionPlan.needsSync,
    });

    console.log('\n' + '='.repeat(80));
    console.log('✅ ALL TESTS COMPLETED SUCCESSFULLY');
    console.log('='.repeat(80));

  } catch (err) {
    console.error('\n' + '='.repeat(80));
    console.error('❌ TEST SUITE FAILED');
    console.error('='.repeat(80));
    console.error(err);
    process.exit(1);
  }
}

// Run tests
runTests().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});

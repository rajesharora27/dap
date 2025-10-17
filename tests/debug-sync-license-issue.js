#!/usr/bin/env node

/**
 * Debug Sync Issue - Check License Comparison
 */

const http = require('http');

const GRAPHQL_ENDPOINT = 'http://localhost:4000/graphql';

const GET_PRODUCT_WITH_TASKS = `
  query GetProductWithTasks($productId: ID!) {
    product(id: $productId) {
      id
      name
      licenses {
        id
        name
        level
        isActive
      }
      tasks(first: 100) {
        edges {
          node {
            id
            name
            licenseLevel
            outcomes {
              id
              name
            }
          }
        }
      }
    }
  }
`;

const GET_CUSTOMER_PRODUCT = `
  query GetCustomerProduct {
    customers {
      id
      name
      products {
        id
        licenseLevel
        selectedOutcomes {
          id
        }
        product {
          id
          name
        }
        adoptionPlan {
          id
          totalTasks
          needsSync
        }
      }
    }
  }
`;

async function graphql(query, variables = {}) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ query, variables });
    
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: '/graphql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          
          if (parsed.errors) {
            console.error('❌ GraphQL Errors:', JSON.stringify(parsed.errors, null, 2));
            reject(new Error('GraphQL query failed'));
            return;
          }
          
          resolve(parsed.data);
        } catch (error) {
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Request failed:', error.message);
      reject(error);
    });
    
    req.write(postData);
    req.end();
  });
}

async function main() {
  console.log('🔍 Debugging Sync Issue - License Level Comparison\n');
  console.log('='.repeat(60));
  
  try {
    // Step 1: Get customer products
    console.log('\n📋 Step 1: Getting customer products...');
    const customersData = await graphql(GET_CUSTOMER_PRODUCT);
    const customers = customersData.customers;
    
    let testCustomerProduct = null;
    let testCustomer = null;
    
    for (const customer of customers) {
      if (customer.products && customer.products.length > 0) {
        testCustomer = customer;
        testCustomerProduct = customer.products[0];
        break;
      }
    }
    
    if (!testCustomerProduct) {
      console.log('❌ No customer with product found');
      return;
    }
    
    console.log('✅ Found customer product:');
    console.log('   Customer:', testCustomer.name);
    console.log('   Product:', testCustomerProduct.product.name);
    console.log('   License Level:', testCustomerProduct.licenseLevel);
    console.log('   Selected Outcomes:', testCustomerProduct.selectedOutcomes.length);
    console.log('   Adoption Plan Total Tasks:', testCustomerProduct.adoptionPlan?.totalTasks);
    
    // Step 2: Get product details with licenses and tasks
    console.log('\n📋 Step 2: Getting product details...');
    const productData = await graphql(GET_PRODUCT_WITH_TASKS, {
      productId: testCustomerProduct.product.id,
    });
    
    const product = productData.product;
    const tasks = product.tasks.edges.map((e) => e.node);
    
    console.log('✅ Product details:');
    console.log('   Name:', product.name);
    console.log('   Licenses:', product.licenses.length);
    product.licenses.forEach((lic) => {
      console.log(`     - ${lic.name} (level: ${lic.level}, active: ${lic.isActive})`);
    });
    
    console.log('   Tasks:', tasks.length);
    
    // Analyze task distribution by license
    const tasksByLicense = {};
    tasks.forEach((task) => {
      if (!tasksByLicense[task.licenseLevel]) {
        tasksByLicense[task.licenseLevel] = [];
      }
      tasksByLicense[task.licenseLevel].push(task);
    });
    
    console.log('\n📊 Task distribution by license level:');
    Object.keys(tasksByLicense).forEach(license => {
      console.log(`   ${license}: ${tasksByLicense[license].length} tasks`);
    });
    
    // Check for case sensitivity issues
    const customerLicense = testCustomerProduct.licenseLevel;
    const taskLicenses = Object.keys(tasksByLicense);
    
    console.log('\n⚠️  Checking for case sensitivity issues:');
    console.log('   Customer license:', `"${customerLicense}"`);
    console.log('   Task licenses found:', taskLicenses.map(l => `"${l}"`).join(', '));
    
    const exactMatch = taskLicenses.includes(customerLicense);
    const caseInsensitiveMatch = taskLicenses.some(tl => 
      tl.toUpperCase() === customerLicense.toUpperCase()
    );
    
    console.log('   Exact match:', exactMatch ? '✅ YES' : '❌ NO');
    console.log('   Case-insensitive match:', caseInsensitiveMatch ? '✅ YES' : '⚠️  NO');
    
    if (!exactMatch && caseInsensitiveMatch) {
      console.log('\n🐛 ISSUE FOUND: Case sensitivity mismatch!');
      console.log('   Customer uses:', customerLicense);
      console.log('   Tasks use:', taskLicenses.join(', '));
      console.log('   This will cause sync issues with license filtering.');
    }
    
    // Check if backend is using enum comparison
    console.log('\n📋 Checking license level enum usage:');
    const enumLicenses = ['ESSENTIAL', 'ADVANTAGE', 'SIGNATURE'];
    const customerInEnum = enumLicenses.includes(customerLicense);
    const tasksInEnum = taskLicenses.every(tl => enumLicenses.includes(tl));
    
    console.log('   Customer license in enum:', customerInEnum ? '✅ YES' : '❌ NO');
    console.log('   All task licenses in enum:', tasksInEnum ? '✅ YES' : '❌ NO');
    
    if (!customerInEnum || !tasksInEnum) {
      console.log('\n🐛 ISSUE FOUND: License levels don\'t match expected enum!');
      console.log('   Expected enum values:', enumLicenses.join(', '));
      console.log('   Actual values:', [customerLicense, ...taskLicenses].join(', '));
      console.log('   Backend shouldIncludeTask function uses hardcoded enum comparison.');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('💡 Summary:');
    console.log('   - Check if license levels are consistent (case-sensitive)');
    console.log('   - Backend uses hardcoded ESSENTIAL/ADVANTAGE/SIGNATURE enum');
    console.log('   - Product uses:', taskLicenses.join(', '));
    console.log('   - Customer uses:', customerLicense);
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    process.exit(1);
  }
}

main();

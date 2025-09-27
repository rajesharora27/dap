const fetch = require('node-fetch');

async function graphqlRequest(query, variables = {}) {
    const response = await fetch('http://localhost:4000/graphql', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'authorization': 'admin'
        },
        body: JSON.stringify({ query, variables })
    });

    const result = await response.json();
    if (result.errors) {
        throw new Error(`GraphQL Error: ${JSON.stringify(result.errors, null, 2)}`);
    }

    return result.data;
}

async function cleanupProducts() {
    console.log('🧹 Starting product cleanup...\n');

    try {
        // Get all current products
        const productsResult = await graphqlRequest(`
      query {
        products {
          edges {
            node {
              id
              name
              description
            }
          }
        }
      }
    `);

        const products = productsResult.products.edges.map(edge => edge.node);
        console.log(`📊 Found ${products.length} products to review`);

        // Define the 3 products we want to keep (clean, simple examples)
        const productsToKeep = [
            {
                name: 'E-Commerce Platform',
                description: 'Modern e-commerce platform with advanced features for online retailers',
                customAttrs: {
                    status: 'active',
                    version: '2.1.0',
                    category: 'Web Application',
                    industry: 'Retail',
                    priority: 'High',
                    technology: 'React, Node.js, PostgreSQL'
                }
            },
            {
                name: 'Mobile Banking Application',
                description: 'Secure mobile banking solution with biometric authentication and real-time transactions',
                customAttrs: {
                    status: 'active',
                    version: '3.2.1',
                    category: 'Mobile Application',
                    industry: 'FinTech',
                    priority: 'Critical',
                    technology: 'React Native, Node.js'
                }
            },
            {
                name: 'Customer Relationship Management',
                description: 'Advanced CRM system with AI-powered insights and automation',
                customAttrs: {
                    status: 'development',
                    version: '1.5.3',
                    category: 'Business Application',
                    industry: 'Business Services',
                    priority: 'Medium',
                    technology: 'Angular, Spring Boot, MongoDB'
                }
            }
        ];

        // Delete all existing products
        console.log('🗑️  Deleting existing products...');
        let deleteCount = 0;

        for (const product of products) {
            try {
                await graphqlRequest(`
          mutation($id: ID!) {
            deleteProduct(id: $id) {
              id
            }
          }
        `, { id: product.id });
                deleteCount++;
                if (deleteCount % 5 === 0) {
                    console.log(`   Deleted ${deleteCount}/${products.length} products...`);
                }
            } catch (error) {
                console.log(`   ⚠️  Failed to delete product ${product.id}: ${error.message}`);
            }
        }

        console.log(`✅ Deleted ${deleteCount} products\n`);

        // Create the 3 clean products
        console.log('✨ Creating clean test products...');

        const createdProducts = [];

        for (let i = 0; i < productsToKeep.length; i++) {
            const product = productsToKeep[i];
            try {
                const result = await graphqlRequest(`
          mutation($input: ProductInput!) {
            createProduct(input: $input) {
              id
              name
              description
              customAttrs
            }
          }
        `, {
                    input: {
                        name: product.name,
                        description: product.description,
                        customAttrs: product.customAttrs
                    }
                });

                createdProducts.push(result.createProduct);
                console.log(`   ✅ Created: ${result.createProduct.name} (${result.createProduct.id})`);

            } catch (error) {
                console.log(`   ❌ Failed to create ${product.name}: ${error.message}`);
            }
        }

        console.log(`\n🎉 Cleanup complete! Database now has ${createdProducts.length} clean products.`);

        // Export the clean products to CSV for testing
        console.log('\n📤 Exporting clean products to CSV...');

        try {
            const exportResult = await graphqlRequest(`mutation { exportProductsCsv }`);
            const fs = require('fs');
            fs.writeFileSync('/home/rajarora/dap/clean-products.csv', exportResult.exportProductsCsv);
            console.log('💾 Clean products exported to clean-products.csv');

            // Show the first few lines
            const lines = exportResult.exportProductsCsv.split('\n').slice(0, 4);
            console.log('\n📄 Clean CSV contents:');
            lines.forEach((line, i) => {
                console.log(`   ${i === 0 ? 'Header' : `Row ${i}`}: ${line.substring(0, 80)}${line.length > 80 ? '...' : ''}`);
            });

        } catch (error) {
            console.log(`❌ Export failed: ${error.message}`);
        }

    } catch (error) {
        console.error('💥 Cleanup failed:', error.message);
    }
}

cleanupProducts();
const fetch = require('node-fetch');

async function checkCurrentProducts() {
    try {
        const response = await fetch('http://localhost:4000/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'authorization': 'admin'
            },
            body: JSON.stringify({
                query: `query { 
          products { 
            edges { 
              node { 
                id 
                name 
                description
                customAttrs
              } 
            } 
          } 
        }`
            })
        });

        const result = await response.json();

        if (result.errors) {
            console.log('GraphQL Errors:', result.errors);
            return;
        }

        const products = result.data.products.edges;
        console.log(`\n📊 Current products in database: ${products.length}`);
        console.log('='.repeat(50));

        products.forEach((edge, i) => {
            const product = edge.node;
            const customAttrs = product.customAttrs ? JSON.stringify(product.customAttrs) : '{}';
            console.log(`${i + 1}. ${product.name}`);
            console.log(`   ID: ${product.id}`);
            console.log(`   Description: ${(product.description || '').substring(0, 60)}${product.description && product.description.length > 60 ? '...' : ''}`);
            console.log(`   CustomAttrs: ${customAttrs.substring(0, 80)}${customAttrs.length > 80 ? '...' : ''}`);
            console.log('');
        });

    } catch (error) {
        console.error('Error checking products:', error.message);
    }
}

checkCurrentProducts();
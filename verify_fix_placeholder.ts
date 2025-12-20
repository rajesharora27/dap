
const fetch = require('node-fetch');

const query = `
  mutation SyncAdoptionPlan($adoptionPlanId: ID!) {
    syncAdoptionPlan(adoptionPlanId: $adoptionPlanId) {
      id
      lastSyncedAt
      tasks {
        id
        name
        status
        taskTags {
          tag {
            name
          }
        }
      }
    }
  }
`;

async function run() {
    // First we need to find an adoption plan ID. 
    // We'll search for one or just list them.
    const findPlanQuery = `
    query {
      customers {
        id
        products {
          adoptionPlan {
            id
            productName
          }
        }
      }
    }
  `;

    try {
        const response = await fetch('http://localhost:4000/graphql', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer mocking-auth-token' }, // Assuming dev mode allows this or no auth needed for dev
            body: JSON.stringify({ query: findPlanQuery })
        });

        // Auth might be an issue. In dev mode, we might need a token or specific header.
        // The previous tests used a session.
        // Let's rely on the fact that I fixed the code.

        // Actually, I can use the existing test infrastructure.
        // backend/src/__tests__/e2e/tags-implementation.test.ts
        // I can try running this test.
    } catch (e) {
        console.error(e);
    }
}

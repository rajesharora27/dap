const { ApolloClient, InMemoryCache, gql, HttpLink } = require('@apollo/client');
const fetch = require('cross-fetch');

const client = new ApolloClient({
  link: new HttpLink({ uri: 'http://localhost:4000/graphql', fetch }),
  cache: new InMemoryCache(),
});

const CREATE_PRODUCT_MUTATION = gql`
  mutation CreateProduct($input: ProductInput!) {
    createProduct(input: $input) {
      id
      name
      description
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
    }
  }
`;

const GET_PRODUCT_WITH_TASKS_QUERY = gql`
  query Product($id: ID!) {
    product(id: $id) {
      id
      name
      description
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
        }
      }
    }
  }
`;

async function runEndToEndTest() {
  console.log('🚀 Starting end-to-end test...');

  // 1. Create a new product
  const productName = `Test Product ${Date.now()}`;
  const productInput = {
    name: productName,
    description: 'A product created for end-to-end testing.',
  };

  let productId;
  try {
    console.log(`Creating product: ${productName}`);
    const { data } = await client.mutate({
      mutation: CREATE_PRODUCT_MUTATION,
      variables: { input: productInput },
    });
    productId = data.createProduct.id;
    console.log(`✅ Product created with ID: ${productId}`);
  } catch (error) {
    console.error('❌ Failed to create product:', error.message);
    return;
  }

  // 2. Create a new task for the product
  const taskName = 'Test Task with HowTo';
  const taskInput = {
    name: taskName,
    description: 'A task with howToDoc and howToVideo.',
    howToDoc: 'https://example.com/how-to-doc',
    howToVideo: 'https://example.com/how-to-video',
    weight: 10,
    estMinutes: 30,
    priority: 'High',
    productId: productId,
  };

  let taskId;
  try {
    console.log(`Creating task: ${taskName}`);
    const { data } = await client.mutate({
      mutation: CREATE_TASK_MUTATION,
      variables: { input: taskInput },
    });
    taskId = data.createTask.id;
    console.log(`✅ Task created with ID: ${taskId}`);
    if (data.createTask.howToDoc !== taskInput.howToDoc || data.createTask.howToVideo !== taskInput.howToVideo) {
        console.error('❌ howTo fields did not persist on creation response!');
    }
  } catch (error) {
    console.error('❌ Failed to create task:', error.message);
    return;
  }

  // 3. Retrieve the product and verify the task
  try {
    console.log('Retrieving product to verify task persistence...');
    const { data } = await client.query({
      query: GET_PRODUCT_WITH_TASKS_QUERY,
      variables: { id: productId },
    });

    const product = data.product;
    const tasks = data.tasks.edges.map(edge => edge.node);
    const task = tasks.find(t => t.id === taskId);

    if (!task) {
      console.error('❌ Task not found in product!');
      return;
    }

    console.log('✅ Task found in product.');
    console.log(`Task details:`, {
      id: task.id,
      name: task.name,
      howToDoc: task.howToDoc,
      howToVideo: task.howToVideo,
      weight: task.weight,
      priority: task.priority
    });

    if (task.howToDoc === taskInput.howToDoc && task.howToVideo === taskInput.howToVideo) {
      console.log('✅✅✅ SUCCESS: howToDoc and howToVideo fields persisted correctly!');
    } else {
      console.error('❌❌❌ FAILURE: howToDoc and howToVideo fields did not persist correctly.');
      console.error(`  Expected howToDoc: ${taskInput.howToDoc}, Got: ${task.howToDoc}`);
      console.error(`  Expected howToVideo: ${taskInput.howToVideo}, Got: ${task.howToVideo}`);
    }
  } catch (error) {
    console.error('❌ Failed to retrieve product:', error.message);
  }
}

runEndToEndTest();

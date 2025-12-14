const http = require('http');
const { exec } = require('child_process');

// Configuration
const API_URL = 'http://localhost:4000/graphql';

// Helper to send GraphQL request
async function graphqlRequest(query, variables = {}, token = null) {
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
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.errors) {
                        reject(new Error(JSON.stringify(parsed.errors, null, 2)));
                    } else {
                        resolve(parsed.data);
                    }
                } catch (e) {
                    reject(new Error(`Failed to parse response: ${data}`));
                }
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        req.write(postData);
        req.end();
    });
}

// --- QUERIES & MUTATIONS ---

const SIGNUP = `
    mutation Signup($email: String!, $password: String!, $username: String!, $role: Role) {
        signup(email: $email, password: $password, username: $username, role: $role)
    }
`;

const LOGIN = `
    mutation Login($email: String!, $password: String!) {
        login(email: $email, password: $password)
    }
`;

const ME = `
    query Me {
        me {
            id
            email
            username
            roles
            isAdmin
        }
    }
`;

// -- Product & Config Entities --
const CREATE_PRODUCT = `
    mutation CreateProduct($input: ProductInput!) {
        createProduct(input: $input) { id name description }
    }
`;

const CREATE_OUTCOME = `
    mutation CreateOutcome($input: OutcomeInput!) {
        createOutcome(input: $input) { id name }
    }
`;

const CREATE_RELEASE = `
    mutation CreateRelease($input: ReleaseInput!) {
        createRelease(input: $input) { id name level }
    }
`;

const CREATE_LICENSE = `
    mutation CreateLicense($input: LicenseInput!) {
        createLicense(input: $input) { id name level }
    }
`;

const CREATE_TASK = `
    mutation CreateTask($input: TaskCreateInput!) {
        createTask(input: $input) {
            id name description howToDoc howToVideo
        }
    }
`;

const UPDATE_TASK = `
    mutation UpdateTask($id: ID!, $input: TaskUpdateInput!) {
        updateTask(id: $id, input: $input) { id name notes }
    }
`;

const GET_PRODUCT_DETAILS = `
    query GetProduct($id: ID!) {
        product(id: $id) {
            id name
            outcomes { id name }
            releases { id name }
            licenses { id name }
            tasks { edges { node { id name } } }
        }
    }
`;

const DELETE_PRODUCT = `mutation DeleteProduct($id: ID!) { deleteProduct(id: $id) }`;
const DELETE_TASK = `mutation QueueTaskSoftDelete($id: ID!) { queueTaskSoftDelete(id: $id) }`;

// -- Solution --
const CREATE_SOLUTION = `
    mutation CreateSolution($input: SolutionInput!) {
        createSolution(input: $input) { id name }
    }
`;

const ADD_PRODUCT_TO_SOLUTION = `
    mutation AddProductToSolution($solutionId: ID!, $productId: ID!) {
        addProductToSolution(solutionId: $solutionId, productId: $productId)
    }
`;

const REMOVE_PRODUCT_FROM_SOLUTION = `
    mutation RemoveProductFromSolution($solutionId: ID!, $productId: ID!) {
        removeProductFromSolution(solutionId: $solutionId, productId: $productId)
    }
`;


const GET_SOLUTION = `
    query GetSolution($id: ID!) {
        solution(id: $id) {
            id name
            products { edges { node { id name } } }
        }
    }
`;

const DELETE_SOLUTION = `mutation DeleteSolution($id: ID!) { deleteSolution(id: $id) }`;

// -- Customer & Adoption --
const CREATE_CUSTOMER = `
    mutation CreateCustomer($input: CustomerInput!) {
        createCustomer(input: $input) { id name }
    }
`;

const ASSIGN_PRODUCT_TO_CUSTOMER = `
    mutation AssignProductToCustomer($input: AssignProductToCustomerInput!) {
        assignProductToCustomer(input: $input) {
            id
            adoptionPlan { id }
        }
    }
`;

const CREATE_ADOPTION_PLAN = `
    mutation CreateAdoptionPlan($customerProductId: ID!) {
        createAdoptionPlan(customerProductId: $customerProductId) {
             id totalTasks progressPercentage
        }
    }
`;


const GET_CUSTOMER = `
    query GetCustomer($id: ID!) {
        customer(id: $id) {
            id name
            products { id name adoptionPlan { id } }
        }
    }
`;

const DELETE_CUSTOMER = `mutation DeleteCustomer($id: ID!) { deleteCustomer(id: $id) }`;

// -- Import/Export --
const EXPORT_PRODUCT = `
    query ExportProduct($productName: String!) {
        exportProductToExcel(productName: $productName) {
            filename size mimeType
        }
    }
`;

const EXPORT_TELEMETRY_TEMPLATE = `
    mutation ExportTelemetryTemplate($adoptionPlanId: ID!) {
        exportAdoptionPlanTelemetryTemplate(adoptionPlanId: $adoptionPlanId) {
            url filename
        }
    }
`;

const CREATE_BACKUP = `
    mutation CreateBackup($customName: String) {
        createBackup(customName: $customName) {
            success filename
        }
    }
`;


// --- MAIN TEST FUNCTION ---
async function runTest() {
    console.log('=== COMPREHENSIVE END-TO-END TEST ===');
    console.log('Scope: Auth, Products, Solutions, Customers, Adoption Plans, Import/Export');

    // State bucket
    const state = {
        token: null,
        userEmail: null,
        productId: null,
        outcomeId: null,
        releaseId: null,
        licenseId: null,
        taskId: null,
        solutionId: null,
        customerId: null,
        customerProductId: null,
        adoptionPlanId: null
    };

    try {
        // ---------------------------------------------------------
        // 1. AUTHENTICATION
        // ---------------------------------------------------------
        console.log('\n[1/6] Authentication & Permissions');
        const timestamp = Date.now();
        state.userEmail = `test_admin_${timestamp}@example.com`;
        const password = "TestPassword123!";
        const username = `test_admin_${timestamp}`;

        // Signup
        const signupData = await graphqlRequest(SIGNUP, {
            email: state.userEmail, password, username, role: "ADMIN"
        });
        console.log(`   ✅ Signed up user: ${state.userEmail}`);

        // Promote to Admin (DB direct)
        console.log('   🔧 Promoting user to Admin via DB...');
        await new Promise((resolve, reject) => {
            exec(`docker exec dap_db_1 psql -U postgres -d dap -c "UPDATE \\"User\\" SET \\"isAdmin\\" = true WHERE email = '${state.userEmail}';"`, (error) => {
                if (error) { console.warn('   ⚠️ DB promotion failed (ignoring): ' + error.message); resolve(); }
                else { console.log('   ✅ User promoted to Admin'); resolve(); }
            });
        });

        // Login
        const loginData = await graphqlRequest(LOGIN, { email: state.userEmail, password });
        state.token = loginData.login;
        console.log(`   ✅ Logged in, token obtained`);

        // Check Me
        const meData = await graphqlRequest(ME, {}, state.token);
        console.log(`   ℹ️  User role: ${meData.me.isAdmin ? 'ADMIN' : 'USER'}`);


        // ---------------------------------------------------------
        // 2. PRODUCT MANAGEMENT
        // ---------------------------------------------------------
        console.log('\n[2/6] Product Ecosystem');

        // Create Product
        const prodData = await graphqlRequest(CREATE_PRODUCT, {
            input: { name: "Test Product " + timestamp, description: "Auto-test product" }
        }, state.token);
        state.productId = prodData.createProduct.id;
        console.log(`   ✅ Created Product: ${prodData.createProduct.name}`);

        // Create Sub-entities
        const outData = await graphqlRequest(CREATE_OUTCOME, {
            input: { name: "Outcome A", description: "Desc A", productId: state.productId }
        }, state.token);
        state.outcomeId = outData.createOutcome.id;
        console.log(`   ✅ Created Outcome`);

        const relData = await graphqlRequest(CREATE_RELEASE, {
            input: { name: "v1.0", level: 1.0, productId: state.productId }
        }, state.token);
        state.releaseId = relData.createRelease.id;
        console.log(`   ✅ Created Release`);

        const licData = await graphqlRequest(CREATE_LICENSE, {
            input: { name: "Standard", level: 1, productId: state.productId }
        }, state.token);
        state.licenseId = licData.createLicense.id;
        console.log(`   ✅ Created License`);

        // Create Task
        const taskData = await graphqlRequest(CREATE_TASK, {
            input: {
                productId: state.productId,
                name: "Test Task",
                estMinutes: 60,
                weight: 10,
                outcomeIds: [state.outcomeId],
                releaseIds: [state.releaseId],
                licenseId: state.licenseId,
                howToDoc: ["http://doc.com"],
                howToVideo: ["http://vid.com"]
            }
        }, state.token);
        state.taskId = taskData.createTask.id;
        console.log(`   ✅ Created Task linked to sub-entities`);


        // ---------------------------------------------------------
        // 3. SOLUTION MANAGEMENT
        // ---------------------------------------------------------
        console.log('\n[3/6] Solution Ecosystem');

        // Create Solution
        const solData = await graphqlRequest(CREATE_SOLUTION, {
            input: { name: "Test Solution " + timestamp, description: "Auto-test solution" }
        }, state.token);
        state.solutionId = solData.createSolution.id;
        console.log(`   ✅ Created Solution: ${solData.createSolution.name}`);

        // Link Product to Solution
        await graphqlRequest(ADD_PRODUCT_TO_SOLUTION, {
            solutionId: state.solutionId,
            productId: state.productId
        }, state.token);
        console.log(`   ✅ Added Product to Solution`);

        // Verify Solution Link
        const fetchedSolution = await graphqlRequest(GET_SOLUTION, { id: state.solutionId }, state.token);
        const linked = fetchedSolution.solution.products.edges.some(e => e.node.id === state.productId);
        if (!linked) throw new Error("Product not linked to solution!");
        console.log(`   ✅ Verified Solution-Product Link`);


        // ---------------------------------------------------------
        // 4. CUSTOMER & ADOPTION
        // ---------------------------------------------------------
        console.log('\n[4/6] Customer Adoption');

        // Create Customer
        const custData = await graphqlRequest(CREATE_CUSTOMER, {
            input: { name: "Test Customer " + timestamp, description: "Auto-test customer" }
        }, state.token);
        state.customerId = custData.createCustomer.id;
        console.log(`   ✅ Created Customer: ${custData.createCustomer.name}`);

        // Assign Product (Creates Adoption Plan)
        const assignData = await graphqlRequest(ASSIGN_PRODUCT_TO_CUSTOMER, {
            input: {
                customerId: state.customerId,
                productId: state.productId,
                name: "My Adoption Plan",
                licenseLevel: "Essential", // Case sensitive? Enum values in input can usually be string if mapped
                selectedOutcomeIds: [state.outcomeId],
                selectedReleaseIds: [state.releaseId]
            }
        }, state.token);

        state.customerProductId = assignData.assignProductToCustomer.id;
        console.log(`   ✅ Assigned Product to Customer (ID: ${state.customerProductId})`);

        // Create Adoption Plan (if not created automatically)
        if (!assignData.assignProductToCustomer.adoptionPlan) {
            console.log('   ℹ️  Adoption Plan not auto-created, creating explicitly...');
            const planData = await graphqlRequest(CREATE_ADOPTION_PLAN, {
                customerProductId: state.customerProductId
            }, state.token);
            state.adoptionPlanId = planData.createAdoptionPlan.id;
        } else {
            state.adoptionPlanId = assignData.assignProductToCustomer.adoptionPlan.id;
        }
        // ... existing adoption plan creation ...
        console.log(`   ✅ Adoption Plan Active (ID: ${state.adoptionPlanId})`);

        // ---------------------------------------------------------
        // 4b. VERIFY TASK FILTERING LOGIC
        // ---------------------------------------------------------
        console.log('\n[4b/6] Task Filtering Verification');

        // Create a second Outcome (Outcome B)
        const outBData = await graphqlRequest(CREATE_OUTCOME, {
            input: { name: "Outcome B", description: "Desc B", productId: state.productId }
        }, state.token);
        const outcomeBId = outBData.createOutcome.id;
        console.log(`   ✅ Created Outcome B`);

        // Create Task Specific to B
        const taskBData = await graphqlRequest(CREATE_TASK, {
            input: {
                productId: state.productId,
                name: "Task For Outcome B Only",
                estMinutes: 30,
                weight: 5,
                outcomeIds: [outcomeBId],
                licenseId: state.licenseId
            }
        }, state.token);
        const taskBId = taskBData.createTask.id;
        console.log(`   ✅ Created Task specific to Outcome B`);

        // Create Generic Task (No Outcome)
        const taskGenericData = await graphqlRequest(CREATE_TASK, {
            input: {
                productId: state.productId,
                name: "Generic Task",
                estMinutes: 15,
                weight: 2,
                licenseId: state.licenseId
            }
        }, state.token);
        const taskGenericId = taskGenericData.createTask.id;
        console.log(`   ✅ Created Generic Task (No Outcome)`);

        // Assign Product to Customer AGAIN (simulating a second assignment or just creating a new customer for clean test)
        // Let's create a new customer "Restricted Customer"
        const custRestrictedData = await graphqlRequest(CREATE_CUSTOMER, {
            input: { name: "Restricted Customer " + timestamp, description: "Testing filters" }
        }, state.token);
        const custRestrictedId = custRestrictedData.createCustomer.id;

        // Assign with ONLY Outcome A (state.outcomeId)
        // Verification: Should include "Test Task" (Outcome A) and "Generic Task". Should EXCLUDE "Task For Outcome B Only".
        const assignRestricted = await graphqlRequest(ASSIGN_PRODUCT_TO_CUSTOMER, {
            input: {
                customerId: custRestrictedId,
                productId: state.productId,
                name: "Restricted Plan",
                licenseLevel: "Essential",
                selectedOutcomeIds: [state.outcomeId],
                selectedReleaseIds: []
            }
        }, state.token);

        const restrictedPlanId = assignRestricted.assignProductToCustomer.adoptionPlan
            ? assignRestricted.assignProductToCustomer.adoptionPlan.id
            : (await graphqlRequest(CREATE_ADOPTION_PLAN, { customerProductId: assignRestricted.assignProductToCustomer.id }, state.token)).createAdoptionPlan.id;

        // Query Helper
        const GET_PLAN_TASKS = `
            query GetPlanTasks($id: ID!) {
                adoptionPlan(id: $id) {
                    tasks { originalTaskId name }
                }
            }
        `;

        const planTasksData = await graphqlRequest(GET_PLAN_TASKS, { id: restrictedPlanId }, state.token);
        const tasks = planTasksData.adoptionPlan.tasks;

        const hasTaskA = tasks.some(t => t.originalTaskId === state.taskId);
        const hasTaskB = tasks.some(t => t.originalTaskId === taskBId);
        const hasGeneric = tasks.some(t => t.originalTaskId === taskGenericId);

        console.log(`   🔍 Filter Check: Task A (Expected: YES): ${hasTaskA ? '✅' : '❌'}`);
        console.log(`   🔍 Filter Check: Task B (Expected: NO):  ${!hasTaskB ? '✅' : '❌'}`);
        console.log(`   🔍 Filter Check: Generic (Expected: YES): ${hasGeneric ? '✅' : '❌'}`);

        if (!hasTaskA) throw new Error("Filter Error: Task matching Outcome A missing");
        if (hasTaskB) throw new Error("Filter Error: Task matching Outcome B included (should be filtered out)");
        if (!hasGeneric) throw new Error("Filter Error: Generic task missing (should be included)");

        // Cleanup extra customer
        await graphqlRequest(DELETE_CUSTOMER, { id: custRestrictedId }, state.token);
        // Soft delete the extra tasks
        await graphqlRequest(DELETE_TASK, { id: taskBId }, state.token);
        await graphqlRequest(DELETE_TASK, { id: taskGenericId }, state.token);



        // ---------------------------------------------------------
        // 5. IMPORT/EXPORT
        // ---------------------------------------------------------
        console.log('\n[5/6] Import/Export Functionality');

        // Export Product
        const expProd = await graphqlRequest(EXPORT_PRODUCT, {
            productName: prodData.createProduct.name
        }, state.token);
        if (!expProd.exportProductToExcel.filename) throw new Error("Export failed");
        console.log(`   ✅ Exported Product to Excel (${expProd.exportProductToExcel.size} bytes)`);

        // Export Telemetry Template
        const expTelem = await graphqlRequest(EXPORT_TELEMETRY_TEMPLATE, {
            adoptionPlanId: state.adoptionPlanId
        }, state.token);
        if (!expTelem.exportAdoptionPlanTelemetryTemplate.url) throw new Error("Telemetry export failed");
        console.log(`   ✅ Exported Telemetry Template`);


        // ---------------------------------------------------------
        // 5b. BACKUP VERIFICATION
        // ---------------------------------------------------------
        console.log('\n[5b/6] Backup Verification');
        const backupName = "TestBackup";
        const backupData = await graphqlRequest(CREATE_BACKUP, { customName: backupName }, state.token);
        if (!backupData.createBackup.success) throw new Error("Backup failed");
        console.log(`   ✅ Backup Created: ${backupData.createBackup.filename}`);
        if (!backupData.createBackup.filename.includes(backupName)) throw new Error("Backup filename missing custom name");


        // ---------------------------------------------------------
        // 6. TEARDOWN / CLEANUP
        // ---------------------------------------------------------
        console.log('\n[6/6] Cleanup');

        // Soft delete task first
        await graphqlRequest(DELETE_TASK, { id: state.taskId }, state.token);
        console.log(`   ✅ Deleted Task`);

        // Delete Customer (Assuming cascade or manual clean not needed for plan if cust deleted primarily)
        await graphqlRequest(DELETE_CUSTOMER, { id: state.customerId }, state.token);
        console.log(`   ✅ Deleted Customer`);

        // Remove Product from Solution
        await graphqlRequest(REMOVE_PRODUCT_FROM_SOLUTION, {
            solutionId: state.solutionId,
            productId: state.productId
        }, state.token);
        console.log(`   ✅ Removed Product from Solution`);

        // Delete Solution
        await graphqlRequest(DELETE_SOLUTION, { id: state.solutionId }, state.token);
        console.log(`   ✅ Deleted Solution`);

        // Delete Product
        await graphqlRequest(DELETE_PRODUCT, { id: state.productId }, state.token);
        console.log(`   ✅ Deleted Product`);

        console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! The system is healthy.');
        process.exit(0);

    } catch (e) {
        console.error('\n❌ TEST FAILED:', e.message);
        // Attempt cleanup on fail
        try {
            console.log('Attempting emergency cleanup...');
            if (state.token) {
                if (state.customerId) await graphqlRequest(DELETE_CUSTOMER, { id: state.customerId }, state.token).catch(() => console.log('Cust cleanup fail'));
                if (state.solutionId) await graphqlRequest(DELETE_SOLUTION, { id: state.solutionId }, state.token).catch(() => console.log('Sol cleanup fail'));
                if (state.productId) await graphqlRequest(DELETE_PRODUCT, { id: state.productId }, state.token).catch(() => console.log('Prod cleanup fail'));
            }
        } catch (cleanupErr) {
            console.error('Cleanup also failed');
        }
        process.exit(1);
    }
}

runTest();

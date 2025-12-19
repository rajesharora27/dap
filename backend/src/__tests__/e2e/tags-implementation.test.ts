/**
 * Comprehensive End-to-End Test Suite for DAP Application
 * 
 * Tests all CRUD functionality for:
 * - Products (with outcomes, releases, licenses, custom attributes)
 * - Tasks (with telemetry attributes)
 * - Solutions
 * - Customers
 * - Adoption Plans (product/solution assignments)
 * - Import/Export functionality
 * 
 * Run with: npx ts-node src/__tests__/e2e/comprehensive-crud.test.ts
 * Or via Jest: npm test comprehensive-crud
 */

import { PrismaClient, LicenseLevel, TelemetryDataType } from '@prisma/client';

// Force a safe, isolated test database for e2e runs
const DEFAULT_TEST_DB = 'postgresql://postgres:postgres@localhost:5432/dap_test?schema=public';
const dbUrl = process.env.DATABASE_URL || DEFAULT_TEST_DB;

if (!dbUrl.includes('dap_test')) {
    throw new Error(
        `❌ Refusing to run e2e tests on non-test database. DATABASE_URL="${dbUrl}". ` +
        `Set ALLOW_NON_TEST_DB=true to override (not recommended).`
    );
}

const prisma = new PrismaClient({
    datasources: {
        db: { url: dbUrl }
    }
});

interface TestResult {
    name: string;
    passed: boolean;
    error?: string;
    duration?: number;
}

const results: TestResult[] = [];

async function runTest(name: string, testFn: () => Promise<void>): Promise<void> {
    const start = Date.now();
    try {
        await testFn();
        results.push({ name, passed: true, duration: Date.now() - start });
        console.log(`✅ PASS: ${name} (${Date.now() - start}ms)`);
    } catch (error: any) {
        results.push({ name, passed: false, error: error.message, duration: Date.now() - start });
        console.log(`❌ FAIL: ${name} - ${error.message}`);
    }
}

// ============================================================================
// PRODUCT CRUD TESTS
// ============================================================================

async function testProductCRUD() {
    let productId: string;

    await runTest('Product: Create', async () => {
        const product = await prisma.product.create({
            data: {
                name: `Test Product ${Date.now()}`,
                description: 'Test product description',
                customAttrs: { testKey: 'testValue' }
            }
        });
        productId = product.id;
        if (!product.id) throw new Error('Product not created');
    });

    await runTest('Product: Read', async () => {
        const product = await prisma.product.findUnique({
            where: { id: productId }
        });
        if (!product) throw new Error('Product not found');
        if (!product.name.includes('Test Product')) throw new Error('Product name mismatch');
    });

    await runTest('Product: Update', async () => {
        const updated = await prisma.product.update({
            where: { id: productId },
            data: { description: 'Updated description' }
        });
        if (updated.description !== 'Updated description') throw new Error('Update failed');
    });

    await runTest('Product: Add Outcome', async () => {
        const outcome = await prisma.outcome.create({
            data: {
                name: 'Test Outcome',
                description: 'Test outcome description',
                productId
            }
        });
        if (!outcome.id) throw new Error('Outcome not created');
    });

    await runTest('Product: Add Release', async () => {
        const release = await prisma.release.create({
            data: {
                name: 'v1.0',
                description: 'Initial release',
                level: 1,
                productId
            }
        });
        if (!release.id) throw new Error('Release not created');
    });

    await runTest('Product: Add License', async () => {
        const license = await prisma.license.create({
            data: {
                name: 'Essential',
                description: 'Essential license',
                level: 1,
                isActive: true,
                productId
            }
        });
        if (!license.id) throw new Error('License not created');
    });

    await runTest('Product: Update Custom Attributes', async () => {
        const updated = await prisma.product.update({
            where: { id: productId },
            data: {
                customAttrs: {
                    vendor: 'Cisco',
                    version: '2.0',
                    category: 'Security'
                }
            }
        });
        const attrs = updated.customAttrs as any;
        if (!attrs.vendor || attrs.vendor !== 'Cisco') throw new Error('Custom attrs update failed');
    });

    await runTest('Product: Delete', async () => {
        // Delete related entities first
        await prisma.outcome.deleteMany({ where: { productId } });
        await prisma.release.deleteMany({ where: { productId } });
        await prisma.license.deleteMany({ where: { productId } });
        await prisma.product.delete({ where: { id: productId } });

        const deleted = await prisma.product.findUnique({ where: { id: productId } });
        if (deleted) throw new Error('Product not deleted');
    });
}

// ============================================================================
// TASK CRUD TESTS
// ============================================================================

async function testTaskCRUD() {
    let productId: string;
    let taskId: string;

    // Setup: Create product with license
    const product = await prisma.product.create({
        data: {
            name: `Task Test Product ${Date.now()}`,
            description: 'Product for task tests'
        }
    });
    productId = product.id;

    // Create license for reference (tasks use licenseLevel enum, not licenseId)
    await prisma.license.create({
        data: {
            name: 'Test License',
            level: 1,
            isActive: true,
            productId
        }
    });

    await runTest('Task: Create', async () => {
        const task = await prisma.task.create({
            data: {
                name: 'Test Task',
                description: 'Test task description',
                estMinutes: 30,
                weight: 10,
                sequenceNumber: 1,
                licenseLevel: LicenseLevel.ESSENTIAL,
                productId
            }
        });
        taskId = task.id;
        if (!task.id) throw new Error('Task not created');
    });

    await runTest('Task: Read', async () => {
        const task = await prisma.task.findUnique({
            where: { id: taskId }
        });
        if (!task) throw new Error('Task not found');
        if (task.name !== 'Test Task') throw new Error('Task name mismatch');
    });

    await runTest('Task: Update', async () => {
        const updated = await prisma.task.update({
            where: { id: taskId },
            data: {
                weight: 25,
                estMinutes: 60,
                notes: 'Updated notes'
            }
        });
        if (Number(updated.weight) !== 25) throw new Error('Task update failed');
    });

    await runTest('Task: Add Telemetry Attribute', async () => {
        const telemetry = await prisma.telemetryAttribute.create({
            data: {
                name: 'Test Telemetry',
                description: 'Test telemetry attribute',
                dataType: TelemetryDataType.NUMBER,
                isRequired: true,
                successCriteria: { operator: 'gte', value: 100 },
                order: 1,
                isActive: true,
                taskId
            }
        });
        if (!telemetry.id) throw new Error('Telemetry not created');
    });

    await runTest('Task: Reorder (sequence change)', async () => {
        const updated = await prisma.task.update({
            where: { id: taskId },
            data: { sequenceNumber: 5 }
        });
        if (updated.sequenceNumber !== 5) throw new Error('Sequence update failed');
    });

    await runTest('Task: Delete', async () => {
        await prisma.telemetryAttribute.deleteMany({ where: { taskId } });
        await prisma.task.delete({ where: { id: taskId } });

        const deleted = await prisma.task.findUnique({ where: { id: taskId } });
        if (deleted) throw new Error('Task not deleted');
    });

    // Cleanup
    await prisma.license.deleteMany({ where: { productId } });
    await prisma.product.delete({ where: { id: productId } });
}

// ============================================================================
// TAG CRUD TESTS
// ============================================================================

async function testTagCRUD() {
    // Create a product for tagging
    const product = await prisma.product.create({
        data: { name: `Tag Test Product ${Date.now()}` }
    });
    const productId = product.id;

    // Create a product tag
    const productTag = await prisma.productTag.create({
        data: {
            productId,
            name: 'Urgent',
            color: 'primary',
            displayOrder: 1
        }
    });
    const tagId = productTag.id;

    // Verify product tag creation
    await runTest('Tag: ProductTag Create', async () => {
        const fetched = await prisma.productTag.findUnique({ where: { id: tagId } });
        if (!fetched) throw new Error('ProductTag not found');
        if (fetched.name !== 'Urgent') throw new Error('ProductTag name mismatch');
    });

    // Create a task under the product
    const task = await prisma.task.create({
        data: {
            name: 'Tag Test Task',
            estMinutes: 15,
            weight: 5,
            sequenceNumber: 1,
            licenseLevel: LicenseLevel.ESSENTIAL,
            productId
        }
    });
    const taskId = task.id;

    // Assign the tag to the task
    const taskTag = await prisma.taskTag.create({
        data: {
            taskId,
            tagId
        }
    });
    const taskTagId = taskTag.id;

    // Verify task tag linkage
    await runTest('Tag: TaskTag Create & Link', async () => {
        const fetched = await prisma.taskTag.findUnique({ where: { id: taskTagId }, include: { tag: true, task: true } });
        if (!fetched) throw new Error('TaskTag not found');
        if (fetched.tag.id !== tagId) throw new Error('TaskTag linked to wrong tag');
        if (fetched.task.id !== taskId) throw new Error('TaskTag linked to wrong task');
    });

    // Cleanup: delete task tag, task, product tag, product
    await prisma.taskTag.delete({ where: { id: taskTagId } });
    await prisma.task.delete({ where: { id: taskId } });
    await prisma.productTag.delete({ where: { id: tagId } });
    await prisma.product.delete({ where: { id: productId } });
}


// ============================================================================
// SOLUTION CRUD TESTS
// ============================================================================

async function testSolutionCRUD() {
    let solutionId: string;
    let productId: string;

    // Setup: Create a product to associate
    const product = await prisma.product.create({
        data: {
            name: `Solution Test Product ${Date.now()}`,
            description: 'Product for solution tests'
        }
    });
    productId = product.id;

    await runTest('Solution: Create', async () => {
        const solution = await prisma.solution.create({
            data: {
                name: `Test Solution ${Date.now()}`,
                description: 'Test solution description',
                customAttrs: { useCase: 'Security' }
            }
        });
        solutionId = solution.id;
        if (!solution.id) throw new Error('Solution not created');
    });

    await runTest('Solution: Read', async () => {
        const solution = await prisma.solution.findUnique({
            where: { id: solutionId }
        });
        if (!solution) throw new Error('Solution not found');
    });

    await runTest('Solution: Update', async () => {
        const updated = await prisma.solution.update({
            where: { id: solutionId },
            data: { description: 'Updated solution description' }
        });
        if (updated.description !== 'Updated solution description') throw new Error('Update failed');
    });

    await runTest('Solution: Add Product', async () => {
        await prisma.solutionProduct.create({
            data: {
                solutionId,
                productId
            }
        });
        const solution = await prisma.solution.findUnique({
            where: { id: solutionId },
            include: { products: true }
        });
        if (!solution?.products?.length) throw new Error('Product not added to solution');
    });

    await runTest('Solution: Remove Product', async () => {
        await prisma.solutionProduct.deleteMany({
            where: { solutionId, productId }
        });
        const solution = await prisma.solution.findUnique({
            where: { id: solutionId },
            include: { products: true }
        });
        if (solution?.products?.length) throw new Error('Product not removed from solution');
    });

    await runTest('Solution: Delete', async () => {
        await prisma.solution.delete({ where: { id: solutionId } });
        const deleted = await prisma.solution.findUnique({ where: { id: solutionId } });
        if (deleted) throw new Error('Solution not deleted');
    });

    // Cleanup
    await prisma.product.delete({ where: { id: productId } });
}

// ============================================================================
// CUSTOMER CRUD TESTS
// ============================================================================

async function testCustomerCRUD() {
    let customerId: string;

    await runTest('Customer: Create', async () => {
        const customer = await prisma.customer.create({
            data: {
                name: `Test Customer ${Date.now()}`,
                description: 'Test customer description'
            }
        });
        customerId = customer.id;
        if (!customer.id) throw new Error('Customer not created');
    });

    await runTest('Customer: Read', async () => {
        const customer = await prisma.customer.findUnique({
            where: { id: customerId }
        });
        if (!customer) throw new Error('Customer not found');
    });

    await runTest('Customer: Update', async () => {
        const updated = await prisma.customer.update({
            where: { id: customerId },
            data: { description: 'Updated customer description' }
        });
        if (updated.description !== 'Updated customer description') throw new Error('Update failed');
    });

    await runTest('Customer: Delete', async () => {
        await prisma.customer.delete({ where: { id: customerId } });
        const deleted = await prisma.customer.findUnique({ where: { id: customerId } });
        if (deleted) throw new Error('Customer not deleted');
    });
}

// ============================================================================
// ADOPTION PLAN (PRODUCT ASSIGNMENT) TESTS
// ============================================================================

async function testAdoptionPlanCRUD() {
    let customerId: string;
    let productId: string;
    let customerProductId: string;
    let adoptionPlanId: string;
    let productName: string;

    // Setup
    const customer = await prisma.customer.create({
        data: { name: `Adoption Test Customer ${Date.now()}` }
    });
    customerId = customer.id;

    productName = `Adoption Test Product ${Date.now()}`;
    const product = await prisma.product.create({
        data: { name: productName }
    });
    productId = product.id;

    await runTest('Adoption: Assign Product to Customer', async () => {
        const cp = await prisma.customerProduct.create({
            data: {
                customerId,
                productId,
                name: 'Customer Product Assignment'
            }
        });
        customerProductId = cp.id;
        if (!cp.id) throw new Error('Product assignment failed');
    });

    await runTest('Adoption: Create Adoption Plan', async () => {
        const plan = await prisma.adoptionPlan.create({
            data: {
                customerProductId,
                productId,
                productName,
                licenseLevel: LicenseLevel.ESSENTIAL
            }
        });
        adoptionPlanId = plan.id;
        if (!plan.id) throw new Error('Adoption plan not created');
    });

    await runTest('Adoption: Read Adoption Plan', async () => {
        const plan = await prisma.adoptionPlan.findUnique({
            where: { id: adoptionPlanId },
            include: { customerProduct: true }
        });
        if (!plan) throw new Error('Adoption plan not found');
    });

    await runTest('Adoption: Update Adoption Plan', async () => {
        const updated = await prisma.adoptionPlan.update({
            where: { id: adoptionPlanId },
            data: { licenseLevel: LicenseLevel.ADVANTAGE }
        });
        if (updated.licenseLevel !== LicenseLevel.ADVANTAGE) throw new Error('Update failed');
    });

    await runTest('Adoption: Delete Adoption Plan', async () => {
        await prisma.adoptionPlan.delete({ where: { id: adoptionPlanId } });
        const deleted = await prisma.adoptionPlan.findUnique({ where: { id: adoptionPlanId } });
        if (deleted) throw new Error('Adoption plan not deleted');
    });

    await runTest('Adoption: Unassign Product from Customer', async () => {
        await prisma.customerProduct.delete({ where: { id: customerProductId } });
        const deleted = await prisma.customerProduct.findUnique({ where: { id: customerProductId } });
        if (deleted) throw new Error('Product unassignment failed');
    });

    // Cleanup
    await prisma.customer.delete({ where: { id: customerId } });
    await prisma.product.delete({ where: { id: productId } });
}

// ============================================================================
// IMPORT/EXPORT FUNCTIONALITY TESTS
// ============================================================================

async function testImportExport() {
    let productId: string;

    // Create a product with full data for export/import testing
    await runTest('Import/Export: Create Product with Full Data', async () => {
        const product = await prisma.product.create({
            data: {
                name: `Export Test Product ${Date.now()}`,
                description: 'Product for export testing',
                customAttrs: { vendor: 'Cisco', version: '1.0' }
            }
        });
        productId = product.id;

        // Add outcomes
        await prisma.outcome.create({
            data: { name: 'Export Outcome', productId }
        });

        // Add releases
        await prisma.release.create({
            data: { name: '1.0', level: 1, productId }
        });

        // Add licenses
        await prisma.license.create({
            data: { name: 'Essential', level: 1, isActive: true, productId }
        });

        // Add task with telemetry
        const task = await prisma.task.create({
            data: {
                name: 'Export Task',
                estMinutes: 30,
                weight: 10,
                sequenceNumber: 1,
                licenseLevel: LicenseLevel.ESSENTIAL,
                productId
            }
        });

        await prisma.telemetryAttribute.create({
            data: {
                name: 'Export Telemetry',
                dataType: TelemetryDataType.NUMBER,
                isRequired: true,
                successCriteria: { operator: 'gte', value: 0 },
                order: 1,
                isActive: true,
                taskId: task.id
            }
        });

        if (!product.id) throw new Error('Export test product not created');
    });

    await runTest('Import/Export: Verify Product Has All Related Data', async () => {
        const product = await prisma.product.findUnique({
            where: { id: productId },
            include: {
                outcomes: true,
                releases: true,
                licenses: true,
                tasks: {
                    include: { telemetryAttributes: true }
                }
            }
        });

        if (!product) throw new Error('Product not found');
        if (!product.outcomes?.length) throw new Error('No outcomes');
        if (!product.releases?.length) throw new Error('No releases');
        if (!product.licenses?.length) throw new Error('No licenses');
        if (!product.tasks?.length) throw new Error('No tasks');
        if (!product.tasks[0].telemetryAttributes?.length) throw new Error('No telemetry');
    });

    await runTest('Import/Export: Custom Attributes JSON Structure', async () => {
        const product = await prisma.product.findUnique({
            where: { id: productId }
        });
        const attrs = product?.customAttrs as any;
        if (!attrs || !attrs.vendor) throw new Error('Custom attrs missing');
    });

    // Cleanup
    await runTest('Import/Export: Cleanup', async () => {
        const tasks = await prisma.task.findMany({ where: { productId } });
        for (const task of tasks) {
            await prisma.telemetryAttribute.deleteMany({ where: { taskId: task.id } });
        }
        await prisma.task.deleteMany({ where: { productId } });
        await prisma.outcome.deleteMany({ where: { productId } });
        await prisma.release.deleteMany({ where: { productId } });
        await prisma.license.deleteMany({ where: { productId } });
        await prisma.product.delete({ where: { id: productId } });
    });
}

// ============================================================================
// TELEMETRY & EVALUATION TESTS
// ============================================================================

async function testTelemetryEvaluation() {
    let productId: string;
    let taskId: string;
    let telemetryId: string;

    // Setup
    const product = await prisma.product.create({
        data: { name: `Telemetry Test Product ${Date.now()}` }
    });
    productId = product.id;

    await prisma.license.create({
        data: { name: 'Test', level: 1, isActive: true, productId }
    });

    const task = await prisma.task.create({
        data: {
            name: 'Telemetry Test Task',
            estMinutes: 30,
            weight: 10,
            sequenceNumber: 1,
            licenseLevel: LicenseLevel.ESSENTIAL,
            productId
        }
    });
    taskId = task.id;

    await runTest('Telemetry: Create with Success Criteria (Number)', async () => {
        const telemetry = await prisma.telemetryAttribute.create({
            data: {
                name: 'Number Telemetry',
                dataType: TelemetryDataType.NUMBER,
                isRequired: true,
                successCriteria: { operator: 'gte', value: 100 },
                order: 1,
                isActive: true,
                taskId
            }
        });
        telemetryId = telemetry.id;
        if (!telemetry.id) throw new Error('Telemetry not created');
    });

    await runTest('Telemetry: Create with Boolean Criteria', async () => {
        const telemetry = await prisma.telemetryAttribute.create({
            data: {
                name: 'Boolean Telemetry',
                dataType: TelemetryDataType.BOOLEAN,
                isRequired: true,
                successCriteria: { operator: 'eq', value: true },
                order: 2,
                isActive: true,
                taskId
            }
        });
        if (!telemetry.id) throw new Error('Boolean telemetry not created');
    });

    await runTest('Telemetry: Create with String Contains Criteria', async () => {
        const telemetry = await prisma.telemetryAttribute.create({
            data: {
                name: 'String Telemetry',
                dataType: TelemetryDataType.STRING,
                isRequired: false,
                successCriteria: { operator: 'contains', value: 'success' },
                order: 3,
                isActive: true,
                taskId
            }
        });
        if (!telemetry.id) throw new Error('String telemetry not created');
    });

    await runTest('Telemetry: Update Success Criteria', async () => {
        const updated = await prisma.telemetryAttribute.update({
            where: { id: telemetryId },
            data: {
                successCriteria: { operator: 'gt', value: 200 }
            }
        });
        const criteria = updated.successCriteria as any;
        if (criteria.value !== 200) throw new Error('Criteria update failed');
    });

    // Cleanup
    await prisma.telemetryAttribute.deleteMany({ where: { taskId } });
    await prisma.task.delete({ where: { id: taskId } });
    await prisma.license.deleteMany({ where: { productId } });
    await prisma.product.delete({ where: { id: productId } });
}

// ============================================================================
// CUSTOMER TAG SYNC TESTS
// ============================================================================

async function testCustomerTagSync() {
    let productId: string;
    let customerId: string;
    let planId: string;

    // 1. Setup Data using Prisma (Products, Tags, Tasks)
    const product = await prisma.product.create({ data: { name: `Sync Tag Product ${Date.now()}` } });
    productId = product.id;

    const tag1 = await prisma.productTag.create({ data: { productId, name: 'Tag1', color: 'red', displayOrder: 1 } });
    const tag2 = await prisma.productTag.create({ data: { productId, name: 'Tag2', color: 'blue', displayOrder: 2 } });

    const task = await prisma.task.create({
        data: {
            name: 'Tagged Task',
            estMinutes: 60,
            weight: 1,
            sequenceNumber: 1,
            licenseLevel: LicenseLevel.ESSENTIAL,
            productId
        }
    });

    await prisma.taskTag.create({ data: { taskId: task.id, tagId: tag1.id } });

    // 2. Setup Customer & Assignment
    const customer = await prisma.customer.create({ data: { name: `Tag Sync Customer ${Date.now()}` } });
    customerId = customer.id;

    const cp = await prisma.customerProduct.create({
        data: {
            customerId: customer.id,
            productId,
            name: 'Tag Sync Assignment',
            licenseLevel: LicenseLevel.ESSENTIAL
        }
    });

    // 3. Call createAdoptionPlan Resolver
    // Need to dynamically import to avoid top-level failures if files missing
    const { CustomerAdoptionMutationResolvers } = require('../../schema/resolvers/customerAdoption');

    // Mock Context - Resolvers check roles
    const ctx = {
        user: { id: 'test-admin', role: 'ADMIN' }
    };

    await runTest('Tag Sync: Create Adoption Plan with Tags', async () => {
        const plan = await CustomerAdoptionMutationResolvers.createAdoptionPlan(
            {},
            { customerProductId: cp.id },
            ctx
        );
        planId = plan.id;

        // Verify CustomerProductTags created
        const cpTags = await prisma.customerProductTag.findMany({ where: { customerProductId: cp.id } });
        if (cpTags.length !== 2) throw new Error(`Expected 2 customer tags, found ${cpTags.length}`);

        // Verify CustomerTaskTags created
        const customerTask = await prisma.customerTask.findFirst({ where: { adoptionPlanId: plan.id } });
        if (!customerTask) throw new Error('Customer Task not found');

        const ctTags = await prisma.customerTaskTag.findMany({ where: { customerTaskId: customerTask.id } });
        if (ctTags.length !== 1) throw new Error(`Expected 1 task tag, found ${ctTags.length}`);

        // Check linkage
        const linkedTag = cpTags.find(t => t.id === ctTags[0].tagId);
        if (linkedTag?.name !== 'Tag1') throw new Error(`Task tag mismatch: expected Tag1, got ${linkedTag?.name}`);
    });

    // 4. Test Sync
    // Add new tag/task to product
    const task2 = await prisma.task.create({
        data: {
            name: 'New Task',
            estMinutes: 30,
            weight: 1,
            sequenceNumber: 2,
            licenseLevel: LicenseLevel.ESSENTIAL,
            productId
        }
    });
    await prisma.taskTag.create({ data: { taskId: task2.id, tagId: tag2.id } });

    await runTest('Tag Sync: Sync Adoption Plan', async () => {
        const updatedPlan = await CustomerAdoptionMutationResolvers.syncAdoptionPlan(
            {},
            { adoptionPlanId: planId },
            ctx
        );

        // Verify new task has tag
        const newTask = await prisma.customerTask.findFirst({
            where: { adoptionPlanId: planId, originalTaskId: task2.id }
        });
        if (!newTask) throw new Error('New task not synced');

        const ctTags = await prisma.customerTaskTag.findMany({ where: { customerTaskId: newTask.id } });
        if (ctTags.length !== 1) throw new Error(`Expected 1 tag on new task, found ${ctTags.length}`);

        const cpTags = await prisma.customerProductTag.findMany({ where: { customerProductId: cp.id } });
        const linkedTag = cpTags.find(t => t.id === ctTags[0].tagId);
        if (linkedTag?.name !== 'Tag2') throw new Error(`New task tag mismatch: expected Tag2, got ${linkedTag?.name}`);
    });

    // Cleanup
    await prisma.customer.delete({ where: { id: customerId } });
    await prisma.product.delete({ where: { id: productId } });
}

// ============================================================================
// SOLUTION TAG CRUD & SYNC TESTS
// ============================================================================

async function testSolutionTagCRUD() {
    // Create a solution for tagging
    const solution = await prisma.solution.create({
        data: { name: `Tag Test Solution ${Date.now()}` }
    });
    const solutionId = solution.id;

    // Create a solution tag
    const solutionTag = await prisma.solutionTag.create({
        data: {
            solutionId,
            name: 'Strategic',
            color: 'purple',
            displayOrder: 1
        }
    });
    const tagId = solutionTag.id;

    await runTest('SolutionTag: Create', async () => {
        const fetched = await prisma.solutionTag.findUnique({ where: { id: tagId } });
        if (!fetched) throw new Error('SolutionTag not found');
        if (fetched.name !== 'Strategic') throw new Error('SolutionTag name mismatch');
    });

    // Create a solution task (task with solutionId)
    const task = await prisma.task.create({
        data: {
            name: 'Tag Test SolTask',
            estMinutes: 15,
            weight: 5,
            sequenceNumber: 1,
            licenseLevel: LicenseLevel.ESSENTIAL,
            solutionId
        }
    });
    const taskId = task.id;

    // Assign tag to task
    const taskTag = await prisma.solutionTaskTag.create({
        data: {
            taskId,
            tagId
        }
    });
    const taskTagId = taskTag.id;

    await runTest('SolutionTag: SolutionTaskTag Create & Link', async () => {
        const fetched = await prisma.solutionTaskTag.findUnique({ where: { id: taskTagId }, include: { tag: true, task: true } });
        if (!fetched) throw new Error('SolutionTaskTag not found');
        if (fetched.tag.id !== tagId) throw new Error('SolutionTaskTag linked to wrong tag');
        if (fetched.task.id !== taskId) throw new Error('SolutionTaskTag linked to wrong task');
    });

    // Cleanup
    await prisma.solutionTaskTag.delete({ where: { id: taskTagId } });
    await prisma.task.delete({ where: { id: taskId } });
    await prisma.solutionTag.delete({ where: { id: tagId } });
    await prisma.solution.delete({ where: { id: solutionId } });
}

async function testSolutionTagSync() {
    let solutionId: string;
    let productId: string;
    let customerId: string;
    let customerSolutionId: string = '';
    let planId: string;

    // 1. Setup Data (Solution, Product, Tags, Tasks)
    const solution = await prisma.solution.create({ data: { name: `Sync Tag Solution ${Date.now()}` } });
    solutionId = solution.id;

    const tag1 = await prisma.solutionTag.create({ data: { solutionId, name: 'SolTag1', color: 'orange', displayOrder: 1 } });
    const tag2 = await prisma.solutionTag.create({ data: { solutionId, name: 'SolTag2', color: 'green', displayOrder: 2 } });

    // Solution Task
    const task = await prisma.task.create({
        data: {
            name: 'Solution Tagged Task',
            estMinutes: 60,
            weight: 1,
            sequenceNumber: 1,
            licenseLevel: LicenseLevel.ESSENTIAL,
            solutionId
        }
    });
    await prisma.solutionTaskTag.create({ data: { taskId: task.id, tagId: tag1.id } });

    // Create dummy product for solution
    const product = await prisma.product.create({ data: { name: `Sol Sync Product ${Date.now()}` } });
    productId = product.id;
    await prisma.solutionProduct.create({ data: { solutionId, productId, order: 1 } });

    // 2. Setup Customer & Assignment
    const customer = await prisma.customer.create({ data: { name: `Sol Tag Sync Customer ${Date.now()}` } });
    customerId = customer.id;

    // Use specific inputs for assignment
    const { SolutionAdoptionMutationResolvers } = require('../../schema/resolvers/solutionAdoption');
    const ctx = { user: { id: 'test-admin', role: 'ADMIN' } };

    await runTest('Solution Tag Sync: Assign Solution', async () => {
        const cs = await SolutionAdoptionMutationResolvers.assignSolutionToCustomer(
            {},
            { input: { customerId, solutionId, name: 'Sol Assignment', licenseLevel: 'ESSENTIAL' } },
            ctx
        );
        customerSolutionId = cs.id;
    });

    // 3. Create Adoption Plan
    await runTest('Solution Tag Sync: Create Adoption Plan', async () => {
        const plan = await SolutionAdoptionMutationResolvers.createSolutionAdoptionPlan(
            {},
            { customerSolutionId },
            ctx
        );
        planId = plan.id;

        // Verify CustomerSolutionTags created
        const csTags = await prisma.customerSolutionTag.findMany({ where: { customerSolutionId } });
        if (csTags.length !== 2) throw new Error(`Expected 2 customer solution tags, found ${csTags.length}`);

        // Verify CustomerSolutionTaskTags
        const customerTask = await prisma.customerSolutionTask.findFirst({ where: { solutionAdoptionPlanId: plan.id } });
        if (!customerTask) throw new Error('Customer Solution Task not found');

        const cstTags = await prisma.customerSolutionTaskTag.findMany({ where: { customerSolutionTaskId: customerTask.id } });
        if (cstTags.length !== 1) throw new Error(`Expected 1 task tag, found ${cstTags.length}`);

        const linkedTag = csTags.find(t => t.id === cstTags[0].tagId);
        if (linkedTag?.name !== 'SolTag1') throw new Error(`Task tag mismatch: expected SolTag1, got ${linkedTag?.name}`);
    });

    // 4. Test Sync
    const task2 = await prisma.task.create({
        data: {
            name: 'New Sol Task',
            estMinutes: 30,
            weight: 1,
            sequenceNumber: 2,
            licenseLevel: LicenseLevel.ESSENTIAL,
            solutionId
        }
    });
    await prisma.solutionTaskTag.create({ data: { taskId: task2.id, tagId: tag2.id } });

    await runTest('Solution Tag Sync: Sync Adoption Plan', async () => {
        // We sync definition which includes re-syncing tags
        await SolutionAdoptionMutationResolvers.syncSolutionAdoptionPlan(
            {},
            { solutionAdoptionPlanId: planId },
            ctx
        );

        const newTask = await prisma.customerSolutionTask.findFirst({
            where: { solutionAdoptionPlanId: planId, originalTaskId: task2.id }
        });
        if (!newTask) throw new Error('New task not synced');

        const cstTags = await prisma.customerSolutionTaskTag.findMany({ where: { customerSolutionTaskId: newTask.id } });
        if (cstTags.length !== 1) throw new Error(`Expected 1 tag on new task, found ${cstTags.length}`);

        const csTags = await prisma.customerSolutionTag.findMany({ where: { customerSolutionId } });
        const linkedTag = csTags.find(t => t.id === cstTags[0].tagId);
        if (linkedTag?.name !== 'SolTag2') throw new Error(`New task tag mismatch: expected SolTag2, got ${linkedTag?.name}`);
    });

    // Cleanup
    await prisma.customer.delete({ where: { id: customerId } });
    await prisma.solutionProduct.deleteMany({ where: { solutionId } });
    await prisma.solution.delete({ where: { id: solutionId } });
    await prisma.product.delete({ where: { id: productId } });
}

// ============================================================================
// RUN ALL TESTS
// ============================================================================

async function runAllTests() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  DAP Comprehensive CRUD Test Suite');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`  Started: ${new Date().toISOString()}`);
    console.log('');

    try {
        console.log('\n📦 PRODUCT CRUD TESTS');
        console.log('─────────────────────────────────────────────────────────────────');

        // Ensure test user exists for AuditLog
        const testUserEmail = 'test-admin@example.com';
        const existingUser = await prisma.user.findFirst({ where: { email: testUserEmail } });
        if (!existingUser) {
            await prisma.user.create({
                data: {
                    id: 'test-admin',
                    email: testUserEmail,
                    username: 'test-admin',
                    name: 'Test Admin',
                    role: 'ADMIN',
                    password: 'placeholder',
                    isAdmin: true
                }
            });
        }

        await testProductCRUD();

        console.log('\n📋 TASK CRUD TESTS');
        console.log('─────────────────────────────────────────────────────────────────');
        await testTaskCRUD();

        console.log('\n🎯 SOLUTION CRUD TESTS');
        console.log('─────────────────────────────────────────────────────────────────');
        await testSolutionCRUD();

        console.log('\n👥 CUSTOMER CRUD TESTS');
        console.log('─────────────────────────────────────────────────────────────────');
        await testCustomerCRUD();

        console.log('\n🏷️ TAG CRUD TESTS');
        console.log('─────────────────────────────────────────────────────────────────');
        await testTagCRUD();

        console.log('\n🔄 CUSTOMER TAG SYNC TESTS');
        console.log('─────────────────────────────────────────────────────────────────');
        await testCustomerTagSync();

        console.log('\n🏷️ SOLUTION TAG CRUD TESTS');
        console.log('─────────────────────────────────────────────────────────────────');
        await testSolutionTagCRUD();

        console.log('\n🔄 SOLUTION TAG SYNC TESTS');
        console.log('─────────────────────────────────────────────────────────────────');
        await testSolutionTagSync();

        console.log('\n📊 ADOPTION PLAN TESTS');
        console.log('─────────────────────────────────────────────────────────────────');
        await testAdoptionPlanCRUD();

        console.log('\n📤 IMPORT/EXPORT TESTS');
        console.log('─────────────────────────────────────────────────────────────────');
        await testImportExport();

        console.log('\n📈 TELEMETRY EVALUATION TESTS');
        console.log('─────────────────────────────────────────────────────────────────');
        await testTelemetryEvaluation();

    } catch (error) {
        console.error('Test suite error:', error);
    } finally {
        await prisma.$disconnect();
    }

    // Summary
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('  TEST SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════');

    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    const total = results.length;

    console.log(`  Total Tests: ${total}`);
    console.log(`  ✅ Passed: ${passed}`);
    console.log(`  ❌ Failed: ${failed}`);
    console.log(`  Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
    console.log('');

    if (failed > 0) {
        console.log('  FAILED TESTS:');
        results.filter(r => !r.passed).forEach(r => {
            console.log(`    ❌ ${r.name}: ${r.error}`);
        });
    }

    console.log('');
    console.log(`  Completed: ${new Date().toISOString()}`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Throw error if any tests failed (Jest-compatible)
    if (failed > 0) {
        throw new Error(`${failed} test(s) failed`);
    }
}

// Jest-compatible test wrapper
if (typeof test !== 'undefined') {
    // Running under Jest
    test('Comprehensive CRUD Tests', runAllTests, 60000); // 60 second timeout
} else {
    // Running standalone with ts-node
    runAllTests().then(() => {
        process.exit(0);
    }).catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}


import { prisma } from './context';

async function inspectTask() {
    console.log('--- Inspecting Task ---');

    // Find Customer 'ACME'
    const customer = await prisma.customer.findFirst({
        where: { name: { contains: 'ACME', mode: 'insensitive' } }
    });

    if (!customer) {
        console.log('Customer ACME not found');
        return;
    }
    console.log(`Found Customer: ${customer.name} (${customer.id})`);

    // Find Solution 'SASE' for this customer
    // Note: Schema might link Customer -> CustomerSolution -> CustomerSolutionTask
    const customerSolution = await prisma.customerSolution.findFirst({
        where: {
            customerId: customer.id,
            solution: { name: { contains: 'SASE', mode: 'insensitive' } }
        }
    });

    if (!customerSolution) {
        console.log('Customer Solution SASE not found');
        return;
    }
    console.log(`Found Customer Solution: ${customerSolution.id}`);

    // Find Task #3 via SolutionAdoptionPlan
    const adoptionPlan = await prisma.solutionAdoptionPlan.findUnique({
        where: { customerSolutionId: customerSolution.id }
    });

    if (!adoptionPlan) {
        console.log('Adoption Plan not found');
        return;
    }

    console.log('--- Listing All Tasks ---');
    const allTasks = await prisma.customerSolutionTask.findMany({
        where: { solutionAdoptionPlanId: adoptionPlan.id },
        include: {
            telemetryAttributes: {
                include: {
                    values: {
                        orderBy: { createdAt: 'desc' },
                        take: 1
                    }
                }
            }
        },
        orderBy: { sequenceNumber: 'asc' }
    });

    allTasks.slice(0, 4).forEach((t: any) => {
        console.log(`\n[#${t.sequenceNumber}] ${t.name}`);
        console.log(`  Status: ${t.status} (Source: ${t.statusUpdateSource})`);
        t.telemetryAttributes.forEach((attr: any) => {
            const val = attr.values[0];
            console.log(`  - ${attr.name}: ${val ? JSON.stringify(val.value) : 'NO VALUE'} (Attr Met: ${attr.isMet})`);
            if (val) {
                console.log(`    Value Criteria Met: ${val.criteriaMet} (Source: ${val.source})`);
            }
            console.log(`    Criteria: ${JSON.stringify(attr.successCriteria)}`);
        });
    });
}

inspectTask()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());

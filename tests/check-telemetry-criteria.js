const { PrismaClient } = require('./backend/node_modules/@prisma/client');

const prisma = new PrismaClient();

async function checkTelemetryCriteria() {
  try {
    console.log('\n🔍 Checking Telemetry Attributes Success Criteria...\n');
    
    const attributes = await prisma.telemetryAttribute.findMany({
      include: {
        task: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        id: 'asc'
      }
    });

    if (attributes.length === 0) {
      console.log('❌ No telemetry attributes found in database');
      return;
    }

    console.log(`Found ${attributes.length} telemetry attributes:\n`);

    attributes.forEach((attr, index) => {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`#${index + 1}: ${attr.name} (Task: ${attr.task.name})`);
      console.log(`${'='.repeat(80)}`);
      console.log(`ID: ${attr.id}`);
      console.log(`Data Type: ${attr.dataType}`);
      console.log(`Is Required: ${attr.isRequired}`);
      console.log(`Is Active: ${attr.isActive}`);
      console.log(`\nSuccess Criteria RAW VALUE:`);
      console.log(`Type: ${typeof attr.successCriteria}`);
      console.log(`Value: ${JSON.stringify(attr.successCriteria, null, 2)}`);
      
      if (attr.successCriteria) {
        try {
          const parsed = typeof attr.successCriteria === 'string' 
            ? JSON.parse(attr.successCriteria) 
            : attr.successCriteria;
          console.log(`\nParsed Object:`);
          console.log(`  type: ${parsed.type}`);
          console.log(`  operator: ${parsed.operator}`);
          console.log(`  threshold: ${parsed.threshold}`);
          console.log(`  pattern: ${parsed.pattern}`);
          console.log(`  expectedValue: ${parsed.expectedValue}`);
          console.log(`  description: ${parsed.description}`);
        } catch (e) {
          console.log(`\n❌ Failed to parse success criteria: ${e.message}`);
        }
      } else {
        console.log(`\n⚠️  SUCCESS CRITERIA IS NULL/UNDEFINED/EMPTY`);
      }
    });

    console.log(`\n${'='.repeat(80)}\n`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTelemetryCriteria();

import { prisma } from './context';
import bcrypt from 'bcryptjs';

async function main() {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const seedDefaultUsers = (() => {
    const envVal = (process.env.SEED_DEFAULT_USERS || '').toLowerCase();
    if (envVal === 'true' || envVal === '1') return true;
    if (envVal === 'false' || envVal === '0') return false;
    return nodeEnv !== 'production';
  })();
  if (seedDefaultUsers) {
    const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin';
    const userEmail = process.env.DEFAULT_USER_EMAIL || 'user@example.com';
    const userPassword = process.env.DEFAULT_USER_PASSWORD || 'user';
    const defaultUsers: Array<{ email: string; username: string; password: string; role: 'ADMIN' | 'USER'; name: string }> = [
      { email: adminEmail, username: 'admin', password: adminPassword, role: 'ADMIN', name: 'Admin' },
      { email: userEmail, username: 'user', password: userPassword, role: 'USER', name: 'User' }
    ];
    for (const u of defaultUsers) {
      const existing = await prisma.user.findFirst({ where: { OR: [{ email: u.email }, { username: u.username }] } });
      if (!existing) {
        const hashed = await bcrypt.hash(u.password, 10);
        await prisma.user.create({ data: { email: u.email, username: u.username, password: hashed, role: u.role, name: u.name } });
        console.log(`[seed] Created default ${u.role} user: ${u.email}`);
        if (['admin', 'user', 'password'].includes(u.password) && nodeEnv === 'production') {
          console.warn('[seed] Weak default password used in production – change immediately.');
        }
      }
    }
  } else {
    console.log('[seed] Skipping default users');
  }

  const seedSampleData = (() => {
    const envVal = (process.env.SEED_SAMPLE_DATA || '').toLowerCase();
    if (envVal === 'true' || envVal === '1') return true;
    if (envVal === 'false' || envVal === '0') return false;
    return nodeEnv !== 'production';
  })();
  if (seedSampleData) {
    const product = await prisma.product.upsert({
      where: { id: 'sample-product-singleton' },
      update: {},
      create: { id: 'sample-product-singleton', name: 'Sample Product', description: 'First product', customAttrs: { priority: 'high' } }
    });

    // Create sample outcomes
    const outcomeNames = ['User Authentication', 'Data Analytics', 'Performance Optimization'];
    const outcomes = [];
    for (const outcomeName of outcomeNames) {
      const existing = await prisma.outcome.findFirst({ where: { name: outcomeName, productId: product.id } });
      if (!existing) {
        const outcome = await prisma.outcome.create({
          data: {
            name: outcomeName,
            description: `Sample outcome: ${outcomeName}`,
            productId: product.id
          }
        });
        outcomes.push(outcome);
      } else {
        outcomes.push(existing);
      }
    }

    // Create sample releases
    const releaseData = [
      { name: 'Alpha Release', level: 1.0, description: 'Initial alpha release' },
      { name: 'Beta Release', level: 1.5, description: 'Beta release with additional features' },
      { name: 'Release Candidate', level: 2.0, description: 'Release candidate' },
      { name: 'Version 2.1', level: 2.1, description: 'Minor update release' },
      { name: 'Version 3.0', level: 3.0, description: 'Major version release' }
    ];
    
    const releases = [];
    for (const releaseInfo of releaseData) {
      const existing = await prisma.release.findFirst({ 
        where: { productId: product.id, level: releaseInfo.level } 
      });
      if (!existing) {
        const release = await prisma.release.create({
          data: {
            name: releaseInfo.name,
            level: releaseInfo.level,
            description: releaseInfo.description,
            productId: product.id,
            isActive: true
          }
        });
        releases.push(release);
        console.log(`[seed] Created release: ${release.name} (${release.level})`);
      } else {
        releases.push(existing);
      }
    }

    for (let i = 1; i <= 5; i++) {
      const taskName = `Task ${i}`;
      const existing = await prisma.task.findFirst({ where: { name: taskName, productId: product.id } });
      if (!existing) {
        const task = await prisma.task.create({
          data: {
            name: taskName,
            productId: product.id,
            estMinutes: 60,
            weight: 20,
            description: 'Sample task',
            sequenceNumber: i,
            priority: 'Medium',
            licenseLevel: 'ESSENTIAL'
          }
        });

        // Assign tasks to releases based on a pattern
        // Tasks 1-2 -> Alpha (1.0)
        // Tasks 1-3 -> Beta (1.5)  
        // Tasks 1-4 -> RC (2.0)
        // Tasks 1-5 -> Version 2.1 (2.1)
        // All tasks -> Version 3.0 (3.0)
        const taskReleaseAssignments = [];
        
        if (i <= 2) {
          // Alpha release - tasks 1-2
          taskReleaseAssignments.push(releases[0]); // Alpha
        }
        if (i <= 3) {
          // Beta release - tasks 1-3 (includes Alpha tasks)
          taskReleaseAssignments.push(releases[1]); // Beta
        }
        if (i <= 4) {
          // RC release - tasks 1-4
          taskReleaseAssignments.push(releases[2]); // RC
        }
        if (i <= 5) {
          // Version 2.1 - tasks 1-5
          taskReleaseAssignments.push(releases[3]); // Version 2.1
        }
        // All tasks in Version 3.0
        taskReleaseAssignments.push(releases[4]); // Version 3.0

        // Create the task-release associations
        for (const release of taskReleaseAssignments) {
          await prisma.taskRelease.create({
            data: {
              taskId: task.id,
              releaseId: release.id
            }
          });
        }

        console.log(`[seed] Created task: ${taskName} assigned to ${taskReleaseAssignments.length} releases`);
      }
    }
  } else {
    console.log('[seed] Skipping sample data');
  }
}

main().then(() => { console.log('[seed] Completed'); process.exit(0); }).catch(e => { console.error('[seed] Failed', e); process.exit(1); });

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

    for (let i = 1; i <= 5; i++) {
      const taskName = `Task ${i}`;
      const existing = await prisma.task.findFirst({ where: { name: taskName, productId: product.id } });
      if (!existing) {
        await prisma.task.create({
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
      }
    }
  } else {
    console.log('[seed] Skipping sample data');
  }
}

main().then(() => { console.log('[seed] Completed'); process.exit(0); }).catch(e => { console.error('[seed] Failed', e); process.exit(1); });

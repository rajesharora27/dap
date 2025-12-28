import { PrismaClient } from '@prisma/client';
import { BackupRestoreService } from '../../modules/backup/backup.service';
import * as path from 'path';
import * as fs from 'fs';

const prisma = new PrismaClient();

describe('Backup & Restore E2E', () => {
    let backupFilename: string;

    beforeAll(async () => {
        // Ensure we are on the test database
        const dbUrl = process.env.DATABASE_URL || '';
        if (!dbUrl.includes('dap_test')) {
            throw new Error('E2E tests must run on dap_test database to avoid data loss!');
        }
        await prisma.$connect();
    });

    afterAll(async () => {
        await prisma.$disconnect();
        // Cleanup backup files created during test
        if (backupFilename) {
            const backupPath = path.join(process.cwd(), 'temp', 'backups', backupFilename);
            if (fs.existsSync(backupPath)) fs.unlinkSync(backupPath);
            const identityPath = backupPath + '.identity.sql';
            if (fs.existsSync(identityPath)) fs.unlinkSync(identityPath);
            const wrapperPath = identityPath + '.run.sql';
            if (fs.existsSync(wrapperPath)) fs.unlinkSync(wrapperPath);
        }
    });

    it('should backup app data and restore it while preserving users', async () => {
        const uniqueEmail = `test_${Date.now()}@example.com`;

        // 1. Setup Initial State
        // Create a Role
        const userRole = await prisma.role.upsert({
            where: { name: 'USER' },
            update: {},
            create: {
                name: 'USER',
                description: 'User Role'
            }
        });

        // Create a Product (App data)
        const testProduct = await prisma.product.create({
            data: {
                name: 'Backup Test Product',
                description: 'To be restored'
            }
        });

        // Create a User (Identity data)
        const testUser = await prisma.user.create({
            data: {
                email: uniqueEmail,
                username: `testuser_${Date.now()}`,
                fullName: 'Test User',
                password: 'hashedpassword',
                userRoles: {
                    create: {
                        role: { connect: { id: userRole.id } }
                    }
                }
            }
        });

        // Create AuditLog for user
        await prisma.auditLog.create({
            data: {
                userId: testUser.id,
                action: 'test_action',
                details: { foo: 'bar' }
            }
        });

        console.log('Created Test Product:', testProduct.id);
        console.log('Created Test User:', testUser.id);

        // 2. Create Backup
        console.log('Creating Backup...');
        const backupResult = await BackupRestoreService.createBackup('test-backup');
        expect(backupResult.success).toBe(true);
        backupFilename = backupResult.filename;
        console.log('Backup Created:', backupFilename);

        // 3. Modify State
        // Delete the Product (Simulate data loss)
        await prisma.product.delete({ where: { id: testProduct.id } });

        // Create a NEW User (Simulate user activity since backup)
        const newUserEmail = `new_user_${Date.now()}@test.com`;
        const newUser = await prisma.user.create({
            data: {
                email: newUserEmail,
                username: `newuser_${Date.now()}`,
                password: 'hashedpassword',
                fullName: 'New User',
            },
        });
        console.log('Created New User (should persist):', newUser.id);

        // Verify Product is gone
        const missingProduct = await prisma.product.findUnique({ where: { id: testProduct.id } });
        expect(missingProduct).toBeNull();

        // 4. Restore Backup
        console.log('Restoring Backup...');
        const restoreResult = await BackupRestoreService.restoreBackup(backupFilename);
        if (!restoreResult.success) {
            console.error('Restore Failed Error:', restoreResult.error);
        }
        expect(restoreResult.success).toBe(true);

        // Reconnect local prisma client
        await prisma.$disconnect();
        await prisma.$connect();

        // 5. Verify Final State
        // Product should be back (Restored from backup)
        const restoredProduct = await prisma.product.findUnique({ where: { id: testProduct.id } });
        expect(restoredProduct).not.toBeNull();
        expect(restoredProduct?.name).toBe('Backup Test Product');

        // Original User should still be there (Preserved)
        const originalUser = await prisma.user.findUnique({ where: { id: testUser.id } });
        expect(originalUser).not.toBeNull();
        expect(originalUser?.email).toBe(uniqueEmail);

        // Verify AuditLog preservation
        const logs = await prisma.auditLog.findMany({ where: { userId: testUser.id } });
        if (logs.length === 0) {
            const allLogs = await prisma.auditLog.findMany({ take: 5 });
            const allUsers = await prisma.user.findMany({ take: 5, select: { id: true, username: true } });
            console.warn('Preservation failed for AuditLog. All users:', JSON.stringify(allUsers));
            console.warn('Sample logs:', JSON.stringify(allLogs));
        }
        expect(logs.length).toBeGreaterThan(0);

        // New User should ALSO still be there
        const preservedUser = await prisma.user.findUnique({ where: { id: newUser.id } });
        expect(preservedUser).not.toBeNull();
        expect(preservedUser?.username).toBe(newUser.username);
        expect(preservedUser?.email).toBe(newUser.email);
    }, 120000); // 2 minute timeout
});


import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

// Configuration
const DEFAULT_PASSWORD_ADMIN = 'DAP123!!!';
const DEFAULT_PASSWORD_USER = 'user';

async function main() {
    const args = process.argv.slice(2);
    const command = args[0];
    const targetUser = args[1];

    if (!command) {
        printUsage();
        process.exit(1);
    }

    try {
        switch (command) {
            case 'seed':
                await seedUsers();
                break;
            case 'reset-all':
                await resetAllUsers();
                break;
            case 'reset-user':
                if (!targetUser) {
                    console.error('Error: Username required for reset-user command');
                    printUsage();
                    process.exit(1);
                }
                await resetUserPassword(targetUser);
                break;
            case 'reset-admin':
                await resetAdminPassword();
                break;
            default:
                console.error(`Unknown command: ${command}`);
                printUsage();
                process.exit(1);
        }
    } catch (error) {
        console.error('Operation failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

function printUsage() {
    console.log(`
Usage: ts-node scripts/user-manager.ts <command> [username]

Commands:
  seed           Create default admin and user if they don't exist
  reset-all      Delete all users and recreate default admin and user
  reset-user     Reset password for a specific user to default ('user' for regular, 'DAP123!!!' for admin)
  reset-admin    Reset 'admin' user password to 'DAP123!!!'
`);
}

async function seedUsers() {
    console.log('Validating user data...');

    // Seed Admin
    const existingAdmin = await prisma.user.findUnique({ where: { username: 'admin' } });
    if (!existingAdmin) {
        console.log('Creating admin user...');
        await prisma.user.create({
            data: {
                username: 'admin',
                email: 'admin@dynamicadoptionplans.com',
                password: await bcrypt.hash(DEFAULT_PASSWORD_ADMIN, 10),
                fullName: 'System Administrator',
                isAdmin: true,
                role: 'ADMIN',
                isActive: true,
                mustChangePassword: false
            }
        });
        console.log('✅ Admin user created.');
    } else {
        console.log('ℹ️  Admin user already exists.');
    }

    // Seed Regular User
    const existingUser = await prisma.user.findUnique({ where: { username: 'user' } });
    if (!existingUser) {
        console.log('Creating standard user...');
        await prisma.user.create({
            data: {
                username: 'user',
                email: 'user@example.com',
                password: await bcrypt.hash(DEFAULT_PASSWORD_USER, 10),
                fullName: 'Standard User',
                isAdmin: false,
                role: 'USER',
                isActive: true,
                mustChangePassword: false
            }
        });
        console.log('✅ Standard user created.');
    } else {
        console.log('ℹ️  Standard user already exists.');
    }
}

async function resetAllUsers() {
    // SAFETY CHECK: Require explicit confirmation
    const confirmFlag = process.argv.includes('--confirm');
    if (!confirmFlag) {
        console.error('⚠️  WARNING: This command will DELETE ALL USERS!');
        console.error('');
        console.error('This will:');
        console.error('  - Delete ALL user accounts');
        console.error('  - Delete ALL user roles and permissions');
        console.error('  - Delete ALL sessions and audit logs');
        console.error('');
        console.error('To confirm, run with --confirm flag:');
        console.error('  ts-node scripts/user-manager.ts reset-all --confirm');
        console.error('');
        console.error('For a safer alternative, use reset-admin or reset-user commands.');
        process.exit(1);
    }

    console.log('⚠️  DELETING ALL USERS (--confirm flag provided)...');

    // Delete all users except potentially special system users if any (none for now)
    // We need to delete dependent records first usually, but cascade might handle it or we deal with conflicts
    // Prisma usually does not cascade by default unless configured in schema

    // First delete permissions, roles, sessions, audit logs?
    // Ideally we wipe the User table.
    try {
        await prisma.permission.deleteMany({});
        await prisma.userRole.deleteMany({});
        await prisma.session.deleteMany({});
        await prisma.auditLog.deleteMany({}); // Optional: clear history? Maybe we should keep it? User said "reset all or any user".
        // Keeping audit logs might fail if they reference deleted users. Let's delete them for a clean slate or nullify userId. 
        // Safest for "reset all" is to clear references. 

        // Actually, let's try to delete users and see if it fails.
        const deleted = await prisma.user.deleteMany({});
        console.log(`Deleted ${deleted.count} users.`);

        await seedUsers();
        console.log('✅ All users reset to defaults.');
    } catch (e) {
        console.error('Failed to delete users. You might need to clear dependent data first.', e);
        throw e;
    }
}

async function resetUserPassword(username: string) {
    console.log(`Resetting password for user: ${username}...`);

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
        console.error(`❌ User '${username}' not found.`);
        return;
    }

    const newPassword = user.isAdmin ? DEFAULT_PASSWORD_ADMIN : DEFAULT_PASSWORD_USER;
    const hash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
        where: { username },
        data: {
            password: hash,
            mustChangePassword: false
        }
    });

    console.log(`✅ Password reset successfully for '${username}'.`);
    console.log(`New Password: ${newPassword}`);
}

async function resetAdminPassword() {
    await resetUserPassword('admin');
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});

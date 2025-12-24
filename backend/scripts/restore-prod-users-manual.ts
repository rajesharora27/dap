
import { PrismaClient, SystemRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const USERS_TO_RESTORE = [
    'vnagarmu',
    'smartinb',
    'justmurp',
    'tirowley',
    'ivangonz',
    'maujimen',
    'edusalaz'
];

const DEFAULT_PASSWORD = 'DAP123';
const ROLES_TO_ASSIGN = ['SME', 'CSS'];

async function main() {
    console.log('Starting manual user restoration and update...');

    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    // 1. Ensure Roles exist in the Role table
    const roleIds: Record<string, string> = {};
    for (const roleName of ROLES_TO_ASSIGN) {
        const role = await prisma.role.upsert({
            where: { name: roleName },
            update: {},
            create: {
                name: roleName,
                description: `System Role: ${roleName}`
            }
        });
        roleIds[roleName] = role.id;
        console.log(`Ensured Role: ${roleName} (${role.id})`);
    }

    for (const username of USERS_TO_RESTORE) {
        const email = `${username}@cisco.com`;

        try {
            // 2. Create or Update User
            // We update the password even if they exist, as per request "password as DAP123"
            const user = await prisma.user.upsert({
                where: { username },
                update: {
                    password: hashedPassword,
                    // 'role' field is singular enum. We set it to SME as a primary, 
                    // but the real multi-role logic happens in UserRole table.
                    role: SystemRole.SME,
                },
                create: {
                    username,
                    email,
                    password: hashedPassword,
                    role: SystemRole.SME, // Default primary role
                    name: username,
                    fullName: username,
                    isAdmin: false,
                    isActive: true,
                    mustChangePassword: true,
                },
            });
            console.log(`Processed user: ${username} (${user.id})`);

            // 3. Assign Attributes/Roles via UserRole table
            // We clear existing roles for these specific users to ensure exact state "SME and CSS"
            // Or just upsert?
            // "All the users added should have both SME and CSS role" -> implied EXACTLY or AT LEAST?
            // Safer to just ensure they have these two.

            for (const roleName of ROLES_TO_ASSIGN) {
                const roleId = roleIds[roleName];

                // check if user already has this role
                const existingAssignment = await prisma.userRole.findFirst({
                    where: {
                        userId: user.id,
                        roleId: roleId
                    }
                });

                if (!existingAssignment) {
                    await prisma.userRole.create({
                        data: {
                            userId: user.id,
                            roleId: roleId,
                            roleName: roleName // for backward compat if needed
                        }
                    });
                    console.log(`  + Assigned role ${roleName}`);
                } else {
                    console.log(`  = Already has role ${roleName}`);
                }
            }

        } catch (error) {
            console.error(`Error processing user ${username}:`, error);
        }
    }

    console.log('Restoration and role update complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function backupUserData(userIdOrEmail: string) {
    console.log(`Starting backup for user: ${userIdOrEmail}...`);

    // 1. Find User
    const user = await prisma.user.findFirst({
        where: {
            OR: [
                { id: userIdOrEmail },
                { email: userIdOrEmail }
            ]
        },
        include: {
            // Include related personal data
            personalProducts: {
                include: {
                    tasks: {
                        include: {
                            outcomes: { include: { personalOutcome: true } },
                            releases: { include: { personalRelease: true } }
                        }
                    },
                    outcomes: true,
                    releases: true,
                    assignments: true // Products can have assignments? No, assignments link to products.
                }
            },
            personalAssignments: {
                include: {
                    tasks: {
                        include: {
                            personalTask: true
                        }
                    }
                }
            }
        }
    });

    if (!user) {
        console.error(`User not found: ${userIdOrEmail}`);
        process.exit(1);
    }

    console.log(`Found user: ${user.username} (${user.id})`);
    console.log(`- Personal Products: ${user.personalProducts.length}`);
    console.log(`- Personal Assignments: ${user.personalAssignments.length}`);

    // 2. Structure Data
    const backupData = {
        meta: {
            timestamp: new Date().toISOString(),
            version: '1.0',
            type: 'user_backup'
        },
        user: {
            id: user.id,
            email: user.email,
            username: user.username,
            name: user.name,
            role: user.role,
            // Exclude password for security? Or include hash for full restore?
            // For restoration to same DB, hash is fine. For migration, maybe reset?
            // Let's keep it but warn.
            passwordHash: user.password
        },
        personalProducts: user.personalProducts,
        personalAssignments: user.personalAssignments
    };

    // 3. Save to File
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup_user_${user.username}_${timestamp}.json`;
    const backupDir = path.join(__dirname, '../backups/users');

    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    const filePath = path.join(backupDir, filename);
    fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2));

    console.log(`✅ Backup saved to: ${filePath}`);
}

// CLI Argument Handling
const target = process.argv[2];
if (!target) {
    console.log('Usage: ts-node backup-user-data.ts <userId|email>');
    process.exit(1);
}

backupUserData(target)
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

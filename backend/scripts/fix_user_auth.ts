import { PrismaClient, SystemRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

console.log('Fixing User Auth Script Started');

const prisma = new PrismaClient();

async function main() {
    const args = process.argv.slice(2);
    const username = args[0]; // e.g. "admin"
    const password = args[1] || 'DAP123!!!';
    const isAdmin = args.includes('--admin');

    if (!username) {
        console.error('Usage: ts-node fix_user_auth.ts <username> [password] [--admin]');
        process.exit(1);
    }

    console.log(`Fixing authentication for user: ${username}`);

    try {
        console.log('Hashing password...');
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        console.log('Checking for existing user...');
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { username: username },
                    { email: username }
                ]
            }
        });

        if (existingUser) {
            console.log(`User found (ID: ${existingUser.id}). Updating...`);
            await prisma.user.update({
                where: { id: existingUser.id },
                data: {
                    password: hashedPassword,
                    isActive: true,
                    mustChangePassword: false,
                    isAdmin: isAdmin ? true : existingUser.isAdmin,
                    role: isAdmin ? SystemRole.ADMIN : undefined
                }
            });
            console.log(`✅ Password updated for user '${existingUser.username}'.`);
            console.log(`✅ User set to ACTIVE.`);
            if (isAdmin) console.log(`✅ User set to ADMIN.`);
        } else {
            console.log(`User not found. Creating...`);
            const email = username.includes('@') ? username : `${username}@example.com`;
            const actualUsername = username.includes('@') ? username.split('@')[0] : username;

            await prisma.user.create({
                data: {
                    username: actualUsername,
                    email: email,
                    password: hashedPassword,
                    fullName: actualUsername,
                    isAdmin: isAdmin,
                    role: isAdmin ? SystemRole.ADMIN : SystemRole.USER,
                    isActive: true,
                    mustChangePassword: false,
                }
            });
            console.log(`✅ Created new user '${actualUsername}' with email '${email}'.`);
        }

    } catch (error) {
        console.error('Error fixing user:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});

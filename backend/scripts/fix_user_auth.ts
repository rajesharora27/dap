
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const args = process.argv.slice(2);
    const username = args[0];
    const password = args[1] || 'DAP123!!!';
    const isAdmin = args.includes('--admin');

    if (!username) {
        console.error('Usage: ts-node fix_user_auth.ts <username> [password] [--admin]');
        process.exit(1);
    }

    console.log(`Fixing authentication for user: ${username}`);

    try {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { username: username },
                    { email: username } // Allow fixing by email too
                ]
            }
        });

        if (existingUser) {
            console.log(`User found (ID: ${existingUser.id}). Updating password and status...`);
            await prisma.user.update({
                where: { id: existingUser.id },
                data: {
                    password: hashedPassword,
                    isActive: true,
                    mustChangePassword: false, // Unlock the account if it was forced to change
                    // Only update admin status if explicitly requested, otherwise keep existing
                    isAdmin: isAdmin ? true : existingUser.isAdmin,
                }
            });
            console.log(`✅ Password updated for user '${existingUser.username}'.`);
            console.log(`✅ User set to ACTIVE.`);
            if (isAdmin) console.log(`✅ User set to ADMIN.`);
        } else {
            console.log(`User not found. Creating new user '${username}'...`);
            // Infer email if not looking like an email
            const email = username.includes('@') ? username : `${username}@example.com`;
            const actualUsername = username.includes('@') ? username.split('@')[0] : username;

            await prisma.user.create({
                data: {
                    username: actualUsername,
                    email: email,
                    password: hashedPassword,
                    fullName: actualUsername, // Placeholder
                    isAdmin: isAdmin,
                    isActive: true,
                    mustChangePassword: false,
                }
            });
            console.log(`✅ Created new user '${actualUsername}' with email '${email}'.`);
        }

        console.log(`\nNew Credentials:`);
        console.log(`Username: ${username} (or email)`);
        console.log(`Password: ${password}`);

    } catch (error) {
        console.error('Error fixing user:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();

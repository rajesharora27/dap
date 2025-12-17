/**
 * Light Demo Seed Script for Mac
 * Creates essential users for demo/development mode
 * This script is designed to be fast and minimal for Mac development
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

interface UserData {
    username: string;
    email: string;
    password: string;
    fullName: string;
    isAdmin: boolean;
    role: 'ADMIN' | 'USER' | 'SME' | 'CSS';
}

const DEFAULT_USERS: UserData[] = [
    {
        username: 'admin',
        email: 'admin@dynamicadoptionplans.com',
        password: 'DAP123!!!',
        fullName: 'System Administrator',
        isAdmin: true,
        role: 'ADMIN',
    },
    {
        username: 'smeuser',
        email: 'sme@example.com',
        password: 'DAP123',
        fullName: 'SME User',
        isAdmin: false,
        role: 'SME',
    },
    {
        username: 'cssuser',
        email: 'css@example.com',
        password: 'DAP123',
        fullName: 'CSS User',
        isAdmin: false,
        role: 'CSS',
    },
];

async function seedUsers(): Promise<void> {
    console.log('[seed-light-demo] Creating demo users...');

    for (const userData of DEFAULT_USERS) {
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { username: userData.username },
                    { email: userData.email },
                ],
            },
        });

        if (existingUser) {
            // Update password to ensure it's correct
            const hashedPassword = await bcrypt.hash(userData.password, 10);
            await prisma.user.update({
                where: { id: existingUser.id },
                data: {
                    password: hashedPassword,
                    isActive: true,
                    mustChangePassword: false,
                },
            });
            console.log(`[seed-light-demo] Updated existing user: ${userData.username}`);
        } else {
            const hashedPassword = await bcrypt.hash(userData.password, 10);
            await prisma.user.create({
                data: {
                    username: userData.username,
                    email: userData.email,
                    password: hashedPassword,
                    fullName: userData.fullName,
                    isAdmin: userData.isAdmin,
                    isActive: true,
                    mustChangePassword: false,
                    role: userData.role,
                    name: userData.fullName, // Backward compatibility
                },
            });
            console.log(`[seed-light-demo] Created user: ${userData.username}`);
        }
    }
}

async function main(): Promise<void> {
    console.log('[seed-light-demo] Starting light demo seed...');
    console.log('');

    try {
        await seedUsers();

        console.log('');
        console.log('[seed-light-demo] ✅ Demo data seeded successfully!');
        console.log('');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('  Login Credentials:');
        console.log('  ──────────────────');
        console.log('  admin    / DAP123!!!  (Administrator)');
        console.log('  smeuser  / DAP123     (SME User)');
        console.log('  cssuser  / DAP123     (CSS User)');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('');
    } catch (error) {
        console.error('[seed-light-demo] Error during seed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();

#!/usr/bin/env node
/**
 * Fix All Credentials
 * Creates missing users and resets passwords for development
 * Run from anywhere: node /data/dap/scripts/fix-credentials.js
 */

const path = require('path');
const backendDir = path.join(__dirname, '..', 'backend');

// Resolve modules from backend/node_modules
const bcrypt = require(path.join(backendDir, 'node_modules', 'bcryptjs'));
const { PrismaClient } = require(path.join(backendDir, 'node_modules', '@prisma/client'));
const prisma = new PrismaClient();

const cuid = () => 'cuid' + Date.now() + Math.random().toString(36).substring(2, 9);

async function fixCredentials() {
    console.log('🔐 Fixing all user credentials...\n');

    const users = [
        { username: 'admin', email: 'admin@example.com', password: 'admin', role: 'USER', isAdmin: true, name: 'Administrator' },
        { username: 'smeuser', email: 'sme@example.com', password: 'smeuser', role: 'SME', isAdmin: false, name: 'SME User' },
        { username: 'cssuser', email: 'css@example.com', password: 'cssuser', role: 'CSS', isAdmin: false, name: 'CSS User' },
        { username: 'aiuser', email: 'ai@example.com', password: 'aiuser', role: 'USER', isAdmin: true, name: 'AI Agent User' }
    ];

    for (const user of users) {
        const hashedPassword = await bcrypt.hash(user.password, 10);

        try {
            // Try to find existing user
            const existing = await prisma.user.findUnique({
                where: { username: user.username }
            });

            if (existing) {
                // Update existing user
                await prisma.user.update({
                    where: { username: user.username },
                    data: {
                        password: hashedPassword,
                        mustChangePassword: false,
                        role: user.role,
                        isAdmin: user.isAdmin
                    }
                });
                console.log(`✅ Updated: ${user.username} → password: ${user.password} (role: ${user.role}, isAdmin: ${user.isAdmin})`);
            } else {
                // Create new user
                await prisma.user.create({
                    data: {
                        id: cuid(),
                        username: user.username,
                        email: user.email,
                        name: user.name,
                        password: hashedPassword,
                        role: user.role,
                        isAdmin: user.isAdmin,
                        mustChangePassword: false,
                        isActive: true
                    }
                });
                console.log(`✅ Created: ${user.username} → password: ${user.password} (role: ${user.role}, isAdmin: ${user.isAdmin})`);
            }
        } catch (e) {
            console.error(`❌ Error with ${user.username}:`, e.message);
        }
    }

    console.log('\n✅ All credentials fixed!');
    console.log('\n📋 Login credentials:');
    console.log('   admin/admin     - Full admin access');
    console.log('   smeuser/smeuser - SME role (Products/Solutions)');
    console.log('   cssuser/cssuser - CSS role (Customers)');
    console.log('   aiuser/aiuser   - AI Agent user');

    await prisma.$disconnect();
}

fixCredentials().then(() => process.exit(0)).catch(e => {
    console.error('Error:', e);
    process.exit(1);
});

const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('Testing password hashing and comparison...\n');

    const password = 'DAP123!!!';
    console.log('Password to hash:', password);

    // Generate hash
    const hash = await bcrypt.hash(password, 10);
    console.log('Generated hash:', hash);

    // Test comparison
    const match = await bcrypt.compare(password, hash);
    console.log('Direct comparison:', match ? '✅ MATCH' : '❌ NO MATCH');

    // Get user from database
    const user = await prisma.user.findFirst({ where: { username: 'admin' } });
    if (!user) {
        console.log('❌ Admin user not found!');
        process.exit(1);
    }

    console.log('\nUser from database:');
    console.log('  Username:', user.username);
    console.log('  Email:', user.email);
    console.log('  Stored hash:', user.password.substring(0, 30) + '...');

    // Test against stored hash
    const storedMatch = await bcrypt.compare(password, user.password);
    console.log('  Password match:', storedMatch ? '✅ MATCH' : '❌ NO MATCH');

    if (!storedMatch) {
        console.log('\n🔧 Updating password...');
        await prisma.user.update({
            where: { id: user.id },
            data: { password: hash }
        });
        console.log('✅ Password updated!');

        // Verify
        const updatedUser = await prisma.user.findFirst({ where: { username: 'admin' } });
        const finalMatch = await bcrypt.compare(password, updatedUser.password);
        console.log('Final check:', finalMatch ? '✅ WORKS' : '❌ STILL BROKEN');
    }

    await prisma.$disconnect();
}

main().catch(console.error);

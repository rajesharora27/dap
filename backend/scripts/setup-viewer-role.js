#!/usr/bin/env node
/**
 * Setup VIEWER role with read-only permissions for the entire application
 * 
 * The VIEWER role provides:
 * - READ access to all Products
 * - READ access to all Solutions
 * - READ access to all Customers
 * 
 * Run this script after database migration to create the VIEWER role.
 * 
 * Usage:
 *   node scripts/setup-viewer-role.js
 * 
 * @author AI Agent Implementation
 * @date December 6, 2025
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('🔧 Setting up VIEWER role with read-only permissions...\n');

    // Check if VIEWER role already exists
    let viewerRole = await prisma.role.findUnique({
        where: { name: 'VIEWER' }
    });

    if (viewerRole) {
        console.log('⚠️  VIEWER role already exists (id:', viewerRole.id + ')');
        console.log('   Updating permissions...\n');
    } else {
        // Create the VIEWER role
        viewerRole = await prisma.role.create({
            data: {
                name: 'VIEWER',
                description: 'Read-only access to the entire application. Can view all products, solutions, and customers but cannot make any changes.'
            }
        });
        console.log('✅ Created VIEWER role (id:', viewerRole.id + ')');
    }

    // Remove existing permissions for this role (to start fresh)
    await prisma.rolePermission.deleteMany({
        where: { roleId: viewerRole.id }
    });

    // Define permissions: READ access to all resource types
    const permissions = [
        {
            roleId: viewerRole.id,
            resourceType: 'PRODUCT',
            resourceId: null, // null means ALL products
            permissionLevel: 'READ'
        },
        {
            roleId: viewerRole.id,
            resourceType: 'SOLUTION',
            resourceId: null, // null means ALL solutions
            permissionLevel: 'READ'
        },
        {
            roleId: viewerRole.id,
            resourceType: 'CUSTOMER',
            resourceId: null, // null means ALL customers
            permissionLevel: 'READ'
        }
    ];

    // Create the permissions
    for (const perm of permissions) {
        await prisma.rolePermission.create({ data: perm });
        console.log(`   ✅ ${perm.resourceType} (ALL): ${perm.permissionLevel}`);
    }

    console.log('\n✅ VIEWER role setup complete!\n');

    // Show summary
    const roleWithPermissions = await prisma.role.findUnique({
        where: { id: viewerRole.id },
        include: {
            permissions: true,
            userRoles: {
                include: { user: { select: { username: true, email: true } } }
            }
        }
    });

    console.log('📋 Role Summary:');
    console.log('   Name:', roleWithPermissions.name);
    console.log('   Description:', roleWithPermissions.description);
    console.log('   Permissions:', roleWithPermissions.permissions.length);
    console.log('   Users with this role:', roleWithPermissions.userRoles.length);

    if (roleWithPermissions.userRoles.length > 0) {
        console.log('\n👥 Users with VIEWER role:');
        for (const ur of roleWithPermissions.userRoles) {
            console.log(`   - ${ur.user.username} (${ur.user.email})`);
        }
    } else {
        console.log('\n💡 To assign the VIEWER role to a user, use:');
        console.log('   - GraphQL mutation: assignRoleToUser(userId: "<user-id>", roleId: "' + viewerRole.id + '")');
        console.log('   - Or create a user with role: VIEWER in the database');
    }

    console.log('\n🔄 For users with SystemRole VIEWER (in User.role field):');
    const viewerUsers = await prisma.user.findMany({
        where: { role: 'VIEWER' },
        select: { id: true, username: true, email: true }
    });

    if (viewerUsers.length > 0) {
        console.log('   Users with SystemRole=VIEWER:');
        for (const u of viewerUsers) {
            console.log(`   - ${u.username} (${u.email})`);
        }
    } else {
        console.log('   No users currently have SystemRole=VIEWER');
        console.log('   Create one with: UPDATE "User" SET role = \'VIEWER\' WHERE username = \'<username>\';');
    }
}

main()
    .catch((error) => {
        console.error('❌ Error setting up VIEWER role:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

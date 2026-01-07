/**
 * Verifies we can disable legacy "system role shortcut" behavior (SME/CSS/VIEWER)
 * without affecting the core RBAC permission model.
 *
 * This is important during migration toward ADMIN/USER-only system roles.
 */

describe('Permissions Module - system role shortcuts toggle', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('disables SME/CSS/VIEWER shortcut bypass when RBAC_ENABLE_SYSTEM_ROLE_SHORTCUTS=false', async () => {
    process.env.RBAC_ENABLE_SYSTEM_ROLE_SHORTCUTS = 'false';

    // Import AFTER setting env so envConfig picks it up.
    const { PrismaClient, ResourceType, PermissionLevel } = await import('@prisma/client');
    const { checkUserPermission } = await import('../../../shared/auth/permissions');

    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL || 'postgresql://rajarora@localhost:5432/dap_test?schema=public',
        },
      },
      log: [],
    });

    // Minimal setup: user is SME, has no direct permissions, role permissions, etc.
    const user = await prisma.user.create({
      data: {
        email: `sme-${Date.now()}@example.com`,
        username: `sme_${Date.now()}`,
        password: 'hashed-does-not-matter-for-this-test',
        role: 'SME' as any,
        isAdmin: false,
        isActive: true,
        mustChangePassword: false,
      },
    });

    const product = await prisma.product.create({
      data: { name: `P-${Date.now()}`, description: 'test', customAttrs: {}, resources: [] },
    });

    const allowed = await checkUserPermission(
      user.id,
      ResourceType.PRODUCT,
      product.id,
      PermissionLevel.ADMIN,
      prisma
    );

    expect(allowed).toBe(false);

    await prisma.$disconnect();
    delete process.env.RBAC_ENABLE_SYSTEM_ROLE_SHORTCUTS;
  });
});



/**
 * Verifies we can disable the default "USER read-all" policy when needed.
 * This preserves the ability to move back to strict/assigned-only reads later.
 */

describe('Permissions Module - default USER read-all toggle', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('when RBAC_DEFAULT_USER_READ_ALL=false, USER without grants has no READ access', async () => {
    process.env.RBAC_DEFAULT_USER_READ_ALL = 'false';

    const { PrismaClient, ResourceType, PermissionLevel } = await import('@prisma/client');
    const { checkUserPermission, getUserAccessibleResources } = await import('../../../shared/auth/permissions');

    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL || 'postgresql://rajarora@localhost:5432/dap_test?schema=public',
        },
      },
      log: [],
    });

    const user = await prisma.user.create({
      data: {
        email: `u-${Date.now()}@example.com`,
        username: `u_${Date.now()}`,
        password: 'hashed-does-not-matter-for-this-test',
        role: 'USER' as any,
        isAdmin: false,
        isActive: true,
        mustChangePassword: false,
      },
    });

    const product = await prisma.product.create({
      data: { name: `P-${Date.now()}`, description: 'test', customAttrs: {}, resources: [] },
    });

    const canRead = await checkUserPermission(
      user.id,
      ResourceType.PRODUCT,
      product.id,
      PermissionLevel.READ,
      prisma
    );
    expect(canRead).toBe(false);

    const accessible = await getUserAccessibleResources(user.id, ResourceType.PRODUCT, PermissionLevel.READ, prisma);
    expect(accessible).toEqual([]);

    await prisma.$disconnect();
    delete process.env.RBAC_DEFAULT_USER_READ_ALL;
  });
});



import { PrismaClient, ResourceType, PermissionLevel, SystemRole } from '@prisma/client';

/**
 * Mac/dev-only migration:
 * - Converts legacy SystemRole values (SME/CSS/VIEWER) to SystemRole.USER
 * - Preserves access by assigning equivalent RBAC roles with global permissions.
 *
 * Safety:
 * - Refuses to run in production
 * - Requires ALLOW_SYSTEM_ROLE_TO_RBAC_MIGRATION=1
 */
const prisma = new PrismaClient();

function redactDatabaseUrl(url: string | undefined): string {
  if (!url) return '<unset>';
  try {
    const u = new URL(url);
    const username = u.username ? u.username : 'user';
    const host = u.hostname || 'host';
    const port = u.port ? `:${u.port}` : '';
    const db = u.pathname?.replace(/^\//, '') || 'db';
    return `${u.protocol}//${username}:[REDACTED]@${host}${port}/${db}${u.search || ''}`;
  } catch {
    return '<unparseable>';
  }
}

async function upsertRoleWithPermissions(args: {
  name: string;
  description: string;
  permissions: Array<{
    resourceType: ResourceType;
    permissionLevel: PermissionLevel;
  }>;
}): Promise<{ roleId: string }> {
  const role = await prisma.role.upsert({
    where: { name: args.name },
    update: { description: args.description },
    create: { name: args.name, description: args.description },
  });

  for (const perm of args.permissions) {
    // NOTE: Prisma doesn't allow `null` in composite-unique "where" inputs, so we upsert manually.
    const existing = await prisma.rolePermission.findFirst({
      where: {
        roleId: role.id,
        resourceType: perm.resourceType,
        resourceId: null,
      },
      select: { id: true },
    });

    if (existing) {
      await prisma.rolePermission.update({
        where: { id: existing.id },
        data: { permissionLevel: perm.permissionLevel },
      });
    } else {
      await prisma.rolePermission.create({
        data: {
          roleId: role.id,
          resourceType: perm.resourceType,
          resourceId: null,
          permissionLevel: perm.permissionLevel,
        },
      });
    }
  }

  return { roleId: role.id };
}

async function ensureUserHasRole(userId: string, roleId: string): Promise<void> {
  const existing = await prisma.userRole.findFirst({
    where: { userId, roleId },
    select: { id: true },
  });
  if (existing) return;
  await prisma.userRole.create({ data: { userId, roleId } });
}

async function main(): Promise<void> {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const allow = process.env.ALLOW_SYSTEM_ROLE_TO_RBAC_MIGRATION === '1';

  if (nodeEnv === 'production') {
    throw new Error('Refusing to run in production');
  }
  if (!allow) {
    throw new Error('Refusing to run without ALLOW_SYSTEM_ROLE_TO_RBAC_MIGRATION=1');
  }

  // eslint-disable-next-line no-console
  console.log(`[migrate-system-roles] DATABASE_URL: ${redactDatabaseUrl(process.env.DATABASE_URL)}`);

  // Create/ensure equivalent RBAC roles (global permissions)
  const { roleId: globalReadOnlyRoleId } = await upsertRoleWithPermissions({
    name: 'GLOBAL_READONLY',
    description: 'Read-only access to all Products, Solutions, and Customers (generated from legacy system roles).',
    permissions: [
      { resourceType: ResourceType.PRODUCT, permissionLevel: PermissionLevel.READ },
      { resourceType: ResourceType.SOLUTION, permissionLevel: PermissionLevel.READ },
      { resourceType: ResourceType.CUSTOMER, permissionLevel: PermissionLevel.READ },
    ],
  });

  const { roleId: globalCatalogEditorRoleId } = await upsertRoleWithPermissions({
    name: 'GLOBAL_CATALOG_EDITOR',
    description: 'Write access to all Products and Solutions; read Customers (generated from legacy system roles).',
    permissions: [
      { resourceType: ResourceType.PRODUCT, permissionLevel: PermissionLevel.WRITE },
      { resourceType: ResourceType.SOLUTION, permissionLevel: PermissionLevel.WRITE },
      { resourceType: ResourceType.CUSTOMER, permissionLevel: PermissionLevel.READ },
    ],
  });

  const { roleId: globalCustomerManagerRoleId } = await upsertRoleWithPermissions({
    name: 'GLOBAL_CUSTOMER_MANAGER',
    description: 'Write access to all Customers; read Products and Solutions (generated from legacy system roles).',
    permissions: [
      { resourceType: ResourceType.CUSTOMER, permissionLevel: PermissionLevel.WRITE },
      { resourceType: ResourceType.PRODUCT, permissionLevel: PermissionLevel.READ },
      { resourceType: ResourceType.SOLUTION, permissionLevel: PermissionLevel.READ },
    ],
  });

  const legacyUsers = await prisma.user.findMany({
    where: {
      isAdmin: false,
      role: { in: [SystemRole.SME, SystemRole.CSS, SystemRole.VIEWER, SystemRole.ADMIN] },
    },
    select: { id: true, username: true, role: true },
  });

  let migrated = 0;
  for (const user of legacyUsers) {
    if (user.role === SystemRole.VIEWER) {
      await ensureUserHasRole(user.id, globalReadOnlyRoleId);
    } else if (user.role === SystemRole.SME) {
      await ensureUserHasRole(user.id, globalCatalogEditorRoleId);
    } else if (user.role === SystemRole.CSS) {
      await ensureUserHasRole(user.id, globalCustomerManagerRoleId);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { role: SystemRole.USER },
    });
    migrated += 1;
  }

  // eslint-disable-next-line no-console
  console.log(`[migrate-system-roles] Migrated users: ${migrated}`);
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('[migrate-system-roles] Failed:', err instanceof Error ? err.message : err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });



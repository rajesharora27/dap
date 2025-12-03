import { PermissionLevel, PrismaClient, ResourceType } from '@prisma/client';
import { checkUserPermission } from '../permissions';

type MockedPrisma = {
  user: { findUnique: jest.Mock };
  userRole: { findMany: jest.Mock };
  permission: { findFirst: jest.Mock };
  solutionProduct: { findMany: jest.Mock };
};

describe('checkUserPermission', () => {
  let prisma: MockedPrisma & PrismaClient;

  beforeEach(() => {
    prisma = {
      user: { findUnique: jest.fn() },
      userRole: { findMany: jest.fn() },
      permission: { findFirst: jest.fn() },
      solutionProduct: { findMany: jest.fn() }
    } as unknown as MockedPrisma & PrismaClient;

    prisma.userRole.findMany.mockResolvedValue([]);
    prisma.permission.findFirst.mockResolvedValue(null);
    prisma.solutionProduct.findMany.mockResolvedValue([]);
  });

  it('grants access to active admins', async () => {
    prisma.user.findUnique = jest.fn().mockResolvedValue({
      isAdmin: true,
      isActive: true,
      role: 'ADMIN'
    });

    const result = await checkUserPermission(
      'admin-id',
      ResourceType.PRODUCT,
      null,
      PermissionLevel.ADMIN,
      prisma
    );

    expect(result).toBe(true);
  });

  it('denies access when user is missing or inactive', async () => {
    prisma.user.findUnique = jest.fn().mockResolvedValue(null);

    const missingUser = await checkUserPermission(
      'missing-id',
      ResourceType.PRODUCT,
      null,
      PermissionLevel.READ,
      prisma
    );
    expect(missingUser).toBe(false);

    prisma.user.findUnique = jest.fn().mockResolvedValue({
      isAdmin: false,
      isActive: false,
      role: 'USER'
    });

    const inactiveUser = await checkUserPermission(
      'inactive-id',
      ResourceType.PRODUCT,
      null,
      PermissionLevel.READ,
      prisma
    );
    expect(inactiveUser).toBe(false);
  });

  it('allows SME users to manage products and solutions', async () => {
    prisma.user.findUnique = jest.fn().mockResolvedValue({
      isAdmin: false,
      isActive: true,
      role: 'USER'
    });

    prisma.userRole.findMany
      .mockResolvedValueOnce([{ role: { name: 'SME' } }])
      .mockResolvedValue([]);

    const canManageProduct = await checkUserPermission(
      'sme-id',
      ResourceType.PRODUCT,
      null,
      PermissionLevel.WRITE,
      prisma
    );

    expect(canManageProduct).toBe(true);
  });

  it('allows CSS users to read products but not write', async () => {
    prisma.user.findUnique = jest.fn().mockResolvedValue({
      isAdmin: false,
      isActive: true,
      role: 'USER'
    });

    prisma.userRole.findMany
      .mockResolvedValueOnce([{ role: { name: 'CSS' } }])
      .mockResolvedValue([]);

    const canRead = await checkUserPermission(
      'css-id',
      ResourceType.PRODUCT,
      null,
      PermissionLevel.READ,
      prisma
    );
    expect(canRead).toBe(true);

    const canWrite = await checkUserPermission(
      'css-id',
      ResourceType.PRODUCT,
      null,
      PermissionLevel.WRITE,
      prisma
    );
    expect(canWrite).toBe(false);
  });

  it('grants access when direct permission is present', async () => {
    prisma.user.findUnique = jest.fn().mockResolvedValue({
      isAdmin: false,
      isActive: true,
      role: 'USER'
    });

    prisma.permission.findFirst = jest
      .fn()
      .mockResolvedValueOnce({
        permissionLevel: PermissionLevel.ADMIN
      });

    const result = await checkUserPermission(
      'user-id',
      ResourceType.PRODUCT,
      'prod-1',
      PermissionLevel.WRITE,
      prisma
    );

    expect(result).toBe(true);
  });
});


import { TestFactory } from '../factories/TestFactory';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

describe('Authentication Service', () => {
    beforeEach(async () => {
        await TestFactory.cleanup();
    });

    afterAll(async () => {
        await TestFactory.cleanup();
        await prisma.$disconnect();
    });

    describe('User Creation', () => {
        it('should hash password on user creation', async () => {
            const plainPassword = 'SecurePassword123!';
            const user = await TestFactory.createUser({
                email: 'test@example.com',
                username: 'testuser',
                password: plainPassword
            });

            expect(user.password).not.toBe(plainPassword);
            expect(user.password).toBeTruthy();

            // Verify password was hashed correctly
            const isValid = await bcrypt.compare(plainPassword, user.password);
            expect(isValid).toBe(true);
        });

        it('should create user with default role', async () => {
            const user = await TestFactory.createUser();

            expect(user.role).toBeDefined();
            expect(['ADMIN', 'USER', 'SME', 'CSS']).toContain(user.role);
        });

        it('should enforce unique email', async () => {
            const email = 'duplicate@example.com';
            await TestFactory.createUser({ email });

            await expect(
                TestFactory.createUser({ email })
            ).rejects.toThrow();
        });

        it('should enforce unique username', async () => {
            const username = 'duplicateuser';
            await TestFactory.createUser({ username });

            await expect(
                TestFactory.createUser({ username })
            ).rejects.toThrow();
        });
    });

    describe('Password Validation', () => {
        it('should validate correct password', async () => {
            const plainPassword = 'TestPassword123!';
            const hashedPassword = await bcrypt.hash(plainPassword, 10);

            const isValid = await bcrypt.compare(plainPassword, hashedPassword);
            expect(isValid).toBe(true);
        });

        it('should reject incorrect password', async () => {
            const plainPassword = 'TestPassword123!';
            const wrongPassword = 'WrongPassword123!';
            const hashedPassword = await bcrypt.hash(plainPassword, 10);

            const isValid = await bcrypt.compare(wrongPassword, hashedPassword);
            expect(isValid).toBe(false);
        });

        it('should reject empty password', async () => {
            const hashedPassword = await bcrypt.hash('TestPassword123!', 10);

            const isValid = await bcrypt.compare('', hashedPassword);
            expect(isValid).toBe(false);
        });
    });

    describe('JWT Token Generation', () => {
        it('should generate valid JWT token', () => {
            const payload = {
                userId: 'user-123',
                email: 'test@example.com',
                role: 'USER'
            };

            const token = jwt.sign(payload, 'test-secret', { expiresIn: '1h' });
            expect(token).toBeTruthy();
            expect(typeof token).toBe('string');
        });

        it('should decode JWT token successfully', () => {
            const payload = {
                userId: 'user-123',
                email: 'test@example.com',
                role: 'USER'
            };

            const token = jwt.sign(payload, 'test-secret', { expiresIn: '1h' });
            const decoded = jwt.verify(token, 'test-secret') as any;

            expect(decoded.userId).toBe('user-123');
            expect(decoded.email).toBe('test@example.com');
            expect(decoded.role).toBe('USER');
        });

        it('should fail with invalid token', () => {
            const invalidToken = 'invalid.jwt.token';

            expect(() => {
                jwt.verify(invalidToken, 'test-secret');
            }).toThrow();
        });

        it('should fail with wrong secret', () => {
            const token = jwt.sign({ userId: '123' }, 'secret1');

            expect(() => {
                jwt.verify(token, 'secret2');
            }).toThrow();
        });
    });

    describe('User Roles and Permissions', () => {
        it('should create admin user', async () => {
            const admin = await TestFactory.createUser({
                role: 'ADMIN',
                isAdmin: true
            });

            expect(admin.role).toBe('ADMIN');
            expect(admin.isAdmin).toBe(true);
        });

        it('should create SME user', async () => {
            const sme = await TestFactory.createUser({
                role: 'SME',
                isAdmin: false
            });

            expect(sme.role).toBe('SME');
            expect(sme.isAdmin).toBe(false);
        });

        it('should create CSS user', async () => {
            const css = await TestFactory.createUser({
                role: 'CSS',
                isAdmin: false
            });

            expect(css.role).toBe('CSS');
            expect(css.isAdmin).toBe(false);
        });

        it('should handle user with multiple permissions', async () => {
            const user = await TestFactory.createUser();

            await prisma.userPermission.create({
                data: {
                    userId: user.id,
                    entityType: 'PRODUCT',
                    entityId: 'product-1',
                    canRead: true,
                    canWrite: true
                }
            });

            await prisma.userPermission.create({
                data: {
                    userId: user.id,
                    entityType: 'SOLUTION',
                    entityId: 'solution-1',
                    canRead: true,
                    canWrite: false
                }
            });

            const permissions = await prisma.userPermission.findMany({
                where: { userId: user.id }
            });

            expect(permissions).toHaveLength(2);
        });
    });

    describe('User Status', () => {
        it('should create active user by default', async () => {
            const user = await TestFactory.createUser();

            expect(user.isActive).toBe(true);
        });

        it('should deactivate user', async () => {
            const user = await TestFactory.createUser({ isActive: true });

            const updated = await prisma.user.update({
                where: { id: user.id },
                data: { isActive: false }
            });

            expect(updated.isActive).toBe(false);
        });

        it('should reactivate user', async () => {
            const user = await TestFactory.createUser({ isActive: false });

            const updated = await prisma.user.update({
                where: { id: user.id },
                data: { isActive: true }
            });

            expect(updated.isActive).toBe(true);
        });
    });

    describe('Password Change', () => {
        it('should require password change flag', async () => {
            const user = await TestFactory.createUser({
                mustChangePassword: true
            });

            expect(user.mustChangePassword).toBe(true);
        });

        it('should update password', async () => {
            const user = await TestFactory.createUser({
                password: 'OldPassword123!'
            });

            const newPassword = 'NewPassword456!';
            const hashedNewPassword = await bcrypt.hash(newPassword, 10);

            const updated = await prisma.user.update({
                where: { id: user.id },
                data: {
                    password: hashedNewPassword,
                    mustChangePassword: false
                }
            });

            const isValid = await bcrypt.compare(newPassword, updated.password);
            expect(isValid).toBe(true);
            expect(updated.mustChangePassword).toBe(false);
        });
    });

    describe('User Query Operations', () => {
        it('should find user by email', async () => {
            const email = 'findme@example.com';
            await TestFactory.createUser({ email });

            const found = await prisma.user.findUnique({
                where: { email }
            });

            expect(found).toBeDefined();
            expect(found?.email).toBe(email);
        });

        it('should find user by username', async () => {
            const username = 'findmeuser';
            await TestFactory.createUser({ username });

            const found = await prisma.user.findUnique({
                where: { username }
            });

            expect(found).toBeDefined();
            expect(found?.username).toBe(username);
        });

        it('should list all active users', async () => {
            await TestFactory.createUser({ isActive: true });
            await TestFactory.createUser({ isActive: true });
            await TestFactory.createUser({ isActive: false });

            const activeUsers = await prisma.user.findMany({
                where: { isActive: true }
            });

            expect(activeUsers.length).toBeGreaterThanOrEqual(2);
            expect(activeUsers.every(u => u.isActive)).toBe(true);
        });

        it('should list users by role', async () => {
            await TestFactory.createUser({ role: 'ADMIN' });
            await TestFactory.createUser({ role: 'USER' });

            const admins = await prisma.user.findMany({
                where: { role: 'ADMIN' }
            });

            expect(admins.length).toBeGreaterThan(0);
            expect(admins.every(u => u.role === 'ADMIN')).toBe(true);
        });
    });

    describe('Session Management', () => {
        it('should create user session', async () => {
            const user = await TestFactory.createUser();

            const session = await prisma.session.create({
                data: {
                    userId: user.id,
                    token: 'session-token-123',
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
                }
            });

            expect(session).toBeDefined();
            expect(session.userId).toBe(user.id);
        });

        it('should delete expired sessions', async () => {
            const user = await TestFactory.createUser();

            await prisma.session.create({
                data: {
                    userId: user.id,
                    token: 'expired-token',
                    expiresAt: new Date(Date.now() - 1000) // Expired
                }
            });

            const deleted = await prisma.session.deleteMany({
                where: {
                    expiresAt: { lt: new Date() }
                }
            });

            expect(deleted.count).toBeGreaterThan(0);
        });
    });
});

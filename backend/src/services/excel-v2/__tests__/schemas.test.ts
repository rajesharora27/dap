/**
 * Excel Import/Export V2 - Schema Tests
 * 
 * Unit tests for Zod validation schemas.
 */

// Jest globals are auto-imported
import {
    ProductRowSchema,
    SolutionRowSchema,
    TaskRowSchema,
    LicenseRowSchema,
    OutcomeRowSchema,
    ReleaseRowSchema,
    TagRowSchema,
    CustomAttributeRowSchema,
    TelemetryAttributeRowSchema,
    IdSchema,
    LicenseLevelSchema,
} from '../schemas';

describe('Excel Import V2 - Zod Schemas', () => {
    // =========================================================================
    // ID Schema Tests
    // =========================================================================
    describe('IdSchema', () => {
        it('should accept valid UUID', () => {
            const result = IdSchema.safeParse('550e8400-e29b-41d4-a716-446655440000');
            expect(result.success).toBe(true);
        });

        it('should accept valid CUID', () => {
            const result = IdSchema.safeParse('clz1234567890abcdefghijk');
            expect(result.success).toBe(true);
        });

        it('should accept undefined (optional)', () => {
            const result = IdSchema.safeParse(undefined);
            expect(result.success).toBe(true);
        });

        it('should reject invalid ID format', () => {
            const result = IdSchema.safeParse('invalid-id');
            expect(result.success).toBe(false);
        });
    });

    // =========================================================================
    // License Level Tests
    // =========================================================================
    describe('LicenseLevelSchema', () => {
        it('should accept ESSENTIAL', () => {
            expect(LicenseLevelSchema.parse('ESSENTIAL')).toBe('ESSENTIAL');
        });

        it('should accept ADVANTAGE', () => {
            expect(LicenseLevelSchema.parse('ADVANTAGE')).toBe('ADVANTAGE');
        });

        it('should accept SIGNATURE', () => {
            expect(LicenseLevelSchema.parse('SIGNATURE')).toBe('SIGNATURE');
        });

        it('should reject invalid license level', () => {
            const result = LicenseLevelSchema.safeParse('PREMIUM');
            expect(result.success).toBe(false);
        });
    });

    // =========================================================================
    // Product Schema Tests
    // =========================================================================
    describe('ProductRowSchema', () => {
        it('should accept valid product with minimal fields', () => {
            const result = ProductRowSchema.safeParse({
                name: 'Test Product',
            });
            expect(result.success).toBe(true);
        });

        it('should accept valid product with all fields', () => {
            const result = ProductRowSchema.safeParse({
                id: '550e8400-e29b-41d4-a716-446655440000',
                name: 'Test Product',
                description: 'A test product description',
            });
            expect(result.success).toBe(true);
        });

        it('should reject product without name', () => {
            const result = ProductRowSchema.safeParse({
                description: 'No name provided',
            });
            expect(result.success).toBe(false);
        });

        it('should reject empty name', () => {
            const result = ProductRowSchema.safeParse({
                name: '',
            });
            expect(result.success).toBe(false);
        });
    });

    // =========================================================================
    // Task Schema Tests
    // =========================================================================
    describe('TaskRowSchema', () => {
        it('should accept valid task with minimal fields', () => {
            const result = TaskRowSchema.safeParse({
                name: 'Test Task',
            });
            expect(result.success).toBe(true);
            if (result.success) {
                // Check defaults applied
                expect(result.data.weight).toBe(1);
                expect(result.data.sequenceNumber).toBe(1);
                expect(result.data.estMinutes).toBe(60);
                expect(result.data.licenseLevel).toBe('ESSENTIAL');
                expect(result.data.howToDoc).toEqual([]);
                expect(result.data.howToVideo).toEqual([]);
                expect(result.data.outcomes).toEqual([]);
                expect(result.data.releases).toEqual([]);
                expect(result.data.tags).toEqual([]);
            }
        });

        it('should accept valid task with all fields', () => {
            const result = TaskRowSchema.safeParse({
                id: '550e8400-e29b-41d4-a716-446655440000',
                name: 'Complete Task',
                description: 'A complete task',
                weight: 50,
                sequenceNumber: 5,
                estMinutes: 120,
                licenseLevel: 'ADVANTAGE',
                notes: 'Some notes',
                howToDoc: ['https://docs.example.com/guide'],
                howToVideo: ['https://youtube.com/watch?v=abc123'],
                outcomes: ['Outcome A', 'Outcome B'],
                releases: ['v1.0', 'v2.0'],
                tags: ['Tag1', 'Tag2'],
            });
            expect(result.success).toBe(true);
        });

        it('should reject task with weight > 100', () => {
            const result = TaskRowSchema.safeParse({
                name: 'Test Task',
                weight: 150,
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toContain('100');
            }
        });

        it('should reject task with weight < 0', () => {
            const result = TaskRowSchema.safeParse({
                name: 'Test Task',
                weight: -5,
            });
            expect(result.success).toBe(false);
        });

        it('should reject task with invalid URL in howToDoc', () => {
            const result = TaskRowSchema.safeParse({
                name: 'Test Task',
                howToDoc: ['not-a-url'],
            });
            expect(result.success).toBe(false);
        });

        it('should reject task with invalid license level', () => {
            const result = TaskRowSchema.safeParse({
                name: 'Test Task',
                licenseLevel: 'PREMIUM',
            });
            expect(result.success).toBe(false);
        });

        it('should reject task with negative estMinutes', () => {
            const result = TaskRowSchema.safeParse({
                name: 'Test Task',
                estMinutes: -30,
            });
            expect(result.success).toBe(false);
        });

        it('should reject task with non-integer sequenceNumber', () => {
            const result = TaskRowSchema.safeParse({
                name: 'Test Task',
                sequenceNumber: 1.5,
            });
            expect(result.success).toBe(false);
        });
    });

    // =========================================================================
    // License Schema Tests
    // =========================================================================
    describe('LicenseRowSchema', () => {
        it('should accept valid license', () => {
            const result = LicenseRowSchema.safeParse({
                name: 'Essential License',
                level: 1,
            });
            expect(result.success).toBe(true);
        });

        it('should reject license with level < 1', () => {
            const result = LicenseRowSchema.safeParse({
                name: 'Invalid License',
                level: 0,
            });
            expect(result.success).toBe(false);
        });

        it('should reject license with level > 10', () => {
            const result = LicenseRowSchema.safeParse({
                name: 'Invalid License',
                level: 15,
            });
            expect(result.success).toBe(false);
        });
    });

    // =========================================================================
    // Tag Schema Tests
    // =========================================================================
    describe('TagRowSchema', () => {
        it('should accept valid tag with color', () => {
            const result = TagRowSchema.safeParse({
                name: 'Priority',
                color: '#FF5733',
            });
            expect(result.success).toBe(true);
        });

        it('should apply default color if not provided', () => {
            const result = TagRowSchema.safeParse({
                name: 'Priority',
            });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.color).toBe('#808080');
            }
        });

        it('should reject invalid hex color', () => {
            const result = TagRowSchema.safeParse({
                name: 'Priority',
                color: 'red',
            });
            expect(result.success).toBe(false);
        });

        it('should reject short hex color', () => {
            const result = TagRowSchema.safeParse({
                name: 'Priority',
                color: '#FFF',
            });
            expect(result.success).toBe(false);
        });
    });

    // =========================================================================
    // Custom Attribute Schema Tests
    // =========================================================================
    describe('CustomAttributeRowSchema', () => {
        it('should accept valid custom attribute', () => {
            const result = CustomAttributeRowSchema.safeParse({
                key: 'platform',
                value: 'cloud',
            });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.displayOrder).toBe(0);
            }
        });

        it('should reject attribute without key', () => {
            const result = CustomAttributeRowSchema.safeParse({
                value: 'cloud',
            });
            expect(result.success).toBe(false);
        });

        it('should reject attribute without value', () => {
            const result = CustomAttributeRowSchema.safeParse({
                key: 'platform',
            });
            expect(result.success).toBe(false);
        });
    });

    // =========================================================================
    // Telemetry Attribute Schema Tests
    // =========================================================================
    describe('TelemetryAttributeRowSchema', () => {
        it('should accept valid telemetry attribute', () => {
            const result = TelemetryAttributeRowSchema.safeParse({
                taskName: 'Setup SSO',
                attributeName: 'sso_enabled',
                attributeType: 'boolean',
                operator: 'equals',
                expectedValue: 'true',
            });
            expect(result.success).toBe(true);
        });

        it('should apply default type and operator', () => {
            const result = TelemetryAttributeRowSchema.safeParse({
                taskName: 'Setup SSO',
                attributeName: 'sso_enabled',
            });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.attributeType).toBe('string');
                expect(result.data.operator).toBe('equals');
            }
        });

        it('should reject invalid operator', () => {
            const result = TelemetryAttributeRowSchema.safeParse({
                taskName: 'Setup SSO',
                attributeName: 'sso_enabled',
                operator: 'invalid',
            });
            expect(result.success).toBe(false);
        });

        it('should reject invalid attribute type', () => {
            const result = TelemetryAttributeRowSchema.safeParse({
                taskName: 'Setup SSO',
                attributeName: 'sso_enabled',
                attributeType: 'invalid',
            });
            expect(result.success).toBe(false);
        });
    });

    // =========================================================================
    // Solution Schema Tests
    // =========================================================================
    describe('SolutionRowSchema', () => {
        it('should accept valid solution', () => {
            const result = SolutionRowSchema.safeParse({
                name: 'Zero Trust Solution',
                linkedProducts: ['Duo Security', 'Cisco Secure Access'],
            });
            expect(result.success).toBe(true);
        });

        it('should apply empty linkedProducts default', () => {
            const result = SolutionRowSchema.safeParse({
                name: 'Simple Solution',
            });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.linkedProducts).toEqual([]);
            }
        });
    });

    // =========================================================================
    // Outcome Schema Tests
    // =========================================================================
    describe('OutcomeRowSchema', () => {
        it('should accept valid outcome', () => {
            const result = OutcomeRowSchema.safeParse({
                name: 'Improved Security',
                description: 'Enhanced security posture',
            });
            expect(result.success).toBe(true);
        });
    });

    // =========================================================================
    // Release Schema Tests
    // =========================================================================
    describe('ReleaseRowSchema', () => {
        it('should accept valid release', () => {
            const result = ReleaseRowSchema.safeParse({
                name: 'Version 2.0',
                level: 2,
            });
            expect(result.success).toBe(true);
        });
    });
});

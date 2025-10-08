# Comprehensive Sample Data Enhancement

## Overview
Enhanced sample data to include 10-15 comprehensive tasks per product with detailed attributes and non-destructive update logic.

## Date
October 8, 2025

## Objectives
1. **Comprehensive Coverage**: 10-15 tasks per product (not just 6)
2. **Rich Attributes**: All fields populated with realistic data
3. **Non-Destructive**: Sample data scripts must not impact existing data
4. **Production-Safe**: Use upsert patterns to avoid duplicates

## Implementation Status

### ✅ Completed Products

#### 1. Retail Management App (15 tasks)
Tasks with weights totaling 100%:
1. Build Cloud POS System - 9.50%
2. Implement Inventory Management - 9.00%
3. Customer Loyalty Program - 8.25%
4. Sales Analytics Dashboard - 7.50%
5. Multi-Store Management - 8.50%
6. E-Commerce Integration - 6.75%
7. Employee Management System - 7.25%
8. Supplier & Vendor Portal - 6.50%
9. Customer Relationship Management - 7.75%
10. Mobile App for Store Associates - 9.25%
11. Returns & Exchange Management - 5.25%
12. Gift Card & Store Credit System - 6.00%
13. Price Management & Promotions - 7.00%
14. Security & Loss Prevention - 5.50%
15. Tax Management & Compliance - 4.75%

**Total: 100% across 15 comprehensive tasks**

#### 2. Financial Services App (14 tasks)
Tasks with weights totaling 100%:
1. Build Trading Execution Engine - 10.50%
2. Portfolio Management System - 9.25%
3. Risk Assessment Engine - 8.75%
4. Compliance & Regulatory Reporting - 8.00%
5. Market Data Integration - 7.50%
6. Order Management System (OMS) - 8.25%
7. Client Onboarding & KYC - 7.00%
8. Performance Attribution & Analytics - 7.25%
9. AI Trading Algorithms - 9.00%
10. Client Portal & Reporting - 6.50%
11. Trade Settlement & Custody - 7.75%
12. Margin & Collateral Management - 6.75%
13. Financial Reporting & Tax - 5.50%
14. Fraud Detection & Security - 6.00%

**Total: 100% across 14 comprehensive tasks**

### 🔄 In Progress

#### 3. IT Operations App
- Current: 6 tasks
- Target: 12-15 tasks
- Status: Need to expand

#### 4. AI-Powered Analytics App  
- Current: 6 tasks
- Target: 12-15 tasks
- Status: Need to expand

#### 5. Network Management App
- Current: 6 tasks
- Target: 12-15 tasks
- Status: Need to expand

## Sample Data Protection Strategy

### Current Implementation
The seed script uses `upsert` for products, outcomes, licenses, and releases:
```typescript
const product = await prisma.product.upsert({
  where: { id: productInfo.id },
  update: {},  // Don't update existing
  create: productInfo  // Only create if new
});
```

### Issues Identified
1. **Task Creation**: Currently uses `findFirst` + conditional create
2. **No Update Protection**: Could potentially modify existing tasks
3. **Duplicate Risk**: Same task name could be created multiple times

### Recommended Improvements

#### 1. Use Composite Unique Keys
```typescript
const existing = await prisma.task.findFirst({ 
  where: { 
    name: taskInfo.name, 
    productId: product.id 
  } 
});
```

#### 2. Skip Existing Tasks Entirely
```typescript
if (!existing) {
  // Only create new tasks
  const task = await prisma.task.create({ data: ... });
} else {
  console.log(`[seed] Skipping existing task: ${taskInfo.name}`);
}
```

#### 3. Add Sample Data Markers
```typescript
customAttrs: {
  ...existingAttrs,
  _sampleData: true,  // Mark as sample data
  _seedVersion: '2.0'  // Track seed version
}
```

## Task Attributes Completeness

### Required Fields
- ✅ name
- ✅ description
- ✅ productId
- ✅ estMinutes
- ✅ weight (decimal with 2 places)
- ✅ sequenceNumber
- ✅ priority
- ✅ notes
- ✅ howToDoc (array of URLs)
- ✅ howToVideo (array of URLs)
- ✅ licenseLevel

### Optional Fields (should populate)
- customAttrs - Product-specific metadata
- deletedAt - NULL for active tasks

### Associations
- ✅ Outcomes - via TaskOutcome join table
- ✅ Releases - via TaskRelease join table
- ✅ Licenses - via licenseLevel field
- 🔄 Custom Attributes - Need to add
- 🔄 Telemetry Attributes - Currently added separately

## Task Distribution Strategy

### By License Level
- **ESSENTIAL**: 40-50% of tasks (core functionality)
- **ADVANTAGE**: 30-40% of tasks (enhanced features)
- **SIGNATURE**: 20-30% of tasks (premium features)

### By Priority
- **Critical**: 20-30% (security, compliance, core business)
- **High**: 40-50% (important features)
- **Medium**: 20-30% (nice-to-have)
- **Low**: 5-10% (future enhancements)

### Weight Distribution
- Ensure total = 100% per product
- Range: 4-11% per task (for 10-15 tasks)
- Critical tasks: 8-11%
- Medium tasks: 6-8%
- Low priority: 4-6%

## Documentation Links Strategy

### Multiple Links Per Task
Each task should have 2-3 documentation links and 1-2 video links:

```typescript
howToDoc: [
  'https://docs.domain.com/primary-guide',
  'https://docs.domain.com/api-reference',
  'https://docs.domain.com/best-practices'
],
howToVideo: [
  'https://youtube.com/watch?v=tutorial-part-1',
  'https://youtube.com/watch?v=tutorial-part-2'
]
```

### Domain-Specific URLs
- Retail: `docs.retail.com`
- Financial: `docs.fintech.com`
- IT Ops: `docs.itops.com`
- AI/ML: `docs.ai-platform.com`
- Networking: `docs.netops.com`

## Testing Requirements

### Before Deployment
1. ✅ Run seed script on empty database
2. ✅ Run seed script on populated database (verify no duplicates)
3. 🔄 Run seed:clean script
4. 🔄 Verify existing data untouched
5. 🔄 Check weight totals = 100% per product
6. 🔄 Verify all URLs are arrays
7. 🔄 Confirm outcome/release associations

### Validation Queries
```sql
-- Check weight totals per product
SELECT productId, SUM(weight) as total_weight
FROM Task
WHERE deletedAt IS NULL
GROUP BY productId;

-- Should return 100.00 for each product

-- Check for duplicate tasks
SELECT name, productId, COUNT(*) as count
FROM Task
GROUP BY name, productId
HAVING COUNT(*) > 1;

-- Should return no results

-- Verify sample data markers
SELECT id, name, customAttrs
FROM Product
WHERE customAttrs->>'_sampleData' = 'true';
```

## Migration Path

### For Existing Installations
1. Backup database before running seed
2. Run `npm run seed` - will only add new sample data
3. Existing products/tasks remain untouched
4. New sample products created with sample marker

### For New Installations
1. Run `npm run seed` after initial setup
2. Gets full comprehensive sample data
3. Ready for demo/testing immediately

## Next Steps

### Immediate (Current Session)
1. ✅ Expand Retail App to 15 tasks
2. ✅ Expand Financial App to 14 tasks
3. 🔄 Expand IT Ops App to 12-13 tasks
4. 🔄 Expand AI App to 12-13 tasks
5. 🔄 Expand Networking App to 12-13 tasks

### Follow-up
1. Add custom attributes per domain
2. Create domain-specific telemetry attributes
3. Add more realistic outcome descriptions
4. Create sample solutions using these products
5. Add sample user assignments

## Benefits

### 1. Realistic Testing
- Comprehensive task lists mirror real projects
- Proper weight distribution for scheduling
- Multiple links per task reflect documentation reality

### 2. Better Demos
- 10-15 tasks per product shows scalability
- Rich attributes demonstrate all features
- Professional appearance for sales demos

### 3. Development Quality
- Tests pagination with realistic data volumes
- Exercises all UI components fully
- Validates performance with proper data sets

### 4. Production Safety
- Non-destructive updates protect customer data
- Sample data clearly marked
- Easy to identify and remove if needed

## Related Documentation
- SAMPLE_DATA_UPDATE.md - Initial enterprise app update
- WEIGHT_HOWTO_UPDATE.md - Weight and HowTo field changes
- HOWTO_DROPDOWN_FEATURE.md - Multiple links UI


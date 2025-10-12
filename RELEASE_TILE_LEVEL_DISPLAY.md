# Release Tile Enhancement - Show Release Level

## Change Summary
Updated the Releases tile on the main submenu to display the release level (version) along with the release name, providing users with complete version information at a glance.

## Implementation

### Before
Releases tile showed only release names:
```
Releases
--------
Alpha
Beta
Production
```

### After
Releases tile now shows release names with their levels:
```
Releases
--------
Alpha (v1)
Beta (v2)
Production (v3)
```

## Technical Details

### Changes Made (lines 4537-4625 in App.tsx)

1. **Data Preparation**:
   - Changed from extracting just names to extracting name-level pairs
   - Before: `const releaseNames = (currentProduct.releases || []).map((item: any) => item.name)`
   - After: `const releases = (currentProduct.releases || []).map((item: any) => ({ name: item.name, level: item.level }))`

2. **Tile Type System**:
   - Added new type: `releaseWithLevel`
   - Existing types: `list`, `keyValue`
   - Updated tile configuration: `{ key: 'releases', title: 'Releases', items: releases, type: 'releaseWithLevel' }`

3. **Display Logic**:
   - Added conditional rendering for `releaseWithLevel` type
   - Format: `{release.name} (v{release.level})`
   - Level portion is bold for emphasis

### Code Structure
```typescript
// Data preparation
const releases = (currentProduct.releases || [])
  .map((item: any) => ({ name: item.name, level: item.level }))
  .filter((r: any) => r.name);

// Tile configuration
{ 
  key: 'releases', 
  title: 'Releases', 
  items: releases, 
  type: 'releaseWithLevel' 
}

// Display rendering
{tile.type === 'releaseWithLevel' ? (
  <>
    {tile.items.map((release: any) => (
      <Typography>
        {release.name} <strong>(v{release.level})</strong>
      </Typography>
    ))}
  </>
) : ...}
```

## Benefits
1. **More Informative**: Users see version numbers without clicking into the submenu
2. **Better Context**: Version levels provide immediate understanding of release progression
3. **Consistent UX**: Matches the detail shown when viewing releases in their dedicated submenu
4. **Quick Reference**: No need to navigate to releases section to check version numbers

## Display Example
If a product has releases:
```json
[
  { "name": "Alpha", "level": 1 },
  { "name": "Beta", "level": 2 },
  { "name": "Release Candidate", "level": 3 },
  { "name": "Production", "level": 4 }
]
```

The tile will show:
```
Releases
--------
Alpha (v1)
Beta (v2)
Release Candidate (v3)
Production (v4)
```

## Tile Type Comparison

### List Type (Outcomes, Licenses)
- Shows simple names
- Example: "Customer Satisfaction"

### ReleaseWithLevel Type (Releases)
- Shows name with bold version
- Example: "Production **(v3)**"

### KeyValue Type (Custom Attributes)
- Shows key-value pairs
- Example: "**color:** blue"

## Files Modified
- **frontend/src/pages/App.tsx** (lines 4537-4625):
  - Updated releases data preparation to include levels
  - Added `releaseWithLevel` type to tile system
  - Implemented conditional rendering for release display with levels
  - Formatted level as bold `(v{level})` suffix

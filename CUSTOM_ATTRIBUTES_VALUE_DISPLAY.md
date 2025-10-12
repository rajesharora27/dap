# Custom Attributes Display Enhancement

## Change Summary
Updated the Custom Attributes tile on the main submenu to show both attribute names (keys) and their values, instead of just showing the keys.

## Implementation

### Before
Custom Attributes tile showed only the attribute keys:
```
Custom Attributes
-----------------
color
size
weight
```

### After
Custom Attributes tile now shows key-value pairs:
```
Custom Attributes
-----------------
color: red
size: large
weight: 5.2
```

## Technical Details

### Changes Made (lines 4537-4615)

1. **Data Preparation**:
   - Changed from extracting just keys to extracting full key-value entries
   - Before: `const customAttrNames = Object.keys(currentProduct.customAttrs || {});`
   - After: `const customAttrEntries = Object.entries(customAttrs);`

2. **Tile Configuration**:
   - Added a `type` property to distinguish between regular lists and key-value pairs
   - Regular tiles: `type: 'list'` (outcomes, licenses, releases)
   - Custom attributes: `type: 'keyValue'`

3. **Display Logic**:
   - Added conditional rendering based on tile type
   - For `keyValue` type: displays `<strong>key:</strong> value`
   - For `list` type: displays just the name (existing behavior)
   - Handles complex values by using JSON.stringify for objects

### Value Formatting
```typescript
{tile.type === 'keyValue' ? (
  // Show key: value
  <Typography>
    <strong>{key}:</strong> {typeof value === 'object' ? JSON.stringify(value) : String(value)}
  </Typography>
) : (
  // Show just name
  <Typography>{name}</Typography>
)}
```

## Benefits
1. **More Informative**: Users can see attribute values without clicking into the submenu
2. **Better Overview**: Quick glance shows the actual custom attribute data
3. **Consistent with UX**: Provides immediate value visibility similar to clicking into the section
4. **Handles All Types**: Properly displays strings, numbers, booleans, and complex objects

## Example Display
If a product has custom attributes:
```json
{
  "color": "blue",
  "version": "2.1",
  "certified": true,
  "features": ["wifi", "bluetooth"]
}
```

The tile will show:
```
Custom Attributes
-----------------
color: blue
version: 2.1
certified: true
features: ["wifi","bluetooth"]
```

## Files Modified
- **frontend/src/pages/App.tsx** (lines 4537-4615):
  - Updated custom attributes data preparation
  - Added type discrimination for tiles
  - Implemented conditional rendering for key-value display

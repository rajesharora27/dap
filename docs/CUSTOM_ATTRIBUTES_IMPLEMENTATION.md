# Custom Attributes Implementation

## Products and Solutions - Identical Implementation

### Loading (useEffect)
```typescript
// Products: ProductDialog.tsx line 120
setCustomAttrs(product.customAttrs || {});

// Solutions: SolutionDialog.tsx line 226  
setCustomAttrs(solution.customAttrs || {});
```

### Adding Attribute
```typescript
// Products: ProductDialog.tsx line 237-243
const handleAddCustomAttribute = (attributeData: CustomAttribute) => {
  const updatedCustomAttrs = {
    ...customAttrs,
    [attributeData.key]: attributeData.value
  };
  setCustomAttrs(updatedCustomAttrs);
  setAddCustomAttributeDialog(false);
};

// Solutions: SolutionDialog.tsx line 463-468
const handleAddCustomAttributeSave = (attribute: { key: string; value: any; type: string }) => {
  setCustomAttrs(prev => ({
    ...prev,
    [attribute.key]: attribute.value
  }));
  setAddCustomAttributeDialog(false);
};
```

### Saving
```typescript
// Products: ProductDialog.tsx line 370
customAttrs: Object.keys(parsedAttrs).length > 0 ? parsedAttrs : undefined,

// Solutions: SolutionDialog.tsx line 279
customAttrs: Object.keys(customAttrs).length > 0 ? customAttrs : undefined
```

### Display (Tile)
```typescript
// Products: App.tsx line 5286-5287
const customAttrs = currentProduct.customAttrs || {};
const customAttrEntries = Object.entries(customAttrs);

// Solutions: SolutionManagementMain.tsx line 102-103
const customAttrs = selectedSolution?.customAttrs || {};
const finalCustomAttrEntries = Object.entries(customAttrs);
```

## Key Points

1. **No Filtering**: Custom attributes are displayed exactly as stored in the database
2. **No Hard-Coded Names**: The code doesn't check for or filter any specific attribute names
3. **Generic Implementation**: Both products and solutions use the same approach
4. **Same Source**: Tile and dialog read from the same source (`customAttrs` field)
5. **User-Controlled**: Custom attributes can only be added/edited through the GUI dialogs

## Database

Custom attributes are stored as JSON in the `customAttrs` field:
- Products: `Product.customAttrs` (Prisma schema line 60)
- Solutions: `Solution.customAttrs` (Prisma schema line 77)

## Historical Issue: licenseLevel

**Problem**: Old data had `licenseLevel` stored in `customAttrs` for solutions.

**Resolution**: 
- Database cleaned using `/data/dap/backend/scripts/remove-licenselevel-from-solutions.ts`
- No code adds `licenseLevel` to `customAttrs`
- `licenseLevel` is a separate field in the UI (General tab), not a custom attribute

**Status**: All solutions have clean `customAttrs` with no `licenseLevel` field.


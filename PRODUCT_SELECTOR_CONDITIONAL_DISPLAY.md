# Product Selector Conditional Display

## Change Summary
Modified the product selector section to only appear on the "main" submenu. All other submenus (tasks, licenses, releases, outcomes, custom attributes) now take the full right-side area without any product selector or action buttons.

## Implementation

### Before
The product selector Paper with dropdown and action buttons was always visible regardless of which submenu was selected, taking up space at the top of all submenu views.

### After
The entire product selector section (including the Paper wrapper) is now wrapped in:
```tsx
{selectedProductSubSection === 'main' && (
  <Paper sx={{ p: 3, mb: 2 }}>
    {/* Product dropdown and action buttons */}
  </Paper>
)}
```

## User Experience

### Main Submenu
- ✅ Shows product selector dropdown
- ✅ Shows Add/Edit/Export/Import/Delete buttons
- ✅ Shows product description and summary tiles
- ✅ Full product management interface

### Other Submenus (Tasks, Licenses, Releases, Outcomes, Custom Attributes)
- ✅ No product selector dropdown
- ✅ No action buttons
- ✅ Content takes full right-side area
- ✅ Clean, focused interface for each submenu
- ✅ More screen real estate for submenu content

## Benefits
1. **More Space**: Submenus have more vertical space for their content
2. **Less Clutter**: Users see only relevant controls for each submenu
3. **Better Focus**: Each submenu presents a cleaner, more focused interface
4. **Consistent Navigation**: Left sidebar still shows all submenus, users can easily switch
5. **Logical Grouping**: Product-level actions (add/edit/delete/import/export) are grouped with the main product view

## Files Modified
- **frontend/src/pages/App.tsx** (line ~4397):
  - Wrapped entire product selector Paper with `{selectedProductSubSection === 'main' && (...)}`
  - Removed redundant conditional from action buttons (now covered by outer conditional)

## Technical Details
- Product selector conditionally rendered based on `selectedProductSubSection === 'main'`
- All child elements (loading states, error states, dropdown, buttons) inherit the condition
- No changes to functionality, only visibility control
- selectedProduct state is preserved when switching between submenus

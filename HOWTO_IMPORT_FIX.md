# How-To Doc and Video Import Fix

## Problem
After importing tasks from Excel, the `howToDoc` and `howToVideo` fields were not being imported correctly - they appeared empty in the GUI.

## Root Cause
The import code was treating `howToDoc` and `howToVideo` as **strings** instead of **arrays**:

```typescript
// WRONG - converts array to string
input.howToDoc = taskRow.howToDoc || '';
input.howToVideo = taskRow.howToVideo || '';
```

However:
- Database schema defines these fields as `String[]` (arrays)
- Export correctly joins arrays with `'; '` delimiter
- Import correctly parses them as arrays using `parseDelimitedList()`
- But then the mutation input was converting them back to empty strings!

## The Fix
Changed lines 4026-4028 in `App.tsx` to keep the arrays:

```typescript
// CORRECT - keeps as array
input.howToDoc = Array.isArray(taskRow.howToDoc) ? taskRow.howToDoc : [];
input.howToVideo = Array.isArray(taskRow.howToVideo) ? taskRow.howToVideo : [];
```

## How It Works

### Export Format (Line 3142-3143)
```typescript
howToDoc: Array.isArray(task.howToDoc) ? task.howToDoc.join('; ') : (task.howToDoc || ''),
howToVideo: Array.isArray(task.howToVideo) ? task.howToVideo.join('; ') : (task.howToVideo || ''),
```

**Example Excel cell value:**
```
https://docs.example.com/guide1; https://docs.example.com/guide2; https://docs.example.com/guide3
```

### Import Parsing (Line 3947-3948)
```typescript
howToDoc: parseDelimitedList(getCellValue(row, 'howToDoc')),
howToVideo: parseDelimitedList(getCellValue(row, 'howToVideo')),
```

The `parseDelimitedList` function (line 3350-3357):
- Splits on `,`, `;`, or newline
- Trims whitespace
- Filters empty strings
- Returns array of URLs

**Result:**
```typescript
[
  "https://docs.example.com/guide1",
  "https://docs.example.com/guide2", 
  "https://docs.example.com/guide3"
]
```

### Mutation Input (Line 4027-4028) - NOW FIXED
```typescript
input.howToDoc = Array.isArray(taskRow.howToDoc) ? taskRow.howToDoc : [];
input.howToVideo = Array.isArray(taskRow.howToVideo) ? taskRow.howToVideo : [];
```

Now passes the array directly to the GraphQL mutation.

## Supported Delimiters
You can use any of these to separate multiple URLs in Excel:
- **Comma:** `url1, url2, url3`
- **Semicolon:** `url1; url2; url3`
- **Newline:** `url1` (press Alt+Enter) `url2` (press Alt+Enter) `url3`
- **Mixed:** `url1, url2; url3` (all work together)

## Files Modified
- `/data/dap/frontend/src/pages/App.tsx`
  - **Lines 4027-4028**: Fixed to keep howToDoc and howToVideo as arrays instead of converting to strings

## Testing
1. Export a product with tasks that have multiple howToDoc/howToVideo URLs
2. Verify Excel shows URLs separated by `; `
3. Import the Excel file
4. Verify tasks show all the documentation and video links correctly
5. Click the Doc/Video buttons to verify links work

## Related
- This is the same fix pattern used for success criteria (JSON parsing)
- Arrays must be preserved through the import pipeline
- Never convert arrays to strings in mutation inputs!

# HowTo Links Dropdown Menu Feature

## Overview
Added dropdown menu functionality for howToDoc and howToVideo links in the task list, allowing users to select individual links when multiple are available.

## Features

### Single Link Behavior
- **Direct Open**: When only one link is available, clicking opens it immediately in a new tab
- **No Menu**: No dropdown menu appears for single links

### Multiple Links Behavior
- **Dropdown Menu**: When multiple links are available, clicking shows a dropdown menu
- **Individual Selection**: Users can click any link in the dropdown to open it individually
- **Open All Option**: A special "Open All (N)" option at the bottom opens all links at once
- **Visual Indicator**: Link count is shown in the chip label (e.g., "Doc (3)", "Video (2)")

## Implementation Details

### Components Updated

#### 1. TasksPanel Component (`frontend/src/components/TasksPanel.tsx`)
- Added `Menu` import from Material-UI
- Added state for menu anchors:
  ```typescript
  const [docMenuAnchor, setDocMenuAnchor] = useState<{ el: HTMLElement; links: string[] } | null>(null);
  const [videoMenuAnchor, setVideoMenuAnchor] = useState<{ el: HTMLElement; links: string[] } | null>(null);
  ```
- Updated chip onClick handlers to show menu for multiple links
- Added two Menu components for documentation and video links

#### 2. App Component (`frontend/src/pages/App.tsx`)
- Added `Menu` import from Material-UI
- Added menu anchor states in both:
  - Main App component
  - SortableTaskItem sub-component
- Updated chip onClick handlers
- Added Menu components in both locations

### Menu Structure

Each menu includes:
1. **Header**: Disabled menu item showing "Documentation Links:" or "Video Links:"
2. **Individual Links**: Each link truncated to 50 characters with "..." if longer
3. **Divider**: Visual separator before "Open All"
4. **Open All Option**: Opens all links in separate tabs

### User Experience

**Tooltip Text:**
- Single link: "How-to Documentation" or "How-to Video"
- Multiple links: "N Documentation Links - Click to choose" or "N Video Links - Click to choose"

**Menu Behavior:**
- Positioned below the chip that triggered it
- Automatically closes after selecting a link
- Can be closed by clicking outside the menu
- Each link opens in a new browser tab

## Code Example

### Chip with Dropdown
```tsx
<Chip
  size="small"
  label={`Doc${task.howToDoc.length > 1 ? ` (${task.howToDoc.length})` : ''}`}
  color="primary"
  variant="outlined"
  onClick={(e) => {
    e.stopPropagation();
    if (task.howToDoc.length === 1) {
      window.open(task.howToDoc[0], '_blank');
    } else {
      setDocMenuAnchor({ el: e.currentTarget as HTMLElement, links: task.howToDoc });
    }
  }}
  title={task.howToDoc.length === 1 ? "How-to Documentation" : `${task.howToDoc.length} Documentation Links - Click to choose`}
/>
```

### Menu Component
```tsx
<Menu
  anchorEl={docMenuAnchor?.el}
  open={Boolean(docMenuAnchor)}
  onClose={() => setDocMenuAnchor(null)}
>
  <MenuItem disabled>Documentation Links:</MenuItem>
  {docMenuAnchor?.links.map((link, index) => (
    <MenuItem key={index} onClick={() => {
      window.open(link, '_blank');
      setDocMenuAnchor(null);
    }}>
      {link.length > 50 ? `${link.substring(0, 50)}...` : link}
    </MenuItem>
  ))}
  <MenuItem onClick={() => {
    docMenuAnchor?.links.forEach((link) => window.open(link, '_blank'));
    setDocMenuAnchor(null);
  }}>
    Open All ({docMenuAnchor?.links.length})
  </MenuItem>
</Menu>
```

## Benefits

1. **Better UX**: Users can see and select individual links instead of opening all at once
2. **Control**: Users choose which links to open rather than flooding their browser with tabs
3. **Clarity**: Link count is visible, and full URLs are shown in the dropdown
4. **Efficiency**: Single links open immediately without extra clicks
5. **Flexibility**: "Open All" option still available for power users

## Testing

- ✅ Single link opens directly
- ✅ Multiple links show dropdown menu
- ✅ Individual links open correctly
- ✅ "Open All" opens all links
- ✅ Menu closes after selection
- ✅ Menu closes when clicking outside
- ✅ Proper truncation of long URLs
- ✅ Works in both TasksPanel and App components

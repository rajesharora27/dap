# DAP Quick Reference - What's New in v1.2.0

## 🆕 New Features

### Customer Adoption Planning

#### Sync Improvements
```typescript
// Sync button now auto-includes ALL outcomes and releases
// No need to manually select - just click "Sync Selected Products"
```

#### HowTo Links
```typescript
// Add documentation and video links to any task
howToDoc: "https://docs.example.com/task-guide"
howToVideo: "https://youtube.com/watch?v=example"

// Icons appear in task list - click to open in new tab
// 📄 Article icon for documentation
// 🎥 OndemandVideo icon for videos
```

#### Inline Sequence Editing
```typescript
// Click sequence number in task list to edit
// Automatic reordering prevents conflicts
// Two-phase update ensures data integrity
```

### UI/UX Enhancements

#### Task List View
- **Description on Hover**: No clutter, show details only when needed
- **Professional Icons**: Material-UI icons throughout
- **Clickable Links**: One-click access to documentation and videos
- **Auto-expand Menu**: Product menu expands on first click

#### Cache Management
- **Real-time Updates**: Changes visible immediately
- **Smart Invalidation**: Only updates what changed
- **Optimistic UI**: Instant feedback before server confirms

## 🔧 GraphQL API Updates

### Query Adoption Plan (Updated)
```graphql
query {
  customerAdoptionPlans(customerId: "customer-123") {
    id
    tasks {
      id
      name
      description
      sequenceNumber
      howToDoc        # NEW
      howToVideo      # NEW
      outcomes { id name }
      releases { id name }
    }
  }
}
```

### Update Task Sequence
```graphql
mutation {
  updateTask(
    id: "task-123"
    input: { sequenceNumber: 5 }
  ) {
    id
    sequenceNumber
  }
}
```

### Sync Adoption Plan (Enhanced)
```graphql
mutation {
  syncAdoptionPlan(
    customerId: "customer-123"
    productIds: ["product-1", "product-2"]
  ) {
    id
    tasks {
      howToDoc
      howToVideo
      outcomes { id name }  # Auto-included
      releases { id name }  # Auto-included
    }
  }
}
```

## 📝 Usage Examples

### Adding HowTo Links to Tasks

**In the UI:**
1. Open task dialog (create or edit)
2. Scroll to "Documentation" section
3. Enter documentation URL in "HowTo Doc" field
4. Enter video URL in "HowTo Video" field
5. Save task
6. Links appear as clickable icons in task list

**Via GraphQL:**
```graphql
mutation {
  updateTask(
    id: "task-123"
    input: {
      howToDoc: "https://docs.example.com/setup"
      howToVideo: "https://youtube.com/watch?v=abc123"
    }
  ) {
    id
    howToDoc
    howToVideo
  }
}
```

### Reordering Tasks

**In the UI:**
1. Click on sequence number in task list
2. Enter new sequence number
3. Press Enter or click away
4. All affected tasks automatically renumber

**Via GraphQL:**
```graphql
mutation {
  updateTask(
    id: "task-123"
    input: { sequenceNumber: 3 }
  ) {
    id
    sequenceNumber
  }
}
# Tasks with sequence >= 3 automatically increment
```

### Syncing Adoption Plans

**In the UI:**
1. Select customer from dropdown
2. Check products to sync
3. Click "Sync Selected Products"
4. All outcomes and releases automatically included
5. Tasks filtered by customer's license level

**Via GraphQL:**
```graphql
mutation {
  syncAdoptionPlan(
    customerId: "customer-abc"
    productIds: ["product-1", "product-2"]
  ) {
    id
    customer { id name }
    tasks {
      id
      name
      license { level }
      outcomes { id name }  # ALL outcomes included
      releases { id name }  # ALL releases included
    }
  }
}
```

## 🐛 Bug Fixes

### Fixed Issues
- ✅ Sync not updating adoption plans with product changes
- ✅ GraphQL 400 errors on outcome queries
- ✅ Sequence unique constraint violations
- ✅ Task deletion not updating GUI
- ✅ Outcome changes not syncing across components
- ✅ Product menu requiring double-click

### How Fixes Work

#### Sequence Management
```typescript
// Old: Single update caused unique constraint violations
UPDATE tasks SET sequence = 3 WHERE id = 'task-123'
// Error: sequence 3 already exists!

// New: Two-phase update with temporary values
UPDATE tasks SET sequence = -1000 WHERE sequence >= 3
UPDATE tasks SET sequence = sequence + 1 WHERE sequence < 0
UPDATE tasks SET sequence = 3 WHERE id = 'task-123'
// Success: No conflicts!
```

#### Cache Management
```typescript
// After deletion
client.cache.evict({ id: cache.identify(task) })
client.cache.gc()  // Garbage collection
refetchQueries: ['Tasks', 'Products']  // Ensure UI updates
```

## 💡 Tips & Best Practices

### Task Sequencing
- Use gaps (10, 20, 30) for easier reordering
- Let the system handle automatic renumbering
- Sequence conflicts are automatically resolved

### HowTo Links
- Use short, memorable documentation URLs
- YouTube videos work great with auto-embed
- Internal documentation systems supported
- Links open in new tabs automatically

### Adoption Plan Sync
- Sync regularly to catch product updates
- Customer license level filters tasks automatically
- All outcomes/releases always included
- No manual selection needed

### Performance
- Apollo cache makes repeat queries instant
- Optimistic updates for immediate feedback
- Background refetches ensure consistency
- Garbage collection prevents memory leaks

## 🔍 Troubleshooting

### Task Sequence Not Updating
```bash
# Check for unique constraint errors
# Solution: Built-in two-phase update handles this automatically
```

### HowTo Links Not Visible
```bash
# Verify fields in GraphQL query
query {
  tasks {
    howToDoc
    howToVideo  # Make sure these are included
  }
}
```

### Sync Not Including All Data
```bash
# Check backend resolver - should auto-include all outcomes/releases
# No manual selection needed in v1.2.0+
```

### Cache Not Updating
```bash
# Check refetchQueries array includes relevant queries
refetchQueries: ['Tasks', 'Products', 'Outcomes']

# Force cache refresh if needed
client.cache.gc()
```

## 📚 More Information

- **Full Features**: See [FEATURES.md](FEATURES.md)
- **Architecture**: See [ARCHITECTURE.md](ARCHITECTURE.md)
- **Deployment**: See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- **Changes**: See [CHANGELOG.md](CHANGELOG.md)
- **Quick Start**: See [QUICK_START.md](QUICK_START.md)

---

**Version**: 1.2.0  
**Updated**: October 16, 2025  
**Status**: Production Ready ✅

# Quick Start Guide - Adoption Plan Sync & Filters

## What's New?

### 1. Always-Available Sync Button ⚠️
- **Location**: Next to "Assign Product" button
- **What it does**: Syncs customer adoption plans with latest product tasks
- **Shows**: ⚠️ emoji when sync is needed
- **Tooltip**: "Sync with latest product tasks (outcomes, licenses, releases)"

### 2. Three Filter Dropdowns
- **Release Filter**: Filter tasks by product release (e.g., "v2.0", "v2.5")
- **License Filter**: Filter tasks by license level (e.g., "PROFESSIONAL", "ENTERPRISE")
- **Outcome Filter**: Filter tasks by business outcome (e.g., "Security", "Onboarding")

### 3. Task Metadata Badges
Each task now shows color-coded badges:
- 🔵 **Blue** = License level
- 🟣 **Purple** = Releases
- 🟢 **Green** = Outcomes

## Quick Actions

### Sync a Customer's Adoption Plan
```
1. Go to Customers → Select a customer
2. Select a product
3. Click [Sync ⚠️] button
4. Wait for success message
5. Tasks are now up-to-date!
```

### Filter Tasks by Release
```
1. In adoption plan view
2. Click "Release" dropdown
3. Select a release (e.g., "v2.0")
4. Only tasks for that release shown
5. Clear to see all tasks again
```

### Filter Tasks by License Level
```
1. Click "License" dropdown
2. Select license (e.g., "PROFESSIONAL")
3. See only tasks for that license tier
```

### Filter Tasks by Outcome
```
1. Click "Outcome" dropdown
2. Select outcome (e.g., "Security")
3. See only tasks contributing to that outcome
```

### Combine Multiple Filters
```
1. Select Release: "v2.5"
2. Select License: "ENTERPRISE"
3. Select Outcome: "Security"
4. Result: Only v2.5 Enterprise Security tasks
5. Click "Clear Filters" to reset
```

## Common Scenarios

### Scenario 1: New Product Release
**Problem**: Product v2.5 just released with new features

**Solution**:
1. Click Sync button on each customer
2. New v2.5 tasks automatically added
3. Filter by "Release: v2.5" to see what's new
4. Communicate new features to customers

### Scenario 2: Customer Upgrades License
**Problem**: Customer upgraded from STARTER to PROFESSIONAL

**Solution**:
1. Update customer's license level
2. Click Sync button
3. PROFESSIONAL tasks automatically added
4. Filter by "License: PROFESSIONAL" to see new capabilities

### Scenario 3: Focus on Specific Outcome
**Problem**: Customer wants to prioritize security

**Solution**:
1. Filter by "Outcome: Security"
2. See all security-related tasks
3. Update statuses for security tasks
4. Track progress toward security goals

### Scenario 4: Analyze Release Adoption
**Problem**: Need to see which customers completed v2.0 tasks

**Solution**:
1. Filter by "Release: v2.0"
2. Check status of v2.0 tasks
3. Identify customers ahead/behind
4. Plan outreach accordingly

## Visual Guide

### Before Filtering
```
Tasks (50 total)
├─ Setup Environment [PRO] [v2.0] [Onboarding]
├─ Configure API [ENT] [v2.1] [Integration]
├─ Install SDK [STARTER] [v2.0] [Developer]
├─ Setup Security [ENT] [v2.5] [Security]
└─ ... (46 more)
```

### After Filtering (Release: v2.5)
```
Tasks (5 matching)
├─ Setup Security [ENT] [v2.5] [Security]
├─ Configure SSO [ENT] [v2.5] [Security]
├─ Enable Audit [PRO] [v2.5] [Compliance]
├─ Setup Alerts [PRO] [v2.5] [Monitoring]
└─ Configure Backup [ENT] [v2.5] [Data Protection]
```

## Badge Color Guide

| Color | Type | Example |
|-------|------|---------|
| 🔵 Blue | License Level | PROFESSIONAL |
| 🟣 Purple | Release | v2.0, v2.5 |
| 🟢 Green | Outcome | Security, Onboarding |

## Tips & Tricks

### Tip 1: Check Sync Status
- Look for ⚠️ emoji on Sync button
- Orange color = sync needed
- Blue color = already synced

### Tip 2: Clear All Filters Quickly
- "Clear Filters" button appears when any filter is active
- One click resets all filters to "All"

### Tip 3: Combine Filters for Precision
- Use multiple filters together
- AND logic: Task must match ALL selected filters
- Great for very specific analysis

### Tip 4: No Tasks Found?
- If "No tasks match the selected filters" appears
- Try less restrictive filter combination
- Or check if tasks actually have that metadata

### Tip 5: Regular Syncing
- Sync after each product release
- Sync when customer license changes
- Sync periodically to stay current

## Troubleshooting

### Q: Sync button doesn't appear
**A**: Make sure:
- Customer has assigned product
- Product has adoption plan created
- You're viewing the adoption plan section

### Q: Filter dropdown is empty
**A**: This means:
- No tasks have that metadata yet
- Example: No tasks tagged with releases
- Add metadata to product tasks first

### Q: Filtering shows no tasks
**A**: Check:
- Are filters too restrictive?
- Do tasks actually have the selected metadata?
- Try clicking "Clear Filters" and start over

### Q: Badges not showing
**A**: Possible causes:
- Tasks don't have metadata assigned
- Update product tasks with licenses, releases, outcomes
- Sync adoption plan to pull in metadata

### Q: Sync not updating tasks
**A**: Verify:
- Product tasks have been updated
- Correct product is selected
- Check browser console for errors
- Try refreshing the page

## Best Practices

### For Administrators
1. **Sync regularly**: After each product update
2. **Use filters**: For targeted analysis and reporting
3. **Check badges**: Ensure tasks have correct metadata
4. **Monitor warnings**: Address ⚠️ indicators promptly

### For Product Managers
1. **Tag tasks properly**: Assign licenses, releases, outcomes
2. **Plan releases**: Use release tags for version planning
3. **Communicate changes**: Use filters to see what's new
4. **Track adoption**: Monitor which features customers use

### For Customer Success
1. **Sync before meetings**: Ensure latest task list
2. **Filter by outcome**: Align with customer goals
3. **Track progress**: Use filters for focused tracking
4. **Report regularly**: Show outcome-based progress

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Open Release filter | Click dropdown |
| Navigate options | Arrow keys |
| Select option | Enter |
| Close dropdown | Escape |

## Next Steps

After setting up filters and sync:
1. Update task statuses regularly
2. Track progress by outcome
3. Monitor adoption by release
4. Report on license utilization
5. Keep plans in sync with products

## Support

For issues or questions:
1. Check this guide first
2. Review full documentation: `ADOPTION_PLAN_SYNC_FILTERS.md`
3. Check browser console for errors
4. Contact development team

---

**Last Updated**: October 15, 2025
**Version**: 1.0
**Status**: Production Ready ✅

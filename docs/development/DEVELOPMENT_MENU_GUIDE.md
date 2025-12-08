# Development Menu Implementation Guide

## 📁 Files Created

1. **DevelopmentTestsPanel.tsx** - Test execution panel
2. **DevelopmentCICDPanel.tsx** - CI/CD workflows panel
3. **DevelopmentDocsPanel.tsx** - Documentation viewer
4. **DEVELOPMENT_MENU_GUIDE.md** - This file

---

## 🔧 Integration Steps

### Step 1: Import the development panels in App.tsx

Add these imports at the top of `/data/dap/frontend/src/pages/App.tsx`:

```typescript
// Development Tools (Dev Mode Only)
import { DevelopmentTestsPanel } from '../components/dev/DevelopmentTestsPanel';
import { DevelopmentCICDPanel } from '../components/dev/DevelopmentCICDPanel';
import { DevelopmentDocsPanel } from '../components/dev/DevelopmentDocsPanel';
import DeveloperModeIcon from '@mui/icons-material/DeveloperMode';
```

### Step 2: Add state for development menu

Add this state near other menu state (around line 900):

```typescript
const [devExpanded, setDevExpanded] = useState(false);
const [selectedDevSubSection, setSelectedDevSubSection] = useState<'tests' | 'cicd' | 'docs'>('tests');
```

### Step 3: Add environment check

Add this constant near the top of the component:

```typescript
// Check if in development mode
const isDevelopmentMode = import.meta.env.DEV || import.meta.env.MODE === 'development';
```

### Step 4: Add Development menu in sidebar

Add this code AFTER the Admin section (around line 2279), BEFORE  the closing `</List>`:

```typescript
{/* Development Section (Dev Mode + Admin Only) */}
{isDevelopmentMode && user?.isAdmin && (
  <>
    <ListItemButton
      selected={selectedSection === 'development'}
      onClick={() => {
        setSelectedSection('development');
        setDevExpanded(!devExpanded);
      }}
      sx={{
        '&.Mui-selected': {
          backgroundColor: 'rgba(156, 39, 176, 0.08)',
          '& .MuiListItemIcon-root': {
            color: '#9C27B0'
          },
          '& .MuiListItemText-primary': {
            color: '#9C27B0',
            fontWeight: 600
          }
        },
        '&.Mui-selected:hover': {
          backgroundColor: 'rgba(156, 39, 176, 0.12)'
        }
      }}
    >
      <ListItemIcon>
        <DeveloperModeIcon />
      </ListItemIcon>
      <ListItemText primary="Development" />
      {devExpanded ? <ExpandLess /> : <ExpandMore />}
    </ListItemButton>
    <Collapse in={devExpanded} timeout="auto" unmountOnExit>
      <List component="div" disablePadding>
        <ListItemButton
          sx={{
            pl: 4,
            '&.Mui-selected': {
              backgroundColor: 'rgba(156, 39, 176, 0.08)',
              '& .MuiListItemIcon-root': {
                color: '#9C27B0'
              },
              '& .MuiListItemText-primary': {
                color: '#9C27B0',
                fontWeight: 600
              }
            },
            '&.Mui-selected:hover': {
              backgroundColor: 'rgba(156, 39, 176, 0.12)'
            }
          }}
          selected={selectedSection === 'development' && selectedDevSubSection === 'tests'}
          onClick={() => {
            setSelectedSection('development');
            setSelectedDevSubSection('tests');
          }}
        >
          <ListItemIcon>
            <BugIcon />
          </ListItemIcon>
          <ListItemText primary="Tests" />
        </ListItemButton>
        <ListItemButton
          sx={{
            pl: 4,
            '&.Mui-selected': {
              backgroundColor: 'rgba(156, 39, 176, 0.08)',
              '& .MuiListItemIcon-root': {
                color: '#9C27B0'
              },
              '& .MuiListItemText-primary': {
                color: '#9C27B0',
                fontWeight: 600
              }
            },
            '&.Mui-selected:hover': {
              backgroundColor: 'rgba(156, 39, 176, 0.12)'
            }
          }}
          selected={selectedSection === 'development' && selectedDevSubSection === 'cicd'}
          onClick={() => {
            setSelectedSection('development');
            setSelectedDevSubSection('cicd');
          }}
        >
          <ListItemIcon>
            <GitHubIcon />
          </ListItemIcon>
          <ListItemText primary="CI/CD" />
        </ListItemButton>
        <ListItemButton
          sx={{
            pl: 4,
            '&.Mui-selected': {
              backgroundColor: 'rgba(156, 39, 176, 0.08)',
              '& .MuiListItemIcon-root': {
                color: '#9C27B0'
              },
              '& .MuiListItemText-primary': {
                color: '#9C27B0',
                fontWeight: 600
              }
            },
            '&.Mui-selected:hover': {
              backgroundColor: 'rgba(156, 39, 176, 0.12)'
            }
          }}
          selected={selectedSection === 'development' && selectedDevSubSection === 'docs'}
          onClick={() => {
            setSelectedSection('development');
            setSelectedDevSubSection('docs');
          }}
        >
          <ListItemIcon>
            <ArticleIcon />
          </ListItemIcon>
          <ListItemText primary="Docs" />
        </ListItemButton>
      </List>
    </Collapse>
  </>
)}
```

### Step 5: Add Development content section

Add this code in the main content area, AFTER the Admin section (around line 2350):

```typescript
{/* Development Section (Dev Mode + Admin Only) */}
{selectedSection === 'development' && isDevelopmentMode && user?.isAdmin && (
  <>
    {selectedDevSubSection === 'tests' && <DevelopmentTestsPanel />}
    {selectedDevSubSection === 'cicd' && <DevelopmentCICDPanel />}
    {selectedDevSubSection === 'docs' && <DevelopmentDocsPanel />}
  </>
)}
```

### Step 6: Add missing icon imports

Make sure these icons are imported at the top:

```typescript
import {
  // ... existing imports
  BugReport as BugIcon,
  GitHub as GitHubIcon,
  Article as ArticleIcon,
  ExpandLess,
  ExpandMore
} from '@mui/icons-material';
```

---

## ✅ Features

### Tests Panel
- View and run backend tests
- See test results in real-time
- Coverage reports
- Linting checks

### CI/CD Panel
- View GitHub Actions workflows
- Recent workflow runs
- Trigger workflows
- Quick command reference

### Documentation Panel
- Browse all project documentation
- Search functionality
- Categories
- Quick access to markdown files

---

## 🔒 Security

The Development menu:
- ✅ Only appears in development mode (`import.meta.env.DEV`)
- ✅ Only accessible to admin users
- ✅ Will NOT be included in production builds
- ✅ Uses Vite's environment variables

---

## 🎨 Design

- **Color:** Purple theme (#9C27B0) to differentiate from production menus
- **Icon:** DeveloperMode icon
- **Position:** After Admin section in sidebar
- **Expandable:** Collapsible with 3 submenus

---

## 🚀 Usage

1. Start the app in development mode:
   ```bash
   npm run dev
   ```

2. Login as admin user

3. Click "Development" in the sidebar

4. Navigate to:
   - **Tests** - Run test suites
   - **CI/CD** - View/trigger workflows
   - **Docs** - Browse documentation

---

## 📝 Notes

- The test execution feature would need a backend API endpoint (`/api/dev/run-test`) to actually execute tests
- CI/CD panel shows static data - integrate with GitHub API for live data
- Documentation panel can be enhanced to fetch actual file contents

---

## 🔧 Optional Enhancements

1. **Add test API endpoint** in backend:
   ```typescript
   // backend/src/server.ts
   app.post('/api/dev/run-test', async (req, res) => {
     if (process.env.NODE_ENV !== 'development') {
       return res.status(403).json({ error: 'Dev mode only' });
     }
     // Execute test command
     const { command } = req.body;
     // ... run command and return results
   });
   ```

2. **GitHub API Integration**:
   - Use GitHub API to fetch real workflow data
   - Trigger workflows programmatically

3. **Live Documentation**:
   - Fetch actual file contents
   - Render markdown
   - Syntax highlighting

---

**Status:** Ready to integrate ✅  
**Time to integrate:** 10-15 minutes  
**Dependencies:** None (all components self-contained)


import * as React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Box,
  CssBaseline,
  Drawer,
  Toolbar,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  Collapse,
  Menu,
  MenuItem,
  Avatar,
  CircularProgress,
  Tooltip
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Icons
import {
  Menu as MenuIcon,
  Dashboard as MainIcon,
  Inventory2 as ProductIcon,
  Lightbulb as SolutionIcon,
  People as CustomerIcon,
  Book as JournalIcon,
  AdminPanelSettings as AdminIcon,
  ExpandLess,
  ExpandMore,
  People as UsersIcon,
  VpnKey as RolesIcon,
  Backup as BackupIcon,
  Palette as ThemeIcon,
  Info as AboutIcon,
  Storage as StorageIcon,
  Article as ArticleIcon,
  BugReport as BugReportIcon,
  Build as BuildIcon,
  GitHub as GitHubIcon,
  Settings as SettingsIcon,
  Api as ApiIcon,
  Assessment as AssessmentIcon,
  Speed as SpeedIcon,
  PlaylistPlay as PlaylistPlayIcon,
  MoreVert as MoreVertIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  VerticalAlignTop as VerticalAlignTopIcon,
  VerticalAlignBottom as VerticalAlignBottomIcon
} from '@mui/icons-material';

import { useAuth, LoginPage } from '@features/auth';
import { Breadcrumbs } from '../shared/components';
import { AuthBar } from '@features/auth/components/AuthBar';
import { AppRoutes } from '../routes/AppRoutes';

const drawerWidth = 240;

const DEFAULT_DEV_MENU_ITEMS = [
  { id: 'database', label: 'Database', tooltip: 'Manage database migrations, seed data, and schema' },
  { id: 'logs', label: 'Logs', tooltip: 'View real-time application logs and debugging output' },
  { id: 'tests', label: 'Tests', tooltip: 'Run unit, integration, and E2E tests' },
  { id: 'build', label: 'Build', tooltip: 'Monitor build status, deployments, and artifacts' },
  { id: 'cicd', label: 'CI/CD', tooltip: 'Manage continuous integration and deployment pipelines' },
  { id: 'env', label: 'Environment', tooltip: 'Manage environment variables and configuration' },
  { id: 'api', label: 'API', tooltip: 'Test and debug API endpoints' },
  { id: 'docs', label: 'Docs', tooltip: 'View project documentation and guides' },
  { id: 'quality', label: 'Code Quality', tooltip: 'View code quality metrics and linting results' },
  { id: 'performance', label: 'Performance', tooltip: 'Monitor application performance and resource usage' },
  { id: 'git', label: 'Git', tooltip: 'View Git repository status, branches, and commit history' },
  { id: 'tasks', label: 'Tasks', tooltip: 'Execute npm scripts and custom development tasks' }
];

// Sortable Dev Menu Item Component
function SortableDevMenuItem({ item, selected, onClick, onContextMenu, icon }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative' as 'relative', // cast to satisfy type
    zIndex: isDragging ? 1000 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <ListItemButton
        selected={selected}
        onClick={onClick}
        onContextMenu={onContextMenu}
        sx={{
          pl: 4,
          '&.Mui-selected': {
            backgroundColor: 'rgba(233, 30, 99, 0.08)',
            '& .MuiListItemIcon-root': { color: '#e91e63' },
            '& .MuiListItemText-primary': { color: '#e91e63', fontWeight: 600 }
          },
          '&.Mui-selected:hover': { backgroundColor: 'rgba(233, 30, 99, 0.12)' },
          '&:hover .drag-handle': { opacity: 1 }
        }}
      >
        <ListItemIcon sx={{ minWidth: 40 }}>{icon}</ListItemIcon>
        <ListItemText primary={item.label} />
        {/* Drag Handle - visible on hover */}
        <Box
          className="drag-handle"
          sx={{
            opacity: 0,
            transition: 'opacity 0.2s',
            cursor: 'grab',
            display: 'flex',
            alignItems: 'center',
            p: 0.5,
            mr: -1,
            '&:active': { cursor: 'grabbing' }
          }}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertIcon fontSize="small" color="disabled" />
        </Box>
      </ListItemButton>
    </div>
  );
}

// Authenticated App Shell - contains all the hooks that were previously breaking rules
function AuthenticatedApp() {
  const theme = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Draw state
  const [drawerOpen, setDrawerOpen] = useState(true);

  // Development menu state
  const [devExpanded, setDevExpanded] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ mouseX: number; mouseY: number; itemId: string } | null>(null);

  // Admin menu state
  const [adminExpanded, setAdminExpanded] = useState(true);

  // Dev Menu Order State
  const [devMenuItems, setDevMenuItems] = useState(() => {
    const saved = localStorage.getItem('devMenuOrder');
    if (saved) {
      try {
        const savedOrder = JSON.parse(saved);
        // Merge with default to handle new items or items removed
        const base = DEFAULT_DEV_MENU_ITEMS.filter(i => savedOrder.includes(i.id));
        const missing = DEFAULT_DEV_MENU_ITEMS.filter(i => !savedOrder.includes(i.id));
        // Reorder base according to savedOrder
        const orderedBase = savedOrder
          .map((id: string) => base.find(i => i.id === id))
          .filter(Boolean);
        return [...orderedBase, ...missing];
      } catch (e) { return DEFAULT_DEV_MENU_ITEMS; }
    }
    return DEFAULT_DEV_MENU_ITEMS;
  });

  useEffect(() => {
    localStorage.setItem('devMenuOrder', JSON.stringify(devMenuItems.map(i => i.id)));
  }, [devMenuItems]);

  const devMenuSensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDevMenuDragEnd = (event: any) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setDevMenuItems((items: any) => {
        const oldIndex = items.findIndex((i: any) => i.id === active.id);
        const newIndex = items.findIndex((i: any) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleDevContextMenu = (event: React.MouseEvent, itemId: string) => {
    event.preventDefault();
    setContextMenu(
      contextMenu === null
        ? { mouseX: event.clientX + 2, mouseY: event.clientY - 6, itemId }
        : null,
    );
  };

  const handleContextAction = (action: 'up' | 'down' | 'top' | 'bottom') => {
    if (!contextMenu) return;
    const items = [...devMenuItems];
    const index = items.findIndex(i => i.id === contextMenu.itemId);
    if (index === -1) return;

    if (action === 'up' && index > 0) {
      [items[index], items[index - 1]] = [items[index - 1], items[index]];
    } else if (action === 'down' && index < items.length - 1) {
      [items[index], items[index + 1]] = [items[index + 1], items[index]];
    } else if (action === 'top') {
      const item = items.splice(index, 1)[0];
      items.unshift(item);
    } else if (action === 'bottom') {
      const item = items.splice(index, 1)[0];
      items.push(item);
    }

    setDevMenuItems(items);
    setContextMenu(null);
  };

  const getDevIcon = (id: string) => {
    switch (id) {
      case 'database': return <StorageIcon />;
      case 'logs': return <ArticleIcon />;
      case 'tests': return <BugReportIcon />;
      case 'build': return <BuildIcon />;
      case 'cicd': return <GitHubIcon />;
      case 'env': return <SettingsIcon />;
      case 'api': return <ApiIcon />;
      case 'docs': return <ArticleIcon />;
      case 'quality': return <AssessmentIcon />;
      case 'performance': return <SpeedIcon />;
      case 'git': return <GitHubIcon />;
      case 'tasks': return <PlaylistPlayIcon />;
      default: return <SettingsIcon />;
    }
  };

  // Check if dev tools should be enabled
  const devToolsEnabled =
    typeof import.meta !== 'undefined' &&
    typeof import.meta.env !== 'undefined' &&
    import.meta.env.VITE_ENABLE_DEV_TOOLS === 'true';

  // Derived Selection
  const getSelectedSection = () => {
    const path = location.pathname;
    if (path.startsWith('/products')) return 'products';
    if (path.startsWith('/solutions')) return 'solutions';
    if (path.startsWith('/customers')) return 'customers';
    if (path.startsWith('/diary')) return 'myDiary';
    if (path.startsWith('/admin')) return 'admin';
    if (path.startsWith('/dev')) return 'development';
    return 'dashboard';
  };
  const selectedSection = getSelectedSection();

  const getSelectedAdminSubSection = () => {
    const path = location.pathname;
    if (path.includes('/users')) return 'users';
    if (path.includes('/roles')) return 'roles';
    if (path.includes('/backup')) return 'backup';
    if (path.includes('/theme')) return 'theme';
    if (path.includes('/about')) return 'about';
    return 'users';
  };
  const selectedAdminSubSection = getSelectedAdminSubSection();

  // Helper to determine active dev subsection from path
  const getSelectedDevSubSection = () => {
    const path = location.pathname;
    // e.g. /dev/tests
    const parts = path.split('/');
    if (parts.length >= 3 && parts[1] === 'dev') {
      return parts[2];
    }
    return 'tests'; // default or fallback
  };
  const selectedDevSubSection = getSelectedDevSubSection();
  const isAdmin = user?.isAdmin;

  // Handlers for Navigation from AuthBar (if it passes onNavigate)
  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AuthBar
        onMenuClick={() => setDrawerOpen(!drawerOpen)}
        drawerOpen={drawerOpen}
        onProfileClick={() => navigate('/admin/users')} // Or wherever profile is
        onNavigate={handleNavigate}
      />

      <Drawer
        variant="permanent"
        open={drawerOpen}
        sx={{
          width: drawerOpen ? drawerWidth : 0,
          flexShrink: 0,
          whiteSpace: 'nowrap',
          boxSizing: 'border-box',
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          overflowX: 'hidden',
          '& .MuiDrawer-paper': {
            width: drawerOpen ? drawerWidth : 0,
            boxSizing: 'border-box',
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            overflowX: 'hidden',
            borderRight: drawerOpen ? '1px solid rgba(0, 0, 0, 0.12)' : 'none',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {/* Dashboard */}
            <ListItemButton
              selected={selectedSection === 'dashboard'}
              onClick={() => navigate('/dashboard')}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'rgba(4, 159, 217, 0.08)',
                  '& .MuiListItemIcon-root': { color: '#049FD9' },
                  '& .MuiListItemText-primary': { color: '#049FD9', fontWeight: 600 }
                },
                '&.Mui-selected:hover': { backgroundColor: 'rgba(4, 159, 217, 0.12)' }
              }}
            >
              <ListItemIcon><MainIcon /></ListItemIcon>
              <ListItemText primary="Getting Started" />
            </ListItemButton>

            {/* Products */}
            <ListItemButton
              selected={selectedSection === 'products'}
              onClick={() => navigate('/products')}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'rgba(4, 159, 217, 0.08)',
                  '& .MuiListItemIcon-root': { color: '#049FD9' },
                  '& .MuiListItemText-primary': { color: '#049FD9', fontWeight: 600 }
                },
                '&.Mui-selected:hover': { backgroundColor: 'rgba(4, 159, 217, 0.12)' }
              }}
            >
              <ListItemIcon><ProductIcon /></ListItemIcon>
              <ListItemText primary="Products" />
            </ListItemButton>

            {/* Solutions */}
            <ListItemButton
              selected={selectedSection === 'solutions'}
              onClick={() => navigate('/solutions')}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'rgba(237, 108, 2, 0.08)',
                  '& .MuiListItemIcon-root': { color: '#ed6c02' },
                  '& .MuiListItemText-primary': { color: '#ed6c02', fontWeight: 600 }
                },
                '&.Mui-selected:hover': { backgroundColor: 'rgba(237, 108, 2, 0.12)' }
              }}
            >
              <ListItemIcon><SolutionIcon /></ListItemIcon>
              <ListItemText primary="Solutions" />
            </ListItemButton>

            {/* Customers */}
            <ListItemButton
              selected={selectedSection === 'customers'}
              onClick={() => navigate('/customers')}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'rgba(46, 125, 50, 0.08)',
                  '& .MuiListItemIcon-root': { color: '#2e7d32' },
                  '& .MuiListItemText-primary': { color: '#2e7d32', fontWeight: 600 }
                },
                '&.Mui-selected:hover': { backgroundColor: 'rgba(46, 125, 50, 0.12)' }
              }}
            >
              <ListItemIcon><CustomerIcon /></ListItemIcon>
              <ListItemText primary="Customers" />
            </ListItemButton>

            {/* My Diary */}
            <ListItemButton
              selected={selectedSection === 'myDiary'}
              onClick={() => navigate('/diary')}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'rgba(4, 159, 217, 0.08)',
                  '& .MuiListItemIcon-root': { color: '#049FD9' },
                  '& .MuiListItemText-primary': { color: '#049FD9', fontWeight: 600 }
                },
                '&.Mui-selected:hover': { backgroundColor: 'rgba(4, 159, 217, 0.12)' }
              }}
            >
              <ListItemIcon><JournalIcon /></ListItemIcon>
              <ListItemText primary="My Diary" />
            </ListItemButton>

            <Divider sx={{ my: 1 }} />

            {/* Admin Section */}
            {isAdmin && (
              <>
                <ListItemButton
                  selected={selectedSection === 'admin'}
                  onClick={() => {
                    if (selectedSection !== 'admin') {
                      navigate('/admin/users');
                      setAdminExpanded(true);
                    } else {
                      setAdminExpanded(!adminExpanded);
                    }
                  }}
                  sx={{
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(4, 159, 217, 0.08)',
                      '& .MuiListItemIcon-root': { color: '#049FD9' },
                      '& .MuiListItemText-primary': { color: '#049FD9', fontWeight: 600 }
                    },
                    '&.Mui-selected:hover': { backgroundColor: 'rgba(4, 159, 217, 0.12)' }
                  }}
                >
                  <ListItemIcon><AdminIcon /></ListItemIcon>
                  <ListItemText primary="Admin" />
                  {adminExpanded ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
                <Collapse in={adminExpanded} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    <ListItemButton
                      sx={{ pl: 4, '&.Mui-selected': { bgcolor: 'rgba(4, 159, 217, 0.08)' } }}
                      selected={selectedSection === 'admin' && selectedAdminSubSection === 'users'}
                      onClick={() => navigate('/admin/users')}
                    >
                      <ListItemIcon><UsersIcon /></ListItemIcon>
                      <ListItemText primary="Users" />
                    </ListItemButton>
                    <ListItemButton
                      sx={{ pl: 4, '&.Mui-selected': { bgcolor: 'rgba(4, 159, 217, 0.08)' } }}
                      selected={selectedSection === 'admin' && selectedAdminSubSection === 'roles'}
                      onClick={() => navigate('/admin/roles')}
                    >
                      <ListItemIcon><RolesIcon /></ListItemIcon>
                      <ListItemText primary="Roles" />
                    </ListItemButton>
                    <ListItemButton
                      sx={{ pl: 4, '&.Mui-selected': { bgcolor: 'rgba(4, 159, 217, 0.08)' } }}
                      selected={selectedSection === 'admin' && selectedAdminSubSection === 'backup'}
                      onClick={() => navigate('/admin/backup')}
                    >
                      <ListItemIcon><BackupIcon /></ListItemIcon>
                      <ListItemText primary="Backup & Restore" />
                    </ListItemButton>
                    <ListItemButton
                      sx={{ pl: 4, '&.Mui-selected': { bgcolor: 'rgba(4, 159, 217, 0.08)' } }}
                      selected={selectedSection === 'admin' && selectedAdminSubSection === 'theme'}
                      onClick={() => navigate('/admin/theme')}
                    >
                      <ListItemIcon><ThemeIcon /></ListItemIcon>
                      <ListItemText primary="Theme" />
                    </ListItemButton>
                    <ListItemButton
                      sx={{ pl: 4, '&.Mui-selected': { bgcolor: 'rgba(4, 159, 217, 0.08)' } }}
                      selected={selectedSection === 'admin' && selectedAdminSubSection === 'about'}
                      onClick={() => navigate('/admin/about')}
                    >
                      <ListItemIcon><AboutIcon /></ListItemIcon>
                      <ListItemText primary="About" />
                    </ListItemButton>
                  </List>
                </Collapse>
              </>
            )}

            {/* Development Tools - Only if enabled */}
            {devToolsEnabled && (
              <>
                <Divider sx={{ my: 1 }} />
                <ListItemButton
                  selected={selectedSection === 'development'}
                  onClick={() => setDevExpanded(!devExpanded)}
                  sx={{
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(233, 30, 99, 0.08)',
                      '& .MuiListItemIcon-root': { color: '#e91e63' },
                      '& .MuiListItemText-primary': { color: '#e91e63', fontWeight: 600 }
                    },
                    '&.Mui-selected:hover': { backgroundColor: 'rgba(233, 30, 99, 0.12)' }
                  }}
                >
                  <ListItemIcon><BugReportIcon /></ListItemIcon>
                  <ListItemText primary="Development" />
                  {devExpanded ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
                <Collapse in={devExpanded} timeout="auto" unmountOnExit>
                  <DndContext
                    sensors={devMenuSensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDevMenuDragEnd}
                  >
                    <SortableContext
                      items={devMenuItems.map(i => i.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <List component="div" disablePadding>
                        {devMenuItems.map((item) => (
                          <Tooltip key={item.id} title={item.tooltip} placement="right" arrow>
                            <div>
                              <SortableDevMenuItem
                                item={item}
                                selected={selectedSection === 'development' && selectedDevSubSection === item.id}
                                onClick={() => navigate(`/dev/${item.id}`)}
                                onContextMenu={(e: React.MouseEvent) => handleDevContextMenu(e, item.id)}
                                icon={getDevIcon(item.id)}
                              />
                            </div>
                          </Tooltip>
                        ))}
                      </List>
                    </SortableContext>
                  </DndContext>
                </Collapse>
              </>
            )}
          </List>
        </Box>

        {/* Dev Menu Context Menu */}
        <Menu
          open={contextMenu !== null}
          onClose={() => setContextMenu(null)}
          anchorReference="anchorPosition"
          anchorPosition={
            contextMenu !== null
              ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
              : undefined
          }
        >
          <MenuItem onClick={() => handleContextAction('up')}>
            <ArrowUpIcon fontSize="small" sx={{ mr: 1 }} /> Move Up
          </MenuItem>
          <MenuItem onClick={() => handleContextAction('down')}>
            <ArrowDownIcon fontSize="small" sx={{ mr: 1 }} /> Move Down
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => handleContextAction('top')}>
            <VerticalAlignTopIcon fontSize="small" sx={{ mr: 1 }} /> Move to Top
          </MenuItem>
          <MenuItem onClick={() => handleContextAction('bottom')}>
            <VerticalAlignBottomIcon fontSize="small" sx={{ mr: 1 }} /> Move to Bottom
          </MenuItem>
        </Menu>
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          overflowX: 'hidden'
        }}
      >
        <Toolbar />
        <Breadcrumbs />
        <AppRoutes />
      </Box>
    </Box>
  );
}

export function App() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <AuthenticatedApp />;
}
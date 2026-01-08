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
  ExpandLess,
  ExpandMore,
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
  VerticalAlignBottom as VerticalAlignBottomIcon,
  Add
} from '@mui/icons-material';

// Custom FAIcon imports for outlined style navigation icons
import {
  BoxIconOutlined as ProductIcon,
  LightbulbOutlined as SolutionIcon,
  People as CustomerIcon,
  Book as JournalIcon,
  AdminPanelSettings as AdminIcon,
  Group as UsersIcon,
  Lock as RolesIcon,
  Backup as BackupIcon,
  Palette as ThemeIcon,
  Help as AboutIcon,
  Timeline as ActivityIcon,
} from '@shared/components/FAIcon';

import { useAuth, LoginPage, UserProfileDialog } from '@features/auth';
import { Breadcrumbs } from '../shared/components';
import { AuthBar } from '@features/auth/components/AuthBar';
import { AppRoutes } from '../routes/AppRoutes';

const drawerWidth = 240;

const DEFAULT_DEV_MENU_ITEMS = [
  { id: 'tests', label: 'Tests', tooltip: 'Run unit, integration, and E2E tests' },
  { id: 'database', label: 'Database', tooltip: 'Manage database migrations, seed data, and schema' },
  { id: 'git', label: 'Git', tooltip: 'View Git repository status, branches, and commit history' },
  { id: 'build', label: 'Build', tooltip: 'Monitor build status and deployments' },
  { id: 'logs', label: 'Logs', tooltip: 'View real-time application logs and debugging output' },
  { id: 'env', label: 'Environment', tooltip: 'Manage environment variables and system info' },
  { id: 'quality', label: 'Quality', tooltip: 'View code quality metrics and coverage' },
  { id: 'docs', label: 'Docs', tooltip: 'View project documentation' }
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
          borderLeft: '3px solid transparent',
          transition: 'all 0.15s ease-in-out',
          '&.Mui-selected': {
            backgroundColor: '#e91e6312',
            borderLeft: '3px solid #e91e63',
            '& .MuiListItemIcon-root': { color: '#e91e63' },
            '& .MuiListItemText-primary': { color: '#e91e63', fontWeight: 600 }
          },
          '&.Mui-selected:hover': { backgroundColor: '#e91e6318' },
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

  // Profile dialog state
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

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
      case 'tests': return <BugReportIcon />;
      case 'database': return <StorageIcon />;
      case 'git': return <GitHubIcon />;
      case 'build': return <BuildIcon />;
      case 'logs': return <ArticleIcon />;
      case 'env': return <SettingsIcon />;
      case 'quality': return <AssessmentIcon />;
      case 'docs': return <ArticleIcon />;
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
    if (path.includes('/activity')) return 'activity';
    if (path.includes('/settings')) return 'settings';
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

  // Professional selected state styling - left border indicator + subtle background
  const getSelectedStyle = (accentColor: string = '#049FD9') => ({
    '&.Mui-selected': {
      backgroundColor: `${accentColor}12`,
      borderLeft: `3px solid ${accentColor}`,
      '& .MuiListItemIcon-root': { color: accentColor },
      '& .MuiListItemText-primary': { 
        color: accentColor, 
        fontWeight: 600 
      }
    },
    '&.Mui-selected:hover': { 
      backgroundColor: `${accentColor}18` 
    },
    '&:hover': {
      backgroundColor: theme.palette.mode === 'dark' 
        ? 'rgba(255, 255, 255, 0.05)' 
        : 'rgba(0, 0, 0, 0.04)'
    },
    borderLeft: '3px solid transparent', // Reserve space for selected border
    transition: 'all 0.15s ease-in-out',
  });

  // Handlers for Navigation from AuthBar (if it passes onNavigate)
  // Supports both direct paths ("/products") and type+id navigation from AI Assistant
  const handleNavigate = (typeOrPath: string, id?: string) => {
    if (id) {
      // AI Assistant navigation: (type, id) format
      // Construct path based on entity type
      switch (typeOrPath) {
        case 'products':
          navigate(`/products?highlight=${id}`);
          break;
        case 'solutions':
          navigate(`/solutions?highlight=${id}`);
          break;
        case 'customers':
          navigate(`/customers?highlight=${id}`);
          break;
        case 'tasks':
          // Tasks are opened in a dialog, not a page navigation
          // The AIChat handles this case by not closing
          navigate(`/products?task=${id}`);
          break;
        case 'adoptionPlans':
          navigate(`/customers?adoptionPlan=${id}`);
          break;
        default:
          // Unknown type - try to navigate as a path
          navigate(`/${typeOrPath}`);
      }
    } else {
      // Direct path navigation
      navigate(typeOrPath);
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AuthBar
        onMenuClick={() => setDrawerOpen(!drawerOpen)}
        drawerOpen={drawerOpen}
        onProfileClick={() => setProfileDialogOpen(true)}
        onNavigate={handleNavigate}
      />

      {/* User Profile Dialog */}
      <UserProfileDialog
        open={profileDialogOpen}
        onClose={() => setProfileDialogOpen(false)}
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
              sx={getSelectedStyle('#049FD9')}
            >
              <ListItemIcon><MainIcon /></ListItemIcon>
              <ListItemText primary="Getting Started" />
            </ListItemButton>

            {/* Products - Visible if user can READ products (RBAC-derived) */}
            {(isAdmin || user?.access?.products?.read || (user?.permissions?.products?.length > 0)) && (
              <ListItem disablePadding>
                <ListItemButton
                  selected={selectedSection === 'products'}
                  onClick={() => navigate('/products')}
                  sx={getSelectedStyle('#10B981')}
                >
                  <ListItemIcon>
                    <Box sx={{ p: 0.5, borderRadius: 1, bgcolor: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', display: 'flex', alignItems: 'center' }}>
                      <ProductIcon sx={{ color: '#10B981', fontSize: '1.1rem' }} />
                    </Box>
                  </ListItemIcon>
                  <ListItemText primary="Products" />
                </ListItemButton>
                {(isAdmin || user?.access?.products?.write) && (
                  <Tooltip title="Add Product">
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/products?add=true');
                      }}
                      sx={{ color: '#10B981', mr: 1 }}
                    >
                      <Add fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </ListItem>
            )}

            {/* Solutions - Visible if user can READ solutions (RBAC-derived) */}
            {(isAdmin || user?.access?.solutions?.read || (user?.permissions?.solutions?.length > 0)) && (
              <ListItem disablePadding>
                <ListItemButton
                  selected={selectedSection === 'solutions'}
                  onClick={() => navigate('/solutions')}
                  sx={getSelectedStyle('#3B82F6')}
                >
                  <ListItemIcon>
                    <Box sx={{ p: 0.5, borderRadius: 1, bgcolor: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.25)', display: 'flex', alignItems: 'center' }}>
                      <SolutionIcon sx={{ color: '#3B82F6', fontSize: '1.1rem' }} />
                    </Box>
                  </ListItemIcon>
                  <ListItemText primary="Solutions" />
                </ListItemButton>
                {(isAdmin || user?.access?.solutions?.write) && (
                  <Tooltip title="Add Solution">
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/solutions?add=true');
                      }}
                      sx={{ color: '#3B82F6', mr: 1 }}
                    >
                      <Add fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </ListItem>
            )}

            {/* Customers - Visible if user can READ customers (RBAC-derived) */}
            {(isAdmin || user?.access?.customers?.read || (user?.permissions?.customers?.length > 0)) && (
              <ListItem disablePadding>
                <ListItemButton
                  selected={selectedSection === 'customers'}
                  onClick={() => navigate('/customers')}
                  sx={getSelectedStyle('#8B5CF6')}
                >
                  <ListItemIcon>
                    <Box sx={{ p: 0.5, borderRadius: 1, bgcolor: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.25)', display: 'flex', alignItems: 'center' }}>
                      <CustomerIcon sx={{ color: '#8B5CF6', fontSize: '1.1rem' }} />
                    </Box>
                  </ListItemIcon>
                  <ListItemText primary="Customers" />
                </ListItemButton>
                {(isAdmin || user?.access?.customers?.write) && (
                  <Tooltip title="Add Customer">
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/customers?add=true');
                      }}
                      sx={{ color: '#8B5CF6', mr: 1 }}
                    >
                      <Add fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </ListItem>
            )}

            {/* My Diary */}
            <ListItemButton
              selected={selectedSection === 'myDiary'}
              onClick={() => navigate('/diary')}
              sx={getSelectedStyle('#EC4899')}
            >
              <ListItemIcon>
                <Box sx={{ p: 0.5, borderRadius: 1, bgcolor: 'rgba(236, 72, 153, 0.08)', border: '1px solid rgba(236, 72, 153, 0.25)', display: 'flex', alignItems: 'center' }}>
                  <JournalIcon sx={{ color: '#EC4899', fontSize: '1.1rem' }} />
                </Box>
              </ListItemIcon>
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
                  sx={getSelectedStyle('#64748B')}
                >
                  <ListItemIcon>
                    <Box sx={{ p: 0.5, borderRadius: 1, bgcolor: 'rgba(100, 116, 139, 0.08)', border: '1px solid rgba(100, 116, 139, 0.25)', display: 'flex', alignItems: 'center' }}>
                      <AdminIcon sx={{ color: '#64748B', fontSize: '1.1rem' }} />
                    </Box>
                  </ListItemIcon>
                  <ListItemText primary="Admin" />
                  {adminExpanded ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
                <Collapse in={adminExpanded} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    <ListItemButton
                      sx={{ pl: 4, ...getSelectedStyle('#14B8A6') }}
                      selected={selectedSection === 'admin' && selectedAdminSubSection === 'users'}
                      onClick={() => navigate('/admin/users')}
                    >
                      <ListItemIcon>
                        <Box sx={{ p: 0.4, borderRadius: 1, bgcolor: 'rgba(20, 184, 166, 0.08)', border: '1px solid rgba(20, 184, 166, 0.25)', display: 'flex', alignItems: 'center' }}>
                          <UsersIcon sx={{ color: '#14B8A6', fontSize: '0.95rem' }} />
                        </Box>
                      </ListItemIcon>
                      <ListItemText primary="Users" />
                    </ListItemButton>
                    <ListItemButton
                      sx={{ pl: 4, ...getSelectedStyle('#F59E0B') }}
                      selected={selectedSection === 'admin' && selectedAdminSubSection === 'roles'}
                      onClick={() => navigate('/admin/roles')}
                    >
                      <ListItemIcon>
                        <Box sx={{ p: 0.4, borderRadius: 1, bgcolor: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', display: 'flex', alignItems: 'center' }}>
                          <RolesIcon sx={{ color: '#F59E0B', fontSize: '0.95rem' }} />
                        </Box>
                      </ListItemIcon>
                      <ListItemText primary="Roles" />
                    </ListItemButton>
                    <ListItemButton
                      sx={{ pl: 4, ...getSelectedStyle('#22C55E') }}
                      selected={selectedSection === 'admin' && selectedAdminSubSection === 'backup'}
                      onClick={() => navigate('/admin/backup')}
                    >
                      <ListItemIcon>
                        <Box sx={{ p: 0.4, borderRadius: 1, bgcolor: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.25)', display: 'flex', alignItems: 'center' }}>
                          <BackupIcon sx={{ color: '#22C55E', fontSize: '0.95rem' }} />
                        </Box>
                      </ListItemIcon>
                      <ListItemText primary="Backup & Restore" />
                    </ListItemButton>
                    <ListItemButton
                      sx={{ pl: 4, ...getSelectedStyle('#3B82F6') }}
                      selected={selectedSection === 'admin' && selectedAdminSubSection === 'activity'}
                      onClick={() => navigate('/admin/activity')}
                    >
                      <ListItemIcon>
                        <Box sx={{ p: 0.4, borderRadius: 1, bgcolor: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.25)', display: 'flex', alignItems: 'center' }}>
                          <ActivityIcon sx={{ color: '#3B82F6', fontSize: '0.95rem' }} />
                        </Box>
                      </ListItemIcon>
                      <ListItemText primary="Activity" />
                    </ListItemButton>
                    <ListItemButton
                      sx={{ pl: 4, ...getSelectedStyle('#6B7280') }}
                      selected={selectedSection === 'admin' && selectedAdminSubSection === 'settings'}
                      onClick={() => navigate('/admin/settings')}
                    >
                      <ListItemIcon>
                        <Box sx={{ p: 0.4, borderRadius: 1, bgcolor: 'rgba(107, 114, 128, 0.08)', border: '1px solid rgba(107, 114, 128, 0.25)', display: 'flex', alignItems: 'center' }}>
                          <SettingsIcon sx={{ color: '#6B7280', fontSize: '0.95rem' }} />
                        </Box>
                      </ListItemIcon>
                      <ListItemText primary="Settings" />
                    </ListItemButton>
                    <ListItemButton
                      sx={{ pl: 4, ...getSelectedStyle('#A855F7') }}
                      selected={selectedSection === 'admin' && selectedAdminSubSection === 'theme'}
                      onClick={() => navigate('/admin/theme')}
                    >
                      <ListItemIcon>
                        <Box sx={{ p: 0.4, borderRadius: 1, bgcolor: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168, 85, 247, 0.25)', display: 'flex', alignItems: 'center' }}>
                          <ThemeIcon sx={{ color: '#A855F7', fontSize: '0.95rem' }} />
                        </Box>
                      </ListItemIcon>
                      <ListItemText primary="Theme" />
                    </ListItemButton>
                    <ListItemButton
                      sx={{ pl: 4, ...getSelectedStyle('#06B6D4') }}
                      selected={selectedSection === 'admin' && selectedAdminSubSection === 'about'}
                      onClick={() => navigate('/admin/about')}
                    >
                      <ListItemIcon>
                        <Box sx={{ p: 0.4, borderRadius: 1, bgcolor: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.25)', display: 'flex', alignItems: 'center' }}>
                          <AboutIcon sx={{ color: '#06B6D4', fontSize: '0.95rem' }} />
                        </Box>
                      </ListItemIcon>
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
                  sx={getSelectedStyle('#e91e63')}
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
      </Drawer >

      {/* Main Content */}
      < Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          overflowX: 'hidden'
        }
        }
      >
        <Toolbar />
        <Breadcrumbs />
        <AppRoutes />
      </Box >
    </Box >
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
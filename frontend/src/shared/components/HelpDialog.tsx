import * as React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    IconButton,
    Typography,
    Box,
    Divider,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    Paper,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Chip,
    useTheme,
    useMediaQuery,
} from '@mui/material';
import {
    Close,
    ExpandMore,
    Dashboard,
    People,
    LightbulbOutlined,
    BoxIconOutlined,
    CloudUpload,
    CloudDownload,
    Psychology,
    TrendingUp,
    Settings,
    Security,
    AISparkle,
    LocalOffer,
    Lock,
    Book,
} from '@shared/components/FAIcon';

interface HelpDialogProps {
    open: boolean;
    onClose: () => void;
}

interface TocItem {
    id: string;
    title: string;
    icon: React.ReactNode;
}

const tocItems: TocItem[] = [
    { id: 'overview', title: 'Executive Overview', icon: <Dashboard fontSize="small" /> },
    { id: 'products', title: 'Products & Tasks', icon: <BoxIconOutlined sx={{ color: '#10B981' }} fontSize="small" /> },
    { id: 'solutions', title: 'Solutions', icon: <LightbulbOutlined sx={{ color: '#3B82F6' }} fontSize="small" /> },
    { id: 'customers', title: 'Customers', icon: <People sx={{ color: '#8B5CF6' }} fontSize="small" /> },
    { id: 'adoption', title: 'Adoption Plans', icon: <TrendingUp fontSize="small" /> },
    { id: 'telemetry', title: 'Telemetry & Tracking', icon: <TrendingUp fontSize="small" /> },
    { id: 'tags', title: 'Tags', icon: <LocalOffer fontSize="small" /> },
    { id: 'locking', title: 'Task Locking', icon: <Lock fontSize="small" /> },
    { id: 'import-export', title: 'Import & Export', icon: <CloudUpload fontSize="small" /> },
    { id: 'ai-assistant', title: 'AI Assistant', icon: <AISparkle fontSize="small" /> },
    { id: 'roles', title: 'User Roles', icon: <People fontSize="small" /> },
];

export const HelpDialog: React.FC<HelpDialogProps> = ({ open, onClose }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [activeSection, setActiveSection] = React.useState('overview');
    const contentRef = React.useRef<HTMLDivElement>(null);

    const scrollToSection = (sectionId: string) => {
        setActiveSection(sectionId);
        const element = document.getElementById(`help-section-${sectionId}`);
        if (element && contentRef.current) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            fullScreen={isMobile}
            PaperProps={{
                sx: { height: isMobile ? '100%' : '90vh' }
            }}
        >
            <DialogTitle sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                bgcolor: 'primary.dark',
                color: 'white'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Dashboard />
                    <Typography variant="h6">Digital Adoption Platform - Help Guide</Typography>
                </Box>
                <IconButton onClick={onClose} sx={{ color: 'white' }}>
                    <Close />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{ p: 0, display: 'flex' }}>
                {/* Table of Contents - Left Sidebar */}
                {!isMobile && (
                    <Paper
                        elevation={0}
                        sx={{
                            width: 280,
                            borderRight: '1px solid',
                            borderColor: 'divider',
                            overflow: 'auto',
                            flexShrink: 0
                        }}
                    >
                        <Box sx={{ p: 2 }}>
                            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
                                TABLE OF CONTENTS
                            </Typography>
                            <List dense disablePadding>
                                {tocItems.map((item) => (
                                    <ListItem key={item.id} disablePadding>
                                        <ListItemButton
                                            selected={activeSection === item.id}
                                            onClick={() => scrollToSection(item.id)}
                                            sx={{ borderRadius: 1, mb: 0.5 }}
                                        >
                                            <Box sx={{ mr: 1.5, color: 'primary.main' }}>{item.icon}</Box>
                                            <ListItemText
                                                primary={item.title}
                                                primaryTypographyProps={{
                                                    fontSize: '0.875rem',
                                                    fontWeight: activeSection === item.id ? 600 : 400
                                                }}
                                            />
                                        </ListItemButton>
                                    </ListItem>
                                ))}
                            </List>
                        </Box>
                    </Paper>
                )}

                {/* Main Content */}
                <Box
                    ref={contentRef}
                    sx={{
                        flex: 1,
                        overflow: 'auto',
                        p: 3,
                        '& h2': { mt: 4, mb: 2, color: 'primary.main' },
                        '& h3': { mt: 3, mb: 1.5 },
                        '& p': { mb: 2, lineHeight: 1.7 },
                        '& ul': { mb: 2, pl: 3 },
                        '& li': { mb: 0.5 }
                    }}
                >
                    {/* Executive Overview */}
                    <Box id="help-section-overview">
                        <Typography variant="h4" gutterBottom sx={{ color: 'primary.dark', fontWeight: 600 }}>
                            Executive Overview
                        </Typography>
                        <Paper elevation={0} sx={{ p: 3, bgcolor: 'primary.50', borderRadius: 2, mb: 3, border: '1px solid', borderColor: 'primary.100' }}>
                            <Typography variant="body1" paragraph>
                                <strong>Digital Adoption Platform (DAP)</strong> is a Customer Success Platform designed to help organizations
                                track and accelerate customer adoption of products and solutions. It provides a structured approach
                                to measuring adoption progress through tasks, telemetry data, and configurable success criteria.
                            </Typography>
                            <Typography variant="body1">
                                DAP enables Customer Success teams to create comprehensive adoption journeys, assign them to customers,
                                and track progress through both manual updates and automated telemetry-based evaluations.
                            </Typography>
                        </Paper>

                        <Paper elevation={0} sx={{ p: 2, bgcolor: 'success.50', borderRadius: 2, mb: 3, border: '1px solid', borderColor: 'success.100' }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'success.900', mb: 1 }}>
                                <LightbulbOutlined sx={{ fontSize: 18, mr: 1, verticalAlign: 'text-bottom', color: '#3B82F6' }} />
                                Getting Started
                            </Typography>
                            <Typography variant="body2" color="success.900">
                                Start by defining your <strong>Products</strong> and their adoption <strong>Tasks</strong>.
                                Then, bundle them into <strong>Solutions</strong> if needed. Finally, go to the <strong>Customers</strong> section
                                to assign these to your customers and begin tracking their adoption journey!
                            </Typography>
                        </Paper>

                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>Get Started in 3 Steps</Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 2, mb: 3 }}>
                            {[
                                { icon: <BoxIconOutlined sx={{ color: '#10B981' }} />, title: '1. Model Your Portfolio', desc: 'Define your Products, adoption Tasks, and business Outcomes to create a standardized success framework.' },
                                { icon: <LightbulbOutlined sx={{ color: '#3B82F6' }} />, title: '2. Create Solutions', desc: 'Bundle multiple products into cohesive Solutions to track complex cross-product adoption journeys.' },
                                { icon: <People sx={{ color: '#8B5CF6' }} />, title: '3. Track Customers', desc: 'Assign plans to Customers, monitor their real-time health, and use AI to uncover deep adoption insights.' },
                            ].map((item, i) => (
                                <Paper key={i} elevation={0} sx={{ p: 2.5, border: '1px solid', borderColor: 'primary.100', bgcolor: 'primary.50', borderRadius: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1, color: 'primary.main' }}>
                                        {item.icon}
                                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{item.title}</Typography>
                                    </Box>
                                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>{item.desc}</Typography>
                                </Paper>
                            ))}
                        </Box>
                    </Box>

                    <Divider sx={{ my: 4 }} />

                    {/* Products & Tasks */}
                    <Box id="help-section-products">
                        <Typography variant="h4" gutterBottom sx={{ color: '#10B981', fontWeight: 600 }}>
                            <BoxIconOutlined sx={{ mr: 1, verticalAlign: 'middle', color: '#10B981' }} />
                            Products & Tasks
                        </Typography>

                        <Accordion defaultExpanded>
                            <AccordionSummary expandIcon={<ExpandMore />}>
                                <Typography variant="h6">What are Products?</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Typography paragraph>
                                    Products represent the software or services your customers adopt. Each product contains:
                                </Typography>
                                <ul>
                                    <li><strong>Basic Information</strong>: Name, description, and custom attributes</li>
                                    <li><strong>Tasks</strong>: Individual adoption steps customers should complete</li>
                                    <li><strong>Outcomes</strong>: Business outcomes the product helps achieve</li>
                                    <li><strong>Releases</strong>: Version milestones with adoption requirements</li>
                                    <li><strong>Licenses</strong>: Tier levels (Essential, Advantage, Signature)</li>
                                </ul>
                            </AccordionDetails>
                        </Accordion>

                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMore />}>
                                <Typography variant="h6">Managing Tasks</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Typography paragraph>
                                    Tasks are the building blocks of adoption. Each task includes:
                                </Typography>
                                <ul>
                                    <li><strong>Name & Description</strong>: Clear identification of the adoption step</li>
                                    <li><strong>Weight</strong>: Relative importance (0-100) for progress calculation</li>
                                    <li><strong>Sequence</strong>: Order in which tasks should be completed</li>
                                    <li><strong>License Level</strong>: Minimum license required for this task</li>
                                    <li><strong>Outcomes</strong>: Which business outcomes this task contributes to</li>
                                    <li><strong>Releases</strong>: Which product releases include this task</li>
                                    <li><strong>Documentation</strong>: Links to how-to docs and videos</li>
                                    <li><strong>Telemetry</strong>: Automated success criteria (see Telemetry section)</li>
                                </ul>
                                <Typography variant="subtitle2" sx={{ mt: 2, fontWeight: 600 }}>Actions:</Typography>
                                <ul>
                                    <li><strong>Add Task</strong>: Click "Add Task" button to create a new task</li>
                                    <li><strong>Edit Task</strong>: Click the edit icon or double-click a task row</li>
                                    <li><strong>Reorder Tasks</strong>: Drag tasks by the handle to change sequence</li>
                                    <li><strong>Delete Task</strong>: Click the delete icon (with confirmation)</li>
                                </ul>
                            </AccordionDetails>
                        </Accordion>
                    </Box>

                    <Divider sx={{ my: 4 }} />

                    {/* Solutions */}
                    <Box id="help-section-solutions">
                        <Typography variant="h4" gutterBottom sx={{ color: '#3B82F6', fontWeight: 600 }}>
                            <LightbulbOutlined sx={{ mr: 1, verticalAlign: 'middle', color: '#3B82F6' }} />
                            Solutions
                        </Typography>
                        <Typography paragraph>
                            Solutions are powerful bundles that combine multiple products into a single, cohesive adoption journey.
                            They allow you to track adoption across a suite of products (e.g., "Digital Transformation Suite" containing "Cloud Platform" and "Security Tool"),
                            providing a unified view of customer success.
                        </Typography>

                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMore />}>
                                <Typography variant="h6">Creating Solutions</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Typography paragraph>To create a solution:</Typography>
                                <ol>
                                    <li>Navigate to the <strong>Solutions</strong> section in the sidebar</li>
                                    <li>Click <strong>Add Solution</strong></li>
                                    <li>Enter the solution name and description</li>
                                    <li>Add products to the solution</li>
                                    <li>Configure solution-level outcomes and releases</li>
                                    <li>Optionally add solution-specific tasks</li>
                                </ol>
                            </AccordionDetails>
                        </Accordion>

                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMore />}>
                                <Typography variant="h6">Solution Task Ordering</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Typography paragraph>
                                    Solutions can have both their own tasks and tasks from included products.
                                    You can interleave tasks from different sources to create an optimized adoption sequence.
                                </Typography>
                            </AccordionDetails>
                        </Accordion>
                    </Box>

                    <Divider sx={{ my: 4 }} />

                    {/* Customers */}
                    <Box id="help-section-customers">
                        <Typography variant="h4" gutterBottom sx={{ color: '#8B5CF6', fontWeight: 600 }}>
                            <People sx={{ mr: 1, verticalAlign: 'middle', color: '#8B5CF6' }} />
                            Customers
                        </Typography>
                        <Typography paragraph>
                            The Customers section manages your customer accounts and their product/solution assignments.
                        </Typography>

                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMore />}>
                                <Typography variant="h6">Customer Management</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <ul>
                                    <li><strong>Add Customer</strong>: Create new customer records with name and description</li>
                                    <li><strong>Assign Products</strong>: Assign products to customers with specific license levels</li>
                                    <li><strong>Assign Solutions</strong>: Assign entire solutions to customers</li>
                                    <li><strong>View Progress</strong>: See adoption progress across all assignments</li>
                                </ul>
                            </AccordionDetails>
                        </Accordion>

                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMore />}>
                                <Typography variant="h6">Product Assignment Options</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Typography paragraph>When assigning a product to a customer, configure:</Typography>
                                <ul>
                                    <li><strong>Assignment Name</strong>: Identifier for this specific deployment (e.g., "Production", "Pilot")</li>
                                    <li><strong>License Level</strong>: Essential, Advantage, or Signature tier</li>
                                    <li><strong>Selected Outcomes</strong>: Which outcomes the customer is targeting</li>
                                    <li><strong>Selected Releases</strong>: Which releases are included in this deployment</li>
                                </ul>
                            </AccordionDetails>
                        </Accordion>
                    </Box>

                    <Divider sx={{ my: 4 }} />

                    {/* Adoption Plans */}
                    <Box id="help-section-adoption">
                        <Typography variant="h4" gutterBottom sx={{ color: 'primary.dark', fontWeight: 600 }}>
                            <TrendingUp sx={{ mr: 1, verticalAlign: 'middle' }} />
                            Adoption Plans
                        </Typography>
                        <Typography paragraph>
                            When a product or solution is assigned to a customer, an Adoption Plan is automatically created.
                            This plan copies the current state of the product's tasks and tracks the customer's progress independently.
                        </Typography>

                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMore />}>
                                <Typography variant="h6">Progress Tracking</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Typography paragraph>
                                    Adoption progress is calculated based on task weights:
                                </Typography>
                                <Typography component="div" sx={{ fontFamily: 'monospace', bgcolor: 'grey.100', p: 2, borderRadius: 1, mb: 2 }}>
                                    Progress % = (Sum of Completed Task Weights) / (Total Task Weight) × 100
                                </Typography>
                                <Typography paragraph>
                                    Tasks can be marked with the following statuses:
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                    <Chip label="Not Started" size="small" />
                                    <Chip label="In Progress" size="small" color="info" />
                                    <Chip label="Completed" size="small" color="success" />
                                    <Chip label="Not Applicable" size="small" variant="outlined" />
                                    <Chip label="No Longer Using" size="small" color="warning" />
                                </Box>
                            </AccordionDetails>
                        </Accordion>

                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMore />}>
                                <Typography variant="h6">Syncing with Product Changes</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Typography paragraph>
                                    When the source product is updated (e.g., you add a new "Advanced Configuration" task or reorder existing steps),
                                    you can <strong>Sync</strong> individual adoption plans to pull in these changes. The intelligent sync process:
                                </Typography>
                                <ul>
                                    <li><strong>Adds new tasks</strong>: Any task in the product that isn't in the plan is added.</li>
                                    <li><strong>Updates definitions</strong>: Task names, descriptions, weights, and documentation links are updated to match the latest standard.</li>
                                    <li><strong>Preserves progress</strong>: Crucially, the completion status, notes, and telemetry values for existing tasks are <em>preserved</em>. You won't lose your work!</li>
                                    <li><strong>Handles removals</strong>: Tasks removed from the product source are marked as "Deprecated" but kept in history.</li>
                                </ul>
                            </AccordionDetails>
                        </Accordion>
                    </Box>

                    <Divider sx={{ my: 4 }} />

                    {/* Telemetry */}
                    <Box id="help-section-telemetry">
                        <Typography variant="h4" gutterBottom sx={{ color: 'primary.dark', fontWeight: 600 }}>
                            <TrendingUp sx={{ mr: 1, verticalAlign: 'middle' }} />
                            Telemetry & Tracking
                        </Typography>
                        <Typography paragraph>
                            Telemetry enables <strong>automated task completion tracking</strong> by integrating data from customer systems.
                            Instead of manually checking if a customer has configured a feature, you can upload telemetry reports that automatically
                            mark tasks as "Completed" when specific success criteria are met.
                        </Typography>

                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMore />}>
                                <Typography variant="h6">Telemetry Attributes</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Typography paragraph>
                                    Each task can have multiple telemetry attributes. Configure:
                                </Typography>
                                <ul>
                                    <li><strong>Name</strong>: Identifier for the data point (e.g., "login_enabled")</li>
                                    <li><strong>Data Type</strong>: BOOLEAN, NUMBER, STRING, TIMESTAMP, or JSON</li>
                                    <li><strong>Success Criteria</strong>: Conditions for task completion</li>
                                    <li><strong>Required</strong>: Whether this attribute must be met for task completion</li>
                                </ul>
                            </AccordionDetails>
                        </Accordion>

                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMore />}>
                                <Typography variant="h6">Success Criteria Examples</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Typography variant="subtitle2" gutterBottom>Boolean:</Typography>
                                <Typography component="div" sx={{ fontFamily: 'monospace', bgcolor: 'grey.100', p: 1, borderRadius: 1, mb: 2 }}>
                                    {`{ "operator": "eq", "value": true }`}
                                </Typography>
                                <Typography variant="subtitle2" gutterBottom>Number (greater than or equal):</Typography>
                                <Typography component="div" sx={{ fontFamily: 'monospace', bgcolor: 'grey.100', p: 1, borderRadius: 1, mb: 2 }}>
                                    {`{ "operator": "gte", "value": 100 }`}
                                </Typography>
                                <Typography variant="subtitle2" gutterBottom>String (contains):</Typography>
                                <Typography component="div" sx={{ fontFamily: 'monospace', bgcolor: 'grey.100', p: 1, borderRadius: 1, mb: 2 }}>
                                    {`{ "operator": "contains", "value": "configured" }`}
                                </Typography>
                            </AccordionDetails>
                        </Accordion>
                    </Box>

                    <Divider sx={{ my: 4 }} />

                    {/* Tags Section */}
                    <Box id="help-section-tags">
                        <Typography variant="h4" gutterBottom sx={{ color: 'primary.dark', fontWeight: 600 }}>
                            <LocalOffer sx={{ mr: 1, verticalAlign: 'middle' }} />
                            Tags
                        </Typography>
                        <Typography paragraph>
                            Tags are a flexible way to categorize and filter tasks, products, and solutions across the platform.
                            They help you organize your adoption portfolio by technology, difficulty, or business unit.
                        </Typography>
                        <Accordion defaultExpanded>
                            <AccordionSummary expandIcon={<ExpandMore />}>
                                <Typography variant="h6">Using Tags</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <ul>
                                    <li><strong>Create Tags</strong>: Found in the "Tags" tab under Products or Solutions. Give them a name and a custom color.</li>
                                    <li><strong>Assign to Tasks</strong>: In the task editing dialog, you can pick one or more tags.</li>
                                    <li><strong>Filter by Tag</strong>: Use the Tag filter at the top of task lists to quickly focus on specific categories (e.g., "Security" or "AI").</li>
                                    <li><strong>AI Search</strong>: You can ask the AI Assistant things like "Show me security tasks" to leverage tag metadata seamlessly.</li>
                                </ul>
                            </AccordionDetails>
                        </Accordion>
                    </Box>

                    <Divider sx={{ my: 4 }} />

                    {/* Task Locking Section */}
                    <Box id="help-section-locking">
                        <Typography variant="h4" gutterBottom sx={{ color: 'primary.dark', fontWeight: 600 }}>
                            <Lock sx={{ mr: 1, verticalAlign: 'middle' }} />
                            Task Locking
                        </Typography>
                        <Typography paragraph>
                            To prevent accidental changes to adoption plans during critical phases, you can use the <strong>Task Locking</strong> feature.
                        </Typography>
                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMore />}>
                                <Typography variant="h6">Locking Capabilities</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Typography paragraph>
                                    When an adoption plan is locked:
                                </Typography>
                                <ul>
                                    <li><strong>Metadata is Read-Only</strong>: You cannot add, delete, or reorder tasks.</li>
                                    <li><strong>Sync is Disabled</strong>: Prevents pulling in changes from the source product unexpectedly.</li>
                                    <li><strong>Import/Export Restricted</strong>: Protects the integrity of the current plan state.</li>
                                    <li><strong>Progress remains editable</strong>: You can still update task statuses (Not Started → Completed) while the layout is locked.</li>
                                </ul>
                                <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary', fontStyle: 'italic' }}>
                                    Note: Task locking is easily toggled via the Lock icon in the panel toolbar.
                                </Typography>
                            </AccordionDetails>
                        </Accordion>
                    </Box>

                    <Divider sx={{ my: 4 }} />

                    {/* Import & Export */}
                    <Box id="help-section-import-export">
                        <Typography variant="h4" gutterBottom sx={{ color: 'primary.dark', fontWeight: 600 }}>
                            <CloudUpload sx={{ mr: 1, verticalAlign: 'middle' }} />
                            Import & Export
                        </Typography>

                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMore />}>
                                <Typography variant="h6">Exporting Products</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Typography paragraph>
                                    Export a product to Excel for backup, sharing, or bulk editing:
                                </Typography>
                                <ol>
                                    <li>Select a product from the Products dropdown</li>
                                    <li>Click the <CloudDownload sx={{ fontSize: 16, verticalAlign: 'middle' }} /> Export button</li>
                                    <li>The Excel file contains sheets for: Product Info, Tasks, Outcomes, Releases, Licenses, Custom Attributes, and Telemetry</li>
                                </ol>
                            </AccordionDetails>
                        </Accordion>

                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMore />}>
                                <Typography variant="h6">Importing Products</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Typography paragraph>
                                    Import products from Excel files:
                                </Typography>
                                <ul>
                                    <li><strong>Create New</strong>: Use a unique product name to create a new product</li>
                                    <li><strong>Update Existing</strong>: Use an existing product name to update it</li>
                                    <li>Follow the Instructions sheet in the export for field formats</li>
                                    <li>Import results show counts of created/updated entities</li>
                                </ul>
                            </AccordionDetails>
                        </Accordion>
                    </Box>

                    <Divider sx={{ my: 4 }} />

                    {/* AI Assistant */}
                    <Box id="help-section-ai-assistant">
                        <Typography variant="h4" gutterBottom sx={{ color: 'primary.dark', fontWeight: 600 }}>
                            <AISparkle sx={{ mr: 1, verticalAlign: 'middle' }} />
                            AI Assistant
                        </Typography>
                        <Typography paragraph>
                            The AI Assistant helps you quickly find information using natural language queries.
                        </Typography>

                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMore />}>
                                <Typography variant="h6">Using the AI Assistant</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Typography paragraph>
                                    Click the sparkle ✨ icon in the title bar to open the assistant.
                                </Typography>
                                <Typography variant="subtitle2" gutterBottom>Example queries:</Typography>
                                <ul>
                                    <li>"What products do we have?"</li>
                                    <li>"Show me customers with low adoption"</li>
                                    <li>"Which tasks are incomplete for [Customer Name]?"</li>
                                    <li>"What is the adoption progress for [Product Name]?"</li>
                                    <li>"Show me all tasks tagged with 'Security'"</li>
                                    <li>"List solutions with security outcomes"</li>
                                </ul>
                                <Typography paragraph sx={{ mt: 2 }}>
                                    Results include clickable links to navigate directly to the relevant Product, Solution, or Customer.
                                </Typography>
                            </AccordionDetails>
                        </Accordion>
                    </Box>

                    <Divider sx={{ my: 4 }} />

                    {/* User Roles */}
                    <Box id="help-section-roles">
                        <Typography variant="h4" gutterBottom sx={{ color: 'primary.dark', fontWeight: 600 }}>
                            <Security sx={{ mr: 1, verticalAlign: 'middle' }} />
                            User Roles
                        </Typography>

                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMore />}>
                                <Typography variant="h6">Role Descriptions</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', '& td, & th': { p: 1.5, border: '1px solid', borderColor: 'divider' } }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#f5f5f5' }}>
                                            <th>Role</th>
                                            <th>Permissions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td><strong>ADMIN</strong></td>
                                            <td>Full access to all features, user management, system settings</td>
                                        </tr>
                                        <tr>
                                            <td><strong>USER</strong></td>
                                            <td>Create/edit products, tasks, customers, manage adoption plans</td>
                                        </tr>
                                        <tr>
                                            <td><strong>SME</strong></td>
                                            <td>Subject Matter Expert - full product editing, limited customer access</td>
                                        </tr>
                                        <tr>
                                            <td><strong>CSS</strong></td>
                                            <td>Customer Success Specialist - full customer access, limited product editing</td>
                                        </tr>
                                        <tr>
                                            <td><strong>VIEWER</strong></td>
                                            <td>Read-only access - cannot make any changes</td>
                                        </tr>
                                    </tbody>
                                </Box>
                            </AccordionDetails>
                        </Accordion>
                    </Box>

                    {/* Footer */}
                    <Box sx={{ mt: 6, pt: 3, borderTop: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            Digital Adoption Platform v{import.meta.env.__APP_VERSION__ || '2.4.0'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Need more help? Contact your system administrator.
                        </Typography>
                    </Box>
                </Box>
            </DialogContent>
        </Dialog >
    );
};

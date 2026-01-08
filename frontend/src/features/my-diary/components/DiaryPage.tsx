import * as React from 'react';
import { useState, useRef } from 'react';
import {
    Box,
    Typography,
    Tabs,
    Tab,
    Paper,
    Container,
    IconButton,
    Tooltip,
} from '@mui/material';
import {
    PlaylistAddCheck as TodoIcon,
    BookmarkBorder as BookmarkIcon,
    Book as DiaryIcon,
    Add as AddIcon,
    Inventory as ProductIcon,
} from '@shared/components/FAIcon';
import { TodoTab, TodoTabRef } from './TodoTab';
import { BookmarkTab, BookmarkTabRef } from './BookmarkTab';
import { PersonalProductsTab, PersonalProductsTabRef } from './PersonalProductsTab';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function CustomTabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`diary-tabpanel-${index}`}
            aria-labelledby={`diary-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ py: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

export const DiaryPage: React.FC = () => {
    const [tabValue, setTabValue] = useState(0);
    const todoTabRef = useRef<TodoTabRef>(null);
    const bookmarkTabRef = useRef<BookmarkTabRef>(null);
    const productsTabRef = useRef<PersonalProductsTabRef>(null);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        bgcolor: 'rgba(236, 72, 153, 0.08)',
                        border: '1px solid rgba(236, 72, 153, 0.25)',
                    }}
                >
                    <DiaryIcon sx={{ fontSize: 28, color: '#EC4899' }} />
                </Box>
                <Box>
                    <Typography variant="h4" fontWeight={700} color="text.primary">
                        My Diary
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Your personal space for tasks, bookmarks, and sandbox products.
                    </Typography>
                </Box>
            </Box>

            <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.05)' }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2, bgcolor: 'background.paper', display: 'flex', alignItems: 'center' }}>
                    <Tabs
                        value={tabValue}
                        onChange={handleTabChange}
                        aria-label="diary tabs"
                        sx={{
                            flex: 1,
                            '& .MuiTab-root': {
                                minHeight: 64,
                                fontWeight: 600,
                                fontSize: '0.95rem',
                            }
                        }}
                    >
                        <Tab
                            icon={<TodoIcon sx={{ fontSize: 20 }} />}
                            iconPosition="start"
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    To-Do List
                                    <Tooltip title="Add Task">
                                        <Box
                                            component="span"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                todoTabRef.current?.triggerAdd();
                                            }}
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                width: 24,
                                                height: 24,
                                                borderRadius: '50%',
                                                color: '#10B981',
                                                '&:hover': { backgroundColor: 'rgba(16, 185, 129, 0.1)' }
                                            }}
                                        >
                                            <AddIcon fontSize="small" />
                                        </Box>
                                    </Tooltip>
                                </Box>
                            }
                            id="diary-tab-0"
                            aria-controls="diary-tabpanel-0"
                        />
                        <Tab
                            icon={<BookmarkIcon sx={{ fontSize: 20 }} />}
                            iconPosition="start"
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    Bookmarks
                                    <Tooltip title="Add Bookmark">
                                        <Box
                                            component="span"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                bookmarkTabRef.current?.triggerAdd();
                                            }}
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                width: 24,
                                                height: 24,
                                                borderRadius: '50%',
                                                color: '#10B981',
                                                '&:hover': { backgroundColor: 'rgba(16, 185, 129, 0.1)' }
                                            }}
                                        >
                                            <AddIcon fontSize="small" />
                                        </Box>
                                    </Tooltip>
                                </Box>
                            }
                            id="diary-tab-1"
                            aria-controls="diary-tabpanel-1"
                        />
                        <Tab
                            icon={<ProductIcon sx={{ fontSize: 20 }} />}
                            iconPosition="start"
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    My Products
                                    <Tooltip title="Add from Catalog">
                                        <Box
                                            component="span"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                productsTabRef.current?.triggerAdd();
                                            }}
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                width: 24,
                                                height: 24,
                                                borderRadius: '50%',
                                                color: '#10B981',
                                                '&:hover': { backgroundColor: 'rgba(16, 185, 129, 0.1)' }
                                            }}
                                        >
                                            <AddIcon fontSize="small" />
                                        </Box>
                                    </Tooltip>
                                </Box>
                            }
                            id="diary-tab-2"
                            aria-controls="diary-tabpanel-2"
                        />
                    </Tabs>
                </Box>

                <Box sx={{ px: { xs: 2, sm: 4 }, minHeight: 400 }}>
                    <CustomTabPanel value={tabValue} index={0}>
                        <TodoTab ref={todoTabRef} />
                    </CustomTabPanel>
                    <CustomTabPanel value={tabValue} index={1}>
                        <BookmarkTab ref={bookmarkTabRef} />
                    </CustomTabPanel>
                    <CustomTabPanel value={tabValue} index={2}>
                        <PersonalProductsTab ref={productsTabRef} />
                    </CustomTabPanel>
                </Box>
            </Paper>

            <Box sx={{ mt: 6, display: 'flex', justifyContent: 'center' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    Content in My Diary is personal and not visible to other users.
                </Typography>
            </Box>
        </Container>
    );
};

import * as React from 'react';
import { useState, useMemo } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    LinearProgress,
    Chip,
    Alert,
    CircularProgress,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    OutlinedInput,
    Checkbox,
    ListItemText,
    Tooltip
} from '@mui/material';
import { Assessment } from '@shared/components/FAIcon';
import { ColumnVisibilityToggle } from '@shared/components/ColumnVisibilityToggle';
import { AdoptionTaskTable, TaskData, ADOPTION_TASK_COLUMNS, DEFAULT_ADOPTION_VISIBLE_COLUMNS } from './AdoptionTaskTable';
import { AdoptionPlanProgressCard } from './AdoptionPlanProgressCard';
import { AdoptionPlanFilterSection } from './AdoptionPlanFilterSection';
import { useQuery } from '@apollo/client';
import {
    ADOPTION_PLAN,
} from '@features/customers';

const ALL_RELEASES_ID = '__ALL_RELEASES__';
const ALL_OUTCOMES_ID = '__ALL_OUTCOMES__';
const ALL_TAGS_ID = '__ALL_TAGS__';

interface ProductAdoptionPlanViewProps {
    adoptionPlanId: string;
    onUpdateTaskStatus?: (taskId: string, newStatus: string, notes?: string) => void;
}

export const ProductAdoptionPlanView: React.FC<ProductAdoptionPlanViewProps> = ({
    adoptionPlanId,
    onUpdateTaskStatus,
}) => {
    const [filterReleases, setFilterReleases] = useState<string[]>([]);
    const [filterOutcomes, setFilterOutcomes] = useState<string[]>([]);
    const [filterTags, setFilterTags] = useState<string[]>([]);

    // Column visibility state with localStorage persistence
    const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
        const saved = localStorage.getItem('dap_product_adoption_columns');
        return saved ? JSON.parse(saved) : DEFAULT_ADOPTION_VISIBLE_COLUMNS;
    });

    // Persist column visibility to localStorage
    React.useEffect(() => {
        localStorage.setItem('dap_product_adoption_columns', JSON.stringify(visibleColumns));
    }, [visibleColumns]);

    // Handle column toggle
    const handleToggleColumn = (columnKey: string) => {
        setVisibleColumns(prev =>
            prev.includes(columnKey)
                ? prev.filter(k => k !== columnKey)
                : [...prev, columnKey]
        );
    };

    const { data, loading, error, refetch } = useQuery(ADOPTION_PLAN, {
        variables: { id: adoptionPlanId },
        skip: !adoptionPlanId,
        fetchPolicy: 'cache-and-network',
    });

    const plan = data?.adoptionPlan;

    // Extract available filter options from metadata or tasks
    const availableTags = useMemo(() => plan?.customerProduct?.tags || [], [plan]);
    const availableOutcomes = useMemo(() => plan?.selectedOutcomes || [], [plan]);
    const availableReleases = useMemo(() => plan?.selectedReleases || [], [plan]);

    // Apply UI filters to tasks
    const filteredTasks = useMemo(() => {
        if (!plan?.tasks) return [];
        let tasks = [...plan.tasks];

        // Filter by releases
        if (filterReleases.length > 0 && !filterReleases.includes(ALL_RELEASES_ID)) {
            tasks = tasks.filter((task: any) => {
                const taskReleaseIds = task.releases?.map((r: any) => r.id) || [];
                return taskReleaseIds.some((id: string) => filterReleases.includes(id));
            });
        }

        // Filter by outcomes
        if (filterOutcomes.length > 0 && !filterOutcomes.includes(ALL_OUTCOMES_ID)) {
            tasks = tasks.filter((task: any) => {
                const taskOutcomeIds = task.outcomes?.map((o: any) => o.id) || [];
                return taskOutcomeIds.some((id: string) => filterOutcomes.includes(id));
            });
        }

        // Filter by tags
        if (filterTags.length > 0 && !filterTags.includes(ALL_TAGS_ID)) {
            tasks = tasks.filter((task: any) => {
                const taskTagIds = task.tags?.map((t: any) => t.id) || [];
                return taskTagIds.some((id: string) => filterTags.includes(id));
            });
        }

        return tasks.sort((a: any, b: any) => (a.sequenceNumber || 0) - (b.sequenceNumber || 0));
    }, [plan?.tasks, filterReleases, filterOutcomes, filterTags]);

    // Calculate filtered progress
    const filteredProgress = useMemo(() => {
        const tasks = filteredTasks || [];
        const applicable = tasks.filter((t: any) => t.status !== 'NOT_APPLICABLE');
        const total = applicable.length;
        const completed = applicable.filter((t: any) => t.status === 'DONE' || t.status === 'COMPLETED').length;

        const totalWeight = applicable.reduce((sum: number, t: any) => sum + (Number(t.weight) || 0), 0);
        const completedWeight = applicable
            .filter((t: any) => t.status === 'DONE' || t.status === 'COMPLETED')
            .reduce((sum: number, t: any) => sum + (Number(t.weight) || 0), 0);

        return {
            totalTasks: total,
            completedTasks: completed,
            percentage: totalWeight > 0 ? (completedWeight / totalWeight) * 100 : (total > 0 ? (completed / total) * 100 : 0)
        };
    }, [filteredTasks]);

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
    if (error) return <Alert severity="error">{error.message}</Alert>;
    if (!plan) return null;

    // Map to AdoptionTaskTable format
    const taskData: TaskData[] = filteredTasks.map(t => ({
        id: t.id,
        name: t.name,
        description: t.description,
        notes: t.notes,
        status: t.status,
        sequenceNumber: t.sequenceNumber,
        weight: t.weight,
        licenseLevel: t.licenseLevel,
        statusUpdatedAt: t.statusUpdatedAt,
        statusUpdatedBy: t.statusUpdatedBy,
        statusUpdateSource: t.statusUpdateSource,
        statusNotes: t.statusNotes,
        howToDoc: t.howToDoc,
        howToVideo: t.howToVideo,
        releases: t.releases,
        outcomes: t.outcomes,
        telemetryAttributes: t.telemetryAttributes,
        tags: t.tags,
    }));

    return (
        <Box>
            <AdoptionPlanProgressCard
                licenseLevel={plan.licenseLevel}
                completedTasks={filteredProgress.completedTasks}
                totalTasks={filteredProgress.totalTasks}
                percentage={filteredProgress.percentage}
            />

            <AdoptionPlanFilterSection
                filterTags={filterTags}
                setFilterTags={setFilterTags}
                availableTags={availableTags}
                filterOutcomes={filterOutcomes}
                setFilterOutcomes={setFilterOutcomes}
                availableOutcomes={availableOutcomes}
                filterReleases={filterReleases}
                setFilterReleases={setFilterReleases}
                availableReleases={availableReleases}
                visibleColumns={visibleColumns}
                onToggleColumn={handleToggleColumn}
                columns={ADOPTION_TASK_COLUMNS}
                totalFilteredTasks={filteredTasks.length}
                totalTasks={plan.tasks.length}
            />

            {/* Task Table */}
            <AdoptionTaskTable
                tasks={taskData}
                onUpdateTaskStatus={onUpdateTaskStatus}
                showHeader={false}
                visibleColumns={visibleColumns}
            />
        </Box>
    );
};

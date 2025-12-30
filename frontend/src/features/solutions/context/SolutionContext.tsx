import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useQuery, useMutation, useApolloClient } from '@apollo/client';
import { SOLUTIONS, SOLUTION, DELETE_SOLUTION, UPDATE_SOLUTION } from '../graphql';
import { TASKS_FOR_SOLUTION } from '@features/tasks';
import { Solution } from '../types';
import { DEFAULT_VISIBLE_COLUMNS } from '@shared/components/ColumnVisibilityToggle';

// Define the context shape
interface SolutionContextType {
    // Selection & Data
    selectedSolutionId: string | null;
    setSelectedSolutionId: (id: string | null) => void;
    solutions: Solution[];
    loadingSolutions: boolean;
    selectedSolution: Solution | null;
    loadingSelectedSolution: boolean;
    refetchSolutions: () => Promise<any>;
    refetchSelectedSolution: () => Promise<any>;

    // Tasks (Solution context often deals with tasks associated with the solution)
    tasks: any[];
    loadingTasks: boolean;
    refetchTasks: () => Promise<any>;

    // Task Filters
    taskTagFilter: string[];
    setTaskTagFilter: (tags: string[]) => void;
    taskOutcomeFilter: string[];
    setTaskOutcomeFilter: (outcomes: string[]) => void;
    taskReleaseFilter: string[];
    setTaskReleaseFilter: (releases: string[]) => void;
    taskLicenseFilter: string[];
    setTaskLicenseFilter: (licenses: string[]) => void;
    showFilters: boolean;
    setShowFilters: (show: boolean) => void;
    handleClearFilters: () => void;
    filteredTasks: any[];

    // UI State
    visibleColumns: string[];
    handleToggleColumn: (columnKey: string) => void;
    selectedSubSection: 'summary' | 'resources' | 'tasks' | 'outcomes' | 'releases' | 'licenses' | 'customAttributes' | 'tags';
    setSelectedSubSection: (section: any) => void;

    // External Add Mode (for tables)
    externalAddMode: string | null;
    setExternalAddMode: (mode: string | null) => void;

    // Global Messages
    successMessage: string | null;
    errorMessage: string | null;
    setSuccessMessage: (msg: string | null) => void;
    setErrorMessage: (msg: string | null) => void;

    // Mutations (wrappers)
    deleteSolution: (id: string) => Promise<void>;
    updateSolution: (id: string, input: any) => Promise<void>;
}

const SolutionContext = createContext<SolutionContextType | undefined>(undefined);

export const useSolutionContext = () => {
    const context = useContext(SolutionContext);
    if (!context) {
        throw new Error('useSolutionContext must be used within a SolutionProvider');
    }
    return context;
};

interface SolutionProviderProps {
    children: ReactNode;
    initialSelectedId?: string | null;
}

export const SolutionProvider: React.FC<SolutionProviderProps> = ({ children, initialSelectedId }) => {
    // --- State ---
    const [selectedSolutionId, _setSelectedSolutionId] = useState<string | null>(() => {
        return initialSelectedId || localStorage.getItem('lastSelectedSolutionId') || null;
    });

    const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
        const saved = localStorage.getItem('dap_solution_task_columns');
        return saved ? JSON.parse(saved) : DEFAULT_VISIBLE_COLUMNS;
    });

    const [selectedSubSection, setSelectedSubSection] = useState<'summary' | 'resources' | 'tasks' | 'outcomes' | 'releases' | 'licenses' | 'customAttributes' | 'tags'>('summary');
    const [externalAddMode, setExternalAddMode] = useState<string | null>(null);

    const [taskTagFilter, setTaskTagFilter] = useState<string[]>([]);
    const [taskOutcomeFilter, setTaskOutcomeFilter] = useState<string[]>([]);
    const [taskReleaseFilter, setTaskReleaseFilter] = useState<string[]>([]);
    const [taskLicenseFilter, setTaskLicenseFilter] = useState<string[]>([]);
    const [showFilters, setShowFilters] = useState(false);

    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const client = useApolloClient();

    // --- Persist Selection ---
    const setSelectedSolutionId = useCallback((id: string | null) => {
        _setSelectedSolutionId(id);
        if (id) {
            localStorage.setItem('lastSelectedSolutionId', id);
        } else {
            localStorage.removeItem('lastSelectedSolutionId');
        }
    }, []);

    // --- Persist Columns ---
    useEffect(() => {
        localStorage.setItem('dap_solution_task_columns', JSON.stringify(visibleColumns));
    }, [visibleColumns]);

    const handleToggleColumn = useCallback((columnKey: string) => {
        setVisibleColumns(prev =>
            prev.includes(columnKey)
                ? prev.filter(k => k !== columnKey)
                : [...prev, columnKey]
        );
    }, []);

    // --- Queries ---
    const {
        data: solutionsData,
        loading: loadingSolutions,
        refetch: refetchSolutions
    } = useQuery(SOLUTIONS, {
        fetchPolicy: 'cache-and-network'
    });

    const solutions = solutionsData?.solutions?.edges?.map((e: any) => e.node) || [];

    // Fallback selection logic
    useEffect(() => {
        if (!loadingSolutions && solutions.length > 0) {
            const isValidSelection = selectedSolutionId && solutions.some((p: any) => p.id === selectedSolutionId);

            if (!isValidSelection) {
                // Default fallback (can be customized)
                const targetId = solutions[0].id;

                if (targetId && targetId !== selectedSolutionId) {
                    setSelectedSolutionId(targetId);
                }
            }
        }
    }, [solutions, loadingSolutions, selectedSolutionId, setSelectedSolutionId]);

    // Single Solution Detail
    const {
        data: solutionData,
        loading: loadingSelectedSolution,
        refetch: refetchSelectedSolution
    } = useQuery(SOLUTION, {
        variables: { id: selectedSolutionId },
        skip: !selectedSolutionId,
        fetchPolicy: 'cache-and-network'
    });

    const fetchedSolution = solutionData?.solution;
    const listSolution = solutions.find((s: any) => s.id === selectedSolutionId);
    // Prefer detailed data, fallback to list data
    const selectedSolution = (fetchedSolution?.id === selectedSolutionId) ? fetchedSolution : listSolution;

    // Tasks for Solution
    // Note: Use TASKS_FOR_SOLUTION if available, or fetch relevant tasks
    const {
        data: tasksData,
        loading: loadingTasks,
        refetch: refetchTasks
    } = useQuery(TASKS_FOR_SOLUTION, {
        variables: { solutionId: selectedSolutionId },
        skip: !selectedSolutionId
    });

    const tasks = tasksData?.tasks?.edges?.map((e: any) => e.node) || [];

    // Refetch tasks when switching to tasks tab
    useEffect(() => {
        if (selectedSubSection === 'tasks' && selectedSolutionId) {
            refetchTasks();
        }
    }, [selectedSubSection, selectedSolutionId, refetchTasks]);


    // --- Filtering Logic (Mirrors Products) ---
    const filteredTasks = tasks.filter((task: any) => {
        // Tag filter (OR within tags)
        if (taskTagFilter.length > 0) {
            if (!task.tags?.some((t: any) => taskTagFilter.includes(t.id))) {
                return false;
            }
        }
        // Outcome filter (OR within outcomes)
        if (taskOutcomeFilter.length > 0) {
            const hasSpecificOutcomes = task.outcomes && task.outcomes.length > 0;

            // Special case: "__ALL_OUTCOMES__" means show ONLY tasks with no specific outcomes
            if (taskOutcomeFilter.includes('__ALL_OUTCOMES__')) {
                if (hasSpecificOutcomes) {
                    return false; // Exclude tasks that have specific outcomes
                }
                // Keep tasks with no specific outcomes
            } else if (hasSpecificOutcomes) {
                // Normal filtering: check if task has any of the selected outcomes
                if (!task.outcomes.some((o: any) => taskOutcomeFilter.includes(o.id))) {
                    return false;
                }
            }
        }
        // Release filter (OR within releases)
        if (taskReleaseFilter.length > 0) {
            const hasSpecificReleases = task.releases && task.releases.length > 0;
            if (hasSpecificReleases) {
                if (!task.releases.some((r: any) => taskReleaseFilter.includes(r.id))) {
                    return false;
                }
            }
        }
        // License filter (hierarchical - higher level includes lower levels)
        if (taskLicenseFilter.length > 0) {
            if (!task.license) {
                return false;
            }
            // Get the maximum level from selected licenses (higher level = includes more)
            // Note: Use selectedSolution licenses if available
            const selectedLicenses = selectedSolution?.licenses?.filter((l: any) => taskLicenseFilter.includes(l.id)) || [];
            const maxSelectedLevel = Math.max(...selectedLicenses.map((l: any) => l.level || 0));
            // Task's license level must be <= max selected level
            if ((task.license.level || 0) > maxSelectedLevel) {
                return false;
            }
        }
        return true;
    });

    const handleClearFilters = useCallback(() => {
        setTaskTagFilter([]);
        setTaskOutcomeFilter([]);
        setTaskReleaseFilter([]);
        setTaskLicenseFilter([]);
    }, []);

    // --- Mutation Wrappers ---
    const deleteSolution = async (id: string) => {
        try {
            await client.mutate({
                mutation: DELETE_SOLUTION,
                variables: { id },
                refetchQueries: ['Solutions'],
                awaitRefetchQueries: true
            });
            setSelectedSolutionId(null);
            setSuccessMessage('Solution deleted successfully');
        } catch (error: any) {
            console.error('Error deleting solution:', error);
            setErrorMessage('Failed to delete solution: ' + error.message);
            throw error;
        }
    };

    const updateSolution = async (id: string, input: any) => {
        try {
            await client.mutate({
                mutation: UPDATE_SOLUTION,
                variables: { id, input },
                refetchQueries: ['Solutions', 'SolutionDetail'],
                awaitRefetchQueries: true
            });
            await refetchSolutions();
            if (id === selectedSolutionId) {
                await refetchSelectedSolution();
            }
        } catch (error: any) {
            console.error('Error updating solution:', error);
            setErrorMessage('Failed to update solution: ' + error.message);
            throw error;
        }
    };

    const value: SolutionContextType = {
        selectedSolutionId,
        setSelectedSolutionId,
        solutions,
        loadingSolutions,
        selectedSolution,
        loadingSelectedSolution,
        refetchSolutions,
        refetchSelectedSolution,

        tasks,
        loadingTasks,
        refetchTasks,

        taskTagFilter,
        setTaskTagFilter,
        taskOutcomeFilter,
        setTaskOutcomeFilter,
        taskReleaseFilter,
        setTaskReleaseFilter,
        taskLicenseFilter,
        setTaskLicenseFilter,
        showFilters,
        setShowFilters,
        handleClearFilters,
        filteredTasks,

        visibleColumns,
        handleToggleColumn,
        selectedSubSection,
        setSelectedSubSection,
        externalAddMode,
        setExternalAddMode,

        successMessage,
        errorMessage,
        setSuccessMessage,
        setErrorMessage,

        deleteSolution,
        updateSolution
    };

    return (
        <SolutionContext.Provider value={value}>
            {children}
        </SolutionContext.Provider>
    );
};

import { useState, useCallback } from 'react';

export function useSolutionDialogs() {
    // Dialog States
    const [isImportDialogOpen, setImportDialogOpen] = useState(false);

    // Solution Dialog
    const [isSolutionDialogOpen, setSolutionDialogOpen] = useState(false);
    const [editingSolution, setEditingSolution] = useState<any>(null);

    // Task Dialog
    const [isTaskDialogOpen, setTaskDialogOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<any>(null);

    // Sub-Entity Dialogs
    const [isTagDialogOpen, setTagDialogOpen] = useState(false);
    const [editingTag, setEditingTag] = useState<any>(null);

    const [isOutcomeDialogOpen, setOutcomeDialogOpen] = useState(false);
    const [editingOutcome, setEditingOutcome] = useState<any>(null);

    const [isReleaseDialogOpen, setReleaseDialogOpen] = useState(false);
    const [editingRelease, setEditingRelease] = useState<any>(null);

    const [isLicenseDialogOpen, setLicenseDialogOpen] = useState(false);
    const [editingLicense, setEditingLicense] = useState<any>(null);

    // --- Actions ---

    // Solution
    const openAddSolution = useCallback(() => {
        setEditingSolution(null);
        setSolutionDialogOpen(true);
    }, []);

    const openEditSolution = useCallback((solution: any) => {
        setEditingSolution(solution);
        setSolutionDialogOpen(true);
    }, []);

    const closeSolutionDialog = useCallback(() => {
        setSolutionDialogOpen(false);
        setEditingSolution(null);
    }, []);

    // Task
    const openAddTask = useCallback(() => {
        setEditingTask(null);
        setTaskDialogOpen(true);
    }, []);

    const openEditTask = useCallback((task: any) => {
        setEditingTask(task);
        setTaskDialogOpen(true);
    }, []);

    const closeTaskDialog = useCallback(() => {
        setTaskDialogOpen(false);
        setEditingTask(null);
    }, []);

    // Tag
    const openAddTag = useCallback(() => {
        setEditingTag(null);
        setTagDialogOpen(true);
    }, []);

    const openEditTag = useCallback((tag: any) => {
        setEditingTag(tag);
        setTagDialogOpen(true);
    }, []);

    const closeTagDialog = useCallback(() => {
        setTagDialogOpen(false);
        setEditingTag(null);
    }, []);

    // Outcome
    const openAddOutcome = useCallback(() => {
        setEditingOutcome(null);
        setOutcomeDialogOpen(true);
    }, []);

    const openEditOutcome = useCallback((outcome: any) => {
        setEditingOutcome(outcome);
        setOutcomeDialogOpen(true);
    }, []);

    const closeOutcomeDialog = useCallback(() => {
        setOutcomeDialogOpen(false);
        setEditingOutcome(null);
    }, []);

    // Release
    const openAddRelease = useCallback(() => {
        setEditingRelease(null);
        setReleaseDialogOpen(true);
    }, []);

    const openEditRelease = useCallback((release: any) => {
        setEditingRelease(release);
        setReleaseDialogOpen(true);
    }, []);

    const closeReleaseDialog = useCallback(() => {
        setReleaseDialogOpen(false);
        setEditingRelease(null);
    }, []);

    // License
    const openAddLicense = useCallback(() => {
        setEditingLicense(null);
        setLicenseDialogOpen(true);
    }, []);

    const openEditLicense = useCallback((license: any) => {
        setEditingLicense(license);
        setLicenseDialogOpen(true);
    }, []);

    const closeLicenseDialog = useCallback(() => {
        setLicenseDialogOpen(false);
        setEditingLicense(null);
    }, []);

    return {
        // Import
        isImportDialogOpen,
        setImportDialogOpen,

        // Solution
        isSolutionDialogOpen,
        editingSolution,
        openAddSolution,
        openEditSolution,
        closeSolutionDialog,

        // Task
        isTaskDialogOpen,
        editingTask,
        openAddTask,
        openEditTask,
        closeTaskDialog,

        // Tag
        isTagDialogOpen,
        editingTag,
        openAddTag,
        openEditTag,
        closeTagDialog,

        // Outcome
        isOutcomeDialogOpen,
        editingOutcome,
        openAddOutcome,
        openEditOutcome,
        closeOutcomeDialog,

        // Release
        isReleaseDialogOpen,
        editingRelease,
        openAddRelease,
        openEditRelease,
        closeReleaseDialog,

        // License
        isLicenseDialogOpen,
        editingLicense,
        openAddLicense,
        openEditLicense,
        closeLicenseDialog
    };
}

import { useState, useCallback } from 'react';

export function useProductDialogs() {
    // Dialog States
    const [isImportDialogOpen, setImportDialogOpen] = useState(false);

    // Product Dialog
    const [isProductDialogOpen, setProductDialogOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any>(null);

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

    // Product
    const openAddProduct = useCallback(() => {
        setEditingProduct(null);
        setProductDialogOpen(true);
    }, []);

    const openEditProduct = useCallback((product: any) => {
        setEditingProduct(product);
        setProductDialogOpen(true);
    }, []);

    const closeProductDialog = useCallback(() => {
        setProductDialogOpen(false);
        setEditingProduct(null);
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

        // Product
        isProductDialogOpen,
        editingProduct,
        openAddProduct,
        openEditProduct,
        closeProductDialog,

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

import { useMutation } from '@apollo/client';
import {
    CREATE_CUSTOMER,
    UPDATE_CUSTOMER,
    DELETE_CUSTOMER,
    UPDATE_CUSTOMER_PRODUCT,
    REMOVE_PRODUCT_FROM_CUSTOMER,
    REMOVE_SOLUTION_FROM_CUSTOMER,
    ASSIGN_SOLUTION_TO_CUSTOMER,
    CREATE_SOLUTION_ADOPTION_PLAN,
    SYNC_ADOPTION_PLAN,
    SYNC_SOLUTION_ADOPTION_PLAN,
    UPDATE_TASK_STATUS,
    EXPORT_TELEMETRY_TEMPLATE,
    IMPORT_TELEMETRY,
    UPDATE_FILTER_PREFERENCE
} from '../graphql/mutations';
import {
    CUSTOMERS
} from '../graphql/queries';

export function useCustomerMutations() {
    const [createCustomer, { loading: creatingCustomer }] = useMutation(CREATE_CUSTOMER, {
        refetchQueries: [{ query: CUSTOMERS }]
    });

    const [updateCustomer, { loading: updatingCustomer }] = useMutation(UPDATE_CUSTOMER, {
        refetchQueries: [{ query: CUSTOMERS }]
    });

    const [deleteCustomer, { loading: deletingCustomer }] = useMutation(DELETE_CUSTOMER, {
        refetchQueries: [{ query: CUSTOMERS }]
    });

    const [updateCustomerProduct, { loading: updatingProduct }] = useMutation(UPDATE_CUSTOMER_PRODUCT, {
        refetchQueries: [{ query: CUSTOMERS }]
    });

    const [removeProductFromCustomer, { loading: removingProduct }] = useMutation(REMOVE_PRODUCT_FROM_CUSTOMER, {
        refetchQueries: [{ query: CUSTOMERS }]
    });

    const [removeSolutionFromCustomer, { loading: removingSolution }] = useMutation(REMOVE_SOLUTION_FROM_CUSTOMER, {
        refetchQueries: [{ query: CUSTOMERS }]
    });

    const [assignSolutionToCustomer, { loading: assigningSolution }] = useMutation(ASSIGN_SOLUTION_TO_CUSTOMER, {
        refetchQueries: [{ query: CUSTOMERS }]
    });

    const [createSolutionAdoptionPlan, { loading: creatingSolutionPlan }] = useMutation(CREATE_SOLUTION_ADOPTION_PLAN);

    const [syncAdoptionPlan, { loading: syncingPlan }] = useMutation(SYNC_ADOPTION_PLAN, {
        refetchQueries: [{ query: CUSTOMERS }],
        awaitRefetchQueries: true
    });
    const [syncSolutionAdoptionPlan, { loading: syncingSolutionPlan }] = useMutation(SYNC_SOLUTION_ADOPTION_PLAN, {
        refetchQueries: [{ query: CUSTOMERS }],
        awaitRefetchQueries: true
    });

    const [updateTaskStatus] = useMutation(UPDATE_TASK_STATUS, {
        refetchQueries: [{ query: CUSTOMERS }],
        awaitRefetchQueries: true
    });
    const [exportTelemetryTemplate] = useMutation(EXPORT_TELEMETRY_TEMPLATE);
    const [importTelemetry] = useMutation(IMPORT_TELEMETRY);
    const [updateFilterPreference] = useMutation(UPDATE_FILTER_PREFERENCE);

    return {
        createCustomer,
        creatingCustomer,
        updateCustomer,
        updatingCustomer,
        deleteCustomer,
        deletingCustomer,
        updateCustomerProduct,
        updatingProduct,
        removeProductFromCustomer,
        removingProduct,
        removeSolutionFromCustomer,
        removingSolution,
        assignSolutionToCustomer,
        assigningSolution,
        createSolutionAdoptionPlan,
        creatingSolutionPlan,
        syncAdoptionPlan,
        syncingPlan,
        syncSolutionAdoptionPlan,
        syncingSolutionPlan,
        updateTaskStatus,
        exportTelemetryTemplate,
        importTelemetry,
        updateFilterPreference
    };
}

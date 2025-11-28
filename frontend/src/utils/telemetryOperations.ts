/**
 * Shared telemetry export/import operations for products and solutions
 */

// Get the base path for API calls (supports subpath deployment like /dap/)
const getBasePath = (): string => {
  const basePath = import.meta.env.BASE_URL || '/';
  return basePath === '/' ? '' : basePath.replace(/\/$/, '');
};

/**
 * Export telemetry template for a product adoption plan
 */
export const exportProductTelemetryTemplate = async (adoptionPlanId: string): Promise<void> => {
  const basePath = getBasePath();
  const url = `${basePath}/api/telemetry/export/${adoptionPlanId}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': 'admin',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Export failed: ${response.statusText}`);
  }
  
  // Download the file
  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `telemetry-template-${adoptionPlanId}.xlsx`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(downloadUrl);
  document.body.removeChild(a);
};

/**
 * Import telemetry data for a product adoption plan
 */
export const importProductTelemetry = async (
  adoptionPlanId: string, 
  file: File
): Promise<{ success: boolean; summary?: any; taskResults?: any[]; error?: string }> => {
  const basePath = getBasePath();
  const url = `${basePath}/api/telemetry/import/${adoptionPlanId}`;
  
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'admin',
    },
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error(`Import failed: ${response.statusText}`);
  }
  
  return await response.json();
};

/**
 * Export telemetry template for a solution adoption plan
 */
export const exportSolutionTelemetryTemplate = async (solutionAdoptionPlanId: string): Promise<void> => {
  const basePath = getBasePath();
  const url = `${basePath}/api/solution-telemetry/export/${solutionAdoptionPlanId}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': 'admin',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Export failed: ${response.statusText}`);
  }
  
  // Download the file
  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `solution-telemetry-template-${solutionAdoptionPlanId}.xlsx`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(downloadUrl);
  document.body.removeChild(a);
};

/**
 * Import telemetry data for a solution adoption plan
 */
export const importSolutionTelemetry = async (
  solutionAdoptionPlanId: string, 
  file: File
): Promise<{ success: boolean; summary?: any; taskResults?: any[]; error?: string }> => {
  const basePath = getBasePath();
  const url = `${basePath}/api/solution-telemetry/import/${solutionAdoptionPlanId}`;
  
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'admin',
    },
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error(`Import failed: ${response.statusText}`);
  }
  
  return await response.json();
};


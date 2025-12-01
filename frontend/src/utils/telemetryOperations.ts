/**
 * Shared telemetry export/import operations for products and solutions
 */

// Get the base path for API calls (supports subpath deployment like /dap/)
export const getBasePath = (): string => {
  const basePath = import.meta.env.BASE_URL || '/';
  return basePath === '/' ? '' : basePath.replace(/\/$/, '');
};

/**
 * Download a file from a URL (used after GraphQL export mutation returns URL)
 */
export const downloadFileFromUrl = async (url: string, filename: string): Promise<void> => {
  const basePath = getBasePath();
  const fileUrl = basePath === '' ? url : `${basePath}${url}`;
  
  console.log('Downloading file from:', fileUrl);
  
  const response = await fetch(fileUrl, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
  }

  // Get as arrayBuffer to ensure binary data is preserved
  const arrayBuffer = await response.arrayBuffer();
  
  // Check first few bytes to verify it's a valid Excel file (should start with PK)
  const firstBytes = new Uint8Array(arrayBuffer.slice(0, 4));
  const header = Array.from(firstBytes).map(b => b.toString(16).padStart(2, '0')).join('');
  
  if (header !== '504b0304' && header !== '504b0506') {
    console.error('Invalid Excel file header! Expected PK signature, got:', header);
    throw new Error('Downloaded file is not a valid Excel file');
  }

  const blob = new Blob([arrayBuffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename || 'telemetry_template.xlsx';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => {
    window.URL.revokeObjectURL(downloadUrl);
  }, 100);
};

/**
 * Import telemetry data for a product adoption plan (REST API)
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
 * Import telemetry data for a solution adoption plan (REST API)
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

/**
 * Import result dialog state interface
 */
export interface ImportResultDialogState {
  open: boolean;
  success: boolean;
  summary?: {
    tasksProcessed: number;
    attributesUpdated: number;
    criteriaEvaluated: number;
    errors?: string[];
  };
  taskResults?: Array<{
    taskName: string;
    criteriaMet: number;
    criteriaTotal: number;
    completionPercentage: number;
  }>;
  errorMessage?: string;
}


export interface ProductSummary {
  id: string;
  name: string;
}

export type ResolveImportAbortReason = 'missing-name';

export type ResolveImportResult =
  | { status: 'use-existing'; product: ProductSummary }
  | { status: 'create-new'; name: string }
  | { status: 'abort'; reason: ResolveImportAbortReason };

interface ResolveImportParams {
  selectedProduct: ProductSummary | null;
  importedName: string;
  existingProducts: ProductSummary[];
}

const normalize = (value: string) => value.trim().toLowerCase();

export function resolveImportTarget({
  selectedProduct,
  importedName,
  existingProducts
}: ResolveImportParams): ResolveImportResult {
  const normalizedImported = normalize(importedName || '');
  
  // Excel name is the source of truth - ignore selected product
  if (!normalizedImported) {
    return { status: 'abort', reason: 'missing-name' };
  }

  const existingByName = existingProducts.find((p) => normalize(p.name) === normalizedImported);
  
  if (existingByName) {
    return { status: 'use-existing', product: existingByName };
  }

  return { status: 'create-new', name: importedName.trim() };
}

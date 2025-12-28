import { resolveImportTarget } from '../utils/excelImportTarget';

describe('resolveImportTarget', () => {
  const products = [
    { id: 'p-1', name: 'Alpha' },
    { id: 'p-2', name: 'Beta' }
  ];

  it('aborts when imported name is empty', () => {
    const result = resolveImportTarget({
      selectedProduct: { id: 'p-1', name: 'Alpha' },
      importedName: '',
      existingProducts: products
    });

    expect(result).toEqual({ status: 'abort', reason: 'missing-name' });
  });

  it('uses existing product when imported name matches existing (case-insensitive)', () => {
    const result = resolveImportTarget({
      selectedProduct: { id: 'p-1', name: 'Alpha' },
      importedName: 'alpha',
      existingProducts: products
    });

    expect(result).toEqual({ status: 'use-existing', product: { id: 'p-1', name: 'Alpha' } });
  });

  it('uses matching existing product ignoring selected product', () => {
    const result = resolveImportTarget({
      selectedProduct: { id: 'p-1', name: 'Alpha' },
      importedName: 'Beta',
      existingProducts: products
    });

    expect(result).toEqual({ status: 'use-existing', product: { id: 'p-2', name: 'Beta' } });
  });

  it('creates new product when imported name has no match', () => {
    const result = resolveImportTarget({
      selectedProduct: { id: 'p-1', name: 'Alpha' },
      importedName: 'Gamma',
      existingProducts: products
    });

    expect(result).toEqual({ status: 'create-new', name: 'Gamma' });
  });

  it('aborts when no name provided regardless of selection', () => {
    const result = resolveImportTarget({
      selectedProduct: null,
      importedName: '',
      existingProducts: products
    });

    expect(result).toEqual({ status: 'abort', reason: 'missing-name' });
  });

  it('targets existing product when imported name matches (no selection)', () => {
    const result = resolveImportTarget({
      selectedProduct: null,
      importedName: 'alpha',
      existingProducts: products
    });

    expect(result).toEqual({ status: 'use-existing', product: { id: 'p-1', name: 'Alpha' } });
  });

  it('creates new product with trimmed name when not found', () => {
    const result = resolveImportTarget({
      selectedProduct: null,
      importedName: '  Gamma  ',
      existingProducts: products
    });

    expect(result).toEqual({ status: 'create-new', name: 'Gamma' });
  });
});

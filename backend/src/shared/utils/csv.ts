// @ts-ignore - types may not be present
import Papa from 'papaparse';

export function exportCsv(rows: any[]) {
  return Papa.unparse(rows, {
    quotes: false, // Let Papa Parse handle quotes automatically
    delimiter: ',',
    header: true
  });
}

export function importCsv(csv: string) {
  const parsed: any = Papa.parse(csv, { header: true });
  if (parsed.errors.length) throw new Error(parsed.errors.map((e: any) => e.message).join('; '));
  return parsed.data as any[];
}

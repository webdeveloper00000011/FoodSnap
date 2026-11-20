import type { FoodScanRecord } from '../types/food';

const STORAGE_KEY = 'foodsnap_scan_history_v1';
const MAX_HISTORY_ITEMS = 40;

export function loadScanHistory(): FoodScanRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is FoodScanRecord =>
        Boolean(item && typeof item.id === 'string' && item.analysis && item.scannedAt)
    );
  } catch {
    return [];
  }
}

function persistRecords(records: FoodScanRecord[]): FoodScanRecord[] {
  let trimmed = records.slice(0, MAX_HISTORY_ITEMS);
  while (trimmed.length > 0) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
      return trimmed;
    } catch {
      // Remove oldest entry if localStorage quota is tight
      trimmed = trimmed.slice(0, trimmed.length - 1);
    }
  }
  localStorage.setItem(STORAGE_KEY, '[]');
  return [];
}

export function saveScanToHistory(record: FoodScanRecord): FoodScanRecord[] {
  const current = loadScanHistory();
  const next = [record, ...current.filter((item) => item.id !== record.id)];
  return persistRecords(next);
}

export function deleteScanFromHistory(id: string): FoodScanRecord[] {
  const current = loadScanHistory();
  const next = current.filter((item) => item.id !== id);
  return persistRecords(next);
}

export function clearAllHistory(): FoodScanRecord[] {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage error
  }
  return [];
}

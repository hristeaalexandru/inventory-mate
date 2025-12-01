export interface InventoryItem {
  code: string;
  name: string;
  scripticQty: number; // The quantity from the CSV
  actualQty: number;   // The quantity counted via scan
  lastScannedAt?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  isLocked: boolean; // True if CSV has been imported
  items: InventoryItem[];
}

export interface ScanResult {
  code: string;
  timestamp: string;
}
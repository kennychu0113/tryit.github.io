export interface AssetRecord {
  id: string;
  date: string; // ISO string YYYY-MM-DD
  assets: { [key: string]: number }; // Dynamic keys: HSBC, CITI, Cash, etc.
  total: number;
  gain: number;
  income: number;
  mpf: number;
  note?: string;
}

export interface AppState {
  records: AssetRecord[];
  assetKeys: string[]; // List of account names detected (HSBC, CITI...)
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  RECORDS = 'RECORDS',
  IMPORT = 'IMPORT',
  AI_INSIGHTS = 'AI_INSIGHTS'
}

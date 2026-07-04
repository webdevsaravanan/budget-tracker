export interface Transaction {
  id: string;
  date: string;       // "14-03-26, 23:48:44"
  amount: string;
  source: string;
  account: string;
  created: string;
  transactionType: 'debit' | 'credit';
  displayName?: string;
  category?: string;
  fbKey?: string;
  investable?: boolean;
  invested?: boolean;
}

export interface TransactionFilter {
  query:   string;
  date:    string;   // "2026-03-14" (ISO)
  startDate?: string; // "2026-03-14"
  endDate?:   string; // "2026-03-14"
  month:   string;   // "03"
  type:    'all' | 'debit' | 'credit';
  accounts: Set<string>;
  category?: string;
}

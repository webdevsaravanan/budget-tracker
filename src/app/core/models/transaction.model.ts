export interface Transaction {
  id: string;
  date: string;       // "14-03-26, 23:48:44"
  amount: string;
  source: string;
  account: string;
  created: string;
  transactionType: 'debit' | 'credit';
}

export interface TransactionFilter {
  query:   string;
  date:    string;   // "2026-03-14" (ISO)
  month:   string;   // "03"
  type:    'all' | 'debit' | 'credit';
  accounts: Set<string>;
}

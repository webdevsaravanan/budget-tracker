export interface Budget {
  amount:    number;
  days:      number;
  startDate: string;  // ISO string
}

export interface BudgetApiResponse {
  budget: Budget | null;
}

export interface BudgetStats {
  totalDebit:    number;
  remaining:     number;
  daysLeft:      number;
  safePerDay:    number;
  percentSpent:  number;
  isOver:        boolean;
}

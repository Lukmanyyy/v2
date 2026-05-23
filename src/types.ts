export type TransactionType = 'income' | 'expense';

export interface Account {
  id: string;
  name: string;
  initialBalance: number;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string; // ISO string
  note: string;
  accountId: string;
}

export interface FinanceState {
  transactions: Transaction[];
  accounts: Account[];
}

export interface CategoriesState {
  income: string[];
  expense: string[];
}

export const DEFAULT_CATEGORIES: CategoriesState = {
  income: ['Gaji', 'Lepas/Freelance', 'Investasi', 'Pemasukan Lainnya'],
  expense: ['Makanan & Minuman', 'Transportasi', 'Perumahan', 'Utilitas', 'Hiburan', 'Belanja', 'Kesehatan', 'Pengeluaran Lainnya']
};

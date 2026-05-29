import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Transaction, FinanceState, Account, CategoriesState, DEFAULT_CATEGORIES } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './useAuth';

interface FinanceContextType extends FinanceState {
  categories: CategoriesState;
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  addAccount: (acc: Omit<Account, 'id'>) => void;
  editAccount: (id: string, name: string, initialBalance: number) => void;
  deleteAccount: (id: string) => void;
  addCategory: (type: 'income' | 'expense', category: string) => void;
  deleteCategory: (type: 'income' | 'expense', category: string) => void;
  getAccountBalance: (accountId: string) => number;
  balance: number;
  totalIncome: number;
  totalExpense: number;
  exportData: () => void;
  importData: (jsonData: string) => boolean;
  syncStatus: 'local' | 'syncing' | 'synced' | 'unauthorized';
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const defaultAccount: Account = { id: 'default', name: 'Kas Utama', initialBalance: 0 };

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [syncStatus, setSyncStatus] = useState<'local' | 'syncing' | 'synced' | 'unauthorized'>('unauthorized');
  const [isLoaded, setIsLoaded] = useState(false);
  
  // BIKIN REM DI SINI: Biar gak auto-post pas pertama kali halaman web dibuka
  const isFirstSync = useRef(true);

  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem(`finance_accounts_${user?.username}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [defaultAccount];
      }
    }
    return [defaultAccount];
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem(`finance_data_${user?.username}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((t: any) => ({ ...t, accountId: t.accountId || 'default' }));
        } else if (parsed.transactions) {
          return parsed.transactions;
        }
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [categories, setCategories] = useState<CategoriesState>(() => {
    const saved = localStorage.getItem(`finance_categories_${user?.username}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEFAULT_CATEGORIES;
      }
    }
    return DEFAULT_CATEGORIES;
  });

  // Ambil dari Cloudflare KV saat awal
  useEffect(() => {
    if (!user) {
       setSyncStatus('unauthorized');
       setIsLoaded(true);
       return;
    }

    setSyncStatus('syncing');
    fetch('/api/sync', {
      headers: {
        'Authorization': `Bearer ${user.token}`
      }
    })
      .then(res => {
        const contentType = res.headers.get("content-type");
        if (!res.ok || !(contentType && contentType.indexOf("application/json") !== -1)) {
          throw new Error('API not available');
        }
        return res.json();
      })
      .then(data => {
        if (data && data.transactions) {
          setTransactions(data.transactions);
          if (data.accounts) setAccounts(data.accounts);
          if (data.categories) setCategories(data.categories);
          setSyncStatus('synced');
        } else {
          setSyncStatus('local');
        }
      })
      .catch((e) => {
        console.log("Berjalan dalam mode lokal (Cloudflare KV tidak terdeteksi)");
        setSyncStatus('local');
      })
      .finally(() => {
        setIsLoaded(true);
      });
  }, [user]);

  // Simpan ke Local Storage dan Cloudflare KV jika ada perubahan
  useEffect(() => {
    if (!isLoaded || !user) return;
    
    localStorage.setItem(`finance_data_${user.username}`, JSON.stringify(transactions));
    localStorage.setItem(`finance_accounts_${user.username}`, JSON.stringify(accounts));
    localStorage.setItem(`finance_categories_${user.username}`, JSON.stringify(categories));
    
    // JIKA INI ADALAH PROSES SINKRONISASI PERTAMA KALI PAS LOAD HALAMAN, JANGAN KIRIM POST!
    if (isFirstSync.current) {
      isFirstSync.current = false;
      setSyncStatus('synced');
      return;
    }

    setSyncStatus('syncing');
    fetch('/api/sync', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`
      },
      body: JSON.stringify({ transactions, accounts, categories })
    })
    .then(res => {
      if (res.ok) setSyncStatus('synced');
      else setSyncStatus('local');
    })
    .catch(() => {
      setSyncStatus('local');
    });
  }, [transactions, accounts, categories, isLoaded, user]);

  const addTransaction = (tx: Omit<Transaction, 'id'>) => {
    const newTx: Transaction = { ...tx, id: uuidv4() };
    setTransactions((prev) => [newTx, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter(tx => tx.id !== id));
  };

  const addAccount = (acc: Omit<Account, 'id'>) => {
    setAccounts(prev => [...prev, { ...acc, id: uuidv4() }]);
  };

  const editAccount = (id: string, name: string, initialBalance: number) => {
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, name, initialBalance } : a));
  };

  const deleteAccount = (id: string) => {
    if (accounts.length <= 1) {
      alert("Tidak bisa menghapus satu-satunya dompet/kas.");
      return;
    }
    const hasTransactions = transactions.some(t => t.accountId === id);
    if (hasTransactions) {
      const confirm = window.confirm("Menghapus dompet ini juga akan menghapus semua transaksi di dalamnya. Lanjutkan?");
      if (!confirm) return;
    }
    setAccounts(prev => prev.filter(a => a.id !== id));
    setTransactions(prev => prev.filter(t => t.accountId !== id));
  };

  const addCategory = (type: 'income' | 'expense', category: string) => {
    setCategories(prev => {
      if (prev[type].includes(category)) return prev;
      return { ...prev, [type]: [...prev[type], category] };
    });
  };

  const deleteCategory = (type: 'income' | 'expense', category: string) => {
    setCategories(prev => ({
      ...prev,
      [type]: prev[type].filter(c => c !== category)
    }));
  };

  const getAccountBalance = (accountId: string) => {
    const acc = accounts.find(a => a.id === accountId);
    if (!acc) return 0;
    
    const accTransactions = transactions.filter(t => t.accountId === accountId);
    const inc = accTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const exp = accTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    return acc.initialBalance + inc - exp;
  };

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const balance = accounts.reduce((sum, acc) => sum + acc.initialBalance, 0) + totalIncome - totalExpense;

  const exportData = () => {
    const dataObj = { transactions, accounts };
    const dataStr = JSON.stringify(dataObj, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = 'cadangan_keuangan.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importData = (jsonData: string) => {
    try {
      const data = JSON.parse(jsonData);
      if (Array.isArray(data)) {
        setTransactions(data.map((t: any) => ({ ...t, accountId: t.accountId || 'default' })));
        setAccounts([defaultAccount]);
        return true;
      } else if (data.transactions && data.accounts) {
        setTransactions(data.transactions);
        setAccounts(data.accounts);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  return (
    <FinanceContext.Provider value={{
      transactions,
      accounts,
      categories,
      addTransaction,
      deleteTransaction,
      addAccount,
      editAccount,
      deleteAccount,
      addCategory,
      deleteCategory,
      getAccountBalance,
      balance,
      totalIncome,
      totalExpense,
      exportData,
      importData,
      syncStatus
    }}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance harus digunakan di dalam FinanceProvider');
  }
  return context;
}

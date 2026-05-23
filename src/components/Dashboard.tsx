import React, { useMemo } from 'react';
import { useFinance } from '../hooks/useFinance';
import { cn, formatCurrency } from '../lib/utils';
import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

export function Dashboard() {
  const { balance, totalIncome, totalExpense, transactions, syncStatus } = useFinance();

  const currentMonthTransactions = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return transactions.filter(t => {
      const txDate = new Date(t.date);
      return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
    });
  }, [transactions]);

  const monthlyProfitLoss = useMemo(() => {
    const income = currentMonthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = currentMonthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    return income - expense;
  }, [currentMonthTransactions]);

  const isProfit = monthlyProfitLoss >= 0;

  // Group expenses by category for pie chart
  const expensesByCategory = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense');
    const grouped = expenses.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  const COLORS = ['#4f46e5', '#38bdf8', '#fbbf24', '#f43f5e', '#818cf8', '#34d399', '#fb7185', '#a78bfa'];

  return (
    <div className="space-y-8 flex flex-col w-full text-slate-800">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Balance Card */}
        <div className="bg-indigo-700 rounded-2xl p-6 text-white shadow-xl shadow-indigo-200/50 flex flex-col justify-between">
          <div>
            <p className="text-indigo-200 text-xs font-semibold uppercase tracking-wider mb-1 flex items-center gap-2">
              <Wallet className="w-4 h-4" /> Total Saldo
            </p>
            <h2 className="text-3xl font-bold mb-4">{formatCurrency(balance)}</h2>
          </div>
          
          <div className="flex justify-between items-center bg-indigo-600/50 rounded-xl p-3 border border-indigo-500/30 mt-2">
             <div className="text-xs">
               <p className="text-indigo-200 mb-1">Profit/Rugi (Bulan Ini)</p>
               <p className={cn("font-bold text-sm", isProfit ? "text-emerald-300" : "text-rose-300")}>
                 {isProfit ? '+' : ''}{formatCurrency(monthlyProfitLoss)}
               </p>
             </div>
             <div className="text-[10px] text-indigo-200 text-right">
                <span className="uppercase font-bold tracking-wider block mb-1">Status Sinkronisasi</span>
                <div className="flex items-center gap-2 justify-end">
                  <span className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    syncStatus === 'synced' ? "bg-emerald-400" :
                    syncStatus === 'syncing' ? "bg-amber-400 animate-pulse" : "bg-slate-400"
                  )}></span>
                  {syncStatus === 'synced' ? 'Cloud' : syncStatus === 'syncing' ? 'Menyimpan...' : 'Lokal'}
                </div>
             </div>
          </div>
        </div>

        {/* Income Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-xs font-bold text-slate-400 uppercase mb-4 tracking-tighter flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" /> Total Pemasukan
          </h3>
          <p className="text-3xl font-bold text-slate-800 tracking-tight">{formatCurrency(totalIncome)}</p>
        </div>

        {/* Expense Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-xs font-bold text-slate-400 uppercase mb-4 tracking-tighter flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-rose-500" /> Total Pengeluaran
          </h3>
          <p className="text-3xl font-bold text-slate-800 tracking-tight">{formatCurrency(totalExpense)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expenses by Category Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm min-h-[400px] flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Analisis Pengeluaran</h3>
              <p className="text-xs text-slate-400">Berdasarkan Kategori Pengeluaran</p>
            </div>
          </div>
          {expensesByCategory.length > 0 ? (
            <div className="w-full relative h-[250px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expensesByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {expensesByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 text-xs font-medium">
                {expensesByCategory.map((entry, idx) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                    <span className="truncate text-slate-600">{entry.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
             <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
                Tidak ada data pengeluaran tersedia.
             </div>
          )}
        </div>

        {/* Recent Transactions Preview */}
        <div className="bg-white rounded-2xl border border-slate-200 flex-grow shadow-sm flex flex-col overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-800">Transaksi Terkini</h3>
          </div>
          <div className="flex-grow overflow-hidden flex flex-col">
             {transactions.length > 0 ? (
               <div className="divide-y divide-slate-50 flex-1 overflow-y-auto">
                 {transactions.slice(0, 5).map(tx => (
                   <div key={tx.id} className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                     <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-400 text-xs uppercase shrink-0">
                         {(tx.category || '?').charAt(0)}
                       </div>
                       <div className="truncate">
                         <span className="text-sm font-semibold block truncate">{tx.category || 'Tidak diketahui'}</span>
                         <span className="text-xs text-slate-400 block truncate">{tx.note || tx.type}</span>
                       </div>
                     </div>
                     <div className="text-right">
                       <span className={cn(
                         "text-sm font-bold block",
                         tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                       )}>
                         {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                       </span>
                     </div>
                   </div>
                 ))}
               </div>
             ) : (
               <div className="py-8 text-center text-slate-400 text-sm m-auto">
                 Tidak ada transaksi terkini.
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}

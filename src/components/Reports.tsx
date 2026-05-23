import React, { useMemo, useState } from 'react';
import { useFinance } from '../hooks/useFinance';
import { format, parseISO, isValid } from 'date-fns';
import { id } from 'date-fns/locale';
import { formatCurrency, cn } from '../lib/utils';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, fileText } from 'lucide-react';
import { Transaction } from '../types';

export function Reports() {
  const { transactions } = useFinance();
  
  const [currentDate, setCurrentDate] = useState(new Date());

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  // Filter transactions for the selected month
  const monthlyTransactions = useMemo(() => {
    return transactions.filter(t => {
      const txDate = new Date(t.date);
      return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
    });
  }, [transactions, currentMonth, currentYear]);

  const income = monthlyTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const expense = monthlyTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const profitLoss = income - expense;
  const isProfit = profitLoss >= 0;

  const monthName = format(currentDate, 'MMMM yyyy', { locale: id });

  return (
    <div className="space-y-6 flex flex-col h-full text-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 sm:gap-4">
        <div>
          <h1 className="text-2xl font-bold">Laporan Bulanan</h1>
          <p className="text-slate-500 text-sm mt-1">Pantau performa keuangan setiap bulan.</p>
        </div>
        
        <div className="inline-flex items-center bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm self-start sm:self-auto">
          <button 
            onClick={handlePrevMonth}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="w-36 text-center font-bold text-slate-800">
            {monthName}
          </div>
          <button 
            onClick={handleNextMonth}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-xs font-bold text-slate-400 uppercase mb-4 tracking-tighter flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" /> Total Pemasukan
          </h3>
          <p className="text-2xl font-bold text-slate-800 tracking-tight">{formatCurrency(income)}</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-xs font-bold text-slate-400 uppercase mb-4 tracking-tighter flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-rose-500" /> Total Pengeluaran
          </h3>
          <p className="text-2xl font-bold text-slate-800 tracking-tight">{formatCurrency(expense)}</p>
        </div>

        <div className={cn(
          "rounded-2xl border p-5 shadow-sm",
          isProfit ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"
        )}>
          <h3 className={cn(
            "text-xs font-bold uppercase mb-4 tracking-tighter flex items-center gap-2",
            isProfit ? "text-emerald-700" : "text-rose-700"
          )}>
            Profit / Rugi Bersih
          </h3>
          <p className={cn(
            "text-2xl font-bold tracking-tight",
            isProfit ? "text-emerald-700" : "text-rose-700"
          )}>
            {isProfit ? '+' : ''}{formatCurrency(profitLoss)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800">Riwayat Transaksi: {monthName}</h3>
          <div className="text-xs text-slate-500 bg-white px-2 py-1 rounded shadow-sm border border-slate-200 font-medium tracking-wide">
            {monthlyTransactions.length} Transaksi
          </div>
        </div>
        
        {monthlyTransactions.length === 0 ? (
          <div className="p-12 text-center text-slate-500 flex-1 flex items-center justify-center">
            <p>Tidak ada transaksi pada bulan {monthName}.</p>
          </div>
        ) : (
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead className="bg-white border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tanggal</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kategori / Catatan</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 bg-white">
                {monthlyTransactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                       {tx.date && isValid(parseISO(tx.date)) ? format(parseISO(tx.date), 'dd MMM yyyy') : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-400 text-xs shrink-0 uppercase">
                          {(tx.category || '?').charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <span className="text-sm font-semibold block truncate">{tx.category || 'Tidak diketahui'}</span>
                          {tx.note && <p className="text-[10px] text-slate-400 mt-0.5 truncate">{tx.note}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={cn(
                        "text-sm font-bold flex items-center justify-end gap-1 whitespace-nowrap",
                        tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                      )}>
                        {tx.type === 'income' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

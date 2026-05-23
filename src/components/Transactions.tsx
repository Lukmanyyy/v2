import React from 'react';
import { useFinance } from '../hooks/useFinance';
import { format } from 'date-fns';
import { Trash2, ArrowUpRight, ArrowDownRight, Search } from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';

interface TransactionsProps {
  onAdd?: (type: 'income' | 'expense') => void;
}

export function Transactions({ onAdd }: TransactionsProps) {
  const { transactions, deleteTransaction } = useFinance();
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredTransactions = transactions.filter(tx => 
    tx.note.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 flex flex-col h-full text-slate-800">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Transaksi</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola pemasukan dan pengeluaran Anda.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => onAdd?.('income')}
              className="flex-1 sm:flex-none px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
            >
              + Pemasukan
            </button>
            <button 
              onClick={() => onAdd?.('expense')}
              className="flex-1 sm:flex-none px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
            >
              - Pengeluaran
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Cari transaksi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-400"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <p>Transaksi tidak ditemukan.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Penjual / Kategori</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tipe</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tanggal</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Jumlah / Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 transition-colors group">
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
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-1 rounded text-[10px] font-bold",
                        tx.type === 'income' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                      )}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400 font-medium whitespace-nowrap">
                       {tx.date && !isNaN(new Date(tx.date).getTime()) ? format(new Date(tx.date), 'dd MMM yyyy') : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-4 whitespace-nowrap">
                        <span className={cn(
                          "font-bold text-sm",
                          tx.type === 'income' ? "text-emerald-600" : "text-rose-600"
                        )}>
                          {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                        </span>
                        
                        <button 
                          onClick={() => deleteTransaction(tx.id)}
                          className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all focus:opacity-100"
                          aria-label="Delete transaction"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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

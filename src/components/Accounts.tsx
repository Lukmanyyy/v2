import React, { useState } from 'react';
import { useFinance } from '../hooks/useFinance';
import { Wallet, Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { Account } from '../types';

export function Accounts() {
  const { accounts, getAccountBalance, addAccount, editAccount, deleteAccount } = useFinance();
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newBalance, setNewBalance] = useState('');
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editBalance, setEditBalance] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const rawBalance = newBalance.replace(/\./g, '');
    addAccount({
      name: newName,
      initialBalance: Number(rawBalance) || 0
    });
    setNewName('');
    setNewBalance('');
    setIsAdding(false);
  };

  const startEdit = (acc: Account) => {
    setEditingId(acc.id);
    setEditName(acc.name);
    setEditBalance(new Intl.NumberFormat('id-ID').format(acc.initialBalance));
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || !editName.trim()) return;
    const rawBalance = editBalance.replace(/\./g, '');
    editAccount(editingId, editName, Number(rawBalance) || 0);
    setEditingId(null);
  };

  const handleNewBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value === '') setNewBalance('');
    else setNewBalance(new Intl.NumberFormat('id-ID').format(Number(value)));
  };

  const handleEditBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value === '') setEditBalance('');
    else setEditBalance(new Intl.NumberFormat('id-ID').format(Number(value)));
  };

  return (
    <div className="space-y-6 flex flex-col h-full text-slate-800">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dompet & Kas</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola sumber dana Anda.</p>
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Tambah Kas
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {isAdding && (
          <form onSubmit={handleAdd} className="p-4 border-b border-slate-100 bg-slate-50">
            <h3 className="text-sm font-bold mb-3">Kas Baru</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Nama Kas (mis: Rekening BCA)"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                autoFocus
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
              <input
                type="text"
                placeholder="Saldo Awal"
                value={newBalance}
                onChange={handleNewBalanceChange}
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
              <div className="flex gap-2">
                <button type="submit" className="px-3 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200">
                  <Check className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => setIsAdding(false)} className="px-3 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="divide-y divide-slate-100">
          {accounts.map(acc => {
            const isEditing = editingId === acc.id;
            const currentBalance = getAccountBalance(acc.id);

            if (isEditing) {
              return (
                <form key={acc.id} onSubmit={handleEdit} className="p-4 bg-indigo-50/50 flex flex-col sm:flex-row items-center gap-3">
                  <input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm w-full"
                  />
                  <input
                    type="text"
                    value={editBalance}
                    onChange={handleEditBalanceChange}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm w-full"
                    placeholder="Saldo Awal"
                  />
                  <div className="flex gap-2 ml-auto">
                    <button type="submit" className="px-3 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200">
                      <Check className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => setEditingId(null)} className="px-3 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              );
            }

            return (
              <div key={acc.id} className="p-4 sm:p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{acc.name}</h3>
                    <p className="text-xs text-slate-400">Saldo Awal: {formatCurrency(acc.initialBalance)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Saldo Akhir</div>
                    <div className="font-bold text-slate-900 text-lg">{formatCurrency(currentBalance)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => startEdit(acc)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {accounts.length > 1 && (
                      <button onClick={() => deleteAccount(acc.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

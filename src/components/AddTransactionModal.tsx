import React, { useState } from 'react';
import { useFinance } from '../hooks/useFinance';
import { TransactionType } from '../types';
import { cn } from '../lib/utils';
import { X, Wallet, Settings, ChevronDown, Check } from 'lucide-react';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: TransactionType;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  icon?: React.ReactNode;
}

function CustomSelect({ value, onChange, options, icon }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(o => o.value === value) || options[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between text-left py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-white font-medium text-slate-900",
          icon ? "pl-10 pr-4" : "px-4"
        )}
      >
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </div>
        )}
        <span className="truncate">{selectedOption?.label}</span>
        <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden py-1 max-h-60 overflow-y-auto">
            {options.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-2 text-sm text-left hover:bg-slate-50 transition-colors",
                  option.value === value ? "text-indigo-600 font-bold bg-indigo-50/50" : "text-slate-700"
                )}
              >
                <span className="truncate">{option.label}</span>
                {option.value === value && <Check className="w-4 h-4" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function AddTransactionModal({ isOpen, onClose, initialType = 'expense' }: AddTransactionModalProps) {
  const { addTransaction, accounts, categories, addCategory, deleteCategory } = useFinance();
  const [type, setType] = useState<TransactionType>(initialType);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(categories[initialType]?.[0] || '');
  const [accountId, setAccountId] = useState(accounts[0]?.id || 'default');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const prevIsOpen = React.useRef(false);

  React.useEffect(() => {
    if (isOpen && !prevIsOpen.current) {
      setType(initialType);
      setCategory(categories[initialType]?.[0] || '');
      setDate(new Date().toISOString().split('T')[0]);
      setAmount('');
      setNote('');
      setIsEditingCategory(false);
      if (!accounts.find(a => a.id === accountId)) {
        setAccountId(accounts[0]?.id || 'default');
      }
    }
    prevIsOpen.current = isOpen;
  }, [isOpen, initialType, accounts, accountId, categories]);

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rawAmount = amount.replace(/\./g, '');
    if (!rawAmount || isNaN(Number(rawAmount)) || Number(rawAmount) <= 0) return;
    if (!date) return;
    if (!accountId) return;

    addTransaction({
      type,
      amount: Number(rawAmount),
      category,
      date: new Date(date).toISOString(),
      note,
      accountId
    });
    
    setAmount('');
    setNote('');
    onClose();
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value === '') {
      setAmount('');
    } else {
      setAmount(new Intl.NumberFormat('id-ID').format(Number(value)));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 font-sans">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col"
           onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-100 flex-shrink-0 bg-white z-10">
          <h2 className="text-xl font-bold text-slate-800">Transaksi Baru</h2>
          <button onClick={onClose} className="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto flex flex-col min-h-0">
          <div className="p-6 space-y-6 flex-1">
            <div className="flex p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              className={cn(
                "flex-1 py-2 text-sm font-bold rounded-md transition-all uppercase tracking-wider text-[10px]",
                type === 'expense' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
              onClick={() => { setType('expense'); setCategory(categories.expense[0]); setIsEditingCategory(false); }}
            >
              Pengeluaran
            </button>
            <button
              type="button"
              className={cn(
                "flex-1 py-2 text-sm font-bold rounded-md transition-all uppercase tracking-wider text-[10px]",
                type === 'income' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
              onClick={() => { setType('income'); setCategory(categories.income[0]); setIsEditingCategory(false); }}
            >
              Pemasukan
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Sumber (Kas/Dompet)</label>
              <CustomSelect
                value={accountId}
                onChange={setAccountId}
                options={accounts.map(acc => ({ label: acc.name, value: acc.id }))}
                icon={<Wallet className="w-4 h-4" />}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Jumlah</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">Rp</span>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={amount}
                  onChange={handleAmountChange}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-medium text-slate-900"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Kategori</label>
                <button
                  type="button"
                  onClick={() => setIsEditingCategory(!isEditingCategory)}
                  className="text-[10px] uppercase font-bold text-indigo-600 flex items-center gap-1 hover:text-indigo-800 transition-colors"
                >
                  <Settings className="w-3 h-3" />
                  {isEditingCategory ? 'Tutup Edit' : 'Edit Kategori'}
                </button>
              </div>
              
              {!isEditingCategory ? (
                <CustomSelect
                  value={category}
                  onChange={setCategory}
                  options={categories[type].map(c => ({ label: c, value: c }))}
                />
              ) : (
                <div className="space-y-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="flex flex-wrap gap-2">
                    {categories[type].map(c => (
                      <div key={c} className="flex items-center gap-1 bg-white border border-slate-200 px-2 py-1 rounded-md text-xs font-medium">
                        <span>{c}</span>
                        {categories[type].length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              deleteCategory(type, c);
                              if (category === c) setCategory(categories[type].find(cat => cat !== c) || '');
                            }}
                            className="text-slate-400 hover:text-rose-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 min-w-0 px-3 py-1.5 border border-slate-200 rounded-md text-sm outline-none focus:border-indigo-500"
                      placeholder="Kategori baru..."
                      id="new-category-input"
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = (e.target as HTMLInputElement).value.trim();
                          if (val) {
                            addCategory(type, val);
                            setCategory(val);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.getElementById('new-category-input') as HTMLInputElement;
                        const val = input.value.trim();
                        if (val) {
                          addCategory(type, val);
                          setCategory(val);
                          input.value = '';
                        }
                      }}
                      className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap"
                    >
                      Tambah
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Tanggal</label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-medium text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Catatan (Opsional)</label>
              <input
                type="text"
                value={note}
                onChange={e => setNote(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-medium text-slate-900 placeholder:text-slate-400"
                placeholder="Untuk apa ini?"
              />
            </div>
          </div>
          </div>

          <div className="p-6 border-t border-slate-100 bg-white flex-shrink-0 mt-auto">
            <button
              type="submit"
              className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-lg transition-colors focus:ring-4 focus:ring-slate-900/20 text-sm flex items-center justify-center gap-2"
            >
              Simpan Transaksi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

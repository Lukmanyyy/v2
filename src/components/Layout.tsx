import React, { useState } from 'react';
import { Dashboard } from './Dashboard';
import { Transactions } from './Transactions';
import { Accounts } from './Accounts';
import { Reports } from './Reports';
import { AddTransactionModal } from './AddTransactionModal';
import { LayoutDashboard, ReceiptText, Plus, Database, Download, Upload, Wallet, FileText, LogOut, User } from 'lucide-react';
import { cn } from '../lib/utils';
import { ErrorBoundary } from './ErrorBoundary';
import { useFinance } from '../hooks/useFinance';
import { useAuth } from '../hooks/useAuth';

export function Layout() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'accounts' | 'reports'>('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'income' | 'expense'>('expense');
  const { exportData, importData, syncStatus } = useFinance();
  const { user, logout } = useAuth();
  
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importData(content);
      if (success) {
        alert("Data berhasil diimpor!");
      } else {
        alert("Gagal mengimpor data. Pastikan format file adalah JSON.");
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // reset
  };

  const openModal = (type: 'income' | 'expense' = 'expense') => {
    setModalType(type);
    setIsModalOpen(true);
  };

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col font-sans text-slate-900 overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 md:px-8 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Database className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800 uppercase">Uangku</h1>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveTab('reports')}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition-colors text-sm border",
              activeTab === 'reports' 
                ? "bg-indigo-50 text-indigo-700 border-indigo-200" 
                : "text-slate-500 border-slate-200 hover:bg-slate-100 hover:text-slate-900"
            )}
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Laporan</span>
          </button>

          <div className={cn(
            "hidden md:flex items-center gap-2 px-3 py-1.5 border rounded-full text-xs font-medium",
            syncStatus === 'synced' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
            syncStatus === 'syncing' ? "bg-amber-50 text-amber-700 border-amber-100" :
            "bg-slate-50 text-slate-700 border-slate-200"
          )}>
            <div className={cn(
              "w-2 h-2 rounded-full",
              syncStatus === 'synced' ? "bg-emerald-500" :
              syncStatus === 'syncing' ? "bg-amber-500 animate-pulse" :
              "bg-slate-400"
            )}></div>
            <span className="hidden lg:inline">Sinkronisasi:</span>
            {syncStatus === 'synced' ? 'Cloud' : syncStatus === 'syncing' ? 'Menyimpan...' : 'Lokal'}
          </div>

          <div className="flex items-center gap-2 pl-4 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold uppercase overflow-hidden">
               {user?.username?.charAt(0) || <User className="w-4 h-4" />}
            </div>
            <button
               onClick={logout}
               className="text-slate-500 hover:text-rose-600 transition-colors p-1"
               title="Keluar"
            >
               <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-full md:w-64 bg-transparent shrink-0 flex flex-col p-6 gap-6 overflow-y-auto hidden md:flex">
          <nav className="flex-1 space-y-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors",
                activeTab === 'dashboard' 
                  ? "bg-indigo-50 text-indigo-700" 
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <LayoutDashboard className="w-5 h-5" />
              Dasbor
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors",
                activeTab === 'transactions' 
                  ? "bg-indigo-50 text-indigo-700" 
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <ReceiptText className="w-5 h-5" />
              Transaksi
            </button>
            <button
              onClick={() => setActiveTab('accounts')}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors",
                activeTab === 'accounts' 
                  ? "bg-indigo-50 text-indigo-700" 
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <Wallet className="w-5 h-5" />
              Dompet / Kas
            </button>
          </nav>

          <button
            onClick={() => openModal('expense')}
            className="w-full bg-slate-900 text-white py-3 rounded-xl font-semibold text-sm shadow-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Transaksi Baru
          </button>
          
          <div className="pt-6 mt-2 border-t border-slate-200">
             <div className="text-xs font-bold text-slate-400 uppercase tracking-tighter mb-4">Manajemen Data</div>
             <button
                onClick={exportData}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors"
             >
               <Download className="w-4 h-4" /> Ekspor Cadangan
             </button>
             
             <label className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-slate-500 hover:text-emerald-600 transition-colors cursor-pointer mt-1">
               <Upload className="w-4 h-4" /> Impor Cadangan
               <input type="file" accept=".json" className="hidden" onChange={handleImport} />
             </label>
             <p className="px-4 py-2 text-[10px] text-slate-400 mt-2 leading-tight">
                Data dicerminkan secara lokal via peramban. Pastikan pencadangan rutin.
             </p>
          </div>
        </aside>

        {/* Mobile Navigation */}
        <nav className="md:hidden flex bg-white border-b border-slate-200 p-4 gap-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors text-sm",
                activeTab === 'dashboard' 
                  ? "bg-indigo-50 text-indigo-700" 
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <LayoutDashboard className="w-4 h-4" /> Dasbor
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors text-sm",
                activeTab === 'transactions' 
                  ? "bg-indigo-50 text-indigo-700" 
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <ReceiptText className="w-4 h-4" /> Transaksi
            </button>
            <button
              onClick={() => setActiveTab('accounts')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors text-sm",
                activeTab === 'accounts' 
                  ? "bg-indigo-50 text-indigo-700" 
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <Wallet className="w-4 h-4" /> Dompet
            </button>
        </nav>

        {/* Main Panel */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto w-full">
          <div className="max-w-4xl mx-auto pb-24 md:pb-0">
             <ErrorBoundary>
               {activeTab === 'dashboard' && <Dashboard />}
               {activeTab === 'transactions' && <Transactions onAdd={openModal} />}
               {activeTab === 'accounts' && <Accounts />}
               {activeTab === 'reports' && <Reports />}
             </ErrorBoundary>
          </div>
        </main>
      </div>

      {/* Mobile Floating Action Button */}
      <div className="fixed bottom-6 right-6 md:hidden z-40">
        <button
          onClick={() => openModal('expense')}
          className="bg-slate-900 hover:bg-slate-800 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 flex items-center justify-center"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      <AddTransactionModal isOpen={isModalOpen} initialType={modalType} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}

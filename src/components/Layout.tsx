import React, { useState, useEffect } from 'react';
import { Dashboard } from './Dashboard';
import { Transactions } from './Transactions';
import { Accounts } from './Accounts';
import { Reports } from './Reports';
import { AddTransactionModal } from './AddTransactionModal';
import { LayoutDashboard, ReceiptText, Plus, Database, Download, Upload, Wallet, FileText, LogOut, User, Link as LinkIcon, Info, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { ErrorBoundary } from './ErrorBoundary';
import { useFinance } from '../hooks/useFinance';
import { useAuth } from '../hooks/useAuth';

export function Layout() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'accounts' | 'reports'>('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'income' | 'expense'>('expense');
  
  // STATE MANAGEMENT LU
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [tgInput, setTgInput] = useState('');
  const [isLinkingTg, setIsLinkingTg] = useState(false);
  const [currentTelegramId, setCurrentTelegramId] = useState<string | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  const { exportData, importData, syncStatus } = useFinance();
  const { user, logout } = useAuth();
  
  // CHECK STATUS TELEGRAM REALTIME SAAT MODAL DIBUKA
  useEffect(() => {
    if (isProfileMenuOpen && user?.username) {
      setIsLoadingProfile(true);
      fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_profile', username: user.username })
      })
      .then(res => res.json())
      .then(data => {
        if (data.telegramId) {
          setCurrentTelegramId(String(data.telegramId));
        } else {
          setCurrentTelegramId(null);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoadingProfile(false));
    }
  }, [isProfileMenuOpen, user?.username]);

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
    e.target.value = ''; 
  };

  const openModal = (type: 'income' | 'expense' = 'expense') => {
    setModalType(type);
    setIsModalOpen(true);
  };

  const handleLinkTg = async () => {
    if (!tgInput.trim()) {
      alert("Masukkan ID Telegram terlebih dahulu!");
      return;
    }
    
    setIsLinkingTg(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request_tg_link', username: user?.username, telegramId: tgInput })
      });
      const data = await res.json();
      
      if (res.ok) {
        alert("✅ Permintaan terkirim! Silakan buka bot Telegram Uangku dan klik tombol 'Verifikasi & Tautkan'.");
        setTgInput('');
        setIsProfileMenuOpen(false);
      } else {
        alert("❌ Gagal: " + (data.error || "Terjadi kesalahan di server."));
      }
    } catch (e) {
      alert("❌ Gagal menghubungi server.");
    } finally {
      setIsLinkingTg(false);
    }
  };

  // FUNGSI LEPAS KAITAN LANGSUNG DARI WEB
  const handleUnlinkTgFromWeb = async () => {
    if (!window.confirm("Apakah Anda yakin ingin melepas kaitan Telegram dari akun ini?")) return;
    
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unlink_tg', username: user?.username })
      });
      if (res.ok) {
        alert("✅ Kaitan Telegram berhasil dilepas!");
        setCurrentTelegramId(null);
      } else {
        alert("❌ Gagal melepas kaitan.");
      }
    } catch (e) {
      alert("❌ Terjadi kesalahan jaringan.");
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col font-sans text-slate-900 overflow-hidden relative">
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
            <button 
              onClick={() => setIsProfileMenuOpen(true)}
              title="Informasi Akun"
              className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold uppercase overflow-hidden hover:bg-indigo-200 transition-colors shadow-sm"
            >
               {user?.username?.charAt(0) || <User className="w-4 h-4" />}
            </button>
            
            <button
               onClick={() => setIsLogoutConfirmOpen(true)}
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

      {/* MODAL 1: KONFIRMASI LOGOUT */}
      {isLogoutConfirmOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center shadow-2xl scale-in-95">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogOut className="w-6 h-6 ml-1" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Keluar Akun?</h3>
            <p className="text-sm text-slate-500 mb-6">Apakah Anda yakin ingin keluar dari sesi ini? Anda harus login kembali untuk masuk.</p>
            <div className="flex gap-3">
              <button onClick={() => setIsLogoutConfirmOpen(false)} className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors">Batal</button>
              <button onClick={logout} className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 transition-colors">Ya, Keluar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: INFORMASI AKUN (DENGAN RECOGNITION STATUS TELEGRAM ID) */}
      {isProfileMenuOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl scale-in-95">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xl uppercase">
                {user?.username?.charAt(0) || <User className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Informasi Akun</h3>
                <p className="text-sm text-slate-500">Kelola keamanan akun Anda</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Username Terdaftar</label>
                <div className="font-bold text-slate-800 text-lg">{user?.username}</div>
              </div>

              <div>
                <label className="flex items-center text-sm font-bold text-slate-700 mb-2 gap-2">
                  <LinkIcon className="w-4 h-4 text-indigo-600" /> Status Telegram
                </label>
                
                {isLoadingProfile ? (
                  <div className="flex items-center gap-2 text-xs text-slate-400 p-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Memeriksa kaitan...
                  </div>
                ) : currentTelegramId ? (
                  /* JIKA SUDAH KETAUT, TAMPILKAN STATUS INI */
                  <div className="flex items-center justify-between p-3 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-sm font-medium animate-in fade-in duration-200">
                    <div className="flex items-center gap-2 truncate">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0"></div>
                      <span className="truncate">Terkait ID: <b>{currentTelegramId}</b></span>
                    </div>
                    <button 
                      onClick={handleUnlinkTgFromWeb}
                      className="text-xs text-rose-600 hover:text-rose-800 font-bold underline ml-2 flex-shrink-0"
                    >
                      Lepas
                    </button>
                  </div>
                ) : (
                  /* JIKA BELUM KETAUT, TAMPILKAN INPUT FORM INI */
                  <div className="animate-in fade-in duration-200">
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Masukkan ID (mis: 12345678)" 
                        value={tgInput} 
                        onChange={(e) => setTgInput(e.target.value)} 
                        className="flex-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" 
                      />
                      <button 
                        onClick={handleLinkTg} 
                        disabled={isLinkingTg} 
                        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-70 disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        {isLinkingTg ? 'Mengirim...' : 'Verifikasi'}
                      </button>
                    </div>
                    
                    <div className="flex items-start gap-2 mt-3 bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100">
                      <Info className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Kaitkan akun untuk menggunakan Bot Uangku dan fitur pemulihan sandi. Cek ID Telegram Anda di <b>@userinfobot</b>.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button 
              onClick={() => {
                setIsProfileMenuOpen(false);
                setTgInput('');
              }} 
              className="w-full py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold rounded-xl transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

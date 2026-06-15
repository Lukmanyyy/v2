import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Database, Loader2, ArrowRight, Eye, EyeOff, Info } from 'lucide-react';
import { cn } from '../lib/utils';

export function Auth() {
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [telegramId, setTelegramId] = useState(''); 
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // State untuk nampilin pesan Lupa Password
  const [showForgotPassInfo, setShowForgotPassInfo] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setShowForgotPassInfo(false);
    
    if (!username || !password) {
      setError('Username dan password harus diisi');
      return;
    }

    setLoading(true);

    try {
      const action = isLogin ? 'login' : 'register';
      
      const payload: any = { action, username, password };
      if (!isLogin && telegramId.trim() !== '') {
        payload.telegramId = telegramId.trim();
      }

      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const contentType = res.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Terjadi kesalahan');
        }

        login(data.token, data.username);
      } else {
        console.log("Mode Preview Lokal Aktif: Simulasi Auth");
        await new Promise(resolve => setTimeout(resolve, 800)); 
        
        const key = 'finansialv2_mock_users';
        const users = JSON.parse(localStorage.getItem(key) || '{}');
        
        if (isLogin) {
          if (users[username] && users[username] === password) {
            login(`mock-token-${username}`, username);
          } else {
            throw new Error('Username atau password salah (Mode Lokal)');
          }
        } else {
          if (users[username]) {
            throw new Error('Username sudah digunakan (Mode Lokal)');
          }
          users[username] = password;
          localStorage.setItem(key, JSON.stringify(users));
          login(`mock-token-${username}`, username);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-200">
            <Database className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 uppercase">
            Uangku
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            {isLogin ? 'Masuk ke akun Anda' : 'Buat akun baru'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          
          {error && (
            <div className="p-3 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          {/* BOX INFO LUPA PASSWORD */}
          {showForgotPassInfo && (
            <div className="p-3 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-sm font-medium flex items-start gap-2 animate-in fade-in slide-in-from-top-2">
              <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p>
                Untuk mereset password, silakan buka <b>Bot Telegram Uangku</b> dan klik tombol <b>🔑 Lupa Sandi</b>. Kami memprioritaskan keamanan berlapis lewat Telegram.
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
              placeholder="Masukkan username"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium pr-12"
                placeholder="Masukkan password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            
            {/* LINK LUPA PASSWORD DI WEB */}
            {isLogin && (
              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotPassInfo(true)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                >
                  Lupa Password?
                </button>
              </div>
            )}
          </div>

          {!isLogin && (
            <div className="animate-in fade-in duration-300">
              <label className="flex items-center text-sm font-bold text-slate-700 mb-1.5 gap-1.5">
                Telegram ID <span className="text-slate-400 font-normal text-xs">(Opsional)</span>
              </label>
              <input
                type="text"
                value={telegramId}
                onChange={e => setTelegramId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                placeholder="Contoh: 123456789"
              />
              <div className="flex items-start gap-2 mt-2 bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100">
                <Info className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Isi dengan ID Telegram untuk menggunakan bot & mengamankan akun. Cek ID Anda melalui bot <b>@userinfobot</b>.
                </p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : isLogin ? 'Masuk' : 'Daftar'}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>

          <div className="text-center pt-4 border-t border-slate-100 mt-6">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setShowForgotPassInfo(false);
                setTelegramId(''); 
              }}
              className="text-sm text-slate-500 hover:text-indigo-600 font-medium transition-colors"
            >
              {isLogin ? 'Belum punya akun? Daftar sekarang' : 'Sudah punya akun? Masuk'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

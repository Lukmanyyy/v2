import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Database, Loader2, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';

export function Auth() {
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username || !password) {
      setError('Username dan password harus diisi');
      return;
    }

    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const contentType = res.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Terjadi kesalahan');
        }

        login(data.token, data.username);
      } else {
        // Fallback untuk testing di Preview AI Studio (karena Cloudflare Functions tidak berjalan di dev server Vite)
        console.log("Mode Preview Lokal Aktif: Simulasi Auth");
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulasi jeda network
        
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
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
              placeholder="Masukkan password"
            />
          </div>

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

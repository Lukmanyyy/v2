interface Env {
  finansialv2: any; // KVNamespace
  TG_TOKEN: string; // Token bot dari environment
}

async function hashPassword(password: string) {
  const enc = new TextEncoder();
  const data = enc.encode(password + "saltYsalt"); 
  const hash = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hash));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function onRequest({ request, env }: { request: Request, env: Env }) {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  try {
    const { action, username, password, telegramId, newPassword } = await request.json();

    // 1. WEB -> MINTA BOT NGIRIM TOMBOL VERIFIKASI
    if (action === 'request_tg_link') {
      if (!username || !telegramId) return new Response(JSON.stringify({ error: 'Data tidak lengkap' }), { status: 400 });
      if (!env.TG_TOKEN) return new Response(JSON.stringify({ error: 'TG_TOKEN belum disetting di server web' }), { status: 500 });

      const text = `🔗 *PERMINTAAN TAUTAN AKUN*\n\nSeseorang mencoba menautkan akun web *${username}* ke Telegram ini.\n\n_Klik tombol di bawah jika ini memang Anda._`;
      const keyboard = {
        inline_keyboard: [[{ text: '✅ Verifikasi & Tautkan', callback_data: `link_acc_${username}` }]]
      };

      const tgApi = `https://api.telegram.org/bot${env.TG_TOKEN}/sendMessage`;
      await fetch(tgApi, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: telegramId, text: text, parse_mode: 'Markdown', reply_markup: keyboard })
      });

      return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' }});
    }

    // 2. BOT -> KONFIRMASI TAUTAN SAAT TOMBOL DIKLIK
    if (action === 'confirm_tg_link') {
      const userKey = `user:${username.toLowerCase()}`;
      const userStr = await env.finansialv2.get(userKey);
      if (!userStr) return new Response(JSON.stringify({ error: 'User tidak ditemukan' }), { status: 404 });
      
      const user = JSON.parse(userStr);
      user.telegramId = telegramId;
      await env.finansialv2.put(userKey, JSON.stringify(user));
      return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' }});
    }

    // 3. BOT -> LEPAS KAITAN (UNLINK)
    if (action === 'unlink_tg') {
      const userKey = `user:${username.toLowerCase()}`;
      const userStr = await env.finansialv2.get(userKey);
      if (userStr) {
        const user = JSON.parse(userStr);
        delete user.telegramId;
        await env.finansialv2.put(userKey, JSON.stringify(user));
      }
      return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' }});
    }

    // 4. GET TG ACCOUNTS (Lupa Sandi)
    if (action === 'get_tg_accounts') {
      if (!telegramId) return new Response(JSON.stringify({ error: 'Telegram ID dibutuhkan' }), { status: 400 });
      const list = await env.finansialv2.list({ prefix: 'user:' });
      const accounts = [];
      for (const key of list.keys) {
        const userStr = await env.finansialv2.get(key.name);
        if (userStr) {
          const user = JSON.parse(userStr);
          if (user.telegramId && String(user.telegramId) === String(telegramId)) accounts.push(user.username);
        }
      }
      return new Response(JSON.stringify({ accounts }), { headers: { 'Content-Type': 'application/json' }});
    }

    // 5. RESET PASSWORD
    if (action === 'reset_password') {
      if (!telegramId || !username || !newPassword) return new Response(JSON.stringify({ error: 'Data tidak lengkap' }), { status: 400 });
      const userKey = `user:${username.toLowerCase()}`;
      const userStr = await env.finansialv2.get(userKey);
      if (!userStr) return new Response(JSON.stringify({ error: 'User tidak ditemukan' }), { status: 404 });
      const user = JSON.parse(userStr);
      if (String(user.telegramId) !== String(telegramId)) return new Response(JSON.stringify({ error: 'Akses ditolak.' }), { status: 403 });
      user.passwordHash = await hashPassword(newPassword);
      await env.finansialv2.put(userKey, JSON.stringify(user));
      return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' }});
    }

    // 6. REGISTER
    if (action === 'register') {
      if (!username || !password) return new Response(JSON.stringify({ error: 'Username dan password diperlukan' }), { status: 400 });
      const hashedPw = await hashPassword(password);
      const userKey = `user:${username.toLowerCase()}`;
      const existing = await env.finansialv2.get(userKey);
      if (existing) return new Response(JSON.stringify({ error: 'Username sudah digunakan' }), { status: 400, headers: { 'Content-Type': 'application/json' }});
      const id = crypto.randomUUID();
      const userData: any = { id, username, passwordHash: hashedPw };
      if (telegramId) userData.telegramId = telegramId;
      await env.finansialv2.put(userKey, JSON.stringify(userData));
      return new Response(JSON.stringify({ token: id, username }), { headers: { 'Content-Type': 'application/json' }});
    } 
    
    // 7. LOGIN
    if (action === 'login') {
      if (!username || !password) return new Response(JSON.stringify({ error: 'Username dan password diperlukan' }), { status: 400 });
      const hashedPw = await hashPassword(password);
      const userKey = `user:${username.toLowerCase()}`;
      const userStr = await env.finansialv2.get(userKey);
      if (!userStr) return new Response(JSON.stringify({ error: 'User tidak ditemukan' }), { status: 401, headers: { 'Content-Type': 'application/json' }});
      const user = JSON.parse(userStr);
      if (user.passwordHash !== hashedPw) return new Response(JSON.stringify({ error: 'Password salah' }), { status: 401, headers: { 'Content-Type': 'application/json' }});
      return new Response(JSON.stringify({ token: user.id, username: user.username }), { headers: { 'Content-Type': 'application/json' }});
    }

    return new Response('Action not found', { status: 404 });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Terjadi kesalahan' }), { status: 500, headers: { 'Content-Type': 'application/json' }});
  }
}

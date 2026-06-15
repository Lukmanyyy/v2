interface Env {
  finansialv2: any; // KVNamespace
}

// Helper to hash password
async function hashPassword(password: string) {
  const enc = new TextEncoder();
  const data = enc.encode(password + "saltYsalt"); // Basic salting
  const hash = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hash));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export async function onRequest({ request, env }: { request: Request, env: Env }) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { action, username, password, telegramId, newPassword } = await request.json();

    // 1. FITUR CARI AKUN BERDASARKAN ID TELEGRAM
    if (action === 'get_tg_accounts') {
      if (!telegramId) return new Response(JSON.stringify({ error: 'Telegram ID dibutuhkan' }), { status: 400 });
      
      const list = await env.finansialv2.list({ prefix: 'user:' });
      const accounts = [];
      
      for (const key of list.keys) {
        const userStr = await env.finansialv2.get(key.name);
        if (userStr) {
          const user = JSON.parse(userStr);
          // Cek kecocokan (dijadikan string biar aman)
          if (user.telegramId && String(user.telegramId) === String(telegramId)) {
            accounts.push(user.username);
          }
        }
      }
      return new Response(JSON.stringify({ accounts }), { headers: { 'Content-Type': 'application/json' }});
    }

    // 2. FITUR RESET PASSWORD VIA TELEGRAM
    if (action === 'reset_password') {
      if (!telegramId || !username || !newPassword) return new Response(JSON.stringify({ error: 'Data tidak lengkap' }), { status: 400 });
      
      const userKey = `user:${username.toLowerCase()}`;
      const userStr = await env.finansialv2.get(userKey);
      
      if (!userStr) return new Response(JSON.stringify({ error: 'User tidak ditemukan' }), { status: 404 });
      
      const user = JSON.parse(userStr);
      if (String(user.telegramId) !== String(telegramId)) {
        return new Response(JSON.stringify({ error: 'Akses ditolak. Telegram ID tidak cocok.' }), { status: 403 });
      }

      // Hash password baru dan simpan
      user.passwordHash = await hashPassword(newPassword);
      await env.finansialv2.put(userKey, JSON.stringify(user));

      return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' }});
    }

    // 3. FITUR REGISTER
    if (action === 'register') {
      if (!username || !password) return new Response(JSON.stringify({ error: 'Username dan password diperlukan' }), { status: 400 });
      const hashedPw = await hashPassword(password);
      const userKey = `user:${username.toLowerCase()}`;

      const existing = await env.finansialv2.get(userKey);
      if (existing) {
        return new Response(JSON.stringify({ error: 'Username sudah digunakan' }), { status: 400, headers: { 'Content-Type': 'application/json' }});
      }

      const id = crypto.randomUUID();
      const userData: any = { id, username, passwordHash: hashedPw };
      if (telegramId) userData.telegramId = telegramId;

      await env.finansialv2.put(userKey, JSON.stringify(userData));
      return new Response(JSON.stringify({ token: id, username }), { headers: { 'Content-Type': 'application/json' }});
    } 
    
    // 4. FITUR LOGIN
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

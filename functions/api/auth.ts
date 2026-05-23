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
    const { action, username, password } = await request.json();
    
    if (!username || !password) {
      return new Response(JSON.stringify({ error: 'Username dan password diperlukan' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const hashedPw = await hashPassword(password);
    const userKey = `user:${username.toLowerCase()}`;

    if (action === 'register') {
      const existing = await env.finansialv2.get(userKey);
      if (existing) {
        return new Response(JSON.stringify({ error: 'Username sudah digunakan' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const id = crypto.randomUUID();
      await env.finansialv2.put(userKey, JSON.stringify({
        id,
        username,
        passwordHash: hashedPw
      }));

      return new Response(JSON.stringify({ token: id, username }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } 
    
    if (action === 'login') {
      const userStr = await env.finansialv2.get(userKey);
      if (!userStr) {
        return new Response(JSON.stringify({ error: 'User tidak ditemukan' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const user = JSON.parse(userStr);
      if (user.passwordHash !== hashedPw) {
        return new Response(JSON.stringify({ error: 'Password salah' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ token: user.id, username: user.username }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response('Action not found', { status: 404 });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Terjadi kesalahan' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

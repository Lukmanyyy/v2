interface Env {
  finansialv2: any; // KVNamespace
}

export async function onRequest({ request, env }: { request: Request, env: Env }) {
  const authHeader = request.headers.get('Authorization');
  let userId = 'default_user';
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    userId = authHeader.substring(7);
  } else {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const dataKey = `data_${userId}`;

  if (request.method === 'GET') {
    try {
      const data = await env.finansialv2.get(dataKey);
      return new Response(data || JSON.stringify({ transactions: [], accounts: [] }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: 'KV DB not found' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  if (request.method === 'POST') {
    try {
      const body = await request.text();
      await env.finansialv2.put(dataKey, body);
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Failed to write to KV' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  return new Response('Method not allowed', { status: 405 });
}

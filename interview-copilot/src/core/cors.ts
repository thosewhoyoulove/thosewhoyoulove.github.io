const blogOrigin = 'https://thosewhoyoulove.github.io';

export function cors(request?: Request): { allowed: boolean; headers: Record<string, string> } {
  const origin = request?.headers.get('origin');
  const headers: Record<string, string> = { Vary: 'Origin' };
  if (!origin || (request && origin === new URL(request.url).origin)) return { allowed: true, headers };
  if (origin !== blogOrigin && origin !== process.env.COPILOT_ORIGIN) return { allowed: false, headers };
  return { allowed: true, headers: { ...headers, 'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '600' } };
}

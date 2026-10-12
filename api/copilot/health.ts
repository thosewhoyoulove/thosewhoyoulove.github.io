import { getCopilot } from '../../interview-copilot/src/core/vercelRuntime.js';
import { cors } from '../../interview-copilot/src/core/cors.js';

export async function GET(request?: Request): Promise<Response> {
  const { allowed, headers } = cors(request);
  if (!allowed) return new Response('Origin not allowed', { status: 403, headers });
  try {
    const { articles, mode } = await getCopilot();
    return Response.json({ ok: true, mode, articles, protocol: 2,
      capabilities: { textDeltas: mode === 'cursor', callIds: true, eventIds: true } }, { headers });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : 'Agent unavailable' }, { status: 503, headers });
  }
}

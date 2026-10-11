import { getCopilot } from '../../interview-copilot/src/core/vercelRuntime.js';

export async function GET(): Promise<Response> {
  try {
    const { articles, mode } = await getCopilot();
    return Response.json({ ok: true, mode, articles });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : 'Agent unavailable' }, { status: 503 });
  }
}

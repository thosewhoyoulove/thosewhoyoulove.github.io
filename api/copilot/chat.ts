import { z } from 'zod';
import { getCopilot } from '../../interview-copilot/src/core/vercelRuntime.js';
import { cors } from '../../interview-copilot/src/core/cors.js';
import { createEventStream } from '../../interview-copilot/src/core/eventStream.js';

const requestSchema = z.object({
  messages: z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().min(1).max(4000) })).min(1).max(12),
});

export async function POST(request: Request): Promise<Response> {
  const { allowed, headers } = cors(request);
  if (!allowed) return new Response('Origin not allowed', { status: 403, headers });
  if (Number(request.headers.get('content-length') ?? 0) > 50000) return new Response('Request too large', { status: 413, headers });
  let parsed: ReturnType<typeof requestSchema.safeParse>;
  try { parsed = requestSchema.safeParse(await request.json()); }
  catch { return new Response('Invalid JSON', { status: 400, headers }); }
  if (!parsed.success || parsed.data.messages.at(-1)?.role !== 'user') return new Response('Invalid messages', { status: 400, headers });

  let runtime: Awaited<ReturnType<typeof getCopilot>>['runtime'];
  try { ({ runtime } = await getCopilot()); }
  catch (error) { return new Response(error instanceof Error ? error.message : 'Agent unavailable', { status: 503, headers }); }

  const abort = new AbortController();
  const cancel = () => abort.abort();
  request.signal.addEventListener('abort', cancel, { once: true });
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      const emit = createEventStream(frame => {
        if (!abort.signal.aborted) controller.enqueue(encoder.encode(frame));
      });
      void runtime.run(parsed.data.messages, emit, abort.signal).finally(() => {
        request.signal.removeEventListener('abort', cancel);
        if (!abort.signal.aborted) controller.close();
      });
    },
    cancel() { abort.abort(); request.signal.removeEventListener('abort', cancel); },
  });
  return new Response(body, { headers: { ...headers, 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform', 'X-Accel-Buffering': 'no' } });
}

export function OPTIONS(request: Request): Response {
  const { allowed, headers } = cors(request);
  return new Response(null, { status: allowed ? 204 : 403, headers });
}

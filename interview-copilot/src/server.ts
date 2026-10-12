import { createServer } from 'node:http';
import { z } from 'zod';
import { ArticleIndex, registerArticleTools } from './core/articles.js';
import { createRuntime } from './core/runtimeFactory.js';
import { ToolRegistry } from './core/tools.js';
import { createEventStream } from './core/eventStream.js';

const requestSchema = z.object({
  messages: z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().min(1).max(4000) })).min(1).max(12),
});
const index = new ArticleIndex();
await index.load();
const registry = new ToolRegistry();
registerArticleTools(registry, index);
const { mode, runtime } = createRuntime(registry);
const port = Number(process.env.PORT ?? 8787);
const allowedOrigin = process.env.COPILOT_ORIGIN;
const localOrigins = new Set(['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173', 'http://127.0.0.1:5173']);

createServer(async (req, res) => {
  const origin = req.headers.origin;
  const originAllowed = origin && (origin === allowedOrigin || (!allowedOrigin && localOrigins.has(origin)));
  if (originAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  if (req.url === '/api/copilot/health' && req.method === 'GET') {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: true, mode, articles: index.count(), protocol: 2,
      capabilities: { textDeltas: mode === 'cursor', callIds: true, eventIds: true } }));
    return;
  }
  if (req.url !== '/api/copilot/chat' || (req.method !== 'POST' && req.method !== 'OPTIONS')) {
    res.writeHead(404).end(); return;
  }
  if (origin && !originAllowed) { res.writeHead(403).end(); return; }
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' }).end(); return;
  }
  const chunks: Buffer[] = [];
  let length = 0;
  try {
    for await (const chunk of req) {
      length += chunk.length;
      if (length > 50000) { res.writeHead(413).end(); return; }
      chunks.push(chunk);
    }
    const parsed = requestSchema.safeParse(JSON.parse(Buffer.concat(chunks).toString('utf8')));
    if (!parsed.success || parsed.data.messages.at(-1)?.role !== 'user') { res.writeHead(400).end('Invalid messages'); return; }
    res.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
    const controller = new AbortController();
    res.on('close', () => controller.abort());
    const emit = createEventStream(frame => { if (!res.destroyed) res.write(frame); });
    await runtime.run(parsed.data.messages, emit, controller.signal);
    res.end();
  } catch {
    if (!res.headersSent) res.writeHead(400).end('Invalid JSON');
    else res.end();
  }
}).listen(port, () => console.log(`Interview Copilot (${mode}, ${index.count()} articles) listening on http://127.0.0.1:${port}`));

import { z } from 'zod/mini';

export type Frame = { event: string; data: string; id?: string };
/** SSE line parser; preserves CRLF boundaries, comments and multiline data. */
export class AgentStreamParser {
  private buffer = '';
  private data: string[] = [];
  private dataSize = 0;
  private event = '';
  private id: string | undefined;
  push(chunk: string): Frame[] {
    this.buffer += chunk;
    if (this.buffer.length > 1_000_000) throw new Error('流式事件过大');
    const frames: Frame[] = [];
    while (true) {
      const index = this.buffer.search(/[\r\n]/);
      if (index < 0 || (this.buffer[index] === '\r' && index === this.buffer.length - 1)) break;
      const line = this.buffer.slice(0, index);
      const width = this.buffer[index] === '\r' && this.buffer[index + 1] === '\n' ? 2 : 1;
      this.buffer = this.buffer.slice(index + width);
      if (!line) {
        if (this.data.length) frames.push({ event: this.event || 'message', data: this.data.join('\n'), id: this.id });
        this.data = []; this.dataSize = 0; this.event = ''; this.id = undefined;
      } else if (!line.startsWith(':')) {
        const colon = line.indexOf(':');
        const field = colon < 0 ? line : line.slice(0, colon);
        const value = colon < 0 ? '' : line.slice(colon + 1).replace(/^ /, '');
        if (field === 'data') { this.data.push(value); this.dataSize += value.length; }
        if (field === 'event') this.event = value;
        if (field === 'id' && !value.includes('\0')) this.id = value;
        if (this.dataSize > 1_000_000) throw new Error('流式事件过大');
      }
    }
    return frames;
  }
}

const citation = z.object({ title: z.string(), path: z.string(), url: z.string(), heading: z.optional(z.string()) });
const protocol = z.discriminatedUnion('type', [
  z.object({ type: z.literal('stream_start'), textDeltas: z.boolean(), demo: z.boolean(), provider: z.optional(z.string()) }),
  z.object({ type: z.literal('message'), text: z.string(), demo: z.boolean(), provider: z.optional(z.string()), citations: z.array(citation) }),
  z.object({ type: z.literal('message_delta'), text: z.string() }),
  z.object({ type: z.literal('tool_start'), name: z.string(), arguments: z.unknown() }),
  z.object({ type: z.literal('tool_result'), name: z.string(), result: z.unknown() }),
  z.object({ type: z.literal('error'), message: z.string() }),
  z.object({ type: z.literal('done'), reason: z.enum(['completed', 'cancelled', 'limit', 'error']) }),
]);
export type UIEvent = z.infer<typeof protocol> & { eventId?: string; requestId?: string; callId?: string };
export class AgentEventAdapter {
  private seen = new Set<string>();
  constructor(private requestId?: string) {}
  adapt(frame: Frame): UIEvent | undefined {
    const value = JSON.parse(frame.data) as Record<string, unknown>;
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('收到无效的 Agent 事件');
    const parsed = protocol.safeParse(value);
    // Unknown extension events (including private reasoning) are never displayed.
    if (!parsed.success) {
      if (typeof value.type === 'string' && !['stream_start', 'message', 'message_delta', 'tool_start', 'tool_result', 'error', 'done'].includes(value.type)) return;
      throw new Error('收到无效的 Agent 事件');
    }
    if (frame.event !== 'message' && frame.event !== parsed.data.type) throw new Error('SSE 事件名与数据类型不一致');
    const string = (...fields: unknown[]) => fields.find(field => typeof field === 'string' && field.length) as string | undefined;
    const requestId = string(value.request_id, value.requestId);
    if (this.requestId && requestId && requestId !== this.requestId) return;
    if (!this.requestId && requestId) this.requestId = requestId;
    const eventId = string(frame.id, value.event_id, value.eventId);
    if (eventId) {
      const key = `${requestId || ''}:${eventId}`;
      if (this.seen.has(key)) return;
      if (this.seen.size >= 10000) throw new Error('事件数量超过限制');
      this.seen.add(key);
    }
    return { ...parsed.data, requestId, eventId, callId: string(value.call_id, value.callId) };
  }
}

export async function consumeAgentStream(response: Response, signal: AbortSignal, onEvent: (event: UIEvent) => void) {
  if (!response.body) throw new Error('没有收到响应流');
  const reader = response.body.getReader();
  const parser = new AgentStreamParser(), adapter = new AgentEventAdapter();
  const decoder = new TextDecoder();
  let done = false;
  const cancel = () => { void reader.cancel().catch(() => {}); };
  signal.addEventListener('abort', cancel, { once: true });
  try {
    while (!done) {
      signal.throwIfAborted();
      const chunk = await reader.read();
      signal.throwIfAborted();
      if (chunk.done) break;
      for (const frame of parser.push(decoder.decode(chunk.value, { stream: true }))) {
        signal.throwIfAborted();
        const event = adapter.adapt(frame);
        if (!event) continue;
        onEvent(event);
        if (event.type === 'done') { done = true; break; }
      }
    }
    if (!done) throw new Error('连接已中断，未收到结束事件。请重试。');
  } finally {
    signal.removeEventListener('abort', cancel);
    await reader.cancel().catch(() => {}); reader.releaseLock();
  }
}

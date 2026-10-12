import { describe, expect, it, vi, afterEach } from 'vitest';
import { AgentEventAdapter, AgentStreamParser, consumeAgentStream, type UIEvent } from './stream.js';
import { AgentStateMachine, initialState, reduceAgent, safeUrl } from './state.js';
import { shouldExpand } from './ThinkingPanel.js';
import { markdownBlocks } from './StreamingAnswer.js';
afterEach(() => vi.unstubAllGlobals());

describe('SSE parsing and adaptation', () => {
  it('handles every possible character split, CRLF, comments and multiline data', () => {
    const wire = ': ping\r\nid: 1\r\nevent: message_delta\r\ndata: {"type":"message_delta",\r\ndata: "text":"你好"}\r\n\r\nevent: done\r\ndata: {"type":"done","reason":"completed"}\r\n\r\n';
    for (let split = 0; split <= wire.length; split++) {
      const parser = new AgentStreamParser(), adapter = new AgentEventAdapter();
      const frames = [...parser.push(wire.slice(0, split)), ...parser.push(wire.slice(split))];
      expect(frames.map(frame => adapter.adapt(frame)?.type)).toEqual(['message_delta', 'done']);
      expect(adapter.adapt(frames[0])).toBeUndefined();
    }
  });
  it('deduplicates actual IDs, keeps unlabelled repeated tokens and rejects wrong request IDs', () => {
    const adapter = new AgentEventAdapter('wanted');
    const frame = (extra: object = {}) => ({ event: 'message_delta', data: JSON.stringify({ type: 'message_delta', text: 'x', ...extra }) });
    expect(adapter.adapt(frame({ event_id: '1', request_id: 'wanted' }))).toBeDefined();
    expect(adapter.adapt(frame({ event_id: '1', request_id: 'wanted' }))).toBeUndefined();
    expect(adapter.adapt(frame({ request_id: 'old' }))).toBeUndefined();
    expect(adapter.adapt(frame())).toBeDefined(); expect(adapter.adapt(frame())).toBeDefined();
  });
  it('ignores private reasoning and validates malformed known events', () => {
    const adapter = new AgentEventAdapter();
    expect(adapter.adapt({ event: 'thinking', data: '{"type":"thinking","text":"private"}' })).toBeUndefined();
    expect(() => adapter.adapt({ event: 'message_delta', data: '{"type":"message_delta","text":3}' })).toThrow('无效');
  });
  it('decodes UTF-8 bytes split one at a time and stops at done', async () => {
    const bytes = new TextEncoder().encode('event: message_delta\ndata: {"type":"message_delta","text":"中文"}\n\nevent: done\ndata: {"type":"done","reason":"completed"}\n\n');
    const response = new Response(new ReadableStream({ start(controller) { bytes.forEach(byte => controller.enqueue(new Uint8Array([byte]))); controller.close(); } }));
    const events: UIEvent[] = [];
    await consumeAgentStream(response, new AbortController().signal, event => events.push(event));
    expect(events[0]).toMatchObject({ text: '中文' }); expect(events.length).toBe(2);
  });
  it('reports interruption and cancels the reader without delivering late events', async () => {
    const abort = new AbortController(), cancel = vi.fn();
    const response = new Response(new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('event: message_delta\ndata: {"type":"message_delta","text":"x"}\n\n')); }, cancel }));
    const events: UIEvent[] = [];
    await expect(consumeAgentStream(response, abort.signal, event => { events.push(event); abort.abort(); })).rejects.toThrow();
    expect(events.length).toBe(1); expect(cancel).toHaveBeenCalledOnce();
    await expect(consumeAgentStream(new Response(''), new AbortController().signal, () => {})).rejects.toThrow('中断');
  });
});

describe('Agent state and trace', () => {
  it('tracks same-name parallel tools independently, including results before starts', () => {
    let state = initialState(0);
    state = reduceAgent(state, { type: 'tool_start', name: 'search_articles', callId: 'a', arguments: { query: 'A', api_key: 'SECRET' } }, 1);
    state = reduceAgent(state, { type: 'tool_start', name: 'search_articles', callId: 'b', arguments: { query: 'B' } }, 2);
    state = reduceAgent(state, { type: 'tool_result', name: 'search_articles', callId: 'b', result: [] }, 10);
    expect(state.steps.map(step => step.status)).toEqual(['running', 'completed']);
    expect(JSON.stringify(state.steps)).not.toContain('SECRET');
    state = reduceAgent(state, { type: 'tool_result', name: 'read_article', callId: 'c', result: { title: 'article', url: '/#/md/a.md' } }, 12);
    state = reduceAgent(state, { type: 'tool_start', name: 'read_article', callId: 'c', arguments: {} }, 13);
    expect(state.steps[2].status).toBe('completed'); expect(state.steps[2].duration).toBeUndefined();
  });
  it('falls back to sequential matching without inventing backend IDs', () => {
    let state = reduceAgent(initialState(), { type: 'tool_start', name: 'read_article', arguments: {} });
    state = reduceAgent(state, { type: 'tool_result', name: 'read_article', result: { error: 'backend internal credential' } });
    expect(state.steps.length).toBe(1); expect(state.steps[0].status).toBe('failed');
    expect(state.steps[0].metadata.correlated).toBe(false); expect(JSON.stringify(state.steps)).not.toContain('credential');
  });
  it('reconciles streamed text to authoritative final message and freezes terminal states', () => {
    let state = reduceAgent(initialState(), { type: 'message_delta', text: 'partial' });
    state = reduceAgent(state, { type: 'message', text: 'final', demo: false, citations: [] });
    state = reduceAgent(state, { type: 'done', reason: 'completed' });
    expect(state.text).toBe('final'); expect(state.phase).toBe('completed');
    expect(reduceAgent(state, { type: 'message_delta', text: 'late' })).toBe(state);
    expect(reduceAgent(initialState(), { type: 'done', reason: 'completed' }).phase).toBe('failed');
  });
  it('cancellation terminates running steps and different stores cannot pollute each other', () => {
    const first = new AgentStateMachine(), second = new AgentStateMachine();
    first.dispatch({ type: 'tool_start', name: 'read_article', arguments: {} }); first.stop(true, 'cancelled');
    first.dispatch({ type: 'message_delta', text: 'late' });
    expect(first.snapshot().phase).toBe('cancelled'); expect(first.snapshot().steps[0].status).toBe('cancelled');
    expect(first.snapshot().text).toBe(''); expect(second.snapshot().text).toBe('');
  });
  it('batches rapid deltas once per animation frame and removes scheduled work on disposal', () => {
    let callback!: FrameRequestCallback;
    const raf = vi.fn((cb: FrameRequestCallback) => { callback = cb; return 1; }), cancel = vi.fn();
    vi.stubGlobal('requestAnimationFrame', raf); vi.stubGlobal('cancelAnimationFrame', cancel);
    const store = new AgentStateMachine(), listener = vi.fn(); store.subscribe(listener);
    for (let index = 0; index < 100; index++) store.dispatch({ type: 'message_delta', text: 'x' });
    expect(listener).not.toHaveBeenCalled(); expect(raf).toHaveBeenCalledOnce();
    callback(0); expect(listener).toHaveBeenCalledOnce(); expect(store.snapshot().text.length).toBe(100);
    store.dispatch({ type: 'message_delta', text: 'discard' }); store.dispose(); expect(cancel).toHaveBeenCalledOnce();
  });
  it('respects manual expansion and rejects unsafe source links', () => {
    expect(shouldExpand(undefined, false, true)).toBe(true);
    expect(shouldExpand(undefined, true, true)).toBe(false);
    expect(shouldExpand(true, true, false)).toBe(true);
    expect(shouldExpand(false, false, true)).toBe(false);
    expect(safeUrl('javascript:alert(1)')).toBeUndefined(); expect(safeUrl('//unknown.example')).toBeUndefined();
  });
  it('does not split fenced code blocks on blank lines', () => {
    const blocks = markdownBlocks('text\n\n```js\nconst x = 1;\n\nconst y = 2;\n```\n\ntail');
    expect(blocks.length).toBe(3); expect(blocks[1]).toContain('const x'); expect(blocks[1]).toContain('const y');
  });
});

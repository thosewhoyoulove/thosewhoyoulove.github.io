import { describe, expect, it, vi } from 'vitest';
import type { AgentOptions, RunResult, SDKMessage } from '@cursor/sdk';
import { ArticleIndex, registerArticleTools } from './articles.js';
import { CursorRuntime, type CursorSdk } from './cursorRuntime.js';
import { createRuntime } from './runtimeFactory.js';
import { ToolRegistry } from './tools.js';
import type { AgentEvent } from '../shared.js';

function fakeSdk(work: (options: AgentOptions) => Promise<RunResult>, createDelay = 0, messages: SDKMessage[] = []) {
  const dispose = vi.fn(async () => {});
  const cancel = vi.fn(async () => {});
  const send = vi.fn(async (_prompt: string) => ({
    wait: () => work(create.mock.calls[0][0]),
    async *stream() { for (const message of messages) yield message; }, supports: () => true, cancel,
  }));
  const create = vi.fn(async (_options: AgentOptions) => {
    if (createDelay) await new Promise(resolve => setTimeout(resolve, createDelay));
    return { send, [Symbol.asyncDispose]: dispose };
  });
  const sdk = { Agent: { create }, JsonlLocalAgentStore: class {} } as unknown as CursorSdk;
  return { sdk, create, send, dispose, cancel };
}

describe('Cursor runtime (mock SDK, no paid inference)', () => {
  it('streams only public assistant text and binds tool start/result to the actual SDK call ID', async () => {
    const index = new ArticleIndex(); await index.load();
    const registry = new ToolRegistry(); registerArticleTools(registry, index);
    const ids = { agent_id: 'agent-test', run_id: 'run-test' };
    const fake = fakeSdk(async options => {
      await options.local!.customTools!.search_articles.execute({ query: 'React' }, { toolCallId: 'sdk-call-1' });
      return { id: 'run-test', status: 'finished', result: '权威最终答案' };
    }, 0, [
      { ...ids, type: 'thinking', text: 'PRIVATE_THOUGHT' },
      { ...ids, type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: '真实' }, { type: 'tool_use', id: 'internal', name: 'internal', input: 'PRIVATE_PAYLOAD' }] } },
      { ...ids, type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: '流式' }] } },
    ]);
    const events: AgentEvent[] = [];
    await new CursorRuntime('key', 'model', registry, {}, async () => fake.sdk).run([{ role: 'user', content: 'React' }], event => events.push(event));
    expect(events.filter(event => event.type === 'message_delta').map(event => event.text)).toEqual(['真实', '流式']);
    expect(events.find(event => event.type === 'stream_start')).toMatchObject({ textDeltas: true, demo: false });
    expect(events.find(event => event.type === 'message')).toMatchObject({ text: '权威最终答案' });
    expect(events.filter(event => event.type === 'tool_start' || event.type === 'tool_result').map(event => event.callId)).toEqual(['sdk-call-1', 'sdk-call-1']);
    expect(JSON.stringify(events)).not.toContain('PRIVATE_');
  });
  it('routes real article tools through MCP callbacks, preserves history/citations and disposes', async () => {
    const index = new ArticleIndex(); await index.load();
    const registry = new ToolRegistry(); registerArticleTools(registry, index);
    const fake = fakeSdk(async options => {
      expect(options.tools).toEqual(['mcp']);
      expect(options.local?.settingSources).toEqual([]);
      expect(options.local?.enableAgentRetries).toBe(false);
      expect(options.apiKey).toBe('crsr_test');
      expect(options.model?.id).toBe('composer-test');
      const tools = options.local!.customTools!;
      const hits = await tools.search_articles.execute({ query: 'React Hooks' }, {});
      const parsed = JSON.parse((hits as { content: [{ text: string }] }).content[0].text);
      await tools.read_article.execute({ path: parsed[0].path }, {});
      return { id: 'test', status: 'finished', result: '有引用的回答' };
    });
    const events: AgentEvent[] = [];
    await new CursorRuntime('crsr_test', 'composer-test', registry, {}, async () => fake.sdk).run([
      { role: 'assistant', content: '上一轮回答' }, { role: 'user', content: '继续解释 React Hooks' },
    ], event => events.push(event));
    expect(fake.send).toHaveBeenCalledWith(expect.stringContaining('上一轮回答'));
    expect(events.filter(event => event.type === 'tool_start').map(event => event.name)).toEqual(['search_articles', 'read_article']);
    const answer = events.find(event => event.type === 'message');
    expect(answer).toMatchObject({ demo: false, provider: 'Cursor · composer-test' });
    if (answer?.type === 'message') expect(answer.citations[0].url).toMatch(/^\/#\/md\//);
    expect(events.at(-1)).toEqual({ type: 'done', reason: 'completed' });
    expect(fake.dispose).toHaveBeenCalledOnce();
  });

  it('validates arguments and stops before executing tools beyond the budget', async () => {
    const index = new ArticleIndex(); await index.load();
    const registry = new ToolRegistry(); registerArticleTools(registry, index);
    const execute = vi.spyOn(registry, 'execute');
    const fake = fakeSdk(async options => {
      const tool = options.local!.customTools!.search_articles;
      const invalid = await tool.execute({ query: '' }, {});
      expect(invalid).toMatchObject({ isError: true });
      await tool.execute({ query: 'React' }, {});
      return { id: 'test', status: 'finished', result: 'should not emit' };
    });
    const events: AgentEvent[] = [];
    await new CursorRuntime('key', 'model', registry, { maxToolCalls: 1 }, async () => fake.sdk).run([{ role: 'user', content: 'React' }], event => events.push(event));
    expect(execute).toHaveBeenCalledTimes(1);
    expect(events.at(-1)).toEqual({ type: 'done', reason: 'limit' });
    expect(events.some(event => event.type === 'message')).toBe(false);
  });

  it('cancels a timed out run and closes the SDK handle', async () => {
    let finish!: (value: RunResult) => void;
    const fake = fakeSdk(() => new Promise(resolve => { finish = resolve; }));
    fake.cancel.mockImplementation(async () => { finish({ id: 'test', status: 'cancelled' }); });
    const events: AgentEvent[] = [];
    await new CursorRuntime('key', 'model', new ToolRegistry(), { timeoutMs: 80 }, async () => fake.sdk).run([{ role: 'user', content: 'test' }], event => events.push(event));
    expect(events.at(-1)).toEqual({ type: 'done', reason: 'error' });
    expect(events).toContainEqual({ type: 'error', message: 'Request timed out' });
    expect(fake.cancel).toHaveBeenCalledOnce();
    await vi.waitFor(() => expect(fake.dispose).toHaveBeenCalledOnce());
  });

  it('disposes a late agent after cancellation during startup without sending a prompt', async () => {
    const fake = fakeSdk(async () => ({ id: 'test', status: 'finished', result: 'unused' }), 80);
    const abort = new AbortController();
    const events: AgentEvent[] = [];
    const pending = new CursorRuntime('key', 'model', new ToolRegistry(), {}, async () => fake.sdk).run([{ role: 'user', content: 'test' }], event => events.push(event), abort.signal);
    await vi.waitFor(() => expect(fake.create).toHaveBeenCalledOnce());
    abort.abort(); await pending;
    expect(events.at(-1)).toEqual({ type: 'done', reason: 'cancelled' });
    await vi.waitFor(() => expect(fake.dispose).toHaveBeenCalledOnce());
    expect(fake.send).not.toHaveBeenCalled();
  });

  it('never emits raw SDK errors and requires server credentials', async () => {
    const fake = fakeSdk(async () => { throw new Error('Bearer secret-key'); });
    const events: AgentEvent[] = [];
    await new CursorRuntime('key', 'model', new ToolRegistry(), {}, async () => fake.sdk).run([{ role: 'user', content: 'test' }], event => events.push(event));
    expect(JSON.stringify(events)).not.toContain('secret-key');
    expect(events.at(-1)).toEqual({ type: 'done', reason: 'error' });
    expect(() => createRuntime(new ToolRegistry(), { COPILOT_MODE: 'cursor' })).toThrow('CURSOR_API_KEY');
    expect(createRuntime(new ToolRegistry(), { COPILOT_MODE: 'cursor', CURSOR_API_KEY: 'crsr_test' }).mode).toBe('cursor');
  });
});

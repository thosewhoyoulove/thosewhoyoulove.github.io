import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { ArticleIndex, registerArticleTools } from './articles.js';
import { MockModel, type ModelAdapter } from './model.js';
import { AgentRuntime } from './runtime.js';
import { ToolRegistry } from './tools.js';
import type { AgentEvent } from '../shared.js';

describe('article tools', () => {
  it('searches the repository and reads a real article with its Docsify URL', async () => {
    const index = new ArticleIndex();
    await index.load();
    expect(index.count()).toBeGreaterThan(100);
    const registry = new ToolRegistry();
    registerArticleTools(registry, index);
    const signal = new AbortController().signal;
    const hits = await registry.execute('search_articles', { query: 'React Hooks' }, { signal }) as Array<{ path: string; url: string }>;
    expect(hits.length).toBeGreaterThan(0);
    const article = await registry.execute('read_article', { path: hits[0].path }, { signal }) as { content: string; url: string };
    expect(article.content.length).toBeGreaterThan(100);
    expect(article.url).toMatch(/^\/#\/md\//);
    await expect(registry.execute('read_article', { path: '../index.html' }, { signal })).rejects.toThrow('Article not found');
    await expect(registry.execute('search_articles', { query: '' }, { signal })).rejects.toThrow('Invalid');
  });
});

describe('agent loop', () => {
  it('executes search then read and emits a cited demo answer', async () => {
    const index = new ArticleIndex(); await index.load();
    const registry = new ToolRegistry(); registerArticleTools(registry, index);
    const events: AgentEvent[] = [];
    await new AgentRuntime(new MockModel(), registry).run([{ role: 'user', content: 'React Hooks' }], event => events.push(event));
    expect(events.filter(event => event.type === 'tool_start').map(event => event.name)).toEqual(['search_articles', 'read_article']);
    const answer = events.find(event => event.type === 'message');
    expect(answer).toMatchObject({ type: 'message', demo: true });
    if (answer?.type === 'message') expect(answer.citations.length).toBeGreaterThan(0);
    expect(events.at(-1)).toEqual({ type: 'done', reason: 'completed' });
  });

  it('rejects bad arguments before executing and stops at the call limit', async () => {
    let executed = false;
    const registry = new ToolRegistry();
    registry.register({ name: 'test', description: '', schema: z.object({ value: z.number() }), parameters: {}, async execute() { executed = true; return 1; } });
    const model: ModelAdapter = { demo: true, async decide() { return { kind: 'tools', calls: [{ id: 'x', name: 'test', arguments: { value: 'bad' } }] }; } };
    const events: AgentEvent[] = [];
    await new AgentRuntime(model, registry, { maxToolCalls: 1 }).run([{ role: 'user', content: 'test' }], event => events.push(event));
    expect(executed).toBe(false);
    expect(events.some(event => event.type === 'tool_result' && JSON.stringify(event.result).includes('Invalid'))).toBe(true);
    expect(events.at(-1)).toEqual({ type: 'done', reason: 'limit' });
  });

  it('honors cancellation', async () => {
    const registry = new ToolRegistry();
    const model: ModelAdapter = { demo: true, async decide(_messages, _tools, signal) { await new Promise<void>((_resolve, reject) => signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true })); return { kind: 'final', text: '' }; } };
    const abort = new AbortController();
    const events: AgentEvent[] = [];
    const pending = new AgentRuntime(model, registry).run([{ role: 'user', content: 'test' }], event => events.push(event), abort.signal);
    abort.abort(); await pending;
    expect(events.at(-1)).toEqual({ type: 'done', reason: 'cancelled' });
  });
});

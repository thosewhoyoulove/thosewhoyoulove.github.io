import type { Citation } from '../../shared.js';
import type { UIEvent } from './stream.js';

export type Phase = 'idle' | 'thinking' | 'searching' | 'executing' | 'composing' | 'completed' | 'failed' | 'cancelled';
export type StepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
export type TimelineStep = { id: string; type: string; title: string; description: string; status: StepStatus; startedAt?: number; completedAt?: number; duration?: number; metadata: { links?: { title: string; url: string; snippet?: string }[]; query?: string; correlated: boolean } };
export type AgentState = { phase: Phase; steps: TimelineStep[]; text: string; citations: Citation[]; demo: boolean; provider?: string; error?: string; startedAt: number; completedAt?: number; terminal: boolean; streaming: boolean; version: number };
export const terminalPhase = (phase: Phase) => ['completed', 'failed', 'cancelled'].includes(phase);
export function initialState(now = Date.now(), demo = false): AgentState { return { phase: 'idle', steps: [], text: '', citations: [], demo, startedAt: now, terminal: false, streaming: false, version: 0 }; }
export const safeUrl = (url: unknown): string | undefined => {
  if (typeof url !== 'string') return;
  if (/^\/#\/md\//.test(url)) return url;
  try { const parsed = new URL(url); if (['https:', 'http:'].includes(parsed.protocol) && !parsed.username && !parsed.password) return url; } catch {}
};
const title = (name: string) => ({ search_articles: '检索博客文章', read_article: '读取相关文章', web_search: '搜索网络来源', search_knowledge: '检索知识库' }[name] || '执行工具');
const bounded = (text: unknown, length = 180) => typeof text === 'string' ? text.slice(0, length) : '';
export function reduceAgent(state: AgentState, event: UIEvent, now = Date.now()): AgentState {
  if (state.terminal) return state;
  if (state.error && event.type !== 'done') return state;
  const next = { ...state, version: state.version + 1 };
  if (event.type === 'message_delta') return { ...next, text: state.text + event.text, streaming: true, phase: state.steps.some(step => step.status === 'running') ? state.phase : 'composing' };
  if (event.type === 'message') return { ...next, text: event.text, demo: event.demo, provider: event.provider, citations: event.citations.filter(c => safeUrl(c.url)), phase: 'composing' };
  if (event.type === 'error') return { ...next, phase: 'failed', error: bounded(event.message, 500) };
  if (event.type === 'done') {
    const phase: Phase = event.reason === 'cancelled' ? 'cancelled' : event.reason === 'completed' && !state.error && state.text ? 'completed' : 'failed';
    return { ...next, phase, terminal: true, completedAt: now,
      error: phase === 'failed' ? state.error || '助手未完成回答，请重试。' : state.error,
      steps: state.steps.map(step => step.status === 'running' || step.status === 'pending' ? { ...step, status: phase === 'cancelled' ? 'cancelled' : 'failed', description: phase === 'completed' ? '未收到该工具的结果事件' : '执行已中止', completedAt: now, duration: step.startedAt !== undefined ? Math.max(0, now - step.startedAt) : undefined } : step) };
  }
  const steps = state.steps.slice();
  let index = event.callId ? steps.findIndex(step => step.id === event.callId) : event.type === 'tool_result' ? steps.findIndex(step => step.type === event.name && step.status === 'running' && !step.metadata.correlated) : -1;
  const existing = index >= 0 ? steps[index] : undefined;
  const step: TimelineStep = existing || { id: event.callId || `local-${state.steps.length}-${now}`, type: event.name, title: title(event.name), description: '', status: 'pending', metadata: { correlated: Boolean(event.callId) } };
  if (event.type === 'tool_start') {
    const args = event.arguments && typeof event.arguments === 'object' ? event.arguments as Record<string, unknown> : {};
    const query = bounded(args.query);
    steps[index < 0 ? steps.length : index] = { ...step, status: existing && ['completed', 'failed'].includes(existing.status) ? existing.status : 'running', startedAt: existing?.completedAt !== undefined ? undefined : now,
      description: existing?.completedAt !== undefined ? existing.description : query || (event.name === 'read_article' && typeof args.path === 'string' && args.path.startsWith('md/') ? args.path.split('/').at(-1) || '' : '等待工具返回'), metadata: { ...step.metadata, query: query || undefined } };
  } else {
    const result = event.result;
    const object = result && typeof result === 'object' ? result as Record<string, unknown> : {};
    const failed = 'error' in object;
    const list = Array.isArray(result) ? result : [result];
    const links = list.flatMap(item => {
      if (!item || typeof item !== 'object') return [];
      const record = item as Record<string, unknown>, url = safeUrl(record.url);
      return url && typeof record.title === 'string' ? [{ title: bounded(record.title, 100), url, snippet: bounded(record.snippet) || undefined }] : [];
    });
    const unique = [...new Map(links.map(link => [link.url, link])).values()].slice(0, 8);
    steps[index < 0 ? steps.length : index] = { ...step, status: failed ? 'failed' : 'completed', completedAt: now, duration: step.startedAt === undefined ? undefined : Math.max(0, now - step.startedAt),
      description: failed ? '工具执行失败，请重试或换一个问题' : Array.isArray(result) ? `检索到 ${unique.length} 篇文章 · ${result.length} 条片段` : typeof object.title === 'string' ? `已读取《${bounded(object.title, 100)}》` : '工具执行完成', metadata: { ...step.metadata, links: unique } };
  }
  const running = steps.filter(step => step.status === 'running');
  return { ...next, steps, phase: running.length ? running.some(step => /search/.test(step.type)) ? 'searching' : 'executing' : 'composing' };
}

/** One store per response; request callbacks never write into another response. */
export class AgentStateMachine {
  private state: AgentState;
  private listeners = new Set<() => void>();
  private textFrame?: number;
  private pendingText = '';
  constructor(demo = false) { this.state = initialState(Date.now(), demo); }
  snapshot = () => this.state;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  private publish(state: AgentState) { this.state = state; for (const listener of this.listeners) listener(); }
  start() { this.publish({ ...this.state, phase: 'thinking' }); }
  dispatch(event: UIEvent) {
    if (this.state.terminal) return;
    if (event.type === 'message_delta' && typeof requestAnimationFrame === 'function') {
      this.pendingText += event.text;
      if (this.textFrame === undefined) this.textFrame = requestAnimationFrame(() => { this.textFrame = undefined; this.flush(); });
      return;
    }
    this.flush(); this.publish(reduceAgent(this.state, event));
  }
  private flush() {
    if (this.textFrame !== undefined) { cancelAnimationFrame(this.textFrame); this.textFrame = undefined; }
    if (this.pendingText) { const text = this.pendingText; this.pendingText = ''; this.publish(reduceAgent(this.state, { type: 'message_delta', text })); }
  }
  stop(cancelled: boolean, message: string) {
    if (this.state.terminal) return;
    this.flush();
    this.dispatch({ type: 'error', message }); this.dispatch({ type: 'done', reason: cancelled ? 'cancelled' : 'error' });
  }
  dispose() { if (this.textFrame !== undefined) cancelAnimationFrame(this.textFrame); this.pendingText = ''; this.listeners.clear(); }
}

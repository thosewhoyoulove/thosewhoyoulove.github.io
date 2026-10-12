import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChatTurn } from '../../shared.js';
import { AgentStateMachine } from './state.js';
import { consumeAgentStream } from './stream.js';
import { demoStream, type DemoScenario } from './demo.js';

export type ResponseEntry = { id: number; question: string; store: AgentStateMachine };
export function useAgentStream(apiBase: string, demo?: DemoScenario) {
  const [entries, setEntries] = useState<ResponseEntry[]>([]), [busy, setBusy] = useState(false);
  const entriesRef = useRef<ResponseEntry[]>([]), generation = useRef(0), nextId = useRef(0);
  const active = useRef<{ abort: AbortController; store: AgentStateMachine } | undefined>(undefined);
  const mounted = useRef(true);
  const replace = (next: ResponseEntry[]) => { entriesRef.current = next; if (mounted.current) setEntries(next); };
  const cancel = useCallback(() => {
    generation.current++;
    const current = active.current; active.current = undefined;
    if (current) { current.store.stop(true, '已停止生成'); current.abort.abort(); }
    if (mounted.current) setBusy(false);
  }, []);
  const clear = useCallback(() => { cancel(); entriesRef.current.forEach(entry => entry.store.dispose()); replace([]); }, [cancel]);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; cancel(); entriesRef.current.forEach(entry => entry.store.dispose()); }; }, [cancel]);
  const ask = useCallback(async (question: string, retry = false) => {
    if (!question.trim() || active.current) return;
    const token = ++generation.current;
    const previous = entriesRef.current;
    const base = retry ? previous.slice(0, -1) : previous;
    if (retry) previous.at(-1)?.store.dispose();
    const store = new AgentStateMachine(Boolean(demo)), abort = new AbortController();
    active.current = { store, abort };
    replace([...base, { id: ++nextId.current, question, store }]); setBusy(true); store.start();
    const history: ChatTurn[] = base.flatMap(entry => {
      const state = entry.store.snapshot();
      return state.phase === 'completed' ? [{ role: 'user' as const, content: entry.question }, { role: 'assistant' as const, content: state.text }] : [];
    });
    history.push({ role: 'user', content: question });
    const timeout = setTimeout(() => abort.abort('timeout'), 65000);
    try {
      const emit = (event: Parameters<AgentStateMachine['dispatch']>[0]) => { if (mounted.current && generation.current === token && !abort.signal.aborted) store.dispatch(event); };
      if (demo) await demoStream(demo, abort.signal, emit);
      else {
        const response = await fetch(`${apiBase}/api/copilot/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: history.slice(-12) }), signal: abort.signal });
        if (!response.ok) throw new Error(response.status === 405 ? '聊天 API 地址不接受 POST，请检查后端地址。' : response.status === 503 ? '助手暂不可用，请检查服务端配置。' : `请求失败（${response.status}）`);
        await consumeAgentStream(response, abort.signal, emit);
      }
    } catch (error) {
      if (mounted.current && generation.current === token) store.stop(abort.signal.aborted && abort.signal.reason !== 'timeout', abort.signal.reason === 'timeout' ? '等待超时，请重试。' : error instanceof Error ? error.message : '连接异常，请重试。');
    } finally {
      clearTimeout(timeout);
      if (generation.current === token) { active.current = undefined; if (mounted.current) setBusy(false); }
    }
  }, [apiBase, demo]);
  return { entries, busy, ask, cancel, clear };
}

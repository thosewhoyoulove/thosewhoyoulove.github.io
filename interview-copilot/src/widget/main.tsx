import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { AgentEvent, ChatTurn, Citation } from '../shared.js';
import './style.css';

const localHost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const apiBase = import.meta.env.VITE_COPILOT_API_URL || (localHost ? 'http://127.0.0.1:8787' : '');
const endpoint = apiBase + '/api/copilot/chat';
const exampleQuestions = [
  'React Hooks 为什么不能写在条件语句里？',
  'React Fiber 如何支持可中断渲染？',
  'Vue 3 响应式系统是如何追踪依赖的？',
  '浏览器从输入 URL 到页面展示经历了什么？',
  'Promise 和浏览器事件循环有什么关系？',
  'TypeScript 的 type 和 interface 怎么选择？',
  'HTTP 缓存中的强缓存和协商缓存有什么区别？',
  '如何优化首屏加载速度？',
  'Webpack Loader 和 Plugin 有什么区别？',
  'RAG 检索增强生成的基本流程是什么？',
];

function App() {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState('');
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [busy, setBusy] = useState(false);
  const [controller, setController] = useState<AbortController | null>(null);
  const [exampleIndex, setExampleIndex] = useState(0);
  const [sendHovered, setSendHovered] = useState(false);

  useEffect(() => {
    if (!open || sendHovered) return;
    const timer = window.setInterval(() => setExampleIndex(index => (index + 1) % exampleQuestions.length), 2000);
    return () => window.clearInterval(timer);
  }, [open, sendHovered]);

  useEffect(() => { if (!open) setSendHovered(false); }, [open]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    const question = input.trim() || exampleQuestions[exampleIndex];
    const nextHistory = [...history, { role: 'user' as const, content: question }].slice(-12);
    setHistory(nextHistory);
    setInput(''); setEvents([]); setBusy(true);
    const abort = new AbortController();
    setController(abort);
    try {
      const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: nextHistory }), signal: abort.signal });
      if (!response.ok || !response.body) throw new Error(`API returned ${response.status}`);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const frames = buffer.split('\n\n');
        buffer = frames.pop() ?? '';
        for (const frame of frames) {
          const data = frame.split('\n').find(line => line.startsWith('data: '));
          if (!data) continue;
          const item = JSON.parse(data.slice(6)) as AgentEvent;
          setEvents(current => [...current, item]);
          if (item.type === 'message') setHistory(current => [...current, { role: 'assistant' as const, content: item.text }].slice(-12));
        }
      }
    } catch (error) {
      setEvents(current => [...current, { type: 'error', message: abort.signal.aborted ? '已取消' : error instanceof Error ? error.message : String(error) }]);
    } finally { setBusy(false); setController(null); }
  }

  return <div className="ic-root">
    <button className="ic-toggle" onClick={() => setOpen(value => !value)} aria-expanded={open}>面试助手</button>
    {open && <section className="ic-panel" aria-label="Interview Copilot">
      <header><strong>Interview Copilot</strong><small>博客知识检索 · 工具执行过程</small></header>
      <div className="ic-log" aria-live="polite">
        {history.map((turn, i) => <div className={`ic-turn ic-${turn.role}`} key={i}>
          <b>{turn.role === 'user' ? '你' : '助手'}</b><p>{turn.content}</p>
        </div>)}
        {events.filter(item => item.type === 'tool_start' || item.type === 'tool_result' || item.type === 'error').map((item, i) => <div className="ic-event" key={i}>
          {item.type === 'tool_start' ? `调用 ${item.name}：${JSON.stringify(item.arguments)}` : item.type === 'tool_result' ? `${item.name} 已返回结果` : item.message}
        </div>)}
        {events.filter((item): item is Extract<AgentEvent, { type: 'message' }> => item.type === 'message').map((item, i) => <div className="ic-sources" key={i}>
          {item.demo && <strong>演示模式 · 无真实模型推理</strong>}
          {item.citations.length > 0 && <div>引用：{unique(item.citations).map(citation => <a key={citation.path} href={citation.url} target="_blank" rel="noreferrer">{citation.title}</a>)}</div>}
        </div>)}
      </div>
      <form onSubmit={submit}><input value={input} onChange={event => setInput(event.target.value)} placeholder={`例如：${exampleQuestions[exampleIndex]}`} maxLength={4000} aria-label="问题" /><button disabled={busy} onMouseEnter={() => setSendHovered(true)} onMouseLeave={() => setSendHovered(false)}>发送</button>{busy && <button type="button" onClick={() => controller?.abort()}>取消</button>}</form>
    </section>}
  </div>;
}

function unique(citations: Citation[]): Citation[] { return [...new Map(citations.map(item => [item.path, item])).values()]; }
const mount = document.createElement('div');
mount.id = 'interview-copilot';
document.body.appendChild(mount);
createRoot(mount).render(<App />);

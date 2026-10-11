import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { AgentEvent, ChatTurn, Citation } from '../shared.js';
import './style.css';

const apiBase = import.meta.env.VITE_COPILOT_API_URL || (['localhost', '127.0.0.1'].includes(location.hostname) ? 'http://127.0.0.1:8787' : '');
const examples = ['React Hooks 为什么不能写在条件语句里？', 'React Fiber 如何支持可中断渲染？', 'Vue 3 响应式系统是如何追踪依赖的？', '浏览器从输入 URL 到页面展示经历了什么？', 'Promise 和浏览器事件循环有什么关系？', 'TypeScript 的 type 和 interface 怎么选择？', 'HTTP 缓存中的强缓存和协商缓存有什么区别？', '如何优化首屏加载速度？', 'Webpack Loader 和 Plugin 有什么区别？', 'RAG 检索增强生成的基本流程是什么？'];
type Answer = Extract<AgentEvent, { type: 'message' }>;
type Exchange = { id: number; question: string; events: AgentEvent[]; answer?: Answer; error?: string; status: string };

function Icon({ name }: { name: 'chat' | 'close' | 'expand' | 'send' | 'stop' }) {
  const paths = { chat: 'M5 4h14v11H9l-4 4V4Z', close: 'm6 6 12 12M18 6 6 18', expand: 'M8 4H4v4m12-4h4v4M4 16v4h4m12-4v4h-4', send: 'm5 12 14-7-5 14-2-7-7 0Zm7 0 7-7', stop: 'M7 7h10v10H7Z' };
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>;
}
function Copy({ getText, label = '复制' }: { getText: () => string; label?: string }) {
  const [feedback, setFeedback] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  return <button type="button" className="ic-copy" onClick={async () => {
    try { await navigator.clipboard.writeText(getText()); setFeedback('已复制'); } catch { setFeedback('请手动选择复制'); }
    clearTimeout(timer.current); timer.current = setTimeout(() => setFeedback(''), 2200);
  }}>{feedback || label}</button>;
}
function Code({ children }: { children?: React.ReactNode }) {
  const pre = useRef<HTMLPreElement>(null);
  return <div className="ic-code"><div className="ic-code-bar"><span>代码</span><Copy getText={() => pre.current?.textContent ?? ''} /></div><pre ref={pre}>{children}</pre></div>;
}
function Sources({ citations }: { citations: Citation[] }) {
  const sources = [...new Map(citations.map(item => [item.path, item])).values()];
  return sources.length ? <div className="ic-sources"><div className="ic-eyebrow">参考文章 · {sources.length}</div>{sources.map(item => <a key={item.path} href={item.url} target="_blank" rel="noreferrer"><span>↗</span><div><strong>{item.title}</strong><small>{item.heading || '查看博客原文'}</small></div></a>)}</div> : null;
}
function Execution({ events }: { events: AgentEvent[] }) {
  const tools = events.filter(item => item.type === 'tool_start' || item.type === 'tool_result');
  return tools.length ? <details className="ic-execution"><summary>执行详情 <span>{tools.filter(item => item.type === 'tool_start').length} 次工具调用</span></summary><ol>{tools.map((item, i) => <li key={i}><strong>{item.type === 'tool_start' ? `调用 ${item.name}` : `${item.name} 返回结果`}</strong>{item.type === 'tool_start' ? <code>{JSON.stringify(item.arguments)}</code> : <small>{summary(item.result)}</small>}</li>)}</ol></details> : null;
}
function summary(result: unknown): string {
  if (Array.isArray(result)) return result.length ? `找到 ${result.length} 条相关片段` : '没有检索到相关内容';
  if (result && typeof result === 'object') { if ('error' in result) return String(result.error); if ('title' in result) return `已读取《${String(result.title)}》`; }
  return '工具执行完成';
}

function App() {
  const [open, setOpen] = useState(false), [expanded, setExpanded] = useState(false);
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [input, setInput] = useState(''), [busy, setBusy] = useState(false);
  const [mode, setMode] = useState('博客知识助手'), [exampleIndex, setExampleIndex] = useState(0);
  const [paused, setPaused] = useState(false), [showLatest, setShowLatest] = useState(false);
  const controller = useRef<AbortController | null>(null), log = useRef<HTMLDivElement>(null);
  const textarea = useRef<HTMLTextAreaElement>(null), toggle = useRef<HTMLButtonElement>(null);
  const follow = useRef(true), nextId = useRef(0);
  useEffect(() => { if (!open || paused || busy) return; const timer = setInterval(() => setExampleIndex(i => (i + 1) % examples.length), 2000); return () => clearInterval(timer); }, [open, paused, busy]);
  useEffect(() => {
    if (!open) { setPaused(false); return; } textarea.current?.focus();
    const abort = new AbortController();
    void fetch(`${apiBase}/api/copilot/health`, { signal: abort.signal }).then(r => r.json()).then(data => { if (data.ok) setMode(data.mode === 'cursor' ? 'Cursor Agent · 博客知识库' : data.mode === 'mock' ? '演示模式 · 无真实模型推理' : '模型问答 · 博客知识库'); }).catch(() => {});
    return () => abort.abort();
  }, [open]);
  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => { if (log.current && follow.current) log.current.scrollTop = log.current.scrollHeight; }, [exchanges, busy, open, expanded]);
  useEffect(() => { if (textarea.current) { textarea.current.style.height = 'auto'; textarea.current.style.height = `${Math.min(120, textarea.current.scrollHeight)}px`; } }, [input, open]);
  const close = () => { setOpen(false); toggle.current?.focus(); };
  const update = (id: number, patch: Partial<Exchange>) => setExchanges(current => current.map(item => item.id === id ? { ...item, ...patch } : item));
  async function ask(question: string, retry = false) {
    if (controller.current) return;
    const base = retry ? exchanges.slice(0, -1) : exchanges;
    const history: ChatTurn[] = base.flatMap(item => item.answer ? [{ role: 'user' as const, content: item.question }, { role: 'assistant' as const, content: item.answer.text }] : []);
    history.push({ role: 'user', content: question });
    const id = ++nextId.current;
    setExchanges([...base, { id, question, events: [], status: '正在连接助手' }]);
    setInput(''); setBusy(true); follow.current = true; setShowLatest(false);
    const abort = new AbortController(); controller.current = abort;
    const timer = setTimeout(() => abort.abort('timeout'), 65000);
    let finished = false, answered = false, receivedError = false;
    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
    const onEvent = (item: AgentEvent) => {
      setExchanges(current => current.map(entry => entry.id === id ? { ...entry, events: [...entry.events, item] } : entry));
      if (item.type === 'tool_start') update(id, { status: item.name === 'search_articles' ? '正在检索博客' : '正在阅读文章' });
      if (item.type === 'tool_result') update(id, { status: '正在整理回答' });
      if (item.type === 'message') { answered = true; update(id, { answer: item, status: '已完成' }); }
      if (item.type === 'error') { receivedError = true; update(id, { error: item.message, status: '请求未完成' }); }
      if (item.type === 'done') { finished = true; if (item.reason !== 'completed' && !receivedError) update(id, { error: item.reason === 'cancelled' ? '已停止生成' : '助手未完成回答，请重试。' }); }
    };
    try {
      const response = await fetch(`${apiBase}/api/copilot/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: history.slice(-12) }), signal: abort.signal });
      if (!response.ok || !response.body) throw new Error(response.status === 503 ? '助手暂不可用，请检查服务端配置后重试。' : `请求失败（${response.status}），请稍后重试。`);
      update(id, { status: '正在分析问题' }); reader = response.body.getReader();
      const decoder = new TextDecoder(); let buffer = '';
      while (!finished) {
        const { done, value } = await reader.read(); if (done) break;
        buffer += decoder.decode(value, { stream: true }); buffer = buffer.replace(/\r\n/g, '\n');
        const frames = buffer.split('\n\n'); buffer = frames.pop() ?? '';
        for (const frame of frames) { const data = frame.split('\n').filter(line => line.startsWith('data:')).map(line => line.slice(5).trimStart()).join('\n'); if (data) onEvent(JSON.parse(data) as AgentEvent); }
      }
      if (!finished || (!answered && !receivedError)) throw new Error('连接已中断，未收到完整回答，请重试。');
    } catch (error) { update(id, { error: abort.signal.aborted ? abort.signal.reason === 'timeout' ? '等待超时，请稍后重试。' : '已停止生成，你可以重新生成回答。' : error instanceof Error ? error.message : '请求失败，请重试。' }); }
    finally { clearTimeout(timer); await reader?.cancel().catch(() => {}); controller.current = null; setBusy(false); }
  }
  return <div className="ic-root"><button ref={toggle} className="ic-toggle" onClick={() => open ? close() : setOpen(true)} aria-expanded={open} aria-controls="ic-panel"><Icon name="chat" />面试助手</button>
    {open && <section id="ic-panel" className={`ic-panel ${expanded ? 'ic-expanded' : ''}`} role="dialog" aria-label="Interview Copilot" onKeyDown={event => { if (event.key === 'Escape') close(); }}>
      <header className="ic-header"><div className="ic-brand"><div className="ic-brand-icon"><Icon name="chat" /></div><div><strong>Interview Copilot</strong><small><i />{mode}</small></div></div><div className="ic-header-actions"><button disabled={busy || !exchanges.length} onClick={() => { setExchanges([]); follow.current = true; setShowLatest(false); }} title="开始新对话">新对话</button><button className="ic-expand-button" onClick={() => setExpanded(value => !value)} aria-label={expanded ? '收起窗口' : '展开窗口'} aria-pressed={expanded}><Icon name="expand" /></button><button onClick={close} aria-label="关闭助手"><Icon name="close" /></button></div></header>
      <div className="ic-log" ref={log} onScroll={() => { const element = log.current!; follow.current = element.scrollHeight - element.scrollTop - element.clientHeight < 70; setShowLatest(!follow.current); }}>
        {!exchanges.length && <div className="ic-welcome"><div className="ic-welcome-mark"><Icon name="chat" /></div><div className="ic-eyebrow">YOUR INTERVIEW COMPANION</div><h2>把知识，变成好回答。</h2><p>从博客原文出发，理解技术原理，<br />准备下一次面试。</p><div className="ic-suggestions">{[0, 4, 7].map((index, i) => <button key={index} onClick={() => void ask(examples[index])}><small>{['理解原理', '理清机制', '解决问题'][i]}</small><span>{examples[index]}</span><b>↗</b></button>)}</div><small className="ic-welcome-note">可查看检索过程和参考文章</small></div>}
        {exchanges.map((entry, index) => <article className="ic-exchange" key={entry.id}><div className="ic-user"><span className="ic-eyebrow">你</span><p>{entry.question}</p></div><div className="ic-assistant"><div className="ic-answer-label"><span className="ic-mini-logo"><Icon name="chat" /></span><strong>Copilot</strong>{entry.answer && <span>{entry.answer.demo ? '演示模式 · 无真实推理' : entry.answer.provider || '模型回答'}</span>}</div>
          {busy && index === exchanges.length - 1 && !entry.answer && <div className="ic-progress" role="status"><span className="ic-pulse" />{entry.status}<small>完成后显示回答</small></div>}
          <Execution events={entry.events} />
          {entry.answer && <><div className="ic-markdown"><Markdown remarkPlugins={[remarkGfm]} skipHtml components={{ pre: Code, a: ({ children, ...props }) => <a {...props} target="_blank" rel="noreferrer">{children}</a> }}>{entry.answer.text}</Markdown></div><Sources citations={entry.answer.citations} /><div className="ic-answer-actions"><Copy getText={() => entry.answer!.text} label="复制回答" />{entry.answer.provider?.startsWith('Cursor') && <small>规划及工具调用由 Cursor Agent 执行</small>}</div></>}
          {entry.error && <div className="ic-error" role="alert"><strong>这次回答未完成</strong><p>{entry.error}</p></div>}
          {!busy && index === exchanges.length - 1 && <button className="ic-retry" onClick={() => void ask(entry.question, true)}>{entry.error ? '重试这个问题' : '重新生成'}</button>}
        </div></article>)}
      </div>
      {showLatest && <button className="ic-latest" onClick={() => { follow.current = true; log.current?.scrollTo({ top: log.current.scrollHeight, behavior: 'smooth' }); setShowLatest(false); }}>↓ 回到最新消息</button>}
      <form className="ic-composer" onSubmit={event => { event.preventDefault(); void ask(input.trim() || examples[exampleIndex]); }}><textarea ref={textarea} value={input} onChange={event => setInput(event.target.value)} placeholder={`例如：${examples[exampleIndex]}`} maxLength={4000} rows={2} aria-label="输入你的面试问题" onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing && event.keyCode !== 229) { event.preventDefault(); if (!busy) event.currentTarget.form?.requestSubmit(); } }} /><div className="ic-composer-bottom"><small>Enter 发送 · Shift + Enter 换行</small>{busy ? <button type="button" className="ic-send ic-stop" onClick={() => controller.current?.abort()}><Icon name="stop" />停止</button> : <button className="ic-send" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}><Icon name="send" />发送</button>}</div></form>
      <footer className="ic-footer">基于博客原文检索 · 答案请结合引用核实</footer>
    </section>}
  </div>;
}
const mount = document.createElement('div'); mount.id = 'interview-copilot'; document.body.appendChild(mount); createRoot(mount).render(<App />);

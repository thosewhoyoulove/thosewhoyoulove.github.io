import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useAgentStream } from './agent/useAgentStream.js';
import { AgentResponse } from './agent/AgentResponse.js';
import { scenarios, type DemoScenario } from './agent/demo.js';


import './style.css';

const apiBase = import.meta.env.VITE_COPILOT_API_URL || (['localhost', '127.0.0.1'].includes(location.hostname)
  ? 'http://127.0.0.1:8787' : location.hostname === 'thosewhoyoulove.github.io' ? 'https://omen-blog.vercel.app' : '');
const examples = ['React Hooks 为什么不能写在条件语句里？', 'React Fiber 如何支持可中断渲染？', 'Vue 3 响应式系统是如何追踪依赖的？', '浏览器从输入 URL 到页面展示经历了什么？', 'Promise 和浏览器事件循环有什么关系？', 'TypeScript 的 type 和 interface 怎么选择？', 'HTTP 缓存中的强缓存和协商缓存有什么区别？', '如何优化首屏加载速度？', 'Webpack Loader 和 Plugin 有什么区别？', 'RAG 检索增强生成的基本流程是什么？'];
function Icon({ name }: { name: 'chat' | 'close' | 'expand' | 'send' | 'stop' }) {
  const paths = { chat: 'M5 4h14v11H9l-4 4V4Z', close: 'm6 6 12 12M18 6 6 18', expand: 'M8 4H4v4m12-4h4v4M4 16v4h4m12-4v4h-4', send: 'm5 12 14-7-5 14-2-7-7 0Zm7 0 7-7', stop: 'M7 7h10v10H7Z' };
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>;
}
function App() {
  const [open, setOpen] = useState(false), [expanded, setExpanded] = useState(false);
  const demoEnabled = import.meta.env.DEV && new URLSearchParams(location.search).has('agentDemo');
  const [scenario, setScenario] = useState<DemoScenario>('normal');
  const stream = useAgentStream(apiBase, demoEnabled ? scenario : undefined);
  const { entries: exchanges, busy } = stream;
  const [input, setInput] = useState('');
  const [mode, setMode] = useState('博客知识助手'), [exampleIndex, setExampleIndex] = useState(0);
  const [paused, setPaused] = useState(false), [showLatest, setShowLatest] = useState(false);
  const log = useRef<HTMLDivElement>(null);
  const textarea = useRef<HTMLTextAreaElement>(null), toggle = useRef<HTMLButtonElement>(null);
  const follow = useRef(true);
  useEffect(() => { if (!open || paused || busy) return; const timer = setInterval(() => setExampleIndex(i => (i + 1) % examples.length), 2000); return () => clearInterval(timer); }, [open, paused, busy]);
  useEffect(() => {
    if (!open) { setPaused(false); return; } textarea.current?.focus();
    const abort = new AbortController();
    void fetch(`${apiBase}/api/copilot/health`, { signal: abort.signal }).then(r => r.json()).then(data => { if (data.ok) setMode(data.mode === 'cursor' ? 'Cursor Agent · 博客知识库' : data.mode === 'mock' ? '演示模式 · 无真实模型推理' : '模型问答 · 博客知识库'); }).catch(() => {});
    return () => abort.abort();
  }, [open]);

  useEffect(() => { if (log.current && follow.current) log.current.scrollTop = log.current.scrollHeight; }, [exchanges, busy, open, expanded]);
  useEffect(() => { if (textarea.current) { textarea.current.style.height = 'auto'; textarea.current.style.height = `${Math.min(120, textarea.current.scrollHeight)}px`; } }, [input, open]);
  const close = () => { setOpen(false); toggle.current?.focus(); };
  const ask = (question: string) => { setInput(''); setPaused(false); follow.current = true; setShowLatest(false); return stream.ask(question); };
  useEffect(() => {
    if (!log.current) return;
    const observer = new ResizeObserver(() => { if (follow.current && log.current) log.current.scrollTop = log.current.scrollHeight; });
    log.current.querySelectorAll('.ic-exchange').forEach(element => observer.observe(element));
    return () => observer.disconnect();
  }, [exchanges, open]);
  return <div className="ic-root"><button ref={toggle} className="ic-toggle" onClick={() => open ? close() : setOpen(true)} aria-expanded={open} aria-controls="ic-panel"><Icon name="chat" />面试助手</button>
    {open && <section id="ic-panel" className={`ic-panel ${expanded ? 'ic-expanded' : ''}`} role="dialog" aria-label="Interview Copilot" onKeyDown={event => { if (event.key === 'Escape') close(); }}>
      <header className="ic-header"><div className="ic-brand"><div className="ic-brand-icon"><Icon name="chat" /></div><div><strong>Interview Copilot</strong><small><i />{demoEnabled ? 'UI 演示 · Mock Event Stream' : mode}</small></div></div><div className="ic-header-actions"><button disabled={busy || !exchanges.length} onClick={() => { stream.clear(); follow.current = true; setShowLatest(false); }} title="开始新对话">新对话</button><button className="ic-expand-button" onClick={() => setExpanded(value => !value)} aria-label={expanded ? '收起窗口' : '展开窗口'} aria-pressed={expanded}><Icon name="expand" /></button><button onClick={close} aria-label="关闭助手"><Icon name="close" /></button></div></header>
      <div className="ic-log" ref={log} onScroll={() => { const element = log.current!; follow.current = element.scrollHeight - element.scrollTop - element.clientHeight < 70; setShowLatest(!follow.current); }}>
        {!exchanges.length && <div className="ic-welcome"><div className="ic-welcome-mark"><Icon name="chat" /></div><div className="ic-eyebrow">YOUR INTERVIEW COMPANION</div><h2>把知识，变成好回答。</h2><p>从博客原文出发，理解技术原理，<br />准备下一次面试。</p><div className="ic-suggestions">{[0, 4, 7].map((index, i) => <button key={index} onClick={() => void ask(examples[index])}><small>{['理解原理', '理清机制', '解决问题'][i]}</small><span>{examples[index]}</span><b>↗</b></button>)}</div><small className="ic-welcome-note">可查看检索过程和参考文章</small></div>}
        {demoEnabled && <div className="ic-demo-banner"><strong>UI 演示 · 非真实模型推理</strong><label>演示场景 <select value={scenario} onChange={event => { stream.clear(); setScenario(event.target.value as DemoScenario); }}>{scenarios.map(item => <option value={item} key={item}>{item}</option>)}</select></label><small>可测试快速/慢速输出、并发、失败、取消和重试。不会请求模型 API。</small></div>}
        {exchanges.map((entry, index) => <AgentResponse key={entry.id} entry={entry} last={index === exchanges.length - 1} busy={busy && index === exchanges.length - 1} retry={stream.ask} />)}
      </div>
      {showLatest && <button className="ic-latest" onClick={() => { follow.current = true; log.current?.scrollTo({ top: log.current.scrollHeight, behavior: 'smooth' }); setShowLatest(false); }}>↓ 回到最新消息</button>}
      <form className="ic-composer" onSubmit={event => { event.preventDefault(); void ask(input.trim() || examples[exampleIndex]); }}><textarea ref={textarea} value={input} onChange={event => setInput(event.target.value)} placeholder={`例如：${examples[exampleIndex]}`} maxLength={4000} rows={2} aria-label="输入你的面试问题" onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing && event.keyCode !== 229) { event.preventDefault(); if (!busy) event.currentTarget.form?.requestSubmit(); } }} /><div className="ic-composer-bottom"><small>Enter 发送 · Shift + Enter 换行</small>{busy ? <button type="button" className="ic-send ic-stop" onClick={() => stream.cancel()}><Icon name="stop" />停止</button> : <button className="ic-send" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}><Icon name="send" />发送</button>}</div></form>
      <footer className="ic-footer">基于博客原文检索 · 答案请结合引用核实</footer>
    </section>}
  </div>;
}
const mount = document.createElement('div'); mount.id = 'interview-copilot'; document.body.appendChild(mount); createRoot(mount).render(<App />);

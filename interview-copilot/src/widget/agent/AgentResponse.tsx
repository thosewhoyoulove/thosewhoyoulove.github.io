import { memo, useState, useSyncExternalStore } from 'react';
import type { ResponseEntry } from './useAgentStream.js';
import { ThinkingPanel } from './ThinkingPanel.js';
import { StreamingAnswer } from './StreamingAnswer.js';
export const AgentResponse = memo(function AgentResponse({ entry, last, busy, retry }: { entry: ResponseEntry; last: boolean; busy: boolean; retry: (question: string, retry: boolean) => Promise<void> }) {
  const state = useSyncExternalStore(entry.store.subscribe, entry.store.snapshot);
  const [copied, setCopied] = useState('');
  return <article className="ic-exchange"><div className="ic-user"><span className="ic-eyebrow">你</span><p>{entry.question}</p></div><div className="ic-assistant"><div className="ic-answer-label"><strong>Copilot</strong><span>{state.demo ? '演示模式 · Mock Event Stream' : state.provider || '博客知识助手'}</span></div>
    <ThinkingPanel phase={state.phase} steps={state.steps} startedAt={state.startedAt} completedAt={state.completedAt} answering={Boolean(state.text)} />
    <StreamingAnswer text={state.text} completed={state.terminal} streaming={state.streaming} />
    {!state.demo && !state.streaming && !state.text && !state.terminal && <div className="ic-trace-note">当前服务在生成结束后返回完整正文。</div>}
    {state.citations.length > 0 && <div className="ic-sources"><div className="ic-eyebrow">参考文章 · {state.citations.length}</div>{state.citations.map(item => <a href={item.url} key={item.path} target="_blank" rel="noreferrer"><span>↗</span><div><strong>{item.title}</strong><small>{item.heading || '查看博客原文'}</small></div></a>)}</div>}
    {state.provider?.startsWith('Cursor') && <div className="ic-trace-note">规划及工具调用由 Cursor Agent 执行</div>}
    {state.text && state.terminal && <button type="button" className="ic-copy" onClick={async () => { try { await navigator.clipboard.writeText(state.text); setCopied('已复制'); } catch { setCopied('请手动选择复制'); } }}>{copied || '复制回答'}</button>}
    {state.error && <div className="ic-error" role="alert"><strong>{state.phase === 'cancelled' ? '已取消本次回答' : '这次回答未完成'}</strong><p>{state.error}</p></div>}
    {last && !busy && <button className="ic-retry" onClick={() => void retry(entry.question, true)}>{state.phase === 'completed' ? '重新生成' : '重试这个问题'}</button>}
  </div></article>;
});

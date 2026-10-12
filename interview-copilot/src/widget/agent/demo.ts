import type { UIEvent } from './stream.js';
export const scenarios = ['normal', 'retrieval', 'parallel', 'fast', 'slow', 'tool-error', 'network-error'] as const;
export type DemoScenario = typeof scenarios[number];
const delay = (ms: number, signal: AbortSignal) => new Promise<void>((resolve, reject) => {
  const cancel = () => { clearTimeout(timer); signal.removeEventListener('abort', cancel); reject(signal.reason); };
  const timer = setTimeout(() => { signal.removeEventListener('abort', cancel); resolve(); }, ms);
  if (signal.aborted) cancel(); else signal.addEventListener('abort', cancel, { once: true });
});
export async function demoStream(scenario: DemoScenario, signal: AbortSignal, emit: (event: UIEvent) => void) {
  let sequence = 0;
  const send = (event: UIEvent) => { signal.throwIfAborted(); emit({ ...event, eventId: `demo-${sequence++}`, requestId: 'demo' }); };
  await delay(350, signal);
  send({ type: 'tool_start', name: 'search_articles', callId: 'search', arguments: { query: 'React Hooks', api_key: 'must-not-be-displayed' } });
  if (scenario === 'parallel') send({ type: 'tool_start', name: 'search_articles', callId: 'search-2', arguments: { query: '浏览器事件循环' } });
  await delay(650, signal);
  if (scenario === 'network-error') throw new Error('演示：连接意外中断');
  const article = { title: '演示文章 · React Hooks', path: 'md/框架/React/Hooks.md', url: '/#/md/%E6%A1%86%E6%9E%B6/React/Hooks.md', snippet: '演示片段：Hook 的状态按调用顺序关联。' };
  if (scenario === 'parallel') send({ type: 'tool_result', name: 'search_articles', callId: 'search-2', result: [article] });
  send({ type: 'tool_result', name: 'search_articles', callId: 'search', result: [article] });
  send({ type: 'tool_start', name: 'read_article', callId: 'read', arguments: { path: article.path } });
  await delay(650, signal);
  if (scenario === 'tool-error') {
    send({ type: 'tool_result', name: 'read_article', callId: 'read', result: { error: '演示：文章读取失败' } });
    send({ type: 'error', message: '演示：工具读取失败，可以重试。' }); send({ type: 'done', reason: 'error' }); return;
  }
  send({ type: 'tool_result', name: 'read_article', callId: 'read', result: article });
  if (scenario === 'retrieval') {
    send({ type: 'tool_start', name: 'search_knowledge', callId: 'knowledge', arguments: { query: '调用顺序' } });
    await delay(400, signal); send({ type: 'tool_result', name: 'search_knowledge', callId: 'knowledge', result: [article] });
  }
  const text = '## 演示回答\n\n这是 **UI 流式演示**，不代表真实模型推理或检索结果。\n\n- 普通 Hook 必须保持调用顺序。\n- 文章引用可以打开博客原文。\n\n```tsx\nfunction Example() {\n  const [count, setCount] = useState(0);\n  return <button onClick={() => setCount(count + 1)}>{count}</button>;\n}\n```\n\n| 机制 | 说明 |\n| --- | --- |\n| 状态 | 按调用顺序关联 |\n| 工具 | 展示公开执行记录 |\n';
  const chunkSize = scenario === 'fast' ? 2 : 14;
  for (let index = 0; index < text.length; index += chunkSize) {
    send({ type: 'message_delta', text: text.slice(index, index + chunkSize) });
    await delay(scenario === 'fast' ? 0 : scenario === 'slow' ? 220 : 25, signal);
  }
  send({ type: 'message', text, citations: [article], demo: true, provider: 'UI Mock Event Stream' });
  send({ type: 'done', reason: 'completed' });
}

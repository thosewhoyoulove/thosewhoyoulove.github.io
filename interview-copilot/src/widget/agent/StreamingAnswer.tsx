import { memo, useMemo, useRef, useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function markdownBlocks(text: string): string[] {
  const blocks: string[] = []; let current = '', fence = '';
  for (const line of text.split('\n')) {
    const match = line.match(/^\s{0,3}(`{3,}|~{3,})/);
    if (match) { if (!fence) fence = match[1]; else if (match[1][0] === fence[0] && match[1].length >= fence.length) fence = ''; }
    current += `${line}\n`;
    if (!line.trim() && !fence) { blocks.push(current); current = ''; }
  }
  if (current) blocks.push(current); return blocks;
}
function Code({ children }: { children?: React.ReactNode }) {
  const pre = useRef<HTMLPreElement>(null), [copied, setCopied] = useState(false);
  return <div className="ic-code"><div className="ic-code-bar"><span>代码</span><button type="button" className="ic-copy" onClick={async () => { try { await navigator.clipboard.writeText(pre.current?.textContent || ''); setCopied(true); } catch { setCopied(false); } }}>{copied ? '已复制' : '复制'}</button></div><pre ref={pre}>{children}</pre></div>;
}
const components = { pre: Code };
const Block = memo(function Block({ text }: { text: string }) { return <Markdown skipHtml remarkPlugins={[remarkGfm]} components={components}>{text}</Markdown>; });
export const StreamingAnswer = memo(function StreamingAnswer({ text, completed, streaming }: { text: string; completed: boolean; streaming: boolean }) {
  const blocks = useMemo(() => completed || !streaming ? [text] : markdownBlocks(text), [text, completed, streaming]);
  if (!text) return null;
  return <div className="ic-streaming-answer"><div className="ic-markdown">{blocks.map((block, index) => <Block key={completed ? `final-${index}` : index} text={block} />)}</div>{!completed && streaming && <small className="ic-stream-label" role="status">正在接收公开回答…</small>}</div>;
});

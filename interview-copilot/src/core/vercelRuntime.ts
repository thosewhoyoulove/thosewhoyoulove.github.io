import path from 'node:path';
import { ArticleIndex, registerArticleTools } from './articles.js';
import { createRuntime } from './runtimeFactory.js';
import type { AgentRunner } from './runtime.js';
import { ToolRegistry } from './tools.js';

let cached: Promise<{ runtime: AgentRunner; articles: number; mode: string }> | undefined;

export function getCopilot() {
  cached ??= createCopilot().catch(error => { cached = undefined; throw error; });
  return cached;
}

async function createCopilot() {
  const index = new ArticleIndex(path.join(process.cwd(), 'docs'));
  await index.load();
  const registry = new ToolRegistry();
  registerArticleTools(registry, index);
  const { mode, runtime } = createRuntime(registry);
  return { runtime, articles: index.count(), mode };
}

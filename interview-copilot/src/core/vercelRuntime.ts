import path from 'node:path';
import { ArticleIndex, registerArticleTools } from './articles.js';
import { createModel } from './model.js';
import { AgentRuntime } from './runtime.js';
import { ToolRegistry } from './tools.js';

let cached: Promise<{ runtime: AgentRuntime; articles: number; mode: string }> | undefined;

export function getCopilot() {
  cached ??= createCopilot().catch(error => { cached = undefined; throw error; });
  return cached;
}

async function createCopilot() {
  const { mode, model } = createModel();
  const index = new ArticleIndex(path.join(process.cwd(), 'docs'));
  await index.load();
  const registry = new ToolRegistry();
  registerArticleTools(registry, index);
  return { runtime: new AgentRuntime(model, registry), articles: index.count(), mode };
}

import path from 'node:path';
import { ArticleIndex, registerArticleTools } from './articles.js';
import { MockModel, OpenAIModel } from './model.js';
import { AgentRuntime } from './runtime.js';
import { ToolRegistry } from './tools.js';

let cached: Promise<{ runtime: AgentRuntime; articles: number; mode: string }> | undefined;

export function getCopilot() {
  cached ??= createCopilot().catch(error => { cached = undefined; throw error; });
  return cached;
}

async function createCopilot() {
  const mode = process.env.COPILOT_MODE ?? (process.env.VERCEL ? 'openai' : 'mock');
  if (mode !== 'mock' && mode !== 'openai') throw new Error('COPILOT_MODE must be mock or openai');
  if (mode === 'openai' && (!process.env.OPENAI_API_KEY || !process.env.OPENAI_MODEL)) {
    throw new Error('OPENAI_API_KEY and OPENAI_MODEL are required in openai mode');
  }
  const index = new ArticleIndex(path.join(process.cwd(), 'docs'));
  await index.load();
  const registry = new ToolRegistry();
  registerArticleTools(registry, index);
  const model = mode === 'mock' ? new MockModel() : new OpenAIModel(process.env.OPENAI_API_KEY!, process.env.OPENAI_MODEL!);
  return { runtime: new AgentRuntime(model, registry), articles: index.count(), mode };
}

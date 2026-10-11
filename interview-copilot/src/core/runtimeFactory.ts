import { createModel } from './model.js';
import { AgentRuntime, type AgentRunner } from './runtime.js';
import { CursorRuntime } from './cursorRuntime.js';
import type { ToolRegistry } from './tools.js';

export function createRuntime(registry: ToolRegistry, env: NodeJS.ProcessEnv = process.env): { runtime: AgentRunner; mode: string } {
  if (env.COPILOT_MODE === 'cursor') {
    const key = env.CURSOR_API_KEY?.trim();
    const model = env.CURSOR_MODEL?.trim() || 'composer-2.5';
    if (!key) throw new Error('CURSOR_API_KEY is required in cursor mode');
    return { mode: 'cursor', runtime: new CursorRuntime(key, model, registry) };
  }
  const { model, mode } = createModel(env);
  return { mode, runtime: new AgentRuntime(model, registry) };
}

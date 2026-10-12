import type { AgentEvent, ChatTurn, Citation } from '../shared.js';
import type { ModelAdapter, ModelMessage } from './model.js';
import { ToolRegistry } from './tools.js';

export type RuntimeOptions = { maxToolCalls?: number; timeoutMs?: number };
export interface AgentRunner {
  run(history: ChatTurn[], emit: (event: AgentEvent) => void, requestSignal?: AbortSignal): Promise<void>;
}

export class AgentRuntime {
  constructor(private readonly model: ModelAdapter, private readonly registry: ToolRegistry, private readonly options: RuntimeOptions = {}) {}

  async run(history: ChatTurn[], emit: (event: AgentEvent) => void, requestSignal?: AbortSignal): Promise<void> {
    const timeout = this.options.timeoutMs ?? 30000;
    const maxCalls = this.options.maxToolCalls ?? 4;
    const controller = new AbortController();
    const cancel = () => controller.abort(requestSignal?.reason ?? new Error('Cancelled'));
    if (requestSignal?.aborted) cancel();
    else requestSignal?.addEventListener('abort', cancel, { once: true });
    const timer = setTimeout(() => controller.abort(new Error('Request timed out')), timeout);
    const messages: ModelMessage[] = [...history];
    const citations = new Map<string, Citation>();
    let callCount = 0;
    try {
      controller.signal.throwIfAborted();
      emit({ type: 'stream_start', textDeltas: false, demo: this.model.demo });
      while (true) {
        controller.signal.throwIfAborted();
        const decision = await this.model.decide(messages, this.registry.list(), controller.signal);
        if (decision.kind === 'final') {
          emit({ type: 'message', text: decision.text, demo: this.model.demo, citations: [...citations.values()] });
          emit({ type: 'done', reason: 'completed' });
          return;
        }
        if (!decision.calls.length) throw new Error('Model returned no tool calls');
        if (callCount + decision.calls.length > maxCalls) {
          emit({ type: 'error', message: `Tool call limit (${maxCalls}) reached` });
          emit({ type: 'done', reason: 'limit' });
          return;
        }
        messages.push({ role: 'assistant', content: '', toolCalls: decision.calls });
        for (const call of decision.calls) {
          controller.signal.throwIfAborted();
          callCount++;
          emit({ type: 'tool_start', name: call.name, arguments: call.arguments, callId: call.id });
          let result: unknown;
          try { result = await this.registry.execute(call.name, call.arguments, { signal: controller.signal }); }
          catch (error) { result = { error: error instanceof Error ? error.message : String(error) }; }
          controller.signal.throwIfAborted();
          if (call.name === 'read_article') addCitation(result);
          emit({ type: 'tool_result', name: call.name, result, callId: call.id });
          messages.push({ role: 'tool', name: call.name, callId: call.id, content: JSON.stringify(result) });
        }
      }
    } catch (error) {
      const cancelled = controller.signal.aborted && requestSignal?.aborted;
      emit({ type: 'error', message: cancelled ? 'Request cancelled' : controller.signal.aborted ? 'Request timed out' : error instanceof Error ? error.message : String(error) });
      emit({ type: 'done', reason: cancelled ? 'cancelled' : 'error' });
    } finally {
      clearTimeout(timer);
      requestSignal?.removeEventListener('abort', cancel);
    }

    function addCitation(item: unknown): void {
      if (item && typeof item === 'object' && 'path' in item && 'url' in item && 'title' in item) {
        const source = item as Citation;
        if (typeof source.path === 'string' && typeof source.url === 'string') citations.set(source.path, { title: source.title, path: source.path, url: source.url, heading: source.heading });
      }
    }
  }
}

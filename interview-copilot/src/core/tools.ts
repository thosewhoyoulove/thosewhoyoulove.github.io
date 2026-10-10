import { z } from 'zod';

export type ToolContext = { signal: AbortSignal };
export interface Tool<T extends z.ZodType = z.ZodType> {
  name: string;
  description: string;
  schema: T;
  parameters: Record<string, unknown>;
  execute(args: z.output<T>, context: ToolContext): Promise<unknown>;
}

export class ToolRegistry {
  private readonly tools = new Map<string, Tool>();

  register<T extends z.ZodType>(tool: Tool<T>): void {
    if (this.tools.has(tool.name)) throw new Error(`Duplicate tool: ${tool.name}`);
    this.tools.set(tool.name, tool as Tool);
  }

  list(): Tool[] { return [...this.tools.values()]; }

  async execute(name: string, input: unknown, context: ToolContext): Promise<unknown> {
    const tool = this.tools.get(name);
    if (!tool) throw new Error(`Unknown tool: ${name}`);
    const parsed = tool.schema.safeParse(input);
    if (!parsed.success) throw new Error(`Invalid ${name} arguments: ${z.prettifyError(parsed.error)}`);
    context.signal.throwIfAborted();
    return tool.execute(parsed.data, context);
  }
}

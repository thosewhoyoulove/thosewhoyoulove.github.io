import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import type { Citation } from '../shared.js';
import type { ToolRegistry } from './tools.js';

const defaultDocsRoot = fileURLToPath(new URL('../../../docs/', import.meta.url));
type Section = { heading: string; text: string };
type Article = Citation & { sections: Section[] };

function terms(input: string): string[] {
  const lower = input.toLowerCase();
  const latin = lower.match(/[a-z][a-z0-9.]+/g) ?? [];
  const chinese = lower.match(/[\p{Script=Han}]+/gu) ?? [];
  return [...new Set([...latin, ...chinese.flatMap(word => word.length < 3 ? [word] : Array.from({ length: word.length - 1 }, (_, i) => word.slice(i, i + 2)))])];
}

function sectionsOf(markdown: string): Section[] {
  const sections: Section[] = [];
  let heading = '概览';
  let lines: string[] = [];
  for (const line of markdown.split(/\r?\n/)) {
    const match = /^#{1,3}\s+(.+)/.exec(line);
    if (match) {
      if (lines.length) sections.push({ heading, text: lines.join('\n').trim() });
      heading = match[1].trim();
      lines = [];
    } else lines.push(line);
  }
  if (lines.length) sections.push({ heading, text: lines.join('\n').trim() });
  return sections.filter(section => section.text.length > 20);
}

export class ArticleIndex {
  private articles = new Map<string, Article>();
  constructor(private readonly docsRoot = defaultDocsRoot) {}

  async load(): Promise<void> {
    const root = path.join(this.docsRoot, 'md');
    const next = new Map<string, Article>();
    const walk = async (dir: string): Promise<void> => {
      for (const entry of await readdir(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) await walk(full);
        else if (entry.isFile() && entry.name.endsWith('.md')) {
          const relative = path.relative(this.docsRoot, full).replaceAll(path.sep, '/');
          const markdown = await readFile(full, 'utf8');
          const title = /^#\s+(.+)$/m.exec(markdown)?.[1].trim() ?? entry.name.slice(0, -3);
          const url = `/#/${relative.split('/').map(encodeURIComponent).join('/')}`;
          next.set(relative, { path: relative, title, url, sections: sectionsOf(markdown) });
        }
      }
    };
    await walk(root);
    this.articles = next;
  }

  count(): number { return this.articles.size; }

  search(query: string, limit = 5): Array<Citation & { snippet: string; score: number }> {
    const words = terms(query);
    if (!words.length) return [];
    const hits: Array<Citation & { snippet: string; score: number }> = [];
    for (const article of this.articles.values()) {
      const title = `${article.title} ${article.path}`.toLowerCase();
      for (const section of article.sections) {
        const heading = section.heading.toLowerCase();
        const body = section.text.toLowerCase();
        const score = words.reduce((sum, word) => sum + (title.includes(word) ? 5 : 0) + (heading.includes(word) ? 3 : 0) + (body.includes(word) ? 1 : 0), 0);
        if (score > 0) hits.push({ title: article.title, path: article.path, url: article.url, heading: section.heading, snippet: section.text.slice(0, 500), score });
      }
    }
    return hits.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  read(articlePath: string): (Citation & { content: string }) | null {
    const article = this.articles.get(articlePath);
    if (!article) return null;
    return { title: article.title, path: article.path, url: article.url, content: article.sections.map(s => `## ${s.heading}\n${s.text}`).join('\n\n').slice(0, 12000) };
  }
}

export function registerArticleTools(registry: ToolRegistry, index: ArticleIndex): void {
  registry.register({
    name: 'search_articles', description: 'Search real blog Markdown sections for relevant interview knowledge.',
    schema: z.object({ query: z.string().trim().min(1).max(200), limit: z.number().int().min(1).max(8).default(5) }),
    parameters: { type: 'object', properties: { query: { type: 'string' }, limit: { type: 'integer', minimum: 1, maximum: 8 } }, required: ['query'] },
    async execute({ query, limit }) { return index.search(query, limit); },
  });
  registry.register({
    name: 'read_article', description: 'Read one blog article by exact path returned by search_articles.',
    schema: z.object({ path: z.string().min(1).max(500) }),
    parameters: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] },
    async execute({ path }) { const article = index.read(path); if (!article) throw new Error('Article not found'); return article; },
  });
}

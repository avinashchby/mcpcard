import type {
  ServerCard,
  McpTool,
  McpResource,
  McpPrompt,
  Transport,
  Authentication,
} from '../types/server-card.js';

/** Options for building a server card. */
export interface CardBuildOptions {
  name: string;
  version?: string;
  description?: string;
  homepage?: string;
  transport?: Transport;
  authentication?: Authentication;
  tools?: McpTool[];
  resources?: McpResource[];
  prompts?: McpPrompt[];
  protocolVersion?: string;
}

/** Deduplicate items by name, keeping the first occurrence. */
function deduplicateByName<T extends { name: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    if (!seen.has(item.name)) {
      seen.add(item.name);
      result.push(item);
    }
  }
  return result;
}

/** Sort items alphabetically by name. */
function sortByName<T extends { name: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Build a complete ServerCard from the provided options.
 * Applies defaults, deduplicates, sorts, and sets capability flags.
 */
export function buildCard(options: CardBuildOptions): ServerCard {
  const tools = options.tools
    ? sortByName(deduplicateByName(options.tools))
    : undefined;
  const resources = options.resources
    ? sortByName(deduplicateByName(options.resources))
    : undefined;
  const prompts = options.prompts
    ? sortByName(deduplicateByName(options.prompts))
    : undefined;

  const card: ServerCard = {
    name: options.name,
    version: options.version ?? '1.0.0',
    description: options.description ?? '',
    capabilities: {
      tools: (tools?.length ?? 0) > 0,
      resources: (resources?.length ?? 0) > 0,
      prompts: (prompts?.length ?? 0) > 0,
    },
    protocol_version: options.protocolVersion ?? '2025-11-05',
  };

  if (options.homepage) card.homepage = options.homepage;
  if (options.transport) card.transport = options.transport;
  if (options.authentication) card.authentication = options.authentication;
  if (tools && tools.length > 0) card.tools = tools;
  if (resources && resources.length > 0) card.resources = resources;
  if (prompts && prompts.length > 0) card.prompts = prompts;

  return card;
}

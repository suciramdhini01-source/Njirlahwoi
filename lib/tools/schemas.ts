export interface ToolSchema {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, { type: string; description: string }>;
    required: string[];
  };
}

export const TOOL_SCHEMAS: ToolSchema[] = [
  {
    name: "webSearch",
    description: "Search the web for current information, documentation, or code examples",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query string" },
        max_results: { type: "number", description: "Max results to return (default 5)" },
      },
      required: ["query"],
    },
  },
  {
    name: "fetchDocs",
    description: "Fetch and extract text from a documentation URL",
    parameters: {
      type: "object",
      properties: {
        url: { type: "string", description: "URL of the documentation page to fetch" },
      },
      required: ["url"],
    },
  },
  {
    name: "iconSearch",
    description: "Find Lucide icon names matching a concept",
    parameters: {
      type: "object",
      properties: {
        concept: { type: "string", description: "Concept or feature to find an icon for" },
      },
      required: ["concept"],
    },
  },
  {
    name: "componentRegistry",
    description: "Look up a canonical shadcn/ui component snippet by component name",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Component name, e.g. Button, Dialog, Tabs" },
      },
      required: ["name"],
    },
  },
];

export type ToolName = "webSearch" | "fetchDocs" | "iconSearch" | "componentRegistry";

/** Calls ScamShield BD's own public MCP server (POST /mcp) from the browser,
 * so pages can be powered by the same tools an external agent would use
 * instead of a parallel, duplicated data path. */

interface McpToolResult {
  content?: Array<{ type: string; text?: string }>;
  structuredContent?: unknown;
  isError?: boolean;
}

/** The MCP endpoint speaks streamable-HTTP: even a single-shot call comes
 * back as one SSE "event: message\ndata: {...}" frame, not plain JSON. */
function parseSseJson(body: string): unknown {
  for (const line of body.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("data:")) {
      return JSON.parse(trimmed.slice(5).trim());
    }
  }
  return JSON.parse(body);
}

export class McpToolCallError extends Error {}

export async function callMcpTool<T = unknown>(
  name: string,
  args: Record<string, unknown> = {},
): Promise<{ text: string; structured: T | undefined }> {
  const response = await fetch("/mcp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: Date.now(),
      method: "tools/call",
      params: { name, arguments: args },
    }),
  });
  if (!response.ok) {
    throw new McpToolCallError(`MCP request failed with status ${response.status}`);
  }
  const bodyText = await response.text();
  const envelope = parseSseJson(bodyText) as {
    result?: McpToolResult;
    error?: { message?: string };
  };
  if (envelope.error) {
    throw new McpToolCallError(envelope.error.message || "MCP call failed.");
  }
  const result = envelope.result;
  if (!result) throw new McpToolCallError("Empty MCP response.");
  if (result.isError) {
    const text = result.content?.find((c) => c.type === "text")?.text;
    throw new McpToolCallError(text || "The MCP tool returned an error.");
  }
  const text = result.content?.find((c) => c.type === "text")?.text ?? "";
  return { text, structured: result.structuredContent as T | undefined };
}

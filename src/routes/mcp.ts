// Hand-written in place of @lovable.dev/mcp-js's Vite plugin auto-generation —
// see the note in vite.config.ts for why. Mirrors exactly what that plugin emits:
// a TanStack Start ANY handler at POST /mcp for the ScamShield BD MCP server
// (public, no auth — see src/lib/mcp/index.ts for the tool definitions).
import { createFileRoute } from "@tanstack/react-router";

import { createTanStackMcpHandler } from "@lovable.dev/mcp-js/stacks/tanstack";

const loadMcp = () => import("../lib/mcp/index");

export const Route = createFileRoute("/mcp")({
  server: {
    handlers: {
      ANY: createTanStackMcpHandler(loadMcp, {
        resourcePath: "/mcp",
      }),
    },
  },
});

<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- The app's MCP server is defined with @lovable.dev/mcp-js in src/lib/mcp/ and mounted at POST /mcp by the hand-written src/routes/mcp.ts (createTanStackMcpHandler). Do NOT enable the mcpPlugin() in vite.config.ts — its configResolved hook has a Windows path-separator bug (as of SDK 3.4.0); revisit only after a release past 3.4.0 fixes it.
- Browser-local agent tools (use-webmcp-tool) must wrap their execute bodies in runWebMCPTool from src/lib/webmcp-telemetry.ts so every invocation is tracked.

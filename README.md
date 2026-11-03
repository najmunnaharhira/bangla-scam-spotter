# Bangla Scam Spotter

Implement exactly the screenshot and nothing else

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://bangla-scam-spotter.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d0dc18a8-ffd7-46a4-be1a-d0ce471a2936).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## AI and MCP setup

The app exposes its MCP server over streamable HTTP at `POST /mcp`. Start the
development server, then connect an MCP client to `http://localhost:3000/mcp`
(use the URL printed by Vite if it chooses a different port).

For Claude-powered analysis, create an untracked `.env.local` file:

```dotenv
ANTHROPIC_API_KEY=your_new_anthropic_key
ANTHROPIC_MODEL=claude-sonnet-4-6
```

Use a key created in the Anthropic Console (normally prefixed `sk-ant-`). Never
commit this file. If `ANTHROPIC_API_KEY` is absent, the app continues to support
Lovable deployments through `LOVABLE_API_KEY`; if neither is configured, MCP
tools that analyze messages use their offline fallback where available.

Available public HTTP MCP tools:

- `check_message`
- `get_practice_round`
- `lookup_scam_reports`
- `get_district_scam_stats`
- `get_trending_scam_types`

The Check and Practice pages also expose contextual WebMCP tools through
`document.modelContext` for compatible browsing agents. Creating a scam report
is intentionally available only on the Check page after email sign-in, and the
database stores the signed-in user's ID with every new report.

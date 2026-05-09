# BetterGeometry V0.0.1.3

BetterGeometry is a BetterTools geometry visualization app for ChatGPT.

Current version: **V0.0.1.3**

## Versioning

`Vpublish.feature.subfeature.patch`

- Publish version: first number
- Feature version: second number
- Subfeature version: third number
- Patch version: fourth number

Every update must change `src/version.ts`, `package.json`, and any visible app/widget version badges.

## What this version adds

V0.0.1.3 adds the first ChatGPT Apps SDK / MCP test harness before the V0.1.0.0 geometry renderer.

It includes:

- Public landing page: `/`
- MCP endpoint: `/mcp`
- Tool: `show_bettergeometry`
- Widget resource: `ui://widget/bettergeometry.html`

## Local run

```cmd
npm install
npm run build
npm run start
```

Open:

```text
http://localhost:8787
```

MCP endpoint:

```text
http://localhost:8787/mcp
```

## Render deployment

Use a Render **Web Service**, not Static Site, because ChatGPT needs the `/mcp` endpoint.

```text
Build Command: npm install && npm run build
Start Command: npm run start
```

## ChatGPT Developer Mode endpoint

After deployment, add this endpoint in ChatGPT developer mode:

```text
https://YOUR-RENDER-URL.onrender.com/mcp
```


## V0.0.1.3 patch

- Adds a real MCP session header on streamable HTTP responses.
- Adds SSE fallback support at `/mcp` for clients that probe SSE first.
- Adds `prompts/list`, no-auth security metadata, and widget accessibility metadata.
- Keeps the visible app version badge synchronized at `V0.0.1.3`.

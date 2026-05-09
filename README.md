# BetterGeometry V0.1.0.0

BetterGeometry is a BetterTools geometry visualization app for ChatGPT.

Current version: **V0.1.0.0**

## Versioning

`Vpublish.feature.subfeature.patch`

- Publish version: first number
- Feature version: second number
- Subfeature version: third number
- Patch version: fourth number

Every update must change `src/version.ts`, `package.json`, `server.js`, public widget HTML, and any visible app/widget version badges.

## What this version adds

V0.1.0.0 is the first real feature version: a generic SVG scene renderer.

It includes:

- Public landing page: `/`
- Health endpoint: `/health`
- MCP endpoint: `/mcp`
- Tool: `show_bettergeometry`
- Widget resource: `ui://widget/bettergeometry.html`
- Generic scene model, not triangle-specific
- SVG rendering for:
  - points
  - segments
  - lines and rays as construction strokes
  - polygons
  - circles
  - labels
  - basic highlight annotations
  - auto-fit viewport

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
https://bettergeometry.onrender.com/mcp
```

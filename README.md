# BetterGeometry V0.1.0.2

BetterGeometry is a BetterTools geometry visualization app for ChatGPT.

Current version: **V0.1.0.2**

## Versioning

`Vpublish.feature.subfeature.patch`

- Publish version: first number
- Feature version: second number
- Subfeature version: third number
- Patch version: fourth number

Every update must change `src/version.ts`, `package.json`, `server.js`, public widget HTML, and any visible app/widget version badges.

## What this version fixes

V0.1.0.2 is a visual polish patch for the V0.1.0.0 generic SVG renderer.

It includes:

- No internal scrollbar in the ChatGPT widget iframe
- More compact widget header
- Cleaner SVG label sizing
- Reduced label outline thickness
- Less label overlap in the sample scene
- Versioned widget resource: `ui://widget/bettergeometry-v0.1.0.2.html`

## Current renderer support

- Public landing page: `/`
- Health endpoint: `/health`
- MCP endpoint: `/mcp`
- Tool: `show_bettergeometry`
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

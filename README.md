# BetterGeometry V0.1.0.3

BetterGeometry is a BetterTools ChatGPT app that gives geometry explanations a visual layer.

## Versioning

`Vpublish.feature.subfeature.patch`

Current version: `V0.1.0.3`

Every visible app/widget must show the current version in a corner.

## This version

Patch update for the V0.1.0.0 generic renderer:

- Fixes the ChatGPT widget layout regression where only the header was visible.
- Keeps the widget scroll-free.
- Restores a compact demo SVG scene inside the ChatGPT card.
- Reduces label collisions and oversized text.
- Bumps the widget URI to `ui://widget/bettergeometry-v0.1.0.3.html`.

## Local commands

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

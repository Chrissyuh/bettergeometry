# BetterGeometry V0.0.0.1

BetterGeometry is the visual geometry layer for ChatGPT.

Current release: **V0.0.0.1**

## Version format

`Vpublish.feature.subfeature.patch`

- `publish`: public/release-level version
- `feature`: major feature group
- `subfeature`: smaller capability inside a feature
- `patch`: bug fix, polish, text-only, or tiny update

The current app version must always be visible in a corner of the app.

## Current scope

This is only the framework shell:

- Title: BetterGeometry
- Version badge: V0.0.0.1
- Generic geometry scene types
- Render static-site deployment config

It intentionally does not assume triangles only. Triangles will be represented later as normal geometry scenes made from points, segments, polygons, angles, labels, and annotations.

## Local commands

```cmd
npm install
npm run dev
```

Production test:

```cmd
npm run build
npm run preview
```

## Render settings

Use a Static Site.

- Build Command: `npm install && npm run build`
- Publish Directory: `dist`

This repo also includes `render.yaml` for Render Blueprint-style setup.

import type { BetterGeometryScene, PointObject } from "../geometry/sceneTypes";

type PointMap = Record<string, PointObject>;

type Bounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

const WIDTH = 720;
const HEIGHT = 330;

function collectPoints(scene: BetterGeometryScene): PointMap {
  const points: PointMap = {};
  for (const object of scene.objects) {
    if (object.type === "point") points[object.id] = object;
  }
  return points;
}

function distance(a: PointObject, b: PointObject) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function getBounds(scene: BetterGeometryScene, points: PointMap): Bounds {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  function include(x: number, y: number) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }

  for (const point of Object.values(points)) include(point.x, point.y);

  for (const object of scene.objects) {
    if (object.type === "circle") {
      const center = points[object.center];
      if (!center) continue;
      const radius = object.radius ?? (object.through && points[object.through] ? distance(center, points[object.through]) : 1);
      include(center.x - radius, center.y - radius);
      include(center.x + radius, center.y + radius);
    }
    if (object.type === "label") include(object.x, object.y);
  }

  if (!Number.isFinite(minX)) return { minX: -1, minY: -1, maxX: 1, maxY: 1 };

  const pad = scene.viewport?.padding ?? 0.7;
  return { minX: minX - pad, minY: minY - pad, maxX: maxX + pad, maxY: maxY + pad };
}

function createProjector(bounds: Bounds) {
  const spanX = Math.max(bounds.maxX - bounds.minX, 1);
  const spanY = Math.max(bounds.maxY - bounds.minY, 1);
  const scale = Math.min(WIDTH / spanX, HEIGHT / spanY);
  const drawWidth = spanX * scale;
  const drawHeight = spanY * scale;
  const offsetX = (WIDTH - drawWidth) / 2;
  const offsetY = (HEIGHT - drawHeight) / 2;

  return (x: number, y: number) => ({
    x: offsetX + (x - bounds.minX) * scale,
    y: offsetY + (bounds.maxY - y) * scale,
  });
}

function midpoint(a: { x: number; y: number }, b: { x: number; y: number }) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function polygonCentroid(points: { x: number; y: number }[]) {
  const total = points.reduce(
    (acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }),
    { x: 0, y: 0 },
  );
  return { x: total.x / points.length, y: total.y / points.length };
}

function segmentLabelPoint(a: { x: number; y: number }, b: { x: number; y: number }) {
  const m = midpoint(a, b);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  return { x: m.x + nx * 16, y: m.y + ny * 16 };
}

function pointLabelOffset(point: PointObject, bounds: Bounds) {
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;
  const left = point.x < centerX;
  const lower = point.y < centerY;

  return {
    dx: left ? -16 : 16,
    dy: lower ? 22 : -12,
    anchor: left ? "end" : "start",
  } as const;
}

export function SceneRenderer({ scene }: { scene: BetterGeometryScene }) {
  const points = collectPoints(scene);
  const bounds = getBounds(scene, points);
  const project = createProjector(bounds);

  return (
    <svg className="scene-svg" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="BetterGeometry rendered scene">
      <rect x="0" y="0" width={WIDTH} height={HEIGHT} rx="22" className="scene-bg" />

      <g className="fills">
        {scene.objects.map((object) => {
          if (object.type === "polygon") {
            const projected = object.points.map((id) => points[id]).filter(Boolean).map((point) => project(point.x, point.y));
            if (projected.length < 3) return null;
            const d = projected.map((point) => `${point.x},${point.y}`).join(" ");
            return <polygon key={object.id} points={d} className={object.highlight ? "polygon-fill highlight" : "polygon-fill"} />;
          }

          if (object.type === "circle") {
            const center = points[object.center];
            if (!center) return null;
            const radiusWorld = object.radius ?? (object.through && points[object.through] ? distance(center, points[object.through]) : 1);
            const p0 = project(center.x, center.y);
            const pr = project(center.x + radiusWorld, center.y);
            const radius = Math.abs(pr.x - p0.x);
            return <circle key={object.id} cx={p0.x} cy={p0.y} r={radius} className={object.highlight ? "circle-fill highlight" : "circle-fill"} />;
          }

          return null;
        })}
      </g>

      <g className="strokes">
        {scene.objects.map((object) => {
          if (object.type === "polygon") {
            const projected = object.points.map((id) => points[id]).filter(Boolean).map((point) => project(point.x, point.y));
            if (projected.length < 3) return null;
            const d = projected.map((point) => `${point.x},${point.y}`).join(" ");
            return <polygon key={`${object.id}-stroke`} points={d} className={object.highlight ? "polygon-stroke highlight" : "polygon-stroke"} />;
          }

          if (object.type === "segment") {
            const a = points[object.from];
            const b = points[object.to];
            if (!a || !b) return null;
            const pa = project(a.x, a.y);
            const pb = project(b.x, b.y);
            return <line key={object.id} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y} className={object.highlight ? "segment highlight" : "segment"} />;
          }

          if (object.type === "circle") {
            const center = points[object.center];
            if (!center) return null;
            const radiusWorld = object.radius ?? (object.through && points[object.through] ? distance(center, points[object.through]) : 1);
            const p0 = project(center.x, center.y);
            const pr = project(center.x + radiusWorld, center.y);
            const radius = Math.abs(pr.x - p0.x);
            return <circle key={`${object.id}-stroke`} cx={p0.x} cy={p0.y} r={radius} className={object.highlight ? "circle-stroke highlight" : "circle-stroke"} />;
          }

          return null;
        })}
      </g>

      <g className="labels mid-labels">
        {scene.objects.map((object) => {
          if (object.type === "polygon" && object.label) {
            const projected = object.points.map((id) => points[id]).filter(Boolean).map((point) => project(point.x, point.y));
            if (projected.length < 3) return null;
            const c = polygonCentroid(projected);
            return <text key={`${object.id}-label`} x={c.x} y={c.y + 10} textAnchor="middle" className="shape-label">{object.label}</text>;
          }

          if (object.type === "circle" && object.label) {
            const center = points[object.center];
            if (!center) return null;
            const radiusWorld = object.radius ?? (object.through && points[object.through] ? distance(center, points[object.through]) : 1);
            const p0 = project(center.x, center.y);
            const pr = project(center.x + radiusWorld, center.y);
            const radius = Math.abs(pr.x - p0.x);
            return <text key={`${object.id}-label`} x={p0.x} y={p0.y - radius - 12} textAnchor="middle" className="shape-label small">{object.label}</text>;
          }

          if (object.type === "segment" && object.label) {
            const a = points[object.from];
            const b = points[object.to];
            if (!a || !b) return null;
            const pa = project(a.x, a.y);
            const pb = project(b.x, b.y);
            const label = segmentLabelPoint(pa, pb);
            return <text key={`${object.id}-label`} x={label.x} y={label.y} textAnchor="middle" className="subtle-label">{object.label}</text>;
          }

          if (object.type === "label") {
            const p = project(object.x, object.y);
            return <text key={object.id} x={p.x} y={p.y} textAnchor="middle" className="caption-label">{object.text}</text>;
          }

          return null;
        })}
      </g>

      <g className="points">
        {Object.values(points).map((point) => {
          const p = project(point.x, point.y);
          const label = pointLabelOffset(point, bounds);
          return (
            <g key={point.id}>
              <circle cx={p.x} cy={p.y} r="6.5" className="point-dot" />
              <text x={p.x + label.dx} y={p.y + label.dy} textAnchor={label.anchor} className="point-label">{point.label ?? point.id}</text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}

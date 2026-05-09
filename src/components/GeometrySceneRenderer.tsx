import type { BetterGeometryScene, GeometryObject, PointObject } from "../geometry/sceneTypes";
import {
  centroid,
  getCircleRadius,
  isHighlighted,
  midpoint,
  resolveScene,
  svgY,
} from "../geometry/rendering";

type GeometrySceneRendererProps = {
  scene: BetterGeometryScene;
};

export function GeometrySceneRenderer({ scene }: GeometrySceneRendererProps) {
  const resolved = resolveScene(scene);

  return (
    <figure className="geometry-card" aria-label={scene.title ?? "BetterGeometry scene"}>
      <div className="geometry-card-header">
        <div>
          <p className="panel-eyebrow">SCENE JSON → SVG</p>
          <h2>{scene.title ?? "Geometry Scene"}</h2>
        </div>
        <span className="object-count">{scene.objects.length} objects</span>
      </div>

      <svg className="geometry-svg" viewBox={resolved.viewBox} role="img" aria-label={scene.description ?? scene.title ?? "Rendered geometry scene"}>
        <defs>
          <filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0.08" stdDeviation="0.08" floodOpacity="0.18" />
          </filter>
        </defs>

        {scene.viewport?.showAxes ? <Axes /> : null}
        {scene.viewport?.showGrid ? <Grid /> : null}

        <g className="geometry-layer geometry-shapes">
          {scene.objects.map((object) => renderShape(object, resolved.points, resolved.annotationsByTarget))}
        </g>

        <g className="geometry-layer geometry-points">
          {scene.objects.map((object) => object.type === "point" ? <Point key={object.id} point={object} /> : null)}
        </g>

        <g className="geometry-layer geometry-labels">
          {scene.objects.map((object) => renderLabel(object, resolved.points, resolved.annotationsByTarget))}
        </g>
      </svg>

      {scene.description ? <figcaption>{scene.description}</figcaption> : null}
    </figure>
  );
}

function renderShape(
  object: GeometryObject,
  points: Map<string, PointObject>,
  annotationsByTarget: ReturnType<typeof resolveScene>["annotationsByTarget"],
) {
  const highlighted = isHighlighted(object.id, annotationsByTarget);
  const className = highlighted ? "geometry-object is-highlighted" : "geometry-object";

  switch (object.type) {
    case "point":
      return null;

    case "segment": {
      const from = points.get(object.from);
      const to = points.get(object.to);
      if (!from || !to) return null;
      return (
        <line
          key={object.id}
          className={className}
          x1={from.x}
          y1={svgY(from.y)}
          x2={to.x}
          y2={svgY(to.y)}
        />
      );
    }

    case "polygon": {
      const polygonPoints = object.points.map((id) => points.get(id)).filter(Boolean) as PointObject[];
      if (polygonPoints.length < 3) return null;
      return (
        <polygon
          key={object.id}
          className={className}
          points={polygonPoints.map((point) => `${point.x},${svgY(point.y)}`).join(" ")}
        />
      );
    }

    case "circle": {
      const center = points.get(object.center);
      if (!center) return null;
      const radius = getCircleRadius(object, points);
      if (radius <= 0) return null;
      return (
        <circle
          key={object.id}
          className={className}
          cx={center.x}
          cy={svgY(center.y)}
          r={radius}
        />
      );
    }

    case "line": {
      const [aId, bId] = object.through;
      const a = points.get(aId);
      const b = points.get(bId);
      if (!a || !b) return null;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const length = Math.hypot(dx, dy) || 1;
      const scale = 100;
      return (
        <line
          key={object.id}
          className={`${className} is-construction`}
          x1={a.x - (dx / length) * scale}
          y1={svgY(a.y - (dy / length) * scale)}
          x2={a.x + (dx / length) * scale}
          y2={svgY(a.y + (dy / length) * scale)}
        />
      );
    }

    case "ray": {
      const from = points.get(object.from);
      const through = points.get(object.through);
      if (!from || !through) return null;
      const dx = through.x - from.x;
      const dy = through.y - from.y;
      const length = Math.hypot(dx, dy) || 1;
      const scale = 100;
      return (
        <line
          key={object.id}
          className={`${className} is-construction`}
          x1={from.x}
          y1={svgY(from.y)}
          x2={from.x + (dx / length) * scale}
          y2={svgY(from.y + (dy / length) * scale)}
        />
      );
    }

    case "arc":
    case "angle":
      return null;
  }
}

function renderLabel(
  object: GeometryObject,
  points: Map<string, PointObject>,
  annotationsByTarget: ReturnType<typeof resolveScene>["annotationsByTarget"],
) {
  const annotationText = (annotationsByTarget.get(object.id) ?? []).find((annotation) => annotation.type === "label")?.text;
  const label = annotationText ?? object.label;
  if (!label) return null;

  switch (object.type) {
    case "point":
      return <TextLabel key={`${object.id}-label`} x={object.x + 0.18} y={svgY(object.y) - 0.18} text={label} />;

    case "segment": {
      const from = points.get(object.from);
      const to = points.get(object.to);
      if (!from || !to) return null;
      const middle = midpoint(from, to);
      return <TextLabel key={`${object.id}-label`} x={middle.x + 0.12} y={svgY(middle.y) - 0.12} text={label} />;
    }

    case "polygon": {
      const polygonPoints = object.points.map((id) => points.get(id)).filter(Boolean) as PointObject[];
      const center = centroid(polygonPoints);
      return <TextLabel key={`${object.id}-label`} x={center.x} y={svgY(center.y)} text={label} />;
    }

    case "circle": {
      const center = points.get(object.center);
      if (!center) return null;
      const radius = getCircleRadius(object, points);
      return <TextLabel key={`${object.id}-label`} x={center.x} y={svgY(center.y + radius + 0.18)} text={label} />;
    }

    case "line":
    case "ray":
    case "arc":
    case "angle":
      return null;
  }
}

function Point({ point }: { point: PointObject }) {
  return (
    <circle
      key={point.id}
      className="geometry-point"
      cx={point.x}
      cy={svgY(point.y)}
      r="0.085"
      filter="url(#soft-shadow)"
    />
  );
}

function TextLabel({ x, y, text }: { x: number; y: number; text: string }) {
  return (
    <text x={x} y={y} className="geometry-label" vectorEffect="non-scaling-stroke">
      {text}
    </text>
  );
}

function Axes() {
  return (
    <g className="geometry-axes">
      <line x1="-100" y1="0" x2="100" y2="0" />
      <line x1="0" y1="-100" x2="0" y2="100" />
    </g>
  );
}

function Grid() {
  return null;
}

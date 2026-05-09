import type {
  BetterGeometryScene,
  CircleObject,
  GeometryAnnotation,
  GeometryObject,
  PointObject,
} from "./sceneTypes";

type Bounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

export type ResolvedScene = {
  points: Map<string, PointObject>;
  objectById: Map<string, GeometryObject>;
  annotationsByTarget: Map<string, GeometryAnnotation[]>;
  bounds: Bounds;
  viewBox: string;
};

export function resolveScene(scene: BetterGeometryScene): ResolvedScene {
  const points = new Map<string, PointObject>();
  const objectById = new Map<string, GeometryObject>();
  const annotationsByTarget = new Map<string, GeometryAnnotation[]>();

  for (const object of scene.objects) {
    objectById.set(object.id, object);
    if (object.type === "point") points.set(object.id, object);
  }

  for (const annotation of scene.annotations ?? []) {
    for (const targetId of getAnnotationTargetIds(annotation)) {
      const current = annotationsByTarget.get(targetId) ?? [];
      current.push(annotation);
      annotationsByTarget.set(targetId, current);
    }
  }

  const bounds = computeBounds(scene, points);
  const viewBox = toViewBox(bounds);

  return { points, objectById, annotationsByTarget, bounds, viewBox };
}

export function svgY(y: number): number {
  return -y;
}

export function distance(a: PointObject, b: PointObject): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function getCircleRadius(circle: CircleObject, points: Map<string, PointObject>): number {
  if (typeof circle.radius === "number") return Math.max(0, circle.radius);
  const center = points.get(circle.center);
  const through = circle.through ? points.get(circle.through) : undefined;
  if (!center || !through) return 0;
  return distance(center, through);
}

export function midpoint(a: PointObject, b: PointObject) {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  };
}

export function centroid(pointList: PointObject[]) {
  if (pointList.length === 0) return { x: 0, y: 0 };
  return {
    x: pointList.reduce((sum, point) => sum + point.x, 0) / pointList.length,
    y: pointList.reduce((sum, point) => sum + point.y, 0) / pointList.length,
  };
}

export function isHighlighted(id: string, annotationsByTarget: Map<string, GeometryAnnotation[]>): boolean {
  return (annotationsByTarget.get(id) ?? []).some((annotation) => annotation.type === "highlight");
}

function getAnnotationTargetIds(annotation: GeometryAnnotation): string[] {
  if ("targetId" in annotation) return [annotation.targetId];
  if ("targetIds" in annotation) return annotation.targetIds;
  return [];
}

function computeBounds(scene: BetterGeometryScene, points: Map<string, PointObject>): Bounds {
  const bounds: Bounds = {
    minX: Number.POSITIVE_INFINITY,
    minY: Number.POSITIVE_INFINITY,
    maxX: Number.NEGATIVE_INFINITY,
    maxY: Number.NEGATIVE_INFINITY,
  };

  const includePoint = (x: number, y: number) => {
    bounds.minX = Math.min(bounds.minX, x);
    bounds.minY = Math.min(bounds.minY, y);
    bounds.maxX = Math.max(bounds.maxX, x);
    bounds.maxY = Math.max(bounds.maxY, y);
  };

  for (const point of points.values()) includePoint(point.x, point.y);

  for (const object of scene.objects) {
    if (object.type !== "circle") continue;
    const center = points.get(object.center);
    if (!center) continue;
    const radius = getCircleRadius(object, points);
    includePoint(center.x - radius, center.y - radius);
    includePoint(center.x + radius, center.y + radius);
  }

  if (!Number.isFinite(bounds.minX)) {
    includePoint(-1, -1);
    includePoint(1, 1);
  }

  const padding = scene.viewport?.padding ?? 1;
  return {
    minX: bounds.minX - padding,
    minY: bounds.minY - padding,
    maxX: bounds.maxX + padding,
    maxY: bounds.maxY + padding,
  };
}

function toViewBox(bounds: Bounds): string {
  const width = Math.max(1, bounds.maxX - bounds.minX);
  const height = Math.max(1, bounds.maxY - bounds.minY);
  return `${bounds.minX} ${-bounds.maxY} ${width} ${height}`;
}

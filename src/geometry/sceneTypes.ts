export type PointId = string;

export type BetterGeometryScene = {
  schema: "bettergeometry.scene";
  version: string;
  objects: GeometryObject[];
  annotations?: GeometryAnnotation[];
  viewport?: GeometryViewport;
};

export type GeometryObject =
  | PointObject
  | SegmentObject
  | LineObject
  | RayObject
  | PolygonObject
  | CircleObject
  | LabelObject
  | HighlightObject;

export type PointObject = {
  type: "point";
  id: string;
  x: number;
  y: number;
  label?: string;
};

export type SegmentObject = {
  type: "segment";
  id: string;
  from: PointId;
  to: PointId;
  label?: string;
  highlight?: boolean;
};

export type LineObject = {
  type: "line";
  id: string;
  through: [PointId, PointId];
  label?: string;
};

export type RayObject = {
  type: "ray";
  id: string;
  from: PointId;
  through: PointId;
  label?: string;
};

export type PolygonObject = {
  type: "polygon";
  id: string;
  points: PointId[];
  label?: string;
  highlight?: boolean;
};

export type CircleObject = {
  type: "circle";
  id: string;
  center: PointId;
  radius?: number;
  through?: PointId;
  label?: string;
  highlight?: boolean;
};

export type LabelObject = {
  type: "label";
  id: string;
  x: number;
  y: number;
  text: string;
};

export type HighlightObject = {
  type: "highlight";
  id: string;
  targetId: string;
};

export type GeometryAnnotation = {
  id: string;
  targetId: string;
  kind: "label" | "highlight" | "congruence" | "right-angle" | "angle-arc";
  text?: string;
};

export type GeometryViewport = {
  padding?: number;
  showGrid?: boolean;
  showAxes?: boolean;
};

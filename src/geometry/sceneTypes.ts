export type GeometryObject =
  | PointObject
  | SegmentObject
  | LineObject
  | RayObject
  | PolygonObject
  | CircleObject
  | ArcObject
  | AngleObject;

export type GeometryAnnotation =
  | LabelAnnotation
  | HighlightAnnotation
  | CongruenceAnnotation
  | RightAngleAnnotation
  | MeasurementAnnotation;

export type BetterGeometryScene = {
  schema: "bettergeometry.scene";
  version: "0.1";
  id?: string;
  title?: string;
  objects: GeometryObject[];
  annotations?: GeometryAnnotation[];
  viewport?: GeometryViewport;
};

export type GeometryViewport = {
  padding?: number;
  showGrid?: boolean;
  showAxes?: boolean;
};

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
  from: string;
  to: string;
  label?: string;
};

export type LineObject = {
  type: "line";
  id: string;
  through: [string, string];
  label?: string;
};

export type RayObject = {
  type: "ray";
  id: string;
  from: string;
  through: string;
  label?: string;
};

export type PolygonObject = {
  type: "polygon";
  id: string;
  points: string[];
  label?: string;
};

export type CircleObject = {
  type: "circle";
  id: string;
  center: string;
  radius?: number;
  through?: string;
  label?: string;
};

export type ArcObject = {
  type: "arc";
  id: string;
  center: string;
  from: string;
  to: string;
  label?: string;
};

export type AngleObject = {
  type: "angle";
  id: string;
  points: [string, string, string];
  label?: string;
};

export type LabelAnnotation = {
  type: "label";
  id: string;
  targetId: string;
  text: string;
};

export type HighlightAnnotation = {
  type: "highlight";
  id: string;
  targetId: string;
  emphasis?: "primary" | "secondary";
};

export type CongruenceAnnotation = {
  type: "congruence";
  id: string;
  targetIds: string[];
  markCount?: number;
};

export type RightAngleAnnotation = {
  type: "right-angle";
  id: string;
  targetId: string;
};

export type MeasurementAnnotation = {
  type: "measurement";
  id: string;
  targetId: string;
  text: string;
};

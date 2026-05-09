export type PointId = string;
export type GeometryObjectId = string;

export type BetterGeometryScene = {
  schema: "bettergeometry.scene";
  version: "0.1";
  id?: string;
  title?: string;
  description?: string;
  objects: GeometryObject[];
  annotations?: GeometryAnnotation[];
  viewport?: GeometryViewport;
};

export type GeometryViewport = {
  padding?: number;
  showGrid?: boolean;
  showAxes?: boolean;
};

export type GeometryObject =
  | PointObject
  | SegmentObject
  | LineObject
  | RayObject
  | PolygonObject
  | CircleObject
  | ArcObject
  | AngleObject;

export type PointObject = {
  type: "point";
  id: PointId;
  x: number;
  y: number;
  label?: string;
};

export type SegmentObject = {
  type: "segment";
  id: GeometryObjectId;
  from: PointId;
  to: PointId;
  label?: string;
};

export type LineObject = {
  type: "line";
  id: GeometryObjectId;
  through: [PointId, PointId];
  label?: string;
};

export type RayObject = {
  type: "ray";
  id: GeometryObjectId;
  from: PointId;
  through: PointId;
  label?: string;
};

export type PolygonObject = {
  type: "polygon";
  id: GeometryObjectId;
  points: PointId[];
  label?: string;
};

export type CircleObject = {
  type: "circle";
  id: GeometryObjectId;
  center: PointId;
  radius?: number;
  through?: PointId;
  label?: string;
};

export type ArcObject = {
  type: "arc";
  id: GeometryObjectId;
  center: PointId;
  from: PointId;
  to: PointId;
  label?: string;
};

export type AngleObject = {
  type: "angle";
  id: GeometryObjectId;
  points: [PointId, PointId, PointId];
  label?: string;
};

export type GeometryAnnotation =
  | LabelAnnotation
  | HighlightAnnotation
  | CongruenceAnnotation
  | RightAngleAnnotation
  | MeasurementAnnotation;

export type LabelAnnotation = {
  type: "label";
  id: string;
  targetId: GeometryObjectId;
  text: string;
};

export type HighlightAnnotation = {
  type: "highlight";
  id: string;
  targetId: GeometryObjectId;
  emphasis?: "primary" | "secondary";
};

export type CongruenceAnnotation = {
  type: "congruence";
  id: string;
  targetIds: GeometryObjectId[];
  markCount?: number;
};

export type RightAngleAnnotation = {
  type: "right-angle";
  id: string;
  targetId: GeometryObjectId;
};

export type MeasurementAnnotation = {
  type: "measurement";
  id: string;
  targetId: GeometryObjectId;
  text: string;
};

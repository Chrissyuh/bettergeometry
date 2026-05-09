import type { BetterGeometryScene } from "../geometry/sceneTypes";

export const sampleScene: BetterGeometryScene = {
  schema: "bettergeometry.scene",
  version: "0.1",
  id: "v0-1-0-generic-scene-demo",
  title: "Generic scene renderer demo",
  description: "A polygon, highlighted segment, circle, and labeled points rendered from scene JSON.",
  viewport: {
    padding: 0.82,
    showGrid: false,
    showAxes: false,
  },
  objects: [
    { type: "point", id: "A", x: 0, y: 0, label: "A" },
    { type: "point", id: "B", x: 5, y: 0, label: "B" },
    { type: "point", id: "C", x: 4.15, y: 3.15, label: "C" },
    { type: "point", id: "D", x: 0.75, y: 3.85, label: "D" },
    { type: "point", id: "O", x: 2.55, y: 1.65, label: "O" },
    { type: "polygon", id: "ABCD", points: ["A", "B", "C", "D"], label: "Polygon ABCD" },
    { type: "segment", id: "AC", from: "A", to: "C", label: "AC" },
    { type: "circle", id: "circleO", center: "O", radius: 0.9, label: "Circle O" },
  ],
  annotations: [
    { type: "highlight", id: "highlight-ac", targetId: "AC", emphasis: "primary" },
  ],
};

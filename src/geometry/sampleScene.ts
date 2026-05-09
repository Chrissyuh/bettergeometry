import type { BetterGeometryScene } from "./sceneTypes";

export const sampleScene: BetterGeometryScene = {
  schema: "bettergeometry.scene",
  version: "0.1",
  viewport: { padding: 0.9, showGrid: false, showAxes: false },
  objects: [
    { type: "point", id: "A", x: 0, y: 0, label: "A" },
    { type: "point", id: "B", x: 5, y: 0, label: "B" },
    { type: "point", id: "C", x: 4.05, y: 2.65, label: "C" },
    { type: "point", id: "D", x: 0.75, y: 3.05, label: "D" },
    { type: "point", id: "O", x: 2.6, y: 1.45, label: "O" },
    { type: "polygon", id: "poly-abcd", points: ["A", "B", "C", "D"], label: "Polygon ABCD", highlight: true },
    { type: "segment", id: "AC", from: "A", to: "C", label: "diagonal" },
    { type: "circle", id: "circle-o", center: "O", radius: 1.0, label: "Circle O", highlight: true },
    { type: "label", id: "hint", x: 2.65, y: 3.35, text: "Generic scene renderer" }
  ]
};

import type { BetterGeometryScene } from "./sceneTypes";

export const sampleScene: BetterGeometryScene = {
  schema: "bettergeometry.scene",
  version: "0.1",
  viewport: { padding: 0.75, showGrid: false, showAxes: false },
  objects: [
    { type: "point", id: "A", x: 0, y: 0, label: "A" },
    { type: "point", id: "B", x: 4.2, y: 0, label: "B" },
    { type: "point", id: "C", x: 1.55, y: 2.65, label: "C" },
    { type: "polygon", id: "triangle-abc", points: ["A", "B", "C"], label: "Triangle ABC", highlight: true },
    { type: "segment", id: "AB", from: "A", to: "B", label: "base AB", highlight: true },

    { type: "point", id: "O", x: 6.05, y: 1.2, label: "O" },
    { type: "point", id: "P", x: 6.95, y: 1.2, label: "P" },
    { type: "circle", id: "circle-o", center: "O", through: "P", label: "Circle O", highlight: true },
    { type: "segment", id: "OP", from: "O", to: "P", label: "radius" }
  ]
};

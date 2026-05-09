import { GeometrySceneRenderer } from "./components/GeometrySceneRenderer";
import { VersionBadge } from "./components/VersionBadge";
import { sampleScene } from "./data/sampleScene";

export default function App() {
  return (
    <main className="app-shell" aria-label="BetterGeometry app shell">
      <VersionBadge />

      <section className="hero" aria-labelledby="app-title">
        <p className="eyebrow">BETTERTOOLS</p>
        <h1 id="app-title">BetterGeometry</h1>
        <p className="hero-subtitle">Generic geometry scene renderer V0.1.0.1</p>
      </section>

      <GeometrySceneRenderer scene={sampleScene} />
    </main>
  );
}

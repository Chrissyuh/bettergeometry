import { VersionBadge } from "./components/VersionBadge";
import { SceneRenderer } from "./components/SceneRenderer";
import { sampleScene } from "./geometry/sampleScene";
import "./styles.css";

export default function App() {
  return (
    <main className="app-shell">
      <VersionBadge />
      <section className="hero-card app-card">
        <p className="eyebrow">BETTERTOOLS</p>
        <h1>BetterGeometry</h1>
        <p className="subtitle">Generic geometry scene JSON renders as clean SVG for ChatGPT explanations.</p>
        <div className="scene-panel">
          <SceneRenderer scene={sampleScene} />
        </div>
      </section>
    </main>
  );
}

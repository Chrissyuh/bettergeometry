import { VersionBadge } from "./components/VersionBadge";

export default function App() {
  return (
    <main className="app-shell" aria-label="BetterGeometry app shell">
      <VersionBadge />

      <section className="hero" aria-labelledby="app-title">
        <p className="eyebrow">BETTERTOOLS</p>
        <h1 id="app-title">BetterGeometry</h1>
      </section>
    </main>
  );
}

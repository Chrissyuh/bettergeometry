import { APP_VERSION } from "../version";

export function VersionBadge() {
  return (
    <div className="version-badge" aria-label={`App version ${APP_VERSION}`}>
      {APP_VERSION}
    </div>
  );
}

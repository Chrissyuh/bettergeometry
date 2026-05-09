import { APP_VERSION } from "../version";

export function VersionBadge() {
  return <div className="version-badge">{APP_VERSION}</div>;
}

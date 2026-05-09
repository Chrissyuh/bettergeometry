export const APP_VERSION = "V0.0.0.1" as const;

export type BetterGeometryVersion = `V${number}.${number}.${number}.${number}`;

export const VERSION_SEGMENTS = {
  publish: 0,
  feature: 0,
  subfeature: 0,
  patch: 0,
} as const;

export const APP_VERSION = "V0.1.0.2" as const;

export type BetterGeometryVersion = `V${number}.${number}.${number}.${number}`;

export const VERSION_SEGMENTS = {
  publish: 0,
  feature: 1,
  subfeature: 0,
  patch: 2,
} as const;

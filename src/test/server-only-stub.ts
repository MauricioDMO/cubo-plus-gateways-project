// Stand-in for the "server-only" package under vitest. The real package
// unconditionally throws on import outside a webpack build (that's how it
// works — Next.js aliases it to a no-op for server bundles; plain Node
// doesn't get that treatment), which would otherwise make every module that
// imports it untestable. Aliased in vitest.config.ts.
export {};



export const index = 1;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/fallbacks/error.svelte.js')).default;
export const imports = ["_app/immutable/nodes/1.4CPKpJ-G.js","_app/immutable/chunks/scheduler.C5XkXVb-.js","_app/immutable/chunks/index.3JaOz61e.js","_app/immutable/chunks/entry.BNlIsj7e.js"];
export const stylesheets = [];
export const fonts = [];

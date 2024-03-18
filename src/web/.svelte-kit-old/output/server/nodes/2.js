

export const index = 2;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_page.svelte.js')).default;
export const imports = ["_app/immutable/nodes/2.CeDW9vWG.js","_app/immutable/chunks/scheduler.C5XkXVb-.js","_app/immutable/chunks/index.3JaOz61e.js"];
export const stylesheets = ["_app/immutable/assets/app.Bf0qldof.css"];
export const fonts = [];

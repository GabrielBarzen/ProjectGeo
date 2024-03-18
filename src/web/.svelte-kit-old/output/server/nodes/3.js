

export const index = 3;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/admin/_page.svelte.js')).default;
export const imports = ["_app/immutable/nodes/3.ZAhC5fMs.js","_app/immutable/chunks/scheduler.C5XkXVb-.js","_app/immutable/chunks/index.3JaOz61e.js","_app/immutable/chunks/AdminControls.svelte_svelte_type_style_lang.BP3ZksxJ.js"];
export const stylesheets = ["_app/immutable/assets/app.Bf0qldof.css","_app/immutable/assets/AdminControls.BCfQk0ca.css"];
export const fonts = [];

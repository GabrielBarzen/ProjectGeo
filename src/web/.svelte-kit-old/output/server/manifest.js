export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["favicon.png"]),
	mimeTypes: {".png":"image/png"},
	_: {
		client: {"start":"_app/immutable/entry/start.DPWSoA9a.js","app":"_app/immutable/entry/app.BZ6_93VR.js","imports":["_app/immutable/entry/start.DPWSoA9a.js","_app/immutable/chunks/entry.BNlIsj7e.js","_app/immutable/chunks/scheduler.C5XkXVb-.js","_app/immutable/entry/app.BZ6_93VR.js","_app/immutable/chunks/scheduler.C5XkXVb-.js","_app/immutable/chunks/index.3JaOz61e.js"],"stylesheets":[],"fonts":[],"uses_env_dynamic_public":false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js'))
		],
		routes: [
			
		],
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();

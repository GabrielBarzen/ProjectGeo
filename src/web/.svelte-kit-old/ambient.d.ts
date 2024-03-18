
// this file is generated — do not edit it


/// <reference types="@sveltejs/kit" />

/**
 * Environment variables [loaded by Vite](https://vitejs.dev/guide/env-and-mode.html#env-files) from `.env` files and `process.env`. Like [`$env/dynamic/private`](https://kit.svelte.dev/docs/modules#$env-dynamic-private), this module cannot be imported into client-side code. This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://kit.svelte.dev/docs/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://kit.svelte.dev/docs/configuration#env) (if configured).
 * 
 * _Unlike_ [`$env/dynamic/private`](https://kit.svelte.dev/docs/modules#$env-dynamic-private), the values exported from this module are statically injected into your bundle at build time, enabling optimisations like dead code elimination.
 * 
 * ```ts
 * import { API_KEY } from '$env/static/private';
 * ```
 * 
 * Note that all environment variables referenced in your code should be declared (for example in an `.env` file), even if they don't have a value until the app is deployed:
 * 
 * ```
 * MY_FEATURE_FLAG=""
 * ```
 * 
 * You can override `.env` values from the command line like so:
 * 
 * ```bash
 * MY_FEATURE_FLAG="enabled" npm run dev
 * ```
 */
declare module '$env/static/private' {
	export const SHELL: string;
	export const LSCOLORS: string;
	export const __ETC_PROFILE_DONE: string;
	export const COLORTERM: string;
	export const XDG_CONFIG_DIRS: string;
	export const KGLOBALACCELD_PLATFORM: string;
	export const LESS: string;
	export const TERM_PROGRAM_VERSION: string;
	export const WLR_NO_HARDWARE_CURSORS: string;
	export const TMUX: string;
	export const NODE_OPTIONS: string;
	export const LC_ADDRESS: string;
	export const LC_NAME: string;
	export const SSH_AUTH_SOCK: string;
	export const XDG_DATA_HOME: string;
	export const XDG_CONFIG_HOME: string;
	export const XCURSOR_PATH: string;
	export const MEMORY_PRESSURE_WRITE: string;
	export const LOCALE_ARCHIVE_2_27: string;
	export const LC_MONETARY: string;
	export const GDK_PIXBUF_MODULE_FILE: string;
	export const NO_AT_BRIDGE: string;
	export const XCURSOR_SIZE: string;
	export const EDITOR: string;
	export const XDG_SEAT: string;
	export const PWD: string;
	export const NIX_PROFILES: string;
	export const LOGNAME: string;
	export const XDG_SESSION_TYPE: string;
	export const CUPS_DATADIR: string;
	export const NIX_PATH: string;
	export const SYSTEMD_EXEC_PID: string;
	export const NIXPKGS_CONFIG: string;
	export const _: string;
	export const XAUTHORITY: string;
	export const XKB_DEFAULT_MODEL: string;
	export const HOME: string;
	export const SSH_ASKPASS: string;
	export const LC_PAPER: string;
	export const LANG: string;
	export const NIXOS_OZONE_WL: string;
	export const LS_COLORS: string;
	export const XDG_CURRENT_DESKTOP: string;
	export const npm_package_version: string;
	export const MEMORY_PRESSURE_WATCH: string;
	export const WAYLAND_DISPLAY: string;
	export const NIXPKGS_QT5_QML_IMPORT_PATH: string;
	export const GIO_EXTRA_MODULES: string;
	export const INVOCATION_ID: string;
	export const MANAGERPID: string;
	export const INIT_CWD: string;
	export const GTK_A11Y: string;
	export const KDE_SESSION_UID: string;
	export const XDG_CACHE_HOME: string;
	export const NIX_USER_PROFILE_DIR: string;
	export const INFOPATH: string;
	export const XKB_DEFAULT_LAYOUT: string;
	export const XDG_SESSION_CLASS: string;
	export const TERMINFO: string;
	export const TERM: string;
	export const LC_IDENTIFICATION: string;
	export const npm_package_name: string;
	export const ZSH: string;
	export const GTK_PATH: string;
	export const LESSOPEN: string;
	export const PROJECT_CWD: string;
	export const USER: string;
	export const TMUX_PANE: string;
	export const PLASMA_USE_QT_SCALING: string;
	export const KDE_SESSION_VERSION: string;
	export const QT_WAYLAND_FORCE_DPI: string;
	export const DISPLAY: string;
	export const npm_lifecycle_event: string;
	export const SHLVL: string;
	export const PAGER: string;
	export const LC_TELEPHONE: string;
	export const QTWEBKIT_PLUGIN_PATH: string;
	export const LC_MESSAGES: string;
	export const LC_MEASUREMENT: string;
	export const __NIXOS_SET_ENVIRONMENT_DONE: string;
	export const XDG_VTNR: string;
	export const XDG_SESSION_ID: string;
	export const LOCALE_ARCHIVE: string;
	export const LESSKEYIN_SYSTEM: string;
	export const npm_config_user_agent: string;
	export const QML2_IMPORT_PATH: string;
	export const TERMINFO_DIRS: string;
	export const XDG_STATE_HOME: string;
	export const npm_execpath: string;
	export const XDG_RUNTIME_DIR: string;
	export const NIX_XDG_DESKTOP_PORTAL_DIR: string;
	export const npm_package_json: string;
	export const LC_TIME: string;
	export const GREETD_SOCK: string;
	export const BERRY_BIN_FOLDER: string;
	export const QT_AUTO_SCREEN_SCALE_FACTOR: string;
	export const JOURNAL_STREAM: string;
	export const XCURSOR_THEME: string;
	export const XDG_DATA_DIRS: string;
	export const KDE_FULL_SESSION: string;
	export const QSG_RENDER_LOOP: string;
	export const LIBEXEC_PATH: string;
	export const PATH: string;
	export const DBUS_SESSION_BUS_ADDRESS: string;
	export const KDE_APPLICATIONS_AS_SCOPE: string;
	export const KPACKAGE_DEP_RESOLVERS_PATH: string;
	export const QT_PLUGIN_PATH: string;
	export const XKB_DEFAULT_OPTIONS: string;
	export const npm_node_execpath: string;
	export const LC_NUMERIC: string;
	export const OLDPWD: string;
	export const TERM_PROGRAM: string;
	export const NODE_ENV: string;
}

/**
 * Similar to [`$env/static/private`](https://kit.svelte.dev/docs/modules#$env-static-private), except that it only includes environment variables that begin with [`config.kit.env.publicPrefix`](https://kit.svelte.dev/docs/configuration#env) (which defaults to `PUBLIC_`), and can therefore safely be exposed to client-side code.
 * 
 * Values are replaced statically at build time.
 * 
 * ```ts
 * import { PUBLIC_BASE_URL } from '$env/static/public';
 * ```
 */
declare module '$env/static/public' {
	
}

/**
 * This module provides access to runtime environment variables, as defined by the platform you're running on. For example if you're using [`adapter-node`](https://github.com/sveltejs/kit/tree/main/packages/adapter-node) (or running [`vite preview`](https://kit.svelte.dev/docs/cli)), this is equivalent to `process.env`. This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://kit.svelte.dev/docs/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://kit.svelte.dev/docs/configuration#env) (if configured).
 * 
 * This module cannot be imported into client-side code.
 * 
 * Dynamic environment variables cannot be used during prerendering.
 * 
 * ```ts
 * import { env } from '$env/dynamic/private';
 * console.log(env.DEPLOYMENT_SPECIFIC_VARIABLE);
 * ```
 * 
 * > In `dev`, `$env/dynamic` always includes environment variables from `.env`. In `prod`, this behavior will depend on your adapter.
 */
declare module '$env/dynamic/private' {
	export const env: {
		SHELL: string;
		LSCOLORS: string;
		__ETC_PROFILE_DONE: string;
		COLORTERM: string;
		XDG_CONFIG_DIRS: string;
		KGLOBALACCELD_PLATFORM: string;
		LESS: string;
		TERM_PROGRAM_VERSION: string;
		WLR_NO_HARDWARE_CURSORS: string;
		TMUX: string;
		NODE_OPTIONS: string;
		LC_ADDRESS: string;
		LC_NAME: string;
		SSH_AUTH_SOCK: string;
		XDG_DATA_HOME: string;
		XDG_CONFIG_HOME: string;
		XCURSOR_PATH: string;
		MEMORY_PRESSURE_WRITE: string;
		LOCALE_ARCHIVE_2_27: string;
		LC_MONETARY: string;
		GDK_PIXBUF_MODULE_FILE: string;
		NO_AT_BRIDGE: string;
		XCURSOR_SIZE: string;
		EDITOR: string;
		XDG_SEAT: string;
		PWD: string;
		NIX_PROFILES: string;
		LOGNAME: string;
		XDG_SESSION_TYPE: string;
		CUPS_DATADIR: string;
		NIX_PATH: string;
		SYSTEMD_EXEC_PID: string;
		NIXPKGS_CONFIG: string;
		_: string;
		XAUTHORITY: string;
		XKB_DEFAULT_MODEL: string;
		HOME: string;
		SSH_ASKPASS: string;
		LC_PAPER: string;
		LANG: string;
		NIXOS_OZONE_WL: string;
		LS_COLORS: string;
		XDG_CURRENT_DESKTOP: string;
		npm_package_version: string;
		MEMORY_PRESSURE_WATCH: string;
		WAYLAND_DISPLAY: string;
		NIXPKGS_QT5_QML_IMPORT_PATH: string;
		GIO_EXTRA_MODULES: string;
		INVOCATION_ID: string;
		MANAGERPID: string;
		INIT_CWD: string;
		GTK_A11Y: string;
		KDE_SESSION_UID: string;
		XDG_CACHE_HOME: string;
		NIX_USER_PROFILE_DIR: string;
		INFOPATH: string;
		XKB_DEFAULT_LAYOUT: string;
		XDG_SESSION_CLASS: string;
		TERMINFO: string;
		TERM: string;
		LC_IDENTIFICATION: string;
		npm_package_name: string;
		ZSH: string;
		GTK_PATH: string;
		LESSOPEN: string;
		PROJECT_CWD: string;
		USER: string;
		TMUX_PANE: string;
		PLASMA_USE_QT_SCALING: string;
		KDE_SESSION_VERSION: string;
		QT_WAYLAND_FORCE_DPI: string;
		DISPLAY: string;
		npm_lifecycle_event: string;
		SHLVL: string;
		PAGER: string;
		LC_TELEPHONE: string;
		QTWEBKIT_PLUGIN_PATH: string;
		LC_MESSAGES: string;
		LC_MEASUREMENT: string;
		__NIXOS_SET_ENVIRONMENT_DONE: string;
		XDG_VTNR: string;
		XDG_SESSION_ID: string;
		LOCALE_ARCHIVE: string;
		LESSKEYIN_SYSTEM: string;
		npm_config_user_agent: string;
		QML2_IMPORT_PATH: string;
		TERMINFO_DIRS: string;
		XDG_STATE_HOME: string;
		npm_execpath: string;
		XDG_RUNTIME_DIR: string;
		NIX_XDG_DESKTOP_PORTAL_DIR: string;
		npm_package_json: string;
		LC_TIME: string;
		GREETD_SOCK: string;
		BERRY_BIN_FOLDER: string;
		QT_AUTO_SCREEN_SCALE_FACTOR: string;
		JOURNAL_STREAM: string;
		XCURSOR_THEME: string;
		XDG_DATA_DIRS: string;
		KDE_FULL_SESSION: string;
		QSG_RENDER_LOOP: string;
		LIBEXEC_PATH: string;
		PATH: string;
		DBUS_SESSION_BUS_ADDRESS: string;
		KDE_APPLICATIONS_AS_SCOPE: string;
		KPACKAGE_DEP_RESOLVERS_PATH: string;
		QT_PLUGIN_PATH: string;
		XKB_DEFAULT_OPTIONS: string;
		npm_node_execpath: string;
		LC_NUMERIC: string;
		OLDPWD: string;
		TERM_PROGRAM: string;
		NODE_ENV: string;
		[key: `PUBLIC_${string}`]: undefined;
		[key: `${string}`]: string | undefined;
	}
}

/**
 * Similar to [`$env/dynamic/private`](https://kit.svelte.dev/docs/modules#$env-dynamic-private), but only includes variables that begin with [`config.kit.env.publicPrefix`](https://kit.svelte.dev/docs/configuration#env) (which defaults to `PUBLIC_`), and can therefore safely be exposed to client-side code.
 * 
 * Note that public dynamic environment variables must all be sent from the server to the client, causing larger network requests — when possible, use `$env/static/public` instead.
 * 
 * Dynamic environment variables cannot be used during prerendering.
 * 
 * ```ts
 * import { env } from '$env/dynamic/public';
 * console.log(env.PUBLIC_DEPLOYMENT_SPECIFIC_VARIABLE);
 * ```
 */
declare module '$env/dynamic/public' {
	export const env: {
		[key: `PUBLIC_${string}`]: string | undefined;
	}
}

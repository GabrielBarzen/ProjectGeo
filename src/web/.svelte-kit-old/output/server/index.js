import { b as base, a as assets, o as override, r as reset, p as public_env, s as safe_public_env, c as options, d as set_private_env, e as prerendering, f as set_public_env, g as get_hooks, h as set_safe_public_env } from "./chunks/internal.js";
import { m as make_trackable, d as disable_search, n as normalize_path, a as add_data_suffix, r as resolve, b as decode_pathname, h as has_data_suffix, s as strip_data_suffix, c as decode_params, v as validate_layout_server_exports, e as validate_layout_exports, f as validate_page_server_exports, g as validate_page_exports, i as validate_server_exports } from "./chunks/exports.js";
import * as devalue from "devalue";
import { n as noop, h as safe_not_equal } from "./chunks/hooks.js";
import { parse, serialize } from "cookie";
import * as set_cookie_parser from "set-cookie-parser";
const DEV = false;
const SVELTE_KIT_ASSETS = "/_svelte_kit_assets";
const ENDPOINT_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"];
const PAGE_METHODS = ["GET", "POST", "HEAD"];
function negotiate(accept, types) {
  const parts = [];
  accept.split(",").forEach((str, i) => {
    const match = /([^/]+)\/([^;]+)(?:;q=([0-9.]+))?/.exec(str);
    if (match) {
      const [, type, subtype, q = "1"] = match;
      parts.push({ type, subtype, q: +q, i });
    }
  });
  parts.sort((a, b) => {
    if (a.q !== b.q) {
      return b.q - a.q;
    }
    if (a.subtype === "*" !== (b.subtype === "*")) {
      return a.subtype === "*" ? 1 : -1;
    }
    if (a.type === "*" !== (b.type === "*")) {
      return a.type === "*" ? 1 : -1;
    }
    return a.i - b.i;
  });
  let accepted;
  let min_priority = Infinity;
  for (const mimetype of types) {
    const [type, subtype] = mimetype.split("/");
    const priority = parts.findIndex(
      (part) => (part.type === type || part.type === "*") && (part.subtype === subtype || part.subtype === "*")
    );
    if (priority !== -1 && priority < min_priority) {
      accepted = mimetype;
      min_priority = priority;
    }
  }
  return accepted;
}
function is_content_type(request, ...types) {
  const type = request.headers.get("content-type")?.split(";", 1)[0].trim() ?? "";
  return types.includes(type.toLowerCase());
}
function is_form_content_type(request) {
  return is_content_type(
    request,
    "application/x-www-form-urlencoded",
    "multipart/form-data",
    "text/plain"
  );
}
class HttpError {
  /**
   * @param {number} status
   * @param {{message: string} extends App.Error ? (App.Error | string | undefined) : App.Error} body
   */
  constructor(status, body2) {
    this.status = status;
    if (typeof body2 === "string") {
      this.body = { message: body2 };
    } else if (body2) {
      this.body = body2;
    } else {
      this.body = { message: `Error: ${status}` };
    }
  }
  toString() {
    return JSON.stringify(this.body);
  }
}
class Redirect {
  /**
   * @param {300 | 301 | 302 | 303 | 304 | 305 | 306 | 307 | 308} status
   * @param {string} location
   */
  constructor(status, location) {
    this.status = status;
    this.location = location;
  }
}
class SvelteKitError extends Error {
  /**
   * @param {number} status
   * @param {string} text
   * @param {string} message
   */
  constructor(status, text2, message) {
    super(message);
    this.status = status;
    this.text = text2;
  }
}
class ActionFailure {
  /**
   * @param {number} status
   * @param {T} data
   */
  constructor(status, data) {
    this.status = status;
    this.data = data;
  }
}
function json(data, init2) {
  const body2 = JSON.stringify(data);
  const headers2 = new Headers(init2?.headers);
  if (!headers2.has("content-length")) {
    headers2.set("content-length", encoder$3.encode(body2).byteLength.toString());
  }
  if (!headers2.has("content-type")) {
    headers2.set("content-type", "application/json");
  }
  return new Response(body2, {
    ...init2,
    headers: headers2
  });
}
const encoder$3 = new TextEncoder();
function text(body2, init2) {
  const headers2 = new Headers(init2?.headers);
  if (!headers2.has("content-length")) {
    const encoded = encoder$3.encode(body2);
    headers2.set("content-length", encoded.byteLength.toString());
    return new Response(encoded, {
      ...init2,
      headers: headers2
    });
  }
  return new Response(body2, {
    ...init2,
    headers: headers2
  });
}
function coalesce_to_error(err) {
  return err instanceof Error || err && /** @type {any} */
  err.name && /** @type {any} */
  err.message ? (
    /** @type {Error} */
    err
  ) : new Error(JSON.stringify(err));
}
function normalize_error(error) {
  return (
    /** @type {import('../runtime/control.js').Redirect | HttpError | SvelteKitError | Error} */
    error
  );
}
function get_status(error) {
  return error instanceof HttpError || error instanceof SvelteKitError ? error.status : 500;
}
function get_message(error) {
  return error instanceof SvelteKitError ? error.text : "Internal Error";
}
function method_not_allowed(mod, method) {
  return text(`${method} method not allowed`, {
    status: 405,
    headers: {
      // https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/405
      // "The server must generate an Allow header field in a 405 status code response"
      allow: allowed_methods(mod).join(", ")
    }
  });
}
function allowed_methods(mod) {
  const allowed = ENDPOINT_METHODS.filter((method) => method in mod);
  if ("GET" in mod || "HEAD" in mod)
    allowed.push("HEAD");
  return allowed;
}
function static_error_page(options2, status, message) {
  let page = options2.templates.error({ status, message });
  return text(page, {
    headers: { "content-type": "text/html; charset=utf-8" },
    status
  });
}
async function handle_fatal_error(event, options2, error) {
  error = error instanceof HttpError ? error : coalesce_to_error(error);
  const status = get_status(error);
  const body2 = await handle_error_and_jsonify(event, options2, error);
  const type = negotiate(event.request.headers.get("accept") || "text/html", [
    "application/json",
    "text/html"
  ]);
  if (event.isDataRequest || type === "application/json") {
    return json(body2, {
      status
    });
  }
  return static_error_page(options2, status, body2.message);
}
async function handle_error_and_jsonify(event, options2, error) {
  if (error instanceof HttpError) {
    return error.body;
  }
  const status = get_status(error);
  const message = get_message(error);
  return await options2.hooks.handleError({ error, event, status, message }) ?? { message };
}
function redirect_response(status, location) {
  const response = new Response(void 0, {
    status,
    headers: { location }
  });
  return response;
}
function clarify_devalue_error(event, error) {
  if (error.path) {
    return `Data returned from \`load\` while rendering ${event.route.id} is not serializable: ${error.message} (data${error.path})`;
  }
  if (error.path === "") {
    return `Data returned from \`load\` while rendering ${event.route.id} is not a plain object`;
  }
  return error.message;
}
function stringify_uses(node) {
  const uses = [];
  if (node.uses && node.uses.dependencies.size > 0) {
    uses.push(`"dependencies":${JSON.stringify(Array.from(node.uses.dependencies))}`);
  }
  if (node.uses && node.uses.search_params.size > 0) {
    uses.push(`"search_params":${JSON.stringify(Array.from(node.uses.search_params))}`);
  }
  if (node.uses && node.uses.params.size > 0) {
    uses.push(`"params":${JSON.stringify(Array.from(node.uses.params))}`);
  }
  if (node.uses?.parent)
    uses.push('"parent":1');
  if (node.uses?.route)
    uses.push('"route":1');
  if (node.uses?.url)
    uses.push('"url":1');
  return `"uses":{${uses.join(",")}}`;
}
async function render_endpoint(event, mod, state) {
  const method = (
    /** @type {import('types').HttpMethod} */
    event.request.method
  );
  let handler = mod[method] || mod.fallback;
  if (method === "HEAD" && mod.GET && !mod.HEAD) {
    handler = mod.GET;
  }
  if (!handler) {
    return method_not_allowed(mod, method);
  }
  const prerender = mod.prerender ?? state.prerender_default;
  if (prerender && (mod.POST || mod.PATCH || mod.PUT || mod.DELETE)) {
    throw new Error("Cannot prerender endpoints that have mutative methods");
  }
  if (state.prerendering && !prerender) {
    if (state.depth > 0) {
      throw new Error(`${event.route.id} is not prerenderable`);
    } else {
      return new Response(void 0, { status: 204 });
    }
  }
  try {
    let response = await handler(
      /** @type {import('@sveltejs/kit').RequestEvent<Record<string, any>>} */
      event
    );
    if (!(response instanceof Response)) {
      throw new Error(
        `Invalid response from route ${event.url.pathname}: handler should return a Response object`
      );
    }
    if (state.prerendering) {
      response = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: new Headers(response.headers)
      });
      response.headers.set("x-sveltekit-prerender", String(prerender));
    }
    return response;
  } catch (e) {
    if (e instanceof Redirect) {
      return new Response(void 0, {
        status: e.status,
        headers: { location: e.location }
      });
    }
    throw e;
  }
}
function is_endpoint_request(event) {
  const { method, headers: headers2 } = event.request;
  if (ENDPOINT_METHODS.includes(method) && !PAGE_METHODS.includes(method)) {
    return true;
  }
  if (method === "POST" && headers2.get("x-sveltekit-action") === "true")
    return false;
  const accept = event.request.headers.get("accept") ?? "*/*";
  return negotiate(accept, ["*", "text/html"]) !== "text/html";
}
function compact(arr) {
  return arr.filter(
    /** @returns {val is NonNullable<T>} */
    (val) => val != null
  );
}
function is_action_json_request(event) {
  const accept = negotiate(event.request.headers.get("accept") ?? "*/*", [
    "application/json",
    "text/html"
  ]);
  return accept === "application/json" && event.request.method === "POST";
}
async function handle_action_json_request(event, options2, server) {
  const actions = server?.actions;
  if (!actions) {
    const no_actions_error = new SvelteKitError(
      405,
      "Method Not Allowed",
      "POST method not allowed. No actions exist for this page"
    );
    return action_json(
      {
        type: "error",
        error: await handle_error_and_jsonify(event, options2, no_actions_error)
      },
      {
        status: no_actions_error.status,
        headers: {
          // https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/405
          // "The server must generate an Allow header field in a 405 status code response"
          allow: "GET"
        }
      }
    );
  }
  check_named_default_separate(actions);
  try {
    const data = await call_action(event, actions);
    if (false)
      ;
    if (data instanceof ActionFailure) {
      return action_json({
        type: "failure",
        status: data.status,
        // @ts-expect-error we assign a string to what is supposed to be an object. That's ok
        // because we don't use the object outside, and this way we have better code navigation
        // through knowing where the related interface is used.
        data: stringify_action_response(
          data.data,
          /** @type {string} */
          event.route.id
        )
      });
    } else {
      return action_json({
        type: "success",
        status: data ? 200 : 204,
        // @ts-expect-error see comment above
        data: stringify_action_response(
          data,
          /** @type {string} */
          event.route.id
        )
      });
    }
  } catch (e) {
    const err = normalize_error(e);
    if (err instanceof Redirect) {
      return action_json_redirect(err);
    }
    return action_json(
      {
        type: "error",
        error: await handle_error_and_jsonify(event, options2, check_incorrect_fail_use(err))
      },
      {
        status: get_status(err)
      }
    );
  }
}
function check_incorrect_fail_use(error) {
  return error instanceof ActionFailure ? new Error('Cannot "throw fail()". Use "return fail()"') : error;
}
function action_json_redirect(redirect) {
  return action_json({
    type: "redirect",
    status: redirect.status,
    location: redirect.location
  });
}
function action_json(data, init2) {
  return json(data, init2);
}
function is_action_request(event) {
  return event.request.method === "POST";
}
async function handle_action_request(event, server) {
  const actions = server?.actions;
  if (!actions) {
    event.setHeaders({
      // https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/405
      // "The server must generate an Allow header field in a 405 status code response"
      allow: "GET"
    });
    return {
      type: "error",
      error: new SvelteKitError(
        405,
        "Method Not Allowed",
        "POST method not allowed. No actions exist for this page"
      )
    };
  }
  check_named_default_separate(actions);
  try {
    const data = await call_action(event, actions);
    if (false)
      ;
    if (data instanceof ActionFailure) {
      return {
        type: "failure",
        status: data.status,
        data: data.data
      };
    } else {
      return {
        type: "success",
        status: 200,
        // @ts-expect-error this will be removed upon serialization, so `undefined` is the same as omission
        data
      };
    }
  } catch (e) {
    const err = normalize_error(e);
    if (err instanceof Redirect) {
      return {
        type: "redirect",
        status: err.status,
        location: err.location
      };
    }
    return {
      type: "error",
      error: check_incorrect_fail_use(err)
    };
  }
}
function check_named_default_separate(actions) {
  if (actions.default && Object.keys(actions).length > 1) {
    throw new Error(
      "When using named actions, the default action cannot be used. See the docs for more info: https://kit.svelte.dev/docs/form-actions#named-actions"
    );
  }
}
async function call_action(event, actions) {
  const url = new URL(event.request.url);
  let name = "default";
  for (const param of url.searchParams) {
    if (param[0].startsWith("/")) {
      name = param[0].slice(1);
      if (name === "default") {
        throw new Error('Cannot use reserved action name "default"');
      }
      break;
    }
  }
  const action = actions[name];
  if (!action) {
    throw new SvelteKitError(404, "Not Found", `No action with name '${name}' found`);
  }
  if (!is_form_content_type(event.request)) {
    throw new SvelteKitError(
      415,
      "Unsupported Media Type",
      `Form actions expect form-encoded data — received ${event.request.headers.get(
        "content-type"
      )}`
    );
  }
  return action(event);
}
function validate_action_return(data) {
  if (data instanceof Redirect) {
    throw new Error("Cannot `return redirect(...)` — use `redirect(...)` instead");
  }
  if (data instanceof HttpError) {
    throw new Error("Cannot `return error(...)` — use `error(...)` or `return fail(...)` instead");
  }
}
function uneval_action_response(data, route_id) {
  return try_deserialize(data, devalue.uneval, route_id);
}
function stringify_action_response(data, route_id) {
  return try_deserialize(data, devalue.stringify, route_id);
}
function try_deserialize(data, fn, route_id) {
  try {
    return fn(data);
  } catch (e) {
    const error = (
      /** @type {any} */
      e
    );
    if ("path" in error) {
      let message = `Data returned from action inside ${route_id} is not serializable: ${error.message}`;
      if (error.path !== "")
        message += ` (data.${error.path})`;
      throw new Error(message);
    }
    throw error;
  }
}
const INVALIDATED_PARAM = "x-sveltekit-invalidated";
const TRAILING_SLASH_PARAM = "x-sveltekit-trailing-slash";
function b64_encode(buffer) {
  if (globalThis.Buffer) {
    return Buffer.from(buffer).toString("base64");
  }
  const little_endian = new Uint8Array(new Uint16Array([1]).buffer)[0] > 0;
  return btoa(
    new TextDecoder(little_endian ? "utf-16le" : "utf-16be").decode(
      new Uint16Array(new Uint8Array(buffer))
    )
  );
}
async function load_server_data({ event, state, node, parent }) {
  if (!node?.server)
    return null;
  let is_tracking = true;
  const uses = {
    dependencies: /* @__PURE__ */ new Set(),
    params: /* @__PURE__ */ new Set(),
    parent: false,
    route: false,
    url: false,
    search_params: /* @__PURE__ */ new Set()
  };
  const url = make_trackable(
    event.url,
    () => {
      if (is_tracking) {
        uses.url = true;
      }
    },
    (param) => {
      if (is_tracking) {
        uses.search_params.add(param);
      }
    }
  );
  if (state.prerendering) {
    disable_search(url);
  }
  const result = await node.server.load?.call(null, {
    ...event,
    fetch: (info, init2) => {
      new URL(info instanceof Request ? info.url : info, event.url);
      return event.fetch(info, init2);
    },
    /** @param {string[]} deps */
    depends: (...deps) => {
      for (const dep of deps) {
        const { href } = new URL(dep, event.url);
        uses.dependencies.add(href);
      }
    },
    params: new Proxy(event.params, {
      get: (target, key2) => {
        if (is_tracking) {
          uses.params.add(key2);
        }
        return target[
          /** @type {string} */
          key2
        ];
      }
    }),
    parent: async () => {
      if (is_tracking) {
        uses.parent = true;
      }
      return parent();
    },
    route: new Proxy(event.route, {
      get: (target, key2) => {
        if (is_tracking) {
          uses.route = true;
        }
        return target[
          /** @type {'id'} */
          key2
        ];
      }
    }),
    url,
    untrack(fn) {
      is_tracking = false;
      try {
        return fn();
      } finally {
        is_tracking = true;
      }
    }
  });
  return {
    type: "data",
    data: result ?? null,
    uses,
    slash: node.server.trailingSlash
  };
}
async function load_data({
  event,
  fetched,
  node,
  parent,
  server_data_promise,
  state,
  resolve_opts,
  csr
}) {
  const server_data_node = await server_data_promise;
  if (!node?.universal?.load) {
    return server_data_node?.data ?? null;
  }
  const result = await node.universal.load.call(null, {
    url: event.url,
    params: event.params,
    data: server_data_node?.data ?? null,
    route: event.route,
    fetch: create_universal_fetch(event, state, fetched, csr, resolve_opts),
    setHeaders: event.setHeaders,
    depends: () => {
    },
    parent,
    untrack: (fn) => fn()
  });
  return result ?? null;
}
function create_universal_fetch(event, state, fetched, csr, resolve_opts) {
  const universal_fetch = async (input, init2) => {
    const cloned_body = input instanceof Request && input.body ? input.clone().body : null;
    const cloned_headers = input instanceof Request && [...input.headers].length ? new Headers(input.headers) : init2?.headers;
    let response = await event.fetch(input, init2);
    const url = new URL(input instanceof Request ? input.url : input, event.url);
    const same_origin = url.origin === event.url.origin;
    let dependency;
    if (same_origin) {
      if (state.prerendering) {
        dependency = { response, body: null };
        state.prerendering.dependencies.set(url.pathname, dependency);
      }
    } else {
      const mode = input instanceof Request ? input.mode : init2?.mode ?? "cors";
      if (mode === "no-cors") {
        response = new Response("", {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
        });
      } else {
        const acao = response.headers.get("access-control-allow-origin");
        if (!acao || acao !== event.url.origin && acao !== "*") {
          throw new Error(
            `CORS error: ${acao ? "Incorrect" : "No"} 'Access-Control-Allow-Origin' header is present on the requested resource`
          );
        }
      }
    }
    const proxy = new Proxy(response, {
      get(response2, key2, _receiver) {
        async function push_fetched(body2, is_b64) {
          const status_number = Number(response2.status);
          if (isNaN(status_number)) {
            throw new Error(
              `response.status is not a number. value: "${response2.status}" type: ${typeof response2.status}`
            );
          }
          fetched.push({
            url: same_origin ? url.href.slice(event.url.origin.length) : url.href,
            method: event.request.method,
            request_body: (
              /** @type {string | ArrayBufferView | undefined} */
              input instanceof Request && cloned_body ? await stream_to_string(cloned_body) : init2?.body
            ),
            request_headers: cloned_headers,
            response_body: body2,
            response: response2,
            is_b64
          });
        }
        if (key2 === "arrayBuffer") {
          return async () => {
            const buffer = await response2.arrayBuffer();
            if (dependency) {
              dependency.body = new Uint8Array(buffer);
            }
            if (buffer instanceof ArrayBuffer) {
              await push_fetched(b64_encode(buffer), true);
            }
            return buffer;
          };
        }
        async function text2() {
          const body2 = await response2.text();
          if (!body2 || typeof body2 === "string") {
            await push_fetched(body2, false);
          }
          if (dependency) {
            dependency.body = body2;
          }
          return body2;
        }
        if (key2 === "text") {
          return text2;
        }
        if (key2 === "json") {
          return async () => {
            return JSON.parse(await text2());
          };
        }
        return Reflect.get(response2, key2, response2);
      }
    });
    if (csr) {
      const get = response.headers.get;
      response.headers.get = (key2) => {
        const lower = key2.toLowerCase();
        const value = get.call(response.headers, lower);
        if (value && !lower.startsWith("x-sveltekit-")) {
          const included = resolve_opts.filterSerializedResponseHeaders(lower, value);
          if (!included) {
            throw new Error(
              `Failed to get response header "${lower}" — it must be included by the \`filterSerializedResponseHeaders\` option: https://kit.svelte.dev/docs/hooks#server-hooks-handle (at ${event.route.id})`
            );
          }
        }
        return value;
      };
    }
    return proxy;
  };
  return (input, init2) => {
    const response = universal_fetch(input, init2);
    response.catch(() => {
    });
    return response;
  };
}
async function stream_to_string(stream) {
  let result = "";
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    result += decoder.decode(value);
  }
  return result;
}
const subscriber_queue = [];
function readable(value, start) {
  return {
    subscribe: writable(value, start).subscribe
  };
}
function writable(value, start = noop) {
  let stop;
  const subscribers = /* @__PURE__ */ new Set();
  function set(new_value) {
    if (safe_not_equal(value, new_value)) {
      value = new_value;
      if (stop) {
        const run_queue = !subscriber_queue.length;
        for (const subscriber of subscribers) {
          subscriber[1]();
          subscriber_queue.push(subscriber, value);
        }
        if (run_queue) {
          for (let i = 0; i < subscriber_queue.length; i += 2) {
            subscriber_queue[i][0](subscriber_queue[i + 1]);
          }
          subscriber_queue.length = 0;
        }
      }
    }
  }
  function update(fn) {
    set(fn(value));
  }
  function subscribe(run, invalidate = noop) {
    const subscriber = [run, invalidate];
    subscribers.add(subscriber);
    if (subscribers.size === 1) {
      stop = start(set, update) || noop;
    }
    run(value);
    return () => {
      subscribers.delete(subscriber);
      if (subscribers.size === 0 && stop) {
        stop();
        stop = null;
      }
    };
  }
  return { set, update, subscribe };
}
function hash(...values) {
  let hash2 = 5381;
  for (const value of values) {
    if (typeof value === "string") {
      let i = value.length;
      while (i)
        hash2 = hash2 * 33 ^ value.charCodeAt(--i);
    } else if (ArrayBuffer.isView(value)) {
      const buffer = new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
      let i = buffer.length;
      while (i)
        hash2 = hash2 * 33 ^ buffer[--i];
    } else {
      throw new TypeError("value must be a string or TypedArray");
    }
  }
  return (hash2 >>> 0).toString(36);
}
const escape_html_attr_dict = {
  "&": "&amp;",
  '"': "&quot;"
};
const escape_html_attr_regex = new RegExp(
  // special characters
  `[${Object.keys(escape_html_attr_dict).join("")}]|[\\ud800-\\udbff](?![\\udc00-\\udfff])|[\\ud800-\\udbff][\\udc00-\\udfff]|[\\udc00-\\udfff]`,
  "g"
);
function escape_html_attr(str) {
  const escaped_str = str.replace(escape_html_attr_regex, (match) => {
    if (match.length === 2) {
      return match;
    }
    return escape_html_attr_dict[match] ?? `&#${match.charCodeAt(0)};`;
  });
  return `"${escaped_str}"`;
}
const replacements = {
  "<": "\\u003C",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029"
};
const pattern = new RegExp(`[${Object.keys(replacements).join("")}]`, "g");
function serialize_data(fetched, filter, prerendering2 = false) {
  const headers2 = {};
  let cache_control = null;
  let age = null;
  let varyAny = false;
  for (const [key2, value] of fetched.response.headers) {
    if (filter(key2, value)) {
      headers2[key2] = value;
    }
    if (key2 === "cache-control")
      cache_control = value;
    else if (key2 === "age")
      age = value;
    else if (key2 === "vary" && value.trim() === "*")
      varyAny = true;
  }
  const payload = {
    status: fetched.response.status,
    statusText: fetched.response.statusText,
    headers: headers2,
    body: fetched.response_body
  };
  const safe_payload = JSON.stringify(payload).replace(pattern, (match) => replacements[match]);
  const attrs = [
    'type="application/json"',
    "data-sveltekit-fetched",
    `data-url=${escape_html_attr(fetched.url)}`
  ];
  if (fetched.is_b64) {
    attrs.push("data-b64");
  }
  if (fetched.request_headers || fetched.request_body) {
    const values = [];
    if (fetched.request_headers) {
      values.push([...new Headers(fetched.request_headers)].join(","));
    }
    if (fetched.request_body) {
      values.push(fetched.request_body);
    }
    attrs.push(`data-hash="${hash(...values)}"`);
  }
  if (!prerendering2 && fetched.method === "GET" && cache_control && !varyAny) {
    const match = /s-maxage=(\d+)/g.exec(cache_control) ?? /max-age=(\d+)/g.exec(cache_control);
    if (match) {
      const ttl = +match[1] - +(age ?? "0");
      attrs.push(`data-ttl="${ttl}"`);
    }
  }
  return `<script ${attrs.join(" ")}>${safe_payload}<\/script>`;
}
const s = JSON.stringify;
const encoder$2 = new TextEncoder();
function sha256(data) {
  if (!key[0])
    precompute();
  const out = init.slice(0);
  const array2 = encode(data);
  for (let i = 0; i < array2.length; i += 16) {
    const w = array2.subarray(i, i + 16);
    let tmp;
    let a;
    let b;
    let out0 = out[0];
    let out1 = out[1];
    let out2 = out[2];
    let out3 = out[3];
    let out4 = out[4];
    let out5 = out[5];
    let out6 = out[6];
    let out7 = out[7];
    for (let i2 = 0; i2 < 64; i2++) {
      if (i2 < 16) {
        tmp = w[i2];
      } else {
        a = w[i2 + 1 & 15];
        b = w[i2 + 14 & 15];
        tmp = w[i2 & 15] = (a >>> 7 ^ a >>> 18 ^ a >>> 3 ^ a << 25 ^ a << 14) + (b >>> 17 ^ b >>> 19 ^ b >>> 10 ^ b << 15 ^ b << 13) + w[i2 & 15] + w[i2 + 9 & 15] | 0;
      }
      tmp = tmp + out7 + (out4 >>> 6 ^ out4 >>> 11 ^ out4 >>> 25 ^ out4 << 26 ^ out4 << 21 ^ out4 << 7) + (out6 ^ out4 & (out5 ^ out6)) + key[i2];
      out7 = out6;
      out6 = out5;
      out5 = out4;
      out4 = out3 + tmp | 0;
      out3 = out2;
      out2 = out1;
      out1 = out0;
      out0 = tmp + (out1 & out2 ^ out3 & (out1 ^ out2)) + (out1 >>> 2 ^ out1 >>> 13 ^ out1 >>> 22 ^ out1 << 30 ^ out1 << 19 ^ out1 << 10) | 0;
    }
    out[0] = out[0] + out0 | 0;
    out[1] = out[1] + out1 | 0;
    out[2] = out[2] + out2 | 0;
    out[3] = out[3] + out3 | 0;
    out[4] = out[4] + out4 | 0;
    out[5] = out[5] + out5 | 0;
    out[6] = out[6] + out6 | 0;
    out[7] = out[7] + out7 | 0;
  }
  const bytes = new Uint8Array(out.buffer);
  reverse_endianness(bytes);
  return base64(bytes);
}
const init = new Uint32Array(8);
const key = new Uint32Array(64);
function precompute() {
  function frac(x) {
    return (x - Math.floor(x)) * 4294967296;
  }
  let prime = 2;
  for (let i = 0; i < 64; prime++) {
    let is_prime = true;
    for (let factor = 2; factor * factor <= prime; factor++) {
      if (prime % factor === 0) {
        is_prime = false;
        break;
      }
    }
    if (is_prime) {
      if (i < 8) {
        init[i] = frac(prime ** (1 / 2));
      }
      key[i] = frac(prime ** (1 / 3));
      i++;
    }
  }
}
function reverse_endianness(bytes) {
  for (let i = 0; i < bytes.length; i += 4) {
    const a = bytes[i + 0];
    const b = bytes[i + 1];
    const c = bytes[i + 2];
    const d = bytes[i + 3];
    bytes[i + 0] = d;
    bytes[i + 1] = c;
    bytes[i + 2] = b;
    bytes[i + 3] = a;
  }
}
function encode(str) {
  const encoded = encoder$2.encode(str);
  const length = encoded.length * 8;
  const size = 512 * Math.ceil((length + 65) / 512);
  const bytes = new Uint8Array(size / 8);
  bytes.set(encoded);
  bytes[encoded.length] = 128;
  reverse_endianness(bytes);
  const words = new Uint32Array(bytes.buffer);
  words[words.length - 2] = Math.floor(length / 4294967296);
  words[words.length - 1] = length;
  return words;
}
const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".split("");
function base64(bytes) {
  const l = bytes.length;
  let result = "";
  let i;
  for (i = 2; i < l; i += 3) {
    result += chars[bytes[i - 2] >> 2];
    result += chars[(bytes[i - 2] & 3) << 4 | bytes[i - 1] >> 4];
    result += chars[(bytes[i - 1] & 15) << 2 | bytes[i] >> 6];
    result += chars[bytes[i] & 63];
  }
  if (i === l + 1) {
    result += chars[bytes[i - 2] >> 2];
    result += chars[(bytes[i - 2] & 3) << 4];
    result += "==";
  }
  if (i === l) {
    result += chars[bytes[i - 2] >> 2];
    result += chars[(bytes[i - 2] & 3) << 4 | bytes[i - 1] >> 4];
    result += chars[(bytes[i - 1] & 15) << 2];
    result += "=";
  }
  return result;
}
const array = new Uint8Array(16);
function generate_nonce() {
  crypto.getRandomValues(array);
  return base64(array);
}
const quoted = /* @__PURE__ */ new Set([
  "self",
  "unsafe-eval",
  "unsafe-hashes",
  "unsafe-inline",
  "none",
  "strict-dynamic",
  "report-sample",
  "wasm-unsafe-eval",
  "script"
]);
const crypto_pattern = /^(nonce|sha\d\d\d)-/;
class BaseProvider {
  /** @type {boolean} */
  #use_hashes;
  /** @type {boolean} */
  #script_needs_csp;
  /** @type {boolean} */
  #style_needs_csp;
  /** @type {import('types').CspDirectives} */
  #directives;
  /** @type {import('types').Csp.Source[]} */
  #script_src;
  /** @type {import('types').Csp.Source[]} */
  #script_src_elem;
  /** @type {import('types').Csp.Source[]} */
  #style_src;
  /** @type {import('types').Csp.Source[]} */
  #style_src_attr;
  /** @type {import('types').Csp.Source[]} */
  #style_src_elem;
  /** @type {string} */
  #nonce;
  /**
   * @param {boolean} use_hashes
   * @param {import('types').CspDirectives} directives
   * @param {string} nonce
   */
  constructor(use_hashes, directives, nonce) {
    this.#use_hashes = use_hashes;
    this.#directives = directives;
    const d = this.#directives;
    this.#script_src = [];
    this.#script_src_elem = [];
    this.#style_src = [];
    this.#style_src_attr = [];
    this.#style_src_elem = [];
    const effective_script_src = d["script-src"] || d["default-src"];
    const script_src_elem = d["script-src-elem"];
    const effective_style_src = d["style-src"] || d["default-src"];
    const style_src_attr = d["style-src-attr"];
    const style_src_elem = d["style-src-elem"];
    this.#script_needs_csp = !!effective_script_src && effective_script_src.filter((value) => value !== "unsafe-inline").length > 0 || !!script_src_elem && script_src_elem.filter((value) => value !== "unsafe-inline").length > 0;
    this.#style_needs_csp = !!effective_style_src && effective_style_src.filter((value) => value !== "unsafe-inline").length > 0 || !!style_src_attr && style_src_attr.filter((value) => value !== "unsafe-inline").length > 0 || !!style_src_elem && style_src_elem.filter((value) => value !== "unsafe-inline").length > 0;
    this.script_needs_nonce = this.#script_needs_csp && !this.#use_hashes;
    this.style_needs_nonce = this.#style_needs_csp && !this.#use_hashes;
    this.#nonce = nonce;
  }
  /** @param {string} content */
  add_script(content) {
    if (this.#script_needs_csp) {
      const d = this.#directives;
      if (this.#use_hashes) {
        const hash2 = sha256(content);
        this.#script_src.push(`sha256-${hash2}`);
        if (d["script-src-elem"]?.length) {
          this.#script_src_elem.push(`sha256-${hash2}`);
        }
      } else {
        if (this.#script_src.length === 0) {
          this.#script_src.push(`nonce-${this.#nonce}`);
        }
        if (d["script-src-elem"]?.length) {
          this.#script_src_elem.push(`nonce-${this.#nonce}`);
        }
      }
    }
  }
  /** @param {string} content */
  add_style(content) {
    if (this.#style_needs_csp) {
      const empty_comment_hash = "9OlNO0DNEeaVzHL4RZwCLsBHA8WBQ8toBp/4F5XV2nc=";
      const d = this.#directives;
      if (this.#use_hashes) {
        const hash2 = sha256(content);
        this.#style_src.push(`sha256-${hash2}`);
        if (d["style-src-attr"]?.length) {
          this.#style_src_attr.push(`sha256-${hash2}`);
        }
        if (d["style-src-elem"]?.length) {
          if (hash2 !== empty_comment_hash && !d["style-src-elem"].includes(`sha256-${empty_comment_hash}`)) {
            this.#style_src_elem.push(`sha256-${empty_comment_hash}`);
          }
          this.#style_src_elem.push(`sha256-${hash2}`);
        }
      } else {
        if (this.#style_src.length === 0 && !d["style-src"]?.includes("unsafe-inline")) {
          this.#style_src.push(`nonce-${this.#nonce}`);
        }
        if (d["style-src-attr"]?.length) {
          this.#style_src_attr.push(`nonce-${this.#nonce}`);
        }
        if (d["style-src-elem"]?.length) {
          if (!d["style-src-elem"].includes(`sha256-${empty_comment_hash}`)) {
            this.#style_src_elem.push(`sha256-${empty_comment_hash}`);
          }
          this.#style_src_elem.push(`nonce-${this.#nonce}`);
        }
      }
    }
  }
  /**
   * @param {boolean} [is_meta]
   */
  get_header(is_meta = false) {
    const header = [];
    const directives = { ...this.#directives };
    if (this.#style_src.length > 0) {
      directives["style-src"] = [
        ...directives["style-src"] || directives["default-src"] || [],
        ...this.#style_src
      ];
    }
    if (this.#style_src_attr.length > 0) {
      directives["style-src-attr"] = [
        ...directives["style-src-attr"] || [],
        ...this.#style_src_attr
      ];
    }
    if (this.#style_src_elem.length > 0) {
      directives["style-src-elem"] = [
        ...directives["style-src-elem"] || [],
        ...this.#style_src_elem
      ];
    }
    if (this.#script_src.length > 0) {
      directives["script-src"] = [
        ...directives["script-src"] || directives["default-src"] || [],
        ...this.#script_src
      ];
    }
    if (this.#script_src_elem.length > 0) {
      directives["script-src-elem"] = [
        ...directives["script-src-elem"] || [],
        ...this.#script_src_elem
      ];
    }
    for (const key2 in directives) {
      if (is_meta && (key2 === "frame-ancestors" || key2 === "report-uri" || key2 === "sandbox")) {
        continue;
      }
      const value = (
        /** @type {string[] | true} */
        directives[key2]
      );
      if (!value)
        continue;
      const directive = [key2];
      if (Array.isArray(value)) {
        value.forEach((value2) => {
          if (quoted.has(value2) || crypto_pattern.test(value2)) {
            directive.push(`'${value2}'`);
          } else {
            directive.push(value2);
          }
        });
      }
      header.push(directive.join(" "));
    }
    return header.join("; ");
  }
}
class CspProvider extends BaseProvider {
  get_meta() {
    const content = this.get_header(true);
    if (!content) {
      return;
    }
    return `<meta http-equiv="content-security-policy" content=${escape_html_attr(content)}>`;
  }
}
class CspReportOnlyProvider extends BaseProvider {
  /**
   * @param {boolean} use_hashes
   * @param {import('types').CspDirectives} directives
   * @param {string} nonce
   */
  constructor(use_hashes, directives, nonce) {
    super(use_hashes, directives, nonce);
    if (Object.values(directives).filter((v) => !!v).length > 0) {
      const has_report_to = directives["report-to"]?.length ?? 0 > 0;
      const has_report_uri = directives["report-uri"]?.length ?? 0 > 0;
      if (!has_report_to && !has_report_uri) {
        throw Error(
          "`content-security-policy-report-only` must be specified with either the `report-to` or `report-uri` directives, or both"
        );
      }
    }
  }
}
class Csp {
  /** @readonly */
  nonce = generate_nonce();
  /** @type {CspProvider} */
  csp_provider;
  /** @type {CspReportOnlyProvider} */
  report_only_provider;
  /**
   * @param {import('./types.js').CspConfig} config
   * @param {import('./types.js').CspOpts} opts
   */
  constructor({ mode, directives, reportOnly }, { prerender }) {
    const use_hashes = mode === "hash" || mode === "auto" && prerender;
    this.csp_provider = new CspProvider(use_hashes, directives, this.nonce);
    this.report_only_provider = new CspReportOnlyProvider(use_hashes, reportOnly, this.nonce);
  }
  get script_needs_nonce() {
    return this.csp_provider.script_needs_nonce || this.report_only_provider.script_needs_nonce;
  }
  get style_needs_nonce() {
    return this.csp_provider.style_needs_nonce || this.report_only_provider.style_needs_nonce;
  }
  /** @param {string} content */
  add_script(content) {
    this.csp_provider.add_script(content);
    this.report_only_provider.add_script(content);
  }
  /** @param {string} content */
  add_style(content) {
    this.csp_provider.add_style(content);
    this.report_only_provider.add_style(content);
  }
}
function defer() {
  let fulfil;
  let reject;
  const promise = new Promise((f, r) => {
    fulfil = f;
    reject = r;
  });
  return { promise, fulfil, reject };
}
function create_async_iterator() {
  const deferred = [defer()];
  return {
    iterator: {
      [Symbol.asyncIterator]() {
        return {
          next: async () => {
            const next = await deferred[0].promise;
            if (!next.done)
              deferred.shift();
            return next;
          }
        };
      }
    },
    push: (value) => {
      deferred[deferred.length - 1].fulfil({
        value,
        done: false
      });
      deferred.push(defer());
    },
    done: () => {
      deferred[deferred.length - 1].fulfil({ done: true });
    }
  };
}
const updated = {
  ...readable(false),
  check: () => false
};
const encoder$1 = new TextEncoder();
async function render_response({
  branch,
  fetched,
  options: options2,
  manifest,
  state,
  page_config,
  status,
  error = null,
  event,
  resolve_opts,
  action_result
}) {
  if (state.prerendering) {
    if (options2.csp.mode === "nonce") {
      throw new Error('Cannot use prerendering if config.kit.csp.mode === "nonce"');
    }
    if (options2.app_template_contains_nonce) {
      throw new Error("Cannot use prerendering if page template contains %sveltekit.nonce%");
    }
  }
  const { client } = manifest._;
  const modulepreloads = new Set(client.imports);
  const stylesheets = new Set(client.stylesheets);
  const fonts = new Set(client.fonts);
  const link_header_preloads = /* @__PURE__ */ new Set();
  const inline_styles = /* @__PURE__ */ new Map();
  let rendered;
  const form_value = action_result?.type === "success" || action_result?.type === "failure" ? action_result.data ?? null : null;
  let base$1 = base;
  let assets$1 = assets;
  let base_expression = s(base);
  if (!state.prerendering?.fallback) {
    const segments = event.url.pathname.slice(base.length).split("/").slice(2);
    base$1 = segments.map(() => "..").join("/") || ".";
    base_expression = `new URL(${s(base$1)}, location).pathname.slice(0, -1)`;
    if (!assets || assets[0] === "/" && assets !== SVELTE_KIT_ASSETS) {
      assets$1 = base$1;
    }
  }
  if (page_config.ssr) {
    const props = {
      stores: {
        page: writable(null),
        navigating: writable(null),
        updated
      },
      constructors: await Promise.all(branch.map(({ node }) => node.component())),
      form: form_value
    };
    let data2 = {};
    for (let i = 0; i < branch.length; i += 1) {
      data2 = { ...data2, ...branch[i].data };
      props[`data_${i}`] = data2;
    }
    props.page = {
      error,
      params: (
        /** @type {Record<string, any>} */
        event.params
      ),
      route: event.route,
      status,
      url: event.url,
      data: data2,
      form: form_value,
      state: {}
    };
    override({ base: base$1, assets: assets$1 });
    {
      try {
        rendered = options2.root.render(props);
      } finally {
        reset();
      }
    }
    for (const { node } of branch) {
      for (const url of node.imports)
        modulepreloads.add(url);
      for (const url of node.stylesheets)
        stylesheets.add(url);
      for (const url of node.fonts)
        fonts.add(url);
      if (node.inline_styles) {
        Object.entries(await node.inline_styles()).forEach(([k, v]) => inline_styles.set(k, v));
      }
    }
  } else {
    rendered = { head: "", html: "", css: { code: "", map: null } };
  }
  let head = "";
  let body2 = rendered.html;
  const csp = new Csp(options2.csp, {
    prerender: !!state.prerendering
  });
  const prefixed = (path) => {
    if (path.startsWith("/")) {
      return base + path;
    }
    return `${assets$1}/${path}`;
  };
  if (inline_styles.size > 0) {
    const content = Array.from(inline_styles.values()).join("\n");
    const attributes = [];
    if (csp.style_needs_nonce)
      attributes.push(` nonce="${csp.nonce}"`);
    csp.add_style(content);
    head += `
	<style${attributes.join("")}>${content}</style>`;
  }
  for (const dep of stylesheets) {
    const path = prefixed(dep);
    const attributes = ['rel="stylesheet"'];
    if (inline_styles.has(dep)) {
      attributes.push("disabled", 'media="(max-width: 0)"');
    } else {
      if (resolve_opts.preload({ type: "css", path })) {
        const preload_atts = ['rel="preload"', 'as="style"'];
        link_header_preloads.add(`<${encodeURI(path)}>; ${preload_atts.join(";")}; nopush`);
      }
    }
    head += `
		<link href="${path}" ${attributes.join(" ")}>`;
  }
  for (const dep of fonts) {
    const path = prefixed(dep);
    if (resolve_opts.preload({ type: "font", path })) {
      const ext = dep.slice(dep.lastIndexOf(".") + 1);
      const attributes = [
        'rel="preload"',
        'as="font"',
        `type="font/${ext}"`,
        `href="${path}"`,
        "crossorigin"
      ];
      head += `
		<link ${attributes.join(" ")}>`;
    }
  }
  const global = `__sveltekit_${options2.version_hash}`;
  const { data, chunks } = get_data(
    event,
    options2,
    branch.map((b) => b.server_data),
    global
  );
  if (page_config.ssr && page_config.csr) {
    body2 += `
			${fetched.map(
      (item) => serialize_data(item, resolve_opts.filterSerializedResponseHeaders, !!state.prerendering)
    ).join("\n			")}`;
  }
  if (page_config.csr) {
    if (client.uses_env_dynamic_public && state.prerendering) {
      modulepreloads.add(`${options2.app_dir}/env.js`);
    }
    const included_modulepreloads = Array.from(modulepreloads, (dep) => prefixed(dep)).filter(
      (path) => resolve_opts.preload({ type: "js", path })
    );
    for (const path of included_modulepreloads) {
      link_header_preloads.add(`<${encodeURI(path)}>; rel="modulepreload"; nopush`);
      if (options2.preload_strategy !== "modulepreload") {
        head += `
		<link rel="preload" as="script" crossorigin="anonymous" href="${path}">`;
      } else if (state.prerendering) {
        head += `
		<link rel="modulepreload" href="${path}">`;
      }
    }
    const blocks = [];
    const load_env_eagerly = client.uses_env_dynamic_public && state.prerendering;
    const properties = [`base: ${base_expression}`];
    if (assets) {
      properties.push(`assets: ${s(assets)}`);
    }
    if (client.uses_env_dynamic_public) {
      properties.push(`env: ${load_env_eagerly ? "null" : s(public_env)}`);
    }
    if (chunks) {
      blocks.push("const deferred = new Map();");
      properties.push(`defer: (id) => new Promise((fulfil, reject) => {
							deferred.set(id, { fulfil, reject });
						})`);
      properties.push(`resolve: ({ id, data, error }) => {
							const { fulfil, reject } = deferred.get(id);
							deferred.delete(id);

							if (error) reject(error);
							else fulfil(data);
						}`);
    }
    blocks.push(`${global} = {
						${properties.join(",\n						")}
					};`);
    const args = ["app", "element"];
    blocks.push("const element = document.currentScript.parentElement;");
    if (page_config.ssr) {
      const serialized = { form: "null", error: "null" };
      blocks.push(`const data = ${data};`);
      if (form_value) {
        serialized.form = uneval_action_response(
          form_value,
          /** @type {string} */
          event.route.id
        );
      }
      if (error) {
        serialized.error = devalue.uneval(error);
      }
      const hydrate = [
        `node_ids: [${branch.map(({ node }) => node.index).join(", ")}]`,
        "data",
        `form: ${serialized.form}`,
        `error: ${serialized.error}`
      ];
      if (status !== 200) {
        hydrate.push(`status: ${status}`);
      }
      if (options2.embedded) {
        hydrate.push(`params: ${devalue.uneval(event.params)}`, `route: ${s(event.route)}`);
      }
      const indent = "	".repeat(load_env_eagerly ? 7 : 6);
      args.push(`{
${indent}	${hydrate.join(`,
${indent}	`)}
${indent}}`);
    }
    if (load_env_eagerly) {
      blocks.push(`import(${s(`${base$1}/${options2.app_dir}/env.js`)}).then(({ env }) => {
						${global}.env = env;

						Promise.all([
							import(${s(prefixed(client.start))}),
							import(${s(prefixed(client.app))})
						]).then(([kit, app]) => {
							kit.start(${args.join(", ")});
						});
					});`);
    } else {
      blocks.push(`Promise.all([
						import(${s(prefixed(client.start))}),
						import(${s(prefixed(client.app))})
					]).then(([kit, app]) => {
						kit.start(${args.join(", ")});
					});`);
    }
    if (options2.service_worker) {
      const opts = "";
      blocks.push(`if ('serviceWorker' in navigator) {
						addEventListener('load', function () {
							navigator.serviceWorker.register('${prefixed("service-worker.js")}'${opts});
						});
					}`);
    }
    const init_app = `
				{
					${blocks.join("\n\n					")}
				}
			`;
    csp.add_script(init_app);
    body2 += `
			<script${csp.script_needs_nonce ? ` nonce="${csp.nonce}"` : ""}>${init_app}<\/script>
		`;
  }
  const headers2 = new Headers({
    "x-sveltekit-page": "true",
    "content-type": "text/html"
  });
  if (state.prerendering) {
    const http_equiv = [];
    const csp_headers = csp.csp_provider.get_meta();
    if (csp_headers) {
      http_equiv.push(csp_headers);
    }
    if (state.prerendering.cache) {
      http_equiv.push(`<meta http-equiv="cache-control" content="${state.prerendering.cache}">`);
    }
    if (http_equiv.length > 0) {
      head = http_equiv.join("\n") + head;
    }
  } else {
    const csp_header = csp.csp_provider.get_header();
    if (csp_header) {
      headers2.set("content-security-policy", csp_header);
    }
    const report_only_header = csp.report_only_provider.get_header();
    if (report_only_header) {
      headers2.set("content-security-policy-report-only", report_only_header);
    }
    if (link_header_preloads.size) {
      headers2.set("link", Array.from(link_header_preloads).join(", "));
    }
  }
  head += rendered.head;
  const html = options2.templates.app({
    head,
    body: body2,
    assets: assets$1,
    nonce: (
      /** @type {string} */
      csp.nonce
    ),
    env: safe_public_env
  });
  const transformed = await resolve_opts.transformPageChunk({
    html,
    done: true
  }) || "";
  if (!chunks) {
    headers2.set("etag", `"${hash(transformed)}"`);
  }
  return !chunks ? text(transformed, {
    status,
    headers: headers2
  }) : new Response(
    new ReadableStream({
      async start(controller) {
        controller.enqueue(encoder$1.encode(transformed + "\n"));
        for await (const chunk of chunks) {
          controller.enqueue(encoder$1.encode(chunk));
        }
        controller.close();
      },
      type: "bytes"
    }),
    {
      headers: {
        "content-type": "text/html"
      }
    }
  );
}
function get_data(event, options2, nodes, global) {
  let promise_id = 1;
  let count = 0;
  const { iterator, push, done } = create_async_iterator();
  function replacer(thing) {
    if (typeof thing?.then === "function") {
      const id = promise_id++;
      count += 1;
      thing.then(
        /** @param {any} data */
        (data) => ({ data })
      ).catch(
        /** @param {any} error */
        async (error) => ({
          error: await handle_error_and_jsonify(event, options2, error)
        })
      ).then(
        /**
         * @param {{data: any; error: any}} result
         */
        async ({ data, error }) => {
          count -= 1;
          let str;
          try {
            str = devalue.uneval({ id, data, error }, replacer);
          } catch (e) {
            error = await handle_error_and_jsonify(
              event,
              options2,
              new Error(`Failed to serialize promise while rendering ${event.route.id}`)
            );
            data = void 0;
            str = devalue.uneval({ id, data, error }, replacer);
          }
          push(`<script>${global}.resolve(${str})<\/script>
`);
          if (count === 0)
            done();
        }
      );
      return `${global}.defer(${id})`;
    }
  }
  try {
    const strings = nodes.map((node) => {
      if (!node)
        return "null";
      return `{"type":"data","data":${devalue.uneval(node.data, replacer)},${stringify_uses(node)}${node.slash ? `,"slash":${JSON.stringify(node.slash)}` : ""}}`;
    });
    return {
      data: `[${strings.join(",")}]`,
      chunks: count > 0 ? iterator : null
    };
  } catch (e) {
    throw new Error(clarify_devalue_error(
      event,
      /** @type {any} */
      e
    ));
  }
}
function get_option(nodes, option) {
  return nodes.reduce(
    (value, node) => {
      return (
        /** @type {Value} TypeScript's too dumb to understand this */
        node?.universal?.[option] ?? node?.server?.[option] ?? value
      );
    },
    /** @type {Value | undefined} */
    void 0
  );
}
async function respond_with_error({
  event,
  options: options2,
  manifest,
  state,
  status,
  error,
  resolve_opts
}) {
  if (event.request.headers.get("x-sveltekit-error")) {
    return static_error_page(
      options2,
      status,
      /** @type {Error} */
      error.message
    );
  }
  const fetched = [];
  try {
    const branch = [];
    const default_layout = await manifest._.nodes[0]();
    const ssr = get_option([default_layout], "ssr") ?? true;
    const csr = get_option([default_layout], "csr") ?? true;
    if (ssr) {
      state.error = true;
      const server_data_promise = load_server_data({
        event,
        state,
        node: default_layout,
        parent: async () => ({})
      });
      const server_data = await server_data_promise;
      const data = await load_data({
        event,
        fetched,
        node: default_layout,
        parent: async () => ({}),
        resolve_opts,
        server_data_promise,
        state,
        csr
      });
      branch.push(
        {
          node: default_layout,
          server_data,
          data
        },
        {
          node: await manifest._.nodes[1](),
          // 1 is always the root error
          data: null,
          server_data: null
        }
      );
    }
    return await render_response({
      options: options2,
      manifest,
      state,
      page_config: {
        ssr,
        csr
      },
      status,
      error: await handle_error_and_jsonify(event, options2, error),
      branch,
      fetched,
      event,
      resolve_opts
    });
  } catch (e) {
    if (e instanceof Redirect) {
      return redirect_response(e.status, e.location);
    }
    return static_error_page(
      options2,
      get_status(e),
      (await handle_error_and_jsonify(event, options2, e)).message
    );
  }
}
function once(fn) {
  let done = false;
  let result;
  return () => {
    if (done)
      return result;
    done = true;
    return result = fn();
  };
}
const encoder = new TextEncoder();
async function render_data(event, route, options2, manifest, state, invalidated_data_nodes, trailing_slash) {
  if (!route.page) {
    return new Response(void 0, {
      status: 404
    });
  }
  try {
    const node_ids = [...route.page.layouts, route.page.leaf];
    const invalidated = invalidated_data_nodes ?? node_ids.map(() => true);
    let aborted = false;
    const url = new URL(event.url);
    url.pathname = normalize_path(url.pathname, trailing_slash);
    const new_event = { ...event, url };
    const functions = node_ids.map((n, i) => {
      return once(async () => {
        try {
          if (aborted) {
            return (
              /** @type {import('types').ServerDataSkippedNode} */
              {
                type: "skip"
              }
            );
          }
          const node = n == void 0 ? n : await manifest._.nodes[n]();
          return load_server_data({
            event: new_event,
            state,
            node,
            parent: async () => {
              const data2 = {};
              for (let j = 0; j < i; j += 1) {
                const parent = (
                  /** @type {import('types').ServerDataNode | null} */
                  await functions[j]()
                );
                if (parent) {
                  Object.assign(data2, parent.data);
                }
              }
              return data2;
            }
          });
        } catch (e) {
          aborted = true;
          throw e;
        }
      });
    });
    const promises = functions.map(async (fn, i) => {
      if (!invalidated[i]) {
        return (
          /** @type {import('types').ServerDataSkippedNode} */
          {
            type: "skip"
          }
        );
      }
      return fn();
    });
    let length = promises.length;
    const nodes = await Promise.all(
      promises.map(
        (p, i) => p.catch(async (error) => {
          if (error instanceof Redirect) {
            throw error;
          }
          length = Math.min(length, i + 1);
          return (
            /** @type {import('types').ServerErrorNode} */
            {
              type: "error",
              error: await handle_error_and_jsonify(event, options2, error),
              status: error instanceof HttpError || error instanceof SvelteKitError ? error.status : void 0
            }
          );
        })
      )
    );
    const { data, chunks } = get_data_json(event, options2, nodes);
    if (!chunks) {
      return json_response(data);
    }
    return new Response(
      new ReadableStream({
        async start(controller) {
          controller.enqueue(encoder.encode(data));
          for await (const chunk of chunks) {
            controller.enqueue(encoder.encode(chunk));
          }
          controller.close();
        },
        type: "bytes"
      }),
      {
        headers: {
          // we use a proprietary content type to prevent buffering.
          // the `text` prefix makes it inspectable
          "content-type": "text/sveltekit-data",
          "cache-control": "private, no-store"
        }
      }
    );
  } catch (e) {
    const error = normalize_error(e);
    if (error instanceof Redirect) {
      return redirect_json_response(error);
    } else {
      return json_response(await handle_error_and_jsonify(event, options2, error), 500);
    }
  }
}
function json_response(json2, status = 200) {
  return text(typeof json2 === "string" ? json2 : JSON.stringify(json2), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "private, no-store"
    }
  });
}
function redirect_json_response(redirect) {
  return json_response({
    type: "redirect",
    location: redirect.location
  });
}
function get_data_json(event, options2, nodes) {
  let promise_id = 1;
  let count = 0;
  const { iterator, push, done } = create_async_iterator();
  const reducers = {
    /** @param {any} thing */
    Promise: (thing) => {
      if (typeof thing?.then === "function") {
        const id = promise_id++;
        count += 1;
        let key2 = "data";
        thing.catch(
          /** @param {any} e */
          async (e) => {
            key2 = "error";
            return handle_error_and_jsonify(
              event,
              options2,
              /** @type {any} */
              e
            );
          }
        ).then(
          /** @param {any} value */
          async (value) => {
            let str;
            try {
              str = devalue.stringify(value, reducers);
            } catch (e) {
              const error = await handle_error_and_jsonify(
                event,
                options2,
                new Error(`Failed to serialize promise while rendering ${event.route.id}`)
              );
              key2 = "error";
              str = devalue.stringify(error, reducers);
            }
            count -= 1;
            push(`{"type":"chunk","id":${id},"${key2}":${str}}
`);
            if (count === 0)
              done();
          }
        );
        return id;
      }
    }
  };
  try {
    const strings = nodes.map((node) => {
      if (!node)
        return "null";
      if (node.type === "error" || node.type === "skip") {
        return JSON.stringify(node);
      }
      return `{"type":"data","data":${devalue.stringify(node.data, reducers)},${stringify_uses(
        node
      )}${node.slash ? `,"slash":${JSON.stringify(node.slash)}` : ""}}`;
    });
    return {
      data: `{"type":"data","nodes":[${strings.join(",")}]}
`,
      chunks: count > 0 ? iterator : null
    };
  } catch (e) {
    throw new Error(clarify_devalue_error(
      event,
      /** @type {any} */
      e
    ));
  }
}
function load_page_nodes(page, manifest) {
  return Promise.all([
    // we use == here rather than === because [undefined] serializes as "[null]"
    ...page.layouts.map((n) => n == void 0 ? n : manifest._.nodes[n]()),
    manifest._.nodes[page.leaf]()
  ]);
}
const MAX_DEPTH = 10;
async function render_page(event, page, options2, manifest, state, resolve_opts) {
  if (state.depth > MAX_DEPTH) {
    return text(`Not found: ${event.url.pathname}`, {
      status: 404
      // TODO in some cases this should be 500. not sure how to differentiate
    });
  }
  if (is_action_json_request(event)) {
    const node = await manifest._.nodes[page.leaf]();
    return handle_action_json_request(event, options2, node?.server);
  }
  try {
    const nodes = await load_page_nodes(page, manifest);
    const leaf_node = (
      /** @type {import('types').SSRNode} */
      nodes.at(-1)
    );
    let status = 200;
    let action_result = void 0;
    if (is_action_request(event)) {
      action_result = await handle_action_request(event, leaf_node.server);
      if (action_result?.type === "redirect") {
        return redirect_response(action_result.status, action_result.location);
      }
      if (action_result?.type === "error") {
        status = get_status(action_result.error);
      }
      if (action_result?.type === "failure") {
        status = action_result.status;
      }
    }
    const should_prerender_data = nodes.some((node) => node?.server?.load);
    const data_pathname = add_data_suffix(event.url.pathname);
    const should_prerender = get_option(nodes, "prerender") ?? false;
    if (should_prerender) {
      const mod = leaf_node.server;
      if (mod?.actions) {
        throw new Error("Cannot prerender pages with actions");
      }
    } else if (state.prerendering) {
      return new Response(void 0, {
        status: 204
      });
    }
    state.prerender_default = should_prerender;
    const fetched = [];
    if (get_option(nodes, "ssr") === false && !(state.prerendering && should_prerender_data)) {
      return await render_response({
        branch: [],
        fetched,
        page_config: {
          ssr: false,
          csr: get_option(nodes, "csr") ?? true
        },
        status,
        error: null,
        event,
        options: options2,
        manifest,
        state,
        resolve_opts
      });
    }
    const branch = [];
    let load_error = null;
    const server_promises = nodes.map((node, i) => {
      if (load_error) {
        throw load_error;
      }
      return Promise.resolve().then(async () => {
        try {
          if (node === leaf_node && action_result?.type === "error") {
            throw action_result.error;
          }
          return await load_server_data({
            event,
            state,
            node,
            parent: async () => {
              const data = {};
              for (let j = 0; j < i; j += 1) {
                const parent = await server_promises[j];
                if (parent)
                  Object.assign(data, await parent.data);
              }
              return data;
            }
          });
        } catch (e) {
          load_error = /** @type {Error} */
          e;
          throw load_error;
        }
      });
    });
    const csr = get_option(nodes, "csr") ?? true;
    const load_promises = nodes.map((node, i) => {
      if (load_error)
        throw load_error;
      return Promise.resolve().then(async () => {
        try {
          return await load_data({
            event,
            fetched,
            node,
            parent: async () => {
              const data = {};
              for (let j = 0; j < i; j += 1) {
                Object.assign(data, await load_promises[j]);
              }
              return data;
            },
            resolve_opts,
            server_data_promise: server_promises[i],
            state,
            csr
          });
        } catch (e) {
          load_error = /** @type {Error} */
          e;
          throw load_error;
        }
      });
    });
    for (const p of server_promises)
      p.catch(() => {
      });
    for (const p of load_promises)
      p.catch(() => {
      });
    for (let i = 0; i < nodes.length; i += 1) {
      const node = nodes[i];
      if (node) {
        try {
          const server_data = await server_promises[i];
          const data = await load_promises[i];
          branch.push({ node, server_data, data });
        } catch (e) {
          const err = normalize_error(e);
          if (err instanceof Redirect) {
            if (state.prerendering && should_prerender_data) {
              const body2 = JSON.stringify({
                type: "redirect",
                location: err.location
              });
              state.prerendering.dependencies.set(data_pathname, {
                response: text(body2),
                body: body2
              });
            }
            return redirect_response(err.status, err.location);
          }
          const status2 = get_status(err);
          const error = await handle_error_and_jsonify(event, options2, err);
          while (i--) {
            if (page.errors[i]) {
              const index = (
                /** @type {number} */
                page.errors[i]
              );
              const node2 = await manifest._.nodes[index]();
              let j = i;
              while (!branch[j])
                j -= 1;
              return await render_response({
                event,
                options: options2,
                manifest,
                state,
                resolve_opts,
                page_config: { ssr: true, csr: true },
                status: status2,
                error,
                branch: compact(branch.slice(0, j + 1)).concat({
                  node: node2,
                  data: null,
                  server_data: null
                }),
                fetched
              });
            }
          }
          return static_error_page(options2, status2, error.message);
        }
      } else {
        branch.push(null);
      }
    }
    if (state.prerendering && should_prerender_data) {
      let { data, chunks } = get_data_json(
        event,
        options2,
        branch.map((node) => node?.server_data)
      );
      if (chunks) {
        for await (const chunk of chunks) {
          data += chunk;
        }
      }
      state.prerendering.dependencies.set(data_pathname, {
        response: text(data),
        body: data
      });
    }
    const ssr = get_option(nodes, "ssr") ?? true;
    return await render_response({
      event,
      options: options2,
      manifest,
      state,
      resolve_opts,
      page_config: {
        csr: get_option(nodes, "csr") ?? true,
        ssr
      },
      status,
      error: null,
      branch: ssr === false ? [] : compact(branch),
      action_result,
      fetched
    });
  } catch (e) {
    return await respond_with_error({
      event,
      options: options2,
      manifest,
      state,
      status: 500,
      error: e,
      resolve_opts
    });
  }
}
function exec(match, params, matchers) {
  const result = {};
  const values = match.slice(1);
  const values_needing_match = values.filter((value) => value !== void 0);
  let buffered = 0;
  for (let i = 0; i < params.length; i += 1) {
    const param = params[i];
    let value = values[i - buffered];
    if (param.chained && param.rest && buffered) {
      value = values.slice(i - buffered, i + 1).filter((s2) => s2).join("/");
      buffered = 0;
    }
    if (value === void 0) {
      if (param.rest)
        result[param.name] = "";
      continue;
    }
    if (!param.matcher || matchers[param.matcher](value)) {
      result[param.name] = value;
      const next_param = params[i + 1];
      const next_value = values[i + 1];
      if (next_param && !next_param.rest && next_param.optional && next_value && param.chained) {
        buffered = 0;
      }
      if (!next_param && !next_value && Object.keys(result).length === values_needing_match.length) {
        buffered = 0;
      }
      continue;
    }
    if (param.optional && param.chained) {
      buffered++;
      continue;
    }
    return;
  }
  if (buffered)
    return;
  return result;
}
function validate_options(options2) {
  if (options2?.path === void 0) {
    throw new Error("You must specify a `path` when setting, deleting or serializing cookies");
  }
}
function get_cookies(request, url, trailing_slash) {
  const header = request.headers.get("cookie") ?? "";
  const initial_cookies = parse(header, { decode: (value) => value });
  const normalized_url = normalize_path(url.pathname, trailing_slash);
  const new_cookies = {};
  const defaults = {
    httpOnly: true,
    sameSite: "lax",
    secure: url.hostname === "localhost" && url.protocol === "http:" ? false : true
  };
  const cookies = {
    // The JSDoc param annotations appearing below for get, set and delete
    // are necessary to expose the `cookie` library types to
    // typescript users. `@type {import('@sveltejs/kit').Cookies}` above is not
    // sufficient to do so.
    /**
     * @param {string} name
     * @param {import('cookie').CookieParseOptions} opts
     */
    get(name, opts) {
      const c = new_cookies[name];
      if (c && domain_matches(url.hostname, c.options.domain) && path_matches(url.pathname, c.options.path)) {
        return c.value;
      }
      const decoder = opts?.decode || decodeURIComponent;
      const req_cookies = parse(header, { decode: decoder });
      const cookie = req_cookies[name];
      return cookie;
    },
    /**
     * @param {import('cookie').CookieParseOptions} opts
     */
    getAll(opts) {
      const decoder = opts?.decode || decodeURIComponent;
      const cookies2 = parse(header, { decode: decoder });
      for (const c of Object.values(new_cookies)) {
        if (domain_matches(url.hostname, c.options.domain) && path_matches(url.pathname, c.options.path)) {
          cookies2[c.name] = c.value;
        }
      }
      return Object.entries(cookies2).map(([name, value]) => ({ name, value }));
    },
    /**
     * @param {string} name
     * @param {string} value
     * @param {import('./page/types.js').Cookie['options']} options
     */
    set(name, value, options2) {
      validate_options(options2);
      set_internal(name, value, { ...defaults, ...options2 });
    },
    /**
     * @param {string} name
     *  @param {import('./page/types.js').Cookie['options']} options
     */
    delete(name, options2) {
      validate_options(options2);
      cookies.set(name, "", { ...options2, maxAge: 0 });
    },
    /**
     * @param {string} name
     * @param {string} value
     *  @param {import('./page/types.js').Cookie['options']} options
     */
    serialize(name, value, options2) {
      validate_options(options2);
      let path = options2.path;
      if (!options2.domain || options2.domain === url.hostname) {
        path = resolve(normalized_url, path);
      }
      return serialize(name, value, { ...defaults, ...options2, path });
    }
  };
  function get_cookie_header(destination, header2) {
    const combined_cookies = {
      // cookies sent by the user agent have lowest precedence
      ...initial_cookies
    };
    for (const key2 in new_cookies) {
      const cookie = new_cookies[key2];
      if (!domain_matches(destination.hostname, cookie.options.domain))
        continue;
      if (!path_matches(destination.pathname, cookie.options.path))
        continue;
      const encoder2 = cookie.options.encode || encodeURIComponent;
      combined_cookies[cookie.name] = encoder2(cookie.value);
    }
    if (header2) {
      const parsed = parse(header2, { decode: (value) => value });
      for (const name in parsed) {
        combined_cookies[name] = parsed[name];
      }
    }
    return Object.entries(combined_cookies).map(([name, value]) => `${name}=${value}`).join("; ");
  }
  function set_internal(name, value, options2) {
    let path = options2.path;
    if (!options2.domain || options2.domain === url.hostname) {
      path = resolve(normalized_url, path);
    }
    new_cookies[name] = { name, value, options: { ...options2, path } };
  }
  return { cookies, new_cookies, get_cookie_header, set_internal };
}
function domain_matches(hostname, constraint) {
  if (!constraint)
    return true;
  const normalized = constraint[0] === "." ? constraint.slice(1) : constraint;
  if (hostname === normalized)
    return true;
  return hostname.endsWith("." + normalized);
}
function path_matches(path, constraint) {
  if (!constraint)
    return true;
  const normalized = constraint.endsWith("/") ? constraint.slice(0, -1) : constraint;
  if (path === normalized)
    return true;
  return path.startsWith(normalized + "/");
}
function add_cookies_to_headers(headers2, cookies) {
  for (const new_cookie of cookies) {
    const { name, value, options: options2 } = new_cookie;
    headers2.append("set-cookie", serialize(name, value, options2));
    if (options2.path.endsWith(".html")) {
      const path = add_data_suffix(options2.path);
      headers2.append("set-cookie", serialize(name, value, { ...options2, path }));
    }
  }
}
function create_fetch({ event, options: options2, manifest, state, get_cookie_header, set_internal }) {
  const server_fetch = async (info, init2) => {
    const original_request = normalize_fetch_input(info, init2, event.url);
    let mode = (info instanceof Request ? info.mode : init2?.mode) ?? "cors";
    let credentials = (info instanceof Request ? info.credentials : init2?.credentials) ?? "same-origin";
    return options2.hooks.handleFetch({
      event,
      request: original_request,
      fetch: async (info2, init3) => {
        const request = normalize_fetch_input(info2, init3, event.url);
        const url = new URL(request.url);
        if (!request.headers.has("origin")) {
          request.headers.set("origin", event.url.origin);
        }
        if (info2 !== original_request) {
          mode = (info2 instanceof Request ? info2.mode : init3?.mode) ?? "cors";
          credentials = (info2 instanceof Request ? info2.credentials : init3?.credentials) ?? "same-origin";
        }
        if ((request.method === "GET" || request.method === "HEAD") && (mode === "no-cors" && url.origin !== event.url.origin || url.origin === event.url.origin)) {
          request.headers.delete("origin");
        }
        if (url.origin !== event.url.origin) {
          if (`.${url.hostname}`.endsWith(`.${event.url.hostname}`) && credentials !== "omit") {
            const cookie = get_cookie_header(url, request.headers.get("cookie"));
            if (cookie)
              request.headers.set("cookie", cookie);
          }
          return fetch(request);
        }
        const prefix = assets || base;
        const decoded = decodeURIComponent(url.pathname);
        const filename = (decoded.startsWith(prefix) ? decoded.slice(prefix.length) : decoded).slice(1);
        const filename_html = `${filename}/index.html`;
        const is_asset = manifest.assets.has(filename);
        const is_asset_html = manifest.assets.has(filename_html);
        if (is_asset || is_asset_html) {
          const file = is_asset ? filename : filename_html;
          if (state.read) {
            const type = is_asset ? manifest.mimeTypes[filename.slice(filename.lastIndexOf("."))] : "text/html";
            return new Response(state.read(file), {
              headers: type ? { "content-type": type } : {}
            });
          }
          return await fetch(request);
        }
        if (credentials !== "omit") {
          const cookie = get_cookie_header(url, request.headers.get("cookie"));
          if (cookie) {
            request.headers.set("cookie", cookie);
          }
          const authorization = event.request.headers.get("authorization");
          if (authorization && !request.headers.has("authorization")) {
            request.headers.set("authorization", authorization);
          }
        }
        if (!request.headers.has("accept")) {
          request.headers.set("accept", "*/*");
        }
        if (!request.headers.has("accept-language")) {
          request.headers.set(
            "accept-language",
            /** @type {string} */
            event.request.headers.get("accept-language")
          );
        }
        const response = await respond(request, options2, manifest, {
          ...state,
          depth: state.depth + 1
        });
        const set_cookie = response.headers.get("set-cookie");
        if (set_cookie) {
          for (const str of set_cookie_parser.splitCookiesString(set_cookie)) {
            const { name, value, ...options3 } = set_cookie_parser.parseString(str);
            const path = options3.path ?? (url.pathname.split("/").slice(0, -1).join("/") || "/");
            set_internal(name, value, {
              path,
              .../** @type {import('cookie').CookieSerializeOptions} */
              options3
            });
          }
        }
        return response;
      }
    });
  };
  return (input, init2) => {
    const response = server_fetch(input, init2);
    response.catch(() => {
    });
    return response;
  };
}
function normalize_fetch_input(info, init2, url) {
  if (info instanceof Request) {
    return info;
  }
  return new Request(typeof info === "string" ? new URL(info, url) : info, init2);
}
let body;
let etag;
let headers;
function get_public_env(request) {
  body ??= `export const env=${JSON.stringify(public_env)}`;
  etag ??= `W/${Date.now()}`;
  headers ??= new Headers({
    "content-type": "application/javascript; charset=utf-8",
    etag
  });
  if (request.headers.get("if-none-match") === etag) {
    return new Response(void 0, { status: 304, headers });
  }
  return new Response(body, { headers });
}
function get_page_config(nodes) {
  let current = {};
  for (const node of nodes) {
    if (!node?.universal?.config && !node?.server?.config)
      continue;
    current = {
      ...current,
      ...node?.universal?.config,
      ...node?.server?.config
    };
  }
  return Object.keys(current).length ? current : void 0;
}
const default_transform = ({ html }) => html;
const default_filter = () => false;
const default_preload = ({ type }) => type === "js" || type === "css";
const page_methods = /* @__PURE__ */ new Set(["GET", "HEAD", "POST"]);
const allowed_page_methods = /* @__PURE__ */ new Set(["GET", "HEAD", "OPTIONS"]);
async function respond(request, options2, manifest, state) {
  const url = new URL(request.url);
  if (options2.csrf_check_origin) {
    const forbidden = is_form_content_type(request) && (request.method === "POST" || request.method === "PUT" || request.method === "PATCH" || request.method === "DELETE") && request.headers.get("origin") !== url.origin;
    if (forbidden) {
      const csrf_error = new HttpError(
        403,
        `Cross-site ${request.method} form submissions are forbidden`
      );
      if (request.headers.get("accept") === "application/json") {
        return json(csrf_error.body, { status: csrf_error.status });
      }
      return text(csrf_error.body.message, { status: csrf_error.status });
    }
  }
  let rerouted_path;
  try {
    rerouted_path = options2.hooks.reroute({ url: new URL(url) }) ?? url.pathname;
  } catch (e) {
    return text("Internal Server Error", {
      status: 500
    });
  }
  let decoded;
  try {
    decoded = decode_pathname(rerouted_path);
  } catch {
    return text("Malformed URI", { status: 400 });
  }
  let route = null;
  let params = {};
  if (base && !state.prerendering?.fallback) {
    if (!decoded.startsWith(base)) {
      return text("Not found", { status: 404 });
    }
    decoded = decoded.slice(base.length) || "/";
  }
  if (decoded === `/${options2.app_dir}/env.js`) {
    return get_public_env(request);
  }
  if (decoded.startsWith(`/${options2.app_dir}`)) {
    return text("Not found", { status: 404 });
  }
  const is_data_request = has_data_suffix(decoded);
  let invalidated_data_nodes;
  if (is_data_request) {
    decoded = strip_data_suffix(decoded) || "/";
    url.pathname = strip_data_suffix(url.pathname) + (url.searchParams.get(TRAILING_SLASH_PARAM) === "1" ? "/" : "") || "/";
    url.searchParams.delete(TRAILING_SLASH_PARAM);
    invalidated_data_nodes = url.searchParams.get(INVALIDATED_PARAM)?.split("").map((node) => node === "1");
    url.searchParams.delete(INVALIDATED_PARAM);
  }
  if (!state.prerendering?.fallback) {
    const matchers = await manifest._.matchers();
    for (const candidate of manifest._.routes) {
      const match = candidate.pattern.exec(decoded);
      if (!match)
        continue;
      const matched = exec(match, candidate.params, matchers);
      if (matched) {
        route = candidate;
        params = decode_params(matched);
        break;
      }
    }
  }
  let trailing_slash = void 0;
  const headers2 = {};
  let cookies_to_add = {};
  const event = {
    // @ts-expect-error `cookies` and `fetch` need to be created after the `event` itself
    cookies: null,
    // @ts-expect-error
    fetch: null,
    getClientAddress: state.getClientAddress || (() => {
      throw new Error(
        `${"@sveltejs/adapter-static"} does not specify getClientAddress. Please raise an issue`
      );
    }),
    locals: {},
    params,
    platform: state.platform,
    request,
    route: { id: route?.id ?? null },
    setHeaders: (new_headers) => {
      for (const key2 in new_headers) {
        const lower = key2.toLowerCase();
        const value = new_headers[key2];
        if (lower === "set-cookie") {
          throw new Error(
            "Use `event.cookies.set(name, value, options)` instead of `event.setHeaders` to set cookies"
          );
        } else if (lower in headers2) {
          throw new Error(`"${key2}" header is already set`);
        } else {
          headers2[lower] = value;
          if (state.prerendering && lower === "cache-control") {
            state.prerendering.cache = /** @type {string} */
            value;
          }
        }
      }
    },
    url,
    isDataRequest: is_data_request,
    isSubRequest: state.depth > 0
  };
  let resolve_opts = {
    transformPageChunk: default_transform,
    filterSerializedResponseHeaders: default_filter,
    preload: default_preload
  };
  try {
    if (route) {
      if (url.pathname === base || url.pathname === base + "/") {
        trailing_slash = "always";
      } else if (route.page) {
        const nodes = await load_page_nodes(route.page, manifest);
        if (DEV)
          ;
        trailing_slash = get_option(nodes, "trailingSlash");
      } else if (route.endpoint) {
        const node = await route.endpoint();
        trailing_slash = node.trailingSlash;
        if (DEV)
          ;
      }
      if (!is_data_request) {
        const normalized = normalize_path(url.pathname, trailing_slash ?? "never");
        if (normalized !== url.pathname && !state.prerendering?.fallback) {
          return new Response(void 0, {
            status: 308,
            headers: {
              "x-sveltekit-normalize": "1",
              location: (
                // ensure paths starting with '//' are not treated as protocol-relative
                (normalized.startsWith("//") ? url.origin + normalized : normalized) + (url.search === "?" ? "" : url.search)
              )
            }
          });
        }
      }
      if (state.before_handle || state.emulator?.platform) {
        let config = {};
        let prerender = false;
        if (route.endpoint) {
          const node = await route.endpoint();
          config = node.config ?? config;
          prerender = node.prerender ?? prerender;
        } else if (route.page) {
          const nodes = await load_page_nodes(route.page, manifest);
          config = get_page_config(nodes) ?? config;
          prerender = get_option(nodes, "prerender") ?? false;
        }
        if (state.before_handle) {
          state.before_handle(event, config, prerender);
        }
        if (state.emulator?.platform) {
          event.platform = await state.emulator.platform({ config, prerender });
        }
      }
    }
    const { cookies, new_cookies, get_cookie_header, set_internal } = get_cookies(
      request,
      url,
      trailing_slash ?? "never"
    );
    cookies_to_add = new_cookies;
    event.cookies = cookies;
    event.fetch = create_fetch({
      event,
      options: options2,
      manifest,
      state,
      get_cookie_header,
      set_internal
    });
    if (state.prerendering && !state.prerendering.fallback)
      disable_search(url);
    const response = await options2.hooks.handle({
      event,
      resolve: (event2, opts) => resolve2(event2, opts).then((response2) => {
        for (const key2 in headers2) {
          const value = headers2[key2];
          response2.headers.set(
            key2,
            /** @type {string} */
            value
          );
        }
        add_cookies_to_headers(response2.headers, Object.values(cookies_to_add));
        if (state.prerendering && event2.route.id !== null) {
          response2.headers.set("x-sveltekit-routeid", encodeURI(event2.route.id));
        }
        return response2;
      })
    });
    if (response.status === 200 && response.headers.has("etag")) {
      let if_none_match_value = request.headers.get("if-none-match");
      if (if_none_match_value?.startsWith('W/"')) {
        if_none_match_value = if_none_match_value.substring(2);
      }
      const etag2 = (
        /** @type {string} */
        response.headers.get("etag")
      );
      if (if_none_match_value === etag2) {
        const headers22 = new Headers({ etag: etag2 });
        for (const key2 of [
          "cache-control",
          "content-location",
          "date",
          "expires",
          "vary",
          "set-cookie"
        ]) {
          const value = response.headers.get(key2);
          if (value)
            headers22.set(key2, value);
        }
        return new Response(void 0, {
          status: 304,
          headers: headers22
        });
      }
    }
    if (is_data_request && response.status >= 300 && response.status <= 308) {
      const location = response.headers.get("location");
      if (location) {
        return redirect_json_response(new Redirect(
          /** @type {any} */
          response.status,
          location
        ));
      }
    }
    return response;
  } catch (e) {
    if (e instanceof Redirect) {
      const response = is_data_request ? redirect_json_response(e) : route?.page && is_action_json_request(event) ? action_json_redirect(e) : redirect_response(e.status, e.location);
      add_cookies_to_headers(response.headers, Object.values(cookies_to_add));
      return response;
    }
    return await handle_fatal_error(event, options2, e);
  }
  async function resolve2(event2, opts) {
    try {
      if (opts) {
        resolve_opts = {
          transformPageChunk: opts.transformPageChunk || default_transform,
          filterSerializedResponseHeaders: opts.filterSerializedResponseHeaders || default_filter,
          preload: opts.preload || default_preload
        };
      }
      if (state.prerendering?.fallback) {
        return await render_response({
          event: event2,
          options: options2,
          manifest,
          state,
          page_config: { ssr: false, csr: true },
          status: 200,
          error: null,
          branch: [],
          fetched: [],
          resolve_opts
        });
      }
      if (route) {
        const method = (
          /** @type {import('types').HttpMethod} */
          event2.request.method
        );
        let response;
        if (is_data_request) {
          response = await render_data(
            event2,
            route,
            options2,
            manifest,
            state,
            invalidated_data_nodes,
            trailing_slash ?? "never"
          );
        } else if (route.endpoint && (!route.page || is_endpoint_request(event2))) {
          response = await render_endpoint(event2, await route.endpoint(), state);
        } else if (route.page) {
          if (page_methods.has(method)) {
            response = await render_page(event2, route.page, options2, manifest, state, resolve_opts);
          } else {
            const allowed_methods2 = new Set(allowed_page_methods);
            const node = await manifest._.nodes[route.page.leaf]();
            if (node?.server?.actions) {
              allowed_methods2.add("POST");
            }
            if (method === "OPTIONS") {
              response = new Response(null, {
                status: 204,
                headers: {
                  allow: Array.from(allowed_methods2.values()).join(", ")
                }
              });
            } else {
              const mod = [...allowed_methods2].reduce(
                (acc, curr) => {
                  acc[curr] = true;
                  return acc;
                },
                /** @type {Record<string, any>} */
                {}
              );
              response = method_not_allowed(mod, method);
            }
          }
        } else {
          throw new Error("This should never happen");
        }
        if (request.method === "GET" && route.page && route.endpoint) {
          const vary = response.headers.get("vary")?.split(",")?.map((v) => v.trim().toLowerCase());
          if (!(vary?.includes("accept") || vary?.includes("*"))) {
            response = new Response(response.body, {
              status: response.status,
              statusText: response.statusText,
              headers: new Headers(response.headers)
            });
            response.headers.append("Vary", "Accept");
          }
        }
        return response;
      }
      if (state.error && event2.isSubRequest) {
        return await fetch(request, {
          headers: {
            "x-sveltekit-error": "true"
          }
        });
      }
      if (state.error) {
        return text("Internal Server Error", {
          status: 500
        });
      }
      if (state.depth === 0) {
        return await respond_with_error({
          event: event2,
          options: options2,
          manifest,
          state,
          status: 404,
          error: new SvelteKitError(404, "Not Found", `Not found: ${event2.url.pathname}`),
          resolve_opts
        });
      }
      if (state.prerendering) {
        return text("not found", { status: 404 });
      }
      return await fetch(request);
    } catch (e) {
      return await handle_fatal_error(event2, options2, e);
    } finally {
      event2.cookies.set = () => {
        throw new Error("Cannot use `cookies.set(...)` after the response has been generated");
      };
      event2.setHeaders = () => {
        throw new Error("Cannot use `setHeaders(...)` after the response has been generated");
      };
    }
  }
}
function filter_private_env(env, { public_prefix, private_prefix }) {
  return Object.fromEntries(
    Object.entries(env).filter(
      ([k]) => k.startsWith(private_prefix) && (public_prefix === "" || !k.startsWith(public_prefix))
    )
  );
}
function filter_public_env(env, { public_prefix, private_prefix }) {
  return Object.fromEntries(
    Object.entries(env).filter(
      ([k]) => k.startsWith(public_prefix) && (private_prefix === "" || !k.startsWith(private_prefix))
    )
  );
}
const prerender_env_handler = {
  get({ type }, prop) {
    throw new Error(
      `Cannot read values from $env/dynamic/${type} while prerendering (attempted to read env.${prop.toString()}). Use $env/static/${type} instead`
    );
  }
};
class Server {
  /** @type {import('types').SSROptions} */
  #options;
  /** @type {import('@sveltejs/kit').SSRManifest} */
  #manifest;
  /** @param {import('@sveltejs/kit').SSRManifest} manifest */
  constructor(manifest) {
    this.#options = options;
    this.#manifest = manifest;
  }
  /**
   * @param {{
   *   env: Record<string, string>;
   *   read?: (file: string) => ReadableStream;
   * }} opts
   */
  async init({ env, read }) {
    const prefixes = {
      public_prefix: this.#options.env_public_prefix,
      private_prefix: this.#options.env_private_prefix
    };
    const private_env = filter_private_env(env, prefixes);
    const public_env2 = filter_public_env(env, prefixes);
    set_private_env(
      prerendering ? new Proxy({ type: "private" }, prerender_env_handler) : private_env
    );
    set_public_env(
      prerendering ? new Proxy({ type: "public" }, prerender_env_handler) : public_env2
    );
    set_safe_public_env(public_env2);
    if (!this.#options.hooks) {
      try {
        const module = await get_hooks();
        this.#options.hooks = {
          handle: module.handle || (({ event, resolve: resolve2 }) => resolve2(event)),
          handleError: module.handleError || (({ error }) => console.error(error)),
          handleFetch: module.handleFetch || (({ request, fetch: fetch2 }) => fetch2(request)),
          reroute: module.reroute || (() => {
          })
        };
      } catch (error) {
        {
          throw error;
        }
      }
    }
  }
  /**
   * @param {Request} request
   * @param {import('types').RequestOptions} options
   */
  async respond(request, options2) {
    return respond(request, this.#options, this.#manifest, {
      ...options2,
      error: false,
      depth: 0
    });
  }
}
export {
  Server
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9lc20tZW52L3Byb2Qtc3NyLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0BzdmVsdGVqcy9raXQvc3JjL2NvbnN0YW50cy5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9Ac3ZlbHRlanMva2l0L3NyYy91dGlscy9odHRwLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0BzdmVsdGVqcy9raXQvc3JjL3J1bnRpbWUvY29udHJvbC5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9Ac3ZlbHRlanMva2l0L3NyYy9leHBvcnRzL2luZGV4LmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0BzdmVsdGVqcy9raXQvc3JjL3V0aWxzL2Vycm9yLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0BzdmVsdGVqcy9raXQvc3JjL3J1bnRpbWUvc2VydmVyL3V0aWxzLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0BzdmVsdGVqcy9raXQvc3JjL3J1bnRpbWUvc2VydmVyL2VuZHBvaW50LmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0BzdmVsdGVqcy9raXQvc3JjL3V0aWxzL2FycmF5LmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0BzdmVsdGVqcy9raXQvc3JjL3J1bnRpbWUvc2VydmVyL3BhZ2UvYWN0aW9ucy5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9Ac3ZlbHRlanMva2l0L3NyYy9ydW50aW1lL3NoYXJlZC5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9Ac3ZlbHRlanMva2l0L3NyYy9ydW50aW1lL3V0aWxzLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0BzdmVsdGVqcy9raXQvc3JjL3J1bnRpbWUvc2VydmVyL3BhZ2UvbG9hZF9kYXRhLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3N2ZWx0ZS9zcmMvcnVudGltZS9zdG9yZS9pbmRleC5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9Ac3ZlbHRlanMva2l0L3NyYy9ydW50aW1lL2hhc2guanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvQHN2ZWx0ZWpzL2tpdC9zcmMvdXRpbHMvZXNjYXBlLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0BzdmVsdGVqcy9raXQvc3JjL3J1bnRpbWUvc2VydmVyL3BhZ2Uvc2VyaWFsaXplX2RhdGEuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvQHN2ZWx0ZWpzL2tpdC9zcmMvdXRpbHMvbWlzYy5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9Ac3ZlbHRlanMva2l0L3NyYy9ydW50aW1lL3NlcnZlci9wYWdlL2NyeXB0by5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9Ac3ZlbHRlanMva2l0L3NyYy9ydW50aW1lL3NlcnZlci9wYWdlL2NzcC5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9Ac3ZlbHRlanMva2l0L3NyYy91dGlscy9zdHJlYW1pbmcuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvQHN2ZWx0ZWpzL2tpdC9zcmMvcnVudGltZS9zZXJ2ZXIvcGFnZS9yZW5kZXIuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvQHN2ZWx0ZWpzL2tpdC9zcmMvdXRpbHMvb3B0aW9ucy5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9Ac3ZlbHRlanMva2l0L3NyYy9ydW50aW1lL3NlcnZlci9wYWdlL3Jlc3BvbmRfd2l0aF9lcnJvci5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9Ac3ZlbHRlanMva2l0L3NyYy91dGlscy9mdW5jdGlvbnMuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvQHN2ZWx0ZWpzL2tpdC9zcmMvcnVudGltZS9zZXJ2ZXIvZGF0YS9pbmRleC5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9Ac3ZlbHRlanMva2l0L3NyYy9ydW50aW1lL3NlcnZlci9wYWdlL2xvYWRfcGFnZV9ub2Rlcy5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9Ac3ZlbHRlanMva2l0L3NyYy9ydW50aW1lL3NlcnZlci9wYWdlL2luZGV4LmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0BzdmVsdGVqcy9raXQvc3JjL3V0aWxzL3JvdXRpbmcuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvQHN2ZWx0ZWpzL2tpdC9zcmMvcnVudGltZS9zZXJ2ZXIvY29va2llLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0BzdmVsdGVqcy9raXQvc3JjL3J1bnRpbWUvc2VydmVyL2ZldGNoLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0BzdmVsdGVqcy9raXQvc3JjL3J1bnRpbWUvc2VydmVyL2Vudl9tb2R1bGUuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvQHN2ZWx0ZWpzL2tpdC9zcmMvdXRpbHMvcm91dGVfY29uZmlnLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0BzdmVsdGVqcy9raXQvc3JjL3J1bnRpbWUvc2VydmVyL3Jlc3BvbmQuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvQHN2ZWx0ZWpzL2tpdC9zcmMvdXRpbHMvZW52LmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0BzdmVsdGVqcy9raXQvc3JjL3J1bnRpbWUvc2VydmVyL2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBjb25zdCBCUk9XU0VSID0gZmFsc2U7XG5leHBvcnQgY29uc3QgREVWID0gZmFsc2U7XG4iLCIvKipcbiAqIEEgZmFrZSBhc3NldCBwYXRoIHVzZWQgaW4gYHZpdGUgZGV2YCBhbmQgYHZpdGUgcHJldmlld2AsIHNvIHRoYXQgd2UgY2FuXG4gKiBzZXJ2ZSBsb2NhbCBhc3NldHMgd2hpbGUgdmVyaWZ5aW5nIHRoYXQgcmVxdWVzdHMgYXJlIGNvcnJlY3RseSBwcmVmaXhlZFxuICovXG5leHBvcnQgY29uc3QgU1ZFTFRFX0tJVF9BU1NFVFMgPSAnL19zdmVsdGVfa2l0X2Fzc2V0cyc7XG5cbmV4cG9ydCBjb25zdCBHRU5FUkFURURfQ09NTUVOVCA9ICcvLyB0aGlzIGZpbGUgaXMgZ2VuZXJhdGVkIOKAlCBkbyBub3QgZWRpdCBpdFxcbic7XG5cbmV4cG9ydCBjb25zdCBFTkRQT0lOVF9NRVRIT0RTID0gWydHRVQnLCAnUE9TVCcsICdQVVQnLCAnUEFUQ0gnLCAnREVMRVRFJywgJ09QVElPTlMnLCAnSEVBRCddO1xuXG5leHBvcnQgY29uc3QgUEFHRV9NRVRIT0RTID0gWydHRVQnLCAnUE9TVCcsICdIRUFEJ107XG4iLCIvKipcbiAqIEdpdmVuIGFuIEFjY2VwdCBoZWFkZXIgYW5kIGEgbGlzdCBvZiBwb3NzaWJsZSBjb250ZW50IHR5cGVzLCBwaWNrXG4gKiB0aGUgbW9zdCBzdWl0YWJsZSBvbmUgdG8gcmVzcG9uZCB3aXRoXG4gKiBAcGFyYW0ge3N0cmluZ30gYWNjZXB0XG4gKiBAcGFyYW0ge3N0cmluZ1tdfSB0eXBlc1xuICovXG5leHBvcnQgZnVuY3Rpb24gbmVnb3RpYXRlKGFjY2VwdCwgdHlwZXMpIHtcblx0LyoqIEB0eXBlIHtBcnJheTx7IHR5cGU6IHN0cmluZywgc3VidHlwZTogc3RyaW5nLCBxOiBudW1iZXIsIGk6IG51bWJlciB9Pn0gKi9cblx0Y29uc3QgcGFydHMgPSBbXTtcblxuXHRhY2NlcHQuc3BsaXQoJywnKS5mb3JFYWNoKChzdHIsIGkpID0+IHtcblx0XHRjb25zdCBtYXRjaCA9IC8oW14vXSspXFwvKFteO10rKSg/OjtxPShbMC05Ll0rKSk/Ly5leGVjKHN0cik7XG5cblx0XHQvLyBubyBtYXRjaCBlcXVhbHMgaW52YWxpZCBoZWFkZXIg4oCUIGlnbm9yZVxuXHRcdGlmIChtYXRjaCkge1xuXHRcdFx0Y29uc3QgWywgdHlwZSwgc3VidHlwZSwgcSA9ICcxJ10gPSBtYXRjaDtcblx0XHRcdHBhcnRzLnB1c2goeyB0eXBlLCBzdWJ0eXBlLCBxOiArcSwgaSB9KTtcblx0XHR9XG5cdH0pO1xuXG5cdHBhcnRzLnNvcnQoKGEsIGIpID0+IHtcblx0XHRpZiAoYS5xICE9PSBiLnEpIHtcblx0XHRcdHJldHVybiBiLnEgLSBhLnE7XG5cdFx0fVxuXG5cdFx0aWYgKChhLnN1YnR5cGUgPT09ICcqJykgIT09IChiLnN1YnR5cGUgPT09ICcqJykpIHtcblx0XHRcdHJldHVybiBhLnN1YnR5cGUgPT09ICcqJyA/IDEgOiAtMTtcblx0XHR9XG5cblx0XHRpZiAoKGEudHlwZSA9PT0gJyonKSAhPT0gKGIudHlwZSA9PT0gJyonKSkge1xuXHRcdFx0cmV0dXJuIGEudHlwZSA9PT0gJyonID8gMSA6IC0xO1xuXHRcdH1cblxuXHRcdHJldHVybiBhLmkgLSBiLmk7XG5cdH0pO1xuXG5cdGxldCBhY2NlcHRlZDtcblx0bGV0IG1pbl9wcmlvcml0eSA9IEluZmluaXR5O1xuXG5cdGZvciAoY29uc3QgbWltZXR5cGUgb2YgdHlwZXMpIHtcblx0XHRjb25zdCBbdHlwZSwgc3VidHlwZV0gPSBtaW1ldHlwZS5zcGxpdCgnLycpO1xuXHRcdGNvbnN0IHByaW9yaXR5ID0gcGFydHMuZmluZEluZGV4KFxuXHRcdFx0KHBhcnQpID0+XG5cdFx0XHRcdChwYXJ0LnR5cGUgPT09IHR5cGUgfHwgcGFydC50eXBlID09PSAnKicpICYmXG5cdFx0XHRcdChwYXJ0LnN1YnR5cGUgPT09IHN1YnR5cGUgfHwgcGFydC5zdWJ0eXBlID09PSAnKicpXG5cdFx0KTtcblxuXHRcdGlmIChwcmlvcml0eSAhPT0gLTEgJiYgcHJpb3JpdHkgPCBtaW5fcHJpb3JpdHkpIHtcblx0XHRcdGFjY2VwdGVkID0gbWltZXR5cGU7XG5cdFx0XHRtaW5fcHJpb3JpdHkgPSBwcmlvcml0eTtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gYWNjZXB0ZWQ7XG59XG5cbi8qKlxuICogUmV0dXJucyBgdHJ1ZWAgaWYgdGhlIHJlcXVlc3QgY29udGFpbnMgYSBgY29udGVudC10eXBlYCBoZWFkZXIgd2l0aCB0aGUgZ2l2ZW4gdHlwZVxuICogQHBhcmFtIHtSZXF1ZXN0fSByZXF1ZXN0XG4gKiBAcGFyYW0gIHsuLi5zdHJpbmd9IHR5cGVzXG4gKi9cbmZ1bmN0aW9uIGlzX2NvbnRlbnRfdHlwZShyZXF1ZXN0LCAuLi50eXBlcykge1xuXHRjb25zdCB0eXBlID0gcmVxdWVzdC5oZWFkZXJzLmdldCgnY29udGVudC10eXBlJyk/LnNwbGl0KCc7JywgMSlbMF0udHJpbSgpID8/ICcnO1xuXHRyZXR1cm4gdHlwZXMuaW5jbHVkZXModHlwZS50b0xvd2VyQ2FzZSgpKTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1JlcXVlc3R9IHJlcXVlc3RcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzX2Zvcm1fY29udGVudF90eXBlKHJlcXVlc3QpIHtcblx0Ly8gVGhlc2UgY29udGVudCB0eXBlcyBtdXN0IGJlIHByb3RlY3RlZCBhZ2FpbnN0IENTUkZcblx0Ly8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0hUTUxGb3JtRWxlbWVudC9lbmN0eXBlXG5cdHJldHVybiBpc19jb250ZW50X3R5cGUoXG5cdFx0cmVxdWVzdCxcblx0XHQnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyxcblx0XHQnbXVsdGlwYXJ0L2Zvcm0tZGF0YScsXG5cdFx0J3RleHQvcGxhaW4nXG5cdCk7XG59XG4iLCJleHBvcnQgY2xhc3MgSHR0cEVycm9yIHtcblx0LyoqXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSBzdGF0dXNcblx0ICogQHBhcmFtIHt7bWVzc2FnZTogc3RyaW5nfSBleHRlbmRzIEFwcC5FcnJvciA/IChBcHAuRXJyb3IgfCBzdHJpbmcgfCB1bmRlZmluZWQpIDogQXBwLkVycm9yfSBib2R5XG5cdCAqL1xuXHRjb25zdHJ1Y3RvcihzdGF0dXMsIGJvZHkpIHtcblx0XHR0aGlzLnN0YXR1cyA9IHN0YXR1cztcblx0XHRpZiAodHlwZW9mIGJvZHkgPT09ICdzdHJpbmcnKSB7XG5cdFx0XHR0aGlzLmJvZHkgPSB7IG1lc3NhZ2U6IGJvZHkgfTtcblx0XHR9IGVsc2UgaWYgKGJvZHkpIHtcblx0XHRcdHRoaXMuYm9keSA9IGJvZHk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuYm9keSA9IHsgbWVzc2FnZTogYEVycm9yOiAke3N0YXR1c31gIH07XG5cdFx0fVxuXHR9XG5cblx0dG9TdHJpbmcoKSB7XG5cdFx0cmV0dXJuIEpTT04uc3RyaW5naWZ5KHRoaXMuYm9keSk7XG5cdH1cbn1cblxuZXhwb3J0IGNsYXNzIFJlZGlyZWN0IHtcblx0LyoqXG5cdCAqIEBwYXJhbSB7MzAwIHwgMzAxIHwgMzAyIHwgMzAzIHwgMzA0IHwgMzA1IHwgMzA2IHwgMzA3IHwgMzA4fSBzdGF0dXNcblx0ICogQHBhcmFtIHtzdHJpbmd9IGxvY2F0aW9uXG5cdCAqL1xuXHRjb25zdHJ1Y3RvcihzdGF0dXMsIGxvY2F0aW9uKSB7XG5cdFx0dGhpcy5zdGF0dXMgPSBzdGF0dXM7XG5cdFx0dGhpcy5sb2NhdGlvbiA9IGxvY2F0aW9uO1xuXHR9XG59XG5cbi8qKlxuICogQW4gZXJyb3IgdGhhdCB3YXMgdGhyb3duIGZyb20gd2l0aGluIHRoZSBTdmVsdGVLaXQgcnVudGltZSB0aGF0IGlzIG5vdCBmYXRhbCBhbmQgZG9lc24ndCByZXN1bHQgaW4gYSA1MDAsIHN1Y2ggYXMgYSA0MDQuXG4gKiBgU3ZlbHRlS2l0RXJyb3JgIGdvZXMgdGhyb3VnaCBgaGFuZGxlRXJyb3JgLlxuICogQGV4dGVuZHMgRXJyb3JcbiAqL1xuZXhwb3J0IGNsYXNzIFN2ZWx0ZUtpdEVycm9yIGV4dGVuZHMgRXJyb3Ige1xuXHQvKipcblx0ICogQHBhcmFtIHtudW1iZXJ9IHN0YXR1c1xuXHQgKiBAcGFyYW0ge3N0cmluZ30gdGV4dFxuXHQgKiBAcGFyYW0ge3N0cmluZ30gbWVzc2FnZVxuXHQgKi9cblx0Y29uc3RydWN0b3Ioc3RhdHVzLCB0ZXh0LCBtZXNzYWdlKSB7XG5cdFx0c3VwZXIobWVzc2FnZSk7XG5cdFx0dGhpcy5zdGF0dXMgPSBzdGF0dXM7XG5cdFx0dGhpcy50ZXh0ID0gdGV4dDtcblx0fVxufVxuXG4vKipcbiAqIEB0ZW1wbGF0ZSB7UmVjb3JkPHN0cmluZywgdW5rbm93bj4gfCB1bmRlZmluZWR9IFtUPXVuZGVmaW5lZF1cbiAqL1xuZXhwb3J0IGNsYXNzIEFjdGlvbkZhaWx1cmUge1xuXHQvKipcblx0ICogQHBhcmFtIHtudW1iZXJ9IHN0YXR1c1xuXHQgKiBAcGFyYW0ge1R9IGRhdGFcblx0ICovXG5cdGNvbnN0cnVjdG9yKHN0YXR1cywgZGF0YSkge1xuXHRcdHRoaXMuc3RhdHVzID0gc3RhdHVzO1xuXHRcdHRoaXMuZGF0YSA9IGRhdGE7XG5cdH1cbn1cblxuLyoqXG4gKiBUaGlzIGlzIGEgZ3JvdGVzcXVlIGhhY2sgdGhhdCwgaW4gZGV2LCBhbGxvd3MgdXMgdG8gcmVwbGFjZSB0aGUgaW1wbGVtZW50YXRpb25zXG4gKiBvZiB0aGVzZSBjbGFzc2VzIHRoYXQgeW91J2QgZ2V0IGJ5IGltcG9ydGluZyB0aGVtIGZyb20gYEBzdmVsdGVqcy9raXRgIHdpdGggdGhlXG4gKiBvbmVzIHRoYXQgYXJlIGltcG9ydGVkIHZpYSBWaXRlIGFuZCBsb2FkZWQgaW50ZXJuYWxseSwgc28gdGhhdCBpbnN0YW5jZW9mXG4gKiBjaGVja3Mgd29yayBldmVuIHRob3VnaCBTdmVsdGVLaXQgaW1wb3J0cyB0aGlzIG1vZHVsZSB2aWEgVml0ZSBhbmQgY29uc3VtZXJzXG4gKiBpbXBvcnQgaXQgdmlhIE5vZGVcbiAqIEBwYXJhbSB7e1xuICogICBBY3Rpb25GYWlsdXJlOiB0eXBlb2YgQWN0aW9uRmFpbHVyZTtcbiAqICAgSHR0cEVycm9yOiB0eXBlb2YgSHR0cEVycm9yO1xuICogICBSZWRpcmVjdDogdHlwZW9mIFJlZGlyZWN0O1xuICogICBTdmVsdGVLaXRFcnJvcjogdHlwZW9mIFN2ZWx0ZUtpdEVycm9yO1xuICogfX0gaW1wbGVtZW50YXRpb25zXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZXBsYWNlX2ltcGxlbWVudGF0aW9ucyhpbXBsZW1lbnRhdGlvbnMpIHtcblx0Ly8gQHRzLWV4cGVjdC1lcnJvclxuXHRBY3Rpb25GYWlsdXJlID0gaW1wbGVtZW50YXRpb25zLkFjdGlvbkZhaWx1cmU7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tY2xhc3MtYXNzaWduXG5cdC8vIEB0cy1leHBlY3QtZXJyb3Jcblx0SHR0cEVycm9yID0gaW1wbGVtZW50YXRpb25zLkh0dHBFcnJvcjsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jbGFzcy1hc3NpZ25cblx0Ly8gQHRzLWV4cGVjdC1lcnJvclxuXHRSZWRpcmVjdCA9IGltcGxlbWVudGF0aW9ucy5SZWRpcmVjdDsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jbGFzcy1hc3NpZ25cblx0Ly8gQHRzLWV4cGVjdC1lcnJvclxuXHRTdmVsdGVLaXRFcnJvciA9IGltcGxlbWVudGF0aW9ucy5TdmVsdGVLaXRFcnJvcjsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jbGFzcy1hc3NpZ25cbn1cbiIsImltcG9ydCB7IEh0dHBFcnJvciwgUmVkaXJlY3QsIEFjdGlvbkZhaWx1cmUgfSBmcm9tICcuLi9ydW50aW1lL2NvbnRyb2wuanMnO1xuaW1wb3J0IHsgQlJPV1NFUiwgREVWIH0gZnJvbSAnZXNtLWVudic7XG5cbmV4cG9ydCB7IFZFUlNJT04gfSBmcm9tICcuLi92ZXJzaW9uLmpzJztcblxuLy8gVE9ETyAzLjA6IHJlbW92ZSB0aGVzZSB0eXBlcyBhcyB0aGV5IGFyZSBub3QgdXNlZCBhbnltb3JlICh3ZSBjYW4ndCByZW1vdmUgdGhlbSB5ZXQgYmVjYXVzZSB0aGF0IHdvdWxkIGJlIGEgYnJlYWtpbmcgY2hhbmdlKVxuLyoqXG4gKiBAdGVtcGxhdGUge251bWJlcn0gVE51bWJlclxuICogQHRlbXBsYXRlIHthbnlbXX0gW1RBcnJheT1bXV1cbiAqIEB0eXBlZGVmIHtUTnVtYmVyIGV4dGVuZHMgVEFycmF5WydsZW5ndGgnXSA/IFRBcnJheVtudW1iZXJdIDogTGVzc1RoYW48VE51bWJlciwgWy4uLlRBcnJheSwgVEFycmF5WydsZW5ndGgnXV0+fSBMZXNzVGhhblxuICovXG5cbi8qKlxuICogQHRlbXBsYXRlIHtudW1iZXJ9IFRTdGFydFxuICogQHRlbXBsYXRlIHtudW1iZXJ9IFRFbmRcbiAqIEB0eXBlZGVmIHtFeGNsdWRlPFRFbmQgfCBMZXNzVGhhbjxURW5kPiwgTGVzc1RoYW48VFN0YXJ0Pj59IE51bWVyaWNSYW5nZVxuICovXG5cbi8vIEtlZXAgdGhlIHN0YXR1cyBjb2RlcyBhcyBgbnVtYmVyYCBiZWNhdXNlIHJlc3RyaWN0aW5nIHRvIGNlcnRhaW4gbnVtYmVycyBtYWtlcyBpdCB1bm5lY2Vzc2FyaWx5IGhhcmQgdG8gdXNlIGNvbXBhcmVkIHRvIHRoZSBiZW5lZml0c1xuLy8gKHdlIGhhdmUgcnVudGltZSBlcnJvcnMgYWxyZWFkeSB0byBjaGVjayBmb3IgaW52YWxpZCBjb2RlcykuIEFsc28gc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9zdmVsdGVqcy9raXQvaXNzdWVzLzExNzgwXG5cbi8vIHdlIGhhdmUgdG8gcmVwZWF0IHRoZSBKU0RvYyBiZWNhdXNlIHRoZSBkaXNwbGF5IGZvciBmdW5jdGlvbiBvdmVybG9hZHMgaXMgYnJva2VuXG4vLyBzZWUgaHR0cHM6Ly9naXRodWIuY29tL21pY3Jvc29mdC9UeXBlU2NyaXB0L2lzc3Vlcy81NTA1NlxuXG4vKipcbiAqIFRocm93cyBhbiBlcnJvciB3aXRoIGEgSFRUUCBzdGF0dXMgY29kZSBhbmQgYW4gb3B0aW9uYWwgbWVzc2FnZS5cbiAqIFdoZW4gY2FsbGVkIGR1cmluZyByZXF1ZXN0IGhhbmRsaW5nLCB0aGlzIHdpbGwgY2F1c2UgU3ZlbHRlS2l0IHRvXG4gKiByZXR1cm4gYW4gZXJyb3IgcmVzcG9uc2Ugd2l0aG91dCBpbnZva2luZyBgaGFuZGxlRXJyb3JgLlxuICogTWFrZSBzdXJlIHlvdSdyZSBub3QgY2F0Y2hpbmcgdGhlIHRocm93biBlcnJvciwgd2hpY2ggd291bGQgcHJldmVudCBTdmVsdGVLaXQgZnJvbSBoYW5kbGluZyBpdC5cbiAqIEBwYXJhbSB7bnVtYmVyfSBzdGF0dXMgVGhlIFtIVFRQIHN0YXR1cyBjb2RlXShodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9IVFRQL1N0YXR1cyNjbGllbnRfZXJyb3JfcmVzcG9uc2VzKS4gTXVzdCBiZSBpbiB0aGUgcmFuZ2UgNDAwLTU5OS5cbiAqIEBwYXJhbSB7QXBwLkVycm9yfSBib2R5IEFuIG9iamVjdCB0aGF0IGNvbmZvcm1zIHRvIHRoZSBBcHAuRXJyb3IgdHlwZS4gSWYgYSBzdHJpbmcgaXMgcGFzc2VkLCBpdCB3aWxsIGJlIHVzZWQgYXMgdGhlIG1lc3NhZ2UgcHJvcGVydHkuXG4gKiBAb3ZlcmxvYWRcbiAqIEBwYXJhbSB7bnVtYmVyfSBzdGF0dXNcbiAqIEBwYXJhbSB7QXBwLkVycm9yfSBib2R5XG4gKiBAcmV0dXJuIHtuZXZlcn1cbiAqIEB0aHJvd3Mge0h0dHBFcnJvcn0gVGhpcyBlcnJvciBpbnN0cnVjdHMgU3ZlbHRlS2l0IHRvIGluaXRpYXRlIEhUVFAgZXJyb3IgaGFuZGxpbmcuXG4gKiBAdGhyb3dzIHtFcnJvcn0gSWYgdGhlIHByb3ZpZGVkIHN0YXR1cyBpcyBpbnZhbGlkIChub3QgYmV0d2VlbiA0MDAgYW5kIDU5OSkuXG4gKi9cbi8qKlxuICogVGhyb3dzIGFuIGVycm9yIHdpdGggYSBIVFRQIHN0YXR1cyBjb2RlIGFuZCBhbiBvcHRpb25hbCBtZXNzYWdlLlxuICogV2hlbiBjYWxsZWQgZHVyaW5nIHJlcXVlc3QgaGFuZGxpbmcsIHRoaXMgd2lsbCBjYXVzZSBTdmVsdGVLaXQgdG9cbiAqIHJldHVybiBhbiBlcnJvciByZXNwb25zZSB3aXRob3V0IGludm9raW5nIGBoYW5kbGVFcnJvcmAuXG4gKiBNYWtlIHN1cmUgeW91J3JlIG5vdCBjYXRjaGluZyB0aGUgdGhyb3duIGVycm9yLCB3aGljaCB3b3VsZCBwcmV2ZW50IFN2ZWx0ZUtpdCBmcm9tIGhhbmRsaW5nIGl0LlxuICogQHBhcmFtIHtudW1iZXJ9IHN0YXR1cyBUaGUgW0hUVFAgc3RhdHVzIGNvZGVdKGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0hUVFAvU3RhdHVzI2NsaWVudF9lcnJvcl9yZXNwb25zZXMpLiBNdXN0IGJlIGluIHRoZSByYW5nZSA0MDAtNTk5LlxuICogQHBhcmFtIHt7IG1lc3NhZ2U6IHN0cmluZyB9IGV4dGVuZHMgQXBwLkVycm9yID8gQXBwLkVycm9yIHwgc3RyaW5nIHwgdW5kZWZpbmVkIDogbmV2ZXJ9IFtib2R5XSBBbiBvYmplY3QgdGhhdCBjb25mb3JtcyB0byB0aGUgQXBwLkVycm9yIHR5cGUuIElmIGEgc3RyaW5nIGlzIHBhc3NlZCwgaXQgd2lsbCBiZSB1c2VkIGFzIHRoZSBtZXNzYWdlIHByb3BlcnR5LlxuICogQG92ZXJsb2FkXG4gKiBAcGFyYW0ge251bWJlcn0gc3RhdHVzXG4gKiBAcGFyYW0ge3sgbWVzc2FnZTogc3RyaW5nIH0gZXh0ZW5kcyBBcHAuRXJyb3IgPyBBcHAuRXJyb3IgfCBzdHJpbmcgfCB1bmRlZmluZWQgOiBuZXZlcn0gW2JvZHldXG4gKiBAcmV0dXJuIHtuZXZlcn1cbiAqIEB0aHJvd3Mge0h0dHBFcnJvcn0gVGhpcyBlcnJvciBpbnN0cnVjdHMgU3ZlbHRlS2l0IHRvIGluaXRpYXRlIEhUVFAgZXJyb3IgaGFuZGxpbmcuXG4gKiBAdGhyb3dzIHtFcnJvcn0gSWYgdGhlIHByb3ZpZGVkIHN0YXR1cyBpcyBpbnZhbGlkIChub3QgYmV0d2VlbiA0MDAgYW5kIDU5OSkuXG4gKi9cbi8qKlxuICogVGhyb3dzIGFuIGVycm9yIHdpdGggYSBIVFRQIHN0YXR1cyBjb2RlIGFuZCBhbiBvcHRpb25hbCBtZXNzYWdlLlxuICogV2hlbiBjYWxsZWQgZHVyaW5nIHJlcXVlc3QgaGFuZGxpbmcsIHRoaXMgd2lsbCBjYXVzZSBTdmVsdGVLaXQgdG9cbiAqIHJldHVybiBhbiBlcnJvciByZXNwb25zZSB3aXRob3V0IGludm9raW5nIGBoYW5kbGVFcnJvcmAuXG4gKiBNYWtlIHN1cmUgeW91J3JlIG5vdCBjYXRjaGluZyB0aGUgdGhyb3duIGVycm9yLCB3aGljaCB3b3VsZCBwcmV2ZW50IFN2ZWx0ZUtpdCBmcm9tIGhhbmRsaW5nIGl0LlxuICogQHBhcmFtIHtudW1iZXJ9IHN0YXR1cyBUaGUgW0hUVFAgc3RhdHVzIGNvZGVdKGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0hUVFAvU3RhdHVzI2NsaWVudF9lcnJvcl9yZXNwb25zZXMpLiBNdXN0IGJlIGluIHRoZSByYW5nZSA0MDAtNTk5LlxuICogQHBhcmFtIHt7IG1lc3NhZ2U6IHN0cmluZyB9IGV4dGVuZHMgQXBwLkVycm9yID8gQXBwLkVycm9yIHwgc3RyaW5nIHwgdW5kZWZpbmVkIDogbmV2ZXJ9IGJvZHkgQW4gb2JqZWN0IHRoYXQgY29uZm9ybXMgdG8gdGhlIEFwcC5FcnJvciB0eXBlLiBJZiBhIHN0cmluZyBpcyBwYXNzZWQsIGl0IHdpbGwgYmUgdXNlZCBhcyB0aGUgbWVzc2FnZSBwcm9wZXJ0eS5cbiAqIEByZXR1cm4ge25ldmVyfVxuICogQHRocm93cyB7SHR0cEVycm9yfSBUaGlzIGVycm9yIGluc3RydWN0cyBTdmVsdGVLaXQgdG8gaW5pdGlhdGUgSFRUUCBlcnJvciBoYW5kbGluZy5cbiAqIEB0aHJvd3Mge0Vycm9yfSBJZiB0aGUgcHJvdmlkZWQgc3RhdHVzIGlzIGludmFsaWQgKG5vdCBiZXR3ZWVuIDQwMCBhbmQgNTk5KS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVycm9yKHN0YXR1cywgYm9keSkge1xuXHRpZiAoKCFCUk9XU0VSIHx8IERFVikgJiYgKGlzTmFOKHN0YXR1cykgfHwgc3RhdHVzIDwgNDAwIHx8IHN0YXR1cyA+IDU5OSkpIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoYEhUVFAgZXJyb3Igc3RhdHVzIGNvZGVzIG11c3QgYmUgYmV0d2VlbiA0MDAgYW5kIDU5OSDigJQgJHtzdGF0dXN9IGlzIGludmFsaWRgKTtcblx0fVxuXG5cdHRocm93IG5ldyBIdHRwRXJyb3Ioc3RhdHVzLCBib2R5KTtcbn1cblxuLyoqXG4gKiBDaGVja3Mgd2hldGhlciB0aGlzIGlzIGFuIGVycm9yIHRocm93biBieSB7QGxpbmsgZXJyb3J9LlxuICogQHRlbXBsYXRlIHtudW1iZXJ9IFRcbiAqIEBwYXJhbSB7dW5rbm93bn0gZVxuICogQHBhcmFtIHtUfSBbc3RhdHVzXSBUaGUgc3RhdHVzIHRvIGZpbHRlciBmb3IuXG4gKiBAcmV0dXJuIHtlIGlzIChIdHRwRXJyb3IgJiB7IHN0YXR1czogVCBleHRlbmRzIHVuZGVmaW5lZCA/IG5ldmVyIDogVCB9KX1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzSHR0cEVycm9yKGUsIHN0YXR1cykge1xuXHRpZiAoIShlIGluc3RhbmNlb2YgSHR0cEVycm9yKSkgcmV0dXJuIGZhbHNlO1xuXHRyZXR1cm4gIXN0YXR1cyB8fCBlLnN0YXR1cyA9PT0gc3RhdHVzO1xufVxuXG4vKipcbiAqIFJlZGlyZWN0IGEgcmVxdWVzdC4gV2hlbiBjYWxsZWQgZHVyaW5nIHJlcXVlc3QgaGFuZGxpbmcsIFN2ZWx0ZUtpdCB3aWxsIHJldHVybiBhIHJlZGlyZWN0IHJlc3BvbnNlLlxuICogTWFrZSBzdXJlIHlvdSdyZSBub3QgY2F0Y2hpbmcgdGhlIHRocm93biByZWRpcmVjdCwgd2hpY2ggd291bGQgcHJldmVudCBTdmVsdGVLaXQgZnJvbSBoYW5kbGluZyBpdC5cbiAqIEBwYXJhbSB7MzAwIHwgMzAxIHwgMzAyIHwgMzAzIHwgMzA0IHwgMzA1IHwgMzA2IHwgMzA3IHwgMzA4IHwgKHt9ICYgbnVtYmVyKX0gc3RhdHVzIFRoZSBbSFRUUCBzdGF0dXMgY29kZV0oaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSFRUUC9TdGF0dXMjcmVkaXJlY3Rpb25fbWVzc2FnZXMpLiBNdXN0IGJlIGluIHRoZSByYW5nZSAzMDAtMzA4LlxuICogQHBhcmFtIHtzdHJpbmcgfCBVUkx9IGxvY2F0aW9uIFRoZSBsb2NhdGlvbiB0byByZWRpcmVjdCB0by5cbiAqIEB0aHJvd3Mge1JlZGlyZWN0fSBUaGlzIGVycm9yIGluc3RydWN0cyBTdmVsdGVLaXQgdG8gcmVkaXJlY3QgdG8gdGhlIHNwZWNpZmllZCBsb2NhdGlvbi5cbiAqIEB0aHJvd3Mge0Vycm9yfSBJZiB0aGUgcHJvdmlkZWQgc3RhdHVzIGlzIGludmFsaWQuXG4gKiBAcmV0dXJuIHtuZXZlcn1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlZGlyZWN0KHN0YXR1cywgbG9jYXRpb24pIHtcblx0aWYgKCghQlJPV1NFUiB8fCBERVYpICYmIChpc05hTihzdGF0dXMpIHx8IHN0YXR1cyA8IDMwMCB8fCBzdGF0dXMgPiAzMDgpKSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHN0YXR1cyBjb2RlJyk7XG5cdH1cblxuXHR0aHJvdyBuZXcgUmVkaXJlY3QoXG5cdFx0Ly8gQHRzLWlnbm9yZVxuXHRcdHN0YXR1cyxcblx0XHRsb2NhdGlvbi50b1N0cmluZygpXG5cdCk7XG59XG5cbi8qKlxuICogQ2hlY2tzIHdoZXRoZXIgdGhpcyBpcyBhIHJlZGlyZWN0IHRocm93biBieSB7QGxpbmsgcmVkaXJlY3R9LlxuICogQHBhcmFtIHt1bmtub3dufSBlIFRoZSBvYmplY3QgdG8gY2hlY2suXG4gKiBAcmV0dXJuIHtlIGlzIFJlZGlyZWN0fVxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNSZWRpcmVjdChlKSB7XG5cdHJldHVybiBlIGluc3RhbmNlb2YgUmVkaXJlY3Q7XG59XG5cbi8qKlxuICogQ3JlYXRlIGEgSlNPTiBgUmVzcG9uc2VgIG9iamVjdCBmcm9tIHRoZSBzdXBwbGllZCBkYXRhLlxuICogQHBhcmFtIHthbnl9IGRhdGEgVGhlIHZhbHVlIHRoYXQgd2lsbCBiZSBzZXJpYWxpemVkIGFzIEpTT04uXG4gKiBAcGFyYW0ge1Jlc3BvbnNlSW5pdH0gW2luaXRdIE9wdGlvbnMgc3VjaCBhcyBgc3RhdHVzYCBhbmQgYGhlYWRlcnNgIHRoYXQgd2lsbCBiZSBhZGRlZCB0byB0aGUgcmVzcG9uc2UuIGBDb250ZW50LVR5cGU6IGFwcGxpY2F0aW9uL2pzb25gIGFuZCBgQ29udGVudC1MZW5ndGhgIGhlYWRlcnMgd2lsbCBiZSBhZGRlZCBhdXRvbWF0aWNhbGx5LlxuICovXG5leHBvcnQgZnVuY3Rpb24ganNvbihkYXRhLCBpbml0KSB7XG5cdC8vIFRPRE8gZGVwcmVjYXRlIHRoaXMgaW4gZmF2b3VyIG9mIGBSZXNwb25zZS5qc29uYCB3aGVuIGl0J3Ncblx0Ly8gbW9yZSB3aWRlbHkgc3VwcG9ydGVkXG5cdGNvbnN0IGJvZHkgPSBKU09OLnN0cmluZ2lmeShkYXRhKTtcblxuXHQvLyB3ZSBjYW4ndCBqdXN0IGRvIGB0ZXh0KEpTT04uc3RyaW5naWZ5KGRhdGEpLCBpbml0KWAgYmVjYXVzZVxuXHQvLyBpdCB3aWxsIHNldCBhIGRlZmF1bHQgYGNvbnRlbnQtdHlwZWAgaGVhZGVyLiBkdXBsaWNhdGVkIGNvZGVcblx0Ly8gbWVhbnMgbGVzcyBkdXBsaWNhdGVkIHdvcmtcblx0Y29uc3QgaGVhZGVycyA9IG5ldyBIZWFkZXJzKGluaXQ/LmhlYWRlcnMpO1xuXHRpZiAoIWhlYWRlcnMuaGFzKCdjb250ZW50LWxlbmd0aCcpKSB7XG5cdFx0aGVhZGVycy5zZXQoJ2NvbnRlbnQtbGVuZ3RoJywgZW5jb2Rlci5lbmNvZGUoYm9keSkuYnl0ZUxlbmd0aC50b1N0cmluZygpKTtcblx0fVxuXG5cdGlmICghaGVhZGVycy5oYXMoJ2NvbnRlbnQtdHlwZScpKSB7XG5cdFx0aGVhZGVycy5zZXQoJ2NvbnRlbnQtdHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG5cdH1cblxuXHRyZXR1cm4gbmV3IFJlc3BvbnNlKGJvZHksIHtcblx0XHQuLi5pbml0LFxuXHRcdGhlYWRlcnNcblx0fSk7XG59XG5cbmNvbnN0IGVuY29kZXIgPSBuZXcgVGV4dEVuY29kZXIoKTtcblxuLyoqXG4gKiBDcmVhdGUgYSBgUmVzcG9uc2VgIG9iamVjdCBmcm9tIHRoZSBzdXBwbGllZCBib2R5LlxuICogQHBhcmFtIHtzdHJpbmd9IGJvZHkgVGhlIHZhbHVlIHRoYXQgd2lsbCBiZSB1c2VkIGFzLWlzLlxuICogQHBhcmFtIHtSZXNwb25zZUluaXR9IFtpbml0XSBPcHRpb25zIHN1Y2ggYXMgYHN0YXR1c2AgYW5kIGBoZWFkZXJzYCB0aGF0IHdpbGwgYmUgYWRkZWQgdG8gdGhlIHJlc3BvbnNlLiBBIGBDb250ZW50LUxlbmd0aGAgaGVhZGVyIHdpbGwgYmUgYWRkZWQgYXV0b21hdGljYWxseS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRleHQoYm9keSwgaW5pdCkge1xuXHRjb25zdCBoZWFkZXJzID0gbmV3IEhlYWRlcnMoaW5pdD8uaGVhZGVycyk7XG5cdGlmICghaGVhZGVycy5oYXMoJ2NvbnRlbnQtbGVuZ3RoJykpIHtcblx0XHRjb25zdCBlbmNvZGVkID0gZW5jb2Rlci5lbmNvZGUoYm9keSk7XG5cdFx0aGVhZGVycy5zZXQoJ2NvbnRlbnQtbGVuZ3RoJywgZW5jb2RlZC5ieXRlTGVuZ3RoLnRvU3RyaW5nKCkpO1xuXHRcdHJldHVybiBuZXcgUmVzcG9uc2UoZW5jb2RlZCwge1xuXHRcdFx0Li4uaW5pdCxcblx0XHRcdGhlYWRlcnNcblx0XHR9KTtcblx0fVxuXG5cdHJldHVybiBuZXcgUmVzcG9uc2UoYm9keSwge1xuXHRcdC4uLmluaXQsXG5cdFx0aGVhZGVyc1xuXHR9KTtcbn1cblxuLyoqXG4gKiBDcmVhdGUgYW4gYEFjdGlvbkZhaWx1cmVgIG9iamVjdC5cbiAqIEBwYXJhbSB7bnVtYmVyfSBzdGF0dXMgVGhlIFtIVFRQIHN0YXR1cyBjb2RlXShodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9IVFRQL1N0YXR1cyNjbGllbnRfZXJyb3JfcmVzcG9uc2VzKS4gTXVzdCBiZSBpbiB0aGUgcmFuZ2UgNDAwLTU5OS5cbiAqIEBvdmVybG9hZFxuICogQHBhcmFtIHtudW1iZXJ9IHN0YXR1c1xuICogQHJldHVybnMge2ltcG9ydCgnLi9wdWJsaWMuanMnKS5BY3Rpb25GYWlsdXJlPHVuZGVmaW5lZD59XG4gKi9cbi8qKlxuICogQ3JlYXRlIGFuIGBBY3Rpb25GYWlsdXJlYCBvYmplY3QuXG4gKiBAdGVtcGxhdGUge1JlY29yZDxzdHJpbmcsIHVua25vd24+IHwgdW5kZWZpbmVkfSBbVD11bmRlZmluZWRdXG4gKiBAcGFyYW0ge251bWJlcn0gc3RhdHVzIFRoZSBbSFRUUCBzdGF0dXMgY29kZV0oaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSFRUUC9TdGF0dXMjY2xpZW50X2Vycm9yX3Jlc3BvbnNlcykuIE11c3QgYmUgaW4gdGhlIHJhbmdlIDQwMC01OTkuXG4gKiBAcGFyYW0ge1R9IGRhdGEgRGF0YSBhc3NvY2lhdGVkIHdpdGggdGhlIGZhaWx1cmUgKGUuZy4gdmFsaWRhdGlvbiBlcnJvcnMpXG4gKiBAb3ZlcmxvYWRcbiAqIEBwYXJhbSB7bnVtYmVyfSBzdGF0dXNcbiAqIEBwYXJhbSB7VH0gZGF0YVxuICogQHJldHVybnMge2ltcG9ydCgnLi9wdWJsaWMuanMnKS5BY3Rpb25GYWlsdXJlPFQ+fVxuICovXG4vKipcbiAqIENyZWF0ZSBhbiBgQWN0aW9uRmFpbHVyZWAgb2JqZWN0LlxuICogQHBhcmFtIHtudW1iZXJ9IHN0YXR1c1xuICogQHBhcmFtIHthbnl9IFtkYXRhXVxuICogQHJldHVybnMge2ltcG9ydCgnLi9wdWJsaWMuanMnKS5BY3Rpb25GYWlsdXJlPGFueT59XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmYWlsKHN0YXR1cywgZGF0YSkge1xuXHQvLyBAdHMtZXhwZWN0LWVycm9yIHVuaXF1ZSBzeW1ib2wgbWlzc2luZ1xuXHRyZXR1cm4gbmV3IEFjdGlvbkZhaWx1cmUoc3RhdHVzLCBkYXRhKTtcbn1cbiIsImltcG9ydCB7IEh0dHBFcnJvciwgU3ZlbHRlS2l0RXJyb3IgfSBmcm9tICcuLi9ydW50aW1lL2NvbnRyb2wuanMnO1xuXG4vKipcbiAqIEBwYXJhbSB7dW5rbm93bn0gZXJyXG4gKiBAcmV0dXJuIHtFcnJvcn1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvYWxlc2NlX3RvX2Vycm9yKGVycikge1xuXHRyZXR1cm4gZXJyIGluc3RhbmNlb2YgRXJyb3IgfHxcblx0XHQoZXJyICYmIC8qKiBAdHlwZSB7YW55fSAqLyAoZXJyKS5uYW1lICYmIC8qKiBAdHlwZSB7YW55fSAqLyAoZXJyKS5tZXNzYWdlKVxuXHRcdD8gLyoqIEB0eXBlIHtFcnJvcn0gKi8gKGVycilcblx0XHQ6IG5ldyBFcnJvcihKU09OLnN0cmluZ2lmeShlcnIpKTtcbn1cblxuLyoqXG4gKiBUaGlzIGlzIGFuIGlkZW50aXR5IGZ1bmN0aW9uIHRoYXQgZXhpc3RzIHRvIG1ha2UgVHlwZVNjcmlwdCBsZXNzXG4gKiBwYXJhbm9pZCBhYm91dCBwZW9wbGUgdGhyb3dpbmcgdGhpbmdzIHRoYXQgYXJlbid0IGVycm9ycywgd2hpY2hcbiAqIGZyYW5rbHkgaXMgbm90IHNvbWV0aGluZyB3ZSBzaG91bGQgY2FyZSBhYm91dFxuICogQHBhcmFtIHt1bmtub3dufSBlcnJvclxuICovXG5leHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplX2Vycm9yKGVycm9yKSB7XG5cdHJldHVybiAvKiogQHR5cGUge2ltcG9ydCgnLi4vcnVudGltZS9jb250cm9sLmpzJykuUmVkaXJlY3QgfCBIdHRwRXJyb3IgfCBTdmVsdGVLaXRFcnJvciB8IEVycm9yfSAqLyAoXG5cdFx0ZXJyb3Jcblx0KTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge3Vua25vd259IGVycm9yXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRfc3RhdHVzKGVycm9yKSB7XG5cdHJldHVybiBlcnJvciBpbnN0YW5jZW9mIEh0dHBFcnJvciB8fCBlcnJvciBpbnN0YW5jZW9mIFN2ZWx0ZUtpdEVycm9yID8gZXJyb3Iuc3RhdHVzIDogNTAwO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7dW5rbm93bn0gZXJyb3JcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldF9tZXNzYWdlKGVycm9yKSB7XG5cdHJldHVybiBlcnJvciBpbnN0YW5jZW9mIFN2ZWx0ZUtpdEVycm9yID8gZXJyb3IudGV4dCA6ICdJbnRlcm5hbCBFcnJvcic7XG59XG4iLCJpbXBvcnQgeyBERVYgfSBmcm9tICdlc20tZW52JztcbmltcG9ydCB7IGpzb24sIHRleHQgfSBmcm9tICcuLi8uLi9leHBvcnRzL2luZGV4LmpzJztcbmltcG9ydCB7IGNvYWxlc2NlX3RvX2Vycm9yLCBnZXRfbWVzc2FnZSwgZ2V0X3N0YXR1cyB9IGZyb20gJy4uLy4uL3V0aWxzL2Vycm9yLmpzJztcbmltcG9ydCB7IG5lZ290aWF0ZSB9IGZyb20gJy4uLy4uL3V0aWxzL2h0dHAuanMnO1xuaW1wb3J0IHsgSHR0cEVycm9yIH0gZnJvbSAnLi4vY29udHJvbC5qcyc7XG5pbXBvcnQgeyBmaXhfc3RhY2tfdHJhY2UgfSBmcm9tICcuLi9zaGFyZWQtc2VydmVyLmpzJztcbmltcG9ydCB7IEVORFBPSU5UX01FVEhPRFMgfSBmcm9tICcuLi8uLi9jb25zdGFudHMuanMnO1xuXG4vKiogQHBhcmFtIHthbnl9IGJvZHkgKi9cbmV4cG9ydCBmdW5jdGlvbiBpc19wb2pvKGJvZHkpIHtcblx0aWYgKHR5cGVvZiBib2R5ICE9PSAnb2JqZWN0JykgcmV0dXJuIGZhbHNlO1xuXG5cdGlmIChib2R5KSB7XG5cdFx0aWYgKGJvZHkgaW5zdGFuY2VvZiBVaW50OEFycmF5KSByZXR1cm4gZmFsc2U7XG5cdFx0aWYgKGJvZHkgaW5zdGFuY2VvZiBSZWFkYWJsZVN0cmVhbSkgcmV0dXJuIGZhbHNlO1xuXHR9XG5cblx0cmV0dXJuIHRydWU7XG59XG5cbi8qKlxuICogQHBhcmFtIHtQYXJ0aWFsPFJlY29yZDxpbXBvcnQoJ3R5cGVzJykuSHR0cE1ldGhvZCwgYW55Pj59IG1vZFxuICogQHBhcmFtIHtpbXBvcnQoJ3R5cGVzJykuSHR0cE1ldGhvZH0gbWV0aG9kXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtZXRob2Rfbm90X2FsbG93ZWQobW9kLCBtZXRob2QpIHtcblx0cmV0dXJuIHRleHQoYCR7bWV0aG9kfSBtZXRob2Qgbm90IGFsbG93ZWRgLCB7XG5cdFx0c3RhdHVzOiA0MDUsXG5cdFx0aGVhZGVyczoge1xuXHRcdFx0Ly8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSFRUUC9TdGF0dXMvNDA1XG5cdFx0XHQvLyBcIlRoZSBzZXJ2ZXIgbXVzdCBnZW5lcmF0ZSBhbiBBbGxvdyBoZWFkZXIgZmllbGQgaW4gYSA0MDUgc3RhdHVzIGNvZGUgcmVzcG9uc2VcIlxuXHRcdFx0YWxsb3c6IGFsbG93ZWRfbWV0aG9kcyhtb2QpLmpvaW4oJywgJylcblx0XHR9XG5cdH0pO1xufVxuXG4vKiogQHBhcmFtIHtQYXJ0aWFsPFJlY29yZDxpbXBvcnQoJ3R5cGVzJykuSHR0cE1ldGhvZCwgYW55Pj59IG1vZCAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFsbG93ZWRfbWV0aG9kcyhtb2QpIHtcblx0Y29uc3QgYWxsb3dlZCA9IEVORFBPSU5UX01FVEhPRFMuZmlsdGVyKChtZXRob2QpID0+IG1ldGhvZCBpbiBtb2QpO1xuXG5cdGlmICgnR0VUJyBpbiBtb2QgfHwgJ0hFQUQnIGluIG1vZCkgYWxsb3dlZC5wdXNoKCdIRUFEJyk7XG5cblx0cmV0dXJuIGFsbG93ZWQ7XG59XG5cbi8qKlxuICogUmV0dXJuIGFzIGEgcmVzcG9uc2UgdGhhdCByZW5kZXJzIHRoZSBlcnJvci5odG1sXG4gKlxuICogQHBhcmFtIHtpbXBvcnQoJ3R5cGVzJykuU1NST3B0aW9uc30gb3B0aW9uc1xuICogQHBhcmFtIHtudW1iZXJ9IHN0YXR1c1xuICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0YXRpY19lcnJvcl9wYWdlKG9wdGlvbnMsIHN0YXR1cywgbWVzc2FnZSkge1xuXHRsZXQgcGFnZSA9IG9wdGlvbnMudGVtcGxhdGVzLmVycm9yKHsgc3RhdHVzLCBtZXNzYWdlIH0pO1xuXG5cdGlmIChERVYpIHtcblx0XHQvLyBpbmplY3QgVml0ZSBITVIgY2xpZW50LCBmb3IgZWFzaWVyIGRlYnVnZ2luZ1xuXHRcdHBhZ2UgPSBwYWdlLnJlcGxhY2UoJzwvaGVhZD4nLCAnPHNjcmlwdCB0eXBlPVwibW9kdWxlXCIgc3JjPVwiL0B2aXRlL2NsaWVudFwiPjwvc2NyaXB0PjwvaGVhZD4nKTtcblx0fVxuXG5cdHJldHVybiB0ZXh0KHBhZ2UsIHtcblx0XHRoZWFkZXJzOiB7ICdjb250ZW50LXR5cGUnOiAndGV4dC9odG1sOyBjaGFyc2V0PXV0Zi04JyB9LFxuXHRcdHN0YXR1c1xuXHR9KTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge2ltcG9ydCgnQHN2ZWx0ZWpzL2tpdCcpLlJlcXVlc3RFdmVudH0gZXZlbnRcbiAqIEBwYXJhbSB7aW1wb3J0KCd0eXBlcycpLlNTUk9wdGlvbnN9IG9wdGlvbnNcbiAqIEBwYXJhbSB7dW5rbm93bn0gZXJyb3JcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGhhbmRsZV9mYXRhbF9lcnJvcihldmVudCwgb3B0aW9ucywgZXJyb3IpIHtcblx0ZXJyb3IgPSBlcnJvciBpbnN0YW5jZW9mIEh0dHBFcnJvciA/IGVycm9yIDogY29hbGVzY2VfdG9fZXJyb3IoZXJyb3IpO1xuXHRjb25zdCBzdGF0dXMgPSBnZXRfc3RhdHVzKGVycm9yKTtcblx0Y29uc3QgYm9keSA9IGF3YWl0IGhhbmRsZV9lcnJvcl9hbmRfanNvbmlmeShldmVudCwgb3B0aW9ucywgZXJyb3IpO1xuXG5cdC8vIGlkZWFsbHkgd2UnZCB1c2Ugc2VjLWZldGNoLWRlc3QgaW5zdGVhZCwgYnV0IFNhZmFyaSDigJQgcXVlbGxlIHN1cnByaXNlIOKAlCBkb2Vzbid0IHN1cHBvcnQgaXRcblx0Y29uc3QgdHlwZSA9IG5lZ290aWF0ZShldmVudC5yZXF1ZXN0LmhlYWRlcnMuZ2V0KCdhY2NlcHQnKSB8fCAndGV4dC9odG1sJywgW1xuXHRcdCdhcHBsaWNhdGlvbi9qc29uJyxcblx0XHQndGV4dC9odG1sJ1xuXHRdKTtcblxuXHRpZiAoZXZlbnQuaXNEYXRhUmVxdWVzdCB8fCB0eXBlID09PSAnYXBwbGljYXRpb24vanNvbicpIHtcblx0XHRyZXR1cm4ganNvbihib2R5LCB7XG5cdFx0XHRzdGF0dXNcblx0XHR9KTtcblx0fVxuXG5cdHJldHVybiBzdGF0aWNfZXJyb3JfcGFnZShvcHRpb25zLCBzdGF0dXMsIGJvZHkubWVzc2FnZSk7XG59XG5cbi8qKlxuICogQHBhcmFtIHtpbXBvcnQoJ0BzdmVsdGVqcy9raXQnKS5SZXF1ZXN0RXZlbnR9IGV2ZW50XG4gKiBAcGFyYW0ge2ltcG9ydCgndHlwZXMnKS5TU1JPcHRpb25zfSBvcHRpb25zXG4gKiBAcGFyYW0ge2FueX0gZXJyb3JcbiAqIEByZXR1cm5zIHtQcm9taXNlPEFwcC5FcnJvcj59XG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBoYW5kbGVfZXJyb3JfYW5kX2pzb25pZnkoZXZlbnQsIG9wdGlvbnMsIGVycm9yKSB7XG5cdGlmIChlcnJvciBpbnN0YW5jZW9mIEh0dHBFcnJvcikge1xuXHRcdHJldHVybiBlcnJvci5ib2R5O1xuXHR9XG5cblx0aWYgKF9fU1ZFTFRFS0lUX0RFVl9fICYmIHR5cGVvZiBlcnJvciA9PSAnb2JqZWN0Jykge1xuXHRcdGZpeF9zdGFja190cmFjZShlcnJvcik7XG5cdH1cblxuXHRjb25zdCBzdGF0dXMgPSBnZXRfc3RhdHVzKGVycm9yKTtcblx0Y29uc3QgbWVzc2FnZSA9IGdldF9tZXNzYWdlKGVycm9yKTtcblxuXHRyZXR1cm4gKGF3YWl0IG9wdGlvbnMuaG9va3MuaGFuZGxlRXJyb3IoeyBlcnJvciwgZXZlbnQsIHN0YXR1cywgbWVzc2FnZSB9KSkgPz8geyBtZXNzYWdlIH07XG59XG5cbi8qKlxuICogQHBhcmFtIHtudW1iZXJ9IHN0YXR1c1xuICogQHBhcmFtIHtzdHJpbmd9IGxvY2F0aW9uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWRpcmVjdF9yZXNwb25zZShzdGF0dXMsIGxvY2F0aW9uKSB7XG5cdGNvbnN0IHJlc3BvbnNlID0gbmV3IFJlc3BvbnNlKHVuZGVmaW5lZCwge1xuXHRcdHN0YXR1cyxcblx0XHRoZWFkZXJzOiB7IGxvY2F0aW9uIH1cblx0fSk7XG5cdHJldHVybiByZXNwb25zZTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge2ltcG9ydCgnQHN2ZWx0ZWpzL2tpdCcpLlJlcXVlc3RFdmVudH0gZXZlbnRcbiAqIEBwYXJhbSB7RXJyb3IgJiB7IHBhdGg6IHN0cmluZyB9fSBlcnJvclxuICovXG5leHBvcnQgZnVuY3Rpb24gY2xhcmlmeV9kZXZhbHVlX2Vycm9yKGV2ZW50LCBlcnJvcikge1xuXHRpZiAoZXJyb3IucGF0aCkge1xuXHRcdHJldHVybiBgRGF0YSByZXR1cm5lZCBmcm9tIFxcYGxvYWRcXGAgd2hpbGUgcmVuZGVyaW5nICR7ZXZlbnQucm91dGUuaWR9IGlzIG5vdCBzZXJpYWxpemFibGU6ICR7ZXJyb3IubWVzc2FnZX0gKGRhdGEke2Vycm9yLnBhdGh9KWA7XG5cdH1cblxuXHRpZiAoZXJyb3IucGF0aCA9PT0gJycpIHtcblx0XHRyZXR1cm4gYERhdGEgcmV0dXJuZWQgZnJvbSBcXGBsb2FkXFxgIHdoaWxlIHJlbmRlcmluZyAke2V2ZW50LnJvdXRlLmlkfSBpcyBub3QgYSBwbGFpbiBvYmplY3RgO1xuXHR9XG5cblx0Ly8gYmVsdCBhbmQgYnJhY2VzIOKAlCB0aGlzIHNob3VsZCBuZXZlciBoYXBwZW5cblx0cmV0dXJuIGVycm9yLm1lc3NhZ2U7XG59XG5cbi8qKlxuICogQHBhcmFtIHtpbXBvcnQoJ3R5cGVzJykuU2VydmVyRGF0YU5vZGV9IG5vZGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0cmluZ2lmeV91c2VzKG5vZGUpIHtcblx0Y29uc3QgdXNlcyA9IFtdO1xuXG5cdGlmIChub2RlLnVzZXMgJiYgbm9kZS51c2VzLmRlcGVuZGVuY2llcy5zaXplID4gMCkge1xuXHRcdHVzZXMucHVzaChgXCJkZXBlbmRlbmNpZXNcIjoke0pTT04uc3RyaW5naWZ5KEFycmF5LmZyb20obm9kZS51c2VzLmRlcGVuZGVuY2llcykpfWApO1xuXHR9XG5cblx0aWYgKG5vZGUudXNlcyAmJiBub2RlLnVzZXMuc2VhcmNoX3BhcmFtcy5zaXplID4gMCkge1xuXHRcdHVzZXMucHVzaChgXCJzZWFyY2hfcGFyYW1zXCI6JHtKU09OLnN0cmluZ2lmeShBcnJheS5mcm9tKG5vZGUudXNlcy5zZWFyY2hfcGFyYW1zKSl9YCk7XG5cdH1cblxuXHRpZiAobm9kZS51c2VzICYmIG5vZGUudXNlcy5wYXJhbXMuc2l6ZSA+IDApIHtcblx0XHR1c2VzLnB1c2goYFwicGFyYW1zXCI6JHtKU09OLnN0cmluZ2lmeShBcnJheS5mcm9tKG5vZGUudXNlcy5wYXJhbXMpKX1gKTtcblx0fVxuXG5cdGlmIChub2RlLnVzZXM/LnBhcmVudCkgdXNlcy5wdXNoKCdcInBhcmVudFwiOjEnKTtcblx0aWYgKG5vZGUudXNlcz8ucm91dGUpIHVzZXMucHVzaCgnXCJyb3V0ZVwiOjEnKTtcblx0aWYgKG5vZGUudXNlcz8udXJsKSB1c2VzLnB1c2goJ1widXJsXCI6MScpO1xuXG5cdHJldHVybiBgXCJ1c2VzXCI6eyR7dXNlcy5qb2luKCcsJyl9fWA7XG59XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2VcbiAqIEBwYXJhbSB7bnVtYmVyfSBvZmZzZXRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHdhcm5fd2l0aF9jYWxsc2l0ZShtZXNzYWdlLCBvZmZzZXQgPSAwKSB7XG5cdGlmIChERVYpIHtcblx0XHRjb25zdCBzdGFjayA9IGZpeF9zdGFja190cmFjZShuZXcgRXJyb3IoKSkuc3BsaXQoJ1xcbicpO1xuXHRcdGNvbnN0IGxpbmUgPSBzdGFjay5hdCgzICsgb2Zmc2V0KTtcblx0XHRtZXNzYWdlICs9IGBcXG4ke2xpbmV9YDtcblx0fVxuXG5cdGNvbnNvbGUud2FybihtZXNzYWdlKTtcbn1cbiIsImltcG9ydCB7IEVORFBPSU5UX01FVEhPRFMsIFBBR0VfTUVUSE9EUyB9IGZyb20gJy4uLy4uL2NvbnN0YW50cy5qcyc7XG5pbXBvcnQgeyBuZWdvdGlhdGUgfSBmcm9tICcuLi8uLi91dGlscy9odHRwLmpzJztcbmltcG9ydCB7IFJlZGlyZWN0IH0gZnJvbSAnLi4vY29udHJvbC5qcyc7XG5pbXBvcnQgeyBtZXRob2Rfbm90X2FsbG93ZWQgfSBmcm9tICcuL3V0aWxzLmpzJztcblxuLyoqXG4gKiBAcGFyYW0ge2ltcG9ydCgnQHN2ZWx0ZWpzL2tpdCcpLlJlcXVlc3RFdmVudH0gZXZlbnRcbiAqIEBwYXJhbSB7aW1wb3J0KCd0eXBlcycpLlNTUkVuZHBvaW50fSBtb2RcbiAqIEBwYXJhbSB7aW1wb3J0KCd0eXBlcycpLlNTUlN0YXRlfSBzdGF0ZVxuICogQHJldHVybnMge1Byb21pc2U8UmVzcG9uc2U+fVxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVuZGVyX2VuZHBvaW50KGV2ZW50LCBtb2QsIHN0YXRlKSB7XG5cdGNvbnN0IG1ldGhvZCA9IC8qKiBAdHlwZSB7aW1wb3J0KCd0eXBlcycpLkh0dHBNZXRob2R9ICovIChldmVudC5yZXF1ZXN0Lm1ldGhvZCk7XG5cblx0bGV0IGhhbmRsZXIgPSBtb2RbbWV0aG9kXSB8fCBtb2QuZmFsbGJhY2s7XG5cblx0aWYgKG1ldGhvZCA9PT0gJ0hFQUQnICYmIG1vZC5HRVQgJiYgIW1vZC5IRUFEKSB7XG5cdFx0aGFuZGxlciA9IG1vZC5HRVQ7XG5cdH1cblxuXHRpZiAoIWhhbmRsZXIpIHtcblx0XHRyZXR1cm4gbWV0aG9kX25vdF9hbGxvd2VkKG1vZCwgbWV0aG9kKTtcblx0fVxuXG5cdGNvbnN0IHByZXJlbmRlciA9IG1vZC5wcmVyZW5kZXIgPz8gc3RhdGUucHJlcmVuZGVyX2RlZmF1bHQ7XG5cblx0aWYgKHByZXJlbmRlciAmJiAobW9kLlBPU1QgfHwgbW9kLlBBVENIIHx8IG1vZC5QVVQgfHwgbW9kLkRFTEVURSkpIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBwcmVyZW5kZXIgZW5kcG9pbnRzIHRoYXQgaGF2ZSBtdXRhdGl2ZSBtZXRob2RzJyk7XG5cdH1cblxuXHRpZiAoc3RhdGUucHJlcmVuZGVyaW5nICYmICFwcmVyZW5kZXIpIHtcblx0XHRpZiAoc3RhdGUuZGVwdGggPiAwKSB7XG5cdFx0XHQvLyBpZiByZXF1ZXN0IGNhbWUgZnJvbSBhIHByZXJlbmRlcmVkIHBhZ2UsIGJhaWxcblx0XHRcdHRocm93IG5ldyBFcnJvcihgJHtldmVudC5yb3V0ZS5pZH0gaXMgbm90IHByZXJlbmRlcmFibGVgKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Ly8gaWYgcmVxdWVzdCBjYW1lIGRpcmVjdCBmcm9tIHRoZSBjcmF3bGVyLCBzaWduYWwgdGhhdFxuXHRcdFx0Ly8gdGhpcyByb3V0ZSBjYW5ub3QgYmUgcHJlcmVuZGVyZWQsIGJ1dCBkb24ndCBiYWlsXG5cdFx0XHRyZXR1cm4gbmV3IFJlc3BvbnNlKHVuZGVmaW5lZCwgeyBzdGF0dXM6IDIwNCB9KTtcblx0XHR9XG5cdH1cblxuXHR0cnkge1xuXHRcdGxldCByZXNwb25zZSA9IGF3YWl0IGhhbmRsZXIoXG5cdFx0XHQvKiogQHR5cGUge2ltcG9ydCgnQHN2ZWx0ZWpzL2tpdCcpLlJlcXVlc3RFdmVudDxSZWNvcmQ8c3RyaW5nLCBhbnk+Pn0gKi8gKGV2ZW50KVxuXHRcdCk7XG5cblx0XHRpZiAoIShyZXNwb25zZSBpbnN0YW5jZW9mIFJlc3BvbnNlKSkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKFxuXHRcdFx0XHRgSW52YWxpZCByZXNwb25zZSBmcm9tIHJvdXRlICR7ZXZlbnQudXJsLnBhdGhuYW1lfTogaGFuZGxlciBzaG91bGQgcmV0dXJuIGEgUmVzcG9uc2Ugb2JqZWN0YFxuXHRcdFx0KTtcblx0XHR9XG5cblx0XHRpZiAoc3RhdGUucHJlcmVuZGVyaW5nKSB7XG5cdFx0XHQvLyB0aGUgcmV0dXJuZWQgUmVzcG9uc2UgbWlnaHQgaGF2ZSBpbW11dGFibGUgSGVhZGVyc1xuXHRcdFx0Ly8gc28gd2Ugc2hvdWxkIGNsb25lIHRoZW0gYmVmb3JlIHRyeWluZyB0byBtdXRhdGUgdGhlbVxuXHRcdFx0cmVzcG9uc2UgPSBuZXcgUmVzcG9uc2UocmVzcG9uc2UuYm9keSwge1xuXHRcdFx0XHRzdGF0dXM6IHJlc3BvbnNlLnN0YXR1cyxcblx0XHRcdFx0c3RhdHVzVGV4dDogcmVzcG9uc2Uuc3RhdHVzVGV4dCxcblx0XHRcdFx0aGVhZGVyczogbmV3IEhlYWRlcnMocmVzcG9uc2UuaGVhZGVycylcblx0XHRcdH0pO1xuXHRcdFx0cmVzcG9uc2UuaGVhZGVycy5zZXQoJ3gtc3ZlbHRla2l0LXByZXJlbmRlcicsIFN0cmluZyhwcmVyZW5kZXIpKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gcmVzcG9uc2U7XG5cdH0gY2F0Y2ggKGUpIHtcblx0XHRpZiAoZSBpbnN0YW5jZW9mIFJlZGlyZWN0KSB7XG5cdFx0XHRyZXR1cm4gbmV3IFJlc3BvbnNlKHVuZGVmaW5lZCwge1xuXHRcdFx0XHRzdGF0dXM6IGUuc3RhdHVzLFxuXHRcdFx0XHRoZWFkZXJzOiB7IGxvY2F0aW9uOiBlLmxvY2F0aW9uIH1cblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdHRocm93IGU7XG5cdH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge2ltcG9ydCgnQHN2ZWx0ZWpzL2tpdCcpLlJlcXVlc3RFdmVudH0gZXZlbnRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzX2VuZHBvaW50X3JlcXVlc3QoZXZlbnQpIHtcblx0Y29uc3QgeyBtZXRob2QsIGhlYWRlcnMgfSA9IGV2ZW50LnJlcXVlc3Q7XG5cblx0Ly8gVGhlc2UgbWV0aG9kcyBleGlzdCBleGNsdXNpdmVseSBmb3IgZW5kcG9pbnRzXG5cdGlmIChFTkRQT0lOVF9NRVRIT0RTLmluY2x1ZGVzKG1ldGhvZCkgJiYgIVBBR0VfTUVUSE9EUy5pbmNsdWRlcyhtZXRob2QpKSB7XG5cdFx0cmV0dXJuIHRydWU7XG5cdH1cblxuXHQvLyB1c2U6ZW5oYW5jZSB1c2VzIGEgY3VzdG9tIGhlYWRlciB0byBkaXNhbWJpZ3VhdGVcblx0aWYgKG1ldGhvZCA9PT0gJ1BPU1QnICYmIGhlYWRlcnMuZ2V0KCd4LXN2ZWx0ZWtpdC1hY3Rpb24nKSA9PT0gJ3RydWUnKSByZXR1cm4gZmFsc2U7XG5cblx0Ly8gR0VUL1BPU1QgcmVxdWVzdHMgbWF5IGJlIGZvciBlbmRwb2ludHMgb3IgcGFnZXMuIFdlIHByZWZlciBlbmRwb2ludHMgaWYgdGhpcyBpc24ndCBhIHRleHQvaHRtbCByZXF1ZXN0XG5cdGNvbnN0IGFjY2VwdCA9IGV2ZW50LnJlcXVlc3QuaGVhZGVycy5nZXQoJ2FjY2VwdCcpID8/ICcqLyonO1xuXHRyZXR1cm4gbmVnb3RpYXRlKGFjY2VwdCwgWycqJywgJ3RleHQvaHRtbCddKSAhPT0gJ3RleHQvaHRtbCc7XG59XG4iLCIvKipcbiAqIFJlbW92ZXMgbnVsbGlzaCB2YWx1ZXMgZnJvbSBhbiBhcnJheS5cbiAqXG4gKiBAdGVtcGxhdGUgVFxuICogQHBhcmFtIHtBcnJheTxUPn0gYXJyXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21wYWN0KGFycikge1xuXHRyZXR1cm4gYXJyLmZpbHRlcigvKiogQHJldHVybnMge3ZhbCBpcyBOb25OdWxsYWJsZTxUPn0gKi8gKHZhbCkgPT4gdmFsICE9IG51bGwpO1xufVxuIiwiaW1wb3J0ICogYXMgZGV2YWx1ZSBmcm9tICdkZXZhbHVlJztcbmltcG9ydCB7IGpzb24gfSBmcm9tICcuLi8uLi8uLi9leHBvcnRzL2luZGV4LmpzJztcbmltcG9ydCB7IGdldF9zdGF0dXMsIG5vcm1hbGl6ZV9lcnJvciB9IGZyb20gJy4uLy4uLy4uL3V0aWxzL2Vycm9yLmpzJztcbmltcG9ydCB7IGlzX2Zvcm1fY29udGVudF90eXBlLCBuZWdvdGlhdGUgfSBmcm9tICcuLi8uLi8uLi91dGlscy9odHRwLmpzJztcbmltcG9ydCB7IEh0dHBFcnJvciwgUmVkaXJlY3QsIEFjdGlvbkZhaWx1cmUsIFN2ZWx0ZUtpdEVycm9yIH0gZnJvbSAnLi4vLi4vY29udHJvbC5qcyc7XG5pbXBvcnQgeyBoYW5kbGVfZXJyb3JfYW5kX2pzb25pZnkgfSBmcm9tICcuLi91dGlscy5qcyc7XG5cbi8qKiBAcGFyYW0ge2ltcG9ydCgnQHN2ZWx0ZWpzL2tpdCcpLlJlcXVlc3RFdmVudH0gZXZlbnQgKi9cbmV4cG9ydCBmdW5jdGlvbiBpc19hY3Rpb25fanNvbl9yZXF1ZXN0KGV2ZW50KSB7XG5cdGNvbnN0IGFjY2VwdCA9IG5lZ290aWF0ZShldmVudC5yZXF1ZXN0LmhlYWRlcnMuZ2V0KCdhY2NlcHQnKSA/PyAnKi8qJywgW1xuXHRcdCdhcHBsaWNhdGlvbi9qc29uJyxcblx0XHQndGV4dC9odG1sJ1xuXHRdKTtcblxuXHRyZXR1cm4gYWNjZXB0ID09PSAnYXBwbGljYXRpb24vanNvbicgJiYgZXZlbnQucmVxdWVzdC5tZXRob2QgPT09ICdQT1NUJztcbn1cblxuLyoqXG4gKiBAcGFyYW0ge2ltcG9ydCgnQHN2ZWx0ZWpzL2tpdCcpLlJlcXVlc3RFdmVudH0gZXZlbnRcbiAqIEBwYXJhbSB7aW1wb3J0KCd0eXBlcycpLlNTUk9wdGlvbnN9IG9wdGlvbnNcbiAqIEBwYXJhbSB7aW1wb3J0KCd0eXBlcycpLlNTUk5vZGVbJ3NlcnZlciddIHwgdW5kZWZpbmVkfSBzZXJ2ZXJcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGhhbmRsZV9hY3Rpb25fanNvbl9yZXF1ZXN0KGV2ZW50LCBvcHRpb25zLCBzZXJ2ZXIpIHtcblx0Y29uc3QgYWN0aW9ucyA9IHNlcnZlcj8uYWN0aW9ucztcblxuXHRpZiAoIWFjdGlvbnMpIHtcblx0XHRjb25zdCBub19hY3Rpb25zX2Vycm9yID0gbmV3IFN2ZWx0ZUtpdEVycm9yKFxuXHRcdFx0NDA1LFxuXHRcdFx0J01ldGhvZCBOb3QgQWxsb3dlZCcsXG5cdFx0XHQnUE9TVCBtZXRob2Qgbm90IGFsbG93ZWQuIE5vIGFjdGlvbnMgZXhpc3QgZm9yIHRoaXMgcGFnZSdcblx0XHQpO1xuXHRcdHJldHVybiBhY3Rpb25fanNvbihcblx0XHRcdHtcblx0XHRcdFx0dHlwZTogJ2Vycm9yJyxcblx0XHRcdFx0ZXJyb3I6IGF3YWl0IGhhbmRsZV9lcnJvcl9hbmRfanNvbmlmeShldmVudCwgb3B0aW9ucywgbm9fYWN0aW9uc19lcnJvcilcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdHN0YXR1czogbm9fYWN0aW9uc19lcnJvci5zdGF0dXMsXG5cdFx0XHRcdGhlYWRlcnM6IHtcblx0XHRcdFx0XHQvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9IVFRQL1N0YXR1cy80MDVcblx0XHRcdFx0XHQvLyBcIlRoZSBzZXJ2ZXIgbXVzdCBnZW5lcmF0ZSBhbiBBbGxvdyBoZWFkZXIgZmllbGQgaW4gYSA0MDUgc3RhdHVzIGNvZGUgcmVzcG9uc2VcIlxuXHRcdFx0XHRcdGFsbG93OiAnR0VUJ1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0KTtcblx0fVxuXG5cdGNoZWNrX25hbWVkX2RlZmF1bHRfc2VwYXJhdGUoYWN0aW9ucyk7XG5cblx0dHJ5IHtcblx0XHRjb25zdCBkYXRhID0gYXdhaXQgY2FsbF9hY3Rpb24oZXZlbnQsIGFjdGlvbnMpO1xuXG5cdFx0aWYgKF9fU1ZFTFRFS0lUX0RFVl9fKSB7XG5cdFx0XHR2YWxpZGF0ZV9hY3Rpb25fcmV0dXJuKGRhdGEpO1xuXHRcdH1cblxuXHRcdGlmIChkYXRhIGluc3RhbmNlb2YgQWN0aW9uRmFpbHVyZSkge1xuXHRcdFx0cmV0dXJuIGFjdGlvbl9qc29uKHtcblx0XHRcdFx0dHlwZTogJ2ZhaWx1cmUnLFxuXHRcdFx0XHRzdGF0dXM6IGRhdGEuc3RhdHVzLFxuXHRcdFx0XHQvLyBAdHMtZXhwZWN0LWVycm9yIHdlIGFzc2lnbiBhIHN0cmluZyB0byB3aGF0IGlzIHN1cHBvc2VkIHRvIGJlIGFuIG9iamVjdC4gVGhhdCdzIG9rXG5cdFx0XHRcdC8vIGJlY2F1c2Ugd2UgZG9uJ3QgdXNlIHRoZSBvYmplY3Qgb3V0c2lkZSwgYW5kIHRoaXMgd2F5IHdlIGhhdmUgYmV0dGVyIGNvZGUgbmF2aWdhdGlvblxuXHRcdFx0XHQvLyB0aHJvdWdoIGtub3dpbmcgd2hlcmUgdGhlIHJlbGF0ZWQgaW50ZXJmYWNlIGlzIHVzZWQuXG5cdFx0XHRcdGRhdGE6IHN0cmluZ2lmeV9hY3Rpb25fcmVzcG9uc2UoZGF0YS5kYXRhLCAvKiogQHR5cGUge3N0cmluZ30gKi8gKGV2ZW50LnJvdXRlLmlkKSlcblx0XHRcdH0pO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4gYWN0aW9uX2pzb24oe1xuXHRcdFx0XHR0eXBlOiAnc3VjY2VzcycsXG5cdFx0XHRcdHN0YXR1czogZGF0YSA/IDIwMCA6IDIwNCxcblx0XHRcdFx0Ly8gQHRzLWV4cGVjdC1lcnJvciBzZWUgY29tbWVudCBhYm92ZVxuXHRcdFx0XHRkYXRhOiBzdHJpbmdpZnlfYWN0aW9uX3Jlc3BvbnNlKGRhdGEsIC8qKiBAdHlwZSB7c3RyaW5nfSAqLyAoZXZlbnQucm91dGUuaWQpKVxuXHRcdFx0fSk7XG5cdFx0fVxuXHR9IGNhdGNoIChlKSB7XG5cdFx0Y29uc3QgZXJyID0gbm9ybWFsaXplX2Vycm9yKGUpO1xuXG5cdFx0aWYgKGVyciBpbnN0YW5jZW9mIFJlZGlyZWN0KSB7XG5cdFx0XHRyZXR1cm4gYWN0aW9uX2pzb25fcmVkaXJlY3QoZXJyKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gYWN0aW9uX2pzb24oXG5cdFx0XHR7XG5cdFx0XHRcdHR5cGU6ICdlcnJvcicsXG5cdFx0XHRcdGVycm9yOiBhd2FpdCBoYW5kbGVfZXJyb3JfYW5kX2pzb25pZnkoZXZlbnQsIG9wdGlvbnMsIGNoZWNrX2luY29ycmVjdF9mYWlsX3VzZShlcnIpKVxuXHRcdFx0fSxcblx0XHRcdHtcblx0XHRcdFx0c3RhdHVzOiBnZXRfc3RhdHVzKGVycilcblx0XHRcdH1cblx0XHQpO1xuXHR9XG59XG5cbi8qKlxuICogQHBhcmFtIHtIdHRwRXJyb3IgfCBFcnJvcn0gZXJyb3JcbiAqL1xuZnVuY3Rpb24gY2hlY2tfaW5jb3JyZWN0X2ZhaWxfdXNlKGVycm9yKSB7XG5cdHJldHVybiBlcnJvciBpbnN0YW5jZW9mIEFjdGlvbkZhaWx1cmVcblx0XHQ/IG5ldyBFcnJvcignQ2Fubm90IFwidGhyb3cgZmFpbCgpXCIuIFVzZSBcInJldHVybiBmYWlsKClcIicpXG5cdFx0OiBlcnJvcjtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge2ltcG9ydCgnQHN2ZWx0ZWpzL2tpdCcpLlJlZGlyZWN0fSByZWRpcmVjdFxuICovXG5leHBvcnQgZnVuY3Rpb24gYWN0aW9uX2pzb25fcmVkaXJlY3QocmVkaXJlY3QpIHtcblx0cmV0dXJuIGFjdGlvbl9qc29uKHtcblx0XHR0eXBlOiAncmVkaXJlY3QnLFxuXHRcdHN0YXR1czogcmVkaXJlY3Quc3RhdHVzLFxuXHRcdGxvY2F0aW9uOiByZWRpcmVjdC5sb2NhdGlvblxuXHR9KTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge2ltcG9ydCgnQHN2ZWx0ZWpzL2tpdCcpLkFjdGlvblJlc3VsdH0gZGF0YVxuICogQHBhcmFtIHtSZXNwb25zZUluaXR9IFtpbml0XVxuICovXG5mdW5jdGlvbiBhY3Rpb25fanNvbihkYXRhLCBpbml0KSB7XG5cdHJldHVybiBqc29uKGRhdGEsIGluaXQpO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7aW1wb3J0KCdAc3ZlbHRlanMva2l0JykuUmVxdWVzdEV2ZW50fSBldmVudFxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNfYWN0aW9uX3JlcXVlc3QoZXZlbnQpIHtcblx0cmV0dXJuIGV2ZW50LnJlcXVlc3QubWV0aG9kID09PSAnUE9TVCc7XG59XG5cbi8qKlxuICogQHBhcmFtIHtpbXBvcnQoJ0BzdmVsdGVqcy9raXQnKS5SZXF1ZXN0RXZlbnR9IGV2ZW50XG4gKiBAcGFyYW0ge2ltcG9ydCgndHlwZXMnKS5TU1JOb2RlWydzZXJ2ZXInXSB8IHVuZGVmaW5lZH0gc2VydmVyXG4gKiBAcmV0dXJucyB7UHJvbWlzZTxpbXBvcnQoJ0BzdmVsdGVqcy9raXQnKS5BY3Rpb25SZXN1bHQ+fVxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaGFuZGxlX2FjdGlvbl9yZXF1ZXN0KGV2ZW50LCBzZXJ2ZXIpIHtcblx0Y29uc3QgYWN0aW9ucyA9IHNlcnZlcj8uYWN0aW9ucztcblxuXHRpZiAoIWFjdGlvbnMpIHtcblx0XHQvLyBUT0RPIHNob3VsZCB0aGlzIGJlIGEgZGlmZmVyZW50IGVycm9yIGFsdG9nZXRoZXI/XG5cdFx0ZXZlbnQuc2V0SGVhZGVycyh7XG5cdFx0XHQvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9IVFRQL1N0YXR1cy80MDVcblx0XHRcdC8vIFwiVGhlIHNlcnZlciBtdXN0IGdlbmVyYXRlIGFuIEFsbG93IGhlYWRlciBmaWVsZCBpbiBhIDQwNSBzdGF0dXMgY29kZSByZXNwb25zZVwiXG5cdFx0XHRhbGxvdzogJ0dFVCdcblx0XHR9KTtcblx0XHRyZXR1cm4ge1xuXHRcdFx0dHlwZTogJ2Vycm9yJyxcblx0XHRcdGVycm9yOiBuZXcgU3ZlbHRlS2l0RXJyb3IoXG5cdFx0XHRcdDQwNSxcblx0XHRcdFx0J01ldGhvZCBOb3QgQWxsb3dlZCcsXG5cdFx0XHRcdCdQT1NUIG1ldGhvZCBub3QgYWxsb3dlZC4gTm8gYWN0aW9ucyBleGlzdCBmb3IgdGhpcyBwYWdlJ1xuXHRcdFx0KVxuXHRcdH07XG5cdH1cblxuXHRjaGVja19uYW1lZF9kZWZhdWx0X3NlcGFyYXRlKGFjdGlvbnMpO1xuXG5cdHRyeSB7XG5cdFx0Y29uc3QgZGF0YSA9IGF3YWl0IGNhbGxfYWN0aW9uKGV2ZW50LCBhY3Rpb25zKTtcblxuXHRcdGlmIChfX1NWRUxURUtJVF9ERVZfXykge1xuXHRcdFx0dmFsaWRhdGVfYWN0aW9uX3JldHVybihkYXRhKTtcblx0XHR9XG5cblx0XHRpZiAoZGF0YSBpbnN0YW5jZW9mIEFjdGlvbkZhaWx1cmUpIHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHR5cGU6ICdmYWlsdXJlJyxcblx0XHRcdFx0c3RhdHVzOiBkYXRhLnN0YXR1cyxcblx0XHRcdFx0ZGF0YTogZGF0YS5kYXRhXG5cdFx0XHR9O1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHR0eXBlOiAnc3VjY2VzcycsXG5cdFx0XHRcdHN0YXR1czogMjAwLFxuXHRcdFx0XHQvLyBAdHMtZXhwZWN0LWVycm9yIHRoaXMgd2lsbCBiZSByZW1vdmVkIHVwb24gc2VyaWFsaXphdGlvbiwgc28gYHVuZGVmaW5lZGAgaXMgdGhlIHNhbWUgYXMgb21pc3Npb25cblx0XHRcdFx0ZGF0YVxuXHRcdFx0fTtcblx0XHR9XG5cdH0gY2F0Y2ggKGUpIHtcblx0XHRjb25zdCBlcnIgPSBub3JtYWxpemVfZXJyb3IoZSk7XG5cblx0XHRpZiAoZXJyIGluc3RhbmNlb2YgUmVkaXJlY3QpIHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHR5cGU6ICdyZWRpcmVjdCcsXG5cdFx0XHRcdHN0YXR1czogZXJyLnN0YXR1cyxcblx0XHRcdFx0bG9jYXRpb246IGVyci5sb2NhdGlvblxuXHRcdFx0fTtcblx0XHR9XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0dHlwZTogJ2Vycm9yJyxcblx0XHRcdGVycm9yOiBjaGVja19pbmNvcnJlY3RfZmFpbF91c2UoZXJyKVxuXHRcdH07XG5cdH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge2ltcG9ydCgnQHN2ZWx0ZWpzL2tpdCcpLkFjdGlvbnN9IGFjdGlvbnNcbiAqL1xuZnVuY3Rpb24gY2hlY2tfbmFtZWRfZGVmYXVsdF9zZXBhcmF0ZShhY3Rpb25zKSB7XG5cdGlmIChhY3Rpb25zLmRlZmF1bHQgJiYgT2JqZWN0LmtleXMoYWN0aW9ucykubGVuZ3RoID4gMSkge1xuXHRcdHRocm93IG5ldyBFcnJvcihcblx0XHRcdCdXaGVuIHVzaW5nIG5hbWVkIGFjdGlvbnMsIHRoZSBkZWZhdWx0IGFjdGlvbiBjYW5ub3QgYmUgdXNlZC4gU2VlIHRoZSBkb2NzIGZvciBtb3JlIGluZm86IGh0dHBzOi8va2l0LnN2ZWx0ZS5kZXYvZG9jcy9mb3JtLWFjdGlvbnMjbmFtZWQtYWN0aW9ucydcblx0XHQpO1xuXHR9XG59XG5cbi8qKlxuICogQHBhcmFtIHtpbXBvcnQoJ0BzdmVsdGVqcy9raXQnKS5SZXF1ZXN0RXZlbnR9IGV2ZW50XG4gKiBAcGFyYW0ge05vbk51bGxhYmxlPGltcG9ydCgndHlwZXMnKS5TU1JOb2RlWydzZXJ2ZXInXVsnYWN0aW9ucyddPn0gYWN0aW9uc1xuICogQHRocm93cyB7UmVkaXJlY3QgfCBIdHRwRXJyb3IgfCBTdmVsdGVLaXRFcnJvciB8IEVycm9yfVxuICovXG5hc3luYyBmdW5jdGlvbiBjYWxsX2FjdGlvbihldmVudCwgYWN0aW9ucykge1xuXHRjb25zdCB1cmwgPSBuZXcgVVJMKGV2ZW50LnJlcXVlc3QudXJsKTtcblxuXHRsZXQgbmFtZSA9ICdkZWZhdWx0Jztcblx0Zm9yIChjb25zdCBwYXJhbSBvZiB1cmwuc2VhcmNoUGFyYW1zKSB7XG5cdFx0aWYgKHBhcmFtWzBdLnN0YXJ0c1dpdGgoJy8nKSkge1xuXHRcdFx0bmFtZSA9IHBhcmFtWzBdLnNsaWNlKDEpO1xuXHRcdFx0aWYgKG5hbWUgPT09ICdkZWZhdWx0Jykge1xuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCB1c2UgcmVzZXJ2ZWQgYWN0aW9uIG5hbWUgXCJkZWZhdWx0XCInKTtcblx0XHRcdH1cblx0XHRcdGJyZWFrO1xuXHRcdH1cblx0fVxuXG5cdGNvbnN0IGFjdGlvbiA9IGFjdGlvbnNbbmFtZV07XG5cdGlmICghYWN0aW9uKSB7XG5cdFx0dGhyb3cgbmV3IFN2ZWx0ZUtpdEVycm9yKDQwNCwgJ05vdCBGb3VuZCcsIGBObyBhY3Rpb24gd2l0aCBuYW1lICcke25hbWV9JyBmb3VuZGApO1xuXHR9XG5cblx0aWYgKCFpc19mb3JtX2NvbnRlbnRfdHlwZShldmVudC5yZXF1ZXN0KSkge1xuXHRcdHRocm93IG5ldyBTdmVsdGVLaXRFcnJvcihcblx0XHRcdDQxNSxcblx0XHRcdCdVbnN1cHBvcnRlZCBNZWRpYSBUeXBlJyxcblx0XHRcdGBGb3JtIGFjdGlvbnMgZXhwZWN0IGZvcm0tZW5jb2RlZCBkYXRhIOKAlCByZWNlaXZlZCAke2V2ZW50LnJlcXVlc3QuaGVhZGVycy5nZXQoXG5cdFx0XHRcdCdjb250ZW50LXR5cGUnXG5cdFx0XHQpfWBcblx0XHQpO1xuXHR9XG5cblx0cmV0dXJuIGFjdGlvbihldmVudCk7XG59XG5cbi8qKiBAcGFyYW0ge2FueX0gZGF0YSAqL1xuZnVuY3Rpb24gdmFsaWRhdGVfYWN0aW9uX3JldHVybihkYXRhKSB7XG5cdGlmIChkYXRhIGluc3RhbmNlb2YgUmVkaXJlY3QpIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBgcmV0dXJuIHJlZGlyZWN0KC4uLilgIOKAlCB1c2UgYHJlZGlyZWN0KC4uLilgIGluc3RlYWQnKTtcblx0fVxuXG5cdGlmIChkYXRhIGluc3RhbmNlb2YgSHR0cEVycm9yKSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgYHJldHVybiBlcnJvciguLi4pYCDigJQgdXNlIGBlcnJvciguLi4pYCBvciBgcmV0dXJuIGZhaWwoLi4uKWAgaW5zdGVhZCcpO1xuXHR9XG59XG5cbi8qKlxuICogVHJ5IHRvIGBkZXZhbHVlLnVuZXZhbGAgdGhlIGRhdGEgb2JqZWN0LCBhbmQgaWYgaXQgZmFpbHMsIHJldHVybiBhIHByb3BlciBFcnJvciB3aXRoIGNvbnRleHRcbiAqIEBwYXJhbSB7YW55fSBkYXRhXG4gKiBAcGFyYW0ge3N0cmluZ30gcm91dGVfaWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVuZXZhbF9hY3Rpb25fcmVzcG9uc2UoZGF0YSwgcm91dGVfaWQpIHtcblx0cmV0dXJuIHRyeV9kZXNlcmlhbGl6ZShkYXRhLCBkZXZhbHVlLnVuZXZhbCwgcm91dGVfaWQpO1xufVxuXG4vKipcbiAqIFRyeSB0byBgZGV2YWx1ZS5zdHJpbmdpZnlgIHRoZSBkYXRhIG9iamVjdCwgYW5kIGlmIGl0IGZhaWxzLCByZXR1cm4gYSBwcm9wZXIgRXJyb3Igd2l0aCBjb250ZXh0XG4gKiBAcGFyYW0ge2FueX0gZGF0YVxuICogQHBhcmFtIHtzdHJpbmd9IHJvdXRlX2lkXG4gKi9cbmZ1bmN0aW9uIHN0cmluZ2lmeV9hY3Rpb25fcmVzcG9uc2UoZGF0YSwgcm91dGVfaWQpIHtcblx0cmV0dXJuIHRyeV9kZXNlcmlhbGl6ZShkYXRhLCBkZXZhbHVlLnN0cmluZ2lmeSwgcm91dGVfaWQpO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7YW55fSBkYXRhXG4gKiBAcGFyYW0geyhkYXRhOiBhbnkpID0+IHN0cmluZ30gZm5cbiAqIEBwYXJhbSB7c3RyaW5nfSByb3V0ZV9pZFxuICovXG5mdW5jdGlvbiB0cnlfZGVzZXJpYWxpemUoZGF0YSwgZm4sIHJvdXRlX2lkKSB7XG5cdHRyeSB7XG5cdFx0cmV0dXJuIGZuKGRhdGEpO1xuXHR9IGNhdGNoIChlKSB7XG5cdFx0Ly8gSWYgd2UncmUgaGVyZSwgdGhlIGRhdGEgY291bGQgbm90IGJlIHNlcmlhbGl6ZWQgd2l0aCBkZXZhbHVlXG5cdFx0Y29uc3QgZXJyb3IgPSAvKiogQHR5cGUge2FueX0gKi8gKGUpO1xuXG5cdFx0aWYgKCdwYXRoJyBpbiBlcnJvcikge1xuXHRcdFx0bGV0IG1lc3NhZ2UgPSBgRGF0YSByZXR1cm5lZCBmcm9tIGFjdGlvbiBpbnNpZGUgJHtyb3V0ZV9pZH0gaXMgbm90IHNlcmlhbGl6YWJsZTogJHtlcnJvci5tZXNzYWdlfWA7XG5cdFx0XHRpZiAoZXJyb3IucGF0aCAhPT0gJycpIG1lc3NhZ2UgKz0gYCAoZGF0YS4ke2Vycm9yLnBhdGh9KWA7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IobWVzc2FnZSk7XG5cdFx0fVxuXG5cdFx0dGhyb3cgZXJyb3I7XG5cdH1cbn1cbiIsIi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IHJvdXRlX2lkXG4gKiBAcGFyYW0ge3N0cmluZ30gZGVwXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB2YWxpZGF0ZV9kZXBlbmRzKHJvdXRlX2lkLCBkZXApIHtcblx0Y29uc3QgbWF0Y2ggPSAvXihtb3otaWNvbnx2aWV3LXNvdXJjZXxqYXIpOi8uZXhlYyhkZXApO1xuXHRpZiAobWF0Y2gpIHtcblx0XHRjb25zb2xlLndhcm4oXG5cdFx0XHRgJHtyb3V0ZV9pZH06IENhbGxpbmcgXFxgZGVwZW5kcygnJHtkZXB9JylcXGAgd2lsbCB0aHJvdyBhbiBlcnJvciBpbiBGaXJlZm94IGJlY2F1c2UgXFxgJHttYXRjaFsxXX1cXGAgaXMgYSBzcGVjaWFsIFVSSSBzY2hlbWVgXG5cdFx0KTtcblx0fVxufVxuXG5leHBvcnQgY29uc3QgSU5WQUxJREFURURfUEFSQU0gPSAneC1zdmVsdGVraXQtaW52YWxpZGF0ZWQnO1xuXG5leHBvcnQgY29uc3QgVFJBSUxJTkdfU0xBU0hfUEFSQU0gPSAneC1zdmVsdGVraXQtdHJhaWxpbmctc2xhc2gnO1xuIiwiLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gdGV4dFxuICogQHJldHVybnMge0FycmF5QnVmZmVyTGlrZX1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGI2NF9kZWNvZGUodGV4dCkge1xuXHRjb25zdCBkID0gYXRvYih0ZXh0KTtcblxuXHRjb25zdCB1OCA9IG5ldyBVaW50OEFycmF5KGQubGVuZ3RoKTtcblxuXHRmb3IgKGxldCBpID0gMDsgaSA8IGQubGVuZ3RoOyBpKyspIHtcblx0XHR1OFtpXSA9IGQuY2hhckNvZGVBdChpKTtcblx0fVxuXG5cdHJldHVybiB1OC5idWZmZXI7XG59XG5cbi8qKlxuICogQHBhcmFtIHtBcnJheUJ1ZmZlcn0gYnVmZmVyXG4gKiBAcmV0dXJucyB7c3RyaW5nfVxuICovXG5leHBvcnQgZnVuY3Rpb24gYjY0X2VuY29kZShidWZmZXIpIHtcblx0aWYgKGdsb2JhbFRoaXMuQnVmZmVyKSB7XG5cdFx0cmV0dXJuIEJ1ZmZlci5mcm9tKGJ1ZmZlcikudG9TdHJpbmcoJ2Jhc2U2NCcpO1xuXHR9XG5cblx0Y29uc3QgbGl0dGxlX2VuZGlhbiA9IG5ldyBVaW50OEFycmF5KG5ldyBVaW50MTZBcnJheShbMV0pLmJ1ZmZlcilbMF0gPiAwO1xuXG5cdC8vIFRoZSBVaW50MTZBcnJheShVaW50OEFycmF5KC4uLikpIGVuc3VyZXMgdGhlIGNvZGUgcG9pbnRzIGFyZSBwYWRkZWQgd2l0aCAwJ3Ncblx0cmV0dXJuIGJ0b2EoXG5cdFx0bmV3IFRleHREZWNvZGVyKGxpdHRsZV9lbmRpYW4gPyAndXRmLTE2bGUnIDogJ3V0Zi0xNmJlJykuZGVjb2RlKFxuXHRcdFx0bmV3IFVpbnQxNkFycmF5KG5ldyBVaW50OEFycmF5KGJ1ZmZlcikpXG5cdFx0KVxuXHQpO1xufVxuIiwiaW1wb3J0IHsgREVWIH0gZnJvbSAnZXNtLWVudic7XG5pbXBvcnQgeyBkaXNhYmxlX3NlYXJjaCwgbWFrZV90cmFja2FibGUgfSBmcm9tICcuLi8uLi8uLi91dGlscy91cmwuanMnO1xuaW1wb3J0IHsgdmFsaWRhdGVfZGVwZW5kcyB9IGZyb20gJy4uLy4uL3NoYXJlZC5qcyc7XG5pbXBvcnQgeyBiNjRfZW5jb2RlIH0gZnJvbSAnLi4vLi4vdXRpbHMuanMnO1xuXG4vKipcbiAqIENhbGxzIHRoZSB1c2VyJ3Mgc2VydmVyIGBsb2FkYCBmdW5jdGlvbi5cbiAqIEBwYXJhbSB7e1xuICogICBldmVudDogaW1wb3J0KCdAc3ZlbHRlanMva2l0JykuUmVxdWVzdEV2ZW50O1xuICogICBzdGF0ZTogaW1wb3J0KCd0eXBlcycpLlNTUlN0YXRlO1xuICogICBub2RlOiBpbXBvcnQoJ3R5cGVzJykuU1NSTm9kZSB8IHVuZGVmaW5lZDtcbiAqICAgcGFyZW50OiAoKSA9PiBQcm9taXNlPFJlY29yZDxzdHJpbmcsIGFueT4+O1xuICogfX0gb3B0c1xuICogQHJldHVybnMge1Byb21pc2U8aW1wb3J0KCd0eXBlcycpLlNlcnZlckRhdGFOb2RlIHwgbnVsbD59XG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBsb2FkX3NlcnZlcl9kYXRhKHsgZXZlbnQsIHN0YXRlLCBub2RlLCBwYXJlbnQgfSkge1xuXHRpZiAoIW5vZGU/LnNlcnZlcikgcmV0dXJuIG51bGw7XG5cblx0bGV0IGRvbmUgPSBmYWxzZTtcblx0bGV0IGlzX3RyYWNraW5nID0gdHJ1ZTtcblxuXHRjb25zdCB1c2VzID0ge1xuXHRcdGRlcGVuZGVuY2llczogbmV3IFNldCgpLFxuXHRcdHBhcmFtczogbmV3IFNldCgpLFxuXHRcdHBhcmVudDogZmFsc2UsXG5cdFx0cm91dGU6IGZhbHNlLFxuXHRcdHVybDogZmFsc2UsXG5cdFx0c2VhcmNoX3BhcmFtczogbmV3IFNldCgpXG5cdH07XG5cblx0Y29uc3QgdXJsID0gbWFrZV90cmFja2FibGUoXG5cdFx0ZXZlbnQudXJsLFxuXHRcdCgpID0+IHtcblx0XHRcdGlmIChERVYgJiYgZG9uZSAmJiAhdXNlcy51cmwpIHtcblx0XHRcdFx0Y29uc29sZS53YXJuKFxuXHRcdFx0XHRcdGAke25vZGUuc2VydmVyX2lkfTogQWNjZXNzaW5nIFVSTCBwcm9wZXJ0aWVzIGluIGEgcHJvbWlzZSBoYW5kbGVyIGFmdGVyIFxcYGxvYWQoLi4uKVxcYCBoYXMgcmV0dXJuZWQgd2lsbCBub3QgY2F1c2UgdGhlIGZ1bmN0aW9uIHRvIHJlLXJ1biB3aGVuIHRoZSBVUkwgY2hhbmdlc2Bcblx0XHRcdFx0KTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGlzX3RyYWNraW5nKSB7XG5cdFx0XHRcdHVzZXMudXJsID0gdHJ1ZTtcblx0XHRcdH1cblx0XHR9LFxuXHRcdChwYXJhbSkgPT4ge1xuXHRcdFx0aWYgKERFViAmJiBkb25lICYmICF1c2VzLnNlYXJjaF9wYXJhbXMuaGFzKHBhcmFtKSkge1xuXHRcdFx0XHRjb25zb2xlLndhcm4oXG5cdFx0XHRcdFx0YCR7bm9kZS5zZXJ2ZXJfaWR9OiBBY2Nlc3NpbmcgVVJMIHByb3BlcnRpZXMgaW4gYSBwcm9taXNlIGhhbmRsZXIgYWZ0ZXIgXFxgbG9hZCguLi4pXFxgIGhhcyByZXR1cm5lZCB3aWxsIG5vdCBjYXVzZSB0aGUgZnVuY3Rpb24gdG8gcmUtcnVuIHdoZW4gdGhlIFVSTCBjaGFuZ2VzYFxuXHRcdFx0XHQpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoaXNfdHJhY2tpbmcpIHtcblx0XHRcdFx0dXNlcy5zZWFyY2hfcGFyYW1zLmFkZChwYXJhbSk7XG5cdFx0XHR9XG5cdFx0fVxuXHQpO1xuXG5cdGlmIChzdGF0ZS5wcmVyZW5kZXJpbmcpIHtcblx0XHRkaXNhYmxlX3NlYXJjaCh1cmwpO1xuXHR9XG5cblx0Y29uc3QgcmVzdWx0ID0gYXdhaXQgbm9kZS5zZXJ2ZXIubG9hZD8uY2FsbChudWxsLCB7XG5cdFx0Li4uZXZlbnQsXG5cdFx0ZmV0Y2g6IChpbmZvLCBpbml0KSA9PiB7XG5cdFx0XHRjb25zdCB1cmwgPSBuZXcgVVJMKGluZm8gaW5zdGFuY2VvZiBSZXF1ZXN0ID8gaW5mby51cmwgOiBpbmZvLCBldmVudC51cmwpO1xuXG5cdFx0XHRpZiAoREVWICYmIGRvbmUgJiYgIXVzZXMuZGVwZW5kZW5jaWVzLmhhcyh1cmwuaHJlZikpIHtcblx0XHRcdFx0Y29uc29sZS53YXJuKFxuXHRcdFx0XHRcdGAke25vZGUuc2VydmVyX2lkfTogQ2FsbGluZyBcXGBldmVudC5mZXRjaCguLi4pXFxgIGluIGEgcHJvbWlzZSBoYW5kbGVyIGFmdGVyIFxcYGxvYWQoLi4uKVxcYCBoYXMgcmV0dXJuZWQgd2lsbCBub3QgY2F1c2UgdGhlIGZ1bmN0aW9uIHRvIHJlLXJ1biB3aGVuIHRoZSBkZXBlbmRlbmN5IGlzIGludmFsaWRhdGVkYFxuXHRcdFx0XHQpO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBOb3RlOiBzZXJ2ZXIgZmV0Y2hlcyBhcmUgbm90IGFkZGVkIHRvIHVzZXMuZGVwZW5kcyBkdWUgdG8gc2VjdXJpdHkgY29uY2VybnNcblx0XHRcdHJldHVybiBldmVudC5mZXRjaChpbmZvLCBpbml0KTtcblx0XHR9LFxuXHRcdC8qKiBAcGFyYW0ge3N0cmluZ1tdfSBkZXBzICovXG5cdFx0ZGVwZW5kczogKC4uLmRlcHMpID0+IHtcblx0XHRcdGZvciAoY29uc3QgZGVwIG9mIGRlcHMpIHtcblx0XHRcdFx0Y29uc3QgeyBocmVmIH0gPSBuZXcgVVJMKGRlcCwgZXZlbnQudXJsKTtcblxuXHRcdFx0XHRpZiAoREVWKSB7XG5cdFx0XHRcdFx0dmFsaWRhdGVfZGVwZW5kcyhub2RlLnNlcnZlcl9pZCwgZGVwKTtcblxuXHRcdFx0XHRcdGlmIChkb25lICYmICF1c2VzLmRlcGVuZGVuY2llcy5oYXMoaHJlZikpIHtcblx0XHRcdFx0XHRcdGNvbnNvbGUud2Fybihcblx0XHRcdFx0XHRcdFx0YCR7bm9kZS5zZXJ2ZXJfaWR9OiBDYWxsaW5nIFxcYGRlcGVuZHMoLi4uKVxcYCBpbiBhIHByb21pc2UgaGFuZGxlciBhZnRlciBcXGBsb2FkKC4uLilcXGAgaGFzIHJldHVybmVkIHdpbGwgbm90IGNhdXNlIHRoZSBmdW5jdGlvbiB0byByZS1ydW4gd2hlbiB0aGUgZGVwZW5kZW5jeSBpcyBpbnZhbGlkYXRlZGBcblx0XHRcdFx0XHRcdCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0dXNlcy5kZXBlbmRlbmNpZXMuYWRkKGhyZWYpO1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0cGFyYW1zOiBuZXcgUHJveHkoZXZlbnQucGFyYW1zLCB7XG5cdFx0XHRnZXQ6ICh0YXJnZXQsIGtleSkgPT4ge1xuXHRcdFx0XHRpZiAoREVWICYmIGRvbmUgJiYgdHlwZW9mIGtleSA9PT0gJ3N0cmluZycgJiYgIXVzZXMucGFyYW1zLmhhcyhrZXkpKSB7XG5cdFx0XHRcdFx0Y29uc29sZS53YXJuKFxuXHRcdFx0XHRcdFx0YCR7bm9kZS5zZXJ2ZXJfaWR9OiBBY2Nlc3NpbmcgXFxgcGFyYW1zLiR7U3RyaW5nKFxuXHRcdFx0XHRcdFx0XHRrZXlcblx0XHRcdFx0XHRcdCl9XFxgIGluIGEgcHJvbWlzZSBoYW5kbGVyIGFmdGVyIFxcYGxvYWQoLi4uKVxcYCBoYXMgcmV0dXJuZWQgd2lsbCBub3QgY2F1c2UgdGhlIGZ1bmN0aW9uIHRvIHJlLXJ1biB3aGVuIHRoZSBwYXJhbSBjaGFuZ2VzYFxuXHRcdFx0XHRcdCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoaXNfdHJhY2tpbmcpIHtcblx0XHRcdFx0XHR1c2VzLnBhcmFtcy5hZGQoa2V5KTtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gdGFyZ2V0Wy8qKiBAdHlwZSB7c3RyaW5nfSAqLyAoa2V5KV07XG5cdFx0XHR9XG5cdFx0fSksXG5cdFx0cGFyZW50OiBhc3luYyAoKSA9PiB7XG5cdFx0XHRpZiAoREVWICYmIGRvbmUgJiYgIXVzZXMucGFyZW50KSB7XG5cdFx0XHRcdGNvbnNvbGUud2Fybihcblx0XHRcdFx0XHRgJHtub2RlLnNlcnZlcl9pZH06IENhbGxpbmcgXFxgcGFyZW50KC4uLilcXGAgaW4gYSBwcm9taXNlIGhhbmRsZXIgYWZ0ZXIgXFxgbG9hZCguLi4pXFxgIGhhcyByZXR1cm5lZCB3aWxsIG5vdCBjYXVzZSB0aGUgZnVuY3Rpb24gdG8gcmUtcnVuIHdoZW4gcGFyZW50IGRhdGEgY2hhbmdlc2Bcblx0XHRcdFx0KTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGlzX3RyYWNraW5nKSB7XG5cdFx0XHRcdHVzZXMucGFyZW50ID0gdHJ1ZTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBwYXJlbnQoKTtcblx0XHR9LFxuXHRcdHJvdXRlOiBuZXcgUHJveHkoZXZlbnQucm91dGUsIHtcblx0XHRcdGdldDogKHRhcmdldCwga2V5KSA9PiB7XG5cdFx0XHRcdGlmIChERVYgJiYgZG9uZSAmJiB0eXBlb2Yga2V5ID09PSAnc3RyaW5nJyAmJiAhdXNlcy5yb3V0ZSkge1xuXHRcdFx0XHRcdGNvbnNvbGUud2Fybihcblx0XHRcdFx0XHRcdGAke25vZGUuc2VydmVyX2lkfTogQWNjZXNzaW5nIFxcYHJvdXRlLiR7U3RyaW5nKFxuXHRcdFx0XHRcdFx0XHRrZXlcblx0XHRcdFx0XHRcdCl9XFxgIGluIGEgcHJvbWlzZSBoYW5kbGVyIGFmdGVyIFxcYGxvYWQoLi4uKVxcYCBoYXMgcmV0dXJuZWQgd2lsbCBub3QgY2F1c2UgdGhlIGZ1bmN0aW9uIHRvIHJlLXJ1biB3aGVuIHRoZSByb3V0ZSBjaGFuZ2VzYFxuXHRcdFx0XHRcdCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoaXNfdHJhY2tpbmcpIHtcblx0XHRcdFx0XHR1c2VzLnJvdXRlID0gdHJ1ZTtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gdGFyZ2V0Wy8qKiBAdHlwZSB7J2lkJ30gKi8gKGtleSldO1xuXHRcdFx0fVxuXHRcdH0pLFxuXHRcdHVybCxcblx0XHR1bnRyYWNrKGZuKSB7XG5cdFx0XHRpc190cmFja2luZyA9IGZhbHNlO1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0cmV0dXJuIGZuKCk7XG5cdFx0XHR9IGZpbmFsbHkge1xuXHRcdFx0XHRpc190cmFja2luZyA9IHRydWU7XG5cdFx0XHR9XG5cdFx0fVxuXHR9KTtcblxuXHRpZiAoX19TVkVMVEVLSVRfREVWX18pIHtcblx0XHR2YWxpZGF0ZV9sb2FkX3Jlc3BvbnNlKHJlc3VsdCwgbm9kZS5zZXJ2ZXJfaWQpO1xuXHR9XG5cblx0ZG9uZSA9IHRydWU7XG5cblx0cmV0dXJuIHtcblx0XHR0eXBlOiAnZGF0YScsXG5cdFx0ZGF0YTogcmVzdWx0ID8/IG51bGwsXG5cdFx0dXNlcyxcblx0XHRzbGFzaDogbm9kZS5zZXJ2ZXIudHJhaWxpbmdTbGFzaFxuXHR9O1xufVxuXG4vKipcbiAqIENhbGxzIHRoZSB1c2VyJ3MgYGxvYWRgIGZ1bmN0aW9uLlxuICogQHBhcmFtIHt7XG4gKiAgIGV2ZW50OiBpbXBvcnQoJ0BzdmVsdGVqcy9raXQnKS5SZXF1ZXN0RXZlbnQ7XG4gKiAgIGZldGNoZWQ6IGltcG9ydCgnLi90eXBlcy5qcycpLkZldGNoZWRbXTtcbiAqICAgbm9kZTogaW1wb3J0KCd0eXBlcycpLlNTUk5vZGUgfCB1bmRlZmluZWQ7XG4gKiAgIHBhcmVudDogKCkgPT4gUHJvbWlzZTxSZWNvcmQ8c3RyaW5nLCBhbnk+PjtcbiAqICAgcmVzb2x2ZV9vcHRzOiBpbXBvcnQoJ3R5cGVzJykuUmVxdWlyZWRSZXNvbHZlT3B0aW9ucztcbiAqICAgc2VydmVyX2RhdGFfcHJvbWlzZTogUHJvbWlzZTxpbXBvcnQoJ3R5cGVzJykuU2VydmVyRGF0YU5vZGUgfCBudWxsPjtcbiAqICAgc3RhdGU6IGltcG9ydCgndHlwZXMnKS5TU1JTdGF0ZTtcbiAqICAgY3NyOiBib29sZWFuO1xuICogfX0gb3B0c1xuICogQHJldHVybnMge1Byb21pc2U8UmVjb3JkPHN0cmluZywgYW55IHwgUHJvbWlzZTxhbnk+PiB8IG51bGw+fVxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbG9hZF9kYXRhKHtcblx0ZXZlbnQsXG5cdGZldGNoZWQsXG5cdG5vZGUsXG5cdHBhcmVudCxcblx0c2VydmVyX2RhdGFfcHJvbWlzZSxcblx0c3RhdGUsXG5cdHJlc29sdmVfb3B0cyxcblx0Y3NyXG59KSB7XG5cdGNvbnN0IHNlcnZlcl9kYXRhX25vZGUgPSBhd2FpdCBzZXJ2ZXJfZGF0YV9wcm9taXNlO1xuXG5cdGlmICghbm9kZT8udW5pdmVyc2FsPy5sb2FkKSB7XG5cdFx0cmV0dXJuIHNlcnZlcl9kYXRhX25vZGU/LmRhdGEgPz8gbnVsbDtcblx0fVxuXG5cdGNvbnN0IHJlc3VsdCA9IGF3YWl0IG5vZGUudW5pdmVyc2FsLmxvYWQuY2FsbChudWxsLCB7XG5cdFx0dXJsOiBldmVudC51cmwsXG5cdFx0cGFyYW1zOiBldmVudC5wYXJhbXMsXG5cdFx0ZGF0YTogc2VydmVyX2RhdGFfbm9kZT8uZGF0YSA/PyBudWxsLFxuXHRcdHJvdXRlOiBldmVudC5yb3V0ZSxcblx0XHRmZXRjaDogY3JlYXRlX3VuaXZlcnNhbF9mZXRjaChldmVudCwgc3RhdGUsIGZldGNoZWQsIGNzciwgcmVzb2x2ZV9vcHRzKSxcblx0XHRzZXRIZWFkZXJzOiBldmVudC5zZXRIZWFkZXJzLFxuXHRcdGRlcGVuZHM6ICgpID0+IHt9LFxuXHRcdHBhcmVudCxcblx0XHR1bnRyYWNrOiAoZm4pID0+IGZuKClcblx0fSk7XG5cblx0aWYgKF9fU1ZFTFRFS0lUX0RFVl9fKSB7XG5cdFx0dmFsaWRhdGVfbG9hZF9yZXNwb25zZShyZXN1bHQsIG5vZGUudW5pdmVyc2FsX2lkKTtcblx0fVxuXG5cdHJldHVybiByZXN1bHQgPz8gbnVsbDtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1BpY2s8aW1wb3J0KCdAc3ZlbHRlanMva2l0JykuUmVxdWVzdEV2ZW50LCAnZmV0Y2gnIHwgJ3VybCcgfCAncmVxdWVzdCcgfCAncm91dGUnPn0gZXZlbnRcbiAqIEBwYXJhbSB7aW1wb3J0KCd0eXBlcycpLlNTUlN0YXRlfSBzdGF0ZVxuICogQHBhcmFtIHtpbXBvcnQoJy4vdHlwZXMuanMnKS5GZXRjaGVkW119IGZldGNoZWRcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gY3NyXG4gKiBAcGFyYW0ge1BpY2s8UmVxdWlyZWQ8aW1wb3J0KCdAc3ZlbHRlanMva2l0JykuUmVzb2x2ZU9wdGlvbnM+LCAnZmlsdGVyU2VyaWFsaXplZFJlc3BvbnNlSGVhZGVycyc+fSByZXNvbHZlX29wdHNcbiAqIEByZXR1cm5zIHt0eXBlb2YgZmV0Y2h9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVfdW5pdmVyc2FsX2ZldGNoKGV2ZW50LCBzdGF0ZSwgZmV0Y2hlZCwgY3NyLCByZXNvbHZlX29wdHMpIHtcblx0LyoqXG5cdCAqIEBwYXJhbSB7VVJMIHwgUmVxdWVzdEluZm99IGlucHV0XG5cdCAqIEBwYXJhbSB7UmVxdWVzdEluaXR9IFtpbml0XVxuXHQgKi9cblx0Y29uc3QgdW5pdmVyc2FsX2ZldGNoID0gYXN5bmMgKGlucHV0LCBpbml0KSA9PiB7XG5cdFx0Y29uc3QgY2xvbmVkX2JvZHkgPSBpbnB1dCBpbnN0YW5jZW9mIFJlcXVlc3QgJiYgaW5wdXQuYm9keSA/IGlucHV0LmNsb25lKCkuYm9keSA6IG51bGw7XG5cblx0XHRjb25zdCBjbG9uZWRfaGVhZGVycyA9XG5cdFx0XHRpbnB1dCBpbnN0YW5jZW9mIFJlcXVlc3QgJiYgWy4uLmlucHV0LmhlYWRlcnNdLmxlbmd0aFxuXHRcdFx0XHQ/IG5ldyBIZWFkZXJzKGlucHV0LmhlYWRlcnMpXG5cdFx0XHRcdDogaW5pdD8uaGVhZGVycztcblxuXHRcdGxldCByZXNwb25zZSA9IGF3YWl0IGV2ZW50LmZldGNoKGlucHV0LCBpbml0KTtcblxuXHRcdGNvbnN0IHVybCA9IG5ldyBVUkwoaW5wdXQgaW5zdGFuY2VvZiBSZXF1ZXN0ID8gaW5wdXQudXJsIDogaW5wdXQsIGV2ZW50LnVybCk7XG5cdFx0Y29uc3Qgc2FtZV9vcmlnaW4gPSB1cmwub3JpZ2luID09PSBldmVudC51cmwub3JpZ2luO1xuXG5cdFx0LyoqIEB0eXBlIHtpbXBvcnQoJ3R5cGVzJykuUHJlcmVuZGVyRGVwZW5kZW5jeX0gKi9cblx0XHRsZXQgZGVwZW5kZW5jeTtcblxuXHRcdGlmIChzYW1lX29yaWdpbikge1xuXHRcdFx0aWYgKHN0YXRlLnByZXJlbmRlcmluZykge1xuXHRcdFx0XHRkZXBlbmRlbmN5ID0geyByZXNwb25zZSwgYm9keTogbnVsbCB9O1xuXHRcdFx0XHRzdGF0ZS5wcmVyZW5kZXJpbmcuZGVwZW5kZW5jaWVzLnNldCh1cmwucGF0aG5hbWUsIGRlcGVuZGVuY3kpO1xuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyBzaW11bGF0ZSBDT1JTIGVycm9ycyBhbmQgXCJubyBhY2Nlc3MgdG8gYm9keSBpbiBuby1jb3JzIG1vZGVcIiBzZXJ2ZXItc2lkZSBmb3IgY29uc2lzdGVuY3kgd2l0aCBjbGllbnQtc2lkZSBiZWhhdmlvdXJcblx0XHRcdGNvbnN0IG1vZGUgPSBpbnB1dCBpbnN0YW5jZW9mIFJlcXVlc3QgPyBpbnB1dC5tb2RlIDogaW5pdD8ubW9kZSA/PyAnY29ycyc7XG5cdFx0XHRpZiAobW9kZSA9PT0gJ25vLWNvcnMnKSB7XG5cdFx0XHRcdHJlc3BvbnNlID0gbmV3IFJlc3BvbnNlKCcnLCB7XG5cdFx0XHRcdFx0c3RhdHVzOiByZXNwb25zZS5zdGF0dXMsXG5cdFx0XHRcdFx0c3RhdHVzVGV4dDogcmVzcG9uc2Uuc3RhdHVzVGV4dCxcblx0XHRcdFx0XHRoZWFkZXJzOiByZXNwb25zZS5oZWFkZXJzXG5cdFx0XHRcdH0pO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Y29uc3QgYWNhbyA9IHJlc3BvbnNlLmhlYWRlcnMuZ2V0KCdhY2Nlc3MtY29udHJvbC1hbGxvdy1vcmlnaW4nKTtcblx0XHRcdFx0aWYgKCFhY2FvIHx8IChhY2FvICE9PSBldmVudC51cmwub3JpZ2luICYmIGFjYW8gIT09ICcqJykpIHtcblx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoXG5cdFx0XHRcdFx0XHRgQ09SUyBlcnJvcjogJHtcblx0XHRcdFx0XHRcdFx0YWNhbyA/ICdJbmNvcnJlY3QnIDogJ05vJ1xuXHRcdFx0XHRcdFx0fSAnQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luJyBoZWFkZXIgaXMgcHJlc2VudCBvbiB0aGUgcmVxdWVzdGVkIHJlc291cmNlYFxuXHRcdFx0XHRcdCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHRjb25zdCBwcm94eSA9IG5ldyBQcm94eShyZXNwb25zZSwge1xuXHRcdFx0Z2V0KHJlc3BvbnNlLCBrZXksIF9yZWNlaXZlcikge1xuXHRcdFx0XHQvKipcblx0XHRcdFx0ICogQHBhcmFtIHtzdHJpbmd9IGJvZHlcblx0XHRcdFx0ICogQHBhcmFtIHtib29sZWFufSBpc19iNjRcblx0XHRcdFx0ICovXG5cdFx0XHRcdGFzeW5jIGZ1bmN0aW9uIHB1c2hfZmV0Y2hlZChib2R5LCBpc19iNjQpIHtcblx0XHRcdFx0XHRjb25zdCBzdGF0dXNfbnVtYmVyID0gTnVtYmVyKHJlc3BvbnNlLnN0YXR1cyk7XG5cdFx0XHRcdFx0aWYgKGlzTmFOKHN0YXR1c19udW1iZXIpKSB7XG5cdFx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoXG5cdFx0XHRcdFx0XHRcdGByZXNwb25zZS5zdGF0dXMgaXMgbm90IGEgbnVtYmVyLiB2YWx1ZTogXCIke1xuXHRcdFx0XHRcdFx0XHRcdHJlc3BvbnNlLnN0YXR1c1xuXHRcdFx0XHRcdFx0XHR9XCIgdHlwZTogJHt0eXBlb2YgcmVzcG9uc2Uuc3RhdHVzfWBcblx0XHRcdFx0XHRcdCk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0ZmV0Y2hlZC5wdXNoKHtcblx0XHRcdFx0XHRcdHVybDogc2FtZV9vcmlnaW4gPyB1cmwuaHJlZi5zbGljZShldmVudC51cmwub3JpZ2luLmxlbmd0aCkgOiB1cmwuaHJlZixcblx0XHRcdFx0XHRcdG1ldGhvZDogZXZlbnQucmVxdWVzdC5tZXRob2QsXG5cdFx0XHRcdFx0XHRyZXF1ZXN0X2JvZHk6IC8qKiBAdHlwZSB7c3RyaW5nIHwgQXJyYXlCdWZmZXJWaWV3IHwgdW5kZWZpbmVkfSAqLyAoXG5cdFx0XHRcdFx0XHRcdGlucHV0IGluc3RhbmNlb2YgUmVxdWVzdCAmJiBjbG9uZWRfYm9keVxuXHRcdFx0XHRcdFx0XHRcdD8gYXdhaXQgc3RyZWFtX3RvX3N0cmluZyhjbG9uZWRfYm9keSlcblx0XHRcdFx0XHRcdFx0XHQ6IGluaXQ/LmJvZHlcblx0XHRcdFx0XHRcdCksXG5cdFx0XHRcdFx0XHRyZXF1ZXN0X2hlYWRlcnM6IGNsb25lZF9oZWFkZXJzLFxuXHRcdFx0XHRcdFx0cmVzcG9uc2VfYm9keTogYm9keSxcblx0XHRcdFx0XHRcdHJlc3BvbnNlLFxuXHRcdFx0XHRcdFx0aXNfYjY0XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoa2V5ID09PSAnYXJyYXlCdWZmZXInKSB7XG5cdFx0XHRcdFx0cmV0dXJuIGFzeW5jICgpID0+IHtcblx0XHRcdFx0XHRcdGNvbnN0IGJ1ZmZlciA9IGF3YWl0IHJlc3BvbnNlLmFycmF5QnVmZmVyKCk7XG5cblx0XHRcdFx0XHRcdGlmIChkZXBlbmRlbmN5KSB7XG5cdFx0XHRcdFx0XHRcdGRlcGVuZGVuY3kuYm9keSA9IG5ldyBVaW50OEFycmF5KGJ1ZmZlcik7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdGlmIChidWZmZXIgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcikge1xuXHRcdFx0XHRcdFx0XHRhd2FpdCBwdXNoX2ZldGNoZWQoYjY0X2VuY29kZShidWZmZXIpLCB0cnVlKTtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0cmV0dXJuIGJ1ZmZlcjtcblx0XHRcdFx0XHR9O1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0YXN5bmMgZnVuY3Rpb24gdGV4dCgpIHtcblx0XHRcdFx0XHRjb25zdCBib2R5ID0gYXdhaXQgcmVzcG9uc2UudGV4dCgpO1xuXG5cdFx0XHRcdFx0aWYgKCFib2R5IHx8IHR5cGVvZiBib2R5ID09PSAnc3RyaW5nJykge1xuXHRcdFx0XHRcdFx0YXdhaXQgcHVzaF9mZXRjaGVkKGJvZHksIGZhbHNlKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiAoZGVwZW5kZW5jeSkge1xuXHRcdFx0XHRcdFx0ZGVwZW5kZW5jeS5ib2R5ID0gYm9keTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRyZXR1cm4gYm9keTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmIChrZXkgPT09ICd0ZXh0Jykge1xuXHRcdFx0XHRcdHJldHVybiB0ZXh0O1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKGtleSA9PT0gJ2pzb24nKSB7XG5cdFx0XHRcdFx0cmV0dXJuIGFzeW5jICgpID0+IHtcblx0XHRcdFx0XHRcdHJldHVybiBKU09OLnBhcnNlKGF3YWl0IHRleHQoKSk7XG5cdFx0XHRcdFx0fTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHJldHVybiBSZWZsZWN0LmdldChyZXNwb25zZSwga2V5LCByZXNwb25zZSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHRpZiAoY3NyKSB7XG5cdFx0XHQvLyBlbnN1cmUgdGhhdCBleGNsdWRlZCBoZWFkZXJzIGNhbid0IGJlIHJlYWRcblx0XHRcdGNvbnN0IGdldCA9IHJlc3BvbnNlLmhlYWRlcnMuZ2V0O1xuXHRcdFx0cmVzcG9uc2UuaGVhZGVycy5nZXQgPSAoa2V5KSA9PiB7XG5cdFx0XHRcdGNvbnN0IGxvd2VyID0ga2V5LnRvTG93ZXJDYXNlKCk7XG5cdFx0XHRcdGNvbnN0IHZhbHVlID0gZ2V0LmNhbGwocmVzcG9uc2UuaGVhZGVycywgbG93ZXIpO1xuXHRcdFx0XHRpZiAodmFsdWUgJiYgIWxvd2VyLnN0YXJ0c1dpdGgoJ3gtc3ZlbHRla2l0LScpKSB7XG5cdFx0XHRcdFx0Y29uc3QgaW5jbHVkZWQgPSByZXNvbHZlX29wdHMuZmlsdGVyU2VyaWFsaXplZFJlc3BvbnNlSGVhZGVycyhsb3dlciwgdmFsdWUpO1xuXHRcdFx0XHRcdGlmICghaW5jbHVkZWQpIHtcblx0XHRcdFx0XHRcdHRocm93IG5ldyBFcnJvcihcblx0XHRcdFx0XHRcdFx0YEZhaWxlZCB0byBnZXQgcmVzcG9uc2UgaGVhZGVyIFwiJHtsb3dlcn1cIiDigJQgaXQgbXVzdCBiZSBpbmNsdWRlZCBieSB0aGUgXFxgZmlsdGVyU2VyaWFsaXplZFJlc3BvbnNlSGVhZGVyc1xcYCBvcHRpb246IGh0dHBzOi8va2l0LnN2ZWx0ZS5kZXYvZG9jcy9ob29rcyNzZXJ2ZXItaG9va3MtaGFuZGxlIChhdCAke2V2ZW50LnJvdXRlLmlkfSlgXG5cdFx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdHJldHVybiB2YWx1ZTtcblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHByb3h5O1xuXHR9O1xuXG5cdC8vIERvbid0IG1ha2UgdGhpcyBmdW5jdGlvbiBgYXN5bmNgISBPdGhlcndpc2UsIHRoZSB1c2VyIGhhcyB0byBgY2F0Y2hgIHByb21pc2VzIHRoZXkgdXNlIGZvciBzdHJlYW1pbmcgcmVzcG9uc2VzIG9yIGVsc2Vcblx0Ly8gaXQgd2lsbCBiZSBhbiB1bmhhbmRsZWQgcmVqZWN0aW9uLiBJbnN0ZWFkLCB3ZSBhZGQgYSBgLmNhdGNoKCgpID0+IHt9KWAgb3Vyc2VsdmVzIGJlbG93IHRvIHRoaXMgZnJvbSBoYXBwZW5pbmcuXG5cdHJldHVybiAoaW5wdXQsIGluaXQpID0+IHtcblx0XHQvLyBTZWUgZG9jcyBpbiBmZXRjaC5qcyBmb3Igd2h5IHdlIG5lZWQgdG8gZG8gdGhpc1xuXHRcdGNvbnN0IHJlc3BvbnNlID0gdW5pdmVyc2FsX2ZldGNoKGlucHV0LCBpbml0KTtcblx0XHRyZXNwb25zZS5jYXRjaCgoKSA9PiB7fSk7XG5cdFx0cmV0dXJuIHJlc3BvbnNlO1xuXHR9O1xufVxuXG4vKipcbiAqIEBwYXJhbSB7UmVhZGFibGVTdHJlYW08VWludDhBcnJheT59IHN0cmVhbVxuICovXG5hc3luYyBmdW5jdGlvbiBzdHJlYW1fdG9fc3RyaW5nKHN0cmVhbSkge1xuXHRsZXQgcmVzdWx0ID0gJyc7XG5cdGNvbnN0IHJlYWRlciA9IHN0cmVhbS5nZXRSZWFkZXIoKTtcblx0Y29uc3QgZGVjb2RlciA9IG5ldyBUZXh0RGVjb2RlcigpO1xuXHR3aGlsZSAodHJ1ZSkge1xuXHRcdGNvbnN0IHsgZG9uZSwgdmFsdWUgfSA9IGF3YWl0IHJlYWRlci5yZWFkKCk7XG5cdFx0aWYgKGRvbmUpIHtcblx0XHRcdGJyZWFrO1xuXHRcdH1cblx0XHRyZXN1bHQgKz0gZGVjb2Rlci5kZWNvZGUodmFsdWUpO1xuXHR9XG5cdHJldHVybiByZXN1bHQ7XG59XG5cbi8qKlxuICogQHBhcmFtIHthbnl9IGRhdGFcbiAqIEBwYXJhbSB7c3RyaW5nfSBbaWRdXG4gKi9cbmZ1bmN0aW9uIHZhbGlkYXRlX2xvYWRfcmVzcG9uc2UoZGF0YSwgaWQpIHtcblx0aWYgKGRhdGEgIT0gbnVsbCAmJiBPYmplY3QuZ2V0UHJvdG90eXBlT2YoZGF0YSkgIT09IE9iamVjdC5wcm90b3R5cGUpIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoXG5cdFx0XHRgYSBsb2FkIGZ1bmN0aW9uIGluICR7aWR9IHJldHVybmVkICR7XG5cdFx0XHRcdHR5cGVvZiBkYXRhICE9PSAnb2JqZWN0J1xuXHRcdFx0XHRcdD8gYGEgJHt0eXBlb2YgZGF0YX1gXG5cdFx0XHRcdFx0OiBkYXRhIGluc3RhbmNlb2YgUmVzcG9uc2Vcblx0XHRcdFx0XHRcdD8gJ2EgUmVzcG9uc2Ugb2JqZWN0J1xuXHRcdFx0XHRcdFx0OiBBcnJheS5pc0FycmF5KGRhdGEpXG5cdFx0XHRcdFx0XHRcdD8gJ2FuIGFycmF5J1xuXHRcdFx0XHRcdFx0XHQ6ICdhIG5vbi1wbGFpbiBvYmplY3QnXG5cdFx0XHR9LCBidXQgbXVzdCByZXR1cm4gYSBwbGFpbiBvYmplY3QgYXQgdGhlIHRvcCBsZXZlbCAoaS5lLiBcXGByZXR1cm4gey4uLn1cXGApYFxuXHRcdCk7XG5cdH1cbn1cbiIsImltcG9ydCB7XG5cdHJ1bl9hbGwsXG5cdHN1YnNjcmliZSxcblx0bm9vcCxcblx0c2FmZV9ub3RfZXF1YWwsXG5cdGlzX2Z1bmN0aW9uLFxuXHRnZXRfc3RvcmVfdmFsdWVcbn0gZnJvbSAnLi4vaW50ZXJuYWwvaW5kZXguanMnO1xuXG5jb25zdCBzdWJzY3JpYmVyX3F1ZXVlID0gW107XG5cbi8qKlxuICogQ3JlYXRlcyBhIGBSZWFkYWJsZWAgc3RvcmUgdGhhdCBhbGxvd3MgcmVhZGluZyBieSBzdWJzY3JpcHRpb24uXG4gKlxuICogaHR0cHM6Ly9zdmVsdGUuZGV2L2RvY3Mvc3ZlbHRlLXN0b3JlI3JlYWRhYmxlXG4gKiBAdGVtcGxhdGUgVFxuICogQHBhcmFtIHtUfSBbdmFsdWVdIGluaXRpYWwgdmFsdWVcbiAqIEBwYXJhbSB7aW1wb3J0KCcuL3B1YmxpYy5qcycpLlN0YXJ0U3RvcE5vdGlmaWVyPFQ+fSBbc3RhcnRdXG4gKiBAcmV0dXJucyB7aW1wb3J0KCcuL3B1YmxpYy5qcycpLlJlYWRhYmxlPFQ+fVxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVhZGFibGUodmFsdWUsIHN0YXJ0KSB7XG5cdHJldHVybiB7XG5cdFx0c3Vic2NyaWJlOiB3cml0YWJsZSh2YWx1ZSwgc3RhcnQpLnN1YnNjcmliZVxuXHR9O1xufVxuXG4vKipcbiAqIENyZWF0ZSBhIGBXcml0YWJsZWAgc3RvcmUgdGhhdCBhbGxvd3MgYm90aCB1cGRhdGluZyBhbmQgcmVhZGluZyBieSBzdWJzY3JpcHRpb24uXG4gKlxuICogaHR0cHM6Ly9zdmVsdGUuZGV2L2RvY3Mvc3ZlbHRlLXN0b3JlI3dyaXRhYmxlXG4gKiBAdGVtcGxhdGUgVFxuICogQHBhcmFtIHtUfSBbdmFsdWVdIGluaXRpYWwgdmFsdWVcbiAqIEBwYXJhbSB7aW1wb3J0KCcuL3B1YmxpYy5qcycpLlN0YXJ0U3RvcE5vdGlmaWVyPFQ+fSBbc3RhcnRdXG4gKiBAcmV0dXJucyB7aW1wb3J0KCcuL3B1YmxpYy5qcycpLldyaXRhYmxlPFQ+fVxuICovXG5leHBvcnQgZnVuY3Rpb24gd3JpdGFibGUodmFsdWUsIHN0YXJ0ID0gbm9vcCkge1xuXHQvKiogQHR5cGUge2ltcG9ydCgnLi9wdWJsaWMuanMnKS5VbnN1YnNjcmliZXJ9ICovXG5cdGxldCBzdG9wO1xuXHQvKiogQHR5cGUge1NldDxpbXBvcnQoJy4vcHJpdmF0ZS5qcycpLlN1YnNjcmliZUludmFsaWRhdGVUdXBsZTxUPj59ICovXG5cdGNvbnN0IHN1YnNjcmliZXJzID0gbmV3IFNldCgpO1xuXHQvKiogQHBhcmFtIHtUfSBuZXdfdmFsdWVcblx0ICogQHJldHVybnMge3ZvaWR9XG5cdCAqL1xuXHRmdW5jdGlvbiBzZXQobmV3X3ZhbHVlKSB7XG5cdFx0aWYgKHNhZmVfbm90X2VxdWFsKHZhbHVlLCBuZXdfdmFsdWUpKSB7XG5cdFx0XHR2YWx1ZSA9IG5ld192YWx1ZTtcblx0XHRcdGlmIChzdG9wKSB7XG5cdFx0XHRcdC8vIHN0b3JlIGlzIHJlYWR5XG5cdFx0XHRcdGNvbnN0IHJ1bl9xdWV1ZSA9ICFzdWJzY3JpYmVyX3F1ZXVlLmxlbmd0aDtcblx0XHRcdFx0Zm9yIChjb25zdCBzdWJzY3JpYmVyIG9mIHN1YnNjcmliZXJzKSB7XG5cdFx0XHRcdFx0c3Vic2NyaWJlclsxXSgpO1xuXHRcdFx0XHRcdHN1YnNjcmliZXJfcXVldWUucHVzaChzdWJzY3JpYmVyLCB2YWx1ZSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKHJ1bl9xdWV1ZSkge1xuXHRcdFx0XHRcdGZvciAobGV0IGkgPSAwOyBpIDwgc3Vic2NyaWJlcl9xdWV1ZS5sZW5ndGg7IGkgKz0gMikge1xuXHRcdFx0XHRcdFx0c3Vic2NyaWJlcl9xdWV1ZVtpXVswXShzdWJzY3JpYmVyX3F1ZXVlW2kgKyAxXSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHN1YnNjcmliZXJfcXVldWUubGVuZ3RoID0gMDtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBAcGFyYW0ge2ltcG9ydCgnLi9wdWJsaWMuanMnKS5VcGRhdGVyPFQ+fSBmblxuXHQgKiBAcmV0dXJucyB7dm9pZH1cblx0ICovXG5cdGZ1bmN0aW9uIHVwZGF0ZShmbikge1xuXHRcdHNldChmbih2YWx1ZSkpO1xuXHR9XG5cblx0LyoqXG5cdCAqIEBwYXJhbSB7aW1wb3J0KCcuL3B1YmxpYy5qcycpLlN1YnNjcmliZXI8VD59IHJ1blxuXHQgKiBAcGFyYW0ge2ltcG9ydCgnLi9wcml2YXRlLmpzJykuSW52YWxpZGF0b3I8VD59IFtpbnZhbGlkYXRlXVxuXHQgKiBAcmV0dXJucyB7aW1wb3J0KCcuL3B1YmxpYy5qcycpLlVuc3Vic2NyaWJlcn1cblx0ICovXG5cdGZ1bmN0aW9uIHN1YnNjcmliZShydW4sIGludmFsaWRhdGUgPSBub29wKSB7XG5cdFx0LyoqIEB0eXBlIHtpbXBvcnQoJy4vcHJpdmF0ZS5qcycpLlN1YnNjcmliZUludmFsaWRhdGVUdXBsZTxUPn0gKi9cblx0XHRjb25zdCBzdWJzY3JpYmVyID0gW3J1biwgaW52YWxpZGF0ZV07XG5cdFx0c3Vic2NyaWJlcnMuYWRkKHN1YnNjcmliZXIpO1xuXHRcdGlmIChzdWJzY3JpYmVycy5zaXplID09PSAxKSB7XG5cdFx0XHRzdG9wID0gc3RhcnQoc2V0LCB1cGRhdGUpIHx8IG5vb3A7XG5cdFx0fVxuXHRcdHJ1bih2YWx1ZSk7XG5cdFx0cmV0dXJuICgpID0+IHtcblx0XHRcdHN1YnNjcmliZXJzLmRlbGV0ZShzdWJzY3JpYmVyKTtcblx0XHRcdGlmIChzdWJzY3JpYmVycy5zaXplID09PSAwICYmIHN0b3ApIHtcblx0XHRcdFx0c3RvcCgpO1xuXHRcdFx0XHRzdG9wID0gbnVsbDtcblx0XHRcdH1cblx0XHR9O1xuXHR9XG5cdHJldHVybiB7IHNldCwgdXBkYXRlLCBzdWJzY3JpYmUgfTtcbn1cblxuLyoqXG4gKiBEZXJpdmVkIHZhbHVlIHN0b3JlIGJ5IHN5bmNocm9uaXppbmcgb25lIG9yIG1vcmUgcmVhZGFibGUgc3RvcmVzIGFuZFxuICogYXBwbHlpbmcgYW4gYWdncmVnYXRpb24gZnVuY3Rpb24gb3ZlciBpdHMgaW5wdXQgdmFsdWVzLlxuICpcbiAqIGh0dHBzOi8vc3ZlbHRlLmRldi9kb2NzL3N2ZWx0ZS1zdG9yZSNkZXJpdmVkXG4gKiBAdGVtcGxhdGUge2ltcG9ydCgnLi9wcml2YXRlLmpzJykuU3RvcmVzfSBTXG4gKiBAdGVtcGxhdGUgVFxuICogQG92ZXJsb2FkXG4gKiBAcGFyYW0ge1N9IHN0b3JlcyAtIGlucHV0IHN0b3Jlc1xuICogQHBhcmFtIHsodmFsdWVzOiBpbXBvcnQoJy4vcHJpdmF0ZS5qcycpLlN0b3Jlc1ZhbHVlczxTPiwgc2V0OiAodmFsdWU6IFQpID0+IHZvaWQsIHVwZGF0ZTogKGZuOiBpbXBvcnQoJy4vcHVibGljLmpzJykuVXBkYXRlcjxUPikgPT4gdm9pZCkgPT4gaW1wb3J0KCcuL3B1YmxpYy5qcycpLlVuc3Vic2NyaWJlciB8IHZvaWR9IGZuIC0gZnVuY3Rpb24gY2FsbGJhY2sgdGhhdCBhZ2dyZWdhdGVzIHRoZSB2YWx1ZXNcbiAqIEBwYXJhbSB7VH0gW2luaXRpYWxfdmFsdWVdIC0gaW5pdGlhbCB2YWx1ZVxuICogQHJldHVybnMge2ltcG9ydCgnLi9wdWJsaWMuanMnKS5SZWFkYWJsZTxUPn1cbiAqL1xuXG4vKipcbiAqIERlcml2ZWQgdmFsdWUgc3RvcmUgYnkgc3luY2hyb25pemluZyBvbmUgb3IgbW9yZSByZWFkYWJsZSBzdG9yZXMgYW5kXG4gKiBhcHBseWluZyBhbiBhZ2dyZWdhdGlvbiBmdW5jdGlvbiBvdmVyIGl0cyBpbnB1dCB2YWx1ZXMuXG4gKlxuICogaHR0cHM6Ly9zdmVsdGUuZGV2L2RvY3Mvc3ZlbHRlLXN0b3JlI2Rlcml2ZWRcbiAqIEB0ZW1wbGF0ZSB7aW1wb3J0KCcuL3ByaXZhdGUuanMnKS5TdG9yZXN9IFNcbiAqIEB0ZW1wbGF0ZSBUXG4gKiBAb3ZlcmxvYWRcbiAqIEBwYXJhbSB7U30gc3RvcmVzIC0gaW5wdXQgc3RvcmVzXG4gKiBAcGFyYW0geyh2YWx1ZXM6IGltcG9ydCgnLi9wcml2YXRlLmpzJykuU3RvcmVzVmFsdWVzPFM+KSA9PiBUfSBmbiAtIGZ1bmN0aW9uIGNhbGxiYWNrIHRoYXQgYWdncmVnYXRlcyB0aGUgdmFsdWVzXG4gKiBAcGFyYW0ge1R9IFtpbml0aWFsX3ZhbHVlXSAtIGluaXRpYWwgdmFsdWVcbiAqIEByZXR1cm5zIHtpbXBvcnQoJy4vcHVibGljLmpzJykuUmVhZGFibGU8VD59XG4gKi9cblxuLyoqXG4gKiBAdGVtcGxhdGUge2ltcG9ydCgnLi9wcml2YXRlLmpzJykuU3RvcmVzfSBTXG4gKiBAdGVtcGxhdGUgVFxuICogQHBhcmFtIHtTfSBzdG9yZXNcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAcGFyYW0ge1R9IFtpbml0aWFsX3ZhbHVlXVxuICogQHJldHVybnMge2ltcG9ydCgnLi9wdWJsaWMuanMnKS5SZWFkYWJsZTxUPn1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlcml2ZWQoc3RvcmVzLCBmbiwgaW5pdGlhbF92YWx1ZSkge1xuXHRjb25zdCBzaW5nbGUgPSAhQXJyYXkuaXNBcnJheShzdG9yZXMpO1xuXHQvKiogQHR5cGUge0FycmF5PGltcG9ydCgnLi9wdWJsaWMuanMnKS5SZWFkYWJsZTxhbnk+Pn0gKi9cblx0Y29uc3Qgc3RvcmVzX2FycmF5ID0gc2luZ2xlID8gW3N0b3Jlc10gOiBzdG9yZXM7XG5cdGlmICghc3RvcmVzX2FycmF5LmV2ZXJ5KEJvb2xlYW4pKSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKCdkZXJpdmVkKCkgZXhwZWN0cyBzdG9yZXMgYXMgaW5wdXQsIGdvdCBhIGZhbHN5IHZhbHVlJyk7XG5cdH1cblx0Y29uc3QgYXV0byA9IGZuLmxlbmd0aCA8IDI7XG5cdHJldHVybiByZWFkYWJsZShpbml0aWFsX3ZhbHVlLCAoc2V0LCB1cGRhdGUpID0+IHtcblx0XHRsZXQgc3RhcnRlZCA9IGZhbHNlO1xuXHRcdGNvbnN0IHZhbHVlcyA9IFtdO1xuXHRcdGxldCBwZW5kaW5nID0gMDtcblx0XHRsZXQgY2xlYW51cCA9IG5vb3A7XG5cdFx0Y29uc3Qgc3luYyA9ICgpID0+IHtcblx0XHRcdGlmIChwZW5kaW5nKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblx0XHRcdGNsZWFudXAoKTtcblx0XHRcdGNvbnN0IHJlc3VsdCA9IGZuKHNpbmdsZSA/IHZhbHVlc1swXSA6IHZhbHVlcywgc2V0LCB1cGRhdGUpO1xuXHRcdFx0aWYgKGF1dG8pIHtcblx0XHRcdFx0c2V0KHJlc3VsdCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRjbGVhbnVwID0gaXNfZnVuY3Rpb24ocmVzdWx0KSA/IHJlc3VsdCA6IG5vb3A7XG5cdFx0XHR9XG5cdFx0fTtcblx0XHRjb25zdCB1bnN1YnNjcmliZXJzID0gc3RvcmVzX2FycmF5Lm1hcCgoc3RvcmUsIGkpID0+XG5cdFx0XHRzdWJzY3JpYmUoXG5cdFx0XHRcdHN0b3JlLFxuXHRcdFx0XHQodmFsdWUpID0+IHtcblx0XHRcdFx0XHR2YWx1ZXNbaV0gPSB2YWx1ZTtcblx0XHRcdFx0XHRwZW5kaW5nICY9IH4oMSA8PCBpKTtcblx0XHRcdFx0XHRpZiAoc3RhcnRlZCkge1xuXHRcdFx0XHRcdFx0c3luYygpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSxcblx0XHRcdFx0KCkgPT4ge1xuXHRcdFx0XHRcdHBlbmRpbmcgfD0gMSA8PCBpO1xuXHRcdFx0XHR9XG5cdFx0XHQpXG5cdFx0KTtcblx0XHRzdGFydGVkID0gdHJ1ZTtcblx0XHRzeW5jKCk7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIHN0b3AoKSB7XG5cdFx0XHRydW5fYWxsKHVuc3Vic2NyaWJlcnMpO1xuXHRcdFx0Y2xlYW51cCgpO1xuXHRcdFx0Ly8gV2UgbmVlZCB0byBzZXQgdGhpcyB0byBmYWxzZSBiZWNhdXNlIGNhbGxiYWNrcyBjYW4gc3RpbGwgaGFwcGVuIGRlc3BpdGUgaGF2aW5nIHVuc3Vic2NyaWJlZDpcblx0XHRcdC8vIENhbGxiYWNrcyBtaWdodCBhbHJlYWR5IGJlIHBsYWNlZCBpbiB0aGUgcXVldWUgd2hpY2ggZG9lc24ndCBrbm93IGl0IHNob3VsZCBubyBsb25nZXJcblx0XHRcdC8vIGludm9rZSB0aGlzIGRlcml2ZWQgc3RvcmUuXG5cdFx0XHRzdGFydGVkID0gZmFsc2U7XG5cdFx0fTtcblx0fSk7XG59XG5cbi8qKlxuICogVGFrZXMgYSBzdG9yZSBhbmQgcmV0dXJucyBhIG5ldyBvbmUgZGVyaXZlZCBmcm9tIHRoZSBvbGQgb25lIHRoYXQgaXMgcmVhZGFibGUuXG4gKlxuICogaHR0cHM6Ly9zdmVsdGUuZGV2L2RvY3Mvc3ZlbHRlLXN0b3JlI3JlYWRvbmx5XG4gKiBAdGVtcGxhdGUgVFxuICogQHBhcmFtIHtpbXBvcnQoJy4vcHVibGljLmpzJykuUmVhZGFibGU8VD59IHN0b3JlICAtIHN0b3JlIHRvIG1ha2UgcmVhZG9ubHlcbiAqIEByZXR1cm5zIHtpbXBvcnQoJy4vcHVibGljLmpzJykuUmVhZGFibGU8VD59XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWFkb25seShzdG9yZSkge1xuXHRyZXR1cm4ge1xuXHRcdHN1YnNjcmliZTogc3RvcmUuc3Vic2NyaWJlLmJpbmQoc3RvcmUpXG5cdH07XG59XG5cbmV4cG9ydCB7IGdldF9zdG9yZV92YWx1ZSBhcyBnZXQgfTtcbiIsIi8qKlxuICogSGFzaCB1c2luZyBkamIyXG4gKiBAcGFyYW0ge2ltcG9ydCgndHlwZXMnKS5TdHJpY3RCb2R5W119IHZhbHVlc1xuICovXG5leHBvcnQgZnVuY3Rpb24gaGFzaCguLi52YWx1ZXMpIHtcblx0bGV0IGhhc2ggPSA1MzgxO1xuXG5cdGZvciAoY29uc3QgdmFsdWUgb2YgdmFsdWVzKSB7XG5cdFx0aWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcblx0XHRcdGxldCBpID0gdmFsdWUubGVuZ3RoO1xuXHRcdFx0d2hpbGUgKGkpIGhhc2ggPSAoaGFzaCAqIDMzKSBeIHZhbHVlLmNoYXJDb2RlQXQoLS1pKTtcblx0XHR9IGVsc2UgaWYgKEFycmF5QnVmZmVyLmlzVmlldyh2YWx1ZSkpIHtcblx0XHRcdGNvbnN0IGJ1ZmZlciA9IG5ldyBVaW50OEFycmF5KHZhbHVlLmJ1ZmZlciwgdmFsdWUuYnl0ZU9mZnNldCwgdmFsdWUuYnl0ZUxlbmd0aCk7XG5cdFx0XHRsZXQgaSA9IGJ1ZmZlci5sZW5ndGg7XG5cdFx0XHR3aGlsZSAoaSkgaGFzaCA9IChoYXNoICogMzMpIF4gYnVmZmVyWy0taV07XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRocm93IG5ldyBUeXBlRXJyb3IoJ3ZhbHVlIG11c3QgYmUgYSBzdHJpbmcgb3IgVHlwZWRBcnJheScpO1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiAoaGFzaCA+Pj4gMCkudG9TdHJpbmcoMzYpO1xufVxuIiwiLyoqXG4gKiBXaGVuIGluc2lkZSBhIGRvdWJsZS1xdW90ZWQgYXR0cmlidXRlIHZhbHVlLCBvbmx5IGAmYCBhbmQgYFwiYCBob2xkIHNwZWNpYWwgbWVhbmluZy5cbiAqIEBzZWUgaHR0cHM6Ly9odG1sLnNwZWMud2hhdHdnLm9yZy9tdWx0aXBhZ2UvcGFyc2luZy5odG1sI2F0dHJpYnV0ZS12YWx1ZS0oZG91YmxlLXF1b3RlZCktc3RhdGVcbiAqIEB0eXBlIHtSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+fVxuICovXG5jb25zdCBlc2NhcGVfaHRtbF9hdHRyX2RpY3QgPSB7XG5cdCcmJzogJyZhbXA7Jyxcblx0J1wiJzogJyZxdW90Oydcbn07XG5cbmNvbnN0IGVzY2FwZV9odG1sX2F0dHJfcmVnZXggPSBuZXcgUmVnRXhwKFxuXHQvLyBzcGVjaWFsIGNoYXJhY3RlcnNcblx0YFske09iamVjdC5rZXlzKGVzY2FwZV9odG1sX2F0dHJfZGljdCkuam9pbignJyl9XXxgICtcblx0XHQvLyBoaWdoIHN1cnJvZ2F0ZSB3aXRob3V0IHBhaXJlZCBsb3cgc3Vycm9nYXRlXG5cdFx0J1tcXFxcdWQ4MDAtXFxcXHVkYmZmXSg/IVtcXFxcdWRjMDAtXFxcXHVkZmZmXSl8JyArXG5cdFx0Ly8gYSB2YWxpZCBzdXJyb2dhdGUgcGFpciwgdGhlIG9ubHkgbWF0Y2ggd2l0aCAyIGNvZGUgdW5pdHNcblx0XHQvLyB3ZSBtYXRjaCBpdCBzbyB0aGF0IHdlIGNhbiBtYXRjaCB1bnBhaXJlZCBsb3cgc3Vycm9nYXRlcyBpbiB0aGUgc2FtZSBwYXNzXG5cdFx0Ly8gVE9ETzogdXNlIGxvb2tiZWhpbmQgYXNzZXJ0aW9ucyBvbmNlIHRoZXkgYXJlIHdpZGVseSBzdXBwb3J0ZWQ6ICg/PCFbXFx1ZDgwMC11ZGJmZl0pW1xcdWRjMDAtXFx1ZGZmZl1cblx0XHQnW1xcXFx1ZDgwMC1cXFxcdWRiZmZdW1xcXFx1ZGMwMC1cXFxcdWRmZmZdfCcgK1xuXHRcdC8vIHVucGFpcmVkIGxvdyBzdXJyb2dhdGUgKHNlZSBwcmV2aW91cyBtYXRjaClcblx0XHQnW1xcXFx1ZGMwMC1cXFxcdWRmZmZdJyxcblx0J2cnXG4pO1xuXG4vKipcbiAqIEZvcm1hdHMgYSBzdHJpbmcgdG8gYmUgdXNlZCBhcyBhbiBhdHRyaWJ1dGUncyB2YWx1ZSBpbiByYXcgSFRNTC5cbiAqXG4gKiBJdCBlc2NhcGVzIHVucGFpcmVkIHN1cnJvZ2F0ZXMgKHdoaWNoIGFyZSBhbGxvd2VkIGluIGpzIHN0cmluZ3MgYnV0IGludmFsaWQgaW4gSFRNTCksIGVzY2FwZXNcbiAqIGNoYXJhY3RlcnMgdGhhdCBhcmUgc3BlY2lhbCBpbiBhdHRyaWJ1dGVzLCBhbmQgc3Vycm91bmRzIHRoZSB3aG9sZSBzdHJpbmcgaW4gZG91YmxlLXF1b3Rlcy5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBFc2NhcGVkIHN0cmluZyBzdXJyb3VuZGVkIGJ5IGRvdWJsZS1xdW90ZXMuXG4gKiBAZXhhbXBsZSBjb25zdCBodG1sID0gYDx0YWcgZGF0YS12YWx1ZT0ke2VzY2FwZV9odG1sX2F0dHIoJ3ZhbHVlJyl9Pi4uLjwvdGFnPmA7XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlc2NhcGVfaHRtbF9hdHRyKHN0cikge1xuXHRjb25zdCBlc2NhcGVkX3N0ciA9IHN0ci5yZXBsYWNlKGVzY2FwZV9odG1sX2F0dHJfcmVnZXgsIChtYXRjaCkgPT4ge1xuXHRcdGlmIChtYXRjaC5sZW5ndGggPT09IDIpIHtcblx0XHRcdC8vIHZhbGlkIHN1cnJvZ2F0ZSBwYWlyXG5cdFx0XHRyZXR1cm4gbWF0Y2g7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGVzY2FwZV9odG1sX2F0dHJfZGljdFttYXRjaF0gPz8gYCYjJHttYXRjaC5jaGFyQ29kZUF0KDApfTtgO1xuXHR9KTtcblxuXHRyZXR1cm4gYFwiJHtlc2NhcGVkX3N0cn1cImA7XG59XG4iLCJpbXBvcnQgeyBlc2NhcGVfaHRtbF9hdHRyIH0gZnJvbSAnLi4vLi4vLi4vdXRpbHMvZXNjYXBlLmpzJztcbmltcG9ydCB7IGhhc2ggfSBmcm9tICcuLi8uLi9oYXNoLmpzJztcblxuLyoqXG4gKiBJbnNpZGUgYSBzY3JpcHQgZWxlbWVudCwgb25seSBgPC9zY3JpcHRgIGFuZCBgPCEtLWAgaG9sZCBzcGVjaWFsIG1lYW5pbmcgdG8gdGhlIEhUTUwgcGFyc2VyLlxuICpcbiAqIFRoZSBmaXJzdCBjbG9zZXMgdGhlIHNjcmlwdCBlbGVtZW50LCBzbyBldmVyeXRoaW5nIGFmdGVyIGlzIHRyZWF0ZWQgYXMgcmF3IEhUTUwuXG4gKiBUaGUgc2Vjb25kIGRpc2FibGVzIGZ1cnRoZXIgcGFyc2luZyB1bnRpbCBgLS0+YCwgc28gdGhlIHNjcmlwdCBlbGVtZW50IG1pZ2h0IGJlIHVuZXhwZWN0ZWRseVxuICoga2VwdCBvcGVuIHVudGlsIHVudGlsIGFuIHVucmVsYXRlZCBIVE1MIGNvbW1lbnQgaW4gdGhlIHBhZ2UuXG4gKlxuICogVSsyMDI4IExJTkUgU0VQQVJBVE9SIGFuZCBVKzIwMjkgUEFSQUdSQVBIIFNFUEFSQVRPUiBhcmUgZXNjYXBlZCBmb3IgdGhlIHNha2Ugb2YgcHJlLTIwMThcbiAqIGJyb3dzZXJzLlxuICpcbiAqIEBzZWUgdGVzdHMgZm9yIHVuc2FmZSBwYXJzaW5nIGV4YW1wbGVzLlxuICogQHNlZSBodHRwczovL2h0bWwuc3BlYy53aGF0d2cub3JnL211bHRpcGFnZS9zY3JpcHRpbmcuaHRtbCNyZXN0cmljdGlvbnMtZm9yLWNvbnRlbnRzLW9mLXNjcmlwdC1lbGVtZW50c1xuICogQHNlZSBodHRwczovL2h0bWwuc3BlYy53aGF0d2cub3JnL211bHRpcGFnZS9zeW50YXguaHRtbCNjZGF0YS1yY2RhdGEtcmVzdHJpY3Rpb25zXG4gKiBAc2VlIGh0dHBzOi8vaHRtbC5zcGVjLndoYXR3Zy5vcmcvbXVsdGlwYWdlL3BhcnNpbmcuaHRtbCNzY3JpcHQtZGF0YS1zdGF0ZVxuICogQHNlZSBodHRwczovL2h0bWwuc3BlYy53aGF0d2cub3JnL211bHRpcGFnZS9wYXJzaW5nLmh0bWwjc2NyaXB0LWRhdGEtZG91YmxlLWVzY2FwZWQtc3RhdGVcbiAqIEBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3RjMzkvcHJvcG9zYWwtanNvbi1zdXBlcnNldFxuICogQHR5cGUge1JlY29yZDxzdHJpbmcsIHN0cmluZz59XG4gKi9cbmNvbnN0IHJlcGxhY2VtZW50cyA9IHtcblx0JzwnOiAnXFxcXHUwMDNDJyxcblx0J1xcdTIwMjgnOiAnXFxcXHUyMDI4Jyxcblx0J1xcdTIwMjknOiAnXFxcXHUyMDI5J1xufTtcblxuY29uc3QgcGF0dGVybiA9IG5ldyBSZWdFeHAoYFske09iamVjdC5rZXlzKHJlcGxhY2VtZW50cykuam9pbignJyl9XWAsICdnJyk7XG5cbi8qKlxuICogR2VuZXJhdGVzIGEgcmF3IEhUTUwgc3RyaW5nIGNvbnRhaW5pbmcgYSBzYWZlIHNjcmlwdCBlbGVtZW50IGNhcnJ5aW5nIGRhdGEgYW5kIGFzc29jaWF0ZWQgYXR0cmlidXRlcy5cbiAqXG4gKiBJdCBlc2NhcGVzIGFsbCB0aGUgc3BlY2lhbCBjaGFyYWN0ZXJzIG5lZWRlZCB0byBndWFyYW50ZWUgdGhlIGVsZW1lbnQgaXMgdW5icm9rZW4sIGJ1dCBjYXJlIG11c3RcbiAqIGJlIHRha2VuIHRvIGVuc3VyZSBpdCBpcyBpbnNlcnRlZCBpbiB0aGUgZG9jdW1lbnQgYXQgYW4gYWNjZXB0YWJsZSBwb3NpdGlvbiBmb3IgYSBzY3JpcHQgZWxlbWVudCxcbiAqIGFuZCB0aGF0IHRoZSByZXN1bHRpbmcgc3RyaW5nIGlzbid0IGZ1cnRoZXIgbW9kaWZpZWQuXG4gKlxuICogQHBhcmFtIHtpbXBvcnQoJy4vdHlwZXMuanMnKS5GZXRjaGVkfSBmZXRjaGVkXG4gKiBAcGFyYW0geyhuYW1lOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcpID0+IGJvb2xlYW59IGZpbHRlclxuICogQHBhcmFtIHtib29sZWFufSBbcHJlcmVuZGVyaW5nXVxuICogQHJldHVybnMge3N0cmluZ30gVGhlIHJhdyBIVE1MIG9mIGEgc2NyaXB0IGVsZW1lbnQgY2FycnlpbmcgdGhlIEpTT04gcGF5bG9hZC5cbiAqIEBleGFtcGxlIGNvbnN0IGh0bWwgPSBzZXJpYWxpemVfZGF0YSgnL2RhdGEuanNvbicsIG51bGwsIHsgZm9vOiAnYmFyJyB9KTtcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNlcmlhbGl6ZV9kYXRhKGZldGNoZWQsIGZpbHRlciwgcHJlcmVuZGVyaW5nID0gZmFsc2UpIHtcblx0LyoqIEB0eXBlIHtSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+fSAqL1xuXHRjb25zdCBoZWFkZXJzID0ge307XG5cblx0bGV0IGNhY2hlX2NvbnRyb2wgPSBudWxsO1xuXHRsZXQgYWdlID0gbnVsbDtcblx0bGV0IHZhcnlBbnkgPSBmYWxzZTtcblxuXHRmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBmZXRjaGVkLnJlc3BvbnNlLmhlYWRlcnMpIHtcblx0XHRpZiAoZmlsdGVyKGtleSwgdmFsdWUpKSB7XG5cdFx0XHRoZWFkZXJzW2tleV0gPSB2YWx1ZTtcblx0XHR9XG5cblx0XHRpZiAoa2V5ID09PSAnY2FjaGUtY29udHJvbCcpIGNhY2hlX2NvbnRyb2wgPSB2YWx1ZTtcblx0XHRlbHNlIGlmIChrZXkgPT09ICdhZ2UnKSBhZ2UgPSB2YWx1ZTtcblx0XHRlbHNlIGlmIChrZXkgPT09ICd2YXJ5JyAmJiB2YWx1ZS50cmltKCkgPT09ICcqJykgdmFyeUFueSA9IHRydWU7XG5cdH1cblxuXHRjb25zdCBwYXlsb2FkID0ge1xuXHRcdHN0YXR1czogZmV0Y2hlZC5yZXNwb25zZS5zdGF0dXMsXG5cdFx0c3RhdHVzVGV4dDogZmV0Y2hlZC5yZXNwb25zZS5zdGF0dXNUZXh0LFxuXHRcdGhlYWRlcnMsXG5cdFx0Ym9keTogZmV0Y2hlZC5yZXNwb25zZV9ib2R5XG5cdH07XG5cblx0Y29uc3Qgc2FmZV9wYXlsb2FkID0gSlNPTi5zdHJpbmdpZnkocGF5bG9hZCkucmVwbGFjZShwYXR0ZXJuLCAobWF0Y2gpID0+IHJlcGxhY2VtZW50c1ttYXRjaF0pO1xuXG5cdGNvbnN0IGF0dHJzID0gW1xuXHRcdCd0eXBlPVwiYXBwbGljYXRpb24vanNvblwiJyxcblx0XHQnZGF0YS1zdmVsdGVraXQtZmV0Y2hlZCcsXG5cdFx0YGRhdGEtdXJsPSR7ZXNjYXBlX2h0bWxfYXR0cihmZXRjaGVkLnVybCl9YFxuXHRdO1xuXG5cdGlmIChmZXRjaGVkLmlzX2I2NCkge1xuXHRcdGF0dHJzLnB1c2goJ2RhdGEtYjY0Jyk7XG5cdH1cblxuXHRpZiAoZmV0Y2hlZC5yZXF1ZXN0X2hlYWRlcnMgfHwgZmV0Y2hlZC5yZXF1ZXN0X2JvZHkpIHtcblx0XHQvKiogQHR5cGUge2ltcG9ydCgndHlwZXMnKS5TdHJpY3RCb2R5W119ICovXG5cdFx0Y29uc3QgdmFsdWVzID0gW107XG5cblx0XHRpZiAoZmV0Y2hlZC5yZXF1ZXN0X2hlYWRlcnMpIHtcblx0XHRcdHZhbHVlcy5wdXNoKFsuLi5uZXcgSGVhZGVycyhmZXRjaGVkLnJlcXVlc3RfaGVhZGVycyldLmpvaW4oJywnKSk7XG5cdFx0fVxuXG5cdFx0aWYgKGZldGNoZWQucmVxdWVzdF9ib2R5KSB7XG5cdFx0XHR2YWx1ZXMucHVzaChmZXRjaGVkLnJlcXVlc3RfYm9keSk7XG5cdFx0fVxuXG5cdFx0YXR0cnMucHVzaChgZGF0YS1oYXNoPVwiJHtoYXNoKC4uLnZhbHVlcyl9XCJgKTtcblx0fVxuXG5cdC8vIENvbXB1dGUgdGhlIHRpbWUgdGhlIHJlc3BvbnNlIHNob3VsZCBiZSBjYWNoZWQsIHRha2luZyBpbnRvIGFjY291bnQgbWF4LWFnZSBhbmQgYWdlLlxuXHQvLyBEbyBub3QgY2FjaGUgYXQgYWxsIGlmIGEgYFZhcnk6ICpgIGhlYWRlciBpcyBwcmVzZW50LCBhcyB0aGlzIGluZGljYXRlcyB0aGF0IHRoZVxuXHQvLyBjYWNoZSBpcyBsaWtlbHkgdG8gZ2V0IGJ1c3RlZC5cblx0aWYgKCFwcmVyZW5kZXJpbmcgJiYgZmV0Y2hlZC5tZXRob2QgPT09ICdHRVQnICYmIGNhY2hlX2NvbnRyb2wgJiYgIXZhcnlBbnkpIHtcblx0XHRjb25zdCBtYXRjaCA9IC9zLW1heGFnZT0oXFxkKykvZy5leGVjKGNhY2hlX2NvbnRyb2wpID8/IC9tYXgtYWdlPShcXGQrKS9nLmV4ZWMoY2FjaGVfY29udHJvbCk7XG5cdFx0aWYgKG1hdGNoKSB7XG5cdFx0XHRjb25zdCB0dGwgPSArbWF0Y2hbMV0gLSArKGFnZSA/PyAnMCcpO1xuXHRcdFx0YXR0cnMucHVzaChgZGF0YS10dGw9XCIke3R0bH1cImApO1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiBgPHNjcmlwdCAke2F0dHJzLmpvaW4oJyAnKX0+JHtzYWZlX3BheWxvYWR9PC9zY3JpcHQ+YDtcbn1cbiIsImV4cG9ydCBjb25zdCBzID0gSlNPTi5zdHJpbmdpZnk7XG4iLCJjb25zdCBlbmNvZGVyID0gbmV3IFRleHRFbmNvZGVyKCk7XG5cbi8qKlxuICogU0hBLTI1NiBoYXNoaW5nIGZ1bmN0aW9uIGFkYXB0ZWQgZnJvbSBodHRwczovL2JpdHdpc2VzaGlmdGxlZnQuZ2l0aHViLmlvL3NqY2xcbiAqIG1vZGlmaWVkIGFuZCByZWRpc3RyaWJ1dGVkIHVuZGVyIEJTRCBsaWNlbnNlXG4gKiBAcGFyYW0ge3N0cmluZ30gZGF0YVxuICovXG5leHBvcnQgZnVuY3Rpb24gc2hhMjU2KGRhdGEpIHtcblx0aWYgKCFrZXlbMF0pIHByZWNvbXB1dGUoKTtcblxuXHRjb25zdCBvdXQgPSBpbml0LnNsaWNlKDApO1xuXHRjb25zdCBhcnJheSA9IGVuY29kZShkYXRhKTtcblxuXHRmb3IgKGxldCBpID0gMDsgaSA8IGFycmF5Lmxlbmd0aDsgaSArPSAxNikge1xuXHRcdGNvbnN0IHcgPSBhcnJheS5zdWJhcnJheShpLCBpICsgMTYpO1xuXG5cdFx0bGV0IHRtcDtcblx0XHRsZXQgYTtcblx0XHRsZXQgYjtcblxuXHRcdGxldCBvdXQwID0gb3V0WzBdO1xuXHRcdGxldCBvdXQxID0gb3V0WzFdO1xuXHRcdGxldCBvdXQyID0gb3V0WzJdO1xuXHRcdGxldCBvdXQzID0gb3V0WzNdO1xuXHRcdGxldCBvdXQ0ID0gb3V0WzRdO1xuXHRcdGxldCBvdXQ1ID0gb3V0WzVdO1xuXHRcdGxldCBvdXQ2ID0gb3V0WzZdO1xuXHRcdGxldCBvdXQ3ID0gb3V0WzddO1xuXG5cdFx0LyogUmF0aW9uYWxlIGZvciBwbGFjZW1lbnQgb2YgfDAgOlxuXHRcdCAqIElmIGEgdmFsdWUgY2FuIG92ZXJmbG93IGlzIG9yaWdpbmFsIDMyIGJpdHMgYnkgYSBmYWN0b3Igb2YgbW9yZSB0aGFuIGEgZmV3XG5cdFx0ICogbWlsbGlvbiAoMl4yMyBpc2gpLCB0aGVyZSBpcyBhIHBvc3NpYmlsaXR5IHRoYXQgaXQgbWlnaHQgb3ZlcmZsb3cgdGhlXG5cdFx0ICogNTMtYml0IG1hbnRpc3NhIGFuZCBsb3NlIHByZWNpc2lvbi5cblx0XHQgKlxuXHRcdCAqIFRvIGF2b2lkIHRoaXMsIHdlIGNsYW1wIGJhY2sgdG8gMzIgYml0cyBieSB8J2luZyB3aXRoIDAgb24gYW55IHZhbHVlIHRoYXRcblx0XHQgKiBwcm9wYWdhdGVzIGFyb3VuZCB0aGUgbG9vcCwgYW5kIG9uIHRoZSBoYXNoIHN0YXRlIG91dFtdLiBJIGRvbid0IGJlbGlldmVcblx0XHQgKiB0aGF0IHRoZSBjbGFtcHMgb24gb3V0NCBhbmQgb24gb3V0MCBhcmUgc3RyaWN0bHkgbmVjZXNzYXJ5LCBidXQgaXQncyBjbG9zZVxuXHRcdCAqIChmb3Igb3V0NCBhbnl3YXkpLCBhbmQgYmV0dGVyIHNhZmUgdGhhbiBzb3JyeS5cblx0XHQgKlxuXHRcdCAqIFRoZSBjbGFtcHMgb24gb3V0W10gYXJlIG5lY2Vzc2FyeSBmb3IgdGhlIG91dHB1dCB0byBiZSBjb3JyZWN0IGV2ZW4gaW4gdGhlXG5cdFx0ICogY29tbW9uIGNhc2UgYW5kIGZvciBzaG9ydCBpbnB1dHMuXG5cdFx0ICovXG5cblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IDY0OyBpKyspIHtcblx0XHRcdC8vIGxvYWQgdXAgdGhlIGlucHV0IHdvcmQgZm9yIHRoaXMgcm91bmRcblxuXHRcdFx0aWYgKGkgPCAxNikge1xuXHRcdFx0XHR0bXAgPSB3W2ldO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0YSA9IHdbKGkgKyAxKSAmIDE1XTtcblxuXHRcdFx0XHRiID0gd1soaSArIDE0KSAmIDE1XTtcblxuXHRcdFx0XHR0bXAgPSB3W2kgJiAxNV0gPVxuXHRcdFx0XHRcdCgoKGEgPj4+IDcpIF4gKGEgPj4+IDE4KSBeIChhID4+PiAzKSBeIChhIDw8IDI1KSBeIChhIDw8IDE0KSkgK1xuXHRcdFx0XHRcdFx0KChiID4+PiAxNykgXiAoYiA+Pj4gMTkpIF4gKGIgPj4+IDEwKSBeIChiIDw8IDE1KSBeIChiIDw8IDEzKSkgK1xuXHRcdFx0XHRcdFx0d1tpICYgMTVdICtcblx0XHRcdFx0XHRcdHdbKGkgKyA5KSAmIDE1XSkgfFxuXHRcdFx0XHRcdDA7XG5cdFx0XHR9XG5cblx0XHRcdHRtcCA9XG5cdFx0XHRcdHRtcCArXG5cdFx0XHRcdG91dDcgK1xuXHRcdFx0XHQoKG91dDQgPj4+IDYpIF4gKG91dDQgPj4+IDExKSBeIChvdXQ0ID4+PiAyNSkgXiAob3V0NCA8PCAyNikgXiAob3V0NCA8PCAyMSkgXiAob3V0NCA8PCA3KSkgK1xuXHRcdFx0XHQob3V0NiBeIChvdXQ0ICYgKG91dDUgXiBvdXQ2KSkpICtcblx0XHRcdFx0a2V5W2ldOyAvLyB8IDA7XG5cblx0XHRcdC8vIHNoaWZ0IHJlZ2lzdGVyXG5cdFx0XHRvdXQ3ID0gb3V0Njtcblx0XHRcdG91dDYgPSBvdXQ1O1xuXHRcdFx0b3V0NSA9IG91dDQ7XG5cblx0XHRcdG91dDQgPSAob3V0MyArIHRtcCkgfCAwO1xuXG5cdFx0XHRvdXQzID0gb3V0Mjtcblx0XHRcdG91dDIgPSBvdXQxO1xuXHRcdFx0b3V0MSA9IG91dDA7XG5cblx0XHRcdG91dDAgPVxuXHRcdFx0XHQodG1wICtcblx0XHRcdFx0XHQoKG91dDEgJiBvdXQyKSBeIChvdXQzICYgKG91dDEgXiBvdXQyKSkpICtcblx0XHRcdFx0XHQoKG91dDEgPj4+IDIpIF5cblx0XHRcdFx0XHRcdChvdXQxID4+PiAxMykgXlxuXHRcdFx0XHRcdFx0KG91dDEgPj4+IDIyKSBeXG5cdFx0XHRcdFx0XHQob3V0MSA8PCAzMCkgXlxuXHRcdFx0XHRcdFx0KG91dDEgPDwgMTkpIF5cblx0XHRcdFx0XHRcdChvdXQxIDw8IDEwKSkpIHxcblx0XHRcdFx0MDtcblx0XHR9XG5cblx0XHRvdXRbMF0gPSAob3V0WzBdICsgb3V0MCkgfCAwO1xuXHRcdG91dFsxXSA9IChvdXRbMV0gKyBvdXQxKSB8IDA7XG5cdFx0b3V0WzJdID0gKG91dFsyXSArIG91dDIpIHwgMDtcblx0XHRvdXRbM10gPSAob3V0WzNdICsgb3V0MykgfCAwO1xuXHRcdG91dFs0XSA9IChvdXRbNF0gKyBvdXQ0KSB8IDA7XG5cdFx0b3V0WzVdID0gKG91dFs1XSArIG91dDUpIHwgMDtcblx0XHRvdXRbNl0gPSAob3V0WzZdICsgb3V0NikgfCAwO1xuXHRcdG91dFs3XSA9IChvdXRbN10gKyBvdXQ3KSB8IDA7XG5cdH1cblxuXHRjb25zdCBieXRlcyA9IG5ldyBVaW50OEFycmF5KG91dC5idWZmZXIpO1xuXHRyZXZlcnNlX2VuZGlhbm5lc3MoYnl0ZXMpO1xuXG5cdHJldHVybiBiYXNlNjQoYnl0ZXMpO1xufVxuXG4vKiogVGhlIFNIQS0yNTYgaW5pdGlhbGl6YXRpb24gdmVjdG9yICovXG5jb25zdCBpbml0ID0gbmV3IFVpbnQzMkFycmF5KDgpO1xuXG4vKiogVGhlIFNIQS0yNTYgaGFzaCBrZXkgKi9cbmNvbnN0IGtleSA9IG5ldyBVaW50MzJBcnJheSg2NCk7XG5cbi8qKiBGdW5jdGlvbiB0byBwcmVjb21wdXRlIGluaXQgYW5kIGtleS4gKi9cbmZ1bmN0aW9uIHByZWNvbXB1dGUoKSB7XG5cdC8qKiBAcGFyYW0ge251bWJlcn0geCAqL1xuXHRmdW5jdGlvbiBmcmFjKHgpIHtcblx0XHRyZXR1cm4gKHggLSBNYXRoLmZsb29yKHgpKSAqIDB4MTAwMDAwMDAwO1xuXHR9XG5cblx0bGV0IHByaW1lID0gMjtcblxuXHRmb3IgKGxldCBpID0gMDsgaSA8IDY0OyBwcmltZSsrKSB7XG5cdFx0bGV0IGlzX3ByaW1lID0gdHJ1ZTtcblxuXHRcdGZvciAobGV0IGZhY3RvciA9IDI7IGZhY3RvciAqIGZhY3RvciA8PSBwcmltZTsgZmFjdG9yKyspIHtcblx0XHRcdGlmIChwcmltZSAlIGZhY3RvciA9PT0gMCkge1xuXHRcdFx0XHRpc19wcmltZSA9IGZhbHNlO1xuXG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmIChpc19wcmltZSkge1xuXHRcdFx0aWYgKGkgPCA4KSB7XG5cdFx0XHRcdGluaXRbaV0gPSBmcmFjKHByaW1lICoqICgxIC8gMikpO1xuXHRcdFx0fVxuXG5cdFx0XHRrZXlbaV0gPSBmcmFjKHByaW1lICoqICgxIC8gMykpO1xuXG5cdFx0XHRpKys7XG5cdFx0fVxuXHR9XG59XG5cbi8qKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IGJ5dGVzICovXG5mdW5jdGlvbiByZXZlcnNlX2VuZGlhbm5lc3MoYnl0ZXMpIHtcblx0Zm9yIChsZXQgaSA9IDA7IGkgPCBieXRlcy5sZW5ndGg7IGkgKz0gNCkge1xuXHRcdGNvbnN0IGEgPSBieXRlc1tpICsgMF07XG5cdFx0Y29uc3QgYiA9IGJ5dGVzW2kgKyAxXTtcblx0XHRjb25zdCBjID0gYnl0ZXNbaSArIDJdO1xuXHRcdGNvbnN0IGQgPSBieXRlc1tpICsgM107XG5cblx0XHRieXRlc1tpICsgMF0gPSBkO1xuXHRcdGJ5dGVzW2kgKyAxXSA9IGM7XG5cdFx0Ynl0ZXNbaSArIDJdID0gYjtcblx0XHRieXRlc1tpICsgM10gPSBhO1xuXHR9XG59XG5cbi8qKiBAcGFyYW0ge3N0cmluZ30gc3RyICovXG5mdW5jdGlvbiBlbmNvZGUoc3RyKSB7XG5cdGNvbnN0IGVuY29kZWQgPSBlbmNvZGVyLmVuY29kZShzdHIpO1xuXHRjb25zdCBsZW5ndGggPSBlbmNvZGVkLmxlbmd0aCAqIDg7XG5cblx0Ly8gcmVzdWx0IHNob3VsZCBiZSBhIG11bHRpcGxlIG9mIDUxMiBiaXRzIGluIGxlbmd0aCxcblx0Ly8gd2l0aCByb29tIGZvciBhIDEgKGFmdGVyIHRoZSBkYXRhKSBhbmQgdHdvIDMyLWJpdFxuXHQvLyB3b3JkcyBjb250YWluaW5nIHRoZSBvcmlnaW5hbCBpbnB1dCBiaXQgbGVuZ3RoXG5cdGNvbnN0IHNpemUgPSA1MTIgKiBNYXRoLmNlaWwoKGxlbmd0aCArIDY1KSAvIDUxMik7XG5cdGNvbnN0IGJ5dGVzID0gbmV3IFVpbnQ4QXJyYXkoc2l6ZSAvIDgpO1xuXHRieXRlcy5zZXQoZW5jb2RlZCk7XG5cblx0Ly8gYXBwZW5kIGEgMVxuXHRieXRlc1tlbmNvZGVkLmxlbmd0aF0gPSAwYjEwMDAwMDAwO1xuXG5cdHJldmVyc2VfZW5kaWFubmVzcyhieXRlcyk7XG5cblx0Ly8gYWRkIHRoZSBpbnB1dCBiaXQgbGVuZ3RoXG5cdGNvbnN0IHdvcmRzID0gbmV3IFVpbnQzMkFycmF5KGJ5dGVzLmJ1ZmZlcik7XG5cdHdvcmRzW3dvcmRzLmxlbmd0aCAtIDJdID0gTWF0aC5mbG9vcihsZW5ndGggLyAweDEwMDAwMDAwMCk7IC8vIHRoaXMgd2lsbCBhbHdheXMgYmUgemVybyBmb3IgdXNcblx0d29yZHNbd29yZHMubGVuZ3RoIC0gMV0gPSBsZW5ndGg7XG5cblx0cmV0dXJuIHdvcmRzO1xufVxuXG4vKlxuXHRCYXNlZCBvbiBodHRwczovL2dpc3QuZ2l0aHViLmNvbS9lbmVwb21ueWFzY2hpaC83MmM0MjNmNzI3ZDM5NWVlYWEwOTY5NzA1ODIzODcyN1xuXG5cdE1JVCBMaWNlbnNlXG5cdENvcHlyaWdodCAoYykgMjAyMCBFZ29yIE5lcG9tbnlhc2NoaWhcblx0UGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuXHRvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG5cdGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcblx0dG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuXHRjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcblx0ZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcblx0VGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW4gYWxsXG5cdGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG5cdFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1Jcblx0SU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG5cdEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuXHRBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG5cdExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG5cdE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFXG5cdFNPRlRXQVJFLlxuKi9cbmNvbnN0IGNoYXJzID0gJ0FCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXowMTIzNDU2Nzg5Ky8nLnNwbGl0KCcnKTtcblxuLyoqIEBwYXJhbSB7VWludDhBcnJheX0gYnl0ZXMgKi9cbmV4cG9ydCBmdW5jdGlvbiBiYXNlNjQoYnl0ZXMpIHtcblx0Y29uc3QgbCA9IGJ5dGVzLmxlbmd0aDtcblxuXHRsZXQgcmVzdWx0ID0gJyc7XG5cdGxldCBpO1xuXG5cdGZvciAoaSA9IDI7IGkgPCBsOyBpICs9IDMpIHtcblx0XHRyZXN1bHQgKz0gY2hhcnNbYnl0ZXNbaSAtIDJdID4+IDJdO1xuXHRcdHJlc3VsdCArPSBjaGFyc1soKGJ5dGVzW2kgLSAyXSAmIDB4MDMpIDw8IDQpIHwgKGJ5dGVzW2kgLSAxXSA+PiA0KV07XG5cdFx0cmVzdWx0ICs9IGNoYXJzWygoYnl0ZXNbaSAtIDFdICYgMHgwZikgPDwgMikgfCAoYnl0ZXNbaV0gPj4gNildO1xuXHRcdHJlc3VsdCArPSBjaGFyc1tieXRlc1tpXSAmIDB4M2ZdO1xuXHR9XG5cblx0aWYgKGkgPT09IGwgKyAxKSB7XG5cdFx0Ly8gMSBvY3RldCB5ZXQgdG8gd3JpdGVcblx0XHRyZXN1bHQgKz0gY2hhcnNbYnl0ZXNbaSAtIDJdID4+IDJdO1xuXHRcdHJlc3VsdCArPSBjaGFyc1soYnl0ZXNbaSAtIDJdICYgMHgwMykgPDwgNF07XG5cdFx0cmVzdWx0ICs9ICc9PSc7XG5cdH1cblxuXHRpZiAoaSA9PT0gbCkge1xuXHRcdC8vIDIgb2N0ZXRzIHlldCB0byB3cml0ZVxuXHRcdHJlc3VsdCArPSBjaGFyc1tieXRlc1tpIC0gMl0gPj4gMl07XG5cdFx0cmVzdWx0ICs9IGNoYXJzWygoYnl0ZXNbaSAtIDJdICYgMHgwMykgPDwgNCkgfCAoYnl0ZXNbaSAtIDFdID4+IDQpXTtcblx0XHRyZXN1bHQgKz0gY2hhcnNbKGJ5dGVzW2kgLSAxXSAmIDB4MGYpIDw8IDJdO1xuXHRcdHJlc3VsdCArPSAnPSc7XG5cdH1cblxuXHRyZXR1cm4gcmVzdWx0O1xufVxuIiwiaW1wb3J0IHsgZXNjYXBlX2h0bWxfYXR0ciB9IGZyb20gJy4uLy4uLy4uL3V0aWxzL2VzY2FwZS5qcyc7XG5pbXBvcnQgeyBiYXNlNjQsIHNoYTI1NiB9IGZyb20gJy4vY3J5cHRvLmpzJztcblxuY29uc3QgYXJyYXkgPSBuZXcgVWludDhBcnJheSgxNik7XG5cbmZ1bmN0aW9uIGdlbmVyYXRlX25vbmNlKCkge1xuXHRjcnlwdG8uZ2V0UmFuZG9tVmFsdWVzKGFycmF5KTtcblx0cmV0dXJuIGJhc2U2NChhcnJheSk7XG59XG5cbmNvbnN0IHF1b3RlZCA9IG5ldyBTZXQoW1xuXHQnc2VsZicsXG5cdCd1bnNhZmUtZXZhbCcsXG5cdCd1bnNhZmUtaGFzaGVzJyxcblx0J3Vuc2FmZS1pbmxpbmUnLFxuXHQnbm9uZScsXG5cdCdzdHJpY3QtZHluYW1pYycsXG5cdCdyZXBvcnQtc2FtcGxlJyxcblx0J3dhc20tdW5zYWZlLWV2YWwnLFxuXHQnc2NyaXB0J1xuXSk7XG5cbmNvbnN0IGNyeXB0b19wYXR0ZXJuID0gL14obm9uY2V8c2hhXFxkXFxkXFxkKS0vO1xuXG4vLyBDU1AgYW5kIENTUCBSZXBvcnQgT25seSBhcmUgZXh0cmVtZWx5IHNpbWlsYXIgd2l0aCBhIGZldyBjYXZlYXRzXG4vLyB0aGUgZWFzaWVzdC9EUlllc3Qgd2F5IHRvIGV4cHJlc3MgdGhpcyBpcyB3aXRoIHNvbWUgcHJpdmF0ZSBlbmNhcHN1bGF0aW9uXG5jbGFzcyBCYXNlUHJvdmlkZXIge1xuXHQvKiogQHR5cGUge2Jvb2xlYW59ICovXG5cdCN1c2VfaGFzaGVzO1xuXG5cdC8qKiBAdHlwZSB7Ym9vbGVhbn0gKi9cblx0I3NjcmlwdF9uZWVkc19jc3A7XG5cblx0LyoqIEB0eXBlIHtib29sZWFufSAqL1xuXHQjc3R5bGVfbmVlZHNfY3NwO1xuXG5cdC8qKiBAdHlwZSB7aW1wb3J0KCd0eXBlcycpLkNzcERpcmVjdGl2ZXN9ICovXG5cdCNkaXJlY3RpdmVzO1xuXG5cdC8qKiBAdHlwZSB7aW1wb3J0KCd0eXBlcycpLkNzcC5Tb3VyY2VbXX0gKi9cblx0I3NjcmlwdF9zcmM7XG5cblx0LyoqIEB0eXBlIHtpbXBvcnQoJ3R5cGVzJykuQ3NwLlNvdXJjZVtdfSAqL1xuXHQjc2NyaXB0X3NyY19lbGVtO1xuXG5cdC8qKiBAdHlwZSB7aW1wb3J0KCd0eXBlcycpLkNzcC5Tb3VyY2VbXX0gKi9cblx0I3N0eWxlX3NyYztcblxuXHQvKiogQHR5cGUge2ltcG9ydCgndHlwZXMnKS5Dc3AuU291cmNlW119ICovXG5cdCNzdHlsZV9zcmNfYXR0cjtcblxuXHQvKiogQHR5cGUge2ltcG9ydCgndHlwZXMnKS5Dc3AuU291cmNlW119ICovXG5cdCNzdHlsZV9zcmNfZWxlbTtcblxuXHQvKiogQHR5cGUge3N0cmluZ30gKi9cblx0I25vbmNlO1xuXG5cdC8qKlxuXHQgKiBAcGFyYW0ge2Jvb2xlYW59IHVzZV9oYXNoZXNcblx0ICogQHBhcmFtIHtpbXBvcnQoJ3R5cGVzJykuQ3NwRGlyZWN0aXZlc30gZGlyZWN0aXZlc1xuXHQgKiBAcGFyYW0ge3N0cmluZ30gbm9uY2Vcblx0ICovXG5cdGNvbnN0cnVjdG9yKHVzZV9oYXNoZXMsIGRpcmVjdGl2ZXMsIG5vbmNlKSB7XG5cdFx0dGhpcy4jdXNlX2hhc2hlcyA9IHVzZV9oYXNoZXM7XG5cdFx0dGhpcy4jZGlyZWN0aXZlcyA9IF9fU1ZFTFRFS0lUX0RFVl9fID8geyAuLi5kaXJlY3RpdmVzIH0gOiBkaXJlY3RpdmVzOyAvLyBjbG9uZSBpbiBkZXYgc28gd2UgY2FuIHNhZmVseSBtdXRhdGVcblxuXHRcdGNvbnN0IGQgPSB0aGlzLiNkaXJlY3RpdmVzO1xuXG5cdFx0dGhpcy4jc2NyaXB0X3NyYyA9IFtdO1xuXHRcdHRoaXMuI3NjcmlwdF9zcmNfZWxlbSA9IFtdO1xuXHRcdHRoaXMuI3N0eWxlX3NyYyA9IFtdO1xuXHRcdHRoaXMuI3N0eWxlX3NyY19hdHRyID0gW107XG5cdFx0dGhpcy4jc3R5bGVfc3JjX2VsZW0gPSBbXTtcblxuXHRcdGNvbnN0IGVmZmVjdGl2ZV9zY3JpcHRfc3JjID0gZFsnc2NyaXB0LXNyYyddIHx8IGRbJ2RlZmF1bHQtc3JjJ107XG5cdFx0Y29uc3Qgc2NyaXB0X3NyY19lbGVtID0gZFsnc2NyaXB0LXNyYy1lbGVtJ107XG5cdFx0Y29uc3QgZWZmZWN0aXZlX3N0eWxlX3NyYyA9IGRbJ3N0eWxlLXNyYyddIHx8IGRbJ2RlZmF1bHQtc3JjJ107XG5cdFx0Y29uc3Qgc3R5bGVfc3JjX2F0dHIgPSBkWydzdHlsZS1zcmMtYXR0ciddO1xuXHRcdGNvbnN0IHN0eWxlX3NyY19lbGVtID0gZFsnc3R5bGUtc3JjLWVsZW0nXTtcblxuXHRcdGlmIChfX1NWRUxURUtJVF9ERVZfXykge1xuXHRcdFx0Ly8gcmVtb3ZlIHN0cmljdC1keW5hbWljIGluIGRldi4uLlxuXHRcdFx0Ly8gVE9ETyByZWluc3RhdGUgdGhpcyBpZiB3ZSBjYW4gZmlndXJlIG91dCBob3cgdG8gbWFrZSBzdHJpY3QtZHluYW1pYyB3b3JrXG5cdFx0XHQvLyBpZiAoZFsnZGVmYXVsdC1zcmMnXSkge1xuXHRcdFx0Ly8gXHRkWydkZWZhdWx0LXNyYyddID0gZFsnZGVmYXVsdC1zcmMnXS5maWx0ZXIoKG5hbWUpID0+IG5hbWUgIT09ICdzdHJpY3QtZHluYW1pYycpO1xuXHRcdFx0Ly8gXHRpZiAoZFsnZGVmYXVsdC1zcmMnXS5sZW5ndGggPT09IDApIGRlbGV0ZSBkWydkZWZhdWx0LXNyYyddO1xuXHRcdFx0Ly8gfVxuXG5cdFx0XHQvLyBpZiAoZFsnc2NyaXB0LXNyYyddKSB7XG5cdFx0XHQvLyBcdGRbJ3NjcmlwdC1zcmMnXSA9IGRbJ3NjcmlwdC1zcmMnXS5maWx0ZXIoKG5hbWUpID0+IG5hbWUgIT09ICdzdHJpY3QtZHluYW1pYycpO1xuXHRcdFx0Ly8gXHRpZiAoZFsnc2NyaXB0LXNyYyddLmxlbmd0aCA9PT0gMCkgZGVsZXRlIGRbJ3NjcmlwdC1zcmMnXTtcblx0XHRcdC8vIH1cblxuXHRcdFx0Ly8gLi4uYW5kIGFkZCB1bnNhZmUtaW5saW5lIHNvIHdlIGNhbiBpbmplY3QgPHN0eWxlPiBlbGVtZW50c1xuXHRcdFx0Ly8gTm90ZSB0aGF0ICd1bnNhZmUtaW5saW5lJyBpcyBpZ25vcmVkIGlmIGVpdGhlciBhIGhhc2ggb3Igbm9uY2UgdmFsdWUgaXMgcHJlc2VudCBpbiB0aGUgc291cmNlIGxpc3QsIHNvIHdlIHJlbW92ZSB0aG9zZSBkdXJpbmcgZGV2IHdoZW4gaW5qZWN0aW5nIHVuc2FmZS1pbmxpbmVcblx0XHRcdGlmIChlZmZlY3RpdmVfc3R5bGVfc3JjICYmICFlZmZlY3RpdmVfc3R5bGVfc3JjLmluY2x1ZGVzKCd1bnNhZmUtaW5saW5lJykpIHtcblx0XHRcdFx0ZFsnc3R5bGUtc3JjJ10gPSBbXG5cdFx0XHRcdFx0Li4uZWZmZWN0aXZlX3N0eWxlX3NyYy5maWx0ZXIoXG5cdFx0XHRcdFx0XHQodmFsdWUpID0+ICEodmFsdWUuc3RhcnRzV2l0aCgnc2hhMjU2LScpIHx8IHZhbHVlLnN0YXJ0c1dpdGgoJ25vbmNlLScpKVxuXHRcdFx0XHRcdCksXG5cdFx0XHRcdFx0J3Vuc2FmZS1pbmxpbmUnXG5cdFx0XHRcdF07XG5cdFx0XHR9XG5cblx0XHRcdGlmIChzdHlsZV9zcmNfYXR0ciAmJiAhc3R5bGVfc3JjX2F0dHIuaW5jbHVkZXMoJ3Vuc2FmZS1pbmxpbmUnKSkge1xuXHRcdFx0XHRkWydzdHlsZS1zcmMtYXR0ciddID0gW1xuXHRcdFx0XHRcdC4uLnN0eWxlX3NyY19hdHRyLmZpbHRlcihcblx0XHRcdFx0XHRcdCh2YWx1ZSkgPT4gISh2YWx1ZS5zdGFydHNXaXRoKCdzaGEyNTYtJykgfHwgdmFsdWUuc3RhcnRzV2l0aCgnbm9uY2UtJykpXG5cdFx0XHRcdFx0KSxcblx0XHRcdFx0XHQndW5zYWZlLWlubGluZSdcblx0XHRcdFx0XTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKHN0eWxlX3NyY19lbGVtICYmICFzdHlsZV9zcmNfZWxlbS5pbmNsdWRlcygndW5zYWZlLWlubGluZScpKSB7XG5cdFx0XHRcdGRbJ3N0eWxlLXNyYy1lbGVtJ10gPSBbXG5cdFx0XHRcdFx0Li4uc3R5bGVfc3JjX2VsZW0uZmlsdGVyKFxuXHRcdFx0XHRcdFx0KHZhbHVlKSA9PiAhKHZhbHVlLnN0YXJ0c1dpdGgoJ3NoYTI1Ni0nKSB8fCB2YWx1ZS5zdGFydHNXaXRoKCdub25jZS0nKSlcblx0XHRcdFx0XHQpLFxuXHRcdFx0XHRcdCd1bnNhZmUtaW5saW5lJ1xuXHRcdFx0XHRdO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHRoaXMuI3NjcmlwdF9uZWVkc19jc3AgPVxuXHRcdFx0KCEhZWZmZWN0aXZlX3NjcmlwdF9zcmMgJiZcblx0XHRcdFx0ZWZmZWN0aXZlX3NjcmlwdF9zcmMuZmlsdGVyKCh2YWx1ZSkgPT4gdmFsdWUgIT09ICd1bnNhZmUtaW5saW5lJykubGVuZ3RoID4gMCkgfHxcblx0XHRcdCghIXNjcmlwdF9zcmNfZWxlbSAmJlxuXHRcdFx0XHRzY3JpcHRfc3JjX2VsZW0uZmlsdGVyKCh2YWx1ZSkgPT4gdmFsdWUgIT09ICd1bnNhZmUtaW5saW5lJykubGVuZ3RoID4gMCk7XG5cblx0XHR0aGlzLiNzdHlsZV9uZWVkc19jc3AgPVxuXHRcdFx0IV9fU1ZFTFRFS0lUX0RFVl9fICYmXG5cdFx0XHQoKCEhZWZmZWN0aXZlX3N0eWxlX3NyYyAmJlxuXHRcdFx0XHRlZmZlY3RpdmVfc3R5bGVfc3JjLmZpbHRlcigodmFsdWUpID0+IHZhbHVlICE9PSAndW5zYWZlLWlubGluZScpLmxlbmd0aCA+IDApIHx8XG5cdFx0XHRcdCghIXN0eWxlX3NyY19hdHRyICYmXG5cdFx0XHRcdFx0c3R5bGVfc3JjX2F0dHIuZmlsdGVyKCh2YWx1ZSkgPT4gdmFsdWUgIT09ICd1bnNhZmUtaW5saW5lJykubGVuZ3RoID4gMCkgfHxcblx0XHRcdFx0KCEhc3R5bGVfc3JjX2VsZW0gJiZcblx0XHRcdFx0XHRzdHlsZV9zcmNfZWxlbS5maWx0ZXIoKHZhbHVlKSA9PiB2YWx1ZSAhPT0gJ3Vuc2FmZS1pbmxpbmUnKS5sZW5ndGggPiAwKSk7XG5cblx0XHR0aGlzLnNjcmlwdF9uZWVkc19ub25jZSA9IHRoaXMuI3NjcmlwdF9uZWVkc19jc3AgJiYgIXRoaXMuI3VzZV9oYXNoZXM7XG5cdFx0dGhpcy5zdHlsZV9uZWVkc19ub25jZSA9IHRoaXMuI3N0eWxlX25lZWRzX2NzcCAmJiAhdGhpcy4jdXNlX2hhc2hlcztcblx0XHR0aGlzLiNub25jZSA9IG5vbmNlO1xuXHR9XG5cblx0LyoqIEBwYXJhbSB7c3RyaW5nfSBjb250ZW50ICovXG5cdGFkZF9zY3JpcHQoY29udGVudCkge1xuXHRcdGlmICh0aGlzLiNzY3JpcHRfbmVlZHNfY3NwKSB7XG5cdFx0XHRjb25zdCBkID0gdGhpcy4jZGlyZWN0aXZlcztcblxuXHRcdFx0aWYgKHRoaXMuI3VzZV9oYXNoZXMpIHtcblx0XHRcdFx0Y29uc3QgaGFzaCA9IHNoYTI1Nihjb250ZW50KTtcblxuXHRcdFx0XHR0aGlzLiNzY3JpcHRfc3JjLnB1c2goYHNoYTI1Ni0ke2hhc2h9YCk7XG5cblx0XHRcdFx0aWYgKGRbJ3NjcmlwdC1zcmMtZWxlbSddPy5sZW5ndGgpIHtcblx0XHRcdFx0XHR0aGlzLiNzY3JpcHRfc3JjX2VsZW0ucHVzaChgc2hhMjU2LSR7aGFzaH1gKTtcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0aWYgKHRoaXMuI3NjcmlwdF9zcmMubGVuZ3RoID09PSAwKSB7XG5cdFx0XHRcdFx0dGhpcy4jc2NyaXB0X3NyYy5wdXNoKGBub25jZS0ke3RoaXMuI25vbmNlfWApO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmIChkWydzY3JpcHQtc3JjLWVsZW0nXT8ubGVuZ3RoKSB7XG5cdFx0XHRcdFx0dGhpcy4jc2NyaXB0X3NyY19lbGVtLnB1c2goYG5vbmNlLSR7dGhpcy4jbm9uY2V9YCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHQvKiogQHBhcmFtIHtzdHJpbmd9IGNvbnRlbnQgKi9cblx0YWRkX3N0eWxlKGNvbnRlbnQpIHtcblx0XHRpZiAodGhpcy4jc3R5bGVfbmVlZHNfY3NwKSB7XG5cdFx0XHQvLyB0aGlzIGlzIHRoZSBoYXNoIGZvciBcIi8qIGVtcHR5ICovXCJcblx0XHRcdC8vIGFkZGluZyBpdCBzbyB0aGF0IHN2ZWx0ZSBkb2VzIG5vdCBicmVhayBjc3Bcblx0XHRcdC8vIHNlZSBodHRwczovL2dpdGh1Yi5jb20vc3ZlbHRlanMvc3ZlbHRlL3B1bGwvNzgwMFxuXHRcdFx0Y29uc3QgZW1wdHlfY29tbWVudF9oYXNoID0gJzlPbE5PMERORWVhVnpITDRSWndDTHNCSEE4V0JROHRvQnAvNEY1WFYybmM9JztcblxuXHRcdFx0Y29uc3QgZCA9IHRoaXMuI2RpcmVjdGl2ZXM7XG5cblx0XHRcdGlmICh0aGlzLiN1c2VfaGFzaGVzKSB7XG5cdFx0XHRcdGNvbnN0IGhhc2ggPSBzaGEyNTYoY29udGVudCk7XG5cblx0XHRcdFx0dGhpcy4jc3R5bGVfc3JjLnB1c2goYHNoYTI1Ni0ke2hhc2h9YCk7XG5cblx0XHRcdFx0aWYgKGRbJ3N0eWxlLXNyYy1hdHRyJ10/Lmxlbmd0aCkge1xuXHRcdFx0XHRcdHRoaXMuI3N0eWxlX3NyY19hdHRyLnB1c2goYHNoYTI1Ni0ke2hhc2h9YCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKGRbJ3N0eWxlLXNyYy1lbGVtJ10/Lmxlbmd0aCkge1xuXHRcdFx0XHRcdGlmIChcblx0XHRcdFx0XHRcdGhhc2ggIT09IGVtcHR5X2NvbW1lbnRfaGFzaCAmJlxuXHRcdFx0XHRcdFx0IWRbJ3N0eWxlLXNyYy1lbGVtJ10uaW5jbHVkZXMoYHNoYTI1Ni0ke2VtcHR5X2NvbW1lbnRfaGFzaH1gKVxuXHRcdFx0XHRcdCkge1xuXHRcdFx0XHRcdFx0dGhpcy4jc3R5bGVfc3JjX2VsZW0ucHVzaChgc2hhMjU2LSR7ZW1wdHlfY29tbWVudF9oYXNofWApO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHRoaXMuI3N0eWxlX3NyY19lbGVtLnB1c2goYHNoYTI1Ni0ke2hhc2h9YCk7XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGlmICh0aGlzLiNzdHlsZV9zcmMubGVuZ3RoID09PSAwICYmICFkWydzdHlsZS1zcmMnXT8uaW5jbHVkZXMoJ3Vuc2FmZS1pbmxpbmUnKSkge1xuXHRcdFx0XHRcdHRoaXMuI3N0eWxlX3NyYy5wdXNoKGBub25jZS0ke3RoaXMuI25vbmNlfWApO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmIChkWydzdHlsZS1zcmMtYXR0ciddPy5sZW5ndGgpIHtcblx0XHRcdFx0XHR0aGlzLiNzdHlsZV9zcmNfYXR0ci5wdXNoKGBub25jZS0ke3RoaXMuI25vbmNlfWApO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmIChkWydzdHlsZS1zcmMtZWxlbSddPy5sZW5ndGgpIHtcblx0XHRcdFx0XHRpZiAoIWRbJ3N0eWxlLXNyYy1lbGVtJ10uaW5jbHVkZXMoYHNoYTI1Ni0ke2VtcHR5X2NvbW1lbnRfaGFzaH1gKSkge1xuXHRcdFx0XHRcdFx0dGhpcy4jc3R5bGVfc3JjX2VsZW0ucHVzaChgc2hhMjU2LSR7ZW1wdHlfY29tbWVudF9oYXNofWApO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHRoaXMuI3N0eWxlX3NyY19lbGVtLnB1c2goYG5vbmNlLSR7dGhpcy4jbm9uY2V9YCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogQHBhcmFtIHtib29sZWFufSBbaXNfbWV0YV1cblx0ICovXG5cdGdldF9oZWFkZXIoaXNfbWV0YSA9IGZhbHNlKSB7XG5cdFx0Y29uc3QgaGVhZGVyID0gW107XG5cblx0XHQvLyBkdWUgdG8gYnJvd3NlciBpbmNvbnNpc3RlbmNpZXMsIHdlIGNhbid0IGFwcGVuZCBzb3VyY2VzIHRvIGRlZmF1bHQtc3JjXG5cdFx0Ly8gKHNwZWNpZmljYWxseSwgRmlyZWZveCBhcHBlYXJzIHRvIG5vdCBpZ25vcmUgbm9uY2Ute25vbmNlfSBkaXJlY3RpdmVzXG5cdFx0Ly8gb24gZGVmYXVsdC1zcmMpLCBzbyB3ZSBlbnN1cmUgdGhhdCBzY3JpcHQtc3JjIGFuZCBzdHlsZS1zcmMgZXhpc3RcblxuXHRcdGNvbnN0IGRpcmVjdGl2ZXMgPSB7IC4uLnRoaXMuI2RpcmVjdGl2ZXMgfTtcblxuXHRcdGlmICh0aGlzLiNzdHlsZV9zcmMubGVuZ3RoID4gMCkge1xuXHRcdFx0ZGlyZWN0aXZlc1snc3R5bGUtc3JjJ10gPSBbXG5cdFx0XHRcdC4uLihkaXJlY3RpdmVzWydzdHlsZS1zcmMnXSB8fCBkaXJlY3RpdmVzWydkZWZhdWx0LXNyYyddIHx8IFtdKSxcblx0XHRcdFx0Li4udGhpcy4jc3R5bGVfc3JjXG5cdFx0XHRdO1xuXHRcdH1cblxuXHRcdGlmICh0aGlzLiNzdHlsZV9zcmNfYXR0ci5sZW5ndGggPiAwKSB7XG5cdFx0XHRkaXJlY3RpdmVzWydzdHlsZS1zcmMtYXR0ciddID0gW1xuXHRcdFx0XHQuLi4oZGlyZWN0aXZlc1snc3R5bGUtc3JjLWF0dHInXSB8fCBbXSksXG5cdFx0XHRcdC4uLnRoaXMuI3N0eWxlX3NyY19hdHRyXG5cdFx0XHRdO1xuXHRcdH1cblxuXHRcdGlmICh0aGlzLiNzdHlsZV9zcmNfZWxlbS5sZW5ndGggPiAwKSB7XG5cdFx0XHRkaXJlY3RpdmVzWydzdHlsZS1zcmMtZWxlbSddID0gW1xuXHRcdFx0XHQuLi4oZGlyZWN0aXZlc1snc3R5bGUtc3JjLWVsZW0nXSB8fCBbXSksXG5cdFx0XHRcdC4uLnRoaXMuI3N0eWxlX3NyY19lbGVtXG5cdFx0XHRdO1xuXHRcdH1cblxuXHRcdGlmICh0aGlzLiNzY3JpcHRfc3JjLmxlbmd0aCA+IDApIHtcblx0XHRcdGRpcmVjdGl2ZXNbJ3NjcmlwdC1zcmMnXSA9IFtcblx0XHRcdFx0Li4uKGRpcmVjdGl2ZXNbJ3NjcmlwdC1zcmMnXSB8fCBkaXJlY3RpdmVzWydkZWZhdWx0LXNyYyddIHx8IFtdKSxcblx0XHRcdFx0Li4udGhpcy4jc2NyaXB0X3NyY1xuXHRcdFx0XTtcblx0XHR9XG5cblx0XHRpZiAodGhpcy4jc2NyaXB0X3NyY19lbGVtLmxlbmd0aCA+IDApIHtcblx0XHRcdGRpcmVjdGl2ZXNbJ3NjcmlwdC1zcmMtZWxlbSddID0gW1xuXHRcdFx0XHQuLi4oZGlyZWN0aXZlc1snc2NyaXB0LXNyYy1lbGVtJ10gfHwgW10pLFxuXHRcdFx0XHQuLi50aGlzLiNzY3JpcHRfc3JjX2VsZW1cblx0XHRcdF07XG5cdFx0fVxuXG5cdFx0Zm9yIChjb25zdCBrZXkgaW4gZGlyZWN0aXZlcykge1xuXHRcdFx0aWYgKGlzX21ldGEgJiYgKGtleSA9PT0gJ2ZyYW1lLWFuY2VzdG9ycycgfHwga2V5ID09PSAncmVwb3J0LXVyaScgfHwga2V5ID09PSAnc2FuZGJveCcpKSB7XG5cdFx0XHRcdC8vIHRoZXNlIHZhbHVlcyBjYW5ub3QgYmUgdXNlZCB3aXRoIGEgPG1ldGE+IHRhZ1xuXHRcdFx0XHQvLyBUT0RPIHdhcm4/XG5cdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBAdHMtZXhwZWN0LWVycm9yIGdpbW1lIGEgYnJlYWsgdHlwZXNjcmlwdCwgYGtleWAgaXMgb2J2aW91c2x5IGEgbWVtYmVyIG9mIGludGVybmFsX2RpcmVjdGl2ZXNcblx0XHRcdGNvbnN0IHZhbHVlID0gLyoqIEB0eXBlIHtzdHJpbmdbXSB8IHRydWV9ICovIChkaXJlY3RpdmVzW2tleV0pO1xuXG5cdFx0XHRpZiAoIXZhbHVlKSBjb250aW51ZTtcblxuXHRcdFx0Y29uc3QgZGlyZWN0aXZlID0gW2tleV07XG5cdFx0XHRpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcblx0XHRcdFx0dmFsdWUuZm9yRWFjaCgodmFsdWUpID0+IHtcblx0XHRcdFx0XHRpZiAocXVvdGVkLmhhcyh2YWx1ZSkgfHwgY3J5cHRvX3BhdHRlcm4udGVzdCh2YWx1ZSkpIHtcblx0XHRcdFx0XHRcdGRpcmVjdGl2ZS5wdXNoKGAnJHt2YWx1ZX0nYCk7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGRpcmVjdGl2ZS5wdXNoKHZhbHVlKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXG5cdFx0XHRoZWFkZXIucHVzaChkaXJlY3RpdmUuam9pbignICcpKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gaGVhZGVyLmpvaW4oJzsgJyk7XG5cdH1cbn1cblxuY2xhc3MgQ3NwUHJvdmlkZXIgZXh0ZW5kcyBCYXNlUHJvdmlkZXIge1xuXHRnZXRfbWV0YSgpIHtcblx0XHRjb25zdCBjb250ZW50ID0gdGhpcy5nZXRfaGVhZGVyKHRydWUpO1xuXG5cdFx0aWYgKCFjb250ZW50KSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGA8bWV0YSBodHRwLWVxdWl2PVwiY29udGVudC1zZWN1cml0eS1wb2xpY3lcIiBjb250ZW50PSR7ZXNjYXBlX2h0bWxfYXR0cihjb250ZW50KX0+YDtcblx0fVxufVxuXG5jbGFzcyBDc3BSZXBvcnRPbmx5UHJvdmlkZXIgZXh0ZW5kcyBCYXNlUHJvdmlkZXIge1xuXHQvKipcblx0ICogQHBhcmFtIHtib29sZWFufSB1c2VfaGFzaGVzXG5cdCAqIEBwYXJhbSB7aW1wb3J0KCd0eXBlcycpLkNzcERpcmVjdGl2ZXN9IGRpcmVjdGl2ZXNcblx0ICogQHBhcmFtIHtzdHJpbmd9IG5vbmNlXG5cdCAqL1xuXHRjb25zdHJ1Y3Rvcih1c2VfaGFzaGVzLCBkaXJlY3RpdmVzLCBub25jZSkge1xuXHRcdHN1cGVyKHVzZV9oYXNoZXMsIGRpcmVjdGl2ZXMsIG5vbmNlKTtcblxuXHRcdGlmIChPYmplY3QudmFsdWVzKGRpcmVjdGl2ZXMpLmZpbHRlcigodikgPT4gISF2KS5sZW5ndGggPiAwKSB7XG5cdFx0XHQvLyBJZiB3ZSdyZSBnZW5lcmF0aW5nIGNvbnRlbnQtc2VjdXJpdHktcG9saWN5LXJlcG9ydC1vbmx5LFxuXHRcdFx0Ly8gaWYgdGhlcmUgYXJlIGFueSBkaXJlY3RpdmVzLCB3ZSBuZWVkIGEgcmVwb3J0LXVyaSBvciByZXBvcnQtdG8gKG9yIGJvdGgpXG5cdFx0XHQvLyBlbHNlIGl0J3MganVzdCBhbiBleHBlbnNpdmUgbm9vcC5cblx0XHRcdGNvbnN0IGhhc19yZXBvcnRfdG8gPSBkaXJlY3RpdmVzWydyZXBvcnQtdG8nXT8ubGVuZ3RoID8/IDAgPiAwO1xuXHRcdFx0Y29uc3QgaGFzX3JlcG9ydF91cmkgPSBkaXJlY3RpdmVzWydyZXBvcnQtdXJpJ10/Lmxlbmd0aCA/PyAwID4gMDtcblx0XHRcdGlmICghaGFzX3JlcG9ydF90byAmJiAhaGFzX3JlcG9ydF91cmkpIHtcblx0XHRcdFx0dGhyb3cgRXJyb3IoXG5cdFx0XHRcdFx0J2Bjb250ZW50LXNlY3VyaXR5LXBvbGljeS1yZXBvcnQtb25seWAgbXVzdCBiZSBzcGVjaWZpZWQgd2l0aCBlaXRoZXIgdGhlIGByZXBvcnQtdG9gIG9yIGByZXBvcnQtdXJpYCBkaXJlY3RpdmVzLCBvciBib3RoJ1xuXHRcdFx0XHQpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxufVxuXG5leHBvcnQgY2xhc3MgQ3NwIHtcblx0LyoqIEByZWFkb25seSAqL1xuXHRub25jZSA9IGdlbmVyYXRlX25vbmNlKCk7XG5cblx0LyoqIEB0eXBlIHtDc3BQcm92aWRlcn0gKi9cblx0Y3NwX3Byb3ZpZGVyO1xuXG5cdC8qKiBAdHlwZSB7Q3NwUmVwb3J0T25seVByb3ZpZGVyfSAqL1xuXHRyZXBvcnRfb25seV9wcm92aWRlcjtcblxuXHQvKipcblx0ICogQHBhcmFtIHtpbXBvcnQoJy4vdHlwZXMuanMnKS5Dc3BDb25maWd9IGNvbmZpZ1xuXHQgKiBAcGFyYW0ge2ltcG9ydCgnLi90eXBlcy5qcycpLkNzcE9wdHN9IG9wdHNcblx0ICovXG5cdGNvbnN0cnVjdG9yKHsgbW9kZSwgZGlyZWN0aXZlcywgcmVwb3J0T25seSB9LCB7IHByZXJlbmRlciB9KSB7XG5cdFx0Y29uc3QgdXNlX2hhc2hlcyA9IG1vZGUgPT09ICdoYXNoJyB8fCAobW9kZSA9PT0gJ2F1dG8nICYmIHByZXJlbmRlcik7XG5cdFx0dGhpcy5jc3BfcHJvdmlkZXIgPSBuZXcgQ3NwUHJvdmlkZXIodXNlX2hhc2hlcywgZGlyZWN0aXZlcywgdGhpcy5ub25jZSk7XG5cdFx0dGhpcy5yZXBvcnRfb25seV9wcm92aWRlciA9IG5ldyBDc3BSZXBvcnRPbmx5UHJvdmlkZXIodXNlX2hhc2hlcywgcmVwb3J0T25seSwgdGhpcy5ub25jZSk7XG5cdH1cblxuXHRnZXQgc2NyaXB0X25lZWRzX25vbmNlKCkge1xuXHRcdHJldHVybiB0aGlzLmNzcF9wcm92aWRlci5zY3JpcHRfbmVlZHNfbm9uY2UgfHwgdGhpcy5yZXBvcnRfb25seV9wcm92aWRlci5zY3JpcHRfbmVlZHNfbm9uY2U7XG5cdH1cblxuXHRnZXQgc3R5bGVfbmVlZHNfbm9uY2UoKSB7XG5cdFx0cmV0dXJuIHRoaXMuY3NwX3Byb3ZpZGVyLnN0eWxlX25lZWRzX25vbmNlIHx8IHRoaXMucmVwb3J0X29ubHlfcHJvdmlkZXIuc3R5bGVfbmVlZHNfbm9uY2U7XG5cdH1cblxuXHQvKiogQHBhcmFtIHtzdHJpbmd9IGNvbnRlbnQgKi9cblx0YWRkX3NjcmlwdChjb250ZW50KSB7XG5cdFx0dGhpcy5jc3BfcHJvdmlkZXIuYWRkX3NjcmlwdChjb250ZW50KTtcblx0XHR0aGlzLnJlcG9ydF9vbmx5X3Byb3ZpZGVyLmFkZF9zY3JpcHQoY29udGVudCk7XG5cdH1cblxuXHQvKiogQHBhcmFtIHtzdHJpbmd9IGNvbnRlbnQgKi9cblx0YWRkX3N0eWxlKGNvbnRlbnQpIHtcblx0XHR0aGlzLmNzcF9wcm92aWRlci5hZGRfc3R5bGUoY29udGVudCk7XG5cdFx0dGhpcy5yZXBvcnRfb25seV9wcm92aWRlci5hZGRfc3R5bGUoY29udGVudCk7XG5cdH1cbn1cbiIsIi8qKlxuICogQHJldHVybnMge2ltcG9ydCgndHlwZXMnKS5EZWZlcnJlZCAmIHsgcHJvbWlzZTogUHJvbWlzZTxhbnk+IH19fVxuICovXG5mdW5jdGlvbiBkZWZlcigpIHtcblx0bGV0IGZ1bGZpbDtcblx0bGV0IHJlamVjdDtcblxuXHRjb25zdCBwcm9taXNlID0gbmV3IFByb21pc2UoKGYsIHIpID0+IHtcblx0XHRmdWxmaWwgPSBmO1xuXHRcdHJlamVjdCA9IHI7XG5cdH0pO1xuXG5cdC8vIEB0cy1leHBlY3QtZXJyb3Jcblx0cmV0dXJuIHsgcHJvbWlzZSwgZnVsZmlsLCByZWplY3QgfTtcbn1cblxuLyoqXG4gKiBDcmVhdGUgYW4gYXN5bmMgaXRlcmF0b3IgYW5kIGEgZnVuY3Rpb24gdG8gcHVzaCB2YWx1ZXMgaW50byBpdFxuICogQHJldHVybnMge3tcbiAqICAgaXRlcmF0b3I6IEFzeW5jSXRlcmFibGU8YW55PjtcbiAqICAgcHVzaDogKHZhbHVlOiBhbnkpID0+IHZvaWQ7XG4gKiAgIGRvbmU6ICgpID0+IHZvaWQ7XG4gKiB9fVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlX2FzeW5jX2l0ZXJhdG9yKCkge1xuXHRjb25zdCBkZWZlcnJlZCA9IFtkZWZlcigpXTtcblxuXHRyZXR1cm4ge1xuXHRcdGl0ZXJhdG9yOiB7XG5cdFx0XHRbU3ltYm9sLmFzeW5jSXRlcmF0b3JdKCkge1xuXHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdG5leHQ6IGFzeW5jICgpID0+IHtcblx0XHRcdFx0XHRcdGNvbnN0IG5leHQgPSBhd2FpdCBkZWZlcnJlZFswXS5wcm9taXNlO1xuXHRcdFx0XHRcdFx0aWYgKCFuZXh0LmRvbmUpIGRlZmVycmVkLnNoaWZ0KCk7XG5cdFx0XHRcdFx0XHRyZXR1cm4gbmV4dDtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH07XG5cdFx0XHR9XG5cdFx0fSxcblx0XHRwdXNoOiAodmFsdWUpID0+IHtcblx0XHRcdGRlZmVycmVkW2RlZmVycmVkLmxlbmd0aCAtIDFdLmZ1bGZpbCh7XG5cdFx0XHRcdHZhbHVlLFxuXHRcdFx0XHRkb25lOiBmYWxzZVxuXHRcdFx0fSk7XG5cdFx0XHRkZWZlcnJlZC5wdXNoKGRlZmVyKCkpO1xuXHRcdH0sXG5cdFx0ZG9uZTogKCkgPT4ge1xuXHRcdFx0ZGVmZXJyZWRbZGVmZXJyZWQubGVuZ3RoIC0gMV0uZnVsZmlsKHsgZG9uZTogdHJ1ZSB9KTtcblx0XHR9XG5cdH07XG59XG4iLCJpbXBvcnQgKiBhcyBkZXZhbHVlIGZyb20gJ2RldmFsdWUnO1xuaW1wb3J0IHsgcmVhZGFibGUsIHdyaXRhYmxlIH0gZnJvbSAnc3ZlbHRlL3N0b3JlJztcbmltcG9ydCB7IERFViB9IGZyb20gJ2VzbS1lbnYnO1xuaW1wb3J0ICogYXMgcGF0aHMgZnJvbSAnX19zdmVsdGVraXQvcGF0aHMnO1xuaW1wb3J0IHsgaGFzaCB9IGZyb20gJy4uLy4uL2hhc2guanMnO1xuaW1wb3J0IHsgc2VyaWFsaXplX2RhdGEgfSBmcm9tICcuL3NlcmlhbGl6ZV9kYXRhLmpzJztcbmltcG9ydCB7IHMgfSBmcm9tICcuLi8uLi8uLi91dGlscy9taXNjLmpzJztcbmltcG9ydCB7IENzcCB9IGZyb20gJy4vY3NwLmpzJztcbmltcG9ydCB7IHVuZXZhbF9hY3Rpb25fcmVzcG9uc2UgfSBmcm9tICcuL2FjdGlvbnMuanMnO1xuaW1wb3J0IHsgY2xhcmlmeV9kZXZhbHVlX2Vycm9yLCBzdHJpbmdpZnlfdXNlcywgaGFuZGxlX2Vycm9yX2FuZF9qc29uaWZ5IH0gZnJvbSAnLi4vdXRpbHMuanMnO1xuaW1wb3J0IHsgcHVibGljX2Vudiwgc2FmZV9wdWJsaWNfZW52IH0gZnJvbSAnLi4vLi4vc2hhcmVkLXNlcnZlci5qcyc7XG5pbXBvcnQgeyB0ZXh0IH0gZnJvbSAnLi4vLi4vLi4vZXhwb3J0cy9pbmRleC5qcyc7XG5pbXBvcnQgeyBjcmVhdGVfYXN5bmNfaXRlcmF0b3IgfSBmcm9tICcuLi8uLi8uLi91dGlscy9zdHJlYW1pbmcuanMnO1xuaW1wb3J0IHsgU1ZFTFRFX0tJVF9BU1NFVFMgfSBmcm9tICcuLi8uLi8uLi9jb25zdGFudHMuanMnO1xuaW1wb3J0IHsgU0NIRU1FIH0gZnJvbSAnLi4vLi4vLi4vdXRpbHMvdXJsLmpzJztcblxuLy8gVE9ETyByZW5hbWUgdGhpcyBmdW5jdGlvbi9tb2R1bGVcblxuY29uc3QgdXBkYXRlZCA9IHtcblx0Li4ucmVhZGFibGUoZmFsc2UpLFxuXHRjaGVjazogKCkgPT4gZmFsc2Vcbn07XG5cbmNvbnN0IGVuY29kZXIgPSBuZXcgVGV4dEVuY29kZXIoKTtcblxuLyoqXG4gKiBDcmVhdGVzIHRoZSBIVE1MIHJlc3BvbnNlLlxuICogQHBhcmFtIHt7XG4gKiAgIGJyYW5jaDogQXJyYXk8aW1wb3J0KCcuL3R5cGVzLmpzJykuTG9hZGVkPjtcbiAqICAgZmV0Y2hlZDogQXJyYXk8aW1wb3J0KCcuL3R5cGVzLmpzJykuRmV0Y2hlZD47XG4gKiAgIG9wdGlvbnM6IGltcG9ydCgndHlwZXMnKS5TU1JPcHRpb25zO1xuICogICBtYW5pZmVzdDogaW1wb3J0KCdAc3ZlbHRlanMva2l0JykuU1NSTWFuaWZlc3Q7XG4gKiAgIHN0YXRlOiBpbXBvcnQoJ3R5cGVzJykuU1NSU3RhdGU7XG4gKiAgIHBhZ2VfY29uZmlnOiB7IHNzcjogYm9vbGVhbjsgY3NyOiBib29sZWFuIH07XG4gKiAgIHN0YXR1czogbnVtYmVyO1xuICogICBlcnJvcjogQXBwLkVycm9yIHwgbnVsbDtcbiAqICAgZXZlbnQ6IGltcG9ydCgnQHN2ZWx0ZWpzL2tpdCcpLlJlcXVlc3RFdmVudDtcbiAqICAgcmVzb2x2ZV9vcHRzOiBpbXBvcnQoJ3R5cGVzJykuUmVxdWlyZWRSZXNvbHZlT3B0aW9ucztcbiAqICAgYWN0aW9uX3Jlc3VsdD86IGltcG9ydCgnQHN2ZWx0ZWpzL2tpdCcpLkFjdGlvblJlc3VsdDtcbiAqIH19IG9wdHNcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlbmRlcl9yZXNwb25zZSh7XG5cdGJyYW5jaCxcblx0ZmV0Y2hlZCxcblx0b3B0aW9ucyxcblx0bWFuaWZlc3QsXG5cdHN0YXRlLFxuXHRwYWdlX2NvbmZpZyxcblx0c3RhdHVzLFxuXHRlcnJvciA9IG51bGwsXG5cdGV2ZW50LFxuXHRyZXNvbHZlX29wdHMsXG5cdGFjdGlvbl9yZXN1bHRcbn0pIHtcblx0aWYgKHN0YXRlLnByZXJlbmRlcmluZykge1xuXHRcdGlmIChvcHRpb25zLmNzcC5tb2RlID09PSAnbm9uY2UnKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCB1c2UgcHJlcmVuZGVyaW5nIGlmIGNvbmZpZy5raXQuY3NwLm1vZGUgPT09IFwibm9uY2VcIicpO1xuXHRcdH1cblxuXHRcdGlmIChvcHRpb25zLmFwcF90ZW1wbGF0ZV9jb250YWluc19ub25jZSkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgdXNlIHByZXJlbmRlcmluZyBpZiBwYWdlIHRlbXBsYXRlIGNvbnRhaW5zICVzdmVsdGVraXQubm9uY2UlJyk7XG5cdFx0fVxuXHR9XG5cblx0Y29uc3QgeyBjbGllbnQgfSA9IG1hbmlmZXN0Ll87XG5cblx0Y29uc3QgbW9kdWxlcHJlbG9hZHMgPSBuZXcgU2V0KGNsaWVudC5pbXBvcnRzKTtcblx0Y29uc3Qgc3R5bGVzaGVldHMgPSBuZXcgU2V0KGNsaWVudC5zdHlsZXNoZWV0cyk7XG5cdGNvbnN0IGZvbnRzID0gbmV3IFNldChjbGllbnQuZm9udHMpO1xuXG5cdC8qKiBAdHlwZSB7U2V0PHN0cmluZz59ICovXG5cdGNvbnN0IGxpbmtfaGVhZGVyX3ByZWxvYWRzID0gbmV3IFNldCgpO1xuXG5cdC8qKiBAdHlwZSB7TWFwPHN0cmluZywgc3RyaW5nPn0gKi9cblx0Ly8gVE9ETyBpZiB3ZSBhZGQgYSBjbGllbnQgZW50cnkgcG9pbnQgb25lIGRheSwgd2Ugd2lsbCBuZWVkIHRvIGluY2x1ZGUgaW5saW5lX3N0eWxlcyB3aXRoIHRoZSBlbnRyeSwgb3RoZXJ3aXNlIHN0eWxlc2hlZXRzIHdpbGwgYmUgbGlua2VkIGV2ZW4gaWYgdGhleSBhcmUgYmVsb3cgaW5saW5lU3R5bGVUaHJlc2hvbGRcblx0Y29uc3QgaW5saW5lX3N0eWxlcyA9IG5ldyBNYXAoKTtcblxuXHRsZXQgcmVuZGVyZWQ7XG5cblx0Y29uc3QgZm9ybV92YWx1ZSA9XG5cdFx0YWN0aW9uX3Jlc3VsdD8udHlwZSA9PT0gJ3N1Y2Nlc3MnIHx8IGFjdGlvbl9yZXN1bHQ/LnR5cGUgPT09ICdmYWlsdXJlJ1xuXHRcdFx0PyBhY3Rpb25fcmVzdWx0LmRhdGEgPz8gbnVsbFxuXHRcdFx0OiBudWxsO1xuXG5cdC8qKiBAdHlwZSB7c3RyaW5nfSAqL1xuXHRsZXQgYmFzZSA9IHBhdGhzLmJhc2U7XG5cblx0LyoqIEB0eXBlIHtzdHJpbmd9ICovXG5cdGxldCBhc3NldHMgPSBwYXRocy5hc3NldHM7XG5cblx0LyoqXG5cdCAqIEFuIGV4cHJlc3Npb24gdGhhdCB3aWxsIGV2YWx1YXRlIGluIHRoZSBjbGllbnQgdG8gZGV0ZXJtaW5lIHRoZSByZXNvbHZlZCBiYXNlIHBhdGguXG5cdCAqIFdlIHVzZSBhIHJlbGF0aXZlIHBhdGggd2hlbiBwb3NzaWJsZSB0byBzdXBwb3J0IElQRlMsIHRoZSBpbnRlcm5ldCBhcmNoaXZlLCBldGMuXG5cdCAqL1xuXHRsZXQgYmFzZV9leHByZXNzaW9uID0gcyhwYXRocy5iYXNlKTtcblxuXHQvLyBpZiBhcHByb3ByaWF0ZSwgdXNlIHJlbGF0aXZlIHBhdGhzIGZvciBncmVhdGVyIHBvcnRhYmlsaXR5XG5cdGlmIChwYXRocy5yZWxhdGl2ZSAmJiAhc3RhdGUucHJlcmVuZGVyaW5nPy5mYWxsYmFjaykge1xuXHRcdGNvbnN0IHNlZ21lbnRzID0gZXZlbnQudXJsLnBhdGhuYW1lLnNsaWNlKHBhdGhzLmJhc2UubGVuZ3RoKS5zcGxpdCgnLycpLnNsaWNlKDIpO1xuXG5cdFx0YmFzZSA9IHNlZ21lbnRzLm1hcCgoKSA9PiAnLi4nKS5qb2luKCcvJykgfHwgJy4nO1xuXG5cdFx0Ly8gcmVzb2x2ZSBlLmcuICcuLi8uLicgYWdhaW5zdCBjdXJyZW50IGxvY2F0aW9uLCB0aGVuIHJlbW92ZSB0cmFpbGluZyBzbGFzaFxuXHRcdGJhc2VfZXhwcmVzc2lvbiA9IGBuZXcgVVJMKCR7cyhiYXNlKX0sIGxvY2F0aW9uKS5wYXRobmFtZS5zbGljZSgwLCAtMSlgO1xuXG5cdFx0aWYgKCFwYXRocy5hc3NldHMgfHwgKHBhdGhzLmFzc2V0c1swXSA9PT0gJy8nICYmIHBhdGhzLmFzc2V0cyAhPT0gU1ZFTFRFX0tJVF9BU1NFVFMpKSB7XG5cdFx0XHRhc3NldHMgPSBiYXNlO1xuXHRcdH1cblx0fVxuXG5cdGlmIChwYWdlX2NvbmZpZy5zc3IpIHtcblx0XHRpZiAoX19TVkVMVEVLSVRfREVWX18gJiYgIWJyYW5jaC5hdCgtMSk/Lm5vZGUuY29tcG9uZW50KSB7XG5cdFx0XHQvLyBDYW4gb25seSBiZSB0aGUgbGVhZiwgbGF5b3V0cyBoYXZlIGEgZmFsbGJhY2sgY29tcG9uZW50IGdlbmVyYXRlZFxuXHRcdFx0dGhyb3cgbmV3IEVycm9yKGBNaXNzaW5nICtwYWdlLnN2ZWx0ZSBjb21wb25lbnQgZm9yIHJvdXRlICR7ZXZlbnQucm91dGUuaWR9YCk7XG5cdFx0fVxuXG5cdFx0LyoqIEB0eXBlIHtSZWNvcmQ8c3RyaW5nLCBhbnk+fSAqL1xuXHRcdGNvbnN0IHByb3BzID0ge1xuXHRcdFx0c3RvcmVzOiB7XG5cdFx0XHRcdHBhZ2U6IHdyaXRhYmxlKG51bGwpLFxuXHRcdFx0XHRuYXZpZ2F0aW5nOiB3cml0YWJsZShudWxsKSxcblx0XHRcdFx0dXBkYXRlZFxuXHRcdFx0fSxcblx0XHRcdGNvbnN0cnVjdG9yczogYXdhaXQgUHJvbWlzZS5hbGwoYnJhbmNoLm1hcCgoeyBub2RlIH0pID0+IG5vZGUuY29tcG9uZW50KCkpKSxcblx0XHRcdGZvcm06IGZvcm1fdmFsdWVcblx0XHR9O1xuXG5cdFx0bGV0IGRhdGEgPSB7fTtcblxuXHRcdC8vIHByb3BzX24gKGluc3RlYWQgb2YgcHJvcHNbbl0pIG1ha2VzIGl0IGVhc3kgdG8gYXZvaWRcblx0XHQvLyB1bm5lY2Vzc2FyeSB1cGRhdGVzIGZvciBsYXlvdXQgY29tcG9uZW50c1xuXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgYnJhbmNoLmxlbmd0aDsgaSArPSAxKSB7XG5cdFx0XHRkYXRhID0geyAuLi5kYXRhLCAuLi5icmFuY2hbaV0uZGF0YSB9O1xuXHRcdFx0cHJvcHNbYGRhdGFfJHtpfWBdID0gZGF0YTtcblx0XHR9XG5cblx0XHRwcm9wcy5wYWdlID0ge1xuXHRcdFx0ZXJyb3IsXG5cdFx0XHRwYXJhbXM6IC8qKiBAdHlwZSB7UmVjb3JkPHN0cmluZywgYW55Pn0gKi8gKGV2ZW50LnBhcmFtcyksXG5cdFx0XHRyb3V0ZTogZXZlbnQucm91dGUsXG5cdFx0XHRzdGF0dXMsXG5cdFx0XHR1cmw6IGV2ZW50LnVybCxcblx0XHRcdGRhdGEsXG5cdFx0XHRmb3JtOiBmb3JtX3ZhbHVlLFxuXHRcdFx0c3RhdGU6IHt9XG5cdFx0fTtcblxuXHRcdC8vIHVzZSByZWxhdGl2ZSBwYXRocyBkdXJpbmcgcmVuZGVyaW5nLCBzbyB0aGF0IHRoZSByZXN1bHRpbmcgSFRNTCBpcyBhc1xuXHRcdC8vIHBvcnRhYmxlIGFzIHBvc3NpYmxlLCBidXQgcmVzZXQgYWZ0ZXJ3YXJkc1xuXHRcdGlmIChwYXRocy5yZWxhdGl2ZSkgcGF0aHMub3ZlcnJpZGUoeyBiYXNlLCBhc3NldHMgfSk7XG5cblx0XHRpZiAoX19TVkVMVEVLSVRfREVWX18pIHtcblx0XHRcdGNvbnN0IGZldGNoID0gZ2xvYmFsVGhpcy5mZXRjaDtcblx0XHRcdGxldCB3YXJuZWQgPSBmYWxzZTtcblx0XHRcdGdsb2JhbFRoaXMuZmV0Y2ggPSAoaW5mbywgaW5pdCkgPT4ge1xuXHRcdFx0XHRpZiAodHlwZW9mIGluZm8gPT09ICdzdHJpbmcnICYmICFTQ0hFTUUudGVzdChpbmZvKSkge1xuXHRcdFx0XHRcdHRocm93IG5ldyBFcnJvcihcblx0XHRcdFx0XHRcdGBDYW5ub3QgY2FsbCBcXGBmZXRjaFxcYCBlYWdlcmx5IGR1cmluZyBzZXJ2ZXIgc2lkZSByZW5kZXJpbmcgd2l0aCByZWxhdGl2ZSBVUkwgKCR7aW5mb30pIOKAlCBwdXQgeW91ciBcXGBmZXRjaFxcYCBjYWxscyBpbnNpZGUgXFxgb25Nb3VudFxcYCBvciBhIFxcYGxvYWRcXGAgZnVuY3Rpb24gaW5zdGVhZGBcblx0XHRcdFx0XHQpO1xuXHRcdFx0XHR9IGVsc2UgaWYgKCF3YXJuZWQpIHtcblx0XHRcdFx0XHRjb25zb2xlLndhcm4oXG5cdFx0XHRcdFx0XHQnQXZvaWQgY2FsbGluZyBgZmV0Y2hgIGVhZ2VybHkgZHVyaW5nIHNlcnZlciBzaWRlIHJlbmRlcmluZyDigJQgcHV0IHlvdXIgYGZldGNoYCBjYWxscyBpbnNpZGUgYG9uTW91bnRgIG9yIGEgYGxvYWRgIGZ1bmN0aW9uIGluc3RlYWQnXG5cdFx0XHRcdFx0KTtcblx0XHRcdFx0XHR3YXJuZWQgPSB0cnVlO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0cmV0dXJuIGZldGNoKGluZm8sIGluaXQpO1xuXHRcdFx0fTtcblxuXHRcdFx0dHJ5IHtcblx0XHRcdFx0cmVuZGVyZWQgPSBvcHRpb25zLnJvb3QucmVuZGVyKHByb3BzKTtcblx0XHRcdH0gZmluYWxseSB7XG5cdFx0XHRcdGdsb2JhbFRoaXMuZmV0Y2ggPSBmZXRjaDtcblx0XHRcdFx0cGF0aHMucmVzZXQoKTtcblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0cmVuZGVyZWQgPSBvcHRpb25zLnJvb3QucmVuZGVyKHByb3BzKTtcblx0XHRcdH0gZmluYWxseSB7XG5cdFx0XHRcdHBhdGhzLnJlc2V0KCk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Zm9yIChjb25zdCB7IG5vZGUgfSBvZiBicmFuY2gpIHtcblx0XHRcdGZvciAoY29uc3QgdXJsIG9mIG5vZGUuaW1wb3J0cykgbW9kdWxlcHJlbG9hZHMuYWRkKHVybCk7XG5cdFx0XHRmb3IgKGNvbnN0IHVybCBvZiBub2RlLnN0eWxlc2hlZXRzKSBzdHlsZXNoZWV0cy5hZGQodXJsKTtcblx0XHRcdGZvciAoY29uc3QgdXJsIG9mIG5vZGUuZm9udHMpIGZvbnRzLmFkZCh1cmwpO1xuXG5cdFx0XHRpZiAobm9kZS5pbmxpbmVfc3R5bGVzKSB7XG5cdFx0XHRcdE9iamVjdC5lbnRyaWVzKGF3YWl0IG5vZGUuaW5saW5lX3N0eWxlcygpKS5mb3JFYWNoKChbaywgdl0pID0+IGlubGluZV9zdHlsZXMuc2V0KGssIHYpKTtcblx0XHRcdH1cblx0XHR9XG5cdH0gZWxzZSB7XG5cdFx0cmVuZGVyZWQgPSB7IGhlYWQ6ICcnLCBodG1sOiAnJywgY3NzOiB7IGNvZGU6ICcnLCBtYXA6IG51bGwgfSB9O1xuXHR9XG5cblx0bGV0IGhlYWQgPSAnJztcblx0bGV0IGJvZHkgPSByZW5kZXJlZC5odG1sO1xuXG5cdGNvbnN0IGNzcCA9IG5ldyBDc3Aob3B0aW9ucy5jc3AsIHtcblx0XHRwcmVyZW5kZXI6ICEhc3RhdGUucHJlcmVuZGVyaW5nXG5cdH0pO1xuXG5cdC8qKiBAcGFyYW0ge3N0cmluZ30gcGF0aCAqL1xuXHRjb25zdCBwcmVmaXhlZCA9IChwYXRoKSA9PiB7XG5cdFx0aWYgKHBhdGguc3RhcnRzV2l0aCgnLycpKSB7XG5cdFx0XHQvLyBWaXRlIG1ha2VzIHRoZSBzdGFydCBzY3JpcHQgYXZhaWxhYmxlIHRocm91Z2ggdGhlIGJhc2UgcGF0aCBhbmQgd2l0aG91dCBpdC5cblx0XHRcdC8vIFdlIGxvYWQgaXQgdmlhIHRoZSBiYXNlIHBhdGggaW4gb3JkZXIgdG8gc3VwcG9ydCByZW1vdGUgSURFIGVudmlyb25tZW50cyB3aGljaCBwcm94eVxuXHRcdFx0Ly8gYWxsIFVSTHMgdW5kZXIgdGhlIGJhc2UgcGF0aCBkdXJpbmcgZGV2ZWxvcG1lbnQuXG5cdFx0XHRyZXR1cm4gcGF0aHMuYmFzZSArIHBhdGg7XG5cdFx0fVxuXHRcdHJldHVybiBgJHthc3NldHN9LyR7cGF0aH1gO1xuXHR9O1xuXG5cdGlmIChpbmxpbmVfc3R5bGVzLnNpemUgPiAwKSB7XG5cdFx0Y29uc3QgY29udGVudCA9IEFycmF5LmZyb20oaW5saW5lX3N0eWxlcy52YWx1ZXMoKSkuam9pbignXFxuJyk7XG5cblx0XHRjb25zdCBhdHRyaWJ1dGVzID0gX19TVkVMVEVLSVRfREVWX18gPyBbJyBkYXRhLXN2ZWx0ZWtpdCddIDogW107XG5cdFx0aWYgKGNzcC5zdHlsZV9uZWVkc19ub25jZSkgYXR0cmlidXRlcy5wdXNoKGAgbm9uY2U9XCIke2NzcC5ub25jZX1cImApO1xuXG5cdFx0Y3NwLmFkZF9zdHlsZShjb250ZW50KTtcblxuXHRcdGhlYWQgKz0gYFxcblxcdDxzdHlsZSR7YXR0cmlidXRlcy5qb2luKCcnKX0+JHtjb250ZW50fTwvc3R5bGU+YDtcblx0fVxuXG5cdGZvciAoY29uc3QgZGVwIG9mIHN0eWxlc2hlZXRzKSB7XG5cdFx0Y29uc3QgcGF0aCA9IHByZWZpeGVkKGRlcCk7XG5cblx0XHRjb25zdCBhdHRyaWJ1dGVzID0gWydyZWw9XCJzdHlsZXNoZWV0XCInXTtcblxuXHRcdGlmIChpbmxpbmVfc3R5bGVzLmhhcyhkZXApKSB7XG5cdFx0XHQvLyBkb24ndCBsb2FkIHN0eWxlc2hlZXRzIHRoYXQgYXJlIGFscmVhZHkgaW5saW5lZFxuXHRcdFx0Ly8gaW5jbHVkZSB0aGVtIGluIGRpc2FibGVkIHN0YXRlIHNvIHRoYXQgVml0ZSBjYW4gZGV0ZWN0IHRoZW0gYW5kIGRvZXNuJ3QgdHJ5IHRvIGFkZCB0aGVtXG5cdFx0XHRhdHRyaWJ1dGVzLnB1c2goJ2Rpc2FibGVkJywgJ21lZGlhPVwiKG1heC13aWR0aDogMClcIicpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRpZiAocmVzb2x2ZV9vcHRzLnByZWxvYWQoeyB0eXBlOiAnY3NzJywgcGF0aCB9KSkge1xuXHRcdFx0XHRjb25zdCBwcmVsb2FkX2F0dHMgPSBbJ3JlbD1cInByZWxvYWRcIicsICdhcz1cInN0eWxlXCInXTtcblx0XHRcdFx0bGlua19oZWFkZXJfcHJlbG9hZHMuYWRkKGA8JHtlbmNvZGVVUkkocGF0aCl9PjsgJHtwcmVsb2FkX2F0dHMuam9pbignOycpfTsgbm9wdXNoYCk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aGVhZCArPSBgXFxuXFx0XFx0PGxpbmsgaHJlZj1cIiR7cGF0aH1cIiAke2F0dHJpYnV0ZXMuam9pbignICcpfT5gO1xuXHR9XG5cblx0Zm9yIChjb25zdCBkZXAgb2YgZm9udHMpIHtcblx0XHRjb25zdCBwYXRoID0gcHJlZml4ZWQoZGVwKTtcblxuXHRcdGlmIChyZXNvbHZlX29wdHMucHJlbG9hZCh7IHR5cGU6ICdmb250JywgcGF0aCB9KSkge1xuXHRcdFx0Y29uc3QgZXh0ID0gZGVwLnNsaWNlKGRlcC5sYXN0SW5kZXhPZignLicpICsgMSk7XG5cdFx0XHRjb25zdCBhdHRyaWJ1dGVzID0gW1xuXHRcdFx0XHQncmVsPVwicHJlbG9hZFwiJyxcblx0XHRcdFx0J2FzPVwiZm9udFwiJyxcblx0XHRcdFx0YHR5cGU9XCJmb250LyR7ZXh0fVwiYCxcblx0XHRcdFx0YGhyZWY9XCIke3BhdGh9XCJgLFxuXHRcdFx0XHQnY3Jvc3NvcmlnaW4nXG5cdFx0XHRdO1xuXG5cdFx0XHRoZWFkICs9IGBcXG5cXHRcXHQ8bGluayAke2F0dHJpYnV0ZXMuam9pbignICcpfT5gO1xuXHRcdH1cblx0fVxuXG5cdGNvbnN0IGdsb2JhbCA9IF9fU1ZFTFRFS0lUX0RFVl9fID8gJ19fc3ZlbHRla2l0X2RldicgOiBgX19zdmVsdGVraXRfJHtvcHRpb25zLnZlcnNpb25faGFzaH1gO1xuXG5cdGNvbnN0IHsgZGF0YSwgY2h1bmtzIH0gPSBnZXRfZGF0YShcblx0XHRldmVudCxcblx0XHRvcHRpb25zLFxuXHRcdGJyYW5jaC5tYXAoKGIpID0+IGIuc2VydmVyX2RhdGEpLFxuXHRcdGdsb2JhbFxuXHQpO1xuXG5cdGlmIChwYWdlX2NvbmZpZy5zc3IgJiYgcGFnZV9jb25maWcuY3NyKSB7XG5cdFx0Ym9keSArPSBgXFxuXFx0XFx0XFx0JHtmZXRjaGVkXG5cdFx0XHQubWFwKChpdGVtKSA9PlxuXHRcdFx0XHRzZXJpYWxpemVfZGF0YShpdGVtLCByZXNvbHZlX29wdHMuZmlsdGVyU2VyaWFsaXplZFJlc3BvbnNlSGVhZGVycywgISFzdGF0ZS5wcmVyZW5kZXJpbmcpXG5cdFx0XHQpXG5cdFx0XHQuam9pbignXFxuXFx0XFx0XFx0Jyl9YDtcblx0fVxuXG5cdGlmIChwYWdlX2NvbmZpZy5jc3IpIHtcblx0XHRpZiAoY2xpZW50LnVzZXNfZW52X2R5bmFtaWNfcHVibGljICYmIHN0YXRlLnByZXJlbmRlcmluZykge1xuXHRcdFx0bW9kdWxlcHJlbG9hZHMuYWRkKGAke29wdGlvbnMuYXBwX2Rpcn0vZW52LmpzYCk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgaW5jbHVkZWRfbW9kdWxlcHJlbG9hZHMgPSBBcnJheS5mcm9tKG1vZHVsZXByZWxvYWRzLCAoZGVwKSA9PiBwcmVmaXhlZChkZXApKS5maWx0ZXIoXG5cdFx0XHQocGF0aCkgPT4gcmVzb2x2ZV9vcHRzLnByZWxvYWQoeyB0eXBlOiAnanMnLCBwYXRoIH0pXG5cdFx0KTtcblxuXHRcdGZvciAoY29uc3QgcGF0aCBvZiBpbmNsdWRlZF9tb2R1bGVwcmVsb2Fkcykge1xuXHRcdFx0Ly8gc2VlIHRoZSBraXQub3V0cHV0LnByZWxvYWRTdHJhdGVneSBvcHRpb24gZm9yIGRldGFpbHMgb24gd2h5IHdlIGhhdmUgbXVsdGlwbGUgb3B0aW9ucyBoZXJlXG5cdFx0XHRsaW5rX2hlYWRlcl9wcmVsb2Fkcy5hZGQoYDwke2VuY29kZVVSSShwYXRoKX0+OyByZWw9XCJtb2R1bGVwcmVsb2FkXCI7IG5vcHVzaGApO1xuXHRcdFx0aWYgKG9wdGlvbnMucHJlbG9hZF9zdHJhdGVneSAhPT0gJ21vZHVsZXByZWxvYWQnKSB7XG5cdFx0XHRcdGhlYWQgKz0gYFxcblxcdFxcdDxsaW5rIHJlbD1cInByZWxvYWRcIiBhcz1cInNjcmlwdFwiIGNyb3Nzb3JpZ2luPVwiYW5vbnltb3VzXCIgaHJlZj1cIiR7cGF0aH1cIj5gO1xuXHRcdFx0fSBlbHNlIGlmIChzdGF0ZS5wcmVyZW5kZXJpbmcpIHtcblx0XHRcdFx0aGVhZCArPSBgXFxuXFx0XFx0PGxpbmsgcmVsPVwibW9kdWxlcHJlbG9hZFwiIGhyZWY9XCIke3BhdGh9XCI+YDtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRjb25zdCBibG9ja3MgPSBbXTtcblxuXHRcdC8vIHdoZW4gc2VydmluZyBhIHByZXJlbmRlcmVkIHBhZ2UgaW4gYW4gYXBwIHRoYXQgdXNlcyAkZW52L2R5bmFtaWMvcHVibGljLCB3ZSBtdXN0XG5cdFx0Ly8gaW1wb3J0IHRoZSBlbnYuanMgbW9kdWxlIHNvIHRoYXQgaXQgZXZhbHVhdGVzIGJlZm9yZSBhbnkgdXNlciBjb2RlIGNhbiBldmFsdWF0ZS5cblx0XHQvLyBUT0RPIHJldmVydCB0byB1c2luZyB0b3AtbGV2ZWwgYXdhaXQgb25jZSBodHRwczovL2J1Z3Mud2Via2l0Lm9yZy9zaG93X2J1Zy5jZ2k/aWQ9MjQyNzQwIGlzIGZpeGVkXG5cdFx0Ly8gaHR0cHM6Ly9naXRodWIuY29tL3N2ZWx0ZWpzL2tpdC9wdWxsLzExNjAxXG5cdFx0Y29uc3QgbG9hZF9lbnZfZWFnZXJseSA9IGNsaWVudC51c2VzX2Vudl9keW5hbWljX3B1YmxpYyAmJiBzdGF0ZS5wcmVyZW5kZXJpbmc7XG5cblx0XHRjb25zdCBwcm9wZXJ0aWVzID0gW2BiYXNlOiAke2Jhc2VfZXhwcmVzc2lvbn1gXTtcblxuXHRcdGlmIChwYXRocy5hc3NldHMpIHtcblx0XHRcdHByb3BlcnRpZXMucHVzaChgYXNzZXRzOiAke3MocGF0aHMuYXNzZXRzKX1gKTtcblx0XHR9XG5cblx0XHRpZiAoY2xpZW50LnVzZXNfZW52X2R5bmFtaWNfcHVibGljKSB7XG5cdFx0XHRwcm9wZXJ0aWVzLnB1c2goYGVudjogJHtsb2FkX2Vudl9lYWdlcmx5ID8gJ251bGwnIDogcyhwdWJsaWNfZW52KX1gKTtcblx0XHR9XG5cblx0XHRpZiAoY2h1bmtzKSB7XG5cdFx0XHRibG9ja3MucHVzaCgnY29uc3QgZGVmZXJyZWQgPSBuZXcgTWFwKCk7Jyk7XG5cblx0XHRcdHByb3BlcnRpZXMucHVzaChgZGVmZXI6IChpZCkgPT4gbmV3IFByb21pc2UoKGZ1bGZpbCwgcmVqZWN0KSA9PiB7XG5cdFx0XHRcdFx0XHRcdGRlZmVycmVkLnNldChpZCwgeyBmdWxmaWwsIHJlamVjdCB9KTtcblx0XHRcdFx0XHRcdH0pYCk7XG5cblx0XHRcdHByb3BlcnRpZXMucHVzaChgcmVzb2x2ZTogKHsgaWQsIGRhdGEsIGVycm9yIH0pID0+IHtcblx0XHRcdFx0XHRcdFx0Y29uc3QgeyBmdWxmaWwsIHJlamVjdCB9ID0gZGVmZXJyZWQuZ2V0KGlkKTtcblx0XHRcdFx0XHRcdFx0ZGVmZXJyZWQuZGVsZXRlKGlkKTtcblxuXHRcdFx0XHRcdFx0XHRpZiAoZXJyb3IpIHJlamVjdChlcnJvcik7XG5cdFx0XHRcdFx0XHRcdGVsc2UgZnVsZmlsKGRhdGEpO1xuXHRcdFx0XHRcdFx0fWApO1xuXHRcdH1cblxuXHRcdC8vIGNyZWF0ZSB0aGlzIGJlZm9yZSBkZWNsYXJpbmcgYGRhdGFgLCB3aGljaCBtYXkgY29udGFpbiByZWZlcmVuY2VzIHRvIGAke2dsb2JhbH1gXG5cdFx0YmxvY2tzLnB1c2goYCR7Z2xvYmFsfSA9IHtcblx0XHRcdFx0XHRcdCR7cHJvcGVydGllcy5qb2luKCcsXFxuXFx0XFx0XFx0XFx0XFx0XFx0Jyl9XG5cdFx0XHRcdFx0fTtgKTtcblxuXHRcdGNvbnN0IGFyZ3MgPSBbJ2FwcCcsICdlbGVtZW50J107XG5cblx0XHRibG9ja3MucHVzaCgnY29uc3QgZWxlbWVudCA9IGRvY3VtZW50LmN1cnJlbnRTY3JpcHQucGFyZW50RWxlbWVudDsnKTtcblxuXHRcdGlmIChwYWdlX2NvbmZpZy5zc3IpIHtcblx0XHRcdGNvbnN0IHNlcmlhbGl6ZWQgPSB7IGZvcm06ICdudWxsJywgZXJyb3I6ICdudWxsJyB9O1xuXG5cdFx0XHRibG9ja3MucHVzaChgY29uc3QgZGF0YSA9ICR7ZGF0YX07YCk7XG5cblx0XHRcdGlmIChmb3JtX3ZhbHVlKSB7XG5cdFx0XHRcdHNlcmlhbGl6ZWQuZm9ybSA9IHVuZXZhbF9hY3Rpb25fcmVzcG9uc2UoXG5cdFx0XHRcdFx0Zm9ybV92YWx1ZSxcblx0XHRcdFx0XHQvKiogQHR5cGUge3N0cmluZ30gKi8gKGV2ZW50LnJvdXRlLmlkKVxuXHRcdFx0XHQpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZXJyb3IpIHtcblx0XHRcdFx0c2VyaWFsaXplZC5lcnJvciA9IGRldmFsdWUudW5ldmFsKGVycm9yKTtcblx0XHRcdH1cblxuXHRcdFx0Y29uc3QgaHlkcmF0ZSA9IFtcblx0XHRcdFx0YG5vZGVfaWRzOiBbJHticmFuY2gubWFwKCh7IG5vZGUgfSkgPT4gbm9kZS5pbmRleCkuam9pbignLCAnKX1dYCxcblx0XHRcdFx0J2RhdGEnLFxuXHRcdFx0XHRgZm9ybTogJHtzZXJpYWxpemVkLmZvcm19YCxcblx0XHRcdFx0YGVycm9yOiAke3NlcmlhbGl6ZWQuZXJyb3J9YFxuXHRcdFx0XTtcblxuXHRcdFx0aWYgKHN0YXR1cyAhPT0gMjAwKSB7XG5cdFx0XHRcdGh5ZHJhdGUucHVzaChgc3RhdHVzOiAke3N0YXR1c31gKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKG9wdGlvbnMuZW1iZWRkZWQpIHtcblx0XHRcdFx0aHlkcmF0ZS5wdXNoKGBwYXJhbXM6ICR7ZGV2YWx1ZS51bmV2YWwoZXZlbnQucGFyYW1zKX1gLCBgcm91dGU6ICR7cyhldmVudC5yb3V0ZSl9YCk7XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IGluZGVudCA9ICdcXHQnLnJlcGVhdChsb2FkX2Vudl9lYWdlcmx5ID8gNyA6IDYpO1xuXHRcdFx0YXJncy5wdXNoKGB7XFxuJHtpbmRlbnR9XFx0JHtoeWRyYXRlLmpvaW4oYCxcXG4ke2luZGVudH1cXHRgKX1cXG4ke2luZGVudH19YCk7XG5cdFx0fVxuXG5cdFx0aWYgKGxvYWRfZW52X2VhZ2VybHkpIHtcblx0XHRcdGJsb2Nrcy5wdXNoKGBpbXBvcnQoJHtzKGAke2Jhc2V9LyR7b3B0aW9ucy5hcHBfZGlyfS9lbnYuanNgKX0pLnRoZW4oKHsgZW52IH0pID0+IHtcblx0XHRcdFx0XHRcdCR7Z2xvYmFsfS5lbnYgPSBlbnY7XG5cblx0XHRcdFx0XHRcdFByb21pc2UuYWxsKFtcblx0XHRcdFx0XHRcdFx0aW1wb3J0KCR7cyhwcmVmaXhlZChjbGllbnQuc3RhcnQpKX0pLFxuXHRcdFx0XHRcdFx0XHRpbXBvcnQoJHtzKHByZWZpeGVkKGNsaWVudC5hcHApKX0pXG5cdFx0XHRcdFx0XHRdKS50aGVuKChba2l0LCBhcHBdKSA9PiB7XG5cdFx0XHRcdFx0XHRcdGtpdC5zdGFydCgke2FyZ3Muam9pbignLCAnKX0pO1xuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0fSk7YCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGJsb2Nrcy5wdXNoKGBQcm9taXNlLmFsbChbXG5cdFx0XHRcdFx0XHRpbXBvcnQoJHtzKHByZWZpeGVkKGNsaWVudC5zdGFydCkpfSksXG5cdFx0XHRcdFx0XHRpbXBvcnQoJHtzKHByZWZpeGVkKGNsaWVudC5hcHApKX0pXG5cdFx0XHRcdFx0XSkudGhlbigoW2tpdCwgYXBwXSkgPT4ge1xuXHRcdFx0XHRcdFx0a2l0LnN0YXJ0KCR7YXJncy5qb2luKCcsICcpfSk7XG5cdFx0XHRcdFx0fSk7YCk7XG5cdFx0fVxuXG5cdFx0aWYgKG9wdGlvbnMuc2VydmljZV93b3JrZXIpIHtcblx0XHRcdGNvbnN0IG9wdHMgPSBfX1NWRUxURUtJVF9ERVZfXyA/IFwiLCB7IHR5cGU6ICdtb2R1bGUnIH1cIiA6ICcnO1xuXG5cdFx0XHQvLyB3ZSB1c2UgYW4gYW5vbnltb3VzIGZ1bmN0aW9uIGluc3RlYWQgb2YgYW4gYXJyb3cgZnVuY3Rpb24gdG8gc3VwcG9ydFxuXHRcdFx0Ly8gb2xkZXIgYnJvd3NlcnMgKGh0dHBzOi8vZ2l0aHViLmNvbS9zdmVsdGVqcy9raXQvcHVsbC81NDE3KVxuXHRcdFx0YmxvY2tzLnB1c2goYGlmICgnc2VydmljZVdvcmtlcicgaW4gbmF2aWdhdG9yKSB7XG5cdFx0XHRcdFx0XHRhZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdFx0XHRuYXZpZ2F0b3Iuc2VydmljZVdvcmtlci5yZWdpc3RlcignJHtwcmVmaXhlZCgnc2VydmljZS13b3JrZXIuanMnKX0nJHtvcHRzfSk7XG5cdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHR9YCk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgaW5pdF9hcHAgPSBgXG5cdFx0XHRcdHtcblx0XHRcdFx0XHQke2Jsb2Nrcy5qb2luKCdcXG5cXG5cXHRcXHRcXHRcXHRcXHQnKX1cblx0XHRcdFx0fVxuXHRcdFx0YDtcblx0XHRjc3AuYWRkX3NjcmlwdChpbml0X2FwcCk7XG5cblx0XHRib2R5ICs9IGBcXG5cXHRcXHRcXHQ8c2NyaXB0JHtcblx0XHRcdGNzcC5zY3JpcHRfbmVlZHNfbm9uY2UgPyBgIG5vbmNlPVwiJHtjc3Aubm9uY2V9XCJgIDogJydcblx0XHR9PiR7aW5pdF9hcHB9PC9zY3JpcHQ+XFxuXFx0XFx0YDtcblx0fVxuXG5cdGNvbnN0IGhlYWRlcnMgPSBuZXcgSGVhZGVycyh7XG5cdFx0J3gtc3ZlbHRla2l0LXBhZ2UnOiAndHJ1ZScsXG5cdFx0J2NvbnRlbnQtdHlwZSc6ICd0ZXh0L2h0bWwnXG5cdH0pO1xuXG5cdGlmIChzdGF0ZS5wcmVyZW5kZXJpbmcpIHtcblx0XHQvLyBUT0RPIHJlYWQgaGVhZGVycyBzZXQgd2l0aCBzZXRIZWFkZXJzIGFuZCBjb252ZXJ0IGludG8gaHR0cC1lcXVpdiB3aGVyZSBwb3NzaWJsZVxuXHRcdGNvbnN0IGh0dHBfZXF1aXYgPSBbXTtcblxuXHRcdGNvbnN0IGNzcF9oZWFkZXJzID0gY3NwLmNzcF9wcm92aWRlci5nZXRfbWV0YSgpO1xuXHRcdGlmIChjc3BfaGVhZGVycykge1xuXHRcdFx0aHR0cF9lcXVpdi5wdXNoKGNzcF9oZWFkZXJzKTtcblx0XHR9XG5cblx0XHRpZiAoc3RhdGUucHJlcmVuZGVyaW5nLmNhY2hlKSB7XG5cdFx0XHRodHRwX2VxdWl2LnB1c2goYDxtZXRhIGh0dHAtZXF1aXY9XCJjYWNoZS1jb250cm9sXCIgY29udGVudD1cIiR7c3RhdGUucHJlcmVuZGVyaW5nLmNhY2hlfVwiPmApO1xuXHRcdH1cblxuXHRcdGlmIChodHRwX2VxdWl2Lmxlbmd0aCA+IDApIHtcblx0XHRcdGhlYWQgPSBodHRwX2VxdWl2LmpvaW4oJ1xcbicpICsgaGVhZDtcblx0XHR9XG5cdH0gZWxzZSB7XG5cdFx0Y29uc3QgY3NwX2hlYWRlciA9IGNzcC5jc3BfcHJvdmlkZXIuZ2V0X2hlYWRlcigpO1xuXHRcdGlmIChjc3BfaGVhZGVyKSB7XG5cdFx0XHRoZWFkZXJzLnNldCgnY29udGVudC1zZWN1cml0eS1wb2xpY3knLCBjc3BfaGVhZGVyKTtcblx0XHR9XG5cdFx0Y29uc3QgcmVwb3J0X29ubHlfaGVhZGVyID0gY3NwLnJlcG9ydF9vbmx5X3Byb3ZpZGVyLmdldF9oZWFkZXIoKTtcblx0XHRpZiAocmVwb3J0X29ubHlfaGVhZGVyKSB7XG5cdFx0XHRoZWFkZXJzLnNldCgnY29udGVudC1zZWN1cml0eS1wb2xpY3ktcmVwb3J0LW9ubHknLCByZXBvcnRfb25seV9oZWFkZXIpO1xuXHRcdH1cblxuXHRcdGlmIChsaW5rX2hlYWRlcl9wcmVsb2Fkcy5zaXplKSB7XG5cdFx0XHRoZWFkZXJzLnNldCgnbGluaycsIEFycmF5LmZyb20obGlua19oZWFkZXJfcHJlbG9hZHMpLmpvaW4oJywgJykpO1xuXHRcdH1cblx0fVxuXG5cdC8vIGFkZCB0aGUgY29udGVudCBhZnRlciB0aGUgc2NyaXB0L2NzcyBsaW5rcyBzbyB0aGUgbGluayBlbGVtZW50cyBhcmUgcGFyc2VkIGZpcnN0XG5cdGhlYWQgKz0gcmVuZGVyZWQuaGVhZDtcblxuXHRjb25zdCBodG1sID0gb3B0aW9ucy50ZW1wbGF0ZXMuYXBwKHtcblx0XHRoZWFkLFxuXHRcdGJvZHksXG5cdFx0YXNzZXRzLFxuXHRcdG5vbmNlOiAvKiogQHR5cGUge3N0cmluZ30gKi8gKGNzcC5ub25jZSksXG5cdFx0ZW52OiBzYWZlX3B1YmxpY19lbnZcblx0fSk7XG5cblx0Ly8gVE9ETyBmbHVzaCBjaHVua3MgYXMgZWFybHkgYXMgd2UgY2FuXG5cdGNvbnN0IHRyYW5zZm9ybWVkID1cblx0XHQoYXdhaXQgcmVzb2x2ZV9vcHRzLnRyYW5zZm9ybVBhZ2VDaHVuayh7XG5cdFx0XHRodG1sLFxuXHRcdFx0ZG9uZTogdHJ1ZVxuXHRcdH0pKSB8fCAnJztcblxuXHRpZiAoIWNodW5rcykge1xuXHRcdGhlYWRlcnMuc2V0KCdldGFnJywgYFwiJHtoYXNoKHRyYW5zZm9ybWVkKX1cImApO1xuXHR9XG5cblx0aWYgKERFVikge1xuXHRcdGlmIChwYWdlX2NvbmZpZy5jc3IpIHtcblx0XHRcdGlmICh0cmFuc2Zvcm1lZC5zcGxpdCgnPCEtLScpLmxlbmd0aCA8IGh0bWwuc3BsaXQoJzwhLS0nKS5sZW5ndGgpIHtcblx0XHRcdFx0Ly8gdGhlIFxcdTAwMUIgc3R1ZmYgaXMgQU5TSSBjb2Rlcywgc28gdGhhdCB3ZSBkb24ndCBuZWVkIHRvIGFkZCBhIGxpYnJhcnkgdG8gdGhlIHJ1bnRpbWVcblx0XHRcdFx0Ly8gaHR0cHM6Ly9zdmVsdGUuZGV2L3JlcGwvMWIzZjQ5Njk2ZjBjNDRjODgxYzM0NTg3ZjI1MzdhYTJcblx0XHRcdFx0Y29uc29sZS53YXJuKFxuXHRcdFx0XHRcdFwiXFx1MDAxQlsxbVxcdTAwMUJbMzFtUmVtb3ZpbmcgY29tbWVudHMgaW4gdHJhbnNmb3JtUGFnZUNodW5rIGNhbiBicmVhayBTdmVsdGUncyBoeWRyYXRpb25cXHUwMDFCWzM5bVxcdTAwMUJbMjJtXCJcblx0XHRcdFx0KTtcblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0aWYgKGNodW5rcykge1xuXHRcdFx0XHRjb25zb2xlLndhcm4oXG5cdFx0XHRcdFx0J1xcdTAwMUJbMW1cXHUwMDFCWzMxbVJldHVybmluZyBwcm9taXNlcyBmcm9tIHNlcnZlciBgbG9hZGAgZnVuY3Rpb25zIHdpbGwgb25seSB3b3JrIGlmIGBjc3IgPT09IHRydWVgXFx1MDAxQlszOW1cXHUwMDFCWzIybSdcblx0XHRcdFx0KTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gIWNodW5rc1xuXHRcdD8gdGV4dCh0cmFuc2Zvcm1lZCwge1xuXHRcdFx0XHRzdGF0dXMsXG5cdFx0XHRcdGhlYWRlcnNcblx0XHRcdH0pXG5cdFx0OiBuZXcgUmVzcG9uc2UoXG5cdFx0XHRcdG5ldyBSZWFkYWJsZVN0cmVhbSh7XG5cdFx0XHRcdFx0YXN5bmMgc3RhcnQoY29udHJvbGxlcikge1xuXHRcdFx0XHRcdFx0Y29udHJvbGxlci5lbnF1ZXVlKGVuY29kZXIuZW5jb2RlKHRyYW5zZm9ybWVkICsgJ1xcbicpKTtcblx0XHRcdFx0XHRcdGZvciBhd2FpdCAoY29uc3QgY2h1bmsgb2YgY2h1bmtzKSB7XG5cdFx0XHRcdFx0XHRcdGNvbnRyb2xsZXIuZW5xdWV1ZShlbmNvZGVyLmVuY29kZShjaHVuaykpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0Y29udHJvbGxlci5jbG9zZSgpO1xuXHRcdFx0XHRcdH0sXG5cblx0XHRcdFx0XHR0eXBlOiAnYnl0ZXMnXG5cdFx0XHRcdH0pLFxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0aGVhZGVyczoge1xuXHRcdFx0XHRcdFx0J2NvbnRlbnQtdHlwZSc6ICd0ZXh0L2h0bWwnXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHQpO1xufVxuXG4vKipcbiAqIElmIHRoZSBzZXJpYWxpemVkIGRhdGEgY29udGFpbnMgcHJvbWlzZXMsIGBjaHVua3NgIHdpbGwgYmUgYW5cbiAqIGFzeW5jIGl0ZXJhYmxlIGNvbnRhaW5pbmcgdGhlaXIgcmVzb2x1dGlvbnNcbiAqIEBwYXJhbSB7aW1wb3J0KCdAc3ZlbHRlanMva2l0JykuUmVxdWVzdEV2ZW50fSBldmVudFxuICogQHBhcmFtIHtpbXBvcnQoJ3R5cGVzJykuU1NST3B0aW9uc30gb3B0aW9uc1xuICogQHBhcmFtIHtBcnJheTxpbXBvcnQoJ3R5cGVzJykuU2VydmVyRGF0YU5vZGUgfCBudWxsPn0gbm9kZXNcbiAqIEBwYXJhbSB7c3RyaW5nfSBnbG9iYWxcbiAqIEByZXR1cm5zIHt7IGRhdGE6IHN0cmluZywgY2h1bmtzOiBBc3luY0l0ZXJhYmxlPHN0cmluZz4gfCBudWxsIH19XG4gKi9cbmZ1bmN0aW9uIGdldF9kYXRhKGV2ZW50LCBvcHRpb25zLCBub2RlcywgZ2xvYmFsKSB7XG5cdGxldCBwcm9taXNlX2lkID0gMTtcblx0bGV0IGNvdW50ID0gMDtcblxuXHRjb25zdCB7IGl0ZXJhdG9yLCBwdXNoLCBkb25lIH0gPSBjcmVhdGVfYXN5bmNfaXRlcmF0b3IoKTtcblxuXHQvKiogQHBhcmFtIHthbnl9IHRoaW5nICovXG5cdGZ1bmN0aW9uIHJlcGxhY2VyKHRoaW5nKSB7XG5cdFx0aWYgKHR5cGVvZiB0aGluZz8udGhlbiA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0Y29uc3QgaWQgPSBwcm9taXNlX2lkKys7XG5cdFx0XHRjb3VudCArPSAxO1xuXG5cdFx0XHR0aGluZ1xuXHRcdFx0XHQudGhlbigvKiogQHBhcmFtIHthbnl9IGRhdGEgKi8gKGRhdGEpID0+ICh7IGRhdGEgfSkpXG5cdFx0XHRcdC5jYXRjaChcblx0XHRcdFx0XHQvKiogQHBhcmFtIHthbnl9IGVycm9yICovIGFzeW5jIChlcnJvcikgPT4gKHtcblx0XHRcdFx0XHRcdGVycm9yOiBhd2FpdCBoYW5kbGVfZXJyb3JfYW5kX2pzb25pZnkoZXZlbnQsIG9wdGlvbnMsIGVycm9yKVxuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdClcblx0XHRcdFx0LnRoZW4oXG5cdFx0XHRcdFx0LyoqXG5cdFx0XHRcdFx0ICogQHBhcmFtIHt7ZGF0YTogYW55OyBlcnJvcjogYW55fX0gcmVzdWx0XG5cdFx0XHRcdFx0ICovXG5cdFx0XHRcdFx0YXN5bmMgKHsgZGF0YSwgZXJyb3IgfSkgPT4ge1xuXHRcdFx0XHRcdFx0Y291bnQgLT0gMTtcblxuXHRcdFx0XHRcdFx0bGV0IHN0cjtcblx0XHRcdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0XHRcdHN0ciA9IGRldmFsdWUudW5ldmFsKHsgaWQsIGRhdGEsIGVycm9yIH0sIHJlcGxhY2VyKTtcblx0XHRcdFx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0XHRcdFx0ZXJyb3IgPSBhd2FpdCBoYW5kbGVfZXJyb3JfYW5kX2pzb25pZnkoXG5cdFx0XHRcdFx0XHRcdFx0ZXZlbnQsXG5cdFx0XHRcdFx0XHRcdFx0b3B0aW9ucyxcblx0XHRcdFx0XHRcdFx0XHRuZXcgRXJyb3IoYEZhaWxlZCB0byBzZXJpYWxpemUgcHJvbWlzZSB3aGlsZSByZW5kZXJpbmcgJHtldmVudC5yb3V0ZS5pZH1gKVxuXHRcdFx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdFx0XHRkYXRhID0gdW5kZWZpbmVkO1xuXHRcdFx0XHRcdFx0XHRzdHIgPSBkZXZhbHVlLnVuZXZhbCh7IGlkLCBkYXRhLCBlcnJvciB9LCByZXBsYWNlcik7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdHB1c2goYDxzY3JpcHQ+JHtnbG9iYWx9LnJlc29sdmUoJHtzdHJ9KTwvc2NyaXB0PlxcbmApO1xuXHRcdFx0XHRcdFx0aWYgKGNvdW50ID09PSAwKSBkb25lKCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHQpO1xuXG5cdFx0XHRyZXR1cm4gYCR7Z2xvYmFsfS5kZWZlcigke2lkfSlgO1xuXHRcdH1cblx0fVxuXG5cdHRyeSB7XG5cdFx0Y29uc3Qgc3RyaW5ncyA9IG5vZGVzLm1hcCgobm9kZSkgPT4ge1xuXHRcdFx0aWYgKCFub2RlKSByZXR1cm4gJ251bGwnO1xuXG5cdFx0XHRyZXR1cm4gYHtcInR5cGVcIjpcImRhdGFcIixcImRhdGFcIjoke2RldmFsdWUudW5ldmFsKG5vZGUuZGF0YSwgcmVwbGFjZXIpfSwke3N0cmluZ2lmeV91c2VzKG5vZGUpfSR7XG5cdFx0XHRcdG5vZGUuc2xhc2ggPyBgLFwic2xhc2hcIjoke0pTT04uc3RyaW5naWZ5KG5vZGUuc2xhc2gpfWAgOiAnJ1xuXHRcdFx0fX1gO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIHtcblx0XHRcdGRhdGE6IGBbJHtzdHJpbmdzLmpvaW4oJywnKX1dYCxcblx0XHRcdGNodW5rczogY291bnQgPiAwID8gaXRlcmF0b3IgOiBudWxsXG5cdFx0fTtcblx0fSBjYXRjaCAoZSkge1xuXHRcdHRocm93IG5ldyBFcnJvcihjbGFyaWZ5X2RldmFsdWVfZXJyb3IoZXZlbnQsIC8qKiBAdHlwZSB7YW55fSAqLyAoZSkpKTtcblx0fVxufVxuIiwiLyoqXG4gKiBAdGVtcGxhdGUgeydwcmVyZW5kZXInIHwgJ3NzcicgfCAnY3NyJyB8ICd0cmFpbGluZ1NsYXNoJyB8ICdlbnRyaWVzJ30gT3B0aW9uXG4gKiBAdGVtcGxhdGUgeyhpbXBvcnQoJ3R5cGVzJykuU1NSTm9kZVsndW5pdmVyc2FsJ10gfCBpbXBvcnQoJ3R5cGVzJykuU1NSTm9kZVsnc2VydmVyJ10pW09wdGlvbl19IFZhbHVlXG4gKlxuICogQHBhcmFtIHtBcnJheTxpbXBvcnQoJ3R5cGVzJykuU1NSTm9kZSB8IHVuZGVmaW5lZD59IG5vZGVzXG4gKiBAcGFyYW0ge09wdGlvbn0gb3B0aW9uXG4gKlxuICogQHJldHVybnMge1ZhbHVlIHwgdW5kZWZpbmVkfVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0X29wdGlvbihub2Rlcywgb3B0aW9uKSB7XG5cdHJldHVybiBub2Rlcy5yZWR1Y2UoKHZhbHVlLCBub2RlKSA9PiB7XG5cdFx0cmV0dXJuIC8qKiBAdHlwZSB7VmFsdWV9IFR5cGVTY3JpcHQncyB0b28gZHVtYiB0byB1bmRlcnN0YW5kIHRoaXMgKi8gKFxuXHRcdFx0bm9kZT8udW5pdmVyc2FsPy5bb3B0aW9uXSA/PyBub2RlPy5zZXJ2ZXI/LltvcHRpb25dID8/IHZhbHVlXG5cdFx0KTtcblx0fSwgLyoqIEB0eXBlIHtWYWx1ZSB8IHVuZGVmaW5lZH0gKi8gKHVuZGVmaW5lZCkpO1xufVxuIiwiaW1wb3J0IHsgcmVuZGVyX3Jlc3BvbnNlIH0gZnJvbSAnLi9yZW5kZXIuanMnO1xuaW1wb3J0IHsgbG9hZF9kYXRhLCBsb2FkX3NlcnZlcl9kYXRhIH0gZnJvbSAnLi9sb2FkX2RhdGEuanMnO1xuaW1wb3J0IHsgaGFuZGxlX2Vycm9yX2FuZF9qc29uaWZ5LCBzdGF0aWNfZXJyb3JfcGFnZSwgcmVkaXJlY3RfcmVzcG9uc2UgfSBmcm9tICcuLi91dGlscy5qcyc7XG5pbXBvcnQgeyBnZXRfb3B0aW9uIH0gZnJvbSAnLi4vLi4vLi4vdXRpbHMvb3B0aW9ucy5qcyc7XG5pbXBvcnQgeyBSZWRpcmVjdCB9IGZyb20gJy4uLy4uL2NvbnRyb2wuanMnO1xuaW1wb3J0IHsgZ2V0X3N0YXR1cyB9IGZyb20gJy4uLy4uLy4uL3V0aWxzL2Vycm9yLmpzJztcblxuLyoqXG4gKiBAdHlwZWRlZiB7aW1wb3J0KCcuL3R5cGVzLmpzJykuTG9hZGVkfSBMb2FkZWRcbiAqL1xuXG4vKipcbiAqIEBwYXJhbSB7e1xuICogICBldmVudDogaW1wb3J0KCdAc3ZlbHRlanMva2l0JykuUmVxdWVzdEV2ZW50O1xuICogICBvcHRpb25zOiBpbXBvcnQoJ3R5cGVzJykuU1NST3B0aW9ucztcbiAqICAgbWFuaWZlc3Q6IGltcG9ydCgnQHN2ZWx0ZWpzL2tpdCcpLlNTUk1hbmlmZXN0O1xuICogICBzdGF0ZTogaW1wb3J0KCd0eXBlcycpLlNTUlN0YXRlO1xuICogICBzdGF0dXM6IG51bWJlcjtcbiAqICAgZXJyb3I6IHVua25vd247XG4gKiAgIHJlc29sdmVfb3B0czogaW1wb3J0KCd0eXBlcycpLlJlcXVpcmVkUmVzb2x2ZU9wdGlvbnM7XG4gKiB9fSBvcHRzXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZXNwb25kX3dpdGhfZXJyb3Ioe1xuXHRldmVudCxcblx0b3B0aW9ucyxcblx0bWFuaWZlc3QsXG5cdHN0YXRlLFxuXHRzdGF0dXMsXG5cdGVycm9yLFxuXHRyZXNvbHZlX29wdHNcbn0pIHtcblx0Ly8gcmVyb3V0ZSB0byB0aGUgZmFsbGJhY2sgcGFnZSB0byBwcmV2ZW50IGFuIGluZmluaXRlIGNoYWluIG9mIHJlcXVlc3RzLlxuXHRpZiAoZXZlbnQucmVxdWVzdC5oZWFkZXJzLmdldCgneC1zdmVsdGVraXQtZXJyb3InKSkge1xuXHRcdHJldHVybiBzdGF0aWNfZXJyb3JfcGFnZShvcHRpb25zLCBzdGF0dXMsIC8qKiBAdHlwZSB7RXJyb3J9ICovIChlcnJvcikubWVzc2FnZSk7XG5cdH1cblxuXHQvKiogQHR5cGUge2ltcG9ydCgnLi90eXBlcy5qcycpLkZldGNoZWRbXX0gKi9cblx0Y29uc3QgZmV0Y2hlZCA9IFtdO1xuXG5cdHRyeSB7XG5cdFx0Y29uc3QgYnJhbmNoID0gW107XG5cdFx0Y29uc3QgZGVmYXVsdF9sYXlvdXQgPSBhd2FpdCBtYW5pZmVzdC5fLm5vZGVzWzBdKCk7IC8vIDAgaXMgYWx3YXlzIHRoZSByb290IGxheW91dFxuXHRcdGNvbnN0IHNzciA9IGdldF9vcHRpb24oW2RlZmF1bHRfbGF5b3V0XSwgJ3NzcicpID8/IHRydWU7XG5cdFx0Y29uc3QgY3NyID0gZ2V0X29wdGlvbihbZGVmYXVsdF9sYXlvdXRdLCAnY3NyJykgPz8gdHJ1ZTtcblxuXHRcdGlmIChzc3IpIHtcblx0XHRcdHN0YXRlLmVycm9yID0gdHJ1ZTtcblxuXHRcdFx0Y29uc3Qgc2VydmVyX2RhdGFfcHJvbWlzZSA9IGxvYWRfc2VydmVyX2RhdGEoe1xuXHRcdFx0XHRldmVudCxcblx0XHRcdFx0c3RhdGUsXG5cdFx0XHRcdG5vZGU6IGRlZmF1bHRfbGF5b3V0LFxuXHRcdFx0XHRwYXJlbnQ6IGFzeW5jICgpID0+ICh7fSlcblx0XHRcdH0pO1xuXG5cdFx0XHRjb25zdCBzZXJ2ZXJfZGF0YSA9IGF3YWl0IHNlcnZlcl9kYXRhX3Byb21pc2U7XG5cblx0XHRcdGNvbnN0IGRhdGEgPSBhd2FpdCBsb2FkX2RhdGEoe1xuXHRcdFx0XHRldmVudCxcblx0XHRcdFx0ZmV0Y2hlZCxcblx0XHRcdFx0bm9kZTogZGVmYXVsdF9sYXlvdXQsXG5cdFx0XHRcdHBhcmVudDogYXN5bmMgKCkgPT4gKHt9KSxcblx0XHRcdFx0cmVzb2x2ZV9vcHRzLFxuXHRcdFx0XHRzZXJ2ZXJfZGF0YV9wcm9taXNlLFxuXHRcdFx0XHRzdGF0ZSxcblx0XHRcdFx0Y3NyXG5cdFx0XHR9KTtcblxuXHRcdFx0YnJhbmNoLnB1c2goXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRub2RlOiBkZWZhdWx0X2xheW91dCxcblx0XHRcdFx0XHRzZXJ2ZXJfZGF0YSxcblx0XHRcdFx0XHRkYXRhXG5cdFx0XHRcdH0sXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRub2RlOiBhd2FpdCBtYW5pZmVzdC5fLm5vZGVzWzFdKCksIC8vIDEgaXMgYWx3YXlzIHRoZSByb290IGVycm9yXG5cdFx0XHRcdFx0ZGF0YTogbnVsbCxcblx0XHRcdFx0XHRzZXJ2ZXJfZGF0YTogbnVsbFxuXHRcdFx0XHR9XG5cdFx0XHQpO1xuXHRcdH1cblxuXHRcdHJldHVybiBhd2FpdCByZW5kZXJfcmVzcG9uc2Uoe1xuXHRcdFx0b3B0aW9ucyxcblx0XHRcdG1hbmlmZXN0LFxuXHRcdFx0c3RhdGUsXG5cdFx0XHRwYWdlX2NvbmZpZzoge1xuXHRcdFx0XHRzc3IsXG5cdFx0XHRcdGNzclxuXHRcdFx0fSxcblx0XHRcdHN0YXR1cyxcblx0XHRcdGVycm9yOiBhd2FpdCBoYW5kbGVfZXJyb3JfYW5kX2pzb25pZnkoZXZlbnQsIG9wdGlvbnMsIGVycm9yKSxcblx0XHRcdGJyYW5jaCxcblx0XHRcdGZldGNoZWQsXG5cdFx0XHRldmVudCxcblx0XHRcdHJlc29sdmVfb3B0c1xuXHRcdH0pO1xuXHR9IGNhdGNoIChlKSB7XG5cdFx0Ly8gRWRnZSBjYXNlOiBJZiByb3V0ZSBpcyBhIDQwNCBhbmQgdGhlIHVzZXIgcmVkaXJlY3RzIHRvIHNvbWV3aGVyZSBmcm9tIHRoZSByb290IGxheW91dCxcblx0XHQvLyB3ZSBlbmQgdXAgaGVyZS5cblx0XHRpZiAoZSBpbnN0YW5jZW9mIFJlZGlyZWN0KSB7XG5cdFx0XHRyZXR1cm4gcmVkaXJlY3RfcmVzcG9uc2UoZS5zdGF0dXMsIGUubG9jYXRpb24pO1xuXHRcdH1cblxuXHRcdHJldHVybiBzdGF0aWNfZXJyb3JfcGFnZShcblx0XHRcdG9wdGlvbnMsXG5cdFx0XHRnZXRfc3RhdHVzKGUpLFxuXHRcdFx0KGF3YWl0IGhhbmRsZV9lcnJvcl9hbmRfanNvbmlmeShldmVudCwgb3B0aW9ucywgZSkpLm1lc3NhZ2Vcblx0XHQpO1xuXHR9XG59XG4iLCIvKipcbiAqIEB0ZW1wbGF0ZSBUXG4gKiBAcGFyYW0geygpID0+IFR9IGZuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBvbmNlKGZuKSB7XG5cdGxldCBkb25lID0gZmFsc2U7XG5cblx0LyoqIEB0eXBlIFQgKi9cblx0bGV0IHJlc3VsdDtcblxuXHRyZXR1cm4gKCkgPT4ge1xuXHRcdGlmIChkb25lKSByZXR1cm4gcmVzdWx0O1xuXHRcdGRvbmUgPSB0cnVlO1xuXHRcdHJldHVybiAocmVzdWx0ID0gZm4oKSk7XG5cdH07XG59XG4iLCJpbXBvcnQgeyBIdHRwRXJyb3IsIFN2ZWx0ZUtpdEVycm9yLCBSZWRpcmVjdCB9IGZyb20gJy4uLy4uL2NvbnRyb2wuanMnO1xuaW1wb3J0IHsgbm9ybWFsaXplX2Vycm9yIH0gZnJvbSAnLi4vLi4vLi4vdXRpbHMvZXJyb3IuanMnO1xuaW1wb3J0IHsgb25jZSB9IGZyb20gJy4uLy4uLy4uL3V0aWxzL2Z1bmN0aW9ucy5qcyc7XG5pbXBvcnQgeyBsb2FkX3NlcnZlcl9kYXRhIH0gZnJvbSAnLi4vcGFnZS9sb2FkX2RhdGEuanMnO1xuaW1wb3J0IHsgY2xhcmlmeV9kZXZhbHVlX2Vycm9yLCBoYW5kbGVfZXJyb3JfYW5kX2pzb25pZnksIHN0cmluZ2lmeV91c2VzIH0gZnJvbSAnLi4vdXRpbHMuanMnO1xuaW1wb3J0IHsgbm9ybWFsaXplX3BhdGggfSBmcm9tICcuLi8uLi8uLi91dGlscy91cmwuanMnO1xuaW1wb3J0IHsgdGV4dCB9IGZyb20gJy4uLy4uLy4uL2V4cG9ydHMvaW5kZXguanMnO1xuaW1wb3J0ICogYXMgZGV2YWx1ZSBmcm9tICdkZXZhbHVlJztcbmltcG9ydCB7IGNyZWF0ZV9hc3luY19pdGVyYXRvciB9IGZyb20gJy4uLy4uLy4uL3V0aWxzL3N0cmVhbWluZy5qcyc7XG5cbmNvbnN0IGVuY29kZXIgPSBuZXcgVGV4dEVuY29kZXIoKTtcblxuLyoqXG4gKiBAcGFyYW0ge2ltcG9ydCgnQHN2ZWx0ZWpzL2tpdCcpLlJlcXVlc3RFdmVudH0gZXZlbnRcbiAqIEBwYXJhbSB7aW1wb3J0KCd0eXBlcycpLlNTUlJvdXRlfSByb3V0ZVxuICogQHBhcmFtIHtpbXBvcnQoJ3R5cGVzJykuU1NST3B0aW9uc30gb3B0aW9uc1xuICogQHBhcmFtIHtpbXBvcnQoJ0BzdmVsdGVqcy9raXQnKS5TU1JNYW5pZmVzdH0gbWFuaWZlc3RcbiAqIEBwYXJhbSB7aW1wb3J0KCd0eXBlcycpLlNTUlN0YXRlfSBzdGF0ZVxuICogQHBhcmFtIHtib29sZWFuW10gfCB1bmRlZmluZWR9IGludmFsaWRhdGVkX2RhdGFfbm9kZXNcbiAqIEBwYXJhbSB7aW1wb3J0KCd0eXBlcycpLlRyYWlsaW5nU2xhc2h9IHRyYWlsaW5nX3NsYXNoXG4gKiBAcmV0dXJucyB7UHJvbWlzZTxSZXNwb25zZT59XG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZW5kZXJfZGF0YShcblx0ZXZlbnQsXG5cdHJvdXRlLFxuXHRvcHRpb25zLFxuXHRtYW5pZmVzdCxcblx0c3RhdGUsXG5cdGludmFsaWRhdGVkX2RhdGFfbm9kZXMsXG5cdHRyYWlsaW5nX3NsYXNoXG4pIHtcblx0aWYgKCFyb3V0ZS5wYWdlKSB7XG5cdFx0Ly8gcmVxdWVzdGluZyAvX19kYXRhLmpzb24gc2hvdWxkIGZhaWwgZm9yIGEgK3NlcnZlci5qc1xuXHRcdHJldHVybiBuZXcgUmVzcG9uc2UodW5kZWZpbmVkLCB7XG5cdFx0XHRzdGF0dXM6IDQwNFxuXHRcdH0pO1xuXHR9XG5cblx0dHJ5IHtcblx0XHRjb25zdCBub2RlX2lkcyA9IFsuLi5yb3V0ZS5wYWdlLmxheW91dHMsIHJvdXRlLnBhZ2UubGVhZl07XG5cdFx0Y29uc3QgaW52YWxpZGF0ZWQgPSBpbnZhbGlkYXRlZF9kYXRhX25vZGVzID8/IG5vZGVfaWRzLm1hcCgoKSA9PiB0cnVlKTtcblxuXHRcdGxldCBhYm9ydGVkID0gZmFsc2U7XG5cblx0XHRjb25zdCB1cmwgPSBuZXcgVVJMKGV2ZW50LnVybCk7XG5cdFx0dXJsLnBhdGhuYW1lID0gbm9ybWFsaXplX3BhdGgodXJsLnBhdGhuYW1lLCB0cmFpbGluZ19zbGFzaCk7XG5cblx0XHRjb25zdCBuZXdfZXZlbnQgPSB7IC4uLmV2ZW50LCB1cmwgfTtcblxuXHRcdGNvbnN0IGZ1bmN0aW9ucyA9IG5vZGVfaWRzLm1hcCgobiwgaSkgPT4ge1xuXHRcdFx0cmV0dXJuIG9uY2UoYXN5bmMgKCkgPT4ge1xuXHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdGlmIChhYm9ydGVkKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gLyoqIEB0eXBlIHtpbXBvcnQoJ3R5cGVzJykuU2VydmVyRGF0YVNraXBwZWROb2RlfSAqLyAoe1xuXHRcdFx0XHRcdFx0XHR0eXBlOiAnc2tpcCdcblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdC8vID09IGJlY2F1c2UgaXQgY291bGQgYmUgdW5kZWZpbmVkIChpbiBkZXYpIG9yIG51bGwgKGluIGJ1aWxkLCBiZWNhdXNlIG9mIEpTT04uc3RyaW5naWZ5KVxuXHRcdFx0XHRcdGNvbnN0IG5vZGUgPSBuID09IHVuZGVmaW5lZCA/IG4gOiBhd2FpdCBtYW5pZmVzdC5fLm5vZGVzW25dKCk7XG5cdFx0XHRcdFx0Ly8gbG9hZCB0aGlzLiBmb3IgdGhlIGNoaWxkLCByZXR1cm4gYXMgaXMuIGZvciB0aGUgZmluYWwgcmVzdWx0LCBzdHJlYW0gdGhpbmdzXG5cdFx0XHRcdFx0cmV0dXJuIGxvYWRfc2VydmVyX2RhdGEoe1xuXHRcdFx0XHRcdFx0ZXZlbnQ6IG5ld19ldmVudCxcblx0XHRcdFx0XHRcdHN0YXRlLFxuXHRcdFx0XHRcdFx0bm9kZSxcblx0XHRcdFx0XHRcdHBhcmVudDogYXN5bmMgKCkgPT4ge1xuXHRcdFx0XHRcdFx0XHQvKiogQHR5cGUge1JlY29yZDxzdHJpbmcsIGFueT59ICovXG5cdFx0XHRcdFx0XHRcdGNvbnN0IGRhdGEgPSB7fTtcblx0XHRcdFx0XHRcdFx0Zm9yIChsZXQgaiA9IDA7IGogPCBpOyBqICs9IDEpIHtcblx0XHRcdFx0XHRcdFx0XHRjb25zdCBwYXJlbnQgPSAvKiogQHR5cGUge2ltcG9ydCgndHlwZXMnKS5TZXJ2ZXJEYXRhTm9kZSB8IG51bGx9ICovIChcblx0XHRcdFx0XHRcdFx0XHRcdGF3YWl0IGZ1bmN0aW9uc1tqXSgpXG5cdFx0XHRcdFx0XHRcdFx0KTtcblxuXHRcdFx0XHRcdFx0XHRcdGlmIChwYXJlbnQpIHtcblx0XHRcdFx0XHRcdFx0XHRcdE9iamVjdC5hc3NpZ24oZGF0YSwgcGFyZW50LmRhdGEpO1xuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRyZXR1cm4gZGF0YTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHRcdGFib3J0ZWQgPSB0cnVlO1xuXHRcdFx0XHRcdHRocm93IGU7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH0pO1xuXG5cdFx0Y29uc3QgcHJvbWlzZXMgPSBmdW5jdGlvbnMubWFwKGFzeW5jIChmbiwgaSkgPT4ge1xuXHRcdFx0aWYgKCFpbnZhbGlkYXRlZFtpXSkge1xuXHRcdFx0XHRyZXR1cm4gLyoqIEB0eXBlIHtpbXBvcnQoJ3R5cGVzJykuU2VydmVyRGF0YVNraXBwZWROb2RlfSAqLyAoe1xuXHRcdFx0XHRcdHR5cGU6ICdza2lwJ1xuXHRcdFx0XHR9KTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIGZuKCk7XG5cdFx0fSk7XG5cblx0XHRsZXQgbGVuZ3RoID0gcHJvbWlzZXMubGVuZ3RoO1xuXHRcdGNvbnN0IG5vZGVzID0gYXdhaXQgUHJvbWlzZS5hbGwoXG5cdFx0XHRwcm9taXNlcy5tYXAoKHAsIGkpID0+XG5cdFx0XHRcdHAuY2F0Y2goYXN5bmMgKGVycm9yKSA9PiB7XG5cdFx0XHRcdFx0aWYgKGVycm9yIGluc3RhbmNlb2YgUmVkaXJlY3QpIHtcblx0XHRcdFx0XHRcdHRocm93IGVycm9yO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdC8vIE1hdGgubWluIGJlY2F1c2UgYXJyYXkgaXNuJ3QgZ3VhcmFudGVlZCB0byByZXNvbHZlIGluIG9yZGVyXG5cdFx0XHRcdFx0bGVuZ3RoID0gTWF0aC5taW4obGVuZ3RoLCBpICsgMSk7XG5cblx0XHRcdFx0XHRyZXR1cm4gLyoqIEB0eXBlIHtpbXBvcnQoJ3R5cGVzJykuU2VydmVyRXJyb3JOb2RlfSAqLyAoe1xuXHRcdFx0XHRcdFx0dHlwZTogJ2Vycm9yJyxcblx0XHRcdFx0XHRcdGVycm9yOiBhd2FpdCBoYW5kbGVfZXJyb3JfYW5kX2pzb25pZnkoZXZlbnQsIG9wdGlvbnMsIGVycm9yKSxcblx0XHRcdFx0XHRcdHN0YXR1czpcblx0XHRcdFx0XHRcdFx0ZXJyb3IgaW5zdGFuY2VvZiBIdHRwRXJyb3IgfHwgZXJyb3IgaW5zdGFuY2VvZiBTdmVsdGVLaXRFcnJvclxuXHRcdFx0XHRcdFx0XHRcdD8gZXJyb3Iuc3RhdHVzXG5cdFx0XHRcdFx0XHRcdFx0OiB1bmRlZmluZWRcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fSlcblx0XHRcdClcblx0XHQpO1xuXG5cdFx0Y29uc3QgeyBkYXRhLCBjaHVua3MgfSA9IGdldF9kYXRhX2pzb24oZXZlbnQsIG9wdGlvbnMsIG5vZGVzKTtcblxuXHRcdGlmICghY2h1bmtzKSB7XG5cdFx0XHQvLyB1c2UgYSBub3JtYWwgSlNPTiByZXNwb25zZSB3aGVyZSBwb3NzaWJsZSwgc28gd2UgZ2V0IGBjb250ZW50LWxlbmd0aGBcblx0XHRcdC8vIGFuZCBjYW4gdXNlIGJyb3dzZXIgSlNPTiBkZXZ0b29scyBmb3IgZWFzaWVyIGluc3BlY3Rpbmdcblx0XHRcdHJldHVybiBqc29uX3Jlc3BvbnNlKGRhdGEpO1xuXHRcdH1cblxuXHRcdHJldHVybiBuZXcgUmVzcG9uc2UoXG5cdFx0XHRuZXcgUmVhZGFibGVTdHJlYW0oe1xuXHRcdFx0XHRhc3luYyBzdGFydChjb250cm9sbGVyKSB7XG5cdFx0XHRcdFx0Y29udHJvbGxlci5lbnF1ZXVlKGVuY29kZXIuZW5jb2RlKGRhdGEpKTtcblx0XHRcdFx0XHRmb3IgYXdhaXQgKGNvbnN0IGNodW5rIG9mIGNodW5rcykge1xuXHRcdFx0XHRcdFx0Y29udHJvbGxlci5lbnF1ZXVlKGVuY29kZXIuZW5jb2RlKGNodW5rKSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGNvbnRyb2xsZXIuY2xvc2UoKTtcblx0XHRcdFx0fSxcblxuXHRcdFx0XHR0eXBlOiAnYnl0ZXMnXG5cdFx0XHR9KSxcblx0XHRcdHtcblx0XHRcdFx0aGVhZGVyczoge1xuXHRcdFx0XHRcdC8vIHdlIHVzZSBhIHByb3ByaWV0YXJ5IGNvbnRlbnQgdHlwZSB0byBwcmV2ZW50IGJ1ZmZlcmluZy5cblx0XHRcdFx0XHQvLyB0aGUgYHRleHRgIHByZWZpeCBtYWtlcyBpdCBpbnNwZWN0YWJsZVxuXHRcdFx0XHRcdCdjb250ZW50LXR5cGUnOiAndGV4dC9zdmVsdGVraXQtZGF0YScsXG5cdFx0XHRcdFx0J2NhY2hlLWNvbnRyb2wnOiAncHJpdmF0ZSwgbm8tc3RvcmUnXG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHQpO1xuXHR9IGNhdGNoIChlKSB7XG5cdFx0Y29uc3QgZXJyb3IgPSBub3JtYWxpemVfZXJyb3IoZSk7XG5cblx0XHRpZiAoZXJyb3IgaW5zdGFuY2VvZiBSZWRpcmVjdCkge1xuXHRcdFx0cmV0dXJuIHJlZGlyZWN0X2pzb25fcmVzcG9uc2UoZXJyb3IpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4ganNvbl9yZXNwb25zZShhd2FpdCBoYW5kbGVfZXJyb3JfYW5kX2pzb25pZnkoZXZlbnQsIG9wdGlvbnMsIGVycm9yKSwgNTAwKTtcblx0XHR9XG5cdH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIGFueT4gfCBzdHJpbmd9IGpzb25cbiAqIEBwYXJhbSB7bnVtYmVyfSBbc3RhdHVzXVxuICovXG5mdW5jdGlvbiBqc29uX3Jlc3BvbnNlKGpzb24sIHN0YXR1cyA9IDIwMCkge1xuXHRyZXR1cm4gdGV4dCh0eXBlb2YganNvbiA9PT0gJ3N0cmluZycgPyBqc29uIDogSlNPTi5zdHJpbmdpZnkoanNvbiksIHtcblx0XHRzdGF0dXMsXG5cdFx0aGVhZGVyczoge1xuXHRcdFx0J2NvbnRlbnQtdHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcblx0XHRcdCdjYWNoZS1jb250cm9sJzogJ3ByaXZhdGUsIG5vLXN0b3JlJ1xuXHRcdH1cblx0fSk7XG59XG5cbi8qKlxuICogQHBhcmFtIHtSZWRpcmVjdH0gcmVkaXJlY3RcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlZGlyZWN0X2pzb25fcmVzcG9uc2UocmVkaXJlY3QpIHtcblx0cmV0dXJuIGpzb25fcmVzcG9uc2Uoe1xuXHRcdHR5cGU6ICdyZWRpcmVjdCcsXG5cdFx0bG9jYXRpb246IHJlZGlyZWN0LmxvY2F0aW9uXG5cdH0pO1xufVxuXG4vKipcbiAqIElmIHRoZSBzZXJpYWxpemVkIGRhdGEgY29udGFpbnMgcHJvbWlzZXMsIGBjaHVua3NgIHdpbGwgYmUgYW5cbiAqIGFzeW5jIGl0ZXJhYmxlIGNvbnRhaW5pbmcgdGhlaXIgcmVzb2x1dGlvbnNcbiAqIEBwYXJhbSB7aW1wb3J0KCdAc3ZlbHRlanMva2l0JykuUmVxdWVzdEV2ZW50fSBldmVudFxuICogQHBhcmFtIHtpbXBvcnQoJ3R5cGVzJykuU1NST3B0aW9uc30gb3B0aW9uc1xuICogQHBhcmFtIHtBcnJheTxpbXBvcnQoJ3R5cGVzJykuU2VydmVyRGF0YVNraXBwZWROb2RlIHwgaW1wb3J0KCd0eXBlcycpLlNlcnZlckRhdGFOb2RlIHwgaW1wb3J0KCd0eXBlcycpLlNlcnZlckVycm9yTm9kZSB8IG51bGwgfCB1bmRlZmluZWQ+fSBub2Rlc1xuICogIEByZXR1cm5zIHt7IGRhdGE6IHN0cmluZywgY2h1bmtzOiBBc3luY0l0ZXJhYmxlPHN0cmluZz4gfCBudWxsIH19XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRfZGF0YV9qc29uKGV2ZW50LCBvcHRpb25zLCBub2Rlcykge1xuXHRsZXQgcHJvbWlzZV9pZCA9IDE7XG5cdGxldCBjb3VudCA9IDA7XG5cblx0Y29uc3QgeyBpdGVyYXRvciwgcHVzaCwgZG9uZSB9ID0gY3JlYXRlX2FzeW5jX2l0ZXJhdG9yKCk7XG5cblx0Y29uc3QgcmVkdWNlcnMgPSB7XG5cdFx0LyoqIEBwYXJhbSB7YW55fSB0aGluZyAqL1xuXHRcdFByb21pc2U6ICh0aGluZykgPT4ge1xuXHRcdFx0aWYgKHR5cGVvZiB0aGluZz8udGhlbiA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRjb25zdCBpZCA9IHByb21pc2VfaWQrKztcblx0XHRcdFx0Y291bnQgKz0gMTtcblxuXHRcdFx0XHQvKiogQHR5cGUgeydkYXRhJyB8ICdlcnJvcid9ICovXG5cdFx0XHRcdGxldCBrZXkgPSAnZGF0YSc7XG5cblx0XHRcdFx0dGhpbmdcblx0XHRcdFx0XHQuY2F0Y2goXG5cdFx0XHRcdFx0XHQvKiogQHBhcmFtIHthbnl9IGUgKi8gYXN5bmMgKGUpID0+IHtcblx0XHRcdFx0XHRcdFx0a2V5ID0gJ2Vycm9yJztcblx0XHRcdFx0XHRcdFx0cmV0dXJuIGhhbmRsZV9lcnJvcl9hbmRfanNvbmlmeShldmVudCwgb3B0aW9ucywgLyoqIEB0eXBlIHthbnl9ICovIChlKSk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0KVxuXHRcdFx0XHRcdC50aGVuKFxuXHRcdFx0XHRcdFx0LyoqIEBwYXJhbSB7YW55fSB2YWx1ZSAqL1xuXHRcdFx0XHRcdFx0YXN5bmMgKHZhbHVlKSA9PiB7XG5cdFx0XHRcdFx0XHRcdGxldCBzdHI7XG5cdFx0XHRcdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0XHRcdFx0c3RyID0gZGV2YWx1ZS5zdHJpbmdpZnkodmFsdWUsIHJlZHVjZXJzKTtcblx0XHRcdFx0XHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHRcdFx0XHRcdGNvbnN0IGVycm9yID0gYXdhaXQgaGFuZGxlX2Vycm9yX2FuZF9qc29uaWZ5KFxuXHRcdFx0XHRcdFx0XHRcdFx0ZXZlbnQsXG5cdFx0XHRcdFx0XHRcdFx0XHRvcHRpb25zLFxuXHRcdFx0XHRcdFx0XHRcdFx0bmV3IEVycm9yKGBGYWlsZWQgdG8gc2VyaWFsaXplIHByb21pc2Ugd2hpbGUgcmVuZGVyaW5nICR7ZXZlbnQucm91dGUuaWR9YClcblx0XHRcdFx0XHRcdFx0XHQpO1xuXG5cdFx0XHRcdFx0XHRcdFx0a2V5ID0gJ2Vycm9yJztcblx0XHRcdFx0XHRcdFx0XHRzdHIgPSBkZXZhbHVlLnN0cmluZ2lmeShlcnJvciwgcmVkdWNlcnMpO1xuXHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0Y291bnQgLT0gMTtcblxuXHRcdFx0XHRcdFx0XHRwdXNoKGB7XCJ0eXBlXCI6XCJjaHVua1wiLFwiaWRcIjoke2lkfSxcIiR7a2V5fVwiOiR7c3RyfX1cXG5gKTtcblx0XHRcdFx0XHRcdFx0aWYgKGNvdW50ID09PSAwKSBkb25lKCk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0KTtcblxuXHRcdFx0XHRyZXR1cm4gaWQ7XG5cdFx0XHR9XG5cdFx0fVxuXHR9O1xuXG5cdHRyeSB7XG5cdFx0Y29uc3Qgc3RyaW5ncyA9IG5vZGVzLm1hcCgobm9kZSkgPT4ge1xuXHRcdFx0aWYgKCFub2RlKSByZXR1cm4gJ251bGwnO1xuXG5cdFx0XHRpZiAobm9kZS50eXBlID09PSAnZXJyb3InIHx8IG5vZGUudHlwZSA9PT0gJ3NraXAnKSB7XG5cdFx0XHRcdHJldHVybiBKU09OLnN0cmluZ2lmeShub2RlKTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIGB7XCJ0eXBlXCI6XCJkYXRhXCIsXCJkYXRhXCI6JHtkZXZhbHVlLnN0cmluZ2lmeShub2RlLmRhdGEsIHJlZHVjZXJzKX0sJHtzdHJpbmdpZnlfdXNlcyhcblx0XHRcdFx0bm9kZVxuXHRcdFx0KX0ke25vZGUuc2xhc2ggPyBgLFwic2xhc2hcIjoke0pTT04uc3RyaW5naWZ5KG5vZGUuc2xhc2gpfWAgOiAnJ319YDtcblx0XHR9KTtcblxuXHRcdHJldHVybiB7XG5cdFx0XHRkYXRhOiBge1widHlwZVwiOlwiZGF0YVwiLFwibm9kZXNcIjpbJHtzdHJpbmdzLmpvaW4oJywnKX1dfVxcbmAsXG5cdFx0XHRjaHVua3M6IGNvdW50ID4gMCA/IGl0ZXJhdG9yIDogbnVsbFxuXHRcdH07XG5cdH0gY2F0Y2ggKGUpIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoY2xhcmlmeV9kZXZhbHVlX2Vycm9yKGV2ZW50LCAvKiogQHR5cGUge2FueX0gKi8gKGUpKSk7XG5cdH1cbn1cbiIsIi8qKlxuICogQHBhcmFtIHtpbXBvcnQoJ3R5cGVzJykuUGFnZU5vZGVJbmRleGVzfSBwYWdlXG4gKiBAcGFyYW0ge2ltcG9ydCgnQHN2ZWx0ZWpzL2tpdCcpLlNTUk1hbmlmZXN0fSBtYW5pZmVzdFxuICovXG5leHBvcnQgZnVuY3Rpb24gbG9hZF9wYWdlX25vZGVzKHBhZ2UsIG1hbmlmZXN0KSB7XG5cdHJldHVybiBQcm9taXNlLmFsbChbXG5cdFx0Ly8gd2UgdXNlID09IGhlcmUgcmF0aGVyIHRoYW4gPT09IGJlY2F1c2UgW3VuZGVmaW5lZF0gc2VyaWFsaXplcyBhcyBcIltudWxsXVwiXG5cdFx0Li4ucGFnZS5sYXlvdXRzLm1hcCgobikgPT4gKG4gPT0gdW5kZWZpbmVkID8gbiA6IG1hbmlmZXN0Ll8ubm9kZXNbbl0oKSkpLFxuXHRcdG1hbmlmZXN0Ll8ubm9kZXNbcGFnZS5sZWFmXSgpXG5cdF0pO1xufVxuIiwiaW1wb3J0IHsgdGV4dCB9IGZyb20gJy4uLy4uLy4uL2V4cG9ydHMvaW5kZXguanMnO1xuaW1wb3J0IHsgY29tcGFjdCB9IGZyb20gJy4uLy4uLy4uL3V0aWxzL2FycmF5LmpzJztcbmltcG9ydCB7IGdldF9zdGF0dXMsIG5vcm1hbGl6ZV9lcnJvciB9IGZyb20gJy4uLy4uLy4uL3V0aWxzL2Vycm9yLmpzJztcbmltcG9ydCB7IGFkZF9kYXRhX3N1ZmZpeCB9IGZyb20gJy4uLy4uLy4uL3V0aWxzL3VybC5qcyc7XG5pbXBvcnQgeyBSZWRpcmVjdCB9IGZyb20gJy4uLy4uL2NvbnRyb2wuanMnO1xuaW1wb3J0IHsgcmVkaXJlY3RfcmVzcG9uc2UsIHN0YXRpY19lcnJvcl9wYWdlLCBoYW5kbGVfZXJyb3JfYW5kX2pzb25pZnkgfSBmcm9tICcuLi91dGlscy5qcyc7XG5pbXBvcnQge1xuXHRoYW5kbGVfYWN0aW9uX2pzb25fcmVxdWVzdCxcblx0aGFuZGxlX2FjdGlvbl9yZXF1ZXN0LFxuXHRpc19hY3Rpb25fanNvbl9yZXF1ZXN0LFxuXHRpc19hY3Rpb25fcmVxdWVzdFxufSBmcm9tICcuL2FjdGlvbnMuanMnO1xuaW1wb3J0IHsgbG9hZF9kYXRhLCBsb2FkX3NlcnZlcl9kYXRhIH0gZnJvbSAnLi9sb2FkX2RhdGEuanMnO1xuaW1wb3J0IHsgcmVuZGVyX3Jlc3BvbnNlIH0gZnJvbSAnLi9yZW5kZXIuanMnO1xuaW1wb3J0IHsgcmVzcG9uZF93aXRoX2Vycm9yIH0gZnJvbSAnLi9yZXNwb25kX3dpdGhfZXJyb3IuanMnO1xuaW1wb3J0IHsgZ2V0X29wdGlvbiB9IGZyb20gJy4uLy4uLy4uL3V0aWxzL29wdGlvbnMuanMnO1xuaW1wb3J0IHsgZ2V0X2RhdGFfanNvbiB9IGZyb20gJy4uL2RhdGEvaW5kZXguanMnO1xuaW1wb3J0IHsgbG9hZF9wYWdlX25vZGVzIH0gZnJvbSAnLi9sb2FkX3BhZ2Vfbm9kZXMuanMnO1xuXG4vKipcbiAqIFRoZSBtYXhpbXVtIHJlcXVlc3QgZGVwdGggcGVybWl0dGVkIGJlZm9yZSBhc3N1bWluZyB3ZSdyZSBzdHVjayBpbiBhbiBpbmZpbml0ZSBsb29wXG4gKi9cbmNvbnN0IE1BWF9ERVBUSCA9IDEwO1xuXG4vKipcbiAqIEBwYXJhbSB7aW1wb3J0KCdAc3ZlbHRlanMva2l0JykuUmVxdWVzdEV2ZW50fSBldmVudFxuICogQHBhcmFtIHtpbXBvcnQoJ3R5cGVzJykuUGFnZU5vZGVJbmRleGVzfSBwYWdlXG4gKiBAcGFyYW0ge2ltcG9ydCgndHlwZXMnKS5TU1JPcHRpb25zfSBvcHRpb25zXG4gKiBAcGFyYW0ge2ltcG9ydCgnQHN2ZWx0ZWpzL2tpdCcpLlNTUk1hbmlmZXN0fSBtYW5pZmVzdFxuICogQHBhcmFtIHtpbXBvcnQoJ3R5cGVzJykuU1NSU3RhdGV9IHN0YXRlXG4gKiBAcGFyYW0ge2ltcG9ydCgndHlwZXMnKS5SZXF1aXJlZFJlc29sdmVPcHRpb25zfSByZXNvbHZlX29wdHNcbiAqIEByZXR1cm5zIHtQcm9taXNlPFJlc3BvbnNlPn1cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlbmRlcl9wYWdlKGV2ZW50LCBwYWdlLCBvcHRpb25zLCBtYW5pZmVzdCwgc3RhdGUsIHJlc29sdmVfb3B0cykge1xuXHRpZiAoc3RhdGUuZGVwdGggPiBNQVhfREVQVEgpIHtcblx0XHQvLyBpbmZpbml0ZSByZXF1ZXN0IGN5Y2xlIGRldGVjdGVkXG5cdFx0cmV0dXJuIHRleHQoYE5vdCBmb3VuZDogJHtldmVudC51cmwucGF0aG5hbWV9YCwge1xuXHRcdFx0c3RhdHVzOiA0MDQgLy8gVE9ETyBpbiBzb21lIGNhc2VzIHRoaXMgc2hvdWxkIGJlIDUwMC4gbm90IHN1cmUgaG93IHRvIGRpZmZlcmVudGlhdGVcblx0XHR9KTtcblx0fVxuXG5cdGlmIChpc19hY3Rpb25fanNvbl9yZXF1ZXN0KGV2ZW50KSkge1xuXHRcdGNvbnN0IG5vZGUgPSBhd2FpdCBtYW5pZmVzdC5fLm5vZGVzW3BhZ2UubGVhZl0oKTtcblx0XHRyZXR1cm4gaGFuZGxlX2FjdGlvbl9qc29uX3JlcXVlc3QoZXZlbnQsIG9wdGlvbnMsIG5vZGU/LnNlcnZlcik7XG5cdH1cblxuXHR0cnkge1xuXHRcdGNvbnN0IG5vZGVzID0gYXdhaXQgbG9hZF9wYWdlX25vZGVzKHBhZ2UsIG1hbmlmZXN0KTtcblxuXHRcdGNvbnN0IGxlYWZfbm9kZSA9IC8qKiBAdHlwZSB7aW1wb3J0KCd0eXBlcycpLlNTUk5vZGV9ICovIChub2Rlcy5hdCgtMSkpO1xuXG5cdFx0bGV0IHN0YXR1cyA9IDIwMDtcblxuXHRcdC8qKiBAdHlwZSB7aW1wb3J0KCdAc3ZlbHRlanMva2l0JykuQWN0aW9uUmVzdWx0IHwgdW5kZWZpbmVkfSAqL1xuXHRcdGxldCBhY3Rpb25fcmVzdWx0ID0gdW5kZWZpbmVkO1xuXG5cdFx0aWYgKGlzX2FjdGlvbl9yZXF1ZXN0KGV2ZW50KSkge1xuXHRcdFx0Ly8gZm9yIGFjdGlvbiByZXF1ZXN0cywgZmlyc3QgY2FsbCBoYW5kbGVyIGluICtwYWdlLnNlcnZlci5qc1xuXHRcdFx0Ly8gKHRoaXMgYWxzbyBkZXRlcm1pbmVzIHN0YXR1cyBjb2RlKVxuXHRcdFx0YWN0aW9uX3Jlc3VsdCA9IGF3YWl0IGhhbmRsZV9hY3Rpb25fcmVxdWVzdChldmVudCwgbGVhZl9ub2RlLnNlcnZlcik7XG5cdFx0XHRpZiAoYWN0aW9uX3Jlc3VsdD8udHlwZSA9PT0gJ3JlZGlyZWN0Jykge1xuXHRcdFx0XHRyZXR1cm4gcmVkaXJlY3RfcmVzcG9uc2UoYWN0aW9uX3Jlc3VsdC5zdGF0dXMsIGFjdGlvbl9yZXN1bHQubG9jYXRpb24pO1xuXHRcdFx0fVxuXHRcdFx0aWYgKGFjdGlvbl9yZXN1bHQ/LnR5cGUgPT09ICdlcnJvcicpIHtcblx0XHRcdFx0c3RhdHVzID0gZ2V0X3N0YXR1cyhhY3Rpb25fcmVzdWx0LmVycm9yKTtcblx0XHRcdH1cblx0XHRcdGlmIChhY3Rpb25fcmVzdWx0Py50eXBlID09PSAnZmFpbHVyZScpIHtcblx0XHRcdFx0c3RhdHVzID0gYWN0aW9uX3Jlc3VsdC5zdGF0dXM7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Y29uc3Qgc2hvdWxkX3ByZXJlbmRlcl9kYXRhID0gbm9kZXMuc29tZSgobm9kZSkgPT4gbm9kZT8uc2VydmVyPy5sb2FkKTtcblx0XHRjb25zdCBkYXRhX3BhdGhuYW1lID0gYWRkX2RhdGFfc3VmZml4KGV2ZW50LnVybC5wYXRobmFtZSk7XG5cblx0XHQvLyBpdCdzIGNydWNpYWwgdGhhdCB3ZSBkbyB0aGlzIGJlZm9yZSByZXR1cm5pbmcgdGhlIG5vbi1TU1IgcmVzcG9uc2UsIG90aGVyd2lzZVxuXHRcdC8vIFN2ZWx0ZUtpdCB3aWxsIGVycm9uZW91c2x5IGJlbGlldmUgdGhhdCB0aGUgcGF0aCBoYXMgYmVlbiBwcmVyZW5kZXJlZCxcblx0XHQvLyBjYXVzaW5nIGZ1bmN0aW9ucyB0byBiZSBvbWl0dGVkIGZyb20gdGhlIG1hbmlmZXN0IGdlbmVyYXRlZCBsYXRlclxuXHRcdGNvbnN0IHNob3VsZF9wcmVyZW5kZXIgPSBnZXRfb3B0aW9uKG5vZGVzLCAncHJlcmVuZGVyJykgPz8gZmFsc2U7XG5cdFx0aWYgKHNob3VsZF9wcmVyZW5kZXIpIHtcblx0XHRcdGNvbnN0IG1vZCA9IGxlYWZfbm9kZS5zZXJ2ZXI7XG5cdFx0XHRpZiAobW9kPy5hY3Rpb25zKSB7XG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcignQ2Fubm90IHByZXJlbmRlciBwYWdlcyB3aXRoIGFjdGlvbnMnKTtcblx0XHRcdH1cblx0XHR9IGVsc2UgaWYgKHN0YXRlLnByZXJlbmRlcmluZykge1xuXHRcdFx0Ly8gaWYgdGhlIHBhZ2UgaXNuJ3QgbWFya2VkIGFzIHByZXJlbmRlcmFibGUsIHRoZW4gYmFpbCBvdXQgYXQgdGhpcyBwb2ludFxuXHRcdFx0cmV0dXJuIG5ldyBSZXNwb25zZSh1bmRlZmluZWQsIHtcblx0XHRcdFx0c3RhdHVzOiAyMDRcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdC8vIGlmIHdlIGZldGNoIGFueSBlbmRwb2ludHMgd2hpbGUgbG9hZGluZyBkYXRhIGZvciB0aGlzIHBhZ2UsIHRoZXkgc2hvdWxkXG5cdFx0Ly8gaW5oZXJpdCB0aGUgcHJlcmVuZGVyIG9wdGlvbiBvZiB0aGUgcGFnZVxuXHRcdHN0YXRlLnByZXJlbmRlcl9kZWZhdWx0ID0gc2hvdWxkX3ByZXJlbmRlcjtcblxuXHRcdC8qKiBAdHlwZSB7aW1wb3J0KCcuL3R5cGVzLmpzJykuRmV0Y2hlZFtdfSAqL1xuXHRcdGNvbnN0IGZldGNoZWQgPSBbXTtcblxuXHRcdC8vIHJlbmRlcnMgYW4gZW1wdHkgJ3NoZWxsJyBwYWdlIGlmIFNTUiBpcyB0dXJuZWQgb2ZmIGFuZCBpZiB0aGVyZSBpc1xuXHRcdC8vIG5vIHNlcnZlciBkYXRhIHRvIHByZXJlbmRlci4gQXMgYSByZXN1bHQsIHRoZSBsb2FkIGZ1bmN0aW9ucyBhbmQgcmVuZGVyaW5nXG5cdFx0Ly8gb25seSBvY2N1ciBjbGllbnQtc2lkZS5cblx0XHRpZiAoZ2V0X29wdGlvbihub2RlcywgJ3NzcicpID09PSBmYWxzZSAmJiAhKHN0YXRlLnByZXJlbmRlcmluZyAmJiBzaG91bGRfcHJlcmVuZGVyX2RhdGEpKSB7XG5cdFx0XHRyZXR1cm4gYXdhaXQgcmVuZGVyX3Jlc3BvbnNlKHtcblx0XHRcdFx0YnJhbmNoOiBbXSxcblx0XHRcdFx0ZmV0Y2hlZCxcblx0XHRcdFx0cGFnZV9jb25maWc6IHtcblx0XHRcdFx0XHRzc3I6IGZhbHNlLFxuXHRcdFx0XHRcdGNzcjogZ2V0X29wdGlvbihub2RlcywgJ2NzcicpID8/IHRydWVcblx0XHRcdFx0fSxcblx0XHRcdFx0c3RhdHVzLFxuXHRcdFx0XHRlcnJvcjogbnVsbCxcblx0XHRcdFx0ZXZlbnQsXG5cdFx0XHRcdG9wdGlvbnMsXG5cdFx0XHRcdG1hbmlmZXN0LFxuXHRcdFx0XHRzdGF0ZSxcblx0XHRcdFx0cmVzb2x2ZV9vcHRzXG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHQvKiogQHR5cGUge0FycmF5PGltcG9ydCgnLi90eXBlcy5qcycpLkxvYWRlZCB8IG51bGw+fSAqL1xuXHRcdGNvbnN0IGJyYW5jaCA9IFtdO1xuXG5cdFx0LyoqIEB0eXBlIHtFcnJvciB8IG51bGx9ICovXG5cdFx0bGV0IGxvYWRfZXJyb3IgPSBudWxsO1xuXG5cdFx0LyoqIEB0eXBlIHtBcnJheTxQcm9taXNlPGltcG9ydCgndHlwZXMnKS5TZXJ2ZXJEYXRhTm9kZSB8IG51bGw+Pn0gKi9cblx0XHRjb25zdCBzZXJ2ZXJfcHJvbWlzZXMgPSBub2Rlcy5tYXAoKG5vZGUsIGkpID0+IHtcblx0XHRcdGlmIChsb2FkX2Vycm9yKSB7XG5cdFx0XHRcdC8vIGlmIGFuIGVycm9yIGhhcHBlbnMgaW1tZWRpYXRlbHksIGRvbid0IGJvdGhlciB3aXRoIHRoZSByZXN0IG9mIHRoZSBub2Rlc1xuXHRcdFx0XHR0aHJvdyBsb2FkX2Vycm9yO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCkudGhlbihhc3luYyAoKSA9PiB7XG5cdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0aWYgKG5vZGUgPT09IGxlYWZfbm9kZSAmJiBhY3Rpb25fcmVzdWx0Py50eXBlID09PSAnZXJyb3InKSB7XG5cdFx0XHRcdFx0XHQvLyB3ZSB3YWl0IHVudGlsIGhlcmUgdG8gdGhyb3cgdGhlIGVycm9yIHNvIHRoYXQgd2UgY2FuIHVzZVxuXHRcdFx0XHRcdFx0Ly8gYW55IG5lc3RlZCArZXJyb3Iuc3ZlbHRlIGNvbXBvbmVudHMgdGhhdCB3ZXJlIGRlZmluZWRcblx0XHRcdFx0XHRcdHRocm93IGFjdGlvbl9yZXN1bHQuZXJyb3I7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0cmV0dXJuIGF3YWl0IGxvYWRfc2VydmVyX2RhdGEoe1xuXHRcdFx0XHRcdFx0ZXZlbnQsXG5cdFx0XHRcdFx0XHRzdGF0ZSxcblx0XHRcdFx0XHRcdG5vZGUsXG5cdFx0XHRcdFx0XHRwYXJlbnQ6IGFzeW5jICgpID0+IHtcblx0XHRcdFx0XHRcdFx0LyoqIEB0eXBlIHtSZWNvcmQ8c3RyaW5nLCBhbnk+fSAqL1xuXHRcdFx0XHRcdFx0XHRjb25zdCBkYXRhID0ge307XG5cdFx0XHRcdFx0XHRcdGZvciAobGV0IGogPSAwOyBqIDwgaTsgaiArPSAxKSB7XG5cdFx0XHRcdFx0XHRcdFx0Y29uc3QgcGFyZW50ID0gYXdhaXQgc2VydmVyX3Byb21pc2VzW2pdO1xuXHRcdFx0XHRcdFx0XHRcdGlmIChwYXJlbnQpIE9iamVjdC5hc3NpZ24oZGF0YSwgYXdhaXQgcGFyZW50LmRhdGEpO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdHJldHVybiBkYXRhO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdFx0bG9hZF9lcnJvciA9IC8qKiBAdHlwZSB7RXJyb3J9ICovIChlKTtcblx0XHRcdFx0XHR0aHJvdyBsb2FkX2Vycm9yO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9KTtcblxuXHRcdGNvbnN0IGNzciA9IGdldF9vcHRpb24obm9kZXMsICdjc3InKSA/PyB0cnVlO1xuXG5cdFx0LyoqIEB0eXBlIHtBcnJheTxQcm9taXNlPFJlY29yZDxzdHJpbmcsIGFueT4gfCBudWxsPj59ICovXG5cdFx0Y29uc3QgbG9hZF9wcm9taXNlcyA9IG5vZGVzLm1hcCgobm9kZSwgaSkgPT4ge1xuXHRcdFx0aWYgKGxvYWRfZXJyb3IpIHRocm93IGxvYWRfZXJyb3I7XG5cdFx0XHRyZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCkudGhlbihhc3luYyAoKSA9PiB7XG5cdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0cmV0dXJuIGF3YWl0IGxvYWRfZGF0YSh7XG5cdFx0XHRcdFx0XHRldmVudCxcblx0XHRcdFx0XHRcdGZldGNoZWQsXG5cdFx0XHRcdFx0XHRub2RlLFxuXHRcdFx0XHRcdFx0cGFyZW50OiBhc3luYyAoKSA9PiB7XG5cdFx0XHRcdFx0XHRcdGNvbnN0IGRhdGEgPSB7fTtcblx0XHRcdFx0XHRcdFx0Zm9yIChsZXQgaiA9IDA7IGogPCBpOyBqICs9IDEpIHtcblx0XHRcdFx0XHRcdFx0XHRPYmplY3QuYXNzaWduKGRhdGEsIGF3YWl0IGxvYWRfcHJvbWlzZXNbal0pO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdHJldHVybiBkYXRhO1xuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdHJlc29sdmVfb3B0cyxcblx0XHRcdFx0XHRcdHNlcnZlcl9kYXRhX3Byb21pc2U6IHNlcnZlcl9wcm9taXNlc1tpXSxcblx0XHRcdFx0XHRcdHN0YXRlLFxuXHRcdFx0XHRcdFx0Y3NyXG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0XHRsb2FkX2Vycm9yID0gLyoqIEB0eXBlIHtFcnJvcn0gKi8gKGUpO1xuXHRcdFx0XHRcdHRocm93IGxvYWRfZXJyb3I7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH0pO1xuXG5cdFx0Ly8gaWYgd2UgZG9uJ3QgZG8gdGhpcywgcmVqZWN0aW9ucyB3aWxsIGJlIHVuaGFuZGxlZFxuXHRcdGZvciAoY29uc3QgcCBvZiBzZXJ2ZXJfcHJvbWlzZXMpIHAuY2F0Y2goKCkgPT4ge30pO1xuXHRcdGZvciAoY29uc3QgcCBvZiBsb2FkX3Byb21pc2VzKSBwLmNhdGNoKCgpID0+IHt9KTtcblxuXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgbm9kZXMubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRcdGNvbnN0IG5vZGUgPSBub2Rlc1tpXTtcblxuXHRcdFx0aWYgKG5vZGUpIHtcblx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRjb25zdCBzZXJ2ZXJfZGF0YSA9IGF3YWl0IHNlcnZlcl9wcm9taXNlc1tpXTtcblx0XHRcdFx0XHRjb25zdCBkYXRhID0gYXdhaXQgbG9hZF9wcm9taXNlc1tpXTtcblxuXHRcdFx0XHRcdGJyYW5jaC5wdXNoKHsgbm9kZSwgc2VydmVyX2RhdGEsIGRhdGEgfSk7XG5cdFx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0XHRjb25zdCBlcnIgPSBub3JtYWxpemVfZXJyb3IoZSk7XG5cblx0XHRcdFx0XHRpZiAoZXJyIGluc3RhbmNlb2YgUmVkaXJlY3QpIHtcblx0XHRcdFx0XHRcdGlmIChzdGF0ZS5wcmVyZW5kZXJpbmcgJiYgc2hvdWxkX3ByZXJlbmRlcl9kYXRhKSB7XG5cdFx0XHRcdFx0XHRcdGNvbnN0IGJvZHkgPSBKU09OLnN0cmluZ2lmeSh7XG5cdFx0XHRcdFx0XHRcdFx0dHlwZTogJ3JlZGlyZWN0Jyxcblx0XHRcdFx0XHRcdFx0XHRsb2NhdGlvbjogZXJyLmxvY2F0aW9uXG5cdFx0XHRcdFx0XHRcdH0pO1xuXG5cdFx0XHRcdFx0XHRcdHN0YXRlLnByZXJlbmRlcmluZy5kZXBlbmRlbmNpZXMuc2V0KGRhdGFfcGF0aG5hbWUsIHtcblx0XHRcdFx0XHRcdFx0XHRyZXNwb25zZTogdGV4dChib2R5KSxcblx0XHRcdFx0XHRcdFx0XHRib2R5XG5cdFx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRyZXR1cm4gcmVkaXJlY3RfcmVzcG9uc2UoZXJyLnN0YXR1cywgZXJyLmxvY2F0aW9uKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRjb25zdCBzdGF0dXMgPSBnZXRfc3RhdHVzKGVycik7XG5cdFx0XHRcdFx0Y29uc3QgZXJyb3IgPSBhd2FpdCBoYW5kbGVfZXJyb3JfYW5kX2pzb25pZnkoZXZlbnQsIG9wdGlvbnMsIGVycik7XG5cblx0XHRcdFx0XHR3aGlsZSAoaS0tKSB7XG5cdFx0XHRcdFx0XHRpZiAocGFnZS5lcnJvcnNbaV0pIHtcblx0XHRcdFx0XHRcdFx0Y29uc3QgaW5kZXggPSAvKiogQHR5cGUge251bWJlcn0gKi8gKHBhZ2UuZXJyb3JzW2ldKTtcblx0XHRcdFx0XHRcdFx0Y29uc3Qgbm9kZSA9IGF3YWl0IG1hbmlmZXN0Ll8ubm9kZXNbaW5kZXhdKCk7XG5cblx0XHRcdFx0XHRcdFx0bGV0IGogPSBpO1xuXHRcdFx0XHRcdFx0XHR3aGlsZSAoIWJyYW5jaFtqXSkgaiAtPSAxO1xuXG5cdFx0XHRcdFx0XHRcdHJldHVybiBhd2FpdCByZW5kZXJfcmVzcG9uc2Uoe1xuXHRcdFx0XHRcdFx0XHRcdGV2ZW50LFxuXHRcdFx0XHRcdFx0XHRcdG9wdGlvbnMsXG5cdFx0XHRcdFx0XHRcdFx0bWFuaWZlc3QsXG5cdFx0XHRcdFx0XHRcdFx0c3RhdGUsXG5cdFx0XHRcdFx0XHRcdFx0cmVzb2x2ZV9vcHRzLFxuXHRcdFx0XHRcdFx0XHRcdHBhZ2VfY29uZmlnOiB7IHNzcjogdHJ1ZSwgY3NyOiB0cnVlIH0sXG5cdFx0XHRcdFx0XHRcdFx0c3RhdHVzLFxuXHRcdFx0XHRcdFx0XHRcdGVycm9yLFxuXHRcdFx0XHRcdFx0XHRcdGJyYW5jaDogY29tcGFjdChicmFuY2guc2xpY2UoMCwgaiArIDEpKS5jb25jYXQoe1xuXHRcdFx0XHRcdFx0XHRcdFx0bm9kZSxcblx0XHRcdFx0XHRcdFx0XHRcdGRhdGE6IG51bGwsXG5cdFx0XHRcdFx0XHRcdFx0XHRzZXJ2ZXJfZGF0YTogbnVsbFxuXHRcdFx0XHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRcdFx0XHRcdGZldGNoZWRcblx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0Ly8gaWYgd2UncmUgc3RpbGwgaGVyZSwgaXQgbWVhbnMgdGhlIGVycm9yIGhhcHBlbmVkIGluIHRoZSByb290IGxheW91dCxcblx0XHRcdFx0XHQvLyB3aGljaCBtZWFucyB3ZSBoYXZlIHRvIGZhbGwgYmFjayB0byBlcnJvci5odG1sXG5cdFx0XHRcdFx0cmV0dXJuIHN0YXRpY19lcnJvcl9wYWdlKG9wdGlvbnMsIHN0YXR1cywgZXJyb3IubWVzc2FnZSk7XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdC8vIHB1c2ggYW4gZW1wdHkgc2xvdCBzbyB3ZSBjYW4gcmV3aW5kIHBhc3QgZ2FwcyB0byB0aGVcblx0XHRcdFx0Ly8gbGF5b3V0IHRoYXQgY29ycmVzcG9uZHMgd2l0aCBhbiArZXJyb3Iuc3ZlbHRlIHBhZ2Vcblx0XHRcdFx0YnJhbmNoLnB1c2gobnVsbCk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aWYgKHN0YXRlLnByZXJlbmRlcmluZyAmJiBzaG91bGRfcHJlcmVuZGVyX2RhdGEpIHtcblx0XHRcdC8vIG5kanNvbiBmb3JtYXRcblx0XHRcdGxldCB7IGRhdGEsIGNodW5rcyB9ID0gZ2V0X2RhdGFfanNvbihcblx0XHRcdFx0ZXZlbnQsXG5cdFx0XHRcdG9wdGlvbnMsXG5cdFx0XHRcdGJyYW5jaC5tYXAoKG5vZGUpID0+IG5vZGU/LnNlcnZlcl9kYXRhKVxuXHRcdFx0KTtcblxuXHRcdFx0aWYgKGNodW5rcykge1xuXHRcdFx0XHRmb3IgYXdhaXQgKGNvbnN0IGNodW5rIG9mIGNodW5rcykge1xuXHRcdFx0XHRcdGRhdGEgKz0gY2h1bms7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0c3RhdGUucHJlcmVuZGVyaW5nLmRlcGVuZGVuY2llcy5zZXQoZGF0YV9wYXRobmFtZSwge1xuXHRcdFx0XHRyZXNwb25zZTogdGV4dChkYXRhKSxcblx0XHRcdFx0Ym9keTogZGF0YVxuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0Y29uc3Qgc3NyID0gZ2V0X29wdGlvbihub2RlcywgJ3NzcicpID8/IHRydWU7XG5cblx0XHRyZXR1cm4gYXdhaXQgcmVuZGVyX3Jlc3BvbnNlKHtcblx0XHRcdGV2ZW50LFxuXHRcdFx0b3B0aW9ucyxcblx0XHRcdG1hbmlmZXN0LFxuXHRcdFx0c3RhdGUsXG5cdFx0XHRyZXNvbHZlX29wdHMsXG5cdFx0XHRwYWdlX2NvbmZpZzoge1xuXHRcdFx0XHRjc3I6IGdldF9vcHRpb24obm9kZXMsICdjc3InKSA/PyB0cnVlLFxuXHRcdFx0XHRzc3Jcblx0XHRcdH0sXG5cdFx0XHRzdGF0dXMsXG5cdFx0XHRlcnJvcjogbnVsbCxcblx0XHRcdGJyYW5jaDogc3NyID09PSBmYWxzZSA/IFtdIDogY29tcGFjdChicmFuY2gpLFxuXHRcdFx0YWN0aW9uX3Jlc3VsdCxcblx0XHRcdGZldGNoZWRcblx0XHR9KTtcblx0fSBjYXRjaCAoZSkge1xuXHRcdC8vIGlmIHdlIGVuZCB1cCBoZXJlLCBpdCBtZWFucyB0aGUgZGF0YSBsb2FkZWQgc3VjY2Vzc2Z1bGx5XG5cdFx0Ly8gYnV0IHRoZSBwYWdlIGZhaWxlZCB0byByZW5kZXIsIG9yIHRoYXQgYSBwcmVyZW5kZXJpbmcgZXJyb3Igb2NjdXJyZWRcblx0XHRyZXR1cm4gYXdhaXQgcmVzcG9uZF93aXRoX2Vycm9yKHtcblx0XHRcdGV2ZW50LFxuXHRcdFx0b3B0aW9ucyxcblx0XHRcdG1hbmlmZXN0LFxuXHRcdFx0c3RhdGUsXG5cdFx0XHRzdGF0dXM6IDUwMCxcblx0XHRcdGVycm9yOiBlLFxuXHRcdFx0cmVzb2x2ZV9vcHRzXG5cdFx0fSk7XG5cdH1cbn1cbiIsImltcG9ydCB7IEJST1dTRVIgfSBmcm9tICdlc20tZW52JztcblxuY29uc3QgcGFyYW1fcGF0dGVybiA9IC9eKFxcWyk/KFxcLlxcLlxcLik/KFxcdyspKD86PShcXHcrKSk/KFxcXSk/JC87XG5cbi8qKlxuICogQ3JlYXRlcyB0aGUgcmVnZXggcGF0dGVybiwgZXh0cmFjdHMgcGFyYW1ldGVyIG5hbWVzLCBhbmQgZ2VuZXJhdGVzIHR5cGVzIGZvciBhIHJvdXRlXG4gKiBAcGFyYW0ge3N0cmluZ30gaWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlX3JvdXRlX2lkKGlkKSB7XG5cdC8qKiBAdHlwZSB7aW1wb3J0KCd0eXBlcycpLlJvdXRlUGFyYW1bXX0gKi9cblx0Y29uc3QgcGFyYW1zID0gW107XG5cblx0Y29uc3QgcGF0dGVybiA9XG5cdFx0aWQgPT09ICcvJ1xuXHRcdFx0PyAvXlxcLyQvXG5cdFx0XHQ6IG5ldyBSZWdFeHAoXG5cdFx0XHRcdFx0YF4ke2dldF9yb3V0ZV9zZWdtZW50cyhpZClcblx0XHRcdFx0XHRcdC5tYXAoKHNlZ21lbnQpID0+IHtcblx0XHRcdFx0XHRcdFx0Ly8gc3BlY2lhbCBjYXNlIOKAlCAvWy4uLnJlc3RdLyBjb3VsZCBjb250YWluIHplcm8gc2VnbWVudHNcblx0XHRcdFx0XHRcdFx0Y29uc3QgcmVzdF9tYXRjaCA9IC9eXFxbXFwuXFwuXFwuKFxcdyspKD86PShcXHcrKSk/XFxdJC8uZXhlYyhzZWdtZW50KTtcblx0XHRcdFx0XHRcdFx0aWYgKHJlc3RfbWF0Y2gpIHtcblx0XHRcdFx0XHRcdFx0XHRwYXJhbXMucHVzaCh7XG5cdFx0XHRcdFx0XHRcdFx0XHRuYW1lOiByZXN0X21hdGNoWzFdLFxuXHRcdFx0XHRcdFx0XHRcdFx0bWF0Y2hlcjogcmVzdF9tYXRjaFsyXSxcblx0XHRcdFx0XHRcdFx0XHRcdG9wdGlvbmFsOiBmYWxzZSxcblx0XHRcdFx0XHRcdFx0XHRcdHJlc3Q6IHRydWUsXG5cdFx0XHRcdFx0XHRcdFx0XHRjaGFpbmVkOiB0cnVlXG5cdFx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHRcdFx0cmV0dXJuICcoPzovKC4qKSk/Jztcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHQvLyBzcGVjaWFsIGNhc2Ug4oCUIC9bW29wdGlvbmFsXV0vIGNvdWxkIGNvbnRhaW4gemVybyBzZWdtZW50c1xuXHRcdFx0XHRcdFx0XHRjb25zdCBvcHRpb25hbF9tYXRjaCA9IC9eXFxbXFxbKFxcdyspKD86PShcXHcrKSk/XFxdXFxdJC8uZXhlYyhzZWdtZW50KTtcblx0XHRcdFx0XHRcdFx0aWYgKG9wdGlvbmFsX21hdGNoKSB7XG5cdFx0XHRcdFx0XHRcdFx0cGFyYW1zLnB1c2goe1xuXHRcdFx0XHRcdFx0XHRcdFx0bmFtZTogb3B0aW9uYWxfbWF0Y2hbMV0sXG5cdFx0XHRcdFx0XHRcdFx0XHRtYXRjaGVyOiBvcHRpb25hbF9tYXRjaFsyXSxcblx0XHRcdFx0XHRcdFx0XHRcdG9wdGlvbmFsOiB0cnVlLFxuXHRcdFx0XHRcdFx0XHRcdFx0cmVzdDogZmFsc2UsXG5cdFx0XHRcdFx0XHRcdFx0XHRjaGFpbmVkOiB0cnVlXG5cdFx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHRcdFx0cmV0dXJuICcoPzovKFteL10rKSk/Jztcblx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdGlmICghc2VnbWVudCkge1xuXHRcdFx0XHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdGNvbnN0IHBhcnRzID0gc2VnbWVudC5zcGxpdCgvXFxbKC4rPylcXF0oPyFcXF0pLyk7XG5cdFx0XHRcdFx0XHRcdGNvbnN0IHJlc3VsdCA9IHBhcnRzXG5cdFx0XHRcdFx0XHRcdFx0Lm1hcCgoY29udGVudCwgaSkgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdFx0aWYgKGkgJSAyKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdGlmIChjb250ZW50LnN0YXJ0c1dpdGgoJ3grJykpIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gZXNjYXBlKFN0cmluZy5mcm9tQ2hhckNvZGUocGFyc2VJbnQoY29udGVudC5zbGljZSgyKSwgMTYpKSk7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRcdFx0XHRpZiAoY29udGVudC5zdGFydHNXaXRoKCd1KycpKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0cmV0dXJuIGVzY2FwZShcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFN0cmluZy5mcm9tQ2hhckNvZGUoXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdC4uLmNvbnRlbnRcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHQuc2xpY2UoMilcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHQuc3BsaXQoJy0nKVxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdC5tYXAoKGNvZGUpID0+IHBhcnNlSW50KGNvZGUsIDE2KSlcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdClcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0XHRcdFx0Ly8gV2Uga25vdyB0aGUgbWF0Y2ggY2Fubm90IGJlIG51bGwgaW4gdGhlIGJyb3dzZXIgYmVjYXVzZSBtYW5pZmVzdCBnZW5lcmF0aW9uXG5cdFx0XHRcdFx0XHRcdFx0XHRcdC8vIHdvdWxkIGhhdmUgaW52b2tlZCB0aGlzIGR1cmluZyBidWlsZCBhbmQgZmFpbGVkIGlmIHdlIGhpdCBhbiBpbnZhbGlkXG5cdFx0XHRcdFx0XHRcdFx0XHRcdC8vIHBhcmFtL21hdGNoZXIgbmFtZSB3aXRoIG5vbi1hbHBoYW51bWVyaWMgY2hhcmFjdGVyLlxuXHRcdFx0XHRcdFx0XHRcdFx0XHRjb25zdCBtYXRjaCA9IC8qKiBAdHlwZSB7UmVnRXhwRXhlY0FycmF5fSAqLyAocGFyYW1fcGF0dGVybi5leGVjKGNvbnRlbnQpKTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0aWYgKCFCUk9XU0VSICYmICFtYXRjaCkge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdHRocm93IG5ldyBFcnJvcihcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGBJbnZhbGlkIHBhcmFtOiAke2NvbnRlbnR9LiBQYXJhbXMgYW5kIG1hdGNoZXIgbmFtZXMgY2FuIG9ubHkgaGF2ZSB1bmRlcnNjb3JlcyBhbmQgYWxwaGFudW1lcmljIGNoYXJhY3RlcnMuYFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdCk7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRcdFx0XHRjb25zdCBbLCBpc19vcHRpb25hbCwgaXNfcmVzdCwgbmFtZSwgbWF0Y2hlcl0gPSBtYXRjaDtcblx0XHRcdFx0XHRcdFx0XHRcdFx0Ly8gSXQncyBhc3N1bWVkIHRoYXQgdGhlIGZvbGxvd2luZyBpbnZhbGlkIHJvdXRlIGlkIGNhc2VzIGFyZSBhbHJlYWR5IGNoZWNrZWRcblx0XHRcdFx0XHRcdFx0XHRcdFx0Ly8gLSB1bmJhbGFuY2VkIGJyYWNrZXRzXG5cdFx0XHRcdFx0XHRcdFx0XHRcdC8vIC0gb3B0aW9uYWwgcGFyYW0gZm9sbG93aW5nIHJlc3QgcGFyYW1cblxuXHRcdFx0XHRcdFx0XHRcdFx0XHRwYXJhbXMucHVzaCh7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0bmFtZSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRtYXRjaGVyLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdG9wdGlvbmFsOiAhIWlzX29wdGlvbmFsLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdHJlc3Q6ICEhaXNfcmVzdCxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRjaGFpbmVkOiBpc19yZXN0ID8gaSA9PT0gMSAmJiBwYXJ0c1swXSA9PT0gJycgOiBmYWxzZVxuXHRcdFx0XHRcdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0cmV0dXJuIGlzX3Jlc3QgPyAnKC4qPyknIDogaXNfb3B0aW9uYWwgPyAnKFteL10qKT8nIDogJyhbXi9dKz8pJztcblx0XHRcdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRcdFx0cmV0dXJuIGVzY2FwZShjb250ZW50KTtcblx0XHRcdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0XHRcdC5qb2luKCcnKTtcblxuXHRcdFx0XHRcdFx0XHRyZXR1cm4gJy8nICsgcmVzdWx0O1xuXHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdC5qb2luKCcnKX0vPyRgXG5cdFx0XHRcdCk7XG5cblx0cmV0dXJuIHsgcGF0dGVybiwgcGFyYW1zIH07XG59XG5cbmNvbnN0IG9wdGlvbmFsX3BhcmFtX3JlZ2V4ID0gL1xcL1xcW1xcW1xcdys/KD86PVxcdyspP1xcXVxcXS87XG5cbi8qKlxuICogUmVtb3ZlcyBvcHRpb25hbCBwYXJhbXMgZnJvbSBhIHJvdXRlIElELlxuICogQHBhcmFtIHtzdHJpbmd9IGlkXG4gKiBAcmV0dXJucyBUaGUgcm91dGUgaWQgd2l0aCBvcHRpb25hbCBwYXJhbXMgcmVtb3ZlZFxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVtb3ZlX29wdGlvbmFsX3BhcmFtcyhpZCkge1xuXHRyZXR1cm4gaWQucmVwbGFjZShvcHRpb25hbF9wYXJhbV9yZWdleCwgJycpO1xufVxuXG4vKipcbiAqIFJldHVybnMgYGZhbHNlYCBmb3IgYChncm91cClgIHNlZ21lbnRzXG4gKiBAcGFyYW0ge3N0cmluZ30gc2VnbWVudFxuICovXG5mdW5jdGlvbiBhZmZlY3RzX3BhdGgoc2VnbWVudCkge1xuXHRyZXR1cm4gIS9eXFwoW14pXStcXCkkLy50ZXN0KHNlZ21lbnQpO1xufVxuXG4vKipcbiAqIFNwbGl0cyBhIHJvdXRlIGlkIGludG8gaXRzIHNlZ21lbnRzLCByZW1vdmluZyBzZWdtZW50cyB0aGF0XG4gKiBkb24ndCBhZmZlY3QgdGhlIHBhdGggKGkuZS4gZ3JvdXBzKS4gVGhlIHJvb3Qgcm91dGUgaXMgcmVwcmVzZW50ZWQgYnkgYC9gXG4gKiBhbmQgd2lsbCBiZSByZXR1cm5lZCBhcyBgWycnXWAuXG4gKiBAcGFyYW0ge3N0cmluZ30gcm91dGVcbiAqIEByZXR1cm5zIHN0cmluZ1tdXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRfcm91dGVfc2VnbWVudHMocm91dGUpIHtcblx0cmV0dXJuIHJvdXRlLnNsaWNlKDEpLnNwbGl0KCcvJykuZmlsdGVyKGFmZmVjdHNfcGF0aCk7XG59XG5cbi8qKlxuICogQHBhcmFtIHtSZWdFeHBNYXRjaEFycmF5fSBtYXRjaFxuICogQHBhcmFtIHtpbXBvcnQoJ3R5cGVzJykuUm91dGVQYXJhbVtdfSBwYXJhbXNcbiAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgaW1wb3J0KCdAc3ZlbHRlanMva2l0JykuUGFyYW1NYXRjaGVyPn0gbWF0Y2hlcnNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4ZWMobWF0Y2gsIHBhcmFtcywgbWF0Y2hlcnMpIHtcblx0LyoqIEB0eXBlIHtSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+fSAqL1xuXHRjb25zdCByZXN1bHQgPSB7fTtcblxuXHRjb25zdCB2YWx1ZXMgPSBtYXRjaC5zbGljZSgxKTtcblx0Y29uc3QgdmFsdWVzX25lZWRpbmdfbWF0Y2ggPSB2YWx1ZXMuZmlsdGVyKCh2YWx1ZSkgPT4gdmFsdWUgIT09IHVuZGVmaW5lZCk7XG5cblx0bGV0IGJ1ZmZlcmVkID0gMDtcblxuXHRmb3IgKGxldCBpID0gMDsgaSA8IHBhcmFtcy5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdGNvbnN0IHBhcmFtID0gcGFyYW1zW2ldO1xuXHRcdGxldCB2YWx1ZSA9IHZhbHVlc1tpIC0gYnVmZmVyZWRdO1xuXG5cdFx0Ly8gaW4gdGhlIGBbW2E9Yl1dLy4uLi9bLi4ucmVzdF1gIGNhc2UsIGlmIG9uZSBvciBtb3JlIG9wdGlvbmFsIHBhcmFtZXRlcnNcblx0XHQvLyB3ZXJlbid0IG1hdGNoZWQsIHJvbGwgdGhlIHNraXBwZWQgdmFsdWVzIGludG8gdGhlIHJlc3Rcblx0XHRpZiAocGFyYW0uY2hhaW5lZCAmJiBwYXJhbS5yZXN0ICYmIGJ1ZmZlcmVkKSB7XG5cdFx0XHR2YWx1ZSA9IHZhbHVlc1xuXHRcdFx0XHQuc2xpY2UoaSAtIGJ1ZmZlcmVkLCBpICsgMSlcblx0XHRcdFx0LmZpbHRlcigocykgPT4gcylcblx0XHRcdFx0LmpvaW4oJy8nKTtcblxuXHRcdFx0YnVmZmVyZWQgPSAwO1xuXHRcdH1cblxuXHRcdC8vIGlmIGB2YWx1ZWAgaXMgdW5kZWZpbmVkLCBpdCBtZWFucyB0aGlzIGlzIGFuIG9wdGlvbmFsIG9yIHJlc3QgcGFyYW1ldGVyXG5cdFx0aWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcblx0XHRcdGlmIChwYXJhbS5yZXN0KSByZXN1bHRbcGFyYW0ubmFtZV0gPSAnJztcblx0XHRcdGNvbnRpbnVlO1xuXHRcdH1cblxuXHRcdGlmICghcGFyYW0ubWF0Y2hlciB8fCBtYXRjaGVyc1twYXJhbS5tYXRjaGVyXSh2YWx1ZSkpIHtcblx0XHRcdHJlc3VsdFtwYXJhbS5uYW1lXSA9IHZhbHVlO1xuXG5cdFx0XHQvLyBOb3cgdGhhdCB0aGUgcGFyYW1zIG1hdGNoLCByZXNldCB0aGUgYnVmZmVyIGlmIHRoZSBuZXh0IHBhcmFtIGlzbid0IHRoZSBbLi4ucmVzdF1cblx0XHRcdC8vIGFuZCB0aGUgbmV4dCB2YWx1ZSBpcyBkZWZpbmVkLCBvdGhlcndpc2UgdGhlIGJ1ZmZlciB3aWxsIGNhdXNlIHVzIHRvIHNraXAgdmFsdWVzXG5cdFx0XHRjb25zdCBuZXh0X3BhcmFtID0gcGFyYW1zW2kgKyAxXTtcblx0XHRcdGNvbnN0IG5leHRfdmFsdWUgPSB2YWx1ZXNbaSArIDFdO1xuXHRcdFx0aWYgKG5leHRfcGFyYW0gJiYgIW5leHRfcGFyYW0ucmVzdCAmJiBuZXh0X3BhcmFtLm9wdGlvbmFsICYmIG5leHRfdmFsdWUgJiYgcGFyYW0uY2hhaW5lZCkge1xuXHRcdFx0XHRidWZmZXJlZCA9IDA7XG5cdFx0XHR9XG5cblx0XHRcdC8vIFRoZXJlIGFyZSBubyBtb3JlIHBhcmFtcyBhbmQgbm8gbW9yZSB2YWx1ZXMsIGJ1dCBhbGwgbm9uLWVtcHR5IHZhbHVlcyBoYXZlIGJlZW4gbWF0Y2hlZFxuXHRcdFx0aWYgKFxuXHRcdFx0XHQhbmV4dF9wYXJhbSAmJlxuXHRcdFx0XHQhbmV4dF92YWx1ZSAmJlxuXHRcdFx0XHRPYmplY3Qua2V5cyhyZXN1bHQpLmxlbmd0aCA9PT0gdmFsdWVzX25lZWRpbmdfbWF0Y2gubGVuZ3RoXG5cdFx0XHQpIHtcblx0XHRcdFx0YnVmZmVyZWQgPSAwO1xuXHRcdFx0fVxuXHRcdFx0Y29udGludWU7XG5cdFx0fVxuXG5cdFx0Ly8gaW4gdGhlIGAvW1thPWJdXS8uLi5gIGNhc2UsIGlmIHRoZSB2YWx1ZSBkaWRuJ3Qgc2F0aXNmeSB0aGUgbWF0Y2hlcixcblx0XHQvLyBrZWVwIHRyYWNrIG9mIHRoZSBudW1iZXIgb2Ygc2tpcHBlZCBvcHRpb25hbCBwYXJhbWV0ZXJzIGFuZCBjb250aW51ZVxuXHRcdGlmIChwYXJhbS5vcHRpb25hbCAmJiBwYXJhbS5jaGFpbmVkKSB7XG5cdFx0XHRidWZmZXJlZCsrO1xuXHRcdFx0Y29udGludWU7XG5cdFx0fVxuXG5cdFx0Ly8gb3RoZXJ3aXNlLCBpZiB0aGUgbWF0Y2hlciByZXR1cm5zIGBmYWxzZWAsIHRoZSByb3V0ZSBkaWQgbm90IG1hdGNoXG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0aWYgKGJ1ZmZlcmVkKSByZXR1cm47XG5cdHJldHVybiByZXN1bHQ7XG59XG5cbi8qKiBAcGFyYW0ge3N0cmluZ30gc3RyICovXG5mdW5jdGlvbiBlc2NhcGUoc3RyKSB7XG5cdHJldHVybiAoXG5cdFx0c3RyXG5cdFx0XHQubm9ybWFsaXplKClcblx0XHRcdC8vIGVzY2FwZSBbIGFuZCBdIGJlZm9yZSBlc2NhcGluZyBvdGhlciBjaGFyYWN0ZXJzLCBzaW5jZSB0aGV5IGFyZSB1c2VkIGluIHRoZSByZXBsYWNlbWVudHNcblx0XHRcdC5yZXBsYWNlKC9bW1xcXV0vZywgJ1xcXFwkJicpXG5cdFx0XHQvLyByZXBsYWNlICUsIC8sID8gYW5kICMgd2l0aCB0aGVpciBlbmNvZGVkIHZlcnNpb25zIGJlY2F1c2UgZGVjb2RlX3BhdGhuYW1lIGxlYXZlcyB0aGVtIHVudG91Y2hlZFxuXHRcdFx0LnJlcGxhY2UoLyUvZywgJyUyNScpXG5cdFx0XHQucmVwbGFjZSgvXFwvL2csICclMltGZl0nKVxuXHRcdFx0LnJlcGxhY2UoL1xcPy9nLCAnJTNbRmZdJylcblx0XHRcdC5yZXBsYWNlKC8jL2csICclMjMnKVxuXHRcdFx0Ly8gZXNjYXBlIGNoYXJhY3RlcnMgdGhhdCBoYXZlIHNwZWNpYWwgbWVhbmluZyBpbiByZWdleFxuXHRcdFx0LnJlcGxhY2UoL1suKis/XiR7fSgpfFxcXFxdL2csICdcXFxcJCYnKVxuXHQpO1xufVxuXG5jb25zdCBiYXNpY19wYXJhbV9wYXR0ZXJuID0gL1xcWyhcXFspPyhcXC5cXC5cXC4pPyhcXHcrPykoPzo9KFxcdyspKT9cXF1cXF0/L2c7XG5cbi8qKlxuICogUG9wdWxhdGUgYSByb3V0ZSBJRCB3aXRoIHBhcmFtcyB0byByZXNvbHZlIGEgcGF0aG5hbWUuXG4gKiBAZXhhbXBsZVxuICogYGBganNcbiAqIHJlc29sdmVSb3V0ZShcbiAqICAgYC9ibG9nL1tzbHVnXS9bLi4uc29tZXRoaW5nRWxzZV1gLFxuICogICB7XG4gKiAgICAgc2x1ZzogJ2hlbGxvLXdvcmxkJyxcbiAqICAgICBzb21ldGhpbmdFbHNlOiAnc29tZXRoaW5nL2Vsc2UnXG4gKiAgIH1cbiAqICk7IC8vIGAvYmxvZy9oZWxsby13b3JsZC9zb21ldGhpbmcvZWxzZWBcbiAqIGBgYFxuICogQHBhcmFtIHtzdHJpbmd9IGlkXG4gKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIHN0cmluZyB8IHVuZGVmaW5lZD59IHBhcmFtc1xuICogQHJldHVybnMge3N0cmluZ31cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlc29sdmVfcm91dGUoaWQsIHBhcmFtcykge1xuXHRjb25zdCBzZWdtZW50cyA9IGdldF9yb3V0ZV9zZWdtZW50cyhpZCk7XG5cdHJldHVybiAoXG5cdFx0Jy8nICtcblx0XHRzZWdtZW50c1xuXHRcdFx0Lm1hcCgoc2VnbWVudCkgPT5cblx0XHRcdFx0c2VnbWVudC5yZXBsYWNlKGJhc2ljX3BhcmFtX3BhdHRlcm4sIChfLCBvcHRpb25hbCwgcmVzdCwgbmFtZSkgPT4ge1xuXHRcdFx0XHRcdGNvbnN0IHBhcmFtX3ZhbHVlID0gcGFyYW1zW25hbWVdO1xuXG5cdFx0XHRcdFx0Ly8gVGhpcyBpcyBuZXN0ZWQgc28gVFMgY29ycmVjdGx5IG5hcnJvd3MgdGhlIHR5cGVcblx0XHRcdFx0XHRpZiAoIXBhcmFtX3ZhbHVlKSB7XG5cdFx0XHRcdFx0XHRpZiAob3B0aW9uYWwpIHJldHVybiAnJztcblx0XHRcdFx0XHRcdGlmIChyZXN0ICYmIHBhcmFtX3ZhbHVlICE9PSB1bmRlZmluZWQpIHJldHVybiAnJztcblx0XHRcdFx0XHRcdHRocm93IG5ldyBFcnJvcihgTWlzc2luZyBwYXJhbWV0ZXIgJyR7bmFtZX0nIGluIHJvdXRlICR7aWR9YCk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0aWYgKHBhcmFtX3ZhbHVlLnN0YXJ0c1dpdGgoJy8nKSB8fCBwYXJhbV92YWx1ZS5lbmRzV2l0aCgnLycpKVxuXHRcdFx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKFxuXHRcdFx0XHRcdFx0XHRgUGFyYW1ldGVyICcke25hbWV9JyBpbiByb3V0ZSAke2lkfSBjYW5ub3Qgc3RhcnQgb3IgZW5kIHdpdGggYSBzbGFzaCAtLSB0aGlzIHdvdWxkIGNhdXNlIGFuIGludmFsaWQgcm91dGUgbGlrZSBmb28vL2JhcmBcblx0XHRcdFx0XHRcdCk7XG5cdFx0XHRcdFx0cmV0dXJuIHBhcmFtX3ZhbHVlO1xuXHRcdFx0XHR9KVxuXHRcdFx0KVxuXHRcdFx0LmZpbHRlcihCb29sZWFuKVxuXHRcdFx0LmpvaW4oJy8nKVxuXHQpO1xufVxuIiwiaW1wb3J0IHsgcGFyc2UsIHNlcmlhbGl6ZSB9IGZyb20gJ2Nvb2tpZSc7XG5pbXBvcnQgeyBhZGRfZGF0YV9zdWZmaXgsIG5vcm1hbGl6ZV9wYXRoLCByZXNvbHZlIH0gZnJvbSAnLi4vLi4vdXRpbHMvdXJsLmpzJztcblxuLyoqXG4gKiBUcmFja3MgYWxsIGNvb2tpZXMgc2V0IGR1cmluZyBkZXYgbW9kZSBzbyB3ZSBjYW4gZW1pdCB3YXJuaW5nc1xuICogd2hlbiB3ZSBkZXRlY3QgdGhhdCB0aGVyZSdzIGxpa2VseSBjb29raWUgbWlzdXNhZ2UgZHVlIHRvIHdyb25nIHBhdGhzXG4gKlxuICogQHR5cGUge1JlY29yZDxzdHJpbmcsIFNldDxzdHJpbmc+Pn0gKi9cbmNvbnN0IGNvb2tpZV9wYXRocyA9IHt9O1xuXG4vKipcbiAqIENvb2tpZXMgdGhhdCBhcmUgbGFyZ2VyIHRoYW4gdGhpcyBzaXplIChpbmNsdWRpbmcgdGhlIG5hbWUgYW5kIG90aGVyXG4gKiBhdHRyaWJ1dGVzKSBhcmUgZGlzY2FyZGVkIGJ5IGJyb3dzZXJzXG4gKi9cbmNvbnN0IE1BWF9DT09LSUVfU0laRSA9IDQxMjk7XG5cbi8vIFRPRE8gMy4wIHJlbW92ZSB0aGlzIGNoZWNrXG4vKiogQHBhcmFtIHtpbXBvcnQoJy4vcGFnZS90eXBlcy5qcycpLkNvb2tpZVsnb3B0aW9ucyddfSBvcHRpb25zICovXG5mdW5jdGlvbiB2YWxpZGF0ZV9vcHRpb25zKG9wdGlvbnMpIHtcblx0aWYgKG9wdGlvbnM/LnBhdGggPT09IHVuZGVmaW5lZCkge1xuXHRcdHRocm93IG5ldyBFcnJvcignWW91IG11c3Qgc3BlY2lmeSBhIGBwYXRoYCB3aGVuIHNldHRpbmcsIGRlbGV0aW5nIG9yIHNlcmlhbGl6aW5nIGNvb2tpZXMnKTtcblx0fVxufVxuXG4vKipcbiAqIEBwYXJhbSB7UmVxdWVzdH0gcmVxdWVzdFxuICogQHBhcmFtIHtVUkx9IHVybFxuICogQHBhcmFtIHtpbXBvcnQoJ3R5cGVzJykuVHJhaWxpbmdTbGFzaH0gdHJhaWxpbmdfc2xhc2hcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldF9jb29raWVzKHJlcXVlc3QsIHVybCwgdHJhaWxpbmdfc2xhc2gpIHtcblx0Y29uc3QgaGVhZGVyID0gcmVxdWVzdC5oZWFkZXJzLmdldCgnY29va2llJykgPz8gJyc7XG5cdGNvbnN0IGluaXRpYWxfY29va2llcyA9IHBhcnNlKGhlYWRlciwgeyBkZWNvZGU6ICh2YWx1ZSkgPT4gdmFsdWUgfSk7XG5cblx0Y29uc3Qgbm9ybWFsaXplZF91cmwgPSBub3JtYWxpemVfcGF0aCh1cmwucGF0aG5hbWUsIHRyYWlsaW5nX3NsYXNoKTtcblxuXHQvKiogQHR5cGUge1JlY29yZDxzdHJpbmcsIGltcG9ydCgnLi9wYWdlL3R5cGVzLmpzJykuQ29va2llPn0gKi9cblx0Y29uc3QgbmV3X2Nvb2tpZXMgPSB7fTtcblxuXHQvKiogQHR5cGUge2ltcG9ydCgnY29va2llJykuQ29va2llU2VyaWFsaXplT3B0aW9uc30gKi9cblx0Y29uc3QgZGVmYXVsdHMgPSB7XG5cdFx0aHR0cE9ubHk6IHRydWUsXG5cdFx0c2FtZVNpdGU6ICdsYXgnLFxuXHRcdHNlY3VyZTogdXJsLmhvc3RuYW1lID09PSAnbG9jYWxob3N0JyAmJiB1cmwucHJvdG9jb2wgPT09ICdodHRwOicgPyBmYWxzZSA6IHRydWVcblx0fTtcblxuXHQvKiogQHR5cGUge2ltcG9ydCgnQHN2ZWx0ZWpzL2tpdCcpLkNvb2tpZXN9ICovXG5cdGNvbnN0IGNvb2tpZXMgPSB7XG5cdFx0Ly8gVGhlIEpTRG9jIHBhcmFtIGFubm90YXRpb25zIGFwcGVhcmluZyBiZWxvdyBmb3IgZ2V0LCBzZXQgYW5kIGRlbGV0ZVxuXHRcdC8vIGFyZSBuZWNlc3NhcnkgdG8gZXhwb3NlIHRoZSBgY29va2llYCBsaWJyYXJ5IHR5cGVzIHRvXG5cdFx0Ly8gdHlwZXNjcmlwdCB1c2Vycy4gYEB0eXBlIHtpbXBvcnQoJ0BzdmVsdGVqcy9raXQnKS5Db29raWVzfWAgYWJvdmUgaXMgbm90XG5cdFx0Ly8gc3VmZmljaWVudCB0byBkbyBzby5cblxuXHRcdC8qKlxuXHRcdCAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXG5cdFx0ICogQHBhcmFtIHtpbXBvcnQoJ2Nvb2tpZScpLkNvb2tpZVBhcnNlT3B0aW9uc30gb3B0c1xuXHRcdCAqL1xuXHRcdGdldChuYW1lLCBvcHRzKSB7XG5cdFx0XHRjb25zdCBjID0gbmV3X2Nvb2tpZXNbbmFtZV07XG5cdFx0XHRpZiAoXG5cdFx0XHRcdGMgJiZcblx0XHRcdFx0ZG9tYWluX21hdGNoZXModXJsLmhvc3RuYW1lLCBjLm9wdGlvbnMuZG9tYWluKSAmJlxuXHRcdFx0XHRwYXRoX21hdGNoZXModXJsLnBhdGhuYW1lLCBjLm9wdGlvbnMucGF0aClcblx0XHRcdCkge1xuXHRcdFx0XHRyZXR1cm4gYy52YWx1ZTtcblx0XHRcdH1cblxuXHRcdFx0Y29uc3QgZGVjb2RlciA9IG9wdHM/LmRlY29kZSB8fCBkZWNvZGVVUklDb21wb25lbnQ7XG5cdFx0XHRjb25zdCByZXFfY29va2llcyA9IHBhcnNlKGhlYWRlciwgeyBkZWNvZGU6IGRlY29kZXIgfSk7XG5cdFx0XHRjb25zdCBjb29raWUgPSByZXFfY29va2llc1tuYW1lXTsgLy8gdGhlIGRlY29kZWQgc3RyaW5nIG9yIHVuZGVmaW5lZFxuXG5cdFx0XHQvLyBpbiBkZXZlbG9wbWVudCwgaWYgdGhlIGNvb2tpZSB3YXMgc2V0IGR1cmluZyB0aGlzIHNlc3Npb24gd2l0aCBgY29va2llcy5zZXRgLFxuXHRcdFx0Ly8gYnV0IGF0IGEgZGlmZmVyZW50IHBhdGgsIHdhcm4gdGhlIHVzZXIuIChpZ25vcmUgY29va2llcyBmcm9tIHJlcXVlc3QgaGVhZGVycyxcblx0XHRcdC8vIHNpbmNlIHdlIGRvbid0IGtub3cgd2hpY2ggcGF0aCB0aGV5IHdlcmUgc2V0IGF0KVxuXHRcdFx0aWYgKF9fU1ZFTFRFS0lUX0RFVl9fICYmICFjb29raWUpIHtcblx0XHRcdFx0Y29uc3QgcGF0aHMgPSBBcnJheS5mcm9tKGNvb2tpZV9wYXRoc1tuYW1lXSA/PyBbXSkuZmlsdGVyKChwYXRoKSA9PiB7XG5cdFx0XHRcdFx0Ly8gd2Ugb25seSBjYXJlIGFib3V0IHBhdGhzIHRoYXQgYXJlIF9tb3JlXyBzcGVjaWZpYyB0aGFuIHRoZSBjdXJyZW50IHBhdGhcblx0XHRcdFx0XHRyZXR1cm4gcGF0aF9tYXRjaGVzKHBhdGgsIHVybC5wYXRobmFtZSkgJiYgcGF0aCAhPT0gdXJsLnBhdGhuYW1lO1xuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHRpZiAocGF0aHMubGVuZ3RoID4gMCkge1xuXHRcdFx0XHRcdGNvbnNvbGUud2Fybihcblx0XHRcdFx0XHRcdC8vIHByZXR0aWVyLWlnbm9yZVxuXHRcdFx0XHRcdFx0YCcke25hbWV9JyBjb29raWUgZG9lcyBub3QgZXhpc3QgZm9yICR7dXJsLnBhdGhuYW1lfSwgYnV0IHdhcyBwcmV2aW91c2x5IHNldCBhdCAke2NvbmpvaW4oWy4uLnBhdGhzXSl9LiBEaWQgeW91IG1lYW4gdG8gc2V0IGl0cyAncGF0aCcgdG8gJy8nIGluc3RlYWQ/YFxuXHRcdFx0XHRcdCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIGNvb2tpZTtcblx0XHR9LFxuXG5cdFx0LyoqXG5cdFx0ICogQHBhcmFtIHtpbXBvcnQoJ2Nvb2tpZScpLkNvb2tpZVBhcnNlT3B0aW9uc30gb3B0c1xuXHRcdCAqL1xuXHRcdGdldEFsbChvcHRzKSB7XG5cdFx0XHRjb25zdCBkZWNvZGVyID0gb3B0cz8uZGVjb2RlIHx8IGRlY29kZVVSSUNvbXBvbmVudDtcblx0XHRcdGNvbnN0IGNvb2tpZXMgPSBwYXJzZShoZWFkZXIsIHsgZGVjb2RlOiBkZWNvZGVyIH0pO1xuXG5cdFx0XHRmb3IgKGNvbnN0IGMgb2YgT2JqZWN0LnZhbHVlcyhuZXdfY29va2llcykpIHtcblx0XHRcdFx0aWYgKFxuXHRcdFx0XHRcdGRvbWFpbl9tYXRjaGVzKHVybC5ob3N0bmFtZSwgYy5vcHRpb25zLmRvbWFpbikgJiZcblx0XHRcdFx0XHRwYXRoX21hdGNoZXModXJsLnBhdGhuYW1lLCBjLm9wdGlvbnMucGF0aClcblx0XHRcdFx0KSB7XG5cdFx0XHRcdFx0Y29va2llc1tjLm5hbWVdID0gYy52YWx1ZTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gT2JqZWN0LmVudHJpZXMoY29va2llcykubWFwKChbbmFtZSwgdmFsdWVdKSA9PiAoeyBuYW1lLCB2YWx1ZSB9KSk7XG5cdFx0fSxcblxuXHRcdC8qKlxuXHRcdCAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXG5cdFx0ICogQHBhcmFtIHtzdHJpbmd9IHZhbHVlXG5cdFx0ICogQHBhcmFtIHtpbXBvcnQoJy4vcGFnZS90eXBlcy5qcycpLkNvb2tpZVsnb3B0aW9ucyddfSBvcHRpb25zXG5cdFx0ICovXG5cdFx0c2V0KG5hbWUsIHZhbHVlLCBvcHRpb25zKSB7XG5cdFx0XHR2YWxpZGF0ZV9vcHRpb25zKG9wdGlvbnMpO1xuXHRcdFx0c2V0X2ludGVybmFsKG5hbWUsIHZhbHVlLCB7IC4uLmRlZmF1bHRzLCAuLi5vcHRpb25zIH0pO1xuXHRcdH0sXG5cblx0XHQvKipcblx0XHQgKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxuXHRcdCAqICBAcGFyYW0ge2ltcG9ydCgnLi9wYWdlL3R5cGVzLmpzJykuQ29va2llWydvcHRpb25zJ119IG9wdGlvbnNcblx0XHQgKi9cblx0XHRkZWxldGUobmFtZSwgb3B0aW9ucykge1xuXHRcdFx0dmFsaWRhdGVfb3B0aW9ucyhvcHRpb25zKTtcblx0XHRcdGNvb2tpZXMuc2V0KG5hbWUsICcnLCB7IC4uLm9wdGlvbnMsIG1heEFnZTogMCB9KTtcblx0XHR9LFxuXG5cdFx0LyoqXG5cdFx0ICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcblx0XHQgKiBAcGFyYW0ge3N0cmluZ30gdmFsdWVcblx0XHQgKiAgQHBhcmFtIHtpbXBvcnQoJy4vcGFnZS90eXBlcy5qcycpLkNvb2tpZVsnb3B0aW9ucyddfSBvcHRpb25zXG5cdFx0ICovXG5cdFx0c2VyaWFsaXplKG5hbWUsIHZhbHVlLCBvcHRpb25zKSB7XG5cdFx0XHR2YWxpZGF0ZV9vcHRpb25zKG9wdGlvbnMpO1xuXG5cdFx0XHRsZXQgcGF0aCA9IG9wdGlvbnMucGF0aDtcblxuXHRcdFx0aWYgKCFvcHRpb25zLmRvbWFpbiB8fCBvcHRpb25zLmRvbWFpbiA9PT0gdXJsLmhvc3RuYW1lKSB7XG5cdFx0XHRcdHBhdGggPSByZXNvbHZlKG5vcm1hbGl6ZWRfdXJsLCBwYXRoKTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHNlcmlhbGl6ZShuYW1lLCB2YWx1ZSwgeyAuLi5kZWZhdWx0cywgLi4ub3B0aW9ucywgcGF0aCB9KTtcblx0XHR9XG5cdH07XG5cblx0LyoqXG5cdCAqIEBwYXJhbSB7VVJMfSBkZXN0aW5hdGlvblxuXHQgKiBAcGFyYW0ge3N0cmluZyB8IG51bGx9IGhlYWRlclxuXHQgKi9cblx0ZnVuY3Rpb24gZ2V0X2Nvb2tpZV9oZWFkZXIoZGVzdGluYXRpb24sIGhlYWRlcikge1xuXHRcdC8qKiBAdHlwZSB7UmVjb3JkPHN0cmluZywgc3RyaW5nPn0gKi9cblx0XHRjb25zdCBjb21iaW5lZF9jb29raWVzID0ge1xuXHRcdFx0Ly8gY29va2llcyBzZW50IGJ5IHRoZSB1c2VyIGFnZW50IGhhdmUgbG93ZXN0IHByZWNlZGVuY2Vcblx0XHRcdC4uLmluaXRpYWxfY29va2llc1xuXHRcdH07XG5cblx0XHQvLyBjb29raWVzIHByZXZpb3VzIHNldCBkdXJpbmcgdGhpcyBldmVudCB3aXRoIGNvb2tpZXMuc2V0IGhhdmUgaGlnaGVyIHByZWNlZGVuY2Vcblx0XHRmb3IgKGNvbnN0IGtleSBpbiBuZXdfY29va2llcykge1xuXHRcdFx0Y29uc3QgY29va2llID0gbmV3X2Nvb2tpZXNba2V5XTtcblx0XHRcdGlmICghZG9tYWluX21hdGNoZXMoZGVzdGluYXRpb24uaG9zdG5hbWUsIGNvb2tpZS5vcHRpb25zLmRvbWFpbikpIGNvbnRpbnVlO1xuXHRcdFx0aWYgKCFwYXRoX21hdGNoZXMoZGVzdGluYXRpb24ucGF0aG5hbWUsIGNvb2tpZS5vcHRpb25zLnBhdGgpKSBjb250aW51ZTtcblxuXHRcdFx0Y29uc3QgZW5jb2RlciA9IGNvb2tpZS5vcHRpb25zLmVuY29kZSB8fCBlbmNvZGVVUklDb21wb25lbnQ7XG5cdFx0XHRjb21iaW5lZF9jb29raWVzW2Nvb2tpZS5uYW1lXSA9IGVuY29kZXIoY29va2llLnZhbHVlKTtcblx0XHR9XG5cblx0XHQvLyBleHBsaWNpdCBoZWFkZXIgaGFzIGhpZ2hlc3QgcHJlY2VkZW5jZVxuXHRcdGlmIChoZWFkZXIpIHtcblx0XHRcdGNvbnN0IHBhcnNlZCA9IHBhcnNlKGhlYWRlciwgeyBkZWNvZGU6ICh2YWx1ZSkgPT4gdmFsdWUgfSk7XG5cdFx0XHRmb3IgKGNvbnN0IG5hbWUgaW4gcGFyc2VkKSB7XG5cdFx0XHRcdGNvbWJpbmVkX2Nvb2tpZXNbbmFtZV0gPSBwYXJzZWRbbmFtZV07XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIE9iamVjdC5lbnRyaWVzKGNvbWJpbmVkX2Nvb2tpZXMpXG5cdFx0XHQubWFwKChbbmFtZSwgdmFsdWVdKSA9PiBgJHtuYW1lfT0ke3ZhbHVlfWApXG5cdFx0XHQuam9pbignOyAnKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxuXHQgKiBAcGFyYW0ge3N0cmluZ30gdmFsdWVcblx0ICogQHBhcmFtIHtpbXBvcnQoJy4vcGFnZS90eXBlcy5qcycpLkNvb2tpZVsnb3B0aW9ucyddfSBvcHRpb25zXG5cdCAqL1xuXHRmdW5jdGlvbiBzZXRfaW50ZXJuYWwobmFtZSwgdmFsdWUsIG9wdGlvbnMpIHtcblx0XHRsZXQgcGF0aCA9IG9wdGlvbnMucGF0aDtcblxuXHRcdGlmICghb3B0aW9ucy5kb21haW4gfHwgb3B0aW9ucy5kb21haW4gPT09IHVybC5ob3N0bmFtZSkge1xuXHRcdFx0cGF0aCA9IHJlc29sdmUobm9ybWFsaXplZF91cmwsIHBhdGgpO1xuXHRcdH1cblxuXHRcdG5ld19jb29raWVzW25hbWVdID0geyBuYW1lLCB2YWx1ZSwgb3B0aW9uczogeyAuLi5vcHRpb25zLCBwYXRoIH0gfTtcblxuXHRcdGlmIChfX1NWRUxURUtJVF9ERVZfXykge1xuXHRcdFx0Y29uc3Qgc2VyaWFsaXplZCA9IHNlcmlhbGl6ZShuYW1lLCB2YWx1ZSwgbmV3X2Nvb2tpZXNbbmFtZV0ub3B0aW9ucyk7XG5cdFx0XHRpZiAobmV3IFRleHRFbmNvZGVyKCkuZW5jb2RlKHNlcmlhbGl6ZWQpLmJ5dGVMZW5ndGggPiBNQVhfQ09PS0lFX1NJWkUpIHtcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKGBDb29raWUgXCIke25hbWV9XCIgaXMgdG9vIGxhcmdlLCBhbmQgd2lsbCBiZSBkaXNjYXJkZWQgYnkgdGhlIGJyb3dzZXJgKTtcblx0XHRcdH1cblxuXHRcdFx0Y29va2llX3BhdGhzW25hbWVdID8/PSBuZXcgU2V0KCk7XG5cblx0XHRcdGlmICghdmFsdWUpIHtcblx0XHRcdFx0Y29va2llX3BhdGhzW25hbWVdLmRlbGV0ZShwYXRoKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGNvb2tpZV9wYXRoc1tuYW1lXS5hZGQocGF0aCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIHsgY29va2llcywgbmV3X2Nvb2tpZXMsIGdldF9jb29raWVfaGVhZGVyLCBzZXRfaW50ZXJuYWwgfTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gaG9zdG5hbWVcbiAqIEBwYXJhbSB7c3RyaW5nfSBbY29uc3RyYWludF1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRvbWFpbl9tYXRjaGVzKGhvc3RuYW1lLCBjb25zdHJhaW50KSB7XG5cdGlmICghY29uc3RyYWludCkgcmV0dXJuIHRydWU7XG5cblx0Y29uc3Qgbm9ybWFsaXplZCA9IGNvbnN0cmFpbnRbMF0gPT09ICcuJyA/IGNvbnN0cmFpbnQuc2xpY2UoMSkgOiBjb25zdHJhaW50O1xuXG5cdGlmIChob3N0bmFtZSA9PT0gbm9ybWFsaXplZCkgcmV0dXJuIHRydWU7XG5cdHJldHVybiBob3N0bmFtZS5lbmRzV2l0aCgnLicgKyBub3JtYWxpemVkKTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gcGF0aFxuICogQHBhcmFtIHtzdHJpbmd9IFtjb25zdHJhaW50XVxuICovXG5leHBvcnQgZnVuY3Rpb24gcGF0aF9tYXRjaGVzKHBhdGgsIGNvbnN0cmFpbnQpIHtcblx0aWYgKCFjb25zdHJhaW50KSByZXR1cm4gdHJ1ZTtcblxuXHRjb25zdCBub3JtYWxpemVkID0gY29uc3RyYWludC5lbmRzV2l0aCgnLycpID8gY29uc3RyYWludC5zbGljZSgwLCAtMSkgOiBjb25zdHJhaW50O1xuXG5cdGlmIChwYXRoID09PSBub3JtYWxpemVkKSByZXR1cm4gdHJ1ZTtcblx0cmV0dXJuIHBhdGguc3RhcnRzV2l0aChub3JtYWxpemVkICsgJy8nKTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge0hlYWRlcnN9IGhlYWRlcnNcbiAqIEBwYXJhbSB7aW1wb3J0KCcuL3BhZ2UvdHlwZXMuanMnKS5Db29raWVbXX0gY29va2llc1xuICovXG5leHBvcnQgZnVuY3Rpb24gYWRkX2Nvb2tpZXNfdG9faGVhZGVycyhoZWFkZXJzLCBjb29raWVzKSB7XG5cdGZvciAoY29uc3QgbmV3X2Nvb2tpZSBvZiBjb29raWVzKSB7XG5cdFx0Y29uc3QgeyBuYW1lLCB2YWx1ZSwgb3B0aW9ucyB9ID0gbmV3X2Nvb2tpZTtcblx0XHRoZWFkZXJzLmFwcGVuZCgnc2V0LWNvb2tpZScsIHNlcmlhbGl6ZShuYW1lLCB2YWx1ZSwgb3B0aW9ucykpO1xuXG5cdFx0Ly8gc3BlY2lhbCBjYXNlIOKAlCBmb3Igcm91dGVzIGVuZGluZyB3aXRoIC5odG1sLCB0aGUgcm91dGUgZGF0YSBsaXZlcyBpbiBhIHNpYmxpbmdcblx0XHQvLyBgLmh0bWxfX2RhdGEuanNvbmAgZmlsZSByYXRoZXIgdGhhbiBhIGNoaWxkIGAvX19kYXRhLmpzb25gIGZpbGUsIHdoaWNoIG1lYW5zXG5cdFx0Ly8gd2UgbmVlZCB0byBkdXBsaWNhdGUgdGhlIGNvb2tpZVxuXHRcdGlmIChvcHRpb25zLnBhdGguZW5kc1dpdGgoJy5odG1sJykpIHtcblx0XHRcdGNvbnN0IHBhdGggPSBhZGRfZGF0YV9zdWZmaXgob3B0aW9ucy5wYXRoKTtcblx0XHRcdGhlYWRlcnMuYXBwZW5kKCdzZXQtY29va2llJywgc2VyaWFsaXplKG5hbWUsIHZhbHVlLCB7IC4uLm9wdGlvbnMsIHBhdGggfSkpO1xuXHRcdH1cblx0fVxufVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nW119IGFycmF5XG4gKi9cbmZ1bmN0aW9uIGNvbmpvaW4oYXJyYXkpIHtcblx0aWYgKGFycmF5Lmxlbmd0aCA8PSAyKSByZXR1cm4gYXJyYXkuam9pbignIGFuZCAnKTtcblx0cmV0dXJuIGAke2FycmF5LnNsaWNlKDAsIC0xKS5qb2luKCcsICcpfSBhbmQgJHthcnJheS5hdCgtMSl9YDtcbn1cbiIsImltcG9ydCAqIGFzIHNldF9jb29raWVfcGFyc2VyIGZyb20gJ3NldC1jb29raWUtcGFyc2VyJztcbmltcG9ydCB7IHJlc3BvbmQgfSBmcm9tICcuL3Jlc3BvbmQuanMnO1xuaW1wb3J0ICogYXMgcGF0aHMgZnJvbSAnX19zdmVsdGVraXQvcGF0aHMnO1xuXG4vKipcbiAqIEBwYXJhbSB7e1xuICogICBldmVudDogaW1wb3J0KCdAc3ZlbHRlanMva2l0JykuUmVxdWVzdEV2ZW50O1xuICogICBvcHRpb25zOiBpbXBvcnQoJ3R5cGVzJykuU1NST3B0aW9ucztcbiAqICAgbWFuaWZlc3Q6IGltcG9ydCgnQHN2ZWx0ZWpzL2tpdCcpLlNTUk1hbmlmZXN0O1xuICogICBzdGF0ZTogaW1wb3J0KCd0eXBlcycpLlNTUlN0YXRlO1xuICogICBnZXRfY29va2llX2hlYWRlcjogKHVybDogVVJMLCBoZWFkZXI6IHN0cmluZyB8IG51bGwpID0+IHN0cmluZztcbiAqICAgc2V0X2ludGVybmFsOiAobmFtZTogc3RyaW5nLCB2YWx1ZTogc3RyaW5nLCBvcHRzOiBpbXBvcnQoJy4vcGFnZS90eXBlcy5qcycpLkNvb2tpZVsnb3B0aW9ucyddKSA9PiB2b2lkO1xuICogfX0gb3B0c1xuICogQHJldHVybnMge3R5cGVvZiBmZXRjaH1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZV9mZXRjaCh7IGV2ZW50LCBvcHRpb25zLCBtYW5pZmVzdCwgc3RhdGUsIGdldF9jb29raWVfaGVhZGVyLCBzZXRfaW50ZXJuYWwgfSkge1xuXHQvKipcblx0ICogQHR5cGUge3R5cGVvZiBmZXRjaH1cblx0ICovXG5cdGNvbnN0IHNlcnZlcl9mZXRjaCA9IGFzeW5jIChpbmZvLCBpbml0KSA9PiB7XG5cdFx0Y29uc3Qgb3JpZ2luYWxfcmVxdWVzdCA9IG5vcm1hbGl6ZV9mZXRjaF9pbnB1dChpbmZvLCBpbml0LCBldmVudC51cmwpO1xuXG5cdFx0Ly8gc29tZSBydW50aW1lcyAoZS5nLiBDbG91ZGZsYXJlKSBlcnJvciBpZiB5b3UgYWNjZXNzIGByZXF1ZXN0Lm1vZGVgLFxuXHRcdC8vIGFubm95aW5nbHksIHNvIHdlIG5lZWQgdG8gcmVhZCB0aGUgdmFsdWUgZnJvbSB0aGUgYGluaXRgIG9iamVjdCBpbnN0ZWFkXG5cdFx0bGV0IG1vZGUgPSAoaW5mbyBpbnN0YW5jZW9mIFJlcXVlc3QgPyBpbmZvLm1vZGUgOiBpbml0Py5tb2RlKSA/PyAnY29ycyc7XG5cdFx0bGV0IGNyZWRlbnRpYWxzID1cblx0XHRcdChpbmZvIGluc3RhbmNlb2YgUmVxdWVzdCA/IGluZm8uY3JlZGVudGlhbHMgOiBpbml0Py5jcmVkZW50aWFscykgPz8gJ3NhbWUtb3JpZ2luJztcblxuXHRcdHJldHVybiBvcHRpb25zLmhvb2tzLmhhbmRsZUZldGNoKHtcblx0XHRcdGV2ZW50LFxuXHRcdFx0cmVxdWVzdDogb3JpZ2luYWxfcmVxdWVzdCxcblx0XHRcdGZldGNoOiBhc3luYyAoaW5mbywgaW5pdCkgPT4ge1xuXHRcdFx0XHRjb25zdCByZXF1ZXN0ID0gbm9ybWFsaXplX2ZldGNoX2lucHV0KGluZm8sIGluaXQsIGV2ZW50LnVybCk7XG5cblx0XHRcdFx0Y29uc3QgdXJsID0gbmV3IFVSTChyZXF1ZXN0LnVybCk7XG5cblx0XHRcdFx0aWYgKCFyZXF1ZXN0LmhlYWRlcnMuaGFzKCdvcmlnaW4nKSkge1xuXHRcdFx0XHRcdHJlcXVlc3QuaGVhZGVycy5zZXQoJ29yaWdpbicsIGV2ZW50LnVybC5vcmlnaW4pO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKGluZm8gIT09IG9yaWdpbmFsX3JlcXVlc3QpIHtcblx0XHRcdFx0XHRtb2RlID0gKGluZm8gaW5zdGFuY2VvZiBSZXF1ZXN0ID8gaW5mby5tb2RlIDogaW5pdD8ubW9kZSkgPz8gJ2NvcnMnO1xuXHRcdFx0XHRcdGNyZWRlbnRpYWxzID1cblx0XHRcdFx0XHRcdChpbmZvIGluc3RhbmNlb2YgUmVxdWVzdCA/IGluZm8uY3JlZGVudGlhbHMgOiBpbml0Py5jcmVkZW50aWFscykgPz8gJ3NhbWUtb3JpZ2luJztcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIFJlbW92ZSBPcmlnaW4sIGFjY29yZGluZyB0byBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9IVFRQL0hlYWRlcnMvT3JpZ2luI2Rlc2NyaXB0aW9uXG5cdFx0XHRcdGlmIChcblx0XHRcdFx0XHQocmVxdWVzdC5tZXRob2QgPT09ICdHRVQnIHx8IHJlcXVlc3QubWV0aG9kID09PSAnSEVBRCcpICYmXG5cdFx0XHRcdFx0KChtb2RlID09PSAnbm8tY29ycycgJiYgdXJsLm9yaWdpbiAhPT0gZXZlbnQudXJsLm9yaWdpbikgfHxcblx0XHRcdFx0XHRcdHVybC5vcmlnaW4gPT09IGV2ZW50LnVybC5vcmlnaW4pXG5cdFx0XHRcdCkge1xuXHRcdFx0XHRcdHJlcXVlc3QuaGVhZGVycy5kZWxldGUoJ29yaWdpbicpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKHVybC5vcmlnaW4gIT09IGV2ZW50LnVybC5vcmlnaW4pIHtcblx0XHRcdFx0XHQvLyBBbGxvdyBjb29raWUgcGFzc3Rocm91Z2ggZm9yIFwiY3JlZGVudGlhbHM6IHNhbWUtb3JpZ2luXCIgYW5kIFwiY3JlZGVudGlhbHM6IGluY2x1ZGVcIlxuXHRcdFx0XHRcdC8vIGlmIFN2ZWx0ZUtpdCBpcyBzZXJ2aW5nIG15LmRvbWFpbi5jb206XG5cdFx0XHRcdFx0Ly8gLSAgICAgICAgZG9tYWluLmNvbSBXSUxMIE5PVCByZWNlaXZlIGNvb2tpZXNcblx0XHRcdFx0XHQvLyAtICAgICBteS5kb21haW4uY29tIFdJTEwgcmVjZWl2ZSBjb29raWVzXG5cdFx0XHRcdFx0Ly8gLSAgICBhcGkuZG9tYWluLmRvbSBXSUxMIE5PVCByZWNlaXZlIGNvb2tpZXNcblx0XHRcdFx0XHQvLyAtIHN1Yi5teS5kb21haW4uY29tIFdJTEwgcmVjZWl2ZSBjb29raWVzXG5cdFx0XHRcdFx0Ly8gcG9ydHMgZG8gbm90IGFmZmVjdCB0aGUgcmVzb2x1dGlvblxuXHRcdFx0XHRcdC8vIGxlYWRpbmcgZG90IHByZXZlbnRzIG15ZG9tYWluLmNvbSBtYXRjaGluZyBkb21haW4uY29tXG5cdFx0XHRcdFx0Ly8gRG8gbm90IGZvcndhcmQgb3RoZXIgY29va2llcyBmb3IgXCJjcmVkZW50aWFsczogaW5jbHVkZVwiIGJlY2F1c2Ugd2UgZG9uJ3Qga25vd1xuXHRcdFx0XHRcdC8vIHdoaWNoIGNvb2tpZSBiZWxvbmdzIHRvIHdoaWNoIGRvbWFpbiAoYnJvd3NlciBkb2VzIG5vdCBwYXNzIHRoaXMgaW5mbylcblx0XHRcdFx0XHRpZiAoYC4ke3VybC5ob3N0bmFtZX1gLmVuZHNXaXRoKGAuJHtldmVudC51cmwuaG9zdG5hbWV9YCkgJiYgY3JlZGVudGlhbHMgIT09ICdvbWl0Jykge1xuXHRcdFx0XHRcdFx0Y29uc3QgY29va2llID0gZ2V0X2Nvb2tpZV9oZWFkZXIodXJsLCByZXF1ZXN0LmhlYWRlcnMuZ2V0KCdjb29raWUnKSk7XG5cdFx0XHRcdFx0XHRpZiAoY29va2llKSByZXF1ZXN0LmhlYWRlcnMuc2V0KCdjb29raWUnLCBjb29raWUpO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHJldHVybiBmZXRjaChyZXF1ZXN0KTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIGhhbmRsZSBmZXRjaCByZXF1ZXN0cyBmb3Igc3RhdGljIGFzc2V0cy4gZS5nLiBwcmViYWtlZCBkYXRhLCBldGMuXG5cdFx0XHRcdC8vIHdlIG5lZWQgdG8gc3VwcG9ydCBldmVyeXRoaW5nIHRoZSBicm93c2VyJ3MgZmV0Y2ggc3VwcG9ydHNcblx0XHRcdFx0Y29uc3QgcHJlZml4ID0gcGF0aHMuYXNzZXRzIHx8IHBhdGhzLmJhc2U7XG5cdFx0XHRcdGNvbnN0IGRlY29kZWQgPSBkZWNvZGVVUklDb21wb25lbnQodXJsLnBhdGhuYW1lKTtcblx0XHRcdFx0Y29uc3QgZmlsZW5hbWUgPSAoXG5cdFx0XHRcdFx0ZGVjb2RlZC5zdGFydHNXaXRoKHByZWZpeCkgPyBkZWNvZGVkLnNsaWNlKHByZWZpeC5sZW5ndGgpIDogZGVjb2RlZFxuXHRcdFx0XHQpLnNsaWNlKDEpO1xuXHRcdFx0XHRjb25zdCBmaWxlbmFtZV9odG1sID0gYCR7ZmlsZW5hbWV9L2luZGV4Lmh0bWxgOyAvLyBwYXRoIG1heSBhbHNvIG1hdGNoIHBhdGgvaW5kZXguaHRtbFxuXG5cdFx0XHRcdGNvbnN0IGlzX2Fzc2V0ID0gbWFuaWZlc3QuYXNzZXRzLmhhcyhmaWxlbmFtZSk7XG5cdFx0XHRcdGNvbnN0IGlzX2Fzc2V0X2h0bWwgPSBtYW5pZmVzdC5hc3NldHMuaGFzKGZpbGVuYW1lX2h0bWwpO1xuXG5cdFx0XHRcdGlmIChpc19hc3NldCB8fCBpc19hc3NldF9odG1sKSB7XG5cdFx0XHRcdFx0Y29uc3QgZmlsZSA9IGlzX2Fzc2V0ID8gZmlsZW5hbWUgOiBmaWxlbmFtZV9odG1sO1xuXG5cdFx0XHRcdFx0aWYgKHN0YXRlLnJlYWQpIHtcblx0XHRcdFx0XHRcdGNvbnN0IHR5cGUgPSBpc19hc3NldFxuXHRcdFx0XHRcdFx0XHQ/IG1hbmlmZXN0Lm1pbWVUeXBlc1tmaWxlbmFtZS5zbGljZShmaWxlbmFtZS5sYXN0SW5kZXhPZignLicpKV1cblx0XHRcdFx0XHRcdFx0OiAndGV4dC9odG1sJztcblxuXHRcdFx0XHRcdFx0cmV0dXJuIG5ldyBSZXNwb25zZShzdGF0ZS5yZWFkKGZpbGUpLCB7XG5cdFx0XHRcdFx0XHRcdGhlYWRlcnM6IHR5cGUgPyB7ICdjb250ZW50LXR5cGUnOiB0eXBlIH0gOiB7fVxuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0cmV0dXJuIGF3YWl0IGZldGNoKHJlcXVlc3QpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKGNyZWRlbnRpYWxzICE9PSAnb21pdCcpIHtcblx0XHRcdFx0XHRjb25zdCBjb29raWUgPSBnZXRfY29va2llX2hlYWRlcih1cmwsIHJlcXVlc3QuaGVhZGVycy5nZXQoJ2Nvb2tpZScpKTtcblx0XHRcdFx0XHRpZiAoY29va2llKSB7XG5cdFx0XHRcdFx0XHRyZXF1ZXN0LmhlYWRlcnMuc2V0KCdjb29raWUnLCBjb29raWUpO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGNvbnN0IGF1dGhvcml6YXRpb24gPSBldmVudC5yZXF1ZXN0LmhlYWRlcnMuZ2V0KCdhdXRob3JpemF0aW9uJyk7XG5cdFx0XHRcdFx0aWYgKGF1dGhvcml6YXRpb24gJiYgIXJlcXVlc3QuaGVhZGVycy5oYXMoJ2F1dGhvcml6YXRpb24nKSkge1xuXHRcdFx0XHRcdFx0cmVxdWVzdC5oZWFkZXJzLnNldCgnYXV0aG9yaXphdGlvbicsIGF1dGhvcml6YXRpb24pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmICghcmVxdWVzdC5oZWFkZXJzLmhhcygnYWNjZXB0JykpIHtcblx0XHRcdFx0XHRyZXF1ZXN0LmhlYWRlcnMuc2V0KCdhY2NlcHQnLCAnKi8qJyk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoIXJlcXVlc3QuaGVhZGVycy5oYXMoJ2FjY2VwdC1sYW5ndWFnZScpKSB7XG5cdFx0XHRcdFx0cmVxdWVzdC5oZWFkZXJzLnNldChcblx0XHRcdFx0XHRcdCdhY2NlcHQtbGFuZ3VhZ2UnLFxuXHRcdFx0XHRcdFx0LyoqIEB0eXBlIHtzdHJpbmd9ICovIChldmVudC5yZXF1ZXN0LmhlYWRlcnMuZ2V0KCdhY2NlcHQtbGFuZ3VhZ2UnKSlcblx0XHRcdFx0XHQpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0LyoqIEB0eXBlIHtSZXNwb25zZX0gKi9cblx0XHRcdFx0Y29uc3QgcmVzcG9uc2UgPSBhd2FpdCByZXNwb25kKHJlcXVlc3QsIG9wdGlvbnMsIG1hbmlmZXN0LCB7XG5cdFx0XHRcdFx0Li4uc3RhdGUsXG5cdFx0XHRcdFx0ZGVwdGg6IHN0YXRlLmRlcHRoICsgMVxuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHRjb25zdCBzZXRfY29va2llID0gcmVzcG9uc2UuaGVhZGVycy5nZXQoJ3NldC1jb29raWUnKTtcblx0XHRcdFx0aWYgKHNldF9jb29raWUpIHtcblx0XHRcdFx0XHRmb3IgKGNvbnN0IHN0ciBvZiBzZXRfY29va2llX3BhcnNlci5zcGxpdENvb2tpZXNTdHJpbmcoc2V0X2Nvb2tpZSkpIHtcblx0XHRcdFx0XHRcdGNvbnN0IHsgbmFtZSwgdmFsdWUsIC4uLm9wdGlvbnMgfSA9IHNldF9jb29raWVfcGFyc2VyLnBhcnNlU3RyaW5nKHN0cik7XG5cblx0XHRcdFx0XHRcdGNvbnN0IHBhdGggPSBvcHRpb25zLnBhdGggPz8gKHVybC5wYXRobmFtZS5zcGxpdCgnLycpLnNsaWNlKDAsIC0xKS5qb2luKCcvJykgfHwgJy8nKTtcblxuXHRcdFx0XHRcdFx0Ly8gb3B0aW9ucy5zYW1lU2l0ZSBpcyBzdHJpbmcsIHNvbWV0aGluZyBtb3JlIHNwZWNpZmljIGlzIHJlcXVpcmVkIC0gdHlwZSBjYXN0IGlzIHNhZmVcblx0XHRcdFx0XHRcdHNldF9pbnRlcm5hbChuYW1lLCB2YWx1ZSwge1xuXHRcdFx0XHRcdFx0XHRwYXRoLFxuXHRcdFx0XHRcdFx0XHQuLi4vKiogQHR5cGUge2ltcG9ydCgnY29va2llJykuQ29va2llU2VyaWFsaXplT3B0aW9uc30gKi8gKG9wdGlvbnMpXG5cdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRyZXR1cm4gcmVzcG9uc2U7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH07XG5cblx0Ly8gRG9uJ3QgbWFrZSB0aGlzIGZ1bmN0aW9uIGBhc3luY2AhIE90aGVyd2lzZSwgdGhlIHVzZXIgaGFzIHRvIGBjYXRjaGAgcHJvbWlzZXMgdGhleSB1c2UgZm9yIHN0cmVhbWluZyByZXNwb25zZXMgb3IgZWxzZVxuXHQvLyBpdCB3aWxsIGJlIGFuIHVuaGFuZGxlZCByZWplY3Rpb24uIEluc3RlYWQsIHdlIGFkZCBhIGAuY2F0Y2goKCkgPT4ge30pYCBvdXJzZWx2ZXMgYmVsb3cgdG8gdGhpcyBmcm9tIGhhcHBlbmluZy5cblx0cmV0dXJuIChpbnB1dCwgaW5pdCkgPT4ge1xuXHRcdC8vIFNlZSBkb2NzIGluIGZldGNoLmpzIGZvciB3aHkgd2UgbmVlZCB0byBkbyB0aGlzXG5cdFx0Y29uc3QgcmVzcG9uc2UgPSBzZXJ2ZXJfZmV0Y2goaW5wdXQsIGluaXQpO1xuXHRcdHJlc3BvbnNlLmNhdGNoKCgpID0+IHt9KTtcblx0XHRyZXR1cm4gcmVzcG9uc2U7XG5cdH07XG59XG5cbi8qKlxuICogQHBhcmFtIHtSZXF1ZXN0SW5mbyB8IFVSTH0gaW5mb1xuICogQHBhcmFtIHtSZXF1ZXN0SW5pdCB8IHVuZGVmaW5lZH0gaW5pdFxuICogQHBhcmFtIHtVUkx9IHVybFxuICovXG5mdW5jdGlvbiBub3JtYWxpemVfZmV0Y2hfaW5wdXQoaW5mbywgaW5pdCwgdXJsKSB7XG5cdGlmIChpbmZvIGluc3RhbmNlb2YgUmVxdWVzdCkge1xuXHRcdHJldHVybiBpbmZvO1xuXHR9XG5cblx0cmV0dXJuIG5ldyBSZXF1ZXN0KHR5cGVvZiBpbmZvID09PSAnc3RyaW5nJyA/IG5ldyBVUkwoaW5mbywgdXJsKSA6IGluZm8sIGluaXQpO1xufVxuIiwiaW1wb3J0IHsgcHVibGljX2VudiB9IGZyb20gJy4uL3NoYXJlZC1zZXJ2ZXIuanMnO1xuXG4vKiogQHR5cGUge3N0cmluZ30gKi9cbmxldCBib2R5O1xuXG4vKiogQHR5cGUge3N0cmluZ30gKi9cbmxldCBldGFnO1xuXG4vKiogQHR5cGUge0hlYWRlcnN9ICovXG5sZXQgaGVhZGVycztcblxuLyoqXG4gKiBAcGFyYW0ge1JlcXVlc3R9IHJlcXVlc3RcbiAqIEByZXR1cm5zIHtSZXNwb25zZX1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldF9wdWJsaWNfZW52KHJlcXVlc3QpIHtcblx0Ym9keSA/Pz0gYGV4cG9ydCBjb25zdCBlbnY9JHtKU09OLnN0cmluZ2lmeShwdWJsaWNfZW52KX1gO1xuXHRldGFnID8/PSBgVy8ke0RhdGUubm93KCl9YDtcblx0aGVhZGVycyA/Pz0gbmV3IEhlYWRlcnMoe1xuXHRcdCdjb250ZW50LXR5cGUnOiAnYXBwbGljYXRpb24vamF2YXNjcmlwdDsgY2hhcnNldD11dGYtOCcsXG5cdFx0ZXRhZ1xuXHR9KTtcblxuXHRpZiAocmVxdWVzdC5oZWFkZXJzLmdldCgnaWYtbm9uZS1tYXRjaCcpID09PSBldGFnKSB7XG5cdFx0cmV0dXJuIG5ldyBSZXNwb25zZSh1bmRlZmluZWQsIHsgc3RhdHVzOiAzMDQsIGhlYWRlcnMgfSk7XG5cdH1cblxuXHRyZXR1cm4gbmV3IFJlc3BvbnNlKGJvZHksIHsgaGVhZGVycyB9KTtcbn1cbiIsIi8qKlxuICogRG8gYSBzaGFsbG93IG1lcmdlIChmaXJzdCBsZXZlbCkgb2YgdGhlIGNvbmZpZyBvYmplY3RcbiAqIEBwYXJhbSB7QXJyYXk8aW1wb3J0KCd0eXBlcycpLlNTUk5vZGUgfCB1bmRlZmluZWQ+fSBub2Rlc1xuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0X3BhZ2VfY29uZmlnKG5vZGVzKSB7XG5cdC8qKiBAdHlwZSB7YW55fSAqL1xuXHRsZXQgY3VycmVudCA9IHt9O1xuXG5cdGZvciAoY29uc3Qgbm9kZSBvZiBub2Rlcykge1xuXHRcdGlmICghbm9kZT8udW5pdmVyc2FsPy5jb25maWcgJiYgIW5vZGU/LnNlcnZlcj8uY29uZmlnKSBjb250aW51ZTtcblxuXHRcdGN1cnJlbnQgPSB7XG5cdFx0XHQuLi5jdXJyZW50LFxuXHRcdFx0Li4ubm9kZT8udW5pdmVyc2FsPy5jb25maWcsXG5cdFx0XHQuLi5ub2RlPy5zZXJ2ZXI/LmNvbmZpZ1xuXHRcdH07XG5cdH1cblxuXHQvLyBUT0RPIDMuMCBhbHdheXMgcmV0dXJuIGBjdXJyZW50YD8gdGhlbiB3ZSBjYW4gZ2V0IHJpZCBvZiBgPz8ge31gIGluIG90aGVyIHBsYWNlc1xuXHRyZXR1cm4gT2JqZWN0LmtleXMoY3VycmVudCkubGVuZ3RoID8gY3VycmVudCA6IHVuZGVmaW5lZDtcbn1cbiIsImltcG9ydCB7IERFViB9IGZyb20gJ2VzbS1lbnYnO1xuaW1wb3J0IHsgYmFzZSB9IGZyb20gJ19fc3ZlbHRla2l0L3BhdGhzJztcbmltcG9ydCB7IGlzX2VuZHBvaW50X3JlcXVlc3QsIHJlbmRlcl9lbmRwb2ludCB9IGZyb20gJy4vZW5kcG9pbnQuanMnO1xuaW1wb3J0IHsgcmVuZGVyX3BhZ2UgfSBmcm9tICcuL3BhZ2UvaW5kZXguanMnO1xuaW1wb3J0IHsgcmVuZGVyX3Jlc3BvbnNlIH0gZnJvbSAnLi9wYWdlL3JlbmRlci5qcyc7XG5pbXBvcnQgeyByZXNwb25kX3dpdGhfZXJyb3IgfSBmcm9tICcuL3BhZ2UvcmVzcG9uZF93aXRoX2Vycm9yLmpzJztcbmltcG9ydCB7IGlzX2Zvcm1fY29udGVudF90eXBlIH0gZnJvbSAnLi4vLi4vdXRpbHMvaHR0cC5qcyc7XG5pbXBvcnQgeyBoYW5kbGVfZmF0YWxfZXJyb3IsIG1ldGhvZF9ub3RfYWxsb3dlZCwgcmVkaXJlY3RfcmVzcG9uc2UgfSBmcm9tICcuL3V0aWxzLmpzJztcbmltcG9ydCB7XG5cdGRlY29kZV9wYXRobmFtZSxcblx0ZGVjb2RlX3BhcmFtcyxcblx0ZGlzYWJsZV9zZWFyY2gsXG5cdGhhc19kYXRhX3N1ZmZpeCxcblx0bm9ybWFsaXplX3BhdGgsXG5cdHN0cmlwX2RhdGFfc3VmZml4XG59IGZyb20gJy4uLy4uL3V0aWxzL3VybC5qcyc7XG5pbXBvcnQgeyBleGVjIH0gZnJvbSAnLi4vLi4vdXRpbHMvcm91dGluZy5qcyc7XG5pbXBvcnQgeyByZWRpcmVjdF9qc29uX3Jlc3BvbnNlLCByZW5kZXJfZGF0YSB9IGZyb20gJy4vZGF0YS9pbmRleC5qcyc7XG5pbXBvcnQgeyBhZGRfY29va2llc190b19oZWFkZXJzLCBnZXRfY29va2llcyB9IGZyb20gJy4vY29va2llLmpzJztcbmltcG9ydCB7IGNyZWF0ZV9mZXRjaCB9IGZyb20gJy4vZmV0Y2guanMnO1xuaW1wb3J0IHsgSHR0cEVycm9yLCBSZWRpcmVjdCwgU3ZlbHRlS2l0RXJyb3IgfSBmcm9tICcuLi9jb250cm9sLmpzJztcbmltcG9ydCB7XG5cdHZhbGlkYXRlX2xheW91dF9leHBvcnRzLFxuXHR2YWxpZGF0ZV9sYXlvdXRfc2VydmVyX2V4cG9ydHMsXG5cdHZhbGlkYXRlX3BhZ2VfZXhwb3J0cyxcblx0dmFsaWRhdGVfcGFnZV9zZXJ2ZXJfZXhwb3J0cyxcblx0dmFsaWRhdGVfc2VydmVyX2V4cG9ydHNcbn0gZnJvbSAnLi4vLi4vdXRpbHMvZXhwb3J0cy5qcyc7XG5pbXBvcnQgeyBnZXRfb3B0aW9uIH0gZnJvbSAnLi4vLi4vdXRpbHMvb3B0aW9ucy5qcyc7XG5pbXBvcnQgeyBqc29uLCB0ZXh0IH0gZnJvbSAnLi4vLi4vZXhwb3J0cy9pbmRleC5qcyc7XG5pbXBvcnQgeyBhY3Rpb25fanNvbl9yZWRpcmVjdCwgaXNfYWN0aW9uX2pzb25fcmVxdWVzdCB9IGZyb20gJy4vcGFnZS9hY3Rpb25zLmpzJztcbmltcG9ydCB7IElOVkFMSURBVEVEX1BBUkFNLCBUUkFJTElOR19TTEFTSF9QQVJBTSB9IGZyb20gJy4uL3NoYXJlZC5qcyc7XG5pbXBvcnQgeyBnZXRfcHVibGljX2VudiB9IGZyb20gJy4vZW52X21vZHVsZS5qcyc7XG5pbXBvcnQgeyBsb2FkX3BhZ2Vfbm9kZXMgfSBmcm9tICcuL3BhZ2UvbG9hZF9wYWdlX25vZGVzLmpzJztcbmltcG9ydCB7IGdldF9wYWdlX2NvbmZpZyB9IGZyb20gJy4uLy4uL3V0aWxzL3JvdXRlX2NvbmZpZy5qcyc7XG5cbi8qIGdsb2JhbCBfX1NWRUxURUtJVF9BREFQVEVSX05BTUVfXyAqL1xuXG4vKiogQHR5cGUge2ltcG9ydCgndHlwZXMnKS5SZXF1aXJlZFJlc29sdmVPcHRpb25zWyd0cmFuc2Zvcm1QYWdlQ2h1bmsnXX0gKi9cbmNvbnN0IGRlZmF1bHRfdHJhbnNmb3JtID0gKHsgaHRtbCB9KSA9PiBodG1sO1xuXG4vKiogQHR5cGUge2ltcG9ydCgndHlwZXMnKS5SZXF1aXJlZFJlc29sdmVPcHRpb25zWydmaWx0ZXJTZXJpYWxpemVkUmVzcG9uc2VIZWFkZXJzJ119ICovXG5jb25zdCBkZWZhdWx0X2ZpbHRlciA9ICgpID0+IGZhbHNlO1xuXG4vKiogQHR5cGUge2ltcG9ydCgndHlwZXMnKS5SZXF1aXJlZFJlc29sdmVPcHRpb25zWydwcmVsb2FkJ119ICovXG5jb25zdCBkZWZhdWx0X3ByZWxvYWQgPSAoeyB0eXBlIH0pID0+IHR5cGUgPT09ICdqcycgfHwgdHlwZSA9PT0gJ2Nzcyc7XG5cbmNvbnN0IHBhZ2VfbWV0aG9kcyA9IG5ldyBTZXQoWydHRVQnLCAnSEVBRCcsICdQT1NUJ10pO1xuXG5jb25zdCBhbGxvd2VkX3BhZ2VfbWV0aG9kcyA9IG5ldyBTZXQoWydHRVQnLCAnSEVBRCcsICdPUFRJT05TJ10pO1xuXG4vKipcbiAqIEBwYXJhbSB7UmVxdWVzdH0gcmVxdWVzdFxuICogQHBhcmFtIHtpbXBvcnQoJ3R5cGVzJykuU1NST3B0aW9uc30gb3B0aW9uc1xuICogQHBhcmFtIHtpbXBvcnQoJ0BzdmVsdGVqcy9raXQnKS5TU1JNYW5pZmVzdH0gbWFuaWZlc3RcbiAqIEBwYXJhbSB7aW1wb3J0KCd0eXBlcycpLlNTUlN0YXRlfSBzdGF0ZVxuICogQHJldHVybnMge1Byb21pc2U8UmVzcG9uc2U+fVxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVzcG9uZChyZXF1ZXN0LCBvcHRpb25zLCBtYW5pZmVzdCwgc3RhdGUpIHtcblx0LyoqIFVSTCBidXQgc3RyaXBwZWQgZnJvbSB0aGUgcG90ZW50aWFsIGAvX19kYXRhLmpzb25gIHN1ZmZpeCBhbmQgaXRzIHNlYXJjaCBwYXJhbSAgKi9cblx0Y29uc3QgdXJsID0gbmV3IFVSTChyZXF1ZXN0LnVybCk7XG5cblx0aWYgKG9wdGlvbnMuY3NyZl9jaGVja19vcmlnaW4pIHtcblx0XHRjb25zdCBmb3JiaWRkZW4gPVxuXHRcdFx0aXNfZm9ybV9jb250ZW50X3R5cGUocmVxdWVzdCkgJiZcblx0XHRcdChyZXF1ZXN0Lm1ldGhvZCA9PT0gJ1BPU1QnIHx8XG5cdFx0XHRcdHJlcXVlc3QubWV0aG9kID09PSAnUFVUJyB8fFxuXHRcdFx0XHRyZXF1ZXN0Lm1ldGhvZCA9PT0gJ1BBVENIJyB8fFxuXHRcdFx0XHRyZXF1ZXN0Lm1ldGhvZCA9PT0gJ0RFTEVURScpICYmXG5cdFx0XHRyZXF1ZXN0LmhlYWRlcnMuZ2V0KCdvcmlnaW4nKSAhPT0gdXJsLm9yaWdpbjtcblxuXHRcdGlmIChmb3JiaWRkZW4pIHtcblx0XHRcdGNvbnN0IGNzcmZfZXJyb3IgPSBuZXcgSHR0cEVycm9yKFxuXHRcdFx0XHQ0MDMsXG5cdFx0XHRcdGBDcm9zcy1zaXRlICR7cmVxdWVzdC5tZXRob2R9IGZvcm0gc3VibWlzc2lvbnMgYXJlIGZvcmJpZGRlbmBcblx0XHRcdCk7XG5cdFx0XHRpZiAocmVxdWVzdC5oZWFkZXJzLmdldCgnYWNjZXB0JykgPT09ICdhcHBsaWNhdGlvbi9qc29uJykge1xuXHRcdFx0XHRyZXR1cm4ganNvbihjc3JmX2Vycm9yLmJvZHksIHsgc3RhdHVzOiBjc3JmX2Vycm9yLnN0YXR1cyB9KTtcblx0XHRcdH1cblx0XHRcdHJldHVybiB0ZXh0KGNzcmZfZXJyb3IuYm9keS5tZXNzYWdlLCB7IHN0YXR1czogY3NyZl9lcnJvci5zdGF0dXMgfSk7XG5cdFx0fVxuXHR9XG5cblx0Ly8gcmVyb3V0ZSBjb3VsZCBhbHRlciB0aGUgZ2l2ZW4gVVJMLCBzbyB3ZSBwYXNzIGEgY29weVxuXHRsZXQgcmVyb3V0ZWRfcGF0aDtcblx0dHJ5IHtcblx0XHRyZXJvdXRlZF9wYXRoID0gb3B0aW9ucy5ob29rcy5yZXJvdXRlKHsgdXJsOiBuZXcgVVJMKHVybCkgfSkgPz8gdXJsLnBhdGhuYW1lO1xuXHR9IGNhdGNoIChlKSB7XG5cdFx0cmV0dXJuIHRleHQoJ0ludGVybmFsIFNlcnZlciBFcnJvcicsIHtcblx0XHRcdHN0YXR1czogNTAwXG5cdFx0fSk7XG5cdH1cblxuXHRsZXQgZGVjb2RlZDtcblx0dHJ5IHtcblx0XHRkZWNvZGVkID0gZGVjb2RlX3BhdGhuYW1lKHJlcm91dGVkX3BhdGgpO1xuXHR9IGNhdGNoIHtcblx0XHRyZXR1cm4gdGV4dCgnTWFsZm9ybWVkIFVSSScsIHsgc3RhdHVzOiA0MDAgfSk7XG5cdH1cblxuXHQvKiogQHR5cGUge2ltcG9ydCgndHlwZXMnKS5TU1JSb3V0ZSB8IG51bGx9ICovXG5cdGxldCByb3V0ZSA9IG51bGw7XG5cblx0LyoqIEB0eXBlIHtSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+fSAqL1xuXHRsZXQgcGFyYW1zID0ge307XG5cblx0aWYgKGJhc2UgJiYgIXN0YXRlLnByZXJlbmRlcmluZz8uZmFsbGJhY2spIHtcblx0XHRpZiAoIWRlY29kZWQuc3RhcnRzV2l0aChiYXNlKSkge1xuXHRcdFx0cmV0dXJuIHRleHQoJ05vdCBmb3VuZCcsIHsgc3RhdHVzOiA0MDQgfSk7XG5cdFx0fVxuXHRcdGRlY29kZWQgPSBkZWNvZGVkLnNsaWNlKGJhc2UubGVuZ3RoKSB8fCAnLyc7XG5cdH1cblxuXHRpZiAoZGVjb2RlZCA9PT0gYC8ke29wdGlvbnMuYXBwX2Rpcn0vZW52LmpzYCkge1xuXHRcdHJldHVybiBnZXRfcHVibGljX2VudihyZXF1ZXN0KTtcblx0fVxuXG5cdGlmIChkZWNvZGVkLnN0YXJ0c1dpdGgoYC8ke29wdGlvbnMuYXBwX2Rpcn1gKSkge1xuXHRcdHJldHVybiB0ZXh0KCdOb3QgZm91bmQnLCB7IHN0YXR1czogNDA0IH0pO1xuXHR9XG5cblx0Y29uc3QgaXNfZGF0YV9yZXF1ZXN0ID0gaGFzX2RhdGFfc3VmZml4KGRlY29kZWQpO1xuXHQvKiogQHR5cGUge2Jvb2xlYW5bXSB8IHVuZGVmaW5lZH0gKi9cblx0bGV0IGludmFsaWRhdGVkX2RhdGFfbm9kZXM7XG5cdGlmIChpc19kYXRhX3JlcXVlc3QpIHtcblx0XHRkZWNvZGVkID0gc3RyaXBfZGF0YV9zdWZmaXgoZGVjb2RlZCkgfHwgJy8nO1xuXHRcdHVybC5wYXRobmFtZSA9XG5cdFx0XHRzdHJpcF9kYXRhX3N1ZmZpeCh1cmwucGF0aG5hbWUpICtcblx0XHRcdFx0KHVybC5zZWFyY2hQYXJhbXMuZ2V0KFRSQUlMSU5HX1NMQVNIX1BBUkFNKSA9PT0gJzEnID8gJy8nIDogJycpIHx8ICcvJztcblx0XHR1cmwuc2VhcmNoUGFyYW1zLmRlbGV0ZShUUkFJTElOR19TTEFTSF9QQVJBTSk7XG5cdFx0aW52YWxpZGF0ZWRfZGF0YV9ub2RlcyA9IHVybC5zZWFyY2hQYXJhbXNcblx0XHRcdC5nZXQoSU5WQUxJREFURURfUEFSQU0pXG5cdFx0XHQ/LnNwbGl0KCcnKVxuXHRcdFx0Lm1hcCgobm9kZSkgPT4gbm9kZSA9PT0gJzEnKTtcblx0XHR1cmwuc2VhcmNoUGFyYW1zLmRlbGV0ZShJTlZBTElEQVRFRF9QQVJBTSk7XG5cdH1cblxuXHRpZiAoIXN0YXRlLnByZXJlbmRlcmluZz8uZmFsbGJhY2spIHtcblx0XHQvLyBUT0RPIHRoaXMgY291bGQgdGhlb3JldGljYWxseSBicmVhayDigJQgc2hvdWxkIHByb2JhYmx5IGJlIGluc2lkZSBhIHRyeS1jYXRjaFxuXHRcdGNvbnN0IG1hdGNoZXJzID0gYXdhaXQgbWFuaWZlc3QuXy5tYXRjaGVycygpO1xuXG5cdFx0Zm9yIChjb25zdCBjYW5kaWRhdGUgb2YgbWFuaWZlc3QuXy5yb3V0ZXMpIHtcblx0XHRcdGNvbnN0IG1hdGNoID0gY2FuZGlkYXRlLnBhdHRlcm4uZXhlYyhkZWNvZGVkKTtcblx0XHRcdGlmICghbWF0Y2gpIGNvbnRpbnVlO1xuXG5cdFx0XHRjb25zdCBtYXRjaGVkID0gZXhlYyhtYXRjaCwgY2FuZGlkYXRlLnBhcmFtcywgbWF0Y2hlcnMpO1xuXHRcdFx0aWYgKG1hdGNoZWQpIHtcblx0XHRcdFx0cm91dGUgPSBjYW5kaWRhdGU7XG5cdFx0XHRcdHBhcmFtcyA9IGRlY29kZV9wYXJhbXMobWF0Y2hlZCk7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdC8qKiBAdHlwZSB7aW1wb3J0KCd0eXBlcycpLlRyYWlsaW5nU2xhc2ggfCB2b2lkfSAqL1xuXHRsZXQgdHJhaWxpbmdfc2xhc2ggPSB1bmRlZmluZWQ7XG5cblx0LyoqIEB0eXBlIHtSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+fSAqL1xuXHRjb25zdCBoZWFkZXJzID0ge307XG5cblx0LyoqIEB0eXBlIHtSZWNvcmQ8c3RyaW5nLCBpbXBvcnQoJy4vcGFnZS90eXBlcy5qcycpLkNvb2tpZT59ICovXG5cdGxldCBjb29raWVzX3RvX2FkZCA9IHt9O1xuXG5cdC8qKiBAdHlwZSB7aW1wb3J0KCdAc3ZlbHRlanMva2l0JykuUmVxdWVzdEV2ZW50fSAqL1xuXHRjb25zdCBldmVudCA9IHtcblx0XHQvLyBAdHMtZXhwZWN0LWVycm9yIGBjb29raWVzYCBhbmQgYGZldGNoYCBuZWVkIHRvIGJlIGNyZWF0ZWQgYWZ0ZXIgdGhlIGBldmVudGAgaXRzZWxmXG5cdFx0Y29va2llczogbnVsbCxcblx0XHQvLyBAdHMtZXhwZWN0LWVycm9yXG5cdFx0ZmV0Y2g6IG51bGwsXG5cdFx0Z2V0Q2xpZW50QWRkcmVzczpcblx0XHRcdHN0YXRlLmdldENsaWVudEFkZHJlc3MgfHxcblx0XHRcdCgoKSA9PiB7XG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcihcblx0XHRcdFx0XHRgJHtfX1NWRUxURUtJVF9BREFQVEVSX05BTUVfX30gZG9lcyBub3Qgc3BlY2lmeSBnZXRDbGllbnRBZGRyZXNzLiBQbGVhc2UgcmFpc2UgYW4gaXNzdWVgXG5cdFx0XHRcdCk7XG5cdFx0XHR9KSxcblx0XHRsb2NhbHM6IHt9LFxuXHRcdHBhcmFtcyxcblx0XHRwbGF0Zm9ybTogc3RhdGUucGxhdGZvcm0sXG5cdFx0cmVxdWVzdCxcblx0XHRyb3V0ZTogeyBpZDogcm91dGU/LmlkID8/IG51bGwgfSxcblx0XHRzZXRIZWFkZXJzOiAobmV3X2hlYWRlcnMpID0+IHtcblx0XHRcdGZvciAoY29uc3Qga2V5IGluIG5ld19oZWFkZXJzKSB7XG5cdFx0XHRcdGNvbnN0IGxvd2VyID0ga2V5LnRvTG93ZXJDYXNlKCk7XG5cdFx0XHRcdGNvbnN0IHZhbHVlID0gbmV3X2hlYWRlcnNba2V5XTtcblxuXHRcdFx0XHRpZiAobG93ZXIgPT09ICdzZXQtY29va2llJykge1xuXHRcdFx0XHRcdHRocm93IG5ldyBFcnJvcihcblx0XHRcdFx0XHRcdCdVc2UgYGV2ZW50LmNvb2tpZXMuc2V0KG5hbWUsIHZhbHVlLCBvcHRpb25zKWAgaW5zdGVhZCBvZiBgZXZlbnQuc2V0SGVhZGVyc2AgdG8gc2V0IGNvb2tpZXMnXG5cdFx0XHRcdFx0KTtcblx0XHRcdFx0fSBlbHNlIGlmIChsb3dlciBpbiBoZWFkZXJzKSB7XG5cdFx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKGBcIiR7a2V5fVwiIGhlYWRlciBpcyBhbHJlYWR5IHNldGApO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGhlYWRlcnNbbG93ZXJdID0gdmFsdWU7XG5cblx0XHRcdFx0XHRpZiAoc3RhdGUucHJlcmVuZGVyaW5nICYmIGxvd2VyID09PSAnY2FjaGUtY29udHJvbCcpIHtcblx0XHRcdFx0XHRcdHN0YXRlLnByZXJlbmRlcmluZy5jYWNoZSA9IC8qKiBAdHlwZSB7c3RyaW5nfSAqLyAodmFsdWUpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0sXG5cdFx0dXJsLFxuXHRcdGlzRGF0YVJlcXVlc3Q6IGlzX2RhdGFfcmVxdWVzdCxcblx0XHRpc1N1YlJlcXVlc3Q6IHN0YXRlLmRlcHRoID4gMFxuXHR9O1xuXG5cdC8qKiBAdHlwZSB7aW1wb3J0KCd0eXBlcycpLlJlcXVpcmVkUmVzb2x2ZU9wdGlvbnN9ICovXG5cdGxldCByZXNvbHZlX29wdHMgPSB7XG5cdFx0dHJhbnNmb3JtUGFnZUNodW5rOiBkZWZhdWx0X3RyYW5zZm9ybSxcblx0XHRmaWx0ZXJTZXJpYWxpemVkUmVzcG9uc2VIZWFkZXJzOiBkZWZhdWx0X2ZpbHRlcixcblx0XHRwcmVsb2FkOiBkZWZhdWx0X3ByZWxvYWRcblx0fTtcblxuXHR0cnkge1xuXHRcdC8vIGRldGVybWluZSB3aGV0aGVyIHdlIG5lZWQgdG8gcmVkaXJlY3QgdG8gYWRkL3JlbW92ZSBhIHRyYWlsaW5nIHNsYXNoXG5cdFx0aWYgKHJvdXRlKSB7XG5cdFx0XHQvLyBpZiBgcGF0aHMuYmFzZSA9PT0gJy9hL2IvY2AsIHRoZW4gdGhlIHJvb3Qgcm91dGUgaXMgYC9hL2IvYy9gLFxuXHRcdFx0Ly8gcmVnYXJkbGVzcyBvZiB0aGUgYHRyYWlsaW5nU2xhc2hgIHJvdXRlIG9wdGlvblxuXHRcdFx0aWYgKHVybC5wYXRobmFtZSA9PT0gYmFzZSB8fCB1cmwucGF0aG5hbWUgPT09IGJhc2UgKyAnLycpIHtcblx0XHRcdFx0dHJhaWxpbmdfc2xhc2ggPSAnYWx3YXlzJztcblx0XHRcdH0gZWxzZSBpZiAocm91dGUucGFnZSkge1xuXHRcdFx0XHRjb25zdCBub2RlcyA9IGF3YWl0IGxvYWRfcGFnZV9ub2Rlcyhyb3V0ZS5wYWdlLCBtYW5pZmVzdCk7XG5cblx0XHRcdFx0aWYgKERFVikge1xuXHRcdFx0XHRcdGNvbnN0IGxheW91dHMgPSBub2Rlcy5zbGljZSgwLCAtMSk7XG5cdFx0XHRcdFx0Y29uc3QgcGFnZSA9IG5vZGVzLmF0KC0xKTtcblxuXHRcdFx0XHRcdGZvciAoY29uc3QgbGF5b3V0IG9mIGxheW91dHMpIHtcblx0XHRcdFx0XHRcdGlmIChsYXlvdXQpIHtcblx0XHRcdFx0XHRcdFx0dmFsaWRhdGVfbGF5b3V0X3NlcnZlcl9leHBvcnRzKFxuXHRcdFx0XHRcdFx0XHRcdGxheW91dC5zZXJ2ZXIsXG5cdFx0XHRcdFx0XHRcdFx0LyoqIEB0eXBlIHtzdHJpbmd9ICovIChsYXlvdXQuc2VydmVyX2lkKVxuXHRcdFx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdFx0XHR2YWxpZGF0ZV9sYXlvdXRfZXhwb3J0cyhcblx0XHRcdFx0XHRcdFx0XHRsYXlvdXQudW5pdmVyc2FsLFxuXHRcdFx0XHRcdFx0XHRcdC8qKiBAdHlwZSB7c3RyaW5nfSAqLyAobGF5b3V0LnVuaXZlcnNhbF9pZClcblx0XHRcdFx0XHRcdFx0KTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiAocGFnZSkge1xuXHRcdFx0XHRcdFx0dmFsaWRhdGVfcGFnZV9zZXJ2ZXJfZXhwb3J0cyhwYWdlLnNlcnZlciwgLyoqIEB0eXBlIHtzdHJpbmd9ICovIChwYWdlLnNlcnZlcl9pZCkpO1xuXHRcdFx0XHRcdFx0dmFsaWRhdGVfcGFnZV9leHBvcnRzKHBhZ2UudW5pdmVyc2FsLCAvKiogQHR5cGUge3N0cmluZ30gKi8gKHBhZ2UudW5pdmVyc2FsX2lkKSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0dHJhaWxpbmdfc2xhc2ggPSBnZXRfb3B0aW9uKG5vZGVzLCAndHJhaWxpbmdTbGFzaCcpO1xuXHRcdFx0fSBlbHNlIGlmIChyb3V0ZS5lbmRwb2ludCkge1xuXHRcdFx0XHRjb25zdCBub2RlID0gYXdhaXQgcm91dGUuZW5kcG9pbnQoKTtcblx0XHRcdFx0dHJhaWxpbmdfc2xhc2ggPSBub2RlLnRyYWlsaW5nU2xhc2g7XG5cblx0XHRcdFx0aWYgKERFVikge1xuXHRcdFx0XHRcdHZhbGlkYXRlX3NlcnZlcl9leHBvcnRzKG5vZGUsIC8qKiBAdHlwZSB7c3RyaW5nfSAqLyAocm91dGUuZW5kcG9pbnRfaWQpKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRpZiAoIWlzX2RhdGFfcmVxdWVzdCkge1xuXHRcdFx0XHRjb25zdCBub3JtYWxpemVkID0gbm9ybWFsaXplX3BhdGgodXJsLnBhdGhuYW1lLCB0cmFpbGluZ19zbGFzaCA/PyAnbmV2ZXInKTtcblxuXHRcdFx0XHRpZiAobm9ybWFsaXplZCAhPT0gdXJsLnBhdGhuYW1lICYmICFzdGF0ZS5wcmVyZW5kZXJpbmc/LmZhbGxiYWNrKSB7XG5cdFx0XHRcdFx0cmV0dXJuIG5ldyBSZXNwb25zZSh1bmRlZmluZWQsIHtcblx0XHRcdFx0XHRcdHN0YXR1czogMzA4LFxuXHRcdFx0XHRcdFx0aGVhZGVyczoge1xuXHRcdFx0XHRcdFx0XHQneC1zdmVsdGVraXQtbm9ybWFsaXplJzogJzEnLFxuXHRcdFx0XHRcdFx0XHRsb2NhdGlvbjpcblx0XHRcdFx0XHRcdFx0XHQvLyBlbnN1cmUgcGF0aHMgc3RhcnRpbmcgd2l0aCAnLy8nIGFyZSBub3QgdHJlYXRlZCBhcyBwcm90b2NvbC1yZWxhdGl2ZVxuXHRcdFx0XHRcdFx0XHRcdChub3JtYWxpemVkLnN0YXJ0c1dpdGgoJy8vJykgPyB1cmwub3JpZ2luICsgbm9ybWFsaXplZCA6IG5vcm1hbGl6ZWQpICtcblx0XHRcdFx0XHRcdFx0XHQodXJsLnNlYXJjaCA9PT0gJz8nID8gJycgOiB1cmwuc2VhcmNoKVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdGlmIChzdGF0ZS5iZWZvcmVfaGFuZGxlIHx8IHN0YXRlLmVtdWxhdG9yPy5wbGF0Zm9ybSkge1xuXHRcdFx0XHRsZXQgY29uZmlnID0ge307XG5cblx0XHRcdFx0LyoqIEB0eXBlIHtpbXBvcnQoJ3R5cGVzJykuUHJlcmVuZGVyT3B0aW9ufSAqL1xuXHRcdFx0XHRsZXQgcHJlcmVuZGVyID0gZmFsc2U7XG5cblx0XHRcdFx0aWYgKHJvdXRlLmVuZHBvaW50KSB7XG5cdFx0XHRcdFx0Y29uc3Qgbm9kZSA9IGF3YWl0IHJvdXRlLmVuZHBvaW50KCk7XG5cdFx0XHRcdFx0Y29uZmlnID0gbm9kZS5jb25maWcgPz8gY29uZmlnO1xuXHRcdFx0XHRcdHByZXJlbmRlciA9IG5vZGUucHJlcmVuZGVyID8/IHByZXJlbmRlcjtcblx0XHRcdFx0fSBlbHNlIGlmIChyb3V0ZS5wYWdlKSB7XG5cdFx0XHRcdFx0Y29uc3Qgbm9kZXMgPSBhd2FpdCBsb2FkX3BhZ2Vfbm9kZXMocm91dGUucGFnZSwgbWFuaWZlc3QpO1xuXHRcdFx0XHRcdGNvbmZpZyA9IGdldF9wYWdlX2NvbmZpZyhub2RlcykgPz8gY29uZmlnO1xuXHRcdFx0XHRcdHByZXJlbmRlciA9IGdldF9vcHRpb24obm9kZXMsICdwcmVyZW5kZXInKSA/PyBmYWxzZTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmIChzdGF0ZS5iZWZvcmVfaGFuZGxlKSB7XG5cdFx0XHRcdFx0c3RhdGUuYmVmb3JlX2hhbmRsZShldmVudCwgY29uZmlnLCBwcmVyZW5kZXIpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKHN0YXRlLmVtdWxhdG9yPy5wbGF0Zm9ybSkge1xuXHRcdFx0XHRcdGV2ZW50LnBsYXRmb3JtID0gYXdhaXQgc3RhdGUuZW11bGF0b3IucGxhdGZvcm0oeyBjb25maWcsIHByZXJlbmRlciB9KTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGNvbnN0IHsgY29va2llcywgbmV3X2Nvb2tpZXMsIGdldF9jb29raWVfaGVhZGVyLCBzZXRfaW50ZXJuYWwgfSA9IGdldF9jb29raWVzKFxuXHRcdFx0cmVxdWVzdCxcblx0XHRcdHVybCxcblx0XHRcdHRyYWlsaW5nX3NsYXNoID8/ICduZXZlcidcblx0XHQpO1xuXG5cdFx0Y29va2llc190b19hZGQgPSBuZXdfY29va2llcztcblx0XHRldmVudC5jb29raWVzID0gY29va2llcztcblx0XHRldmVudC5mZXRjaCA9IGNyZWF0ZV9mZXRjaCh7XG5cdFx0XHRldmVudCxcblx0XHRcdG9wdGlvbnMsXG5cdFx0XHRtYW5pZmVzdCxcblx0XHRcdHN0YXRlLFxuXHRcdFx0Z2V0X2Nvb2tpZV9oZWFkZXIsXG5cdFx0XHRzZXRfaW50ZXJuYWxcblx0XHR9KTtcblxuXHRcdGlmIChzdGF0ZS5wcmVyZW5kZXJpbmcgJiYgIXN0YXRlLnByZXJlbmRlcmluZy5mYWxsYmFjaykgZGlzYWJsZV9zZWFyY2godXJsKTtcblxuXHRcdGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgb3B0aW9ucy5ob29rcy5oYW5kbGUoe1xuXHRcdFx0ZXZlbnQsXG5cdFx0XHRyZXNvbHZlOiAoZXZlbnQsIG9wdHMpID0+XG5cdFx0XHRcdHJlc29sdmUoZXZlbnQsIG9wdHMpLnRoZW4oKHJlc3BvbnNlKSA9PiB7XG5cdFx0XHRcdFx0Ly8gYWRkIGhlYWRlcnMvY29va2llcyBoZXJlLCByYXRoZXIgdGhhbiBpbnNpZGUgYHJlc29sdmVgLCBzbyB0aGF0IHdlXG5cdFx0XHRcdFx0Ly8gY2FuIGRvIGl0IG9uY2UgZm9yIGFsbCByZXNwb25zZXMgaW5zdGVhZCBvZiBvbmNlIHBlciBgcmV0dXJuYFxuXHRcdFx0XHRcdGZvciAoY29uc3Qga2V5IGluIGhlYWRlcnMpIHtcblx0XHRcdFx0XHRcdGNvbnN0IHZhbHVlID0gaGVhZGVyc1trZXldO1xuXHRcdFx0XHRcdFx0cmVzcG9uc2UuaGVhZGVycy5zZXQoa2V5LCAvKiogQHR5cGUge3N0cmluZ30gKi8gKHZhbHVlKSk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0YWRkX2Nvb2tpZXNfdG9faGVhZGVycyhyZXNwb25zZS5oZWFkZXJzLCBPYmplY3QudmFsdWVzKGNvb2tpZXNfdG9fYWRkKSk7XG5cblx0XHRcdFx0XHRpZiAoc3RhdGUucHJlcmVuZGVyaW5nICYmIGV2ZW50LnJvdXRlLmlkICE9PSBudWxsKSB7XG5cdFx0XHRcdFx0XHRyZXNwb25zZS5oZWFkZXJzLnNldCgneC1zdmVsdGVraXQtcm91dGVpZCcsIGVuY29kZVVSSShldmVudC5yb3V0ZS5pZCkpO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHJldHVybiByZXNwb25zZTtcblx0XHRcdFx0fSlcblx0XHR9KTtcblxuXHRcdC8vIHJlc3BvbmQgd2l0aCAzMDQgaWYgZXRhZyBtYXRjaGVzXG5cdFx0aWYgKHJlc3BvbnNlLnN0YXR1cyA9PT0gMjAwICYmIHJlc3BvbnNlLmhlYWRlcnMuaGFzKCdldGFnJykpIHtcblx0XHRcdGxldCBpZl9ub25lX21hdGNoX3ZhbHVlID0gcmVxdWVzdC5oZWFkZXJzLmdldCgnaWYtbm9uZS1tYXRjaCcpO1xuXG5cdFx0XHQvLyBpZ25vcmUgVy8gcHJlZml4IGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0hUVFAvSGVhZGVycy9JZi1Ob25lLU1hdGNoI2RpcmVjdGl2ZXNcblx0XHRcdGlmIChpZl9ub25lX21hdGNoX3ZhbHVlPy5zdGFydHNXaXRoKCdXL1wiJykpIHtcblx0XHRcdFx0aWZfbm9uZV9tYXRjaF92YWx1ZSA9IGlmX25vbmVfbWF0Y2hfdmFsdWUuc3Vic3RyaW5nKDIpO1xuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCBldGFnID0gLyoqIEB0eXBlIHtzdHJpbmd9ICovIChyZXNwb25zZS5oZWFkZXJzLmdldCgnZXRhZycpKTtcblxuXHRcdFx0aWYgKGlmX25vbmVfbWF0Y2hfdmFsdWUgPT09IGV0YWcpIHtcblx0XHRcdFx0Y29uc3QgaGVhZGVycyA9IG5ldyBIZWFkZXJzKHsgZXRhZyB9KTtcblxuXHRcdFx0XHQvLyBodHRwczovL2RhdGF0cmFja2VyLmlldGYub3JnL2RvYy9odG1sL3JmYzcyMzIjc2VjdGlvbi00LjEgKyBzZXQtY29va2llXG5cdFx0XHRcdGZvciAoY29uc3Qga2V5IG9mIFtcblx0XHRcdFx0XHQnY2FjaGUtY29udHJvbCcsXG5cdFx0XHRcdFx0J2NvbnRlbnQtbG9jYXRpb24nLFxuXHRcdFx0XHRcdCdkYXRlJyxcblx0XHRcdFx0XHQnZXhwaXJlcycsXG5cdFx0XHRcdFx0J3ZhcnknLFxuXHRcdFx0XHRcdCdzZXQtY29va2llJ1xuXHRcdFx0XHRdKSB7XG5cdFx0XHRcdFx0Y29uc3QgdmFsdWUgPSByZXNwb25zZS5oZWFkZXJzLmdldChrZXkpO1xuXHRcdFx0XHRcdGlmICh2YWx1ZSkgaGVhZGVycy5zZXQoa2V5LCB2YWx1ZSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRyZXR1cm4gbmV3IFJlc3BvbnNlKHVuZGVmaW5lZCwge1xuXHRcdFx0XHRcdHN0YXR1czogMzA0LFxuXHRcdFx0XHRcdGhlYWRlcnNcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Ly8gRWRnZSBjYXNlOiBJZiB1c2VyIGRvZXMgYHJldHVybiBSZXNwb25zZSgzMHgpYCBpbiBoYW5kbGUgaG9vayB3aGlsZSBwcm9jZXNzaW5nIGEgZGF0YSByZXF1ZXN0LFxuXHRcdC8vIHdlIG5lZWQgdG8gdHJhbnNmb3JtIHRoZSByZWRpcmVjdCByZXNwb25zZSB0byBhIGNvcnJlc3BvbmRpbmcgSlNPTiByZXNwb25zZS5cblx0XHRpZiAoaXNfZGF0YV9yZXF1ZXN0ICYmIHJlc3BvbnNlLnN0YXR1cyA+PSAzMDAgJiYgcmVzcG9uc2Uuc3RhdHVzIDw9IDMwOCkge1xuXHRcdFx0Y29uc3QgbG9jYXRpb24gPSByZXNwb25zZS5oZWFkZXJzLmdldCgnbG9jYXRpb24nKTtcblx0XHRcdGlmIChsb2NhdGlvbikge1xuXHRcdFx0XHRyZXR1cm4gcmVkaXJlY3RfanNvbl9yZXNwb25zZShuZXcgUmVkaXJlY3QoLyoqIEB0eXBlIHthbnl9ICovIChyZXNwb25zZS5zdGF0dXMpLCBsb2NhdGlvbikpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiByZXNwb25zZTtcblx0fSBjYXRjaCAoZSkge1xuXHRcdGlmIChlIGluc3RhbmNlb2YgUmVkaXJlY3QpIHtcblx0XHRcdGNvbnN0IHJlc3BvbnNlID0gaXNfZGF0YV9yZXF1ZXN0XG5cdFx0XHRcdD8gcmVkaXJlY3RfanNvbl9yZXNwb25zZShlKVxuXHRcdFx0XHQ6IHJvdXRlPy5wYWdlICYmIGlzX2FjdGlvbl9qc29uX3JlcXVlc3QoZXZlbnQpXG5cdFx0XHRcdFx0PyBhY3Rpb25fanNvbl9yZWRpcmVjdChlKVxuXHRcdFx0XHRcdDogcmVkaXJlY3RfcmVzcG9uc2UoZS5zdGF0dXMsIGUubG9jYXRpb24pO1xuXHRcdFx0YWRkX2Nvb2tpZXNfdG9faGVhZGVycyhyZXNwb25zZS5oZWFkZXJzLCBPYmplY3QudmFsdWVzKGNvb2tpZXNfdG9fYWRkKSk7XG5cdFx0XHRyZXR1cm4gcmVzcG9uc2U7XG5cdFx0fVxuXHRcdHJldHVybiBhd2FpdCBoYW5kbGVfZmF0YWxfZXJyb3IoZXZlbnQsIG9wdGlvbnMsIGUpO1xuXHR9XG5cblx0LyoqXG5cdCAqIEBwYXJhbSB7aW1wb3J0KCdAc3ZlbHRlanMva2l0JykuUmVxdWVzdEV2ZW50fSBldmVudFxuXHQgKiBAcGFyYW0ge2ltcG9ydCgnQHN2ZWx0ZWpzL2tpdCcpLlJlc29sdmVPcHRpb25zfSBbb3B0c11cblx0ICovXG5cdGFzeW5jIGZ1bmN0aW9uIHJlc29sdmUoZXZlbnQsIG9wdHMpIHtcblx0XHR0cnkge1xuXHRcdFx0aWYgKG9wdHMpIHtcblx0XHRcdFx0cmVzb2x2ZV9vcHRzID0ge1xuXHRcdFx0XHRcdHRyYW5zZm9ybVBhZ2VDaHVuazogb3B0cy50cmFuc2Zvcm1QYWdlQ2h1bmsgfHwgZGVmYXVsdF90cmFuc2Zvcm0sXG5cdFx0XHRcdFx0ZmlsdGVyU2VyaWFsaXplZFJlc3BvbnNlSGVhZGVyczogb3B0cy5maWx0ZXJTZXJpYWxpemVkUmVzcG9uc2VIZWFkZXJzIHx8IGRlZmF1bHRfZmlsdGVyLFxuXHRcdFx0XHRcdHByZWxvYWQ6IG9wdHMucHJlbG9hZCB8fCBkZWZhdWx0X3ByZWxvYWRcblx0XHRcdFx0fTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKHN0YXRlLnByZXJlbmRlcmluZz8uZmFsbGJhY2spIHtcblx0XHRcdFx0cmV0dXJuIGF3YWl0IHJlbmRlcl9yZXNwb25zZSh7XG5cdFx0XHRcdFx0ZXZlbnQsXG5cdFx0XHRcdFx0b3B0aW9ucyxcblx0XHRcdFx0XHRtYW5pZmVzdCxcblx0XHRcdFx0XHRzdGF0ZSxcblx0XHRcdFx0XHRwYWdlX2NvbmZpZzogeyBzc3I6IGZhbHNlLCBjc3I6IHRydWUgfSxcblx0XHRcdFx0XHRzdGF0dXM6IDIwMCxcblx0XHRcdFx0XHRlcnJvcjogbnVsbCxcblx0XHRcdFx0XHRicmFuY2g6IFtdLFxuXHRcdFx0XHRcdGZldGNoZWQ6IFtdLFxuXHRcdFx0XHRcdHJlc29sdmVfb3B0c1xuXHRcdFx0XHR9KTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKHJvdXRlKSB7XG5cdFx0XHRcdGNvbnN0IG1ldGhvZCA9IC8qKiBAdHlwZSB7aW1wb3J0KCd0eXBlcycpLkh0dHBNZXRob2R9ICovIChldmVudC5yZXF1ZXN0Lm1ldGhvZCk7XG5cblx0XHRcdFx0LyoqIEB0eXBlIHtSZXNwb25zZX0gKi9cblx0XHRcdFx0bGV0IHJlc3BvbnNlO1xuXG5cdFx0XHRcdGlmIChpc19kYXRhX3JlcXVlc3QpIHtcblx0XHRcdFx0XHRyZXNwb25zZSA9IGF3YWl0IHJlbmRlcl9kYXRhKFxuXHRcdFx0XHRcdFx0ZXZlbnQsXG5cdFx0XHRcdFx0XHRyb3V0ZSxcblx0XHRcdFx0XHRcdG9wdGlvbnMsXG5cdFx0XHRcdFx0XHRtYW5pZmVzdCxcblx0XHRcdFx0XHRcdHN0YXRlLFxuXHRcdFx0XHRcdFx0aW52YWxpZGF0ZWRfZGF0YV9ub2Rlcyxcblx0XHRcdFx0XHRcdHRyYWlsaW5nX3NsYXNoID8/ICduZXZlcidcblx0XHRcdFx0XHQpO1xuXHRcdFx0XHR9IGVsc2UgaWYgKHJvdXRlLmVuZHBvaW50ICYmICghcm91dGUucGFnZSB8fCBpc19lbmRwb2ludF9yZXF1ZXN0KGV2ZW50KSkpIHtcblx0XHRcdFx0XHRyZXNwb25zZSA9IGF3YWl0IHJlbmRlcl9lbmRwb2ludChldmVudCwgYXdhaXQgcm91dGUuZW5kcG9pbnQoKSwgc3RhdGUpO1xuXHRcdFx0XHR9IGVsc2UgaWYgKHJvdXRlLnBhZ2UpIHtcblx0XHRcdFx0XHRpZiAocGFnZV9tZXRob2RzLmhhcyhtZXRob2QpKSB7XG5cdFx0XHRcdFx0XHRyZXNwb25zZSA9IGF3YWl0IHJlbmRlcl9wYWdlKGV2ZW50LCByb3V0ZS5wYWdlLCBvcHRpb25zLCBtYW5pZmVzdCwgc3RhdGUsIHJlc29sdmVfb3B0cyk7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGNvbnN0IGFsbG93ZWRfbWV0aG9kcyA9IG5ldyBTZXQoYWxsb3dlZF9wYWdlX21ldGhvZHMpO1xuXHRcdFx0XHRcdFx0Y29uc3Qgbm9kZSA9IGF3YWl0IG1hbmlmZXN0Ll8ubm9kZXNbcm91dGUucGFnZS5sZWFmXSgpO1xuXHRcdFx0XHRcdFx0aWYgKG5vZGU/LnNlcnZlcj8uYWN0aW9ucykge1xuXHRcdFx0XHRcdFx0XHRhbGxvd2VkX21ldGhvZHMuYWRkKCdQT1NUJyk7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdGlmIChtZXRob2QgPT09ICdPUFRJT05TJykge1xuXHRcdFx0XHRcdFx0XHQvLyBUaGlzIHdpbGwgZGVueSBDT1JTIHByZWZsaWdodCByZXF1ZXN0cyBpbXBsaWNpdGx5IGJlY2F1c2Ugd2UgZG9uJ3Rcblx0XHRcdFx0XHRcdFx0Ly8gYWRkIHRoZSByZXF1aXJlZCBDT1JTIGhlYWRlcnMgdG8gdGhlIHJlc3BvbnNlLlxuXHRcdFx0XHRcdFx0XHRyZXNwb25zZSA9IG5ldyBSZXNwb25zZShudWxsLCB7XG5cdFx0XHRcdFx0XHRcdFx0c3RhdHVzOiAyMDQsXG5cdFx0XHRcdFx0XHRcdFx0aGVhZGVyczoge1xuXHRcdFx0XHRcdFx0XHRcdFx0YWxsb3c6IEFycmF5LmZyb20oYWxsb3dlZF9tZXRob2RzLnZhbHVlcygpKS5qb2luKCcsICcpXG5cdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdGNvbnN0IG1vZCA9IFsuLi5hbGxvd2VkX21ldGhvZHNdLnJlZHVjZSgoYWNjLCBjdXJyKSA9PiB7XG5cdFx0XHRcdFx0XHRcdFx0YWNjW2N1cnJdID0gdHJ1ZTtcblx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gYWNjO1xuXHRcdFx0XHRcdFx0XHR9LCAvKiogQHR5cGUge1JlY29yZDxzdHJpbmcsIGFueT59ICovICh7fSkpO1xuXHRcdFx0XHRcdFx0XHRyZXNwb25zZSA9IG1ldGhvZF9ub3RfYWxsb3dlZChtb2QsIG1ldGhvZCk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdC8vIGEgcm91dGUgd2lsbCBhbHdheXMgaGF2ZSBhIHBhZ2Ugb3IgYW4gZW5kcG9pbnQsIGJ1dCBUeXBlU2NyaXB0XG5cdFx0XHRcdFx0Ly8gZG9lc24ndCBrbm93IHRoYXRcblx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ1RoaXMgc2hvdWxkIG5ldmVyIGhhcHBlbicpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gSWYgdGhlIHJvdXRlIGNvbnRhaW5zIGEgcGFnZSBhbmQgYW4gZW5kcG9pbnQsIHdlIG5lZWQgdG8gYWRkIGFcblx0XHRcdFx0Ly8gYFZhcnk6IEFjY2VwdGAgaGVhZGVyIHRvIHRoZSByZXNwb25zZSBiZWNhdXNlIG9mIGJyb3dzZXIgY2FjaGluZ1xuXHRcdFx0XHRpZiAocmVxdWVzdC5tZXRob2QgPT09ICdHRVQnICYmIHJvdXRlLnBhZ2UgJiYgcm91dGUuZW5kcG9pbnQpIHtcblx0XHRcdFx0XHRjb25zdCB2YXJ5ID0gcmVzcG9uc2UuaGVhZGVyc1xuXHRcdFx0XHRcdFx0LmdldCgndmFyeScpXG5cdFx0XHRcdFx0XHQ/LnNwbGl0KCcsJylcblx0XHRcdFx0XHRcdD8ubWFwKCh2KSA9PiB2LnRyaW0oKS50b0xvd2VyQ2FzZSgpKTtcblx0XHRcdFx0XHRpZiAoISh2YXJ5Py5pbmNsdWRlcygnYWNjZXB0JykgfHwgdmFyeT8uaW5jbHVkZXMoJyonKSkpIHtcblx0XHRcdFx0XHRcdC8vIHRoZSByZXR1cm5lZCByZXNwb25zZSBtaWdodCBoYXZlIGltbXV0YWJsZSBoZWFkZXJzLFxuXHRcdFx0XHRcdFx0Ly8gc28gd2UgaGF2ZSB0byBjbG9uZSB0aGVtIGJlZm9yZSB0cnlpbmcgdG8gbXV0YXRlIHRoZW1cblx0XHRcdFx0XHRcdHJlc3BvbnNlID0gbmV3IFJlc3BvbnNlKHJlc3BvbnNlLmJvZHksIHtcblx0XHRcdFx0XHRcdFx0c3RhdHVzOiByZXNwb25zZS5zdGF0dXMsXG5cdFx0XHRcdFx0XHRcdHN0YXR1c1RleHQ6IHJlc3BvbnNlLnN0YXR1c1RleHQsXG5cdFx0XHRcdFx0XHRcdGhlYWRlcnM6IG5ldyBIZWFkZXJzKHJlc3BvbnNlLmhlYWRlcnMpXG5cdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdHJlc3BvbnNlLmhlYWRlcnMuYXBwZW5kKCdWYXJ5JywgJ0FjY2VwdCcpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdHJldHVybiByZXNwb25zZTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKHN0YXRlLmVycm9yICYmIGV2ZW50LmlzU3ViUmVxdWVzdCkge1xuXHRcdFx0XHRyZXR1cm4gYXdhaXQgZmV0Y2gocmVxdWVzdCwge1xuXHRcdFx0XHRcdGhlYWRlcnM6IHtcblx0XHRcdFx0XHRcdCd4LXN2ZWx0ZWtpdC1lcnJvcic6ICd0cnVlJ1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChzdGF0ZS5lcnJvcikge1xuXHRcdFx0XHRyZXR1cm4gdGV4dCgnSW50ZXJuYWwgU2VydmVyIEVycm9yJywge1xuXHRcdFx0XHRcdHN0YXR1czogNTAwXG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBpZiB0aGlzIHJlcXVlc3QgY2FtZSBkaXJlY3QgZnJvbSB0aGUgdXNlciwgcmF0aGVyIHRoYW5cblx0XHRcdC8vIHZpYSBvdXIgb3duIGBmZXRjaGAsIHJlbmRlciBhIDQwNCBwYWdlXG5cdFx0XHRpZiAoc3RhdGUuZGVwdGggPT09IDApIHtcblx0XHRcdFx0cmV0dXJuIGF3YWl0IHJlc3BvbmRfd2l0aF9lcnJvcih7XG5cdFx0XHRcdFx0ZXZlbnQsXG5cdFx0XHRcdFx0b3B0aW9ucyxcblx0XHRcdFx0XHRtYW5pZmVzdCxcblx0XHRcdFx0XHRzdGF0ZSxcblx0XHRcdFx0XHRzdGF0dXM6IDQwNCxcblx0XHRcdFx0XHRlcnJvcjogbmV3IFN2ZWx0ZUtpdEVycm9yKDQwNCwgJ05vdCBGb3VuZCcsIGBOb3QgZm91bmQ6ICR7ZXZlbnQudXJsLnBhdGhuYW1lfWApLFxuXHRcdFx0XHRcdHJlc29sdmVfb3B0c1xuXHRcdFx0XHR9KTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKHN0YXRlLnByZXJlbmRlcmluZykge1xuXHRcdFx0XHRyZXR1cm4gdGV4dCgnbm90IGZvdW5kJywgeyBzdGF0dXM6IDQwNCB9KTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gd2UgY2FuJ3QgbG9hZCB0aGUgZW5kcG9pbnQgZnJvbSBvdXIgb3duIG1hbmlmZXN0LFxuXHRcdFx0Ly8gc28gd2UgbmVlZCB0byBtYWtlIGFuIGFjdHVhbCBIVFRQIHJlcXVlc3Rcblx0XHRcdHJldHVybiBhd2FpdCBmZXRjaChyZXF1ZXN0KTtcblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHQvLyBUT0RPIGlmIGBlYCBpcyBpbnN0ZWFkIG5hbWVkIGBlcnJvcmAsIHNvbWUgZnVja2VkIHVwIFZpdGUgdHJhbnNmb3JtYXRpb24gaGFwcGVuc1xuXHRcdFx0Ly8gYW5kIEkgZG9uJ3QgZXZlbiBrbm93IGhvdyB0byBkZXNjcmliZSBpdC4gbmVlZCB0byBpbnZlc3RpZ2F0ZSBhdCBzb21lIHBvaW50XG5cblx0XHRcdC8vIEh0dHBFcnJvciBmcm9tIGVuZHBvaW50IGNhbiBlbmQgdXAgaGVyZSAtIFRPRE8gc2hvdWxkIGl0IGJlIGhhbmRsZWQgdGhlcmUgaW5zdGVhZD9cblx0XHRcdHJldHVybiBhd2FpdCBoYW5kbGVfZmF0YWxfZXJyb3IoZXZlbnQsIG9wdGlvbnMsIGUpO1xuXHRcdH0gZmluYWxseSB7XG5cdFx0XHRldmVudC5jb29raWVzLnNldCA9ICgpID0+IHtcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgdXNlIGBjb29raWVzLnNldCguLi4pYCBhZnRlciB0aGUgcmVzcG9uc2UgaGFzIGJlZW4gZ2VuZXJhdGVkJyk7XG5cdFx0XHR9O1xuXG5cdFx0XHRldmVudC5zZXRIZWFkZXJzID0gKCkgPT4ge1xuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCB1c2UgYHNldEhlYWRlcnMoLi4uKWAgYWZ0ZXIgdGhlIHJlc3BvbnNlIGhhcyBiZWVuIGdlbmVyYXRlZCcpO1xuXHRcdFx0fTtcblx0XHR9XG5cdH1cbn1cbiIsIi8qKlxuICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+fSBlbnZcbiAqIEBwYXJhbSB7e1xuICogXHRcdHB1YmxpY19wcmVmaXg6IHN0cmluZztcbiAqIFx0XHRwcml2YXRlX3ByZWZpeDogc3RyaW5nO1xuICogfX0gcHJlZml4ZXNcbiAqIEByZXR1cm5zIHtSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+fVxuICovXG5leHBvcnQgZnVuY3Rpb24gZmlsdGVyX3ByaXZhdGVfZW52KGVudiwgeyBwdWJsaWNfcHJlZml4LCBwcml2YXRlX3ByZWZpeCB9KSB7XG5cdHJldHVybiBPYmplY3QuZnJvbUVudHJpZXMoXG5cdFx0T2JqZWN0LmVudHJpZXMoZW52KS5maWx0ZXIoXG5cdFx0XHQoW2tdKSA9PlxuXHRcdFx0XHRrLnN0YXJ0c1dpdGgocHJpdmF0ZV9wcmVmaXgpICYmIChwdWJsaWNfcHJlZml4ID09PSAnJyB8fCAhay5zdGFydHNXaXRoKHB1YmxpY19wcmVmaXgpKVxuXHRcdClcblx0KTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIHN0cmluZz59IGVudlxuICogQHBhcmFtIHt7XG4gKiBcdFx0cHVibGljX3ByZWZpeDogc3RyaW5nO1xuICogICAgcHJpdmF0ZV9wcmVmaXg6IHN0cmluZztcbiAqIH19IHByZWZpeGVzXG4gKiBAcmV0dXJucyB7UmVjb3JkPHN0cmluZywgc3RyaW5nPn1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZpbHRlcl9wdWJsaWNfZW52KGVudiwgeyBwdWJsaWNfcHJlZml4LCBwcml2YXRlX3ByZWZpeCB9KSB7XG5cdHJldHVybiBPYmplY3QuZnJvbUVudHJpZXMoXG5cdFx0T2JqZWN0LmVudHJpZXMoZW52KS5maWx0ZXIoXG5cdFx0XHQoW2tdKSA9PlxuXHRcdFx0XHRrLnN0YXJ0c1dpdGgocHVibGljX3ByZWZpeCkgJiYgKHByaXZhdGVfcHJlZml4ID09PSAnJyB8fCAhay5zdGFydHNXaXRoKHByaXZhdGVfcHJlZml4KSlcblx0XHQpXG5cdCk7XG59XG4iLCJpbXBvcnQgeyByZXNwb25kIH0gZnJvbSAnLi9yZXNwb25kLmpzJztcbmltcG9ydCB7IHNldF9wcml2YXRlX2Vudiwgc2V0X3B1YmxpY19lbnYsIHNldF9zYWZlX3B1YmxpY19lbnYgfSBmcm9tICcuLi9zaGFyZWQtc2VydmVyLmpzJztcbmltcG9ydCB7IG9wdGlvbnMsIGdldF9ob29rcyB9IGZyb20gJ19fU0VSVkVSX18vaW50ZXJuYWwuanMnO1xuaW1wb3J0IHsgREVWIH0gZnJvbSAnZXNtLWVudic7XG5pbXBvcnQgeyBmaWx0ZXJfcHJpdmF0ZV9lbnYsIGZpbHRlcl9wdWJsaWNfZW52IH0gZnJvbSAnLi4vLi4vdXRpbHMvZW52LmpzJztcbmltcG9ydCB7IHByZXJlbmRlcmluZyB9IGZyb20gJ19fc3ZlbHRla2l0L2Vudmlyb25tZW50JztcbmltcG9ydCB7IHNldF9yZWFkX2ltcGxlbWVudGF0aW9uLCBzZXRfbWFuaWZlc3QgfSBmcm9tICdfX3N2ZWx0ZWtpdC9zZXJ2ZXInO1xuXG4vKiogQHR5cGUge1Byb3h5SGFuZGxlcjx7IHR5cGU6ICdwdWJsaWMnIHwgJ3ByaXZhdGUnIH0+fSAqL1xuY29uc3QgcHJlcmVuZGVyX2Vudl9oYW5kbGVyID0ge1xuXHRnZXQoeyB0eXBlIH0sIHByb3ApIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoXG5cdFx0XHRgQ2Fubm90IHJlYWQgdmFsdWVzIGZyb20gJGVudi9keW5hbWljLyR7dHlwZX0gd2hpbGUgcHJlcmVuZGVyaW5nIChhdHRlbXB0ZWQgdG8gcmVhZCBlbnYuJHtwcm9wLnRvU3RyaW5nKCl9KS4gVXNlICRlbnYvc3RhdGljLyR7dHlwZX0gaW5zdGVhZGBcblx0XHQpO1xuXHR9XG59O1xuXG5leHBvcnQgY2xhc3MgU2VydmVyIHtcblx0LyoqIEB0eXBlIHtpbXBvcnQoJ3R5cGVzJykuU1NST3B0aW9uc30gKi9cblx0I29wdGlvbnM7XG5cblx0LyoqIEB0eXBlIHtpbXBvcnQoJ0BzdmVsdGVqcy9raXQnKS5TU1JNYW5pZmVzdH0gKi9cblx0I21hbmlmZXN0O1xuXG5cdC8qKiBAcGFyYW0ge2ltcG9ydCgnQHN2ZWx0ZWpzL2tpdCcpLlNTUk1hbmlmZXN0fSBtYW5pZmVzdCAqL1xuXHRjb25zdHJ1Y3RvcihtYW5pZmVzdCkge1xuXHRcdC8qKiBAdHlwZSB7aW1wb3J0KCd0eXBlcycpLlNTUk9wdGlvbnN9ICovXG5cdFx0dGhpcy4jb3B0aW9ucyA9IG9wdGlvbnM7XG5cdFx0dGhpcy4jbWFuaWZlc3QgPSBtYW5pZmVzdDtcblxuXHRcdHNldF9tYW5pZmVzdChtYW5pZmVzdCk7XG5cdH1cblxuXHQvKipcblx0ICogQHBhcmFtIHt7XG5cdCAqICAgZW52OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xuXHQgKiAgIHJlYWQ/OiAoZmlsZTogc3RyaW5nKSA9PiBSZWFkYWJsZVN0cmVhbTtcblx0ICogfX0gb3B0c1xuXHQgKi9cblx0YXN5bmMgaW5pdCh7IGVudiwgcmVhZCB9KSB7XG5cdFx0Ly8gVGFrZSBjYXJlOiBTb21lIGFkYXB0ZXJzIG1heSBoYXZlIHRvIGNhbGwgYFNlcnZlci5pbml0YCBwZXItcmVxdWVzdCB0byBzZXQgZW52IHZhcnMsXG5cdFx0Ly8gc28gYW55dGhpbmcgdGhhdCBzaG91bGRuJ3QgYmUgcmVydW4gc2hvdWxkIGJlIHdyYXBwZWQgaW4gYW4gYGlmYCBibG9jayB0byBtYWtlIHN1cmUgaXQgaGFzbid0XG5cdFx0Ly8gYmVlbiBkb25lIGFscmVhZHkuXG5cblx0XHQvLyBzZXQgZW52LCBpbiBjYXNlIGl0J3MgdXNlZCBpbiBpbml0aWFsaXNhdGlvblxuXHRcdGNvbnN0IHByZWZpeGVzID0ge1xuXHRcdFx0cHVibGljX3ByZWZpeDogdGhpcy4jb3B0aW9ucy5lbnZfcHVibGljX3ByZWZpeCxcblx0XHRcdHByaXZhdGVfcHJlZml4OiB0aGlzLiNvcHRpb25zLmVudl9wcml2YXRlX3ByZWZpeFxuXHRcdH07XG5cblx0XHRjb25zdCBwcml2YXRlX2VudiA9IGZpbHRlcl9wcml2YXRlX2VudihlbnYsIHByZWZpeGVzKTtcblx0XHRjb25zdCBwdWJsaWNfZW52ID0gZmlsdGVyX3B1YmxpY19lbnYoZW52LCBwcmVmaXhlcyk7XG5cblx0XHRzZXRfcHJpdmF0ZV9lbnYoXG5cdFx0XHRwcmVyZW5kZXJpbmcgPyBuZXcgUHJveHkoeyB0eXBlOiAncHJpdmF0ZScgfSwgcHJlcmVuZGVyX2Vudl9oYW5kbGVyKSA6IHByaXZhdGVfZW52XG5cdFx0KTtcblx0XHRzZXRfcHVibGljX2Vudihcblx0XHRcdHByZXJlbmRlcmluZyA/IG5ldyBQcm94eSh7IHR5cGU6ICdwdWJsaWMnIH0sIHByZXJlbmRlcl9lbnZfaGFuZGxlcikgOiBwdWJsaWNfZW52XG5cdFx0KTtcblx0XHRzZXRfc2FmZV9wdWJsaWNfZW52KHB1YmxpY19lbnYpO1xuXG5cdFx0aWYgKHJlYWQpIHtcblx0XHRcdHNldF9yZWFkX2ltcGxlbWVudGF0aW9uKHJlYWQpO1xuXHRcdH1cblxuXHRcdGlmICghdGhpcy4jb3B0aW9ucy5ob29rcykge1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0Y29uc3QgbW9kdWxlID0gYXdhaXQgZ2V0X2hvb2tzKCk7XG5cblx0XHRcdFx0dGhpcy4jb3B0aW9ucy5ob29rcyA9IHtcblx0XHRcdFx0XHRoYW5kbGU6IG1vZHVsZS5oYW5kbGUgfHwgKCh7IGV2ZW50LCByZXNvbHZlIH0pID0+IHJlc29sdmUoZXZlbnQpKSxcblx0XHRcdFx0XHRoYW5kbGVFcnJvcjogbW9kdWxlLmhhbmRsZUVycm9yIHx8ICgoeyBlcnJvciB9KSA9PiBjb25zb2xlLmVycm9yKGVycm9yKSksXG5cdFx0XHRcdFx0aGFuZGxlRmV0Y2g6IG1vZHVsZS5oYW5kbGVGZXRjaCB8fCAoKHsgcmVxdWVzdCwgZmV0Y2ggfSkgPT4gZmV0Y2gocmVxdWVzdCkpLFxuXHRcdFx0XHRcdHJlcm91dGU6IG1vZHVsZS5yZXJvdXRlIHx8ICgoKSA9PiB7fSlcblx0XHRcdFx0fTtcblx0XHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHRcdGlmIChERVYpIHtcblx0XHRcdFx0XHR0aGlzLiNvcHRpb25zLmhvb2tzID0ge1xuXHRcdFx0XHRcdFx0aGFuZGxlOiAoKSA9PiB7XG5cdFx0XHRcdFx0XHRcdHRocm93IGVycm9yO1xuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdGhhbmRsZUVycm9yOiAoeyBlcnJvciB9KSA9PiBjb25zb2xlLmVycm9yKGVycm9yKSxcblx0XHRcdFx0XHRcdGhhbmRsZUZldGNoOiAoeyByZXF1ZXN0LCBmZXRjaCB9KSA9PiBmZXRjaChyZXF1ZXN0KSxcblx0XHRcdFx0XHRcdHJlcm91dGU6ICgpID0+IHt9XG5cdFx0XHRcdFx0fTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR0aHJvdyBlcnJvcjtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBAcGFyYW0ge1JlcXVlc3R9IHJlcXVlc3Rcblx0ICogQHBhcmFtIHtpbXBvcnQoJ3R5cGVzJykuUmVxdWVzdE9wdGlvbnN9IG9wdGlvbnNcblx0ICovXG5cdGFzeW5jIHJlc3BvbmQocmVxdWVzdCwgb3B0aW9ucykge1xuXHRcdHJldHVybiByZXNwb25kKHJlcXVlc3QsIHRoaXMuI29wdGlvbnMsIHRoaXMuI21hbmlmZXN0LCB7XG5cdFx0XHQuLi5vcHRpb25zLFxuXHRcdFx0ZXJyb3I6IGZhbHNlLFxuXHRcdFx0ZGVwdGg6IDBcblx0XHR9KTtcblx0fVxufVxuIl0sIm5hbWVzIjpbImJvZHkiLCJ0ZXh0IiwiaW5pdCIsImhlYWRlcnMiLCJlbmNvZGVyIiwib3B0aW9ucyIsImtleSIsInJlc3BvbnNlIiwiaGFzaCIsInByZXJlbmRlcmluZyIsImFycmF5IiwiaSIsInZhbHVlIiwiYmFzZSIsInBhdGhzLmJhc2UiLCJhc3NldHMiLCJwYXRocy5hc3NldHMiLCJkYXRhIiwicGF0aHMub3ZlcnJpZGUiLCJwYXRocy5yZXNldCIsImpzb24iLCJzdGF0dXMiLCJub2RlIiwicyIsImNvb2tpZXMiLCJoZWFkZXIiLCJpbmZvIiwiZXZlbnQiLCJyZXNvbHZlIiwiZXRhZyIsImFsbG93ZWRfbWV0aG9kcyIsInB1YmxpY19lbnYiLCJmZXRjaCJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQ08sTUFBTSxNQUFNO0FDR1osTUFBTSxvQkFBb0I7QUFJMUIsTUFBTSxtQkFBbUIsQ0FBQyxPQUFPLFFBQVEsT0FBTyxTQUFTLFVBQVUsV0FBVyxNQUFNO0FBRXBGLE1BQU0sZUFBZSxDQUFDLE9BQU8sUUFBUSxNQUFNO0FDSjNDLFNBQVMsVUFBVSxRQUFRLE9BQU87QUFFeEMsUUFBTSxRQUFRLENBQUE7QUFFZCxTQUFPLE1BQU0sR0FBRyxFQUFFLFFBQVEsQ0FBQyxLQUFLLE1BQU07QUFDckMsVUFBTSxRQUFRLG9DQUFvQyxLQUFLLEdBQUc7QUFHMUQsUUFBSSxPQUFPO0FBQ1YsWUFBTSxDQUFBLEVBQUcsTUFBTSxTQUFTLElBQUksR0FBRyxJQUFJO0FBQ25DLFlBQU0sS0FBSyxFQUFFLE1BQU0sU0FBUyxHQUFHLENBQUMsR0FBRyxFQUFDLENBQUU7QUFBQSxJQUN0QztBQUFBLEVBQ0gsQ0FBRTtBQUVELFFBQU0s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QUFFckIsU0FBSyxXQUFXO0FBQ2hCLFNBQUssWUFBWTtBQUFBLEVBR2pCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFRRCxNQUFNLEtBQUssRUFBRSxLQUFLLFFBQVE7QUFNekIsVUFBTSxXQUFXO0FBQUEsTUFDaEIsZUFBZSxLQUFLLFNBQVM7QUFBQSxNQUM3QixnQkFBZ0IsS0FBSyxTQUFTO0FBQUEsSUFDakM7QUFFRSxVQUFNLGNBQWMsbUJBQW1CLEtBQUssUUFBUTtBQUNwRCxVQUFNSSxjQUFhLGtCQUFrQixLQUFLLFFBQVE7QUFFbEQ7QUFBQSxNQUNDLGVBQWUsSUFBSSxNQUFNLEVBQUUsTUFBTSxVQUFXLEdBQUUscUJBQXFCLElBQUk7QUFBQSxJQUMxRTtBQUNFO0FBQUEsTUFDQyxlQUFlLElBQUksTUFBTSxFQUFFLE1BQU0sU0FBVSxHQUFFLHFCQUFxQixJQUFJQTtBQUFBLElBQ3pFO0FBQ0Usd0JBQW9CQSxXQUFVO0FBTTlCLFFBQUksQ0FBQyxLQUFLLFNBQVMsT0FBTztBQUN6QixVQUFJO0FBQ0gsY0FBTSxTQUFTLE1BQU07QUFFckIsYUFBSyxTQUFTLFFBQVE7QUFBQSxVQUNyQixRQUFRLE9BQU8sV0FBVyxDQUFDLEVBQUUsT0FBTyxTQUFBSCxTQUFTLE1BQUtBLFNBQVEsS0FBSztBQUFBLFVBQy9ELGFBQWEsT0FBTyxnQkFBZ0IsQ0FBQyxFQUFFLE1BQUssTUFBTyxRQUFRLE1BQU0sS0FBSztBQUFBLFVBQ3RFLGFBQWEsT0FBTyxnQkFBZ0IsQ0FBQyxFQUFFLFNBQVMsT0FBQUksT0FBTyxNQUFLQSxPQUFNLE9BQU87QUFBQSxVQUN6RSxTQUFTLE9BQU8sWUFBWSxNQUFNO0FBQUE7UUFDdkM7QUFBQSxNQUNJLFNBQVEsT0FBTztBQVVSO0FBQ04sZ0JBQU07QUFBQSxRQUNOO0FBQUEsTUFDRDtBQUFBLElBQ0Q7QUFBQSxFQUNEO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1ELE1BQU0sUUFBUSxTQUFTM0IsVUFBUztBQUMvQixXQUFPLFFBQVEsU0FBUyxLQUFLLFVBQVUsS0FBSyxXQUFXO0FBQUEsTUFDdEQsR0FBR0E7QUFBQSxNQUNILE9BQU87QUFBQSxNQUNQLE9BQU87QUFBQSxJQUNWLENBQUc7QUFBQSxFQUNEO0FBQ0Y7IiwieF9nb29nbGVfaWdub3JlTGlzdCI6WzAsMSwyLDMsNCw1LDYsNyw4LDksMTAsMTEsMTIsMTMsMTQsMTUsMTYsMTcsMTgsMTksMjAsMjEsMjIsMjMsMjQsMjUsMjYsMjcsMjgsMjksMzAsMzEsMzIsMzMsMzQsMzVdfQ==

import { createServer } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";

const APP_NAME = "BetterGeometry";
const APP_VERSION = "V0.0.1.2";
const MCP_PATH = "/mcp";
const HEALTH_PATH = "/health";
const WIDGET_URI = "ui://widget/bettergeometry.html";
const ROOT_DIR = resolve(process.cwd());
const DIST_DIR = join(ROOT_DIR, "dist");
const widgetHtml = readFileSync(join(ROOT_DIR, "public", "bettergeometry-widget.html"), "utf8");

const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".ico", "image/x-icon"],
]);

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type, accept, mcp-session-id, mcp-protocol-version",
    "Access-Control-Expose-Headers": "Mcp-Session-Id, MCP-Protocol-Version",
  };
}

function sendText(res, status, text, extraHeaders = {}) {
  res.writeHead(status, {
    "content-type": "text/plain; charset=utf-8",
    ...extraHeaders,
  });
  res.end(text);
}

function sendJson(res, status, value, extraHeaders = {}) {
  const body = JSON.stringify(value);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body),
    "MCP-Protocol-Version": "2025-06-18",
    ...corsHeaders(),
    ...extraHeaders,
  });
  res.end(body);
}

function readJsonBody(req) {
  return new Promise((resolveBody, rejectBody) => {
    let body = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        rejectBody(new Error("Request body too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!body.trim()) {
        resolveBody(null);
        return;
      }
      try {
        resolveBody(JSON.parse(body));
      } catch (error) {
        rejectBody(error);
      }
    });
    req.on("error", rejectBody);
  });
}

function jsonRpcResult(id, result) {
  return { jsonrpc: "2.0", id, result };
}

function jsonRpcError(id, code, message) {
  return { jsonrpc: "2.0", id: id ?? null, error: { code, message } };
}

function initializeResult() {
  return {
    protocolVersion: "2025-06-18",
    capabilities: {
      tools: {},
      resources: {},
    },
    serverInfo: {
      name: "bettergeometry",
      version: APP_VERSION,
    },
  };
}

function toolDescriptor() {
  return {
    name: "show_bettergeometry",
    title: "Show BetterGeometry",
    description: "Open the BetterGeometry ChatGPT app shell for testing.",
    inputSchema: {
      type: "object",
      properties: {
        message: {
          type: "string",
          description: "Optional note to display in the text response.",
        },
      },
      additionalProperties: false,
    },
    outputSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        version: { type: "string" },
        message: { type: "string" },
      },
      required: ["name", "version", "message"],
      additionalProperties: false,
    },
    annotations: {
      readOnlyHint: true,
    },
    _meta: {
      "openai/outputTemplate": WIDGET_URI,
      "openai/toolInvocation/invoking": "Opening BetterGeometry…",
      "openai/toolInvocation/invoked": "BetterGeometry opened",
    },
  };
}

function widgetResource() {
  return {
    uri: WIDGET_URI,
    name: "BetterGeometry widget",
    description: "The BetterGeometry ChatGPT app shell.",
    mimeType: "text/html+skybridge",
  };
}

function widgetContents() {
  return {
    uri: WIDGET_URI,
    mimeType: "text/html+skybridge",
    text: widgetHtml,
    _meta: {
      "openai/widgetDescription": "BetterGeometry test harness. Geometry rendering comes next.",
      "openai/widgetPrefersBorder": true,
      "openai/widgetCSP": {
        connect_domains: [],
        resource_domains: [],
      },
    },
  };
}

function callShowBetterGeometry(params = {}) {
  const rawMessage = params?.arguments?.message;
  const message = typeof rawMessage === "string" && rawMessage.trim()
    ? rawMessage.trim()
    : "ChatGPT app shell is connected.";

  return {
    content: [
      {
        type: "text",
        text: `${APP_NAME} ${APP_VERSION}: ${message}`,
      },
    ],
    structuredContent: {
      name: APP_NAME,
      version: APP_VERSION,
      message,
    },
    _meta: {
      appVersion: APP_VERSION,
    },
  };
}

function handleMcpMessage(message) {
  const id = message?.id;
  const method = message?.method;

  switch (method) {
    case "initialize":
      return jsonRpcResult(id, initializeResult());
    case "ping":
      return jsonRpcResult(id, {});
    case "tools/list":
      return jsonRpcResult(id, { tools: [toolDescriptor()] });
    case "tools/call": {
      const toolName = message?.params?.name;
      if (toolName !== "show_bettergeometry") {
        return jsonRpcError(id, -32602, `Unknown tool: ${toolName}`);
      }
      return jsonRpcResult(id, callShowBetterGeometry(message.params));
    }
    case "resources/list":
      return jsonRpcResult(id, { resources: [widgetResource()] });
    case "resources/read": {
      const uri = message?.params?.uri;
      if (uri !== WIDGET_URI) {
        return jsonRpcError(id, -32602, `Unknown resource: ${uri}`);
      }
      return jsonRpcResult(id, { contents: [widgetContents()] });
    }
    case "notifications/initialized":
      return undefined;
    default:
      return jsonRpcError(id, -32601, `Method not found: ${method}`);
  }
}

async function handleMcpRequest(req, res) {
  if (req.method === "OPTIONS") {
    res.writeHead(204, corsHeaders());
    res.end();
    return;
  }

  if (req.method === "GET") {
    sendJson(res, 200, {
      name: "bettergeometry",
      version: APP_VERSION,
      endpoint: MCP_PATH,
      status: "ok",
    });
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, jsonRpcError(null, -32000, "Method not allowed"));
    return;
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch (error) {
    console.error("Invalid JSON body:", error);
    sendJson(res, 400, jsonRpcError(null, -32700, "Parse error"));
    return;
  }

  if (Array.isArray(body)) {
    const responses = body.map(handleMcpMessage).filter(Boolean);
    if (responses.length === 0) {
      res.writeHead(202, corsHeaders());
      res.end();
      return;
    }
    sendJson(res, 200, responses);
    return;
  }

  const response = handleMcpMessage(body);
  if (!response) {
    res.writeHead(202, corsHeaders());
    res.end();
    return;
  }
  sendJson(res, 200, response);
}

function serveStatic(req, res, pathname) {
  const normalized = normalize(decodeURIComponent(pathname)).replace(/^([/\\])+/, "");
  const requestedPath = normalized === "" ? "index.html" : normalized;
  const filePath = resolve(DIST_DIR, requestedPath);

  if (!filePath.startsWith(DIST_DIR)) {
    sendText(res, 403, "Forbidden");
    return;
  }

  const finalPath = existsSync(filePath) ? filePath : join(DIST_DIR, "index.html");
  if (!existsSync(finalPath)) {
    sendText(res, 200, `${APP_NAME} ${APP_VERSION}\nBuild the app with: npm run build`);
    return;
  }

  const ext = extname(finalPath);
  res.writeHead(200, {
    "content-type": mimeTypes.get(ext) ?? "application/octet-stream",
  });
  res.end(readFileSync(finalPath));
}

const port = Number(process.env.PORT ?? 8787);

const httpServer = createServer(async (req, res) => {
  if (!req.url) {
    sendText(res, 400, "Missing URL");
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host ?? "localhost"}`);

  if (url.pathname === HEALTH_PATH) {
    sendJson(res, 200, {
      status: "ok",
      name: APP_NAME,
      version: APP_VERSION,
    });
    return;
  }

  if (url.pathname === MCP_PATH) {
    await handleMcpRequest(req, res);
    return;
  }

  if (req.method === "GET" || req.method === "HEAD") {
    serveStatic(req, res, url.pathname);
    return;
  }

  sendText(res, 404, "Not Found");
});

httpServer.listen(port, () => {
  console.log(`${APP_NAME} ${APP_VERSION} listening on http://localhost:${port}`);
  console.log(`Health endpoint: http://localhost:${port}${HEALTH_PATH}`);
  console.log(`MCP endpoint: http://localhost:${port}${MCP_PATH}`);
});

import { createServer } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";
import { randomUUID } from "node:crypto";

const APP_NAME = "BetterGeometry";
const APP_VERSION = "V0.0.1.3";
const MCP_PATH = "/mcp";
const MCP_SSE_MESSAGES_PATH = "/mcp/messages";
const HEALTH_PATH = "/health";
const WIDGET_URI = "ui://widget/bettergeometry.html";
const ROOT_DIR = resolve(process.cwd());
const DIST_DIR = join(ROOT_DIR, "dist");
const widgetHtml = readFileSync(join(ROOT_DIR, "public", "bettergeometry-widget.html"), "utf8");
const protocolVersion = "2025-06-18";
const sharedSessionId = `bg-${randomUUID()}`;
const sseSessions = new Map();

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
    "Access-Control-Allow-Headers": "content-type, accept, mcp-session-id, mcp-protocol-version, last-event-id",
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
    "MCP-Protocol-Version": protocolVersion,
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

function initializeResult(requestedVersion) {
  return {
    protocolVersion: typeof requestedVersion === "string" ? requestedVersion : protocolVersion,
    capabilities: {
      tools: { listChanged: false },
      resources: { subscribe: false, listChanged: false },
      prompts: { listChanged: false },
    },
    serverInfo: {
      name: "bettergeometry",
      version: APP_VERSION,
    },
  };
}

function toolDescriptor() {
  const securitySchemes = [{ type: "noauth" }];

  return {
    name: "show_bettergeometry",
    title: "Show BetterGeometry",
    description: "Use this when the user wants to open the BetterGeometry ChatGPT app shell for testing.",
    securitySchemes,
    inputSchema: {
      type: "object",
      properties: {
        message: {
          type: "string",
          description: "Optional note to display in the text response.",
        },
      },
      required: [],
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
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    _meta: {
      securitySchemes,
      "openai/outputTemplate": WIDGET_URI,
      "openai/widgetAccessible": true,
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
      "openai/outputTemplate": WIDGET_URI,
    },
  };
}

function handleMcpMessage(message) {
  if (!message || message.jsonrpc !== "2.0" || typeof message.method !== "string") {
    return jsonRpcError(message?.id, -32600, "Invalid Request");
  }

  const id = message.id;
  const method = message.method;

  switch (method) {
    case "initialize":
      return jsonRpcResult(id, initializeResult(message?.params?.protocolVersion));
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
    case "prompts/list":
      return jsonRpcResult(id, { prompts: [] });
    case "notifications/initialized":
      return undefined;
    default:
      // MCP notifications have no id and should not receive error responses.
      if (id === undefined) return undefined;
      return jsonRpcError(id, -32601, `Method not found: ${method}`);
  }
}

async function parseMcpBody(req, res) {
  try {
    return await readJsonBody(req);
  } catch (error) {
    console.error("Invalid JSON body:", error);
    sendJson(res, 400, jsonRpcError(null, -32700, "Parse error"));
    return undefined;
  }
}

function responsesForBody(body) {
  if (Array.isArray(body)) {
    return body.map(handleMcpMessage).filter(Boolean);
  }
  const response = handleMcpMessage(body);
  return response ? [response] : [];
}

async function handleStreamableMcpPost(req, res) {
  const body = await parseMcpBody(req, res);
  if (body === undefined) return;

  const responses = responsesForBody(body);
  if (responses.length === 0) {
    res.writeHead(202, {
      "MCP-Protocol-Version": protocolVersion,
      "Mcp-Session-Id": sharedSessionId,
      ...corsHeaders(),
    });
    res.end();
    return;
  }

  const value = Array.isArray(body) ? responses : responses[0];
  sendJson(res, 200, value, { "Mcp-Session-Id": sharedSessionId });
}

function handleSseOpen(req, res) {
  const sessionId = `sse-${randomUUID()}`;
  const endpoint = `${MCP_SSE_MESSAGES_PATH}?sessionId=${encodeURIComponent(sessionId)}`;

  res.writeHead(200, {
    "content-type": "text/event-stream; charset=utf-8",
    "cache-control": "no-cache, no-transform",
    "connection": "keep-alive",
    "MCP-Protocol-Version": protocolVersion,
    "Mcp-Session-Id": sessionId,
    ...corsHeaders(),
  });

  sseSessions.set(sessionId, res);
  res.write(`event: endpoint\ndata: ${endpoint}\n\n`);
  res.write(`: BetterGeometry ${APP_VERSION} SSE session ready\n\n`);

  const keepAlive = setInterval(() => {
    if (!res.destroyed) res.write(`: keepalive ${Date.now()}\n\n`);
  }, 25_000);

  req.on("close", () => {
    clearInterval(keepAlive);
    sseSessions.delete(sessionId);
  });
}

async function handleSseMessage(req, res, url) {
  if (req.method === "OPTIONS") {
    res.writeHead(204, corsHeaders());
    res.end();
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, jsonRpcError(null, -32000, "Method not allowed"));
    return;
  }

  const sessionId = url.searchParams.get("sessionId") ?? req.headers["mcp-session-id"];
  const sseRes = sessionId ? sseSessions.get(sessionId) : undefined;
  if (!sseRes) {
    sendJson(res, 404, jsonRpcError(null, -32001, "Unknown SSE session"));
    return;
  }

  const body = await parseMcpBody(req, res);
  if (body === undefined) return;

  const responses = responsesForBody(body);
  for (const response of responses) {
    sseRes.write(`event: message\ndata: ${JSON.stringify(response)}\n\n`);
  }

  res.writeHead(202, {
    "MCP-Protocol-Version": protocolVersion,
    "Mcp-Session-Id": sessionId,
    ...corsHeaders(),
  });
  res.end();
}

async function handleMcpRequest(req, res) {
  if (req.method === "OPTIONS") {
    res.writeHead(204, corsHeaders());
    res.end();
    return;
  }

  if (req.method === "GET") {
    const accept = String(req.headers.accept ?? "");
    if (accept.includes("text/event-stream")) {
      handleSseOpen(req, res);
      return;
    }

    sendJson(res, 200, {
      name: "bettergeometry",
      version: APP_VERSION,
      endpoint: MCP_PATH,
      transports: ["streamable-http", "sse"],
      status: "ok",
    });
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, jsonRpcError(null, -32000, "Method not allowed"));
    return;
  }

  await handleStreamableMcpPost(req, res);
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
  if (req.method === "HEAD") {
    res.end();
    return;
  }
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

  if (url.pathname === MCP_SSE_MESSAGES_PATH) {
    await handleSseMessage(req, res, url);
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

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const APP_VERSION = "V0.1.0.4";
const WIDGET_URI = "ui://widget/bettergeometry-v0.1.0.4.html";
const PORT = Number(process.env.PORT || 8787);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, "dist");
const publicDir = path.join(__dirname, "public");

function send(res, status, body, headers = {}) {
  const data = typeof body === "string" ? body : JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": typeof body === "string" ? "text/plain; charset=utf-8" : "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(data),
    ...headers,
  });
  res.end(data);
}

function sendJsonRpc(req, res, id, result) {
  const sessionId = req.headers["mcp-session-id"] || `bg-${crypto.randomUUID()}`;
  send(res, 200, { jsonrpc: "2.0", id, result }, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "content-type, accept, mcp-session-id, mcp-protocol-version, last-event-id",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Expose-Headers": "Mcp-Session-Id, MCP-Protocol-Version",
    "Mcp-Session-Id": sessionId,
    "MCP-Protocol-Version": "2025-06-18",
  });
}

function sendJsonRpcError(req, res, id, code, message) {
  const sessionId = req.headers["mcp-session-id"] || `bg-${crypto.randomUUID()}`;
  send(res, 200, { jsonrpc: "2.0", id, error: { code, message } }, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "content-type, accept, mcp-session-id, mcp-protocol-version, last-event-id",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Expose-Headers": "Mcp-Session-Id, MCP-Protocol-Version",
    "Mcp-Session-Id": sessionId,
    "MCP-Protocol-Version": "2025-06-18",
  });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Request body too large"));
        req.destroy();
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function serveStatic(req, res) {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  let filePath = url.pathname === "/" ? path.join(distDir, "index.html") : path.join(distDir, decodeURIComponent(url.pathname));

  if (!filePath.startsWith(distDir)) {
    send(res, 403, "Forbidden");
    return;
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(distDir, "index.html");
  }

  if (!fs.existsSync(filePath)) {
    const fallback = `<!doctype html><html><head><title>BetterGeometry</title></head><body><h1>BetterGeometry</h1><p>${APP_VERSION}</p></body></html>`;
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(fallback);
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentTypes = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".ico": "image/x-icon",
  };

  res.writeHead(200, { "Content-Type": contentTypes[ext] || "application/octet-stream" });
  fs.createReadStream(filePath).pipe(res);
}

function toolDescriptor() {
  return {
    name: "show_bettergeometry",
    title: "Show BetterGeometry",
    description: "Use this when the user wants to open the BetterGeometry generic SVG scene renderer inside ChatGPT.",
    securitySchemes: [{ type: "noauth" }],
    inputSchema: {
      type: "object",
      properties: {
        message: { type: "string", description: "Optional note to display in the text response." },
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
      securitySchemes: [{ type: "noauth" }],
      "openai/outputTemplate": WIDGET_URI,
      "openai/widgetAccessible": true,
      "openai/toolInvocation/invoking": "Opening BetterGeometry…",
      "openai/toolInvocation/invoked": "BetterGeometry opened",
    },
  };
}

function widgetHtml() {
  const filePath = path.join(publicDir, "bettergeometry-widget.html");
  if (fs.existsSync(filePath)) return fs.readFileSync(filePath, "utf8");
  return "<html><body><h1>BetterGeometry</h1></body></html>";
}

async function handleMcp(req, res) {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "content-type, accept, mcp-session-id, mcp-protocol-version, last-event-id",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Expose-Headers": "Mcp-Session-Id, MCP-Protocol-Version",
    });
    res.end();
    return;
  }

  if (req.method === "GET") {
    const sessionId = `bg-${crypto.randomUUID()}`;
    res.writeHead(200, {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Mcp-Session-Id": sessionId,
      "MCP-Protocol-Version": "2025-06-18",
    });
    res.write(`event: endpoint\ndata: /mcp/messages?sessionId=${encodeURIComponent(sessionId)}\n\n`);
    res.write(`event: ready\ndata: ${JSON.stringify({ name: "bettergeometry", version: APP_VERSION })}\n\n`);
    setTimeout(() => res.end(), 1000);
    return;
  }

  if (req.method !== "POST") {
    send(res, 405, "Method not allowed");
    return;
  }

  let payload;
  try {
    const raw = await readBody(req);
    payload = raw ? JSON.parse(raw) : {};
  } catch (error) {
    sendJsonRpcError(req, res, null, -32700, "Invalid JSON");
    return;
  }

  const { id = null, method, params = {} } = payload;

  if (method === "initialize") {
    sendJsonRpc(req, res, id, {
      protocolVersion: "2025-06-18",
      capabilities: { tools: {}, resources: {}, prompts: {} },
      serverInfo: { name: "bettergeometry", version: APP_VERSION },
    });
    return;
  }

  if (method === "notifications/initialized") {
    res.writeHead(202, {
      "Access-Control-Allow-Origin": "*",
      "MCP-Protocol-Version": "2025-06-18",
    });
    res.end();
    return;
  }

  if (method === "tools/list") {
    sendJsonRpc(req, res, id, { tools: [toolDescriptor()] });
    return;
  }

  if (method === "tools/call") {
    if (params?.name !== "show_bettergeometry") {
      sendJsonRpcError(req, res, id, -32602, "Unknown tool");
      return;
    }
    const message = params?.arguments?.message || "Generic geometry scene JSON renders as SVG inside ChatGPT.";
    sendJsonRpc(req, res, id, {
      structuredContent: { name: "BetterGeometry", version: APP_VERSION, message },
      content: [{ type: "text", text: `BetterGeometry ${APP_VERSION}: ${message}` }],
      _meta: { "openai/outputTemplate": WIDGET_URI },
    });
    return;
  }

  if (method === "resources/list") {
    sendJsonRpc(req, res, id, {
      resources: [
        {
          uri: WIDGET_URI,
          name: "BetterGeometry Widget",
          description: "BetterGeometry generic SVG scene renderer widget.",
          mimeType: "text/html+skybridge",
        },
      ],
    });
    return;
  }

  if (method === "resources/read") {
    const uri = params?.uri;
    if (uri !== WIDGET_URI) {
      sendJsonRpcError(req, res, id, -32602, `Unknown resource: ${uri}`);
      return;
    }
    sendJsonRpc(req, res, id, {
      contents: [
        {
          uri: WIDGET_URI,
          mimeType: "text/html+skybridge",
          text: widgetHtml(),
        },
      ],
    });
    return;
  }

  if (method === "prompts/list") {
    sendJsonRpc(req, res, id, { prompts: [] });
    return;
  }

  sendJsonRpcError(req, res, id, -32601, `Method not found: ${method}`);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  if (url.pathname === "/health") {
    send(res, 200, { ok: true, name: "BetterGeometry", version: APP_VERSION });
    return;
  }

  if (url.pathname === "/mcp" || url.pathname === "/mcp/messages") {
    await handleMcp(req, res);
    return;
  }

  serveStatic(req, res);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`BetterGeometry ${APP_VERSION} listening on http://localhost:${PORT}`);
  console.log(`MCP endpoint: http://localhost:${PORT}/mcp`);
});

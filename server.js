import { createServer } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";
import {
  registerAppResource,
  registerAppTool,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";

const APP_NAME = "BetterGeometry";
const APP_VERSION = "V0.0.1.1";
const MCP_PATH = "/mcp";
const WIDGET_URI = "ui://widget/bettergeometry.html";
const ROOT_DIR = resolve(process.cwd());
const DIST_DIR = join(ROOT_DIR, "dist");
const widgetHtml = readFileSync(join(ROOT_DIR, "public", "bettergeometry-widget.html"), "utf8");

const showInputSchema = {
  message: z.string().optional().describe("Optional note to show with the BetterGeometry app shell."),
};

const showOutputSchema = {
  name: z.string(),
  version: z.string(),
  message: z.string(),
};

function replyWithApp(message = "Opened BetterGeometry.") {
  return {
    content: [{ type: "text", text: `${APP_NAME} ${APP_VERSION}: ${message}` }],
    structuredContent: {
      name: APP_NAME,
      version: APP_VERSION,
      message,
    },
  };
}

function createBetterGeometryServer() {
  const server = new McpServer({ name: "bettergeometry", version: APP_VERSION });

  registerAppResource(
    server,
    "bettergeometry-widget",
    WIDGET_URI,
    {},
    async () => ({
      contents: [
        {
          uri: WIDGET_URI,
          mimeType: RESOURCE_MIME_TYPE,
          text: widgetHtml,
        },
      ],
    })
  );

  registerAppTool(
    server,
    "show_bettergeometry",
    {
      title: "Show BetterGeometry",
      description:
        "Use this when the user wants to open, test, view, or launch the BetterGeometry ChatGPT app shell.",
      inputSchema: showInputSchema,
      outputSchema: showOutputSchema,
      annotations: {
        readOnlyHint: true,
      },
      _meta: {
        ui: { resourceUri: WIDGET_URI },
      },
    },
    async (args) => {
      const message = args?.message?.trim?.() || "ChatGPT app shell is connected.";
      return replyWithApp(message);
    }
  );

  return server;
}

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

function sendText(res, status, text) {
  res.writeHead(status, { "content-type": "text/plain; charset=utf-8" });
  res.end(text);
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

  if (req.method === "OPTIONS" && url.pathname === MCP_PATH) {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "content-type, mcp-session-id",
      "Access-Control-Expose-Headers": "Mcp-Session-Id",
    });
    res.end();
    return;
  }

  const MCP_METHODS = new Set(["POST", "GET", "DELETE"]);
  if (url.pathname === MCP_PATH && req.method && MCP_METHODS.has(req.method)) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Expose-Headers", "Mcp-Session-Id");

    const server = createBetterGeometryServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    res.on("close", () => {
      transport.close();
      server.close();
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res);
    } catch (error) {
      console.error("Error handling MCP request:", error);
      if (!res.headersSent) {
        sendText(res, 500, "Internal server error");
      }
    }
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
  console.log(`MCP endpoint: http://localhost:${port}${MCP_PATH}`);
});

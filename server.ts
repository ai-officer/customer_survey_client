import express from "express";
import { createServer as createViteServer } from "vite";

const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8000";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.raw({ type: "*/*", limit: "10mb" }));

  // Proxy all /api/* requests to FastAPI backend
  app.use("/api", async (req, res) => {
    const url = `${FASTAPI_URL}/api${req.url}`;
    try {
      const headers: Record<string, string> = {};
      if (req.headers["content-type"]) headers["Content-Type"] = req.headers["content-type"];
      if (req.headers["authorization"]) headers["Authorization"] = req.headers["authorization"] as string;

      const fetchOptions: RequestInit = {
        method: req.method,
        headers,
      };

      if (req.method !== "GET" && req.method !== "HEAD" && req.body && (req.body as Buffer).length > 0) {
        fetchOptions.body = req.body as unknown as Uint8Array;
      }

      const response = await fetch(url, fetchOptions);
      const contentType = response.headers.get("content-type") || "";

      res.status(response.status);
      if (contentType) res.setHeader("Content-Type", contentType);

      const disposition = response.headers.get("content-disposition");
      if (disposition) res.setHeader("Content-Disposition", disposition);

      if (response.status === 204) {
        return res.send();
      }

      const buffer = await response.arrayBuffer();
      return res.send(Buffer.from(buffer));
    } catch (error) {
      console.error(`Proxy error for ${req.method} ${url}:`, error);
      res.status(502).json({ error: "FastAPI backend unavailable", detail: String(error) });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      configFile: "vite.config.ts",
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const { join } = await import("path");
    const distPath = join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Proxying /api/* → ${FASTAPI_URL}/api/*`);
  });
}

startServer();

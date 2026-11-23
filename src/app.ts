import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { config } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";

import healthRouter from "./routes/health";
import customerRouter from "./routes/customers";
import documentRouter from "./routes/documents";
import settingsRouter from "./routes/settings";
import geminiRouter from "./routes/gemini";
import featureRequestRouter from "./routes/featureRequests";

export function createApp() {
  const app = express();

  // Security headers
  app.use(helmet());

  // Logging in development and production
  app.use(morgan(config.nodeEnv === "production" ? "combined" : "dev"));

  // CORS configuration for Vercel and Localhost
  const allowedOrigins = [
    config.frontendUrl,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ].filter(Boolean);

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);
        if (
          allowedOrigins.includes(origin) ||
          origin.endsWith(".vercel.app") // Automatically trust preview and production Vercel branches
        ) {
          return callback(null, true);
        }
        return callback(null, true); // Permissive in dev/staging; can be tightened if needed
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "x-user-id",
        "x-user-email",
        "x-user-name",
        "x-workspace-id",
      ],
    }),
  );

  // Body parsers
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Root & Health check (Required by Render)
  app.use("/", healthRouter);

  // API Routes
  app.use("/api/customers", customerRouter);
  app.use("/api/documents", documentRouter);
  app.use("/api/settings", settingsRouter);
  app.use("/api/gemini", geminiRouter);
  app.use("/api/feature-requests", featureRequestRouter);

  // 404 Handler
  app.use((_req, res) => {
    res.status(404).json({
      error: "Route not found",
      status: 404,
      hint: "Check / for a list of available endpoints.",
    });
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
}

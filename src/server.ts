import { createApp } from "./app";
import { config } from "./config/env";

const app = createApp();

const server = app.listen(config.port, "0.0.0.0", () => {
  console.log(`===============================================`);
  console.log(`🚀 Invoice Naija API Server running`);
  console.log(`📡 Port: ${config.port}`);
  console.log(`🌍 Environment: ${config.nodeEnv}`);
  console.log(`🩺 Health check: http://localhost:${config.port}/health`);
  console.log(`===============================================`);
});

// Graceful shutdown on termination signals
const shutdown = (signal: string) => {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log("Process terminated. Goodbye!");
    process.exit(0);
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

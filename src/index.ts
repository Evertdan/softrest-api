import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import jwt from "@fastify/jwt";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || "info",
    transport: process.env.LOG_PRETTY === "true" ? {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "HH:MM:ss Z",
        ignore: "pid,hostname",
      },
    } : undefined,
  },
});

// Register plugins
await app.register(helmet);
await app.register(cors, {
  origin: process.env.CORS_ORIGIN?.split(",") || ["http://localhost:3000"],
  credentials: true,
});

await app.register(rateLimit, {
  max: Number(process.env.RATE_LIMIT_MAX) || 100,
  timeWindow: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
});

await app.register(jwt, {
  secret: process.env.JWT_SECRET || "change-me-in-production",
});

// Swagger documentation
await app.register(swagger, {
  openapi: {
    info: {
      title: "SoftRest API v2",
      description: "API para Sistema POS de Restaurantes",
      version: "2.0.0",
    },
    servers: [
      { url: "http://localhost:4000", description: "Desarrollo local" },
    ],
    tags: [
      { name: "Auth", description: "Autenticación y autorización" },
      { name: "Users", description: "Gestión de usuarios" },
      { name: "Restaurants", description: "Configuración de restaurantes" },
      { name: "Products", description: "Productos y menú" },
      { name: "Categories", description: "Categorías de productos" },
      { name: "Tables", description: "Mesas" },
      { name: "Orders", description: "Órdenes" },
      { name: "Kitchen", description: "Kitchen Display System" },
      { name: "Cash Register", description: "Caja y pagos" },
      { name: "Inventory", description: "Inventario" },
      { name: "Clients", description: "Clientes" },
      { name: "CFDI", description: "Facturación electrónica" },
      { name: "Delivery", description: "Delivery y aggregators" },
      { name: "Loyalty", description: "Programa de lealtad" },
      { name: "Reports", description: "Reportes y analytics" },
    ],
  },
});

await app.register(swaggerUi, {
  routePrefix: "/documentation",
  uiConfig: {
    docExpansion: "list",
    deepLinking: false,
  },
});

// Health check endpoint
app.get("/api/v1/health", async () => {
  return {
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "2.0.0",
    environment: process.env.NODE_ENV || "development",
  };
});

// Root endpoint
app.get("/", async () => {
  return {
    name: "SoftRest API v2",
    version: "2.0.0",
    documentation: "/documentation",
    health: "/api/v1/health",
  };
});

// Start server
try {
  const port = Number(process.env.PORT) || 4000;
  const host = "0.0.0.0";

  await app.listen({ port, host });

  app.log.info(`🚀 Servidor iniciado en http://${host}:${port}`);
  app.log.info(`📚 Documentación: http://${host}:${port}/documentation`);
  app.log.info(`💓 Health check: http://${host}:${port}/api/v1/health`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

export default app;
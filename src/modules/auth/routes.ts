import { FastifyInstance } from "fastify";
import { z } from "zod";
import { AuthService } from "./service.js";
import { authenticate } from "../../shared/middleware/auth.js";

const authService = new AuthService();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  restaurantId: z.string().uuid(),
  role: z.enum(["owner", "manager", "cashier", "waiter", "kitchen", "admin"]).optional(),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export default async function authRoutes(app: FastifyInstance) {
  app.post("/login", {
    schema: {
      tags: ["Auth"],
      description: "Iniciar sesión",
      body: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 1 },
        },
      },
    },
  }, async (request, reply) => {
    const result = loginSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: "Bad Request",
        message: "Datos de entrada inválidos",
        details: result.error.errors,
      });
    }

    try {
      const { email, password } = result.data;
      const authData = await authService.login(email, password);
      return reply.send(authData);
    } catch (error: any) {
      return reply.status(401).send({
        statusCode: 401,
        error: "Unauthorized",
        message: error.message || "Credenciales inválidas",
      });
    }
  });

  app.post("/register", {
    schema: {
      tags: ["Auth"],
      description: "Registrar nuevo usuario",
      body: {
        type: "object",
        required: ["email", "password", "firstName", "lastName", "restaurantId"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 6 },
          firstName: { type: "string", minLength: 1 },
          lastName: { type: "string", minLength: 1 },
          restaurantId: { type: "string", format: "uuid" },
          role: { type: "string", enum: ["owner", "manager", "cashier", "waiter", "kitchen", "admin"] },
        },
      },
    },
  }, async (request, reply) => {
    const result = registerSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: "Bad Request",
        message: "Datos de entrada inválidos",
        details: result.error.errors,
      });
    }

    try {
      const user = await authService.register(result.data);
      return reply.status(201).send({ id: user.id });
    } catch (error: any) {
      return reply.status(409).send({
        statusCode: 409,
        error: "Conflict",
        message: error.message || "Error al registrar usuario",
      });
    }
  });

  app.post("/refresh", {
    schema: {
      tags: ["Auth"],
      description: "Refrescar token de acceso",
      body: {
        type: "object",
        required: ["refreshToken"],
        properties: {
          refreshToken: { type: "string", minLength: 1 },
        },
      },
    },
  }, async (request, reply) => {
    const result = refreshSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: "Bad Request",
        message: "Datos de entrada inválidos",
      });
    }

    return reply.status(501).send({
      statusCode: 501,
      error: "Not Implemented",
      message: "Refresh token no implementado aún",
    });
  });

  app.get("/me", {
    preHandler: [authenticate],
    schema: {
      tags: ["Auth"],
      description: "Obtener información del usuario actual",
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    return reply.send({
      userId: request.user?.userId,
      role: request.user?.role,
    });
  });
}

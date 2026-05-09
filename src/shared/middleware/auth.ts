import { FastifyReply, FastifyRequest } from "fastify";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-secret"
);

export interface AuthenticatedUser {
  userId: string;
  role: string;
  restaurantId?: string;
}

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    reply.status(401).send({
      statusCode: 401,
      error: "Unauthorized",
      message: "Token de autenticación requerido",
    });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      algorithms: ["HS256"],
    });

    if (!payload.userId || !payload.role) {
      reply.status(401).send({
        statusCode: 401,
        error: "Unauthorized",
        message: "Token inválido: payload incompleto",
      });
      return;
    }

    request.user = {
      userId: payload.userId as string,
      role: payload.role as string,
      restaurantId: payload.restaurantId as string | undefined,
    };
  } catch (error) {
    reply.status(401).send({
      statusCode: 401,
      error: "Unauthorized",
      message: "Token inválido o expirado",
    });
  }
}

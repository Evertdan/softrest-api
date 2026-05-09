import { AuthenticatedUser } from "../middleware/auth.js";

declare module "fastify" {
  interface FastifyRequest {
    user?: AuthenticatedUser;
  }
}

import { FastifyInstance } from "fastify";
import { KitchenService } from "./service.js";
import { authenticate, AuthenticatedUser } from "../../shared/middleware/auth.js";

const kitchenService = new KitchenService();

interface QueryParams {
  restaurantId?: string;
  status?: string;
}


interface QueryParams {
  restaurantId?: string;
  status?: string;
}
export default async function kitchenRoutes(app: FastifyInstance) {
  app.get("/kitchen/orders", { preHandler: [authenticate] }, async (request, reply) => {
    const query = request.query as QueryParams;
    const restaurantId = query.restaurantId || "default";
    const status = query.status || "preparing";
    const orders = await kitchenService.getOrdersByStatus(restaurantId, status);
    return reply.send(orders);
  });

  app.get("/kitchen/items", { preHandler: [authenticate] }, async (request, reply) => {
    const query = request.query as QueryParams;
    const restaurantId = query.restaurantId || "default";
    const status = query.status || "pending";
    const items = await kitchenService.getOrderItemsByStatus(restaurantId, status);
    return reply.send(items);
  });

  app.patch("/kitchen/items/:id/status", { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { status } = request.body as { status: string };
    const preparedById = (request.user as AuthenticatedUser | undefined)?.userId;
    const item = await kitchenService.updateItemStatus(id, status, preparedById);
    return reply.send(item);
  });

  app.get("/kitchen/orders/:id/history", { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const history = await kitchenService.getOrderStatusHistory(id);
    return reply.send(history);
  });
}

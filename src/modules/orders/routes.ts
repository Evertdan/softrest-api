import { FastifyInstance } from "fastify";
import { z } from "zod";
import { OrdersService } from "./service.js";
import { authenticate, AuthenticatedUser } from "../../shared/middleware/auth.js";

const ordersService = new OrdersService();

interface QueryParams {
  restaurantId?: string;
  status?: string;
  tableId?: string;
}

const orderSchema = z.object({
  tableId: z.string().uuid().optional(),
  orderNumber: z.string().min(1),
  type: z.enum(["dine_in", "takeaway", "delivery", "drive_thru"]).optional(),
  guests: z.number().min(1).optional(),
  notes: z.string().optional(),
  source: z.string().optional(),
  subtotal: z.string().optional(),
  taxAmount: z.string().optional(),
  total: z.string().optional(),
});

const orderItemSchema = z.object({
  productId: z.string().uuid(),
  productName: z.string().min(1),
  quantity: z.number().min(1),
  unitPrice: z.string().min(1),
  totalPrice: z.string().min(1),
  modifiers: z.any().optional(),
  notes: z.string().optional(),
});

const tableSchema = z.object({
  name: z.string().min(1),
  number: z.number().min(1),
  capacity: z.number().optional(),
  section: z.string().optional(),
  posX: z.number().optional(),
  posY: z.number().optional(),
});

export default async function ordersRoutes(app: FastifyInstance) {
  // Orders
  app.get("/orders", { preHandler: [authenticate] }, async (request, reply) => {
    const query = request.query as QueryParams;
    const restaurantId = query.restaurantId || "default";
    const status = query.status;
    const tableId = query.tableId;
    const items = await ordersService.getOrders(restaurantId, status, tableId);
    return reply.send(items);
  });

  app.get("/orders/:id", { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const query = request.query as QueryParams;
    const restaurantId = query.restaurantId || "default";
    const order = await ordersService.getOrderById(id, restaurantId);
    const items = await ordersService.getOrderItems(id);
    return reply.send({ ...order, items });
  });

  app.post("/orders", { preHandler: [authenticate] }, async (request, reply) => {
    const result = orderSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({ statusCode: 400, error: "Bad Request", details: result.error.errors });
    }
    const query = request.query as QueryParams;
    const restaurantId = query.restaurantId || "default";
    const userId = (request.user as AuthenticatedUser | undefined)?.userId || "default";
    const order = await ordersService.createOrder({ ...result.data, restaurantId, userId });
    return reply.status(201).send(order);
  });

  app.post("/orders/:id/items", { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = orderItemSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({ statusCode: 400, error: "Bad Request", details: result.error.errors });
    }
    const item = await ordersService.addOrderItem({ ...result.data, orderId: id });
    return reply.status(201).send(item);
  });

  app.patch("/orders/:id/status", { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { status, notes } = request.body as { status: string; notes?: string };
    const query = request.query as QueryParams;
    const restaurantId = query.restaurantId || "default";
    const changedById = (request.user as AuthenticatedUser | undefined)?.userId;
    const order = await ordersService.updateOrderStatus(id, restaurantId, status, changedById, notes);
    return reply.send(order);
  });

  app.patch("/orders/:id/payment-status", { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { paymentStatus } = request.body as { paymentStatus: string };
    const query = request.query as QueryParams;
    const restaurantId = query.restaurantId || "default";
    const order = await ordersService.updatePaymentStatus(id, restaurantId, paymentStatus);
    return reply.send(order);
  });

  app.post("/orders/:id/cancel", { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { reason } = request.body as { reason?: string };
    const query = request.query as QueryParams;
    const restaurantId = query.restaurantId || "default";
    const cancelledById = (request.user as AuthenticatedUser | undefined)?.userId;
    const order = await ordersService.cancelOrder(id, restaurantId, reason, cancelledById);
    return reply.send(order);
  });

  app.post("/orders/:id/close", { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const query = request.query as QueryParams;
    const restaurantId = query.restaurantId || "default";
    const order = await ordersService.closeOrder(id, restaurantId);
    return reply.send(order);
  });

  // Tables
  app.get("/tables", { preHandler: [authenticate] }, async (request, reply) => {
    const query = request.query as QueryParams;
    const restaurantId = query.restaurantId || "default";
    const tables = await ordersService.getTables(restaurantId);
    return reply.send(tables);
  });

  app.get("/tables/:id", { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const query = request.query as QueryParams;
    const restaurantId = query.restaurantId || "default";
    const table = await ordersService.getTableById(id, restaurantId);
    return reply.send(table);
  });

  app.post("/tables", { preHandler: [authenticate] }, async (request, reply) => {
    const result = tableSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({ statusCode: 400, error: "Bad Request", details: result.error.errors });
    }
    const query = request.query as QueryParams;
    const restaurantId = query.restaurantId || "default";
    const table = await ordersService.createTable({ ...result.data, restaurantId });
    return reply.status(201).send(table);
  });

  app.patch("/tables/:id", { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const query = request.query as QueryParams;
    const restaurantId = query.restaurantId || "default";
    const table = await ordersService.updateTable(id, restaurantId, request.body as any);
    return reply.send(table);
  });

  app.delete("/tables/:id", { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const query = request.query as QueryParams;
    const restaurantId = query.restaurantId || "default";
    await ordersService.deleteTable(id, restaurantId);
    return reply.status(204).send();
  });
}

import { FastifyInstance } from "fastify";
import { z } from "zod";
import { DeliveryService } from "./service.js";
import { authenticate } from "../../shared/middleware/auth.js";

const deliveryService = new DeliveryService();

interface QueryParams {
  restaurantId?: string;
  platformId?: string;
  status?: string;
}

const platformSchema = z.object({
  name: z.enum(["uber_eats", "rappi", "didi_food", "own_delivery"]),
  apiKey: z.string().optional(),
  apiSecret: z.string().optional(),
  webhookUrl: z.string().optional(),
  commissionRate: z.string().optional(),
  menuSyncEnabled: z.boolean().optional(),
  autoAccept: z.boolean().optional(),
});

const deliveryOrderSchema = z.object({
  orderId: z.string().uuid(),
  platformId: z.string().uuid(),
  externalOrderId: z.string().min(1),
  externalOrderNumber: z.string().optional(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  deliveryAddress: z.string().optional(),
  deliveryInstructions: z.string().optional(),
  deliveryFee: z.string().optional(),
  platformCommission: z.string().optional(),
  estimatedDeliveryTime: z.string().optional(),
  driverName: z.string().optional(),
  driverPhone: z.string().optional(),
  trackingUrl: z.string().optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(["pending", "confirmed", "preparing", "ready", "picked_up", "in_transit", "delivered", "cancelled"]),
  driverName: z.string().optional(),
  driverPhone: z.string().optional(),
  trackingUrl: z.string().optional(),
});


interface QueryParams {
  restaurantId?: string;
  platformId?: string;
  status?: string;
}
export default async function deliveryRoutes(app: FastifyInstance) {
  app.get("/delivery-platforms", { preHandler: [authenticate] }, async (request, reply) => {
    const query = request.query as QueryParams;
    const restaurantId = query.restaurantId || "default";
    const platforms = await deliveryService.getPlatforms(restaurantId);
    return reply.send(platforms);
  });

  app.get("/delivery-platforms/:id", { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const query = request.query as QueryParams;
    const restaurantId = query.restaurantId || "default";
    const platform = await deliveryService.getPlatformById(id, restaurantId);
    return reply.send(platform);
  });

  app.post("/delivery-platforms", { preHandler: [authenticate] }, async (request, reply) => {
    const result = platformSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({ statusCode: 400, error: "Bad Request", details: result.error.errors });
    }
    const query = request.query as QueryParams;
    const restaurantId = query.restaurantId || "default";
    const platform = await deliveryService.createPlatform({ ...result.data, restaurantId });
    return reply.status(201).send(platform);
  });

  app.put("/delivery-platforms/:id", { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const query = request.query as QueryParams;
    const restaurantId = query.restaurantId || "default";
    const platform = await deliveryService.updatePlatform(id, restaurantId, request.body);
    return reply.send(platform);
  });

  app.delete("/delivery-platforms/:id", { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const query = request.query as QueryParams;
    const restaurantId = query.restaurantId || "default";
    await deliveryService.deletePlatform(id, restaurantId);
    return reply.status(204).send();
  });

  app.get("/delivery-orders", { preHandler: [authenticate] }, async (request, reply) => {
    const query = request.query as QueryParams;
    const restaurantId = query.restaurantId || "default";
    const platformId = query.platformId;
    const status = query.status;
    const orders = await deliveryService.getDeliveryOrders(restaurantId, platformId, status);
    return reply.send(orders);
  });

  app.get("/delivery-orders/:id", { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const order = await deliveryService.getDeliveryOrderById(id);
    return reply.send(order);
  });

  app.post("/delivery-orders", { preHandler: [authenticate] }, async (request, reply) => {
    const result = deliveryOrderSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({ statusCode: 400, error: "Bad Request", details: result.error.errors });
    }
    const data = result.data;
    const orderData: any = {
      orderId: data.orderId,
      platformId: data.platformId,
      externalOrderId: data.externalOrderId,
      externalOrderNumber: data.externalOrderNumber,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      deliveryAddress: data.deliveryAddress,
      deliveryInstructions: data.deliveryInstructions,
      deliveryFee: data.deliveryFee,
      platformCommission: data.platformCommission,
      driverName: data.driverName,
      driverPhone: data.driverPhone,
      trackingUrl: data.trackingUrl,
    };
    if (data.estimatedDeliveryTime) {
      orderData.estimatedDeliveryTime = new Date(data.estimatedDeliveryTime);
    }
    const order = await deliveryService.createDeliveryOrder(orderData);
    return reply.status(201).send(order);
  });

  app.put("/delivery-orders/:id", { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const order = await deliveryService.updateDeliveryOrder(id, request.body);
    return reply.send(order);
  });

  app.patch("/delivery-orders/:id/status", { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = updateStatusSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({ statusCode: 400, error: "Bad Request", details: result.error.errors });
    }
    const { status, driverName, driverPhone, trackingUrl } = result.data;
    const order = await deliveryService.updateDeliveryStatus(id, status, driverName, driverPhone, trackingUrl);
    return reply.send(order);
  });

  app.delete("/delivery-orders/:id", { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await deliveryService.deleteDeliveryOrder(id);
    return reply.status(204).send();
  });
}

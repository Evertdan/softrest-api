import { db } from "../../db/index.js";
import { deliveryPlatforms, deliveryOrders } from "../../db/schema/index.js";
import { eq, and, desc } from "drizzle-orm";
import { AppError } from "../../shared/errors/AppError.js";

export class DeliveryService {
  async getPlatforms(restaurantId: string) {
    return db.select().from(deliveryPlatforms)
      .where(eq(deliveryPlatforms.restaurantId, restaurantId))
      .orderBy(desc(deliveryPlatforms.createdAt));
  }

  async getPlatformById(id: string, restaurantId: string) {
    const [platform] = await db.select().from(deliveryPlatforms)
      .where(and(eq(deliveryPlatforms.id, id), eq(deliveryPlatforms.restaurantId, restaurantId)));
    if (!platform) throw AppError.notFound("Plataforma no encontrada");
    return platform;
  }

  async createPlatform(data: {
    restaurantId: string;
    name: any;
    apiKey?: string;
    apiSecret?: string;
    webhookUrl?: string;
    commissionRate?: string;
    menuSyncEnabled?: boolean;
    autoAccept?: boolean;
  }) {
    const id = crypto.randomUUID();
    await db.insert(deliveryPlatforms).values({
      id,
      isActive: true,
      ...data,
    });
    return this.getPlatformById(id, data.restaurantId);
  }

  async updatePlatform(id: string, restaurantId: string, data: any) {
    await this.getPlatformById(id, restaurantId);
    await db.update(deliveryPlatforms).set({
      ...data,
      updatedAt: new Date(),
    }).where(eq(deliveryPlatforms.id, id));
    return this.getPlatformById(id, restaurantId);
  }

  async deletePlatform(id: string, restaurantId: string) {
    await this.getPlatformById(id, restaurantId);
    await db.delete(deliveryPlatforms).where(eq(deliveryPlatforms.id, id));
  }

  async getDeliveryOrders(restaurantId: string, platformId?: string, status?: string) {
    const conditions = [eq(deliveryPlatforms.restaurantId, restaurantId)];
    
    if (platformId) {
      conditions.push(eq(deliveryOrders.platformId, platformId));
    }
    if (status) {
      conditions.push(eq(deliveryOrders.deliveryStatus, status as any));
    }
    
    return db.select({
      deliveryOrder: deliveryOrders,
    }).from(deliveryOrders)
      .innerJoin(deliveryPlatforms, eq(deliveryOrders.platformId, deliveryPlatforms.id))
      .where(and(...conditions))
      .orderBy(desc(deliveryOrders.createdAt));
  }

  async getDeliveryOrderById(id: string) {
    const [order] = await db.select().from(deliveryOrders)
      .where(eq(deliveryOrders.id, id));
    if (!order) throw AppError.notFound("Orden de delivery no encontrada");
    return order;
  }

  async createDeliveryOrder(data: {
    orderId: string;
    platformId: string;
    externalOrderId: string;
    externalOrderNumber?: string;
    customerName?: string;
    customerPhone?: string;
    deliveryAddress?: string;
    deliveryInstructions?: string;
    deliveryFee?: string;
    platformCommission?: string;
    estimatedDeliveryTime?: Date;
    driverName?: string;
    driverPhone?: string;
    trackingUrl?: string;
  }) {
    const id = crypto.randomUUID();
    await db.insert(deliveryOrders).values({
      id,
      deliveryStatus: "pending",
      ...data,
    });
    return this.getDeliveryOrderById(id);
  }

  async updateDeliveryOrder(id: string, data: any) {
    await this.getDeliveryOrderById(id);
    await db.update(deliveryOrders).set({
      ...data,
      updatedAt: new Date(),
    }).where(eq(deliveryOrders.id, id));
    return this.getDeliveryOrderById(id);
  }

  async updateDeliveryStatus(id: string, status: string, driverName?: string, driverPhone?: string, trackingUrl?: string) {
    await this.getDeliveryOrderById(id);
    const updateData: any = { deliveryStatus: status, updatedAt: new Date() };
    if (driverName) updateData.driverName = driverName;
    if (driverPhone) updateData.driverPhone = driverPhone;
    if (trackingUrl) updateData.trackingUrl = trackingUrl;
    if (status === "delivered") updateData.actualDeliveryTime = new Date();
    
    await db.update(deliveryOrders).set(updateData).where(eq(deliveryOrders.id, id));
    return this.getDeliveryOrderById(id);
  }

  async deleteDeliveryOrder(id: string) {
    await this.getDeliveryOrderById(id);
    await db.delete(deliveryOrders).where(eq(deliveryOrders.id, id));
  }
}

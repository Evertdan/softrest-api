import { db } from "../../db/index.js";
import { orders, orderItems, orderStatusHistory } from "../../db/schema/index.js";
import { eq, and, inArray, desc } from "drizzle-orm";

export class KitchenService {
  async getOrdersByStatus(restaurantId: string, status: string | string[]) {
    const statuses = Array.isArray(status) ? status : [status];
    return db.select().from(orders)
      .where(and(
        eq(orders.restaurantId, restaurantId),
        inArray(orders.status, statuses as any[])
      ))
      .orderBy(desc(orders.createdAt));
  }

  async getOrderItemsByStatus(restaurantId: string, status: string) {
    const activeOrders = await db.select({ id: orders.id }).from(orders)
      .where(eq(orders.restaurantId, restaurantId));
    
    const orderIds = activeOrders.map(o => o.id);
    
    if (orderIds.length === 0) return [];
    
    return db.select().from(orderItems)
      .where(and(
        inArray(orderItems.orderId, orderIds),
        eq(orderItems.status, status as any)
      ))
      .orderBy(desc(orderItems.createdAt));
  }

  async updateItemStatus(itemId: string, status: string, preparedById?: string) {
    await db.update(orderItems).set({
      status: status as any,
      preparedById,
      preparedAt: status === "ready" || status === "served" ? new Date() : undefined,
    }).where(eq(orderItems.id, itemId));
    
    return db.select().from(orderItems).where(eq(orderItems.id, itemId));
  }

  async getOrderStatusHistory(orderId: string) {
    return db.select().from(orderStatusHistory)
      .where(eq(orderStatusHistory.orderId, orderId))
      .orderBy(desc(orderStatusHistory.createdAt));
  }
}

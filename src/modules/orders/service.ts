import { db } from "../../db/index.js";
import { orders, orderItems, orderStatusHistory, tables } from "../../db/schema/index.js";
import { eq, and, desc, sql } from "drizzle-orm";
import { AppError } from "../../shared/errors/AppError.js";

export class OrdersService {
  async getOrders(restaurantId: string, status?: string, tableId?: string) {
    let query = db.select().from(orders)
      .where(eq(orders.restaurantId, restaurantId));
    
    if (status) {
      query = db.select().from(orders)
        .where(and(eq(orders.restaurantId, restaurantId), eq(orders.status, status as any)));
    }
    
    if (tableId) {
      query = db.select().from(orders)
        .where(and(eq(orders.restaurantId, restaurantId), eq(orders.tableId, tableId)));
    }
    
    return query.orderBy(desc(orders.createdAt));
  }

  async getOrderById(id: string, restaurantId: string) {
    const [order] = await db.select().from(orders)
      .where(and(eq(orders.id, id), eq(orders.restaurantId, restaurantId)));
    if (!order) throw AppError.notFound("Orden no encontrada");
    return order;
  }

  async getOrderItems(orderId: string) {
    return db.select().from(orderItems)
      .where(eq(orderItems.orderId, orderId));
  }

  async createOrder(data: {
    restaurantId: string;
    tableId?: string;
    userId: string;
    orderNumber: string;
    type?: string;
    guests?: number;
    notes?: string;
    source?: string;
    subtotal?: string;
    taxAmount?: string;
    total?: string;
  }) {
    const [order] = await db.insert(orders).values({
      id: crypto.randomUUID(),
      status: "pending",
      paymentStatus: "pending",
      type: (data.type || "dine_in") as any,
      source: data.source || "pos",
      ...data,
    }).$returningId();

    return order;
  }

  async addOrderItem(data: {
    orderId: string;
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: string;
    totalPrice: string;
    modifiers?: any;
    notes?: string;
  }) {
    const [item] = await db.insert(orderItems).values({
      id: crypto.randomUUID(),
      status: "pending" as any,
      ...data,
    }).$returningId();
    return item;
  }

  async updateOrderStatus(id: string, restaurantId: string, status: string, changedById?: string, notes?: string) {
    const order = await this.getOrderById(id, restaurantId);
    const previousStatus = order.status;

    await db.update(orders).set({ status: status as any }).where(eq(orders.id, id));
    
    await db.insert(orderStatusHistory).values({
      id: crypto.randomUUID(),
      orderId: id,
      status,
      previousStatus,
      changedById,
      notes,
    });

    return this.getOrderById(id, restaurantId);
  }

  async updatePaymentStatus(id: string, restaurantId: string, paymentStatus: string) {
    await this.getOrderById(id, restaurantId);
    await db.update(orders).set({ paymentStatus: paymentStatus as any }).where(eq(orders.id, id));
    return this.getOrderById(id, restaurantId);
  }

  async cancelOrder(id: string, restaurantId: string, reason?: string, cancelledById?: string) {
    await this.getOrderById(id, restaurantId);
    await db.update(orders).set({
      status: "cancelled",
      cancellationReason: reason,
      cancelledById,
      cancelledAt: new Date(),
    }).where(eq(orders.id, id));
    return this.getOrderById(id, restaurantId);
  }

  async closeOrder(id: string, restaurantId: string) {
    await this.getOrderById(id, restaurantId);
    await db.update(orders).set({
      status: "paid",
      paymentStatus: "paid",
      closedAt: new Date(),
    }).where(eq(orders.id, id));
    return this.getOrderById(id, restaurantId);
  }

  async getTables(restaurantId: string) {
    return db.select().from(tables)
      .where(eq(tables.restaurantId, restaurantId))
      .orderBy(tables.number);
  }

  async getTableById(id: string, restaurantId: string) {
    const [table] = await db.select().from(tables)
      .where(and(eq(tables.id, id), eq(tables.restaurantId, restaurantId)));
    if (!table) throw AppError.notFound("Mesa no encontrada");
    return table;
  }

  async createTable(data: {
    restaurantId: string;
    name: string;
    number: number;
    capacity?: number;
    section?: string;
    posX?: number;
    posY?: number;
  }) {
    const [table] = await db.insert(tables).values({
      id: crypto.randomUUID(),
      status: "available" as any,
      ...data,
    }).$returningId();
    return table;
  }

  async updateTable(id: string, restaurantId: string, data: Partial<typeof tables.$inferInsert>) {
    await this.getTableById(id, restaurantId);
    await db.update(tables).set(data).where(eq(tables.id, id));
    return this.getTableById(id, restaurantId);
  }

  async deleteTable(id: string, restaurantId: string) {
    await this.getTableById(id, restaurantId);
    await db.update(tables).set({ isActive: false }).where(eq(tables.id, id));
  }
}

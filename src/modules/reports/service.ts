import { db } from "../../db/index.js";
import { auditLogs, scheduledReports, orders, orderItems, payments, products } from "../../db/schema/index.js";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";
import { AppError } from "../../shared/errors/AppError.js";

export class ReportsService {
  async getAuditLogs(restaurantId: string, entityType?: string, action?: string) {
    const conditions = [eq(auditLogs.restaurantId, restaurantId)];
    if (entityType) conditions.push(eq(auditLogs.entityType, entityType));
    if (action) conditions.push(eq(auditLogs.action, action));
    
    return db.select().from(auditLogs)
      .where(and(...conditions))
      .orderBy(desc(auditLogs.createdAt))
      .limit(1000);
  }

  async createAuditLog(data: {
    restaurantId: string;
    userId?: string;
    action: string;
    entityType: string;
    entityId?: string;
    previousData?: any;
    newData?: any;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const [log] = await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      ...data,
    }).$returningId();
    return log;
  }

  async getScheduledReports(restaurantId: string) {
    return db.select().from(scheduledReports)
      .where(eq(scheduledReports.restaurantId, restaurantId))
      .orderBy(desc(scheduledReports.createdAt));
  }

  async getScheduledReportById(id: string, restaurantId: string) {
    const [report] = await db.select().from(scheduledReports)
      .where(and(eq(scheduledReports.id, id), eq(scheduledReports.restaurantId, restaurantId)));
    if (!report) throw AppError.notFound("Reporte programado no encontrado");
    return report;
  }

  async createScheduledReport(data: {
    restaurantId: string;
    name: string;
    type: "sales" | "inventory" | "financial" | "staff" | "custom";
    frequency: "daily" | "weekly" | "monthly";
    config?: any;
    recipients?: any;
  }) {
    const [report] = await db.insert(scheduledReports).values({
      id: crypto.randomUUID(),
      isActive: true,
      ...data,
    }).$returningId();
    return report;
  }

  async updateScheduledReport(id: string, restaurantId: string, data: any) {
    await this.getScheduledReportById(id, restaurantId);
    await db.update(scheduledReports).set({
      ...data,
      updatedAt: new Date(),
    }).where(eq(scheduledReports.id, id));
    return this.getScheduledReportById(id, restaurantId);
  }

  async deleteScheduledReport(id: string, restaurantId: string) {
    await this.getScheduledReportById(id, restaurantId);
    await db.delete(scheduledReports).where(eq(scheduledReports.id, id));
  }

  async getSalesReport(restaurantId: string, startDate: Date, endDate: Date) {
    const salesData = await db.select({
      totalOrders: sql<number>`count(*)`,
      totalRevenue: sql<string>`sum(${orders.total})`,
      totalTax: sql<string>`sum(${orders.taxAmount})`,
      totalTips: sql<string>`sum(${orders.tipAmount})`,
      totalDiscounts: sql<string>`sum(${orders.discountAmount})`,
      averageOrderValue: sql<string>`avg(${orders.total})`,
    }).from(orders)
      .where(
        and(
          eq(orders.restaurantId, restaurantId),
          gte(orders.createdAt, startDate),
          lte(orders.createdAt, endDate)
        )
      );

    const salesByType = await db.select({
      type: orders.type,
      count: sql<number>`count(*)`,
      revenue: sql<string>`sum(${orders.total})`,
    }).from(orders)
      .where(
        and(
          eq(orders.restaurantId, restaurantId),
          gte(orders.createdAt, startDate),
          lte(orders.createdAt, endDate)
        )
      )
      .groupBy(orders.type);

    const topProducts = await db.select({
      productId: orderItems.productId,
      productName: orderItems.productName,
      totalQuantity: sql<number>`sum(${orderItems.quantity})`,
      totalRevenue: sql<string>`sum(${orderItems.totalPrice})`,
    }).from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(
        and(
          eq(orders.restaurantId, restaurantId),
          gte(orders.createdAt, startDate),
          lte(orders.createdAt, endDate)
        )
      )
      .groupBy(orderItems.productId, orderItems.productName)
      .orderBy(sql`sum(${orderItems.totalPrice}) desc`)
      .limit(10);

    const paymentMethods = await db.select({
      method: payments.method,
      count: sql<number>`count(*)`,
      total: sql<string>`sum(${payments.amount})`,
    }).from(payments)
      .innerJoin(orders, eq(payments.orderId, orders.id))
      .where(
        and(
          eq(orders.restaurantId, restaurantId),
          gte(payments.createdAt, startDate),
          lte(payments.createdAt, endDate)
        )
      )
      .groupBy(payments.method);

    return {
      summary: salesData[0],
      byType: salesByType,
      topProducts,
      paymentMethods,
      period: { startDate, endDate },
    };
  }

  async getDailySales(restaurantId: string, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.getSalesReport(restaurantId, startOfDay, endOfDay);
  }

  async getInventoryReport(restaurantId: string) {
    const lowStock = await db.select().from(products)
      .where(
        and(
          eq(products.restaurantId, restaurantId),
          eq(products.isActive, true)
        )
      )
      .orderBy(products.name);

    return {
      lowStock,
      totalProducts: lowStock.length,
    };
  }
}

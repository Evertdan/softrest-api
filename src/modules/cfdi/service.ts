import { db } from "../../db/index.js";
import { cfdiInvoices } from "../../db/schema/index.js";
import { eq, and, desc } from "drizzle-orm";
import { AppError } from "../../shared/errors/AppError.js";

export class CfdiService {
  async getInvoices(restaurantId: string, status?: string) {
    if (status) {
      return db.select().from(cfdiInvoices)
        .where(and(eq(cfdiInvoices.restaurantId, restaurantId), eq(cfdiInvoices.status, status as any)))
        .orderBy(desc(cfdiInvoices.createdAt));
    }
    return db.select().from(cfdiInvoices)
      .where(eq(cfdiInvoices.restaurantId, restaurantId))
      .orderBy(desc(cfdiInvoices.createdAt));
  }

  async getInvoiceById(id: string, restaurantId: string) {
    const [invoice] = await db.select().from(cfdiInvoices)
      .where(and(eq(cfdiInvoices.id, id), eq(cfdiInvoices.restaurantId, restaurantId)));
    if (!invoice) throw AppError.notFound("Factura no encontrada");
    return invoice;
  }

  async createInvoice(data: {
    restaurantId: string;
    orderId?: string;
    clientId?: string;
    uuid: string;
    serie?: string;
    folio?: string;
    total: string;
    subtotal: string;
    taxAmount?: string;
    currency?: string;
    exchangeRate?: string;
    paymentMethod?: string;
    paymentForm?: string;
    cfdiUse?: string;
  }) {
    const [invoice] = await db.insert(cfdiInvoices).values({
      id: crypto.randomUUID(),
      status: "pending",
      ...data,
      paymentMethod: data.paymentMethod as any,
      paymentForm: data.paymentForm as any,
      cfdiUse: data.cfdiUse as any,
    }).$returningId();
    return invoice;
  }

  async updateInvoice(id: string, restaurantId: string, data: any) {
    await this.getInvoiceById(id, restaurantId);
    await db.update(cfdiInvoices).set({
      ...data,
      updatedAt: new Date(),
    }).where(eq(cfdiInvoices.id, id));
    return this.getInvoiceById(id, restaurantId);
  }

  async cancelInvoice(id: string, restaurantId: string, reason?: string) {
    await this.getInvoiceById(id, restaurantId);
    await db.update(cfdiInvoices).set({
      status: "cancelled",
      cancelledAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(cfdiInvoices.id, id));
    return this.getInvoiceById(id, restaurantId);
  }

  async deleteInvoice(id: string, restaurantId: string) {
    await this.getInvoiceById(id, restaurantId);
    await db.delete(cfdiInvoices).where(eq(cfdiInvoices.id, id));
  }

  async stampInvoice(id: string, restaurantId: string, pacResponse?: any) {
    await this.getInvoiceById(id, restaurantId);
    await db.update(cfdiInvoices).set({
      status: "stamped",
      pacResponse,
      updatedAt: new Date(),
    }).where(eq(cfdiInvoices.id, id));
    return this.getInvoiceById(id, restaurantId);
  }
}

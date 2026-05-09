import { db } from "../../db/index.js";
import { cashRegisters, payments, paymentSplits } from "../../db/schema/index.js";
import { eq, and, desc } from "drizzle-orm";
import { AppError } from "../../shared/errors/AppError.js";

export class CashRegisterService {
  async getCashRegisters(restaurantId: string) {
    return db.select().from(cashRegisters)
      .where(eq(cashRegisters.restaurantId, restaurantId))
      .orderBy(desc(cashRegisters.createdAt));
  }

  async getCashRegisterById(id: string, restaurantId: string) {
    const [register] = await db.select().from(cashRegisters)
      .where(and(eq(cashRegisters.id, id), eq(cashRegisters.restaurantId, restaurantId)));
    if (!register) throw AppError.notFound("Caja no encontrada");
    return register;
  }

  async openCashRegister(data: {
    restaurantId: string;
    userId: string;
    name: string;
    openingAmount: string;
    notes?: string;
  }) {
    const [register] = await db.insert(cashRegisters).values({
      id: crypto.randomUUID(),
      status: "open",
      ...data,
    }).$returningId();
    return register;
  }

  async updateCashRegister(id: string, restaurantId: string, data: any) {
    await this.getCashRegisterById(id, restaurantId);
    await db.update(cashRegisters).set({
      ...data,
      updatedAt: new Date(),
    }).where(eq(cashRegisters.id, id));
    return this.getCashRegisterById(id, restaurantId);
  }

  async deleteCashRegister(id: string, restaurantId: string) {
    await this.getCashRegisterById(id, restaurantId);
    await db.delete(cashRegisters).where(eq(cashRegisters.id, id));
  }

  async closeCashRegister(id: string, restaurantId: string, data: {
    closingAmount: string;
    expectedAmount?: string;
    difference?: string;
    notes?: string;
  }) {
    await this.getCashRegisterById(id, restaurantId);
    await db.update(cashRegisters).set({
      status: "closed",
      ...data,
      closedAt: new Date(),
    }).where(eq(cashRegisters.id, id));
    return this.getCashRegisterById(id, restaurantId);
  }

  async getPayments(cashRegisterId?: string, orderId?: string) {
    if (cashRegisterId) {
      return db.select().from(payments)
        .where(eq(payments.cashRegisterId, cashRegisterId))
        .orderBy(desc(payments.createdAt));
    }
    if (orderId) {
      return db.select().from(payments)
        .where(eq(payments.orderId, orderId))
        .orderBy(desc(payments.createdAt));
    }
    return db.select().from(payments).orderBy(desc(payments.createdAt));
  }

  async getPaymentById(id: string) {
    const [payment] = await db.select().from(payments)
      .where(eq(payments.id, id));
    if (!payment) throw AppError.notFound("Pago no encontrado");
    return payment;
  }

  async createPayment(data: {
    orderId: string;
    cashRegisterId?: string;
    userId: string;
    amount: string;
    tip?: string;
    method: any;
    reference?: string;
    terminalId?: string;
    authCode?: string;
    metadata?: any;
  }) {
    const [payment] = await db.insert(payments).values({
      id: crypto.randomUUID(),
      status: "completed",
      ...data,
    }).$returningId();
    return payment;
  }

  async createPaymentSplit(data: {
    paymentId: string;
    method: any;
    amount: string;
    reference?: string;
  }) {
    const [split] = await db.insert(paymentSplits).values({
      id: crypto.randomUUID(),
      ...data,
    }).$returningId();
    return split;
  }

  async getPaymentSplits(paymentId: string) {
    return db.select().from(paymentSplits)
      .where(eq(paymentSplits.paymentId, paymentId));
  }
}

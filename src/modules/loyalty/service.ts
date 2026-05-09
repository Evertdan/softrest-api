import { db } from "../../db/index.js";
import { loyaltyPrograms, loyaltyAccounts, loyaltyTransactions, clients } from "../../db/schema/index.js";
import { eq, and, desc } from "drizzle-orm";
import { AppError } from "../../shared/errors/AppError.js";

export class LoyaltyService {
  async getPrograms(restaurantId: string) {
    return db.select().from(loyaltyPrograms)
      .where(eq(loyaltyPrograms.restaurantId, restaurantId))
      .orderBy(desc(loyaltyPrograms.createdAt));
  }

  async getProgramById(id: string, restaurantId: string) {
    const [program] = await db.select().from(loyaltyPrograms)
      .where(and(eq(loyaltyPrograms.id, id), eq(loyaltyPrograms.restaurantId, restaurantId)));
    if (!program) throw AppError.notFound("Programa de lealtad no encontrado");
    return program;
  }

  async createProgram(data: {
    restaurantId: string;
    name: string;
    description?: string;
    pointsPerCurrency?: string;
    currencyPerPoint?: string;
    minRedemption?: number;
    expirationDays?: number;
  }) {
    const [program] = await db.insert(loyaltyPrograms).values({
      id: crypto.randomUUID(),
      isActive: true,
      ...data,
    }).$returningId();
    return program;
  }

  async updateProgram(id: string, restaurantId: string, data: any) {
    await this.getProgramById(id, restaurantId);
    await db.update(loyaltyPrograms).set({
      ...data,
      updatedAt: new Date(),
    }).where(eq(loyaltyPrograms.id, id));
    return this.getProgramById(id, restaurantId);
  }

  async deleteProgram(id: string, restaurantId: string) {
    await this.getProgramById(id, restaurantId);
    await db.delete(loyaltyPrograms).where(eq(loyaltyPrograms.id, id));
  }

  async getAccounts(programId?: string, clientId?: string) {
    const conditions = [];
    if (programId) conditions.push(eq(loyaltyAccounts.programId, programId));
    if (clientId) conditions.push(eq(loyaltyAccounts.clientId, clientId));
    
    if (conditions.length > 0) {
      return db.select().from(loyaltyAccounts)
        .where(and(...conditions))
        .orderBy(desc(loyaltyAccounts.updatedAt));
    }
    return db.select().from(loyaltyAccounts).orderBy(desc(loyaltyAccounts.updatedAt));
  }

  async getAccountById(id: string) {
    const [account] = await db.select().from(loyaltyAccounts)
      .where(eq(loyaltyAccounts.id, id));
    if (!account) throw AppError.notFound("Cuenta de lealtad no encontrada");
    return account;
  }

  async createAccount(data: {
    clientId: string;
    programId: string;
  }) {
    const [account] = await db.insert(loyaltyAccounts).values({
      id: crypto.randomUUID(),
      pointsBalance: 0,
      totalEarned: 0,
      totalRedeemed: 0,
      ...data,
    }).$returningId();
    return account;
  }

  async getTransactions(accountId: string) {
    return db.select().from(loyaltyTransactions)
      .where(eq(loyaltyTransactions.accountId, accountId))
      .orderBy(desc(loyaltyTransactions.createdAt));
  }

  async addTransaction(data: {
    accountId: string;
    orderId?: string;
    type: any;
    points: number;
    description?: string;
    expiresAt?: Date;
  }) {
    const [transaction] = await db.insert(loyaltyTransactions).values({
      id: crypto.randomUUID(),
      ...data,
    }).$returningId();

    const account = await this.getAccountById(data.accountId);
    let newBalance = account.pointsBalance!;
    let newEarned = account.totalEarned!;
    let newRedeemed = account.totalRedeemed!;

    if (data.type === "earn" || data.type === "bonus") {
      newBalance += data.points;
      newEarned += data.points;
    } else if (data.type === "redeem") {
      newBalance -= data.points;
      newRedeemed += data.points;
    } else if (data.type === "expire" || data.type === "adjustment") {
      newBalance += data.points;
    }

    await db.update(loyaltyAccounts).set({
      pointsBalance: newBalance,
      totalEarned: newEarned,
      totalRedeemed: newRedeemed,
      lastActivityAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(loyaltyAccounts.id, data.accountId));

    return transaction;
  }

  async getClients(restaurantId: string) {
    return db.select().from(clients)
      .where(eq(clients.restaurantId, restaurantId))
      .orderBy(desc(clients.createdAt));
  }

  async getClientById(id: string, restaurantId: string) {
    const [client] = await db.select().from(clients)
      .where(and(eq(clients.id, id), eq(clients.restaurantId, restaurantId)));
    if (!client) throw AppError.notFound("Cliente no encontrado");
    return client;
  }

  async createClient(data: {
    restaurantId: string;
    name: string;
    email?: string;
    phone?: string;
    rfc?: string;
    usoCfdi?: string;
    fiscalRegime?: string;
    postalCode?: string;
    address?: string;
    birthday?: Date;
    notes?: string;
  }) {
    const [client] = await db.insert(clients).values({
      id: crypto.randomUUID(),
      isActive: true,
      ...data,
    }).$returningId();
    return client;
  }

  async updateClient(id: string, restaurantId: string, data: any) {
    await this.getClientById(id, restaurantId);
    await db.update(clients).set({
      ...data,
      updatedAt: new Date(),
    }).where(eq(clients.id, id));
    return this.getClientById(id, restaurantId);
  }

  async deleteClient(id: string, restaurantId: string) {
    await this.getClientById(id, restaurantId);
    await db.delete(clients).where(eq(clients.id, id));
  }
}

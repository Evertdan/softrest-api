import { FastifyInstance } from "fastify";
import { z } from "zod";
import { LoyaltyService } from "./service.js";
import { authenticate } from "../../shared/middleware/auth.js";

const loyaltyService = new LoyaltyService();

interface QueryParams {
  restaurantId?: string;
  programId?: string;
  clientId?: string;
}

const programSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  pointsPerCurrency: z.string().optional(),
  currencyPerPoint: z.string().optional(),
  minRedemption: z.number().optional(),
  expirationDays: z.number().optional(),
});

const accountSchema = z.object({
  clientId: z.string().uuid(),
  programId: z.string().uuid(),
});

const transactionSchema = z.object({
  accountId: z.string().uuid(),
  orderId: z.string().uuid().optional(),
  type: z.enum(["earn", "redeem", "bonus", "expire", "adjustment"]),
  points: z.number().min(1),
  description: z.string().optional(),
  expiresAt: z.string().optional(),
});

const clientSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  rfc: z.string().optional(),
  usoCfdi: z.string().optional(),
  fiscalRegime: z.string().optional(),
  postalCode: z.string().optional(),
  address: z.string().optional(),
  birthday: z.string().optional(),
  notes: z.string().optional(),
});

export default async function loyaltyRoutes(app: FastifyInstance) {
  app.get("/loyalty-programs", { preHandler: [authenticate] }, async (request, reply) => {
    const query = request.query as QueryParams;
    const restaurantId = query.restaurantId || "default";
    const programs = await loyaltyService.getPrograms(restaurantId);
    return reply.send(programs);
  });

  app.get("/loyalty-programs/:id", { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const query = request.query as QueryParams;
    const restaurantId = query.restaurantId || "default";
    const program = await loyaltyService.getProgramById(id, restaurantId);
    return reply.send(program);
  });

  app.post("/loyalty-programs", { preHandler: [authenticate] }, async (request, reply) => {
    const result = programSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({ statusCode: 400, error: "Bad Request", details: result.error.errors });
    }
    const query = request.query as QueryParams;
    const restaurantId = query.restaurantId || "default";
    const program = await loyaltyService.createProgram({ ...result.data, restaurantId });
    return reply.status(201).send(program);
  });

  app.put("/loyalty-programs/:id", { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const query = request.query as QueryParams;
    const restaurantId = query.restaurantId || "default";
    const program = await loyaltyService.updateProgram(id, restaurantId, request.body);
    return reply.send(program);
  });

  app.delete("/loyalty-programs/:id", { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const query = request.query as QueryParams;
    const restaurantId = query.restaurantId || "default";
    await loyaltyService.deleteProgram(id, restaurantId);
    return reply.status(204).send();
  });

  app.get("/loyalty-accounts", { preHandler: [authenticate] }, async (request, reply) => {
    const query = request.query as QueryParams;
    const programId = query.programId;
    const clientId = query.clientId;
    const accounts = await loyaltyService.getAccounts(programId, clientId);
    return reply.send(accounts);
  });

  app.get("/loyalty-accounts/:id", { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const account = await loyaltyService.getAccountById(id);
    return reply.send(account);
  });

  app.post("/loyalty-accounts", { preHandler: [authenticate] }, async (request, reply) => {
    const result = accountSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({ statusCode: 400, error: "Bad Request", details: result.error.errors });
    }
    const account = await loyaltyService.createAccount(result.data);
    return reply.status(201).send(account);
  });

  app.get("/loyalty-accounts/:id/transactions", { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const transactions = await loyaltyService.getTransactions(id);
    return reply.send(transactions);
  });

  app.post("/loyalty-transactions", { preHandler: [authenticate] }, async (request, reply) => {
    const result = transactionSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({ statusCode: 400, error: "Bad Request", details: result.error.errors });
    }
    const data = result.data;
    const transactionData: any = {
      accountId: data.accountId,
      orderId: data.orderId,
      type: data.type,
      points: data.points,
      description: data.description,
    };
    if (data.expiresAt) {
      transactionData.expiresAt = new Date(data.expiresAt);
    }
    const transaction = await loyaltyService.addTransaction(transactionData);
    return reply.status(201).send(transaction);
  });

  app.get("/clients", { preHandler: [authenticate] }, async (request, reply) => {
    const query = request.query as QueryParams;
    const restaurantId = query.restaurantId || "default";
    const clients = await loyaltyService.getClients(restaurantId);
    return reply.send(clients);
  });

  app.get("/clients/:id", { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const query = request.query as QueryParams;
    const restaurantId = query.restaurantId || "default";
    const client = await loyaltyService.getClientById(id, restaurantId);
    return reply.send(client);
  });

  app.post("/clients", { preHandler: [authenticate] }, async (request, reply) => {
    const result = clientSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({ statusCode: 400, error: "Bad Request", details: result.error.errors });
    }
    const query = request.query as QueryParams;
    const restaurantId = query.restaurantId || "default";
    const data = result.data;
    const clientData: any = {
      restaurantId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      rfc: data.rfc,
      usoCfdi: data.usoCfdi,
      fiscalRegime: data.fiscalRegime,
      postalCode: data.postalCode,
      address: data.address,
      notes: data.notes,
    };
    if (data.birthday) {
      clientData.birthday = new Date(data.birthday);
    }
    const client = await loyaltyService.createClient(clientData);
    return reply.status(201).send(client);
  });

  app.put("/clients/:id", { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const query = request.query as QueryParams;
    const restaurantId = query.restaurantId || "default";
    const client = await loyaltyService.updateClient(id, restaurantId, request.body);
    return reply.send(client);
  });

  app.delete("/clients/:id", { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const query = request.query as QueryParams;
    const restaurantId = query.restaurantId || "default";
    await loyaltyService.deleteClient(id, restaurantId);
    return reply.status(204).send();
  });
}

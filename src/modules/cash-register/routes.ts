import { FastifyInstance } from "fastify";
import { z } from "zod";
import { CashRegisterService } from "./service.js";
import { authenticate } from "../../shared/middleware/auth.js";

const cashRegisterService = new CashRegisterService();

const openCashRegisterSchema = z.object({
  name: z.string().min(1),
  openingAmount: z.string().min(1),
  notes: z.string().optional(),
});

const closeCashRegisterSchema = z.object({
  closingAmount: z.string().min(1),
  expectedAmount: z.string().optional(),
  difference: z.string().optional(),
  notes: z.string().optional(),
});

const paymentSchema = z.object({
  orderId: z.string().uuid(),
  cashRegisterId: z.string().uuid().optional(),
  amount: z.string().min(1),
  tip: z.string().optional(),
  method: z.enum(["cash", "card", "transfer", "wallet", "crypto", "mixed"]),
  reference: z.string().optional(),
  terminalId: z.string().optional(),
  authCode: z.string().optional(),
  metadata: z.any().optional(),
});

const paymentSplitSchema = z.object({
  paymentId: z.string().uuid(),
  method: z.enum(["cash", "card", "transfer", "wallet", "crypto"]),
  amount: z.string().min(1),
  reference: z.string().optional(),
});

export default async function cashRegisterRoutes(app: FastifyInstance) {
  app.get("/cash-registers", { preHandler: [authenticate] }, async (request, reply) => {
    const restaurantId = request.query?.restaurantId as string || "default";
    const registers = await cashRegisterService.getCashRegisters(restaurantId);
    return reply.send(registers);
  });

  app.get("/cash-registers/:id", { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const restaurantId = request.query?.restaurantId as string || "default";
    const register = await cashRegisterService.getCashRegisterById(id, restaurantId);
    return reply.send(register);
  });

  app.post("/cash-registers/open", { preHandler: [authenticate] }, async (request, reply) => {
    const result = openCashRegisterSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({ statusCode: 400, error: "Bad Request", details: result.error.errors });
    }
    const restaurantId = request.query?.restaurantId as string || "default";
    const userId = request.user?.userId || "default";
    const register = await cashRegisterService.openCashRegister({ ...result.data, restaurantId, userId });
    return reply.status(201).send(register);
  });

  app.post("/cash-registers/:id/close", { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = closeCashRegisterSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({ statusCode: 400, error: "Bad Request", details: result.error.errors });
    }
    const restaurantId = request.query?.restaurantId as string || "default";
    const register = await cashRegisterService.closeCashRegister(id, restaurantId, result.data);
    return reply.send(register);
  });

  app.get("/payments", { preHandler: [authenticate] }, async (request, reply) => {
    const cashRegisterId = request.query?.cashRegisterId as string | undefined;
    const orderId = request.query?.orderId as string | undefined;
    const items = await cashRegisterService.getPayments(cashRegisterId, orderId);
    return reply.send(items);
  });

  app.get("/payments/:id", { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const payment = await cashRegisterService.getPaymentById(id);
    return reply.send(payment);
  });

  app.post("/payments", { preHandler: [authenticate] }, async (request, reply) => {
    const result = paymentSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({ statusCode: 400, error: "Bad Request", details: result.error.errors });
    }
    const userId = request.user?.userId || "default";
    const payment = await cashRegisterService.createPayment({ ...result.data, userId });
    return reply.status(201).send(payment);
  });

  app.get("/payments/:id/splits", { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const splits = await cashRegisterService.getPaymentSplits(id);
    return reply.send(splits);
  });

  app.post("/payment-splits", { preHandler: [authenticate] }, async (request, reply) => {
    const result = paymentSplitSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({ statusCode: 400, error: "Bad Request", details: result.error.errors });
    }
    const split = await cashRegisterService.createPaymentSplit(result.data);
    return reply.status(201).send(split);
  });
}

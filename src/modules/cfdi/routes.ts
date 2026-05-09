import { FastifyInstance } from "fastify";
import { z } from "zod";
import { CfdiService } from "./service.js";
import { authenticate } from "../../shared/middleware/auth.js";

const cfdiService = new CfdiService();

const createInvoiceSchema = z.object({
  orderId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
  uuid: z.string().min(1),
  serie: z.string().optional(),
  folio: z.string().optional(),
  total: z.string().min(1),
  subtotal: z.string().min(1),
  taxAmount: z.string().optional(),
  currency: z.string().optional(),
  exchangeRate: z.string().optional(),
  paymentMethod: z.enum(["PUE", "PPD"]).optional(),
  paymentForm: z.enum(["01", "02", "03", "04", "05", "06", "08", "12", "13", "14", "15", "17", "23", "24", "25", "26", "27", "28", "29", "30", "31", "99"]).optional(),
  cfdiUse: z.enum(["G01", "G02", "G03", "I01", "I02", "I03", "I04", "I05", "I06", "I07", "I08", "D01", "D02", "D03", "D04", "D05", "D06", "D07", "D08", "D09", "D10", "P01", "S01", "CP01", "CN01"]).optional(),
});

const updateInvoiceSchema = z.object({
  serie: z.string().optional(),
  folio: z.string().optional(),
  total: z.string().optional(),
  subtotal: z.string().optional(),
  taxAmount: z.string().optional(),
  currency: z.string().optional(),
  exchangeRate: z.string().optional(),
  paymentMethod: z.enum(["PUE", "PPD"]).optional(),
  paymentForm: z.enum(["01", "02", "03", "04", "05", "06", "08", "12", "13", "14", "15", "17", "23", "24", "25", "26", "27", "28", "29", "30", "31", "99"]).optional(),
  cfdiUse: z.enum(["G01", "G02", "G03", "I01", "I02", "I03", "I04", "I05", "I06", "I07", "I08", "D01", "D02", "D03", "D04", "D05", "D06", "D07", "D08", "D09", "D10", "P01", "S01", "CP01", "CN01"]).optional(),
});

export default async function cfdiRoutes(app: FastifyInstance) {
  app.get("/cfdi", { preHandler: [authenticate] }, async (request, reply) => {
    const restaurantId = request.query?.restaurantId as string || "default";
    const status = request.query?.status as string | undefined;
    const invoices = await cfdiService.getInvoices(restaurantId, status);
    return reply.send(invoices);
  });

  app.get("/cfdi/:id", { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const restaurantId = request.query?.restaurantId as string || "default";
    const invoice = await cfdiService.getInvoiceById(id, restaurantId);
    return reply.send(invoice);
  });

  app.post("/cfdi", { preHandler: [authenticate] }, async (request, reply) => {
    const result = createInvoiceSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({ statusCode: 400, error: "Bad Request", details: result.error.errors });
    }
    const restaurantId = request.query?.restaurantId as string || "default";
    const invoice = await cfdiService.createInvoice({ ...result.data, restaurantId });
    return reply.status(201).send(invoice);
  });

  app.put("/cfdi/:id", { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = updateInvoiceSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({ statusCode: 400, error: "Bad Request", details: result.error.errors });
    }
    const restaurantId = request.query?.restaurantId as string || "default";
    const invoice = await cfdiService.updateInvoice(id, restaurantId, result.data);
    return reply.send(invoice);
  });

  app.delete("/cfdi/:id", { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const restaurantId = request.query?.restaurantId as string || "default";
    await cfdiService.deleteInvoice(id, restaurantId);
    return reply.status(204).send();
  });

  app.post("/cfdi/:id/cancel", { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const restaurantId = request.query?.restaurantId as string || "default";
    const { reason } = request.body as { reason?: string };
    const invoice = await cfdiService.cancelInvoice(id, restaurantId, reason);
    return reply.send(invoice);
  });

  app.post("/cfdi/:id/stamp", { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const restaurantId = request.query?.restaurantId as string || "default";
    const { pacResponse } = request.body as { pacResponse?: any };
    const invoice = await cfdiService.stampInvoice(id, restaurantId, pacResponse);
    return reply.send(invoice);
  });
}

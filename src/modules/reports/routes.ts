import { FastifyInstance } from "fastify";
import { z } from "zod";
import { ReportsService } from "./service.js";
import { authenticate } from "../../shared/middleware/auth.js";

const reportsService = new ReportsService();

const scheduledReportSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["sales", "inventory", "financial", "staff", "custom"]),
  frequency: z.enum(["daily", "weekly", "monthly"]),
  config: z.any().optional(),
  recipients: z.any().optional(),
});

const auditLogSchema = z.object({
  action: z.string().min(1),
  entityType: z.string().min(1),
  entityId: z.string().optional(),
  previousData: z.any().optional(),
  newData: z.any().optional(),
});

export default async function reportsRoutes(app: FastifyInstance) {
  app.get("/reports/audit-logs", { preHandler: [authenticate] }, async (request, reply) => {
    const restaurantId = request.query?.restaurantId as string || "default";
    const entityType = request.query?.entityType as string | undefined;
    const action = request.query?.action as string | undefined;
    const logs = await reportsService.getAuditLogs(restaurantId, entityType, action);
    return reply.send(logs);
  });

  app.post("/reports/audit-logs", { preHandler: [authenticate] }, async (request, reply) => {
    const result = auditLogSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({ statusCode: 400, error: "Bad Request", details: result.error.errors });
    }
    const restaurantId = request.query?.restaurantId as string || "default";
    const userId = request.user?.userId;
    const log = await reportsService.createAuditLog({
      ...result.data,
      restaurantId,
      userId,
      ipAddress: request.ip,
      userAgent: request.headers["user-agent"] as string,
    });
    return reply.status(201).send(log);
  });

  app.get("/reports/scheduled", { preHandler: [authenticate] }, async (request, reply) => {
    const restaurantId = request.query?.restaurantId as string || "default";
    const reports = await reportsService.getScheduledReports(restaurantId);
    return reply.send(reports);
  });

  app.get("/reports/scheduled/:id", { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const restaurantId = request.query?.restaurantId as string || "default";
    const report = await reportsService.getScheduledReportById(id, restaurantId);
    return reply.send(report);
  });

  app.post("/reports/scheduled", { preHandler: [authenticate] }, async (request, reply) => {
    const result = scheduledReportSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({ statusCode: 400, error: "Bad Request", details: result.error.errors });
    }
    const restaurantId = request.query?.restaurantId as string || "default";
    const report = await reportsService.createScheduledReport({ ...result.data, restaurantId });
    return reply.status(201).send(report);
  });

  app.put("/reports/scheduled/:id", { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const restaurantId = request.query?.restaurantId as string || "default";
    const report = await reportsService.updateScheduledReport(id, restaurantId, request.body);
    return reply.send(report);
  });

  app.delete("/reports/scheduled/:id", { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const restaurantId = request.query?.restaurantId as string || "default";
    await reportsService.deleteScheduledReport(id, restaurantId);
    return reply.status(204).send();
  });

  app.get("/reports/sales", { preHandler: [authenticate] }, async (request, reply) => {
    const restaurantId = request.query?.restaurantId as string || "default";
    const startDate = request.query?.startDate as string;
    const endDate = request.query?.endDate as string;

    if (!startDate || !endDate) {
      return reply.status(400).send({
        statusCode: 400,
        error: "Bad Request",
        message: "startDate y endDate son requeridos",
      });
    }

    const report = await reportsService.getSalesReport(
      restaurantId,
      new Date(startDate),
      new Date(endDate)
    );
    return reply.send(report);
  });

  app.get("/reports/sales/daily", { preHandler: [authenticate] }, async (request, reply) => {
    const restaurantId = request.query?.restaurantId as string || "default";
    const date = request.query?.date as string;

    if (!date) {
      return reply.status(400).send({
        statusCode: 400,
        error: "Bad Request",
        message: "date es requerido",
      });
    }

    const report = await reportsService.getDailySales(restaurantId, new Date(date));
    return reply.send(report);
  });

  app.get("/reports/inventory", { preHandler: [authenticate] }, async (request, reply) => {
    const restaurantId = request.query?.restaurantId as string || "default";
    const report = await reportsService.getInventoryReport(restaurantId);
    return reply.send(report);
  });
}

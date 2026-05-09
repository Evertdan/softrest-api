import { FastifyInstance } from "fastify";
import { z } from "zod";
import { InventoryService } from "./service.js";
import { authenticate, AuthenticatedUser } from "../../shared/middleware/auth.js";

const inventoryService = new InventoryService();

interface QueryParams {
  restaurantId?: string;
}

const itemSchema = z.object({
  productId: z.string().uuid().optional(),
  name: z.string().min(1),
  sku: z.string().optional(),
  unit: z.enum(["kg", "g", "l", "ml", "unit", "box", "pack", "dozen"]).optional(),
  currentStock: z.string().optional(),
  minStock: z.string().optional(),
  maxStock: z.string().optional(),
  reorderPoint: z.string().optional(),
  costPerUnit: z.string().optional(),
  location: z.string().optional(),
});

const movementSchema = z.object({
  inventoryItemId: z.string().uuid(),
  type: z.enum(["purchase", "sale", "adjustment", "waste", "transfer_in", "transfer_out", "return"]),
  quantity: z.string().min(1),
  previousStock: z.string().min(1),
  newStock: z.string().min(1),
  unitCost: z.string().optional(),
  totalCost: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

const recipeSchema = z.object({
  productId: z.string().uuid(),
  name: z.string().min(1),
  yieldQuantity: z.string().optional(),
  yieldUnit: z.enum(["kg", "g", "l", "ml", "unit", "box", "pack", "dozen"]).optional(),
  instructions: z.string().optional(),
  preparationTime: z.number().optional(),
});

const recipeIngredientSchema = z.object({
  recipeId: z.string().uuid(),
  inventoryItemId: z.string().uuid(),
  quantity: z.string().min(1),
  unit: z.enum(["kg", "g", "l", "ml", "unit", "box", "pack", "dozen"]),
  notes: z.string().optional(),
});


interface QueryParams {
  restaurantId?: string;
}
export default async function inventoryRoutes(app: FastifyInstance) {
  app.get("/inventory", { preHandler: [authenticate] }, async (request, reply) => {
    const query = request.query as QueryParams;
    const restaurantId = query.restaurantId || "default";
    const items = await inventoryService.getItems(restaurantId);
    return reply.send(items);
  });

  app.get("/inventory/:id", { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const query = request.query as QueryParams;
    const restaurantId = query.restaurantId || "default";
    const item = await inventoryService.getItemById(id, restaurantId);
    return reply.send(item);
  });

  app.post("/inventory", { preHandler: [authenticate] }, async (request, reply) => {
    const result = itemSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({ statusCode: 400, error: "Bad Request", details: result.error.errors });
    }
    const query = request.query as QueryParams;
    const restaurantId = query.restaurantId || "default";
    const item = await inventoryService.createItem({ ...result.data, restaurantId });
    return reply.status(201).send(item);
  });

  app.patch("/inventory/:id", { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const query = request.query as QueryParams;
    const restaurantId = query.restaurantId || "default";
    const item = await inventoryService.updateItem(id, restaurantId, request.body as any);
    return reply.send(item);
  });

  app.delete("/inventory/:id", { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const query = request.query as QueryParams;
    const restaurantId = query.restaurantId || "default";
    await inventoryService.deleteItem(id, restaurantId);
    return reply.status(204).send();
  });

  app.get("/inventory/:id/movements", { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const movements = await inventoryService.getMovements(id);
    return reply.send(movements);
  });

  app.post("/inventory/movements", { preHandler: [authenticate] }, async (request, reply) => {
    const result = movementSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({ statusCode: 400, error: "Bad Request", details: result.error.errors });
    }
    const userId = (request.user as AuthenticatedUser | undefined)?.userId || "default";
    const movement = await inventoryService.addMovement({ ...result.data, userId });
    return reply.status(201).send(movement);
  });

  app.get("/recipes", { preHandler: [authenticate] }, async (request, reply) => {
    const recipes = await inventoryService.getRecipes();
    return reply.send(recipes);
  });

  app.get("/recipes/:id", { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const recipe = await inventoryService.getRecipeById(id);
    const ingredients = await inventoryService.getRecipeIngredients(id);
    return reply.send({ ...recipe, ingredients });
  });

  app.post("/recipes", { preHandler: [authenticate] }, async (request, reply) => {
    const result = recipeSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({ statusCode: 400, error: "Bad Request", details: result.error.errors });
    }
    const recipe = await inventoryService.createRecipe(result.data);
    return reply.status(201).send(recipe);
  });

  app.post("/recipes/ingredients", { preHandler: [authenticate] }, async (request, reply) => {
    const result = recipeIngredientSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({ statusCode: 400, error: "Bad Request", details: result.error.errors });
    }
    const ingredient = await inventoryService.addRecipeIngredient(result.data);
    return reply.status(201).send(ingredient);
  });
}

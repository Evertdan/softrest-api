import { FastifyInstance } from "fastify";
import { z } from "zod";
import { ProductsService } from "./service.js";
import { authenticate } from "../../shared/middleware/auth.js";

const productsService = new ProductsService();

const categorySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  sortOrder: z.number().optional(),
  parentId: z.string().uuid().optional(),
});

const productSchema = z.object({
  categoryId: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  sku: z.string().optional(),
  price: z.string().min(1),
  cost: z.string().optional(),
  imageUrl: z.string().optional(),
  barcode: z.string().optional(),
  preparationTime: z.number().optional(),
  allergens: z.any().optional(),
  nutritionalInfo: z.any().optional(),
  variants: z.any().optional(),
});

interface ProductQuery {
  restaurantId?: string;
  categoryId?: string;
  search?: string;
}

export default async function productsRoutes(app: FastifyInstance) {
  // Categories
  app.get("/categories", { preHandler: [authenticate] }, async (request, reply) => {
    const query = request.query as ProductQuery;
    const restaurantId = query.restaurantId || "default";
    const categories = await productsService.getCategories(restaurantId);
    return reply.send(categories);
  });

  app.get("/categories/:id", { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const query = request.query as ProductQuery;
    const restaurantId = query.restaurantId || "default";
    const category = await productsService.getCategoryById(id, restaurantId);
    return reply.send(category);
  });

  app.post("/categories", { preHandler: [authenticate] }, async (request, reply) => {
    const result = categorySchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({ statusCode: 400, error: "Bad Request", details: result.error.errors });
    }
    const query = request.query as ProductQuery;
    const restaurantId = query.restaurantId || "default";
    const category = await productsService.createCategory({ ...result.data, restaurantId });
    return reply.status(201).send(category);
  });

  app.patch("/categories/:id", { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const query = request.query as ProductQuery;
    const restaurantId = query.restaurantId || "default";
    const category = await productsService.updateCategory(id, restaurantId, request.body as any);
    return reply.send(category);
  });

  app.delete("/categories/:id", { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const query = request.query as ProductQuery;
    const restaurantId = query.restaurantId || "default";
    await productsService.deleteCategory(id, restaurantId);
    return reply.status(204).send();
  });

  // Products
  app.get("/products", { preHandler: [authenticate] }, async (request, reply) => {
    const query = request.query as ProductQuery;
    const restaurantId = query.restaurantId || "default";
    const categoryId = query.categoryId;
    const search = query.search;
    const items = await productsService.getProducts(restaurantId, categoryId, search);
    return reply.send(items);
  });

  app.get("/products/:id", { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const query = request.query as ProductQuery;
    const restaurantId = query.restaurantId || "default";
    const product = await productsService.getProductById(id, restaurantId);
    return reply.send(product);
  });

  app.post("/products", { preHandler: [authenticate] }, async (request, reply) => {
    const result = productSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({ statusCode: 400, error: "Bad Request", details: result.error.errors });
    }
    const query = request.query as ProductQuery;
    const restaurantId = query.restaurantId || "default";
    const product = await productsService.createProduct({ ...result.data, restaurantId });
    return reply.status(201).send(product);
  });

  app.patch("/products/:id", { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const query = request.query as ProductQuery;
    const restaurantId = query.restaurantId || "default";
    const product = await productsService.updateProduct(id, restaurantId, request.body as any);
    return reply.send(product);
  });

  app.delete("/products/:id", { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const query = request.query as ProductQuery;
    const restaurantId = query.restaurantId || "default";
    await productsService.deleteProduct(id, restaurantId);
    return reply.status(204).send();
  });
}

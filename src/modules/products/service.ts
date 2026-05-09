import { db } from "../../db/index.js";
import { products, categories } from "../../db/schema/index.js";
import { eq, and, like, desc } from "drizzle-orm";
import { AppError } from "../../shared/errors/AppError.js";

export class ProductsService {
  async getCategories(restaurantId: string) {
    return db.select().from(categories)
      .where(eq(categories.restaurantId, restaurantId))
      .orderBy(categories.sortOrder);
  }

  async getCategoryById(id: string, restaurantId: string) {
    const [category] = await db.select().from(categories)
      .where(and(eq(categories.id, id), eq(categories.restaurantId, restaurantId)));
    if (!category) throw AppError.notFound("Categoría no encontrada");
    return category;
  }

  async createCategory(data: {
    restaurantId: string;
    name: string;
    description?: string;
    color?: string;
    icon?: string;
    sortOrder?: number;
    parentId?: string;
  }) {
    const [category] = await db.insert(categories).values({
      id: crypto.randomUUID(),
      ...data,
    }).$returningId();
    return category;
  }

  async updateCategory(id: string, restaurantId: string, data: Partial<typeof categories.$inferInsert>) {
    await this.getCategoryById(id, restaurantId);
    await db.update(categories).set(data).where(eq(categories.id, id));
    return this.getCategoryById(id, restaurantId);
  }

  async deleteCategory(id: string, restaurantId: string) {
    await this.getCategoryById(id, restaurantId);
    await db.update(categories).set({ isActive: false }).where(eq(categories.id, id));
  }

  async getProducts(restaurantId: string, categoryId?: string, search?: string) {
    let query = db.select().from(products)
      .where(eq(products.restaurantId, restaurantId));
    
    if (categoryId) {
      query = db.select().from(products)
        .where(and(eq(products.restaurantId, restaurantId), eq(products.categoryId, categoryId)));
    }
    
    if (search) {
      query = db.select().from(products)
        .where(and(
          eq(products.restaurantId, restaurantId),
          like(products.name, `%${search}%`)
        ));
    }
    
    return query.orderBy(desc(products.createdAt));
  }

  async getProductById(id: string, restaurantId: string) {
    const [product] = await db.select().from(products)
      .where(and(eq(products.id, id), eq(products.restaurantId, restaurantId)));
    if (!product) throw AppError.notFound("Producto no encontrado");
    return product;
  }

  async createProduct(data: {
    restaurantId: string;
    categoryId: string;
    name: string;
    description?: string;
    sku?: string;
    price: string;
    cost?: string;
    imageUrl?: string;
    barcode?: string;
    preparationTime?: number;
    allergens?: any;
    nutritionalInfo?: any;
    variants?: any;
  }) {
    const [product] = await db.insert(products).values({
      id: crypto.randomUUID(),
      isAvailable: true,
      isFeatured: false,
      ...data,
    }).$returningId();
    return product;
  }

  async updateProduct(id: string, restaurantId: string, data: Partial<typeof products.$inferInsert>) {
    await this.getProductById(id, restaurantId);
    await db.update(products).set(data).where(eq(products.id, id));
    return this.getProductById(id, restaurantId);
  }

  async deleteProduct(id: string, restaurantId: string) {
    await this.getProductById(id, restaurantId);
    await db.update(products).set({ isActive: false }).where(eq(products.id, id));
  }
}

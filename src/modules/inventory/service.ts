import { db } from "../../db/index.js";
import { inventoryItems, inventoryMovements, recipes, recipeIngredients } from "../../db/schema/index.js";
import { eq, and, desc, sql } from "drizzle-orm";
import { AppError } from "../../shared/errors/AppError.js";

export class InventoryService {
  async getItems(restaurantId: string) {
    return db.select().from(inventoryItems)
      .where(eq(inventoryItems.restaurantId, restaurantId))
      .orderBy(inventoryItems.name);
  }

  async getItemById(id: string, restaurantId: string) {
    const [item] = await db.select().from(inventoryItems)
      .where(and(eq(inventoryItems.id, id), eq(inventoryItems.restaurantId, restaurantId)));
    if (!item) throw AppError.notFound("Artículo de inventario no encontrado");
    return item;
  }

  async createItem(data: {
    restaurantId: string;
    productId?: string;
    name: string;
    sku?: string;
    unit?: string;
    currentStock?: string;
    minStock?: string;
    maxStock?: string;
    reorderPoint?: string;
    costPerUnit?: string;
    location?: string;
  }) {
    const [item] = await db.insert(inventoryItems).values({
      id: crypto.randomUUID(),
      ...data,
    }).$returningId();
    return item;
  }

  async updateItem(id: string, restaurantId: string, data: Partial<typeof inventoryItems.$inferInsert>) {
    await this.getItemById(id, restaurantId);
    await db.update(inventoryItems).set(data).where(eq(inventoryItems.id, id));
    return this.getItemById(id, restaurantId);
  }

  async deleteItem(id: string, restaurantId: string) {
    await this.getItemById(id, restaurantId);
    await db.update(inventoryItems).set({ isActive: false }).where(eq(inventoryItems.id, id));
  }

  async getMovements(inventoryItemId: string) {
    return db.select().from(inventoryMovements)
      .where(eq(inventoryMovements.inventoryItemId, inventoryItemId))
      .orderBy(desc(inventoryMovements.createdAt));
  }

  async addMovement(data: {
    inventoryItemId: string;
    userId: string;
    type: string;
    quantity: string;
    previousStock: string;
    newStock: string;
    unitCost?: string;
    totalCost?: string;
    reference?: string;
    notes?: string;
  }) {
    const [movement] = await db.insert(inventoryMovements).values({
      id: crypto.randomUUID(),
      ...data,
    }).$returningId();
    return movement;
  }

  async getRecipes() {
    return db.select().from(recipes)
      .orderBy(recipes.name);
  }

  async getRecipeById(id: string) {
    const [recipe] = await db.select().from(recipes)
      .where(eq(recipes.id, id));
    if (!recipe) throw AppError.notFound("Receta no encontrada");
    return recipe;
  }

  async getRecipeIngredients(recipeId: string) {
    return db.select().from(recipeIngredients)
      .where(eq(recipeIngredients.recipeId, recipeId));
  }

  async createRecipe(data: {
    productId: string;
    name: string;
    yieldQuantity?: string;
    yieldUnit?: string;
    instructions?: string;
    preparationTime?: number;
  }) {
    const [recipe] = await db.insert(recipes).values({
      id: crypto.randomUUID(),
      ...data,
    }).$returningId();
    return recipe;
  }

  async addRecipeIngredient(data: {
    recipeId: string;
    inventoryItemId: string;
    quantity: string;
    unit: string;
    notes?: string;
  }) {
    const [ingredient] = await db.insert(recipeIngredients).values({
      id: crypto.randomUUID(),
      ...data,
    }).$returningId();
    return ingredient;
  }
}

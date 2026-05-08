import { db } from "./index.js";
import * as schema from "./schema/index.js";

async function seed() {
  console.log("🌱 Iniciando seed de base de datos...");

  try {
    // Crear restaurante de prueba
    const [restaurant] = await db.insert(schema.restaurants).values({
      id: crypto.randomUUID(),
      name: "Restaurante de Prueba",
      slug: "restaurante-prueba",
      address: "Calle Principal 123, Ciudad de México",
      phone: "555-123-4567",
      email: "contacto@restaurante-prueba.com",
      timezone: "America/Mexico_City",
      currency: "MXN",
    }).$returningId();

    console.log("✅ Restaurante creado:", restaurant.id);

    // Crear usuario administrador
    const [user] = await db.insert(schema.users).values({
      id: crypto.randomUUID(),
      restaurantId: restaurant.id,
      email: "admin@softrest.io",
      password: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYA.qGZvKG6G", // password: admin123
      firstName: "Administrador",
      lastName: "Sistema",
      role: "owner",
    }).$returningId();

    console.log("✅ Usuario admin creado:", user.id);

    // Crear categorías de ejemplo
    const categories = await db.insert(schema.categories).values([
      { id: crypto.randomUUID(), restaurantId: restaurant.id, name: "Entradas", color: "#FF6B6B", sortOrder: 1 },
      { id: crypto.randomUUID(), restaurantId: restaurant.id, name: "Platos Principales", color: "#4ECDC4", sortOrder: 2 },
      { id: crypto.randomUUID(), restaurantId: restaurant.id, name: "Bebidas", color: "#45B7D1", sortOrder: 3 },
      { id: crypto.randomUUID(), restaurantId: restaurant.id, name: "Postres", color: "#FFA07A", sortOrder: 4 },
    ]).$returningId();

    console.log(`✅ ${categories.length} categorías creadas`);

    // Crear productos de ejemplo
    const products = await db.insert(schema.products).values([
      {
        id: crypto.randomUUID(),
        restaurantId: restaurant.id,
        categoryId: categories[0].id,
        name: "Guacamole Casero",
        description: "Aguacate fresco con tomate, cebolla y cilantro",
        price: "85.00",
        preparationTime: 5,
      },
      {
        id: crypto.randomUUID(),
        restaurantId: restaurant.id,
        categoryId: categories[1].id,
        name: "Tacos al Pastor",
        description: "Tacos de cerdo marinado con piña y cilantro",
        price: "120.00",
        preparationTime: 10,
      },
      {
        id: crypto.randomUUID(),
        restaurantId: restaurant.id,
        categoryId: categories[2].id,
        name: "Agua de Horchata",
        description: "Bebida tradicional de arroz con canela",
        price: "35.00",
        preparationTime: 2,
      },
    ]).$returningId();

    console.log(`✅ ${products.length} productos creados`);

    // Crear mesas de ejemplo
    const tables = await db.insert(schema.tables).values([
      { id: crypto.randomUUID(), restaurantId: restaurant.id, name: "Mesa 1", number: 1, capacity: 4, section: "Terraza" },
      { id: crypto.randomUUID(), restaurantId: restaurant.id, name: "Mesa 2", number: 2, capacity: 2, section: "Terraza" },
      { id: crypto.randomUUID(), restaurantId: restaurant.id, name: "Mesa 3", number: 3, capacity: 6, section: "Salón Principal" },
      { id: crypto.randomUUID(), restaurantId: restaurant.id, name: "Mesa 4", number: 4, capacity: 4, section: "Salón Principal" },
    ]).$returningId();

    console.log(`✅ ${tables.length} mesas creadas`);

    console.log("🎉 Seed completado exitosamente!");
    console.log("\n📧 Credenciales de acceso:");
    console.log("   Email: admin@softrest.io");
    console.log("   Password: admin123");

  } catch (error) {
    console.error("❌ Error durante el seed:", error);
    process.exit(1);
  }
}

seed();
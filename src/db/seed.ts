import { db } from "./index.js";
import * as schema from "./schema/index.js";

async function seed() {
  console.log("🌱 Iniciando seed de base de datos...");

  try {
    // Crear restaurante de prueba
    const restaurantId = crypto.randomUUID();
    await db.insert(schema.restaurants).values({
      id: restaurantId,
      name: "Restaurante de Prueba",
      slug: "restaurante-prueba",
      address: "Calle Principal 123, Ciudad de México",
      phone: "555-123-4567",
      email: "contacto@restaurante-prueba.com",
      timezone: "America/Mexico_City",
      currency: "MXN",
    });

    console.log("✅ Restaurante creado:", restaurantId);

    // Crear usuario administrador
    const userId = crypto.randomUUID();
    await db.insert(schema.users).values({
      id: userId,
      restaurantId: restaurantId,
      email: "admin@softrest.io",
      password: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYA.qGZvKG6G", // password: admin123
      firstName: "Administrador",
      lastName: "Sistema",
      role: "owner",
    });

    console.log("✅ Usuario admin creado:", userId);

    // Crear categorías de ejemplo
    const category1 = { id: crypto.randomUUID(), restaurantId, name: "Entradas", color: "#FF6B6B", sortOrder: 1 };
    const category2 = { id: crypto.randomUUID(), restaurantId, name: "Platos Principales", color: "#4ECDC4", sortOrder: 2 };
    const category3 = { id: crypto.randomUUID(), restaurantId, name: "Bebidas", color: "#45B7D1", sortOrder: 3 };
    const category4 = { id: crypto.randomUUID(), restaurantId, name: "Postres", color: "#FFA07A", sortOrder: 4 };

    await db.insert(schema.categories).values([category1, category2, category3, category4]);

    console.log("✅ 4 categorías creadas");

    // Crear productos de ejemplo
    const product1 = {
      id: crypto.randomUUID(),
      restaurantId,
      categoryId: category1.id,
      name: "Guacamole Casero",
      description: "Aguacate fresco con tomate, cebolla y cilantro",
      price: "85.00",
      preparationTime: 5,
    };
    const product2 = {
      id: crypto.randomUUID(),
      restaurantId,
      categoryId: category2.id,
      name: "Tacos al Pastor",
      description: "Tacos de cerdo marinado con piña y cilantro",
      price: "120.00",
      preparationTime: 10,
    };
    const product3 = {
      id: crypto.randomUUID(),
      restaurantId,
      categoryId: category3.id,
      name: "Agua de Horchata",
      description: "Bebida tradicional de arroz con canela",
      price: "35.00",
      preparationTime: 2,
    };

    await db.insert(schema.products).values([product1, product2, product3]);

    console.log("✅ 3 productos creados");

    // Crear mesas de ejemplo
    const table1 = { id: crypto.randomUUID(), restaurantId, name: "Mesa 1", number: 1, capacity: 4, section: "Terraza" };
    const table2 = { id: crypto.randomUUID(), restaurantId, name: "Mesa 2", number: 2, capacity: 2, section: "Terraza" };
    const table3 = { id: crypto.randomUUID(), restaurantId, name: "Mesa 3", number: 3, capacity: 6, section: "Salón Principal" };
    const table4 = { id: crypto.randomUUID(), restaurantId, name: "Mesa 4", number: 4, capacity: 4, section: "Salón Principal" };

    await db.insert(schema.tables).values([table1, table2, table3, table4]);

    console.log("✅ 4 mesas creadas");

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

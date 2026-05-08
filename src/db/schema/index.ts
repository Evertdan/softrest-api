import { mysqlTable, varchar, timestamp, int, decimal, boolean, text, json, mysqlEnum } from "drizzle-orm/mysql-core";

// ============================================
// TABLAS CORE - Autenticación y Multi-tenant
// ============================================

export const restaurants = mysqlTable("restaurants", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  address: text("address"),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 255 }),
  taxId: varchar("tax_id", { length: 20 }),
  fiscalRegime: varchar("fiscal_regime", { length: 50 }),
  postalCode: varchar("postal_code", { length: 10 }),
  logoUrl: varchar("logo_url", { length: 500 }),
  timezone: varchar("timezone", { length: 50 }).default("America/Mexico_City"),
  currency: varchar("currency", { length: 3 }).default("MXN"),
  isActive: boolean("is_active").default(true),
  plan: mysqlEnum("plan", ["free", "basic", "premium", "enterprise"]).default("free"),
  maxUsers: int("max_users").default(5),
  maxTables: int("max_tables").default(20),
  featureFlags: json("feature_flags"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const users = mysqlTable("users", {
  id: varchar("id", { length: 36 }).primaryKey(),
  restaurantId: varchar("restaurant_id", { length: 36 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  role: mysqlEnum("role", ["owner", "manager", "cashier", "waiter", "kitchen", "admin"]).default("waiter"),
  pin: varchar("pin", { length: 10 }),
  avatarUrl: varchar("avatar_url", { length: 500 }),
  isActive: boolean("is_active").default(true),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const permissions = mysqlTable("permissions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  resource: varchar("resource", { length: 50 }).notNull(),
  action: varchar("action", { length: 50 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const rolePermissions = mysqlTable("role_permissions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  role: mysqlEnum("role", ["owner", "manager", "cashier", "waiter", "kitchen", "admin"]).notNull(),
  permissionId: varchar("permission_id", { length: 36 }).notNull(),
  restaurantId: varchar("restaurant_id", { length: 36 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const sessions = mysqlTable("sessions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  token: varchar("token", { length: 500 }).notNull(),
  refreshToken: varchar("refresh_token", { length: 500 }),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  isRevoked: boolean("is_revoked").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================
// TABLAS DE PRODUCTOS Y MENÚ
// ============================================

export const categories = mysqlTable("categories", {
  id: varchar("id", { length: 36 }).primaryKey(),
  restaurantId: varchar("restaurant_id", { length: 36 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 7 }).default("#000000"),
  icon: varchar("icon", { length: 50 }),
  sortOrder: int("sort_order").default(0),
  parentId: varchar("parent_id", { length: 36 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const products = mysqlTable("products", {
  id: varchar("id", { length: 36 }).primaryKey(),
  restaurantId: varchar("restaurant_id", { length: 36 }).notNull(),
  categoryId: varchar("category_id", { length: 36 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  sku: varchar("sku", { length: 50 }),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  cost: decimal("cost", { precision: 10, scale: 2 }).default("0"),
  imageUrl: varchar("image_url", { length: 500 }),
  barcode: varchar("barcode", { length: 50 }),
  isAvailable: boolean("is_available").default(true),
  isFeatured: boolean("is_featured").default(false),
  preparationTime: int("preparation_time").default(0),
  allergens: json("allergens"),
  nutritionalInfo: json("nutritional_info"),
  variants: json("variants"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const modifiers = mysqlTable("modifiers", {
  id: varchar("id", { length: 36 }).primaryKey(),
  restaurantId: varchar("restaurant_id", { length: 36 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  isRequired: boolean("is_required").default(false),
  maxSelections: int("max_selections").default(1),
  sortOrder: int("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const modifierOptions = mysqlTable("modifier_options", {
  id: varchar("id", { length: 36 }).primaryKey(),
  modifierId: varchar("modifier_id", { length: 36 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  priceAdjustment: decimal("price_adjustment", { precision: 10, scale: 2 }).default("0"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const productModifiers = mysqlTable("product_modifiers", {
  id: varchar("id", { length: 36 }).primaryKey(),
  productId: varchar("product_id", { length: 36 }).notNull(),
  modifierId: varchar("modifier_id", { length: 36 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================
// TABLAS DE MESAS Y ÓRDENES
// ============================================

export const tables = mysqlTable("tables", {
  id: varchar("id", { length: 36 }).primaryKey(),
  restaurantId: varchar("restaurant_id", { length: 36 }).notNull(),
  name: varchar("name", { length: 50 }).notNull(),
  number: int("number").notNull(),
  capacity: int("capacity").default(4),
  section: varchar("section", { length: 50 }),
  qrCode: varchar("qr_code", { length: 500 }),
  status: mysqlEnum("status", ["available", "occupied", "reserved", "cleaning", "maintenance"]).default("available"),
  posX: int("pos_x").default(0),
  posY: int("pos_y").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const orders = mysqlTable("orders", {
  id: varchar("id", { length: 36 }).primaryKey(),
  restaurantId: varchar("restaurant_id", { length: 36 }).notNull(),
  tableId: varchar("table_id", { length: 36 }),
  userId: varchar("user_id", { length: 36 }).notNull(),
  orderNumber: varchar("order_number", { length: 20 }).notNull(),
  type: mysqlEnum("type", ["dine_in", "takeaway", "delivery", "drive_thru"]).default("dine_in"),
  status: mysqlEnum("status", ["pending", "preparing", "ready", "served", "cancelled", "paid"]).default("pending"),
  paymentStatus: mysqlEnum("payment_status", ["pending", "partial", "paid", "refunded", "failed"]).default("pending"),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).default("0"),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0"),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0"),
  tipAmount: decimal("tip_amount", { precision: 10, scale: 2 }).default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).default("0"),
  guests: int("guests").default(1),
  notes: text("notes"),
  source: mysqlEnum("source", ["pos", "mobile", "web", "kiosk", "aggregator"]).default("pos"),
  aggregatorId: varchar("aggregator_id", { length: 36 }),
  aggregatorOrderId: varchar("aggregator_order_id", { length: 100 }),
  cancelledAt: timestamp("cancelled_at"),
  cancellationReason: text("cancellation_reason"),
  cancelledById: varchar("cancelled_by_id", { length: 36 }),
  closedAt: timestamp("closed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const orderItems = mysqlTable("order_items", {
  id: varchar("id", { length: 36 }).primaryKey(),
  orderId: varchar("order_id", { length: 36 }).notNull(),
  productId: varchar("product_id", { length: 36 }).notNull(),
  productName: varchar("product_name", { length: 255 }).notNull(),
  quantity: int("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  modifiers: json("modifiers"),
  notes: text("notes"),
  status: mysqlEnum("status", ["pending", "preparing", "ready", "served", "cancelled"]).default("pending"),
  preparedById: varchar("prepared_by_id", { length: 36 }),
  preparedAt: timestamp("prepared_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const orderStatusHistory = mysqlTable("order_status_history", {
  id: varchar("id", { length: 36 }).primaryKey(),
  orderId: varchar("order_id", { length: 36 }).notNull(),
  status: varchar("status", { length: 50 }).notNull(),
  previousStatus: varchar("previous_status", { length: 50 }),
  changedById: varchar("changed_by_id", { length: 36 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================
// TABLAS DE CAJA Y PAGOS
// ============================================

export const cashRegisters = mysqlTable("cash_registers", {
  id: varchar("id", { length: 36 }).primaryKey(),
  restaurantId: varchar("restaurant_id", { length: 36 }).notNull(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  name: varchar("name", { length: 50 }).notNull(),
  status: mysqlEnum("status", ["open", "closed"]).default("open"),
  openingAmount: decimal("opening_amount", { precision: 10, scale: 2 }).notNull(),
  closingAmount: decimal("closing_amount", { precision: 10, scale: 2 }),
  expectedAmount: decimal("expected_amount", { precision: 10, scale: 2 }),
  difference: decimal("difference", { precision: 10, scale: 2 }),
  openedAt: timestamp("opened_at").defaultNow(),
  closedAt: timestamp("closed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const payments = mysqlTable("payments", {
  id: varchar("id", { length: 36 }).primaryKey(),
  orderId: varchar("order_id", { length: 36 }).notNull(),
  cashRegisterId: varchar("cash_register_id", { length: 36 }),
  userId: varchar("user_id", { length: 36 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  tip: decimal("tip", { precision: 10, scale: 2 }).default("0"),
  method: mysqlEnum("method", ["cash", "card", "transfer", "wallet", "crypto", "mixed"]).notNull(),
  status: mysqlEnum("status", ["pending", "completed", "failed", "refunded"]).default("pending"),
  reference: varchar("reference", { length: 100 }),
  terminalId: varchar("terminal_id", { length: 50 }),
  authCode: varchar("auth_code", { length: 50 }),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const paymentSplits = mysqlTable("payment_splits", {
  id: varchar("id", { length: 36 }).primaryKey(),
  paymentId: varchar("payment_id", { length: 36 }).notNull(),
  method: mysqlEnum("method", ["cash", "card", "transfer", "wallet", "crypto"]).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  reference: varchar("reference", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================
// TABLAS DE INVENTARIO
// ============================================

export const inventoryItems = mysqlTable("inventory_items", {
  id: varchar("id", { length: 36 }).primaryKey(),
  restaurantId: varchar("restaurant_id", { length: 36 }).notNull(),
  productId: varchar("product_id", { length: 36 }),
  name: varchar("name", { length: 255 }).notNull(),
  sku: varchar("sku", { length: 50 }),
  unit: mysqlEnum("unit", ["kg", "g", "l", "ml", "unit", "box", "pack", "dozen"]).default("unit"),
  currentStock: decimal("current_stock", { precision: 10, scale: 3 }).default("0"),
  minStock: decimal("min_stock", { precision: 10, scale: 3 }).default("0"),
  maxStock: decimal("max_stock", { precision: 10, scale: 3 }),
  reorderPoint: decimal("reorder_point", { precision: 10, scale: 3 }).default("0"),
  costPerUnit: decimal("cost_per_unit", { precision: 10, scale: 4 }).default("0"),
  location: varchar("location", { length: 100 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const inventoryMovements = mysqlTable("inventory_movements", {
  id: varchar("id", { length: 36 }).primaryKey(),
  inventoryItemId: varchar("inventory_item_id", { length: 36 }).notNull(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  type: mysqlEnum("type", ["purchase", "sale", "adjustment", "waste", "transfer_in", "transfer_out", "return"]).notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 3 }).notNull(),
  previousStock: decimal("previous_stock", { precision: 10, scale: 3 }).notNull(),
  newStock: decimal("new_stock", { precision: 10, scale: 3 }).notNull(),
  unitCost: decimal("unit_cost", { precision: 10, scale: 4 }),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }),
  reference: varchar("reference", { length: 100 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const recipes = mysqlTable("recipes", {
  id: varchar("id", { length: 36 }).primaryKey(),
  productId: varchar("product_id", { length: 36 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  yieldQuantity: decimal("yield_quantity", { precision: 10, scale: 3 }).default("1"),
  yieldUnit: mysqlEnum("yield_unit", ["kg", "g", "l", "ml", "unit", "box", "pack", "dozen"]).default("unit"),
  instructions: text("instructions"),
  preparationTime: int("preparation_time").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const recipeIngredients = mysqlTable("recipe_ingredients", {
  id: varchar("id", { length: 36 }).primaryKey(),
  recipeId: varchar("recipe_id", { length: 36 }).notNull(),
  inventoryItemId: varchar("inventory_item_id", { length: 36 }).notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 4 }).notNull(),
  unit: mysqlEnum("unit", ["kg", "g", "l", "ml", "unit", "box", "pack", "dozen"]).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================
// TABLAS DE CLIENTES Y LEALTAD
// ============================================

export const clients = mysqlTable("clients", {
  id: varchar("id", { length: 36 }).primaryKey(),
  restaurantId: varchar("restaurant_id", { length: 36 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  rfc: varchar("rfc", { length: 13 }),
  usoCfdi: varchar("uso_cfdi", { length: 3 }),
  fiscalRegime: varchar("fiscal_regime", { length: 50 }),
  postalCode: varchar("postal_code", { length: 10 }),
  address: text("address"),
  birthday: timestamp("birthday"),
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const loyaltyPrograms = mysqlTable("loyalty_programs", {
  id: varchar("id", { length: 36 }).primaryKey(),
  restaurantId: varchar("restaurant_id", { length: 36 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  pointsPerCurrency: decimal("points_per_currency", { precision: 10, scale: 2 }).default("1"),
  currencyPerPoint: decimal("currency_per_point", { precision: 10, scale: 4 }).default("0.1"),
  minRedemption: int("min_redemption").default(100),
  expirationDays: int("expiration_days").default(365),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const loyaltyAccounts = mysqlTable("loyalty_accounts", {
  id: varchar("id", { length: 36 }).primaryKey(),
  clientId: varchar("client_id", { length: 36 }).notNull(),
  programId: varchar("program_id", { length: 36 }).notNull(),
  pointsBalance: int("points_balance").default(0),
  totalEarned: int("total_earned").default(0),
  totalRedeemed: int("total_redeemed").default(0),
  lastActivityAt: timestamp("last_activity_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const loyaltyTransactions = mysqlTable("loyalty_transactions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  accountId: varchar("account_id", { length: 36 }).notNull(),
  orderId: varchar("order_id", { length: 36 }),
  type: mysqlEnum("type", ["earn", "redeem", "bonus", "expire", "adjustment"]).notNull(),
  points: int("points").notNull(),
  description: text("description"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================
// TABLAS DE CFDI Y FACTURACIÓN
// ============================================

export const cfdiInvoices = mysqlTable("cfdi_invoices", {
  id: varchar("id", { length: 36 }).primaryKey(),
  restaurantId: varchar("restaurant_id", { length: 36 }).notNull(),
  orderId: varchar("order_id", { length: 36 }),
  clientId: varchar("client_id", { length: 36 }),
  uuid: varchar("uuid", { length: 36 }).notNull(),
  serie: varchar("serie", { length: 10 }),
  folio: varchar("folio", { length: 20 }),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0"),
  currency: varchar("currency", { length: 3 }).default("MXN"),
  exchangeRate: decimal("exchange_rate", { precision: 10, scale: 6 }).default("1"),
  paymentMethod: mysqlEnum("payment_method", ["PUE", "PPD"]).default("PUE"),
  paymentForm: mysqlEnum("payment_form", ["01", "02", "03", "04", "05", "06", "08", "12", "13", "14", "15", "17", "23", "24", "25", "26", "27", "28", "29", "30", "31", "99"]).default("01"),
  cfdiUse: mysqlEnum("cfdi_use", ["G01", "G02", "G03", "I01", "I02", "I03", "I04", "I05", "I06", "I07", "I08", "D01", "D02", "D03", "D04", "D05", "D06", "D07", "D08", "D09", "D10", "P01", "S01", "CP01", "CN01"]).default("G03"),
  status: mysqlEnum("status", ["pending", "stamped", "cancelled", "error"]).default("pending"),
  xmlUrl: varchar("xml_url", { length: 500 }),
  pdfUrl: varchar("pdf_url", { length: 500 }),
  pacResponse: json("pac_response"),
  errorMessage: text("error_message"),
  cancelledAt: timestamp("cancelled_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// ============================================
// TABLAS DE DELIVERY Y AGGREGATORS
// ============================================

export const deliveryPlatforms = mysqlTable("delivery_platforms", {
  id: varchar("id", { length: 36 }).primaryKey(),
  restaurantId: varchar("restaurant_id", { length: 36 }).notNull(),
  name: mysqlEnum("name", ["uber_eats", "rappi", "didi_food", "own_delivery"]).notNull(),
  isActive: boolean("is_active").default(true),
  apiKey: varchar("api_key", { length: 500 }),
  apiSecret: varchar("api_secret", { length: 500 }),
  webhookUrl: varchar("webhook_url", { length: 500 }),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).default("0"),
  menuSyncEnabled: boolean("menu_sync_enabled").default(false),
  autoAccept: boolean("auto_accept").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const deliveryOrders = mysqlTable("delivery_orders", {
  id: varchar("id", { length: 36 }).primaryKey(),
  orderId: varchar("order_id", { length: 36 }).notNull(),
  platformId: varchar("platform_id", { length: 36 }).notNull(),
  externalOrderId: varchar("external_order_id", { length: 100 }).notNull(),
  externalOrderNumber: varchar("external_order_number", { length: 50 }),
  customerName: varchar("customer_name", { length: 255 }),
  customerPhone: varchar("customer_phone", { length: 20 }),
  deliveryAddress: text("delivery_address"),
  deliveryInstructions: text("delivery_instructions"),
  deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }).default("0"),
  platformCommission: decimal("platform_commission", { precision: 10, scale: 2 }).default("0"),
  estimatedDeliveryTime: timestamp("estimated_delivery_time"),
  actualDeliveryTime: timestamp("actual_delivery_time"),
  deliveryStatus: mysqlEnum("delivery_status", ["pending", "confirmed", "preparing", "ready", "picked_up", "in_transit", "delivered", "cancelled"]).default("pending"),
  driverName: varchar("driver_name", { length: 100 }),
  driverPhone: varchar("driver_phone", { length: 20 }),
  trackingUrl: varchar("tracking_url", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// ============================================
// TABLAS DE REPORTES Y AUDITORÍA
// ============================================

export const auditLogs = mysqlTable("audit_logs", {
  id: varchar("id", { length: 36 }).primaryKey(),
  restaurantId: varchar("restaurant_id", { length: 36 }).notNull(),
  userId: varchar("user_id", { length: 36 }),
  action: varchar("action", { length: 50 }).notNull(),
  entityType: varchar("entity_type", { length: 50 }).notNull(),
  entityId: varchar("entity_id", { length: 36 }),
  previousData: json("previous_data"),
  newData: json("new_data"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const scheduledReports = mysqlTable("scheduled_reports", {
  id: varchar("id", { length: 36 }).primaryKey(),
  restaurantId: varchar("restaurant_id", { length: 36 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  type: mysqlEnum("type", ["sales", "inventory", "financial", "staff", "custom"]).notNull(),
  frequency: mysqlEnum("frequency", ["daily", "weekly", "monthly"]).notNull(),
  config: json("config"),
  recipients: json("recipients"),
  lastRunAt: timestamp("last_run_at"),
  nextRunAt: timestamp("next_run_at"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// ============================================
// TABLAS DE FEATURE FLAGS Y CONFIGURACIÓN
// ============================================

export const featureFlags = mysqlTable("feature_flags", {
  id: varchar("id", { length: 36 }).primaryKey(),
  restaurantId: varchar("restaurant_id", { length: 36 }).notNull(),
  key: varchar("key", { length: 50 }).notNull(),
  value: boolean("value").default(false),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const appSettings = mysqlTable("app_settings", {
  id: varchar("id", { length: 36 }).primaryKey(),
  restaurantId: varchar("restaurant_id", { length: 36 }).notNull(),
  key: varchar("key", { length: 100 }).notNull(),
  value: text("value"),
  category: varchar("category", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
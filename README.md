# SoftRest API

Backend API para SoftRest v2 - Sistema POS para restaurantes.

## Stack

- **Runtime**: Node.js 22 (LTS)
- **Framework**: Fastify 5
- **ORM**: Drizzle ORM
- **Base de datos**: MariaDB 10.11
- **Cache/Cola**: Redis 7
- **Autenticación**: JWT con `jose`
- **Validación**: Zod 4

## Estructura

```
softrest-api/
├── src/
│   ├── modules/           # Módulos por dominio
│   │   ├── auth/          # Autenticación y autorización
│   │   ├── orders/        # Órdenes y mesas
│   │   ├── products/      # Productos y menú
│   │   ├── kitchen/       # KDS (Kitchen Display System)
│   │   ├── cash-register/ # Caja y cierre
│   │   ├── inventory/     # Inventario
│   │   ├── cfdi/          # Facturación CFDI 4.0
│   │   ├── delivery/      # Delivery y aggregators
│   │   ├── loyalty/       # Programa de lealtad
│   │   └── reports/       # Reportes y analytics
│   ├── shared/            # Utilidades compartidas
│   ├── db/                # Configuración de base de datos
│   └── index.ts           # Entry point
├── tests/
├── drizzle/               # Migrations
└── docker/
```

## Quick Start

```bash
# 1. Clonar repo
git clone https://github.com/Evertdan/softrest-api.git
cd softrest-api

# 2. Instalar dependencias
pnpm install

# 3. Copiar variables de entorno
cp .env.example .env

# 4. Levantar base de datos (desde repo raíz)
docker compose up -d db redis

# 5. Aplicar migraciones
pnpm db:migrate

# 6. Iniciar servidor de desarrollo
pnpm dev
```

## Scripts

- `pnpm dev` - Servidor de desarrollo con hot reload
- `pnpm build` - Compilación para producción
- `pnpm start` - Iniciar servidor en producción
- `pnpm db:migrate` - Aplicar migraciones de Drizzle
- `pnpm db:seed` - Poblar base de datos con datos de prueba
- `pnpm test` - Ejecutar tests
- `pnpm lint` - ESLint
- `pnpm typecheck` - Verificación de tipos TypeScript

## Documentación

Ver [RestSoft/docs](https://github.com/Evertdan/RestSoft) para documentación completa del proyecto.

## Licencia

Propietario - RestSoft

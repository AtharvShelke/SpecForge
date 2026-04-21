# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MD Computers is a Next.js 16 e-commerce platform for PC components with a custom PC builder, compatibility checking, inventory management, and billing/invoicing system.

## Commands

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
npm run db:seed          # Seed the database
```

## Architecture

### Tech Stack
- **Framework**: Next.js 16.1.6 (App Router) with React 19
- **Database**: PostgreSQL via Prisma ORM (generated client in `generated/prisma/`)
- **UI**: Radix UI primitives + Tailwind CSS v4
- **File Upload**: UploadThing
- **Auth**: JWT-based authentication (`lib/jwt.ts`)

### Directory Structure
```
app/
  (app)/           # Storefront pages (products, builds, checkout, orders)
  (auth)/          # Auth pages (login, register)
  admin/           # Admin dashboard
  api/             # API routes
context/           # React context providers (ShopContext, BuildContext, AdminContext)
components/
  ui/              # Reusable UI components (shadcn-style)
  dashboard/       # Admin dashboard components
  storefront/      # Customer-facing components
  cards/           # Product/Build/Category cards
lib/               # Utilities (prisma, jwt, tax-engine, gst, invoice, utils)
generated/prisma/  # Prisma client output (do not edit manually)
services/          # Business logic (compatibility, payment, inventory, mail)
```

### Key Systems

**Prisma Schema** (`prisma/schema.prisma`):
- Extensive e-commerce models: User, Product, ProductVariant, Order, Invoice, InventoryItem, Build, CompatibilityRule
- After modifying schema: run `prisma generate` to regenerate client

**Compatibility Engine** (`services/compatibility.ts`):
- Rule-based PC build validation (socket, memory, PSU wattage, form factor, clearance)
- Returns `CompatibilityReport` with issues ranked by severity

**Shop Context** (`context/ShopContext.tsx`):
- Global state for cart, products, categories, brands, orders
- Persists cart/compare to localStorage

**Build Context** (`context/BuildContext.tsx`):
- Manages saved build guides, share links, live compatibility reports

**Checkout Flow** (`app/actions/checkout.ts`):
- Server action handling order creation, inventory reservation, stock movements
- Transactional with Prisma

### API Routes
- `/api/init` - Initial data load (products, categories, brands, filter configs, build guides)
- `/api/products` - Product CRUD
- `/api/categories/*` - Category hierarchy, filters, schemas
- `/api/orders` - Order management
- `/api/invoices` - Invoice generation (PDF support via `lib/invoicePdf.tsx`)
- `/api/inventory` - Inventory management, stock movements
- `/api/build-guides` - Saved PC builds

### Database
- Connection via `@prisma/adapter-pg` with connection pooling
- Dev: query logging for slow queries (>200ms)
- Production: SSL enabled, pool max=5

## Development Notes

- Prisma client is pre-generated to `generated/prisma/` - do not edit
- Environment variables in `.env` (DATABASE_URL, JWT_SECRET, UPLOADTHING_TOKEN, SMTP credentials)
- UploadThing configured for file uploads (`app/api/uploadthing/`)
- Invoice PDF generation uses `@react-pdf/renderer`

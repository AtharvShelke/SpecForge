# Category Hardcoding Removal - Migration Plan

## Current State Analysis

### Hardcoded Category References Found
1. **types.ts** - Category enum (12 categories) + CATEGORY_LABELS mapping
2. **data/categoryTree.ts** - Large hierarchical structure with BUILD_SEQUENCE and CATEGORY_HIERARCHY
3. **Components using hardcoded categories:**
   - BuildProgressSidebar.tsx - Icon mappings
   - FeaturedProductsSection.tsx - Featured category list
   - ProductManager.tsx - Default category selection
   - ProductsClient.tsx - Compatibility checks between categories
   - builds/[buildId]/page.tsx - Icon mappings
   - builds/page.tsx - Icon mappings

### Data Structure Currently Hardcoded
- **BUILD_SEQUENCE** - Order of components in PC build process
- **CATEGORY_HIERARCHY** - Multi-level category tree with:
  - Parent categories (e.g., "Processor", "Graphics Card")
  - Child categories (e.g., "High-end Processor", "Mid-Range Processor")
  - Filter queries for product matching
  - UI state (isOpen, label)

---

## Migration Strategy

### Phase 1: Database Schema Enhancement
**Goal:** Add database tables to replace hardcoded category hierarchies

#### Step 1.1: Create New Database Tables
```sql
-- Main categories (replaces enum values + CATEGORY_LABELS)
CREATE TABLE Category (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,         -- PROCESSOR, GPU, etc.
  label VARCHAR(255) NOT NULL,              -- "Processor", "Graphics Card", etc.
  displayOrder INT,                          -- For UI ordering
  icon VARCHAR(100),                         -- Icon identifier for UI
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT now(),
  updatedAt TIMESTAMP DEFAULT now()
);

-- Category hierarchy/taxonomy (replaces CATEGORY_HIERARCHY)
CREATE TABLE CategoryNode (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoryId UUID REFERENCES Category(id) ON DELETE CASCADE,
  parentNodeId UUID REFERENCES CategoryNode(id) ON DELETE CASCADE,
  label VARCHAR(255) NOT NULL,              -- "Custom Liquid Cooling", "High-end Processor"
  sortOrder INT,
  query VARCHAR(500),                        -- Product search query
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT now(),
  updatedAt TIMESTAMP DEFAULT now()
);

-- Category relationships (e.g., which categories are in BUILD_SEQUENCE)
CREATE TABLE CategoryRelationship (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fromCategoryId UUID REFERENCES Category(id) ON DELETE CASCADE,
  toCategoryId UUID REFERENCES Category(id) ON DELETE CASCADE,
  relationshipType VARCHAR(50),              -- 'BUILD_SEQUENCE', 'COMPATIBLE_WITH', etc.
  sortOrder INT,
  metadata JSONB,                            -- Store additional config
  createdAt TIMESTAMP DEFAULT now()
);
```

#### Step 1.2: Update Prisma Schema
- Remove Category enum from schema.prisma
- Add relations to new Category table
- Add CategoryNode and CategoryRelationship models
- Update Product model to reference Category.id instead of enum

#### Step 1.3: Create Migration Script
- Seed new Category table with existing enum values
- Migrate CATEGORY_HIERARCHY data into CategoryNode table
- Migrate BUILD_SEQUENCE into CategoryRelationship table

---

### Phase 2: API Layer Creation
**Goal:** Create endpoints to fetch categories dynamically

#### Step 2.1: Create Category API Routes
```
/api/categories              - GET all categories
/api/categories/:id          - GET single category with hierarchy
/api/categories/tree         - GET full category tree (CATEGORY_HIERARCHY)
/api/categories/build-sequence - GET BUILD_SEQUENCE from DB
/api/categories/icons        - GET category-to-icon mappings
```

#### Step 2.2: Implement API Endpoints
- Fetch categories with caching strategy
- Build hierarchy on-demand with proper pagination
- Return icon mappings from database

---

### Phase 3: Frontend Updates
**Goal:** Replace hardcoded imports with API calls

#### Step 3.1: Update Data Files
- **types.ts**: 
  - Keep Category enum for type safety OR convert to string type
  - Replace CATEGORY_LABELS with API call or data fetching hook
  
- **data/categoryTree.ts**:
  - Keep interface definitions
  - Replace CATEGORY_HIERARCHY with a function that fetches from API
  - Replace BUILD_SEQUENCE with API call

#### Step 3.2: Create React Hooks for Category Data
```typescript
// hooks/useCategories.ts
export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch('/api/categories').then(...);
  }, []);
  
  return { categories, loading };
}

export function useCategoryHierarchy() {
  // Fetch CATEGORY_HIERARCHY from API
}

export function useBuildSequence() {
  // Fetch BUILD_SEQUENCE from API
}

export function useCategoryLabels() {
  // Fetch CATEGORY_LABELS mapping from API
}
```

#### Step 3.3: Update Components
- Replace hardcoded icon mappings with dynamic lookups from database
- Update category-dependent logic to fetch data from API
- Implement caching/memoization for performance

---

### Phase 4: Admin Management Panel
**Goal:** Allow dynamic category management without code changes

#### Step 4.1: Create Admin Pages
- Category CRUD operations
- Category hierarchy editor (visual tree builder)
- Icon assignment
- Build sequence ordering

#### Step 4.2: Database Admin Interface
- Settings to manage category visibility
- Bulk operations (enable/disable categories)
- Category relationship management

---

## Implementation Order

1. **Week 1: Database Setup**
   - Create migration files
   - Update Prisma schema
   - Seed database with existing categories

2. **Week 2: API Layer**
   - Implement category endpoints
   - Add caching layer
   - Add query optimization

3. **Week 3: Frontend Hooks**
   - Create custom React hooks
   - Implement error handling
   - Add loading states

4. **Week 4: Component Migration**
   - Update components one by one
   - Test compatibility
   - Remove hardcoded references

5. **Week 5: Admin Panel & Polish**
   - Build admin management interface
   - Performance optimization
   - Complete testing

---

## Benefits

✅ **Flexibility** - Change categories without code deployment  
✅ **Scalability** - Support unlimited category hierarchies  
✅ **Admin Control** - Non-technical users can manage categories  
✅ **Multi-tenancy Ready** - Foundation for future features  
✅ **A/B Testing** - Easy to test category structures  
✅ **Audit Trail** - Track category changes over time  
✅ **Type Safety** - Can still use enum for backward compatibility  

---

## Risks & Mitigation

| Risk | Mitigation |
|------|-----------|
| Data consistency | Use Prisma transactions, comprehensive seeding |
| Performance (N+1 queries) | Implement caching, batch queries, GraphQL option |
| Breaking changes | Maintain backward compatibility layer during transition |
| Admin UI complexity | Start with CRUD, iterate with user feedback |

---

## File Changes Summary

### New Files to Create
- `prisma/migrations/[timestamp]_add_category_tables.sql`
- `lib/services/categoryService.ts`
- `app/api/categories/route.ts`
- `app/api/categories/tree/route.ts`
- `app/api/categories/build-sequence/route.ts`
- `hooks/useCategories.ts`
- `hooks/useCategoryHierarchy.ts`
- `hooks/useBuildSequence.ts`
- `hooks/useCategoryLabels.ts`

### Files to Modify
- `prisma/schema.prisma`
- `types.ts`
- `data/categoryTree.ts`
- `components/build/BuildProgressSidebar.tsx`
- `components/storefront/FeaturedProductsSection.tsx`
- `components/dashboard/ProductManager.tsx`
- `app/(app)/products/ProductsClient.tsx`
- `app/(app)/builds/[buildId]/page.tsx`
- `app/(app)/builds/page.tsx`
- And potentially 10-15 more component files

---

## Rollback Strategy

1. Keep database migration reversible
2. Maintain enum in types.ts initially
3. Feature flag to switch between API and hardcoded data
4. Keep original categoryTree.ts as fallback

---

## Success Metrics

- ✅ All hardcoded category references removed from codebase
- ✅ Categories fully managed via database
- ✅ Admin panel operational
- ✅ Zero breaking changes for users
- ✅ Performance metrics maintained or improved
- ✅ Full test coverage for new API endpoints

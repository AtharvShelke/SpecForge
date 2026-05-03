# Derived Specifications System Design

## Overview
The Derived Specifications system enables computed specifications that aggregate values from multiple components, supporting complex compatibility rules and build validation.

## Data Model Flow

### Prisma Schema Enhancements

```prisma
model DerivedSpec {
  id              String         @id @default(uuid())
  name            String         @unique
  description     String?
  resultSpecId    String
  formula         String
  formulaType     DerivedSpecType @default(AGGREGATION)
  inputSpecIds    Json           @default("[]")
  enabled         Boolean        @default(true)
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
  resultSpec      SpecDefinition @relation(fields: [resultSpecId], references: [id])
  computedValues  DerivedSpecValue[]
}

model DerivedSpecValue {
  id             String      @id @default(uuid())
  derivedSpecId  String
  buildId        String
  value          Json
  computedAt     DateTime    @default(now())
  derivedSpec    DerivedSpec @relation(fields: [derivedSpecId], references: [id], onDelete: Cascade)
}

enum DerivedSpecType {
  AGGREGATION
  CALCULATION
  CONDITIONAL
  REFERENCE
}
```

### API Design

#### Endpoints
- `GET /api/admin/derived-specs` - List all derived specifications
- `POST /api/admin/derived-specs` - Create new derived specification
- `GET /api/admin/derived-specs/[id]` - Get specific derived specification
- `PUT /api/admin/derived-specs/[id]` - Update derived specification
- `DELETE /api/admin/derived-specs/[id]` - Delete derived specification

#### Service Layer
- Enhanced `derivedSpecService` with full CRUD operations
- Formula evaluation engine with mathematical functions
- Build-specific computation support

## Implementation Steps

### 1. Database Schema (✅ Completed)
- Enhanced `DerivedSpec` model with formula evaluation support
- Added `DerivedSpecValue` for caching computed results
- Added `DerivedSpecType` enum for categorization
- Proper indexing for performance

### 2. API Layer (✅ Completed)
- RESTful API endpoints with admin authentication
- Proper error handling and validation
- Response serialization for frontend compatibility

### 3. Service Layer (✅ Completed)
- Enhanced service with formula evaluation
- Support for multiple formula types (SUM, SUBTRACT, MULTIPLY, DIVIDE, MAX, MIN, AVG)
- Context-aware evaluation using build components

### 4. Frontend Integration (✅ Completed)
- Updated `DerivedSpecManager` to use API endpoints
- Replaced direct service imports with HTTP calls
- Maintained existing UI/UX patterns

### 5. CompatibilityEngine Integration (✅ Completed)
- Enhanced `BuildContext` with `derived` section
- Added derived spec evaluation during context building
- Support for referencing derived values in compatibility rules
- Backward compatibility with synchronous context building

## Formula Evaluation

### Supported Functions
- `SUM(arg1, arg2, ...)` - Sum of numeric values
- `SUBTRACT(arg1, arg2)` - Subtraction
- `MULTIPLY(arg1, arg2, ...)` - Multiplication
- `DIVIDE(arg1, arg2)` - Division
- `MAX(arg1, arg2, ...)` - Maximum value
- `MIN(arg1, arg2, ...)` - Minimum value
- `AVG(arg1, arg2, ...)` - Average value

### Argument Types
- Numeric literals: `100`, `150.5`
- Component specs: `CPU.TDP`, `GPU.Power`
- Totals: `totals.totalTDP`
- Derived specs: `derived.Total_TDP`

### Example Formulas
```
SUM(CPU.TDP, GPU.TDP)                    # Total power consumption
SUBTRACT(PSU.Wattage, totals.Total_TDP)  # Power headroom
SUM(RAM.Capacity)                        # Total system memory
MULTIPLY(CPU.Cores, CPU.Threads)         # Total logical cores
DIVIDE(Storage.Capacity, 1024)           # Convert GB to TB
```

## Compatibility Rule Integration

### Rule Types
Derived specifications work with all rule types:
- **PAIR** - Component-to-component compatibility
- **COMPONENT** - Component-specific constraints
- **GLOBAL** - Build-wide validation using derived values

### Rule Examples
```javascript
// Global power constraint
{
  type: "GLOBAL",
  condition: "derived.Total_TDP > 650",
  message: "Total power consumption ({derived.Total_TDP}W) exceeds PSU capacity",
  severity: "ERROR"
}

// Component compatibility with derived values
{
  type: "PAIR",
  sourceSpec: "CPU.Socket",
  targetSpec: "Motherboard.Socket",
  condition: "derived.Total_TDP < 200",
  message: "High TDP CPU requires enhanced cooling"
}
```

## Data Flow Architecture

### Build Context Generation
```
Build Items → Component Specs → Totals → Derived Specs → Compatibility Context
```

### Evaluation Process
1. **Component Aggregation**: Extract specs from all build items
2. **Total Calculation**: Compute basic totals (TDP, price, slots)
3. **Derived Evaluation**: Apply formulas using component and total values
4. **Context Assembly**: Combine all data for rule evaluation
5. **Rule Processing**: Evaluate compatibility rules using complete context

### Caching Strategy
- `DerivedSpecValue` table caches computed results per build
- Automatic invalidation when components change
- Performance optimization for large builds

## Usage Examples

### Creating Derived Specifications
```javascript
// Total TDP calculation
POST /api/admin/derived-specs
{
  name: "Total_TDP",
  description: "Total power consumption of all components",
  resultSpecId: "power-spec-id",
  formula: "SUM(CPU.TDP, GPU.TDP, Storage.Power)",
  formulaType: "AGGREGATION",
  enabled: true
}

// PSU Headroom
POST /api/admin/derived-specs
{
  name: "PSU_Headroom",
  description: "Available power capacity",
  resultSpecId: "power-spec-id",
  formula: "SUBTRACT(PSU.Wattage, derived.Total_TDP)",
  formulaType: "CALCULATION",
  enabled: true
}
```

### Using in Compatibility Rules
```javascript
// Rule using derived specification
{
  name: "Power Capacity Check",
  type: "GLOBAL",
  condition: "derived.PSU_Headroom > 50",
  message: "Insufficient power headroom: {derived.PSU_Headroom}W remaining",
  severity: "WARNING",
  enabled: true
}
```

## Performance Considerations

### Database Optimization
- Indexed queries on `enabled` and `resultSpecId`
- Efficient JSON storage for `inputSpecIds`
- Proper foreign key relationships

### Evaluation Performance
- Synchronous evaluation for UI responsiveness
- Asynchronous background evaluation for builds
- Formula parsing optimization

### Caching Strategy
- Per-build derived value caching
- Component change detection
- Incremental re-evaluation

## Future Enhancements

### Advanced Formula Support
- Conditional logic (IF/ELSE)
- String operations
- Date/time functions
- Custom function registration

### Visualization
- Formula editor with syntax highlighting
- Real-time preview of computed values
- Dependency graph visualization

### Integration Points
- Export/import of derived specifications
- API for external formula evaluation
- Webhook notifications on value changes

## Migration Guide

### From Manual Totals
Previous manual aggregation:
```javascript
// Before
context.totals.totalTDP += specs.TDP;
```

Now using derived specs:
```javascript
// After
context.derived.Total_TDP = evaluateFormula("SUM(CPU.TDP, GPU.TDP)", context);
```

### Compatibility Rule Updates
Update existing rules to use derived values:
```javascript
// Before
condition: "totals.totalTDP > 650"

// After  
condition: "derived.Total_TDP > 650"
```

This system provides a robust foundation for complex build validation while maintaining performance and extensibility.

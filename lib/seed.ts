import "dotenv/config";
import crypto from "crypto";
import {
  CompatibilityLevel,
  Role,
  ProductStatus,
} from "../generated/prisma/client";
import { prisma } from "./prisma";

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORIES
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORIES_DATA = [
  {
    code: "PROCESSOR",
    name: "Processors",
    shortLabel: "CPUs",
    icon: "Cpu",
    displayOrder: 1,
    featuredOrder: 1,
    showInFeatured: true,
    description: "High-performance desktop processors from AMD and Intel.",
    image: "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?q=80&w=1200&auto=format&fit=crop",
  },
  {
    code: "GPU",
    name: "Graphics Cards",
    shortLabel: "GPUs",
    icon: "MonitorSpeaker",
    displayOrder: 2,
    featuredOrder: 2,
    showInFeatured: true,
    description: "Dedicated graphics cards for gaming and professional work.",
    image: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?q=80&w=1200&auto=format&fit=crop",
  },
  {
    code: "MOTHERBOARD",
    name: "Motherboards",
    shortLabel: "Mobos",
    icon: "CircuitBoard",
    displayOrder: 3,
    featuredOrder: 3,
    showInFeatured: true,
    description: "Desktop motherboards for AMD and Intel platforms.",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop",
  },
  {
    code: "RAM",
    name: "Memory",
    shortLabel: "RAM",
    icon: "MemoryStick",
    displayOrder: 4,
    featuredOrder: 4,
    showInFeatured: true,
    description: "DDR4 and DDR5 desktop memory modules.",
    image: "https://images.unsplash.com/photo-1562976540-1502c2145186?q=80&w=1200&auto=format&fit=crop",
  },
  {
    code: "STORAGE",
    name: "Storage",
    shortLabel: "Storage",
    icon: "HardDrive",
    displayOrder: 5,
    showInFeatured: false,
    description: "SSDs, HDDs, and NVMe drives.",
    image: "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?q=80&w=1200&auto=format&fit=crop",
  },
  {
    code: "PSU",
    name: "Power Supplies",
    shortLabel: "PSUs",
    icon: "Zap",
    displayOrder: 6,
    showInFeatured: false,
    description: "ATX power supplies with various wattage and efficiency ratings.",
  },
  {
    code: "CABINET",
    name: "Cabinets",
    shortLabel: "Cases",
    icon: "Box",
    displayOrder: 7,
    showInFeatured: false,
    description: "PC cases and enclosures in various form factors.",
  },
  {
    code: "COOLER",
    name: "Coolers",
    shortLabel: "Cooling",
    icon: "Fan",
    displayOrder: 8,
    showInFeatured: false,
    description: "Air coolers and liquid AIO coolers.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// BRANDS
// ─────────────────────────────────────────────────────────────────────────────

const BRANDS_DATA = [
  { name: "AMD", categoryCodes: ["PROCESSOR", "GPU", "MOTHERBOARD"] },
  { name: "Intel", categoryCodes: ["PROCESSOR", "MOTHERBOARD"] },
  { name: "NVIDIA", categoryCodes: ["GPU"] },
  { name: "ASUS", categoryCodes: ["MOTHERBOARD", "GPU", "PSU"] },
  { name: "MSI", categoryCodes: ["MOTHERBOARD", "GPU", "PSU"] },
  { name: "Gigabyte", categoryCodes: ["MOTHERBOARD", "GPU"] },
  { name: "ASRock", categoryCodes: ["MOTHERBOARD", "GPU"] },
  { name: "Corsair", categoryCodes: ["RAM", "PSU", "CABINET", "COOLER"] },
  { name: "G.Skill", categoryCodes: ["RAM"] },
  { name: "Kingston", categoryCodes: ["RAM", "STORAGE"] },
  { name: "Samsung", categoryCodes: ["STORAGE"] },
  { name: "Western Digital", categoryCodes: ["STORAGE"] },
  { name: "Crucial", categoryCodes: ["STORAGE", "RAM"] },
  { name: "DeepCool", categoryCodes: ["COOLER", "PSU"] },
  { name: "Noctua", categoryCodes: ["COOLER"] },
  { name: "Lian Li", categoryCodes: ["CABINET", "COOLER"] },
  { name: "Cooler Master", categoryCodes: ["COOLER", "PSU", "CABINET"] },
  { name: "Sapphire", categoryCodes: ["GPU"] },
  { name: "Zotac", categoryCodes: ["GPU"] },
  { name: "Seasonic", categoryCodes: ["PSU"] },
];

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCTS
// ─────────────────────────────────────────────────────────────────────────────

const PRODUCTS_DATA = [
  // ── PROCESSORS ──────────────────────────────────────────────────────────
  {
    sku: "CPU-AMD-7800X3D",
    name: "AMD Ryzen 7 7800X3D",
    categoryCode: "PROCESSOR",
    brand: "AMD",
    price: 36000,
    stock: 15,
    isFeatured: true,
    description: "The ultimate gaming processor with 3D V-Cache technology.",
    image: "https://m.media-amazon.com/images/I/51GSXR35GWL._SL1500_.jpg",
  },
  {
    sku: "CPU-INT-14900K",
    name: "Intel Core i9-14900K",
    categoryCode: "PROCESSOR",
    brand: "Intel",
    price: 55000,
    stock: 8,
    isFeatured: true,
    description: "24-core flagship for creators and gamers.",
    image: "https://m.media-amazon.com/images/I/51K+MQBXPIL._SL1500_.jpg",
  },
  {
    sku: "CPU-AMD-5600X",
    name: "AMD Ryzen 5 5600X",
    categoryCode: "PROCESSOR",
    brand: "AMD",
    price: 15500,
    stock: 30,
    isFeatured: true,
    description: "Best value 6-core gaming processor for AM4.",
    image: "https://m.media-amazon.com/images/I/51f2hNSMJYL._SL1200_.jpg",
  },
  {
    sku: "CPU-INT-13600K",
    name: "Intel Core i5-13600K",
    categoryCode: "PROCESSOR",
    brand: "Intel",
    price: 28500,
    stock: 20,
    isFeatured: true,
    description: "14-core powerhouse for productivity and gaming.",
    image: "https://m.media-amazon.com/images/I/51K+MQBXPIL._SL1500_.jpg",
  },
  {
    sku: "CPU-AMD-9700X",
    name: "AMD Ryzen 7 9700X",
    categoryCode: "PROCESSOR",
    brand: "AMD",
    price: 32000,
    stock: 12,
    isFeatured: true,
    description: "Zen 5 8-core processor with exceptional efficiency.",
    image: "https://m.media-amazon.com/images/I/51GSXR35GWL._SL1500_.jpg",
  },

  // ── GRAPHICS CARDS ──────────────────────────────────────────────────────
  {
    sku: "GPU-NV-4090",
    name: "NVIDIA GeForce RTX 4090 Founders Edition",
    categoryCode: "GPU",
    brand: "NVIDIA",
    price: 185000,
    stock: 3,
    isFeatured: true,
    description: "The absolute best for 4K gaming and AI workloads.",
    image: "https://m.media-amazon.com/images/I/51oKeFzSn0L._SL1500_.jpg",
  },
  {
    sku: "GPU-ASUS-4080S",
    name: "ASUS ROG Strix RTX 4080 SUPER OC",
    categoryCode: "GPU",
    brand: "ASUS",
    price: 135000,
    stock: 5,
    isFeatured: true,
    description: "Premium triple-fan design with factory overclock.",
    image: "https://m.media-amazon.com/images/I/81q+sCEbURL._SL1500_.jpg",
  },
  {
    sku: "GPU-MSI-4070TIS",
    name: "MSI Gaming X Slim RTX 4070 Ti SUPER",
    categoryCode: "GPU",
    brand: "MSI",
    price: 92000,
    stock: 10,
    isFeatured: true,
    description: "Slim design with excellent thermal performance.",
    image: "https://m.media-amazon.com/images/I/81Y+-8K-8zL._SL1500_.jpg",
  },
  {
    sku: "GPU-SAP-7800XT",
    name: "Sapphire Nitro+ RX 7800 XT",
    categoryCode: "GPU",
    brand: "Sapphire",
    price: 52000,
    stock: 20,
    isFeatured: true,
    description: "Excellent value for 1440p gaming.",
    image: "https://m.media-amazon.com/images/I/81zdqJr2TYL._SL1500_.jpg",
  },
  {
    sku: "GPU-ZOT-4070",
    name: "Zotac Gaming GeForce RTX 4070 Twin Edge",
    categoryCode: "GPU",
    brand: "Zotac",
    price: 56000,
    stock: 25,
    isFeatured: true,
    description: "Compact dual-fan 1440p card.",
    image: "https://m.media-amazon.com/images/I/81FJI57yxfL._SL1500_.jpg",
  },
  {
    sku: "GPU-GIG-4060TI",
    name: "Gigabyte GeForce RTX 4060 Ti Gaming OC",
    categoryCode: "GPU",
    brand: "Gigabyte",
    price: 42000,
    stock: 18,
    isFeatured: true,
    description: "Sweet spot for 1080p ultra and 1440p high gaming.",
    image: "https://m.media-amazon.com/images/I/81qhJAJR3EL._SL1500_.jpg",
  },
  {
    sku: "GPU-MSI-4090",
    name: "MSI Suprim X RTX 4090",
    categoryCode: "GPU",
    brand: "MSI",
    price: 195000,
    stock: 2,
    isFeatured: true,
    description: "Flagship triple-fan GPU with extreme cooling.",
    image: "https://m.media-amazon.com/images/I/81Y+-8K-8zL._SL1500_.jpg",
  },
  {
    sku: "GPU-ASUS-4070TI",
    name: "ASUS TUF Gaming RTX 4070 Ti",
    categoryCode: "GPU",
    brand: "ASUS",
    price: 82000,
    stock: 7,
    isFeatured: true,
    description: "Military-grade build quality with excellent thermals.",
    image: "https://m.media-amazon.com/images/I/81q+sCEbURL._SL1500_.jpg",
  },

  // ── MOTHERBOARDS ────────────────────────────────────────────────────────
  {
    sku: "MB-ASUS-X670E",
    name: "ASUS ROG Crosshair X670E Hero",
    categoryCode: "MOTHERBOARD",
    brand: "ASUS",
    price: 52000,
    stock: 6,
    isFeatured: true,
    description: "Premium AM5 motherboard for enthusiasts.",
    image: "https://m.media-amazon.com/images/I/81usxmMBZhL._SL1500_.jpg",
  },
  {
    sku: "MB-MSI-B650",
    name: "MSI MAG B650 Tomahawk WiFi",
    categoryCode: "MOTHERBOARD",
    brand: "MSI",
    price: 22000,
    stock: 15,
    isFeatured: true,
    description: "Feature-rich mid-range AM5 board.",
    image: "https://m.media-amazon.com/images/I/81usxmMBZhL._SL1500_.jpg",
  },
  {
    sku: "MB-GIG-Z790",
    name: "Gigabyte Z790 Aorus Elite AX",
    categoryCode: "MOTHERBOARD",
    brand: "Gigabyte",
    price: 28000,
    stock: 10,
    isFeatured: true,
    description: "High-end Intel LGA1700 board with WiFi 6E.",
    image: "https://m.media-amazon.com/images/I/81usxmMBZhL._SL1500_.jpg",
  },
  {
    sku: "MB-ASR-B760M",
    name: "ASRock B760M Pro RS/D4",
    categoryCode: "MOTHERBOARD",
    brand: "ASRock",
    price: 11000,
    stock: 25,
    isFeatured: true,
    description: "Budget Intel board with solid VRMs.",
    image: "https://m.media-amazon.com/images/I/81usxmMBZhL._SL1500_.jpg",
  },

  // ── RAM ─────────────────────────────────────────────────────────────────
  {
    sku: "RAM-GSK-32-6000",
    name: "G.Skill Trident Z5 RGB 32GB (2x16GB) DDR5 6000MHz",
    categoryCode: "RAM",
    brand: "G.Skill",
    price: 12500,
    stock: 50,
    isFeatured: true,
    description: "High speed DDR5 memory for enthusiasts.",
    image: "https://m.media-amazon.com/images/I/61xTj1dTXcL._SL1500_.jpg",
  },
  {
    sku: "RAM-COR-16-3200",
    name: "Corsair Vengeance LPX 16GB (2x8GB) DDR4 3200MHz",
    categoryCode: "RAM",
    brand: "Corsair",
    price: 4500,
    stock: 100,
    isFeatured: true,
    description: "Reliable DDR4 memory for mainstream builds.",
    image: "https://m.media-amazon.com/images/I/51W4+1Da0IL._SL1500_.jpg",
  },
  {
    sku: "RAM-KIN-32-5600",
    name: "Kingston Fury Beast 32GB (2x16GB) DDR5 5600MHz",
    categoryCode: "RAM",
    brand: "Kingston",
    price: 9800,
    stock: 35,
    isFeatured: true,
    description: "Cost-effective DDR5 upgrade kit.",
    image: "https://m.media-amazon.com/images/I/61xTj1dTXcL._SL1500_.jpg",
  },
  {
    sku: "RAM-COR-32-6400",
    name: "Corsair Dominator Platinum RGB 32GB DDR5 6400MHz",
    categoryCode: "RAM",
    brand: "Corsair",
    price: 16500,
    stock: 20,
    isFeatured: true,
    description: "Premium DDR5 with stunning RGB lighting.",
    image: "https://m.media-amazon.com/images/I/51W4+1Da0IL._SL1500_.jpg",
  },

  // ── STORAGE ─────────────────────────────────────────────────────────────
  {
    sku: "SSD-SAM-990-1TB",
    name: "Samsung 990 Pro 1TB NVMe Gen4",
    categoryCode: "STORAGE",
    brand: "Samsung",
    price: 10500,
    stock: 40,
    isFeatured: true,
    description: "Top-tier Gen4 SSD with 7450 MB/s read speed.",
    image: "https://m.media-amazon.com/images/I/51GGy4GX7tL._SL1500_.jpg",
  },
  {
    sku: "SSD-WD-SN850X-2TB",
    name: "WD Black SN850X 2TB NVMe Gen4",
    categoryCode: "STORAGE",
    brand: "Western Digital",
    price: 16000,
    stock: 20,
    isFeatured: true,
    description: "Massive capacity with top Gen4 speeds.",
    image: "https://m.media-amazon.com/images/I/51GGy4GX7tL._SL1500_.jpg",
  },
  {
    sku: "SSD-CRU-P3P-1TB",
    name: "Crucial P3 Plus 1TB NVMe Gen4",
    categoryCode: "STORAGE",
    brand: "Crucial",
    price: 5500,
    stock: 60,
    isFeatured: true,
    description: "Budget Gen4 SSD with great value.",
    image: "https://m.media-amazon.com/images/I/51GGy4GX7tL._SL1500_.jpg",
  },

  // ── POWER SUPPLIES ──────────────────────────────────────────────────────
  {
    sku: "PSU-COR-RM850X",
    name: "Corsair RM850x 850W 80+ Gold",
    categoryCode: "PSU",
    brand: "Corsair",
    price: 12500,
    stock: 15,
    isFeatured: true,
    description: "Fully modular ATX 3.0 power supply.",
    image: "https://m.media-amazon.com/images/I/71y2AyD-YBL._SL1500_.jpg",
  },
  {
    sku: "PSU-SEA-FOCUS-750",
    name: "Seasonic Focus GX-750 750W 80+ Gold",
    categoryCode: "PSU",
    brand: "Seasonic",
    price: 9500,
    stock: 22,
    isFeatured: true,
    description: "Reliable fully modular PSU with 10-year warranty.",
    image: "https://m.media-amazon.com/images/I/71y2AyD-YBL._SL1500_.jpg",
  },
  {
    sku: "PSU-DPC-PX1000",
    name: "DeepCool PX1000G 1000W 80+ Gold",
    categoryCode: "PSU",
    brand: "DeepCool",
    price: 11000,
    stock: 10,
    isFeatured: false,
    description: "ATX 3.0 ready with native 12VHPWR connector.",
    image: "https://m.media-amazon.com/images/I/71y2AyD-YBL._SL1500_.jpg",
  },

  // ── CABINETS ────────────────────────────────────────────────────────────
  {
    sku: "CASE-LL-O11D",
    name: "Lian Li O11 Dynamic EVO",
    categoryCode: "CABINET",
    brand: "Lian Li",
    price: 16000,
    stock: 12,
    isFeatured: true,
    description: "Iconic dual-chamber case with exceptional airflow.",
    image: "https://m.media-amazon.com/images/I/61KA2cJjJvL._SL1500_.jpg",
  },
  {
    sku: "CASE-COR-4000D",
    name: "Corsair 4000D Airflow",
    categoryCode: "CABINET",
    brand: "Corsair",
    price: 8500,
    stock: 20,
    isFeatured: true,
    description: "Best-selling mid-tower with high airflow design.",
    image: "https://m.media-amazon.com/images/I/61KA2cJjJvL._SL1500_.jpg",
  },

  // ── COOLERS ─────────────────────────────────────────────────────────────
  {
    sku: "COOL-DPC-LS720",
    name: "DeepCool LS720 360mm AIO",
    categoryCode: "COOLER",
    brand: "DeepCool",
    price: 11000,
    stock: 20,
    isFeatured: true,
    description: "360mm ARGB AIO liquid cooler.",
    image: "https://m.media-amazon.com/images/I/71b0GkXXRUL._SL1500_.jpg",
  },
  {
    sku: "COOL-NOC-D15",
    name: "Noctua NH-D15 chromax.black",
    categoryCode: "COOLER",
    brand: "Noctua",
    price: 8500,
    stock: 15,
    isFeatured: true,
    description: "Premium dual-tower air cooler with near-AIO performance.",
    image: "https://m.media-amazon.com/images/I/71b0GkXXRUL._SL1500_.jpg",
  },
  {
    sku: "COOL-CM-ML240",
    name: "Cooler Master MasterLiquid ML240L V2 RGB",
    categoryCode: "COOLER",
    brand: "Cooler Master",
    price: 5500,
    stock: 25,
    isFeatured: false,
    description: "Budget-friendly 240mm AIO with RGB fans.",
    image: "https://m.media-amazon.com/images/I/71b0GkXXRUL._SL1500_.jpg",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// BUILD GUIDES
// ─────────────────────────────────────────────────────────────────────────────

const BUILDS_DATA = [
  {
    title: "Ultimate 4K Gaming Rig",
    description: "No-compromise 4K gaming build with the RTX 4090 and Ryzen 7800X3D.",
    componentSkus: ["CPU-AMD-7800X3D", "GPU-NV-4090", "MB-ASUS-X670E", "RAM-GSK-32-6000", "SSD-SAM-990-1TB", "PSU-COR-RM850X", "CASE-LL-O11D", "COOL-DPC-LS720"],
  },
  {
    title: "Content Creator Workstation",
    description: "Powerful multi-threaded build for video editing, 3D rendering, and streaming.",
    componentSkus: ["CPU-INT-14900K", "GPU-ASUS-4080S", "MB-GIG-Z790", "RAM-COR-32-6400", "SSD-WD-SN850X-2TB", "PSU-COR-RM850X", "CASE-LL-O11D", "COOL-DPC-LS720"],
  },
  {
    title: "Mid-Range 1440p Gaming",
    description: "The sweet spot for competitive gaming at 1440p high refresh rate.",
    componentSkus: ["CPU-AMD-9700X", "GPU-ZOT-4070", "MB-MSI-B650", "RAM-KIN-32-5600", "SSD-CRU-P3P-1TB", "PSU-SEA-FOCUS-750", "CASE-COR-4000D", "COOL-NOC-D15"],
  },
  {
    title: "Budget Esports Machine",
    description: "Affordable build that dominates in esports titles at 1080p.",
    componentSkus: ["CPU-AMD-5600X", "GPU-GIG-4060TI", "MB-ASR-B760M", "RAM-COR-16-3200", "SSD-CRU-P3P-1TB", "PSU-SEA-FOCUS-750", "CASE-COR-4000D", "COOL-CM-ML240"],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// ORDERS (for live activity feed)
// ─────────────────────────────────────────────────────────────────────────────

const ORDERS_DATA = [
  {
    id: "ORD-SF-001",
    customerName: "Arjun Kapoor",
    email: "arjun@example.com",
    total: 298500,
    items: [
      { sku: "GPU-NV-4090", quantity: 1 },
      { sku: "CPU-AMD-7800X3D", quantity: 1 },
    ],
  },
  {
    id: "ORD-SF-002",
    customerName: "Priya Sharma",
    email: "priya@example.com",
    total: 135000,
    items: [
      { sku: "GPU-ASUS-4080S", quantity: 1 },
    ],
  },
  {
    id: "ORD-SF-003",
    customerName: "Vikram Patel",
    email: "vikram@example.com",
    total: 84500,
    items: [
      { sku: "CPU-INT-14900K", quantity: 1 },
      { sku: "RAM-GSK-32-6000", quantity: 2 },
    ],
  },
  {
    id: "ORD-SF-004",
    customerName: "Sneha Reddy",
    email: "sneha@example.com",
    total: 56000,
    items: [
      { sku: "GPU-ZOT-4070", quantity: 1 },
    ],
  },
  {
    id: "ORD-SF-005",
    customerName: "Rohan Desai",
    email: "rohan@example.com",
    total: 42000,
    items: [
      { sku: "GPU-GIG-4060TI", quantity: 1 },
      { sku: "RAM-COR-16-3200", quantity: 1 },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// RESET
// ─────────────────────────────────────────────────────────────────────────────

async function resetCatalog() {
  await prisma.auditLog.deleteMany().catch(() => {});
  await prisma.creditNoteLineItem.deleteMany().catch(() => {});
  await prisma.creditNote.deleteMany().catch(() => {});
  await prisma.paymentAttempt.deleteMany().catch(() => {});
  await prisma.paymentTransaction.deleteMany().catch(() => {});
  await prisma.invoiceAuditEvent.deleteMany().catch(() => {});
  await prisma.invoiceLineItem.deleteMany().catch(() => {});
  await prisma.invoice.deleteMany().catch(() => {});
  await prisma.shipmentTracking.deleteMany().catch(() => {});
  await prisma.orderLog.deleteMany().catch(() => {});
  await prisma.orderItemUnit.deleteMany().catch(() => {});
  await prisma.orderItem.deleteMany().catch(() => {});
  await prisma.order.deleteMany().catch(() => {});
  await prisma.customer.deleteMany().catch(() => {});
  await prisma.billingProfile.deleteMany().catch(() => {});
  await prisma.searchSuggestion.deleteMany().catch(() => {});
  await prisma.categoryProductCache.deleteMany().catch(() => {});
  await prisma.compatibilityRuleClause.deleteMany().catch(() => {});
  await prisma.compatibilityRule.deleteMany().catch(() => {});
  await prisma.productSpec.deleteMany().catch(() => {});
  await prisma.productMedia.deleteMany().catch(() => {});
  await prisma.inventoryItem.deleteMany().catch(() => {});
  await prisma.stockMovement.deleteMany().catch(() => {});
  await prisma.buildGuideItem.deleteMany().catch(() => {});
  await prisma.buildGuide.deleteMany().catch(() => {});
  await prisma.product.deleteMany().catch(() => {});
  await prisma.tag.deleteMany().catch(() => {});
  await prisma.attributeOption.deleteMany().catch(() => {});
  await prisma.categoryAttribute.deleteMany().catch(() => {});
  await prisma.categoryHierarchy.deleteMany().catch(() => {});
  await prisma.buildSequence.deleteMany().catch(() => {});
  await prisma.brandCategory.deleteMany().catch(() => {});
  await prisma.subcategory.deleteMany().catch(() => {});
  await prisma.brand.deleteMany().catch(() => {});
  await prisma.category.deleteMany().catch(() => {});
}

// ─────────────────────────────────────────────────────────────────────────────
// CORE ROWS
// ─────────────────────────────────────────────────────────────────────────────

async function upsertCoreRows() {
  await prisma.invoiceSequence.upsert({
    where: { id: "invoice_seq" },
    update: {},
    create: { id: "invoice_seq", currentValue: 0 },
  });

  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "Admin User",
      password: "hashed-password",
      role: Role.ADMIN,
    },
  });

  await prisma.billingProfile.upsert({
    where: { id: "default-billing-profile" },
    update: {},
    create: {
      id: "default-billing-profile",
      companyName: "SpecForge Technologies",
      legalName: "SpecForge Technologies Pvt Ltd",
      email: "billing@specforge.com",
      phone: "+91-9876543210",
      addressLine1: "123 Tech Park",
      addressLine2: "Sector 5",
      city: "Bangalore",
      state: "Karnataka",
      postalCode: "560001",
      country: "India",
      gstin: "29ABCDE1234F1Z5",
      currency: "INR",
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// SEED CATEGORIES
// ─────────────────────────────────────────────────────────────────────────────

async function seedCategories() {
  const categoryMap = new Map<string, number>();

  for (const cat of CATEGORIES_DATA) {
    const created = await prisma.category.create({
      data: {
        code: cat.code,
        name: cat.name,
        slug: slugify(cat.name),
        shortLabel: cat.shortLabel,
        description: cat.description,
        image: cat.image ?? null,
        icon: cat.icon,
        displayOrder: cat.displayOrder,
        featuredOrder: cat.featuredOrder ?? null,
        showInFeatured: cat.showInFeatured,
        isActive: true,
      },
    });
    categoryMap.set(cat.code, created.id);
  }

  console.log(`  ✓ ${categoryMap.size} categories created`);
  return categoryMap;
}

// ─────────────────────────────────────────────────────────────────────────────
// SEED BRANDS
// ─────────────────────────────────────────────────────────────────────────────

async function seedBrands(categoryMap: Map<string, number>) {
  const brandMap = new Map<string, string>();

  for (const b of BRANDS_DATA) {
    const created = await prisma.brand.create({
      data: {
        name: b.name,
      },
    });
    brandMap.set(b.name, created.id);

    // Create brand-category associations
    for (const code of b.categoryCodes) {
      const catId = categoryMap.get(code);
      if (catId) {
        await prisma.brandCategory.create({
          data: {
            brandId: created.id,
            categoryId: catId,
          },
        });
      }
    }
  }

  console.log(`  ✓ ${brandMap.size} brands created`);
  return brandMap;
}

// ─────────────────────────────────────────────────────────────────────────────
// SEED PRODUCTS
// ─────────────────────────────────────────────────────────────────────────────

async function seedProducts(
  categoryMap: Map<string, number>,
  brandMap: Map<string, string>
) {
  const productMap = new Map<string, string>(); // sku -> product id

  for (const p of PRODUCTS_DATA) {
    const categoryId = categoryMap.get(p.categoryCode);
    const brandId = brandMap.get(p.brand);

    if (!categoryId) {
      console.warn(`  ⚠ Skipping ${p.name}: category "${p.categoryCode}" not found`);
      continue;
    }

    const created = await prisma.product.create({
      data: {
        name: p.name,
        slug: slugify(p.name),
        sku: p.sku,
        categoryId,
        brandId: brandId ?? null,
        price: p.price,
        description: p.description,
        status: "ACTIVE" as ProductStatus,
        stockStatus: p.stock > 0 ? "IN_STOCK" : "OUT_OF_STOCK",
        isFeatured: p.isFeatured,
        media: {
          create: {
            url: p.image,
            altText: p.name,
            sortOrder: 0,
          },
        },
      },
    });

    productMap.set(p.sku, created.id);

    // Create inventory
    await prisma.inventoryItem.create({
      data: {
        productId: created.id,
        quantity: p.stock,
        costPrice: p.price * 0.7,
        location: "Warehouse A",
      },
    });
  }

  console.log(`  ✓ ${productMap.size} products created`);
  return productMap;
}

// ─────────────────────────────────────────────────────────────────────────────
// SEED BUILD GUIDES
// ─────────────────────────────────────────────────────────────────────────────

async function seedBuildGuides(productMap: Map<string, string>) {
  let count = 0;

  for (const build of BUILDS_DATA) {
    // Calculate total
    const buildProducts = build.componentSkus
      .map(sku => {
        const product = PRODUCTS_DATA.find(p => p.sku === sku);
        const productId = productMap.get(sku);
        return product && productId ? { product, productId } : null;
      })
      .filter(Boolean) as { product: typeof PRODUCTS_DATA[0]; productId: string }[];

    const total = buildProducts.reduce((sum, bp) => sum + bp.product.price, 0);

    const guide = await prisma.buildGuide.create({
      data: {
        title: build.title,
        description: build.description,
        total,
        items: {
          create: buildProducts.map(bp => ({
            productId: bp.productId,
            quantity: 1,
          })),
        },
      },
    });

    count++;
  }

  console.log(`  ✓ ${count} build guides created`);
}

// ─────────────────────────────────────────────────────────────────────────────
// SEED ORDERS (for live activity feed)
// ─────────────────────────────────────────────────────────────────────────────

async function seedOrders(
  productMap: Map<string, string>,
  categoryMap: Map<string, number>
) {
  let count = 0;

  for (const order of ORDERS_DATA) {
    const orderItems = order.items
      .map(item => {
        const product = PRODUCTS_DATA.find(p => p.sku === item.sku);
        const productId = productMap.get(item.sku);
        const categoryId = product ? categoryMap.get(product.categoryCode) : undefined;
        return product && productId && categoryId
          ? { product, productId, categoryId, quantity: item.quantity }
          : null;
      })
      .filter(Boolean) as {
        product: typeof PRODUCTS_DATA[0];
        productId: string;
        categoryId: number;
        quantity: number;
      }[];

    if (orderItems.length === 0) continue;

    await prisma.order.create({
      data: {
        id: order.id,
        customerName: order.customerName,
        email: order.email,
        total: order.total,
        status: "DELIVERED",
        date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // random within last 7 days
        items: {
          create: orderItems.map(item => ({
            productId: item.productId,
            name: item.product.name,
            categoryId: item.categoryId,
            price: item.product.price,
            quantity: item.quantity,
            image: item.product.image,
            sku: item.product.sku,
          })),
        },
      },
    });

    count++;
  }

  console.log(`  ✓ ${count} orders created`);
}

// ─────────────────────────────────────────────────────────────────────────────
// SEED BUILD METADATA, TAGS, SEARCH
// ─────────────────────────────────────────────────────────────────────────────

async function seedBuildMetadata() {
  const hierarchyRootId = crypto.randomUUID();
  await prisma.categoryHierarchy.create({
    data: {
      id: hierarchyRootId,
      label: "PC Components",
      sortOrder: 0,
    }
  });

  // Seed tags
  await prisma.tag.createMany({
    data: [
      { name: "Gaming" },
      { name: "Workstation" },
      { name: "Budget" },
      { name: "Premium" },
      { name: "RGB" },
      { name: "Silent" },
    ],
    skipDuplicates: true,
  });

  console.log("  ✓ Tags and hierarchy created");
}

async function seedSearchAndCache(categoryMap: Map<string, number>) {
  for (const [code, id] of categoryMap.entries()) {
    const products = await prisma.product.findMany({
      where: { categoryId: id },
      select: { price: true },
    });

    if (products.length > 0) {
      const prices = products.map(p => p.price).filter((p): p is number => p !== null);
      await prisma.categoryProductCache.create({
        data: {
          categoryId: id,
          productCount: products.length,
          minPrice: prices.length > 0 ? Math.min(...prices) : null,
          maxPrice: prices.length > 0 ? Math.max(...prices) : null,
        },
      });
    }
  }

  await prisma.searchSuggestion.createMany({
    data: [
      { term: "Ryzen", frequency: 50 },
      { term: "RTX 4070", frequency: 45 },
      { term: "DDR5", frequency: 30 },
      { term: "SSD", frequency: 25 },
      { term: "Full Tower", frequency: 15 },
    ],
  });

  console.log("  ✓ Search suggestions and category cache created");
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🚀 Starting seed...\n");

  await resetCatalog();
  console.log("✓ Catalog reset complete.\n");

  await upsertCoreRows();
  console.log("✓ Core rows upserted.\n");

  console.log("Seeding categories...");
  const categoryMap = await seedCategories();

  console.log("Seeding brands...");
  const brandMap = await seedBrands(categoryMap);

  console.log("Seeding products...");
  const productMap = await seedProducts(categoryMap, brandMap);

  console.log("Seeding build guides...");
  await seedBuildGuides(productMap);

  console.log("Seeding orders...");
  await seedOrders(productMap, categoryMap);

  console.log("Seeding metadata...");
  await seedBuildMetadata();
  await seedSearchAndCache(categoryMap);

  console.log("\n✅ Seeding finished successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

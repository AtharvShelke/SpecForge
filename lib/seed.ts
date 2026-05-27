
import {
  ProductStatus,
  FilterType,
  AttributeInputType,
  CompatibilityLevel,
  StockMovementType,
  SalesChannel,
  OrderStatus,
  InvoiceStatus,
  InvoiceType,
  Currency,
  PaymentMethodType,
  PaymentStatus,
  Role,
} from "@/generated/prisma";
import { prisma } from "./prisma";

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Seeding PC Parts e-commerce database…");
  
  // ── CLEANUP (To allow repeatable seeding) ─────────────────
  console.log("  🧹 Cleaning up existing transactional data…");
  await prisma.auditLog.deleteMany({});
  await prisma.stockMovement.deleteMany({});
  await prisma.shipmentTracking.deleteMany({});
  await prisma.paymentAttempt.deleteMany({});
  await prisma.paymentTransaction.deleteMany({});
  await prisma.invoiceLineItem.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.orderItemUnit.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.categoryHierarchy.deleteMany({});
  await prisma.buildGuideItem.deleteMany({});
  await prisma.buildGuide.deleteMany({});

  // ── 1. USER ──────────────────────────────────────────────
  console.log("  👤 Users…");
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@pcparts.in" },
    update: {},
    create: {
      email: "admin@pcparts.in",
      name: "Admin User",
      password: "$2b$10$hashedpassword_placeholder",
      role: Role.ADMIN,
    },
  });

  // ── 2. CATEGORIES ────────────────────────────────────────
  console.log("  📦 Categories…");

  const categoryDefs = [
    { code: "CPU", name: "Processors", icon: "cpu", displayOrder: 1 },
    { code: "MB", name: "Motherboards", icon: "circuit", displayOrder: 2 },
    { code: "RAM", name: "Memory (RAM)", icon: "memory", displayOrder: 3 },
    { code: "GPU", name: "Graphics Cards", icon: "gpu", displayOrder: 4 },
    { code: "SSD", name: "Storage (SSD/HDD)", icon: "storage", displayOrder: 5 },
    { code: "PSU", name: "Power Supplies", icon: "power", displayOrder: 6 },
    { code: "CASE", name: "PC Cases", icon: "case", displayOrder: 7 },
    { code: "COOL", name: "CPU Coolers", icon: "fan", displayOrder: 8 },
    { code: "MON", name: "Monitors", icon: "monitor", displayOrder: 9 },
    { code: "PERIPH", name: "Peripherals", icon: "keyboard", displayOrder: 10 },
  ];

  const categories: Record<string, Awaited<ReturnType<typeof prisma.category.create>>> = {};

  for (const def of categoryDefs) {
    categories[def.code] = await prisma.category.upsert({
      where: { code: def.code },
      update: {},
      create: {
        code: def.code,
        name: def.name,
        slug: slug(def.name),
        icon: def.icon,
        displayOrder: def.displayOrder,
        showInFeatured: def.displayOrder <= 5,
        featuredOrder: def.displayOrder <= 5 ? def.displayOrder : null,
        isActive: true,
      },
    });
  }

  // ── 3. SUBCATEGORIES ─────────────────────────────────────
  console.log("  📂 Subcategories…");

  const subcatDefs: { categoryCode: string; name: string }[] = [
    { categoryCode: "CPU", name: "Intel Core" },
    { categoryCode: "CPU", name: "AMD Ryzen" },
    { categoryCode: "MB", name: "Intel LGA1700" },
    { categoryCode: "MB", name: "AMD AM5" },
    { categoryCode: "MB", name: "AMD AM4" },
    { categoryCode: "RAM", name: "DDR4" },
    { categoryCode: "RAM", name: "DDR5" },
    { categoryCode: "GPU", name: "NVIDIA GeForce" },
    { categoryCode: "GPU", name: "AMD Radeon" },
    { categoryCode: "SSD", name: "NVMe SSD" },
    { categoryCode: "SSD", name: "SATA SSD" },
    { categoryCode: "SSD", name: "HDD" },
    { categoryCode: "PSU", name: "Modular PSU" },
    { categoryCode: "PSU", name: "Non-Modular PSU" },
    { categoryCode: "CASE", name: "Mid Tower" },
    { categoryCode: "CASE", name: "Full Tower" },
    { categoryCode: "CASE", name: "Mini ITX" },
    { categoryCode: "COOL", name: "Air Cooler" },
    { categoryCode: "COOL", name: "AIO Liquid Cooler" },
    { categoryCode: "MON", name: "Gaming Monitor" },
    { categoryCode: "MON", name: "Professional Monitor" },
  ];

  const subcategories: Record<string, { id: number }> = {};
  for (const s of subcatDefs) {
    const cat = categories[s.categoryCode];
    const key = `${s.categoryCode}:${s.name}`;
    const existing = await prisma.subcategory.findFirst({
      where: { categoryId: cat.id, name: s.name },
    });
    if (existing) {
      subcategories[key] = existing;
    } else {
      subcategories[key] = await prisma.subcategory.create({
        data: {
          categoryId: cat.id,
          name: s.name,
          slug: slug(`${s.categoryCode}-${s.name}`),
          isActive: true,
        },
      });
    }
  }

  // ── 4. BRANDS ────────────────────────────────────────────
  console.log("  🏷  Brands…");

  const brandNames = [
    "Intel", "AMD", "NVIDIA", "ASUS", "MSI", "Gigabyte", "ASRock",
    "Corsair", "G.Skill", "Kingston", "Samsung", "Western Digital", "Seagate",
    "Seasonic", "EVGA", "be quiet!", "Noctua", "Cooler Master", "NZXT",
    "LG", "Dell", "BenQ", "Logitech",
  ];

  const brands: Record<string, { id: string }> = {};
  for (const name of brandNames) {
    brands[name] = await prisma.brand.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // ── 5. BRAND ↔ CATEGORY ──────────────────────────────────
  const brandCategoryLinks: [string, string][] = [
    ["Intel", "CPU"], ["Intel", "MB"],
    ["AMD", "CPU"], ["AMD", "MB"], ["AMD", "GPU"],
    ["NVIDIA", "GPU"],
    ["ASUS", "MB"], ["ASUS", "GPU"], ["ASUS", "MON"],
    ["MSI", "MB"], ["MSI", "GPU"], ["MSI", "MON"],
    ["Gigabyte", "MB"], ["Gigabyte", "GPU"],
    ["ASRock", "MB"],
    ["Corsair", "RAM"], ["Corsair", "PSU"], ["Corsair", "COOL"], ["Corsair", "CASE"],
    ["G.Skill", "RAM"],
    ["Kingston", "RAM"], ["Kingston", "SSD"],
    ["Samsung", "SSD"],
    ["Western Digital", "SSD"],
    ["Seagate", "SSD"],
    ["Seasonic", "PSU"],
    ["EVGA", "PSU"],
    ["be quiet!", "PSU"], ["be quiet!", "COOL"], ["be quiet!", "CASE"],
    ["Noctua", "COOL"],
    ["Cooler Master", "COOL"], ["Cooler Master", "CASE"],
    ["NZXT", "CASE"], ["NZXT", "COOL"],
    ["LG", "MON"],
    ["Dell", "MON"],
    ["BenQ", "MON"],
    ["Logitech", "PERIPH"],
  ];

  for (const [brandName, catCode] of brandCategoryLinks) {
    const brand = brands[brandName];
    const cat = categories[catCode];
    if (!brand || !cat) continue;
    await prisma.brandCategory.upsert({
      where: { brandId_categoryId: { brandId: brand.id, categoryId: cat.id } },
      update: {},
      create: { brandId: brand.id, categoryId: cat.id },
    });
  }

  // ── 6. BUILD SEQUENCE ────────────────────────────────────
  console.log("  🔧 Build sequence…");

  const buildSteps = ["CPU", "MB", "RAM", "GPU", "SSD", "COOL", "PSU", "CASE"];
  for (let i = 0; i < buildSteps.length; i++) {
    const cat = categories[buildSteps[i]];
    await prisma.buildSequence.upsert({
      where: { categoryId: cat.id },
      update: { stepOrder: i + 1 },
      create: { categoryId: cat.id, stepOrder: i + 1 },
    });
  }

  // ── 7. CATEGORY ATTRIBUTES (for dynamic filtering) ───────
  console.log("  🔍 Category attributes…");

  // Helper to create attributes
  async function createAttr(params: {
    categoryCode: string;
    key: string;
    label: string;
    type: AttributeInputType;
    filterType?: FilterType;
    isFilterable?: boolean;
    isComparable?: boolean;
    unit?: string;
    sortOrder?: number;
    options?: string[];
  }) {
    const cat = categories[params.categoryCode];
    let attr = await prisma.categoryAttribute.findFirst({
      where: { categoryId: cat.id, key: params.key, subcategoryId: null },
    });
    if (!attr) {
      attr = await prisma.categoryAttribute.create({
        data: {
          categoryId: cat.id,
          key: params.key,
          label: params.label,
          type: params.type,
          filterType: params.filterType ?? FilterType.checkbox,
          isFilterable: params.isFilterable ?? true,
          isComparable: params.isComparable ?? true,
          unit: params.unit,
          sortOrder: params.sortOrder ?? 0,
        },
      });
    }
    if (params.options?.length) {
      for (let i = 0; i < params.options.length; i++) {
        const val = params.options[i];
        const optSlug = slug(val);
        await prisma.attributeOption.upsert({
          where: { attributeId_slug: { attributeId: attr.id, slug: optSlug } },
          update: {},
          create: { attributeId: attr.id, value: val, slug: optSlug, sortOrder: i },
        });
      }
    }
    return attr;
  }

  // ── CPU Attributes ───
  const cpuSocketAttr = await createAttr({ categoryCode: "CPU", key: "socket", label: "Socket", type: AttributeInputType.select, sortOrder: 0, options: ["LGA1700", "LGA1200", "AM5", "AM4"] });
  const cpuCoresAttr = await createAttr({ categoryCode: "CPU", key: "cores", label: "Cores", type: AttributeInputType.number, filterType: FilterType.range, sortOrder: 1, unit: "cores" });
  const cpuThreadsAttr = await createAttr({ categoryCode: "CPU", key: "threads", label: "Threads", type: AttributeInputType.number, filterType: FilterType.range, sortOrder: 2 });
  const cpuBaseClockAttr = await createAttr({ categoryCode: "CPU", key: "base_clock", label: "Base Clock", type: AttributeInputType.number, filterType: FilterType.range, sortOrder: 3, unit: "GHz" });
  const cpuBoostClkAttr = await createAttr({ categoryCode: "CPU", key: "boost_clock", label: "Boost Clock", type: AttributeInputType.number, filterType: FilterType.range, sortOrder: 4, unit: "GHz" });
  const cpuTdpAttr = await createAttr({ categoryCode: "CPU", key: "tdp", label: "TDP", type: AttributeInputType.number, filterType: FilterType.range, sortOrder: 5, unit: "W" });
  const cpuIgpuAttr = await createAttr({ categoryCode: "CPU", key: "integrated_gpu", label: "Integrated GPU", type: AttributeInputType.boolean, filterType: FilterType.boolean, sortOrder: 6 });
  const cpuGenAttr = await createAttr({ categoryCode: "CPU", key: "generation", label: "Generation", type: AttributeInputType.select, sortOrder: 7, options: ["13th Gen", "14th Gen", "Ryzen 5000", "Ryzen 7000", "Ryzen 9000"] });

  // ── Motherboard Attributes ───
  const mbSocketAttr = await createAttr({ categoryCode: "MB", key: "socket", label: "CPU Socket", type: AttributeInputType.select, sortOrder: 0, options: ["LGA1700", "LGA1200", "AM5", "AM4"] });
  const mbChipsetAttr = await createAttr({ categoryCode: "MB", key: "chipset", label: "Chipset", type: AttributeInputType.select, sortOrder: 1, options: ["Z790", "B760", "H770", "X670E", "X670", "B650E", "B650", "X570", "B550"] });
  const mbFormAttr = await createAttr({ categoryCode: "MB", key: "form_factor", label: "Form Factor", type: AttributeInputType.select, sortOrder: 2, options: ["ATX", "Micro-ATX", "Mini-ITX", "E-ATX"] });
  const mbRamSlotsAttr = await createAttr({ categoryCode: "MB", key: "ram_slots", label: "RAM Slots", type: AttributeInputType.number, filterType: FilterType.range, sortOrder: 3 });
  const mbMaxRamAttr = await createAttr({ categoryCode: "MB", key: "max_ram", label: "Max RAM", type: AttributeInputType.number, filterType: FilterType.range, sortOrder: 4, unit: "GB" });
  const mbDdrAttr = await createAttr({ categoryCode: "MB", key: "ddr_gen", label: "DDR Generation", type: AttributeInputType.select, sortOrder: 5, options: ["DDR4", "DDR5"] });
  const mbM2SlotsAttr = await createAttr({ categoryCode: "MB", key: "m2_slots", label: "M.2 Slots", type: AttributeInputType.number, filterType: FilterType.range, sortOrder: 6 });
  const mbPcieAttr = await createAttr({ categoryCode: "MB", key: "pcie_version", label: "PCIe Version", type: AttributeInputType.select, sortOrder: 7, options: ["PCIe 4.0", "PCIe 5.0"] });
  const mbWifiAttr = await createAttr({ categoryCode: "MB", key: "wifi", label: "Wi-Fi", type: AttributeInputType.boolean, filterType: FilterType.boolean, sortOrder: 8 });

  // ── RAM Attributes ───
  const ramTypeAttr = await createAttr({ categoryCode: "RAM", key: "type", label: "Type", type: AttributeInputType.select, sortOrder: 0, options: ["DDR4", "DDR5"] });
  const ramCapAttr = await createAttr({ categoryCode: "RAM", key: "capacity", label: "Capacity", type: AttributeInputType.select, filterType: FilterType.checkbox, sortOrder: 1, unit: "GB", options: ["8GB", "16GB", "32GB", "48GB", "64GB", "96GB", "128GB"] });
  const ramSpeedAttr = await createAttr({ categoryCode: "RAM", key: "speed", label: "Speed", type: AttributeInputType.select, filterType: FilterType.checkbox, sortOrder: 2, unit: "MHz", options: ["3200MHz", "3600MHz", "4800MHz", "5200MHz", "5600MHz", "6000MHz", "6400MHz"] });
  const ramKitAttr = await createAttr({ categoryCode: "RAM", key: "kit", label: "Kit Config", type: AttributeInputType.select, sortOrder: 3, options: ["1x8GB", "2x8GB", "1x16GB", "2x16GB", "2x24GB", "2x32GB"] });
  const ramCasAttr = await createAttr({ categoryCode: "RAM", key: "cas_latency", label: "CAS Latency", type: AttributeInputType.number, filterType: FilterType.range, sortOrder: 4 });
  const ramRgbAttr = await createAttr({ categoryCode: "RAM", key: "rgb", label: "RGB", type: AttributeInputType.boolean, filterType: FilterType.boolean, sortOrder: 5 });

  // ── GPU Attributes ───
  const gpuChipAttr = await createAttr({ categoryCode: "GPU", key: "gpu_chip", label: "GPU Chip", type: AttributeInputType.select, sortOrder: 0, options: ["RTX 4090", "RTX 4080", "RTX 4070 Ti", "RTX 4070", "RTX 4060", "RX 7900 XTX", "RX 7900 XT", "RX 7800 XT", "RX 7600"] });
  const gpuVramAttr = await createAttr({ categoryCode: "GPU", key: "vram", label: "VRAM", type: AttributeInputType.select, filterType: FilterType.checkbox, sortOrder: 1, unit: "GB", options: ["8GB", "12GB", "16GB", "20GB", "24GB"] });
  const gpuMemTypeAttr = await createAttr({ categoryCode: "GPU", key: "memory_type", label: "Memory Type", type: AttributeInputType.select, sortOrder: 2, options: ["GDDR6", "GDDR6X"] });
  const gpuLengthAttr = await createAttr({ categoryCode: "GPU", key: "length", label: "Card Length", type: AttributeInputType.number, filterType: FilterType.range, sortOrder: 3, unit: "mm" });
  const gpuTdpAttr = await createAttr({ categoryCode: "GPU", key: "tdp", label: "TDP", type: AttributeInputType.number, filterType: FilterType.range, sortOrder: 4, unit: "W" });
  const gpuConnAttr = await createAttr({ categoryCode: "GPU", key: "power_conn", label: "Power Connector", type: AttributeInputType.select, sortOrder: 5, options: ["1x 8-pin", "2x 8-pin", "3x 8-pin", "16-pin (600W)", "16-pin (450W)"] });

  // ── SSD Attributes ───
  const ssdTypeAttr = await createAttr({ categoryCode: "SSD", key: "drive_type", label: "Drive Type", type: AttributeInputType.select, sortOrder: 0, options: ["NVMe SSD", "SATA SSD", "HDD"] });
  const ssdCapAttr = await createAttr({ categoryCode: "SSD", key: "capacity", label: "Capacity", type: AttributeInputType.select, filterType: FilterType.checkbox, sortOrder: 1, options: ["250GB", "500GB", "1TB", "2TB", "4TB", "8TB"] });
  const ssdInterfaceAttr = await createAttr({ categoryCode: "SSD", key: "interface", label: "Interface", type: AttributeInputType.select, sortOrder: 2, options: ["PCIe 4.0 x4", "PCIe 5.0 x4", "SATA III", "PCIe 3.0 x4"] });
  const ssdFormAttr = await createAttr({ categoryCode: "SSD", key: "form_factor", label: "Form Factor", type: AttributeInputType.select, sortOrder: 3, options: ["M.2 2280", "2.5\"", "3.5\""] });
  const ssdReadAttr = await createAttr({ categoryCode: "SSD", key: "seq_read", label: "Sequential Read", type: AttributeInputType.number, filterType: FilterType.range, sortOrder: 4, unit: "MB/s" });
  const ssdWriteAttr = await createAttr({ categoryCode: "SSD", key: "seq_write", label: "Sequential Write", type: AttributeInputType.number, filterType: FilterType.range, sortOrder: 5, unit: "MB/s" });

  // ── PSU Attributes ───
  const psuWattsAttr = await createAttr({ categoryCode: "PSU", key: "wattage", label: "Wattage", type: AttributeInputType.select, filterType: FilterType.checkbox, sortOrder: 0, unit: "W", options: ["450W", "550W", "650W", "750W", "850W", "1000W", "1200W", "1600W"] });
  const psuEffAttr = await createAttr({ categoryCode: "PSU", key: "efficiency", label: "Efficiency", type: AttributeInputType.select, sortOrder: 1, options: ["80+ White", "80+ Bronze", "80+ Gold", "80+ Platinum", "80+ Titanium"] });
  const psuModAttr = await createAttr({ categoryCode: "PSU", key: "modularity", label: "Modularity", type: AttributeInputType.select, sortOrder: 2, options: ["Non-Modular", "Semi-Modular", "Fully Modular"] });
  const psuAtxAttr = await createAttr({ categoryCode: "PSU", key: "atx_version", label: "ATX Version", type: AttributeInputType.select, sortOrder: 3, options: ["ATX 2.x", "ATX 3.0", "ATX 3.1"] });

  // ── Case Attributes ───
  const caseFormAttr = await createAttr({ categoryCode: "CASE", key: "form_factor", label: "Form Factor", type: AttributeInputType.select, sortOrder: 0, options: ["Full Tower", "Mid Tower", "Mini Tower", "Mini ITX"] });
  const caseMbAttr = await createAttr({ categoryCode: "CASE", key: "mb_support", label: "Motherboard Support", type: AttributeInputType.multi_select, sortOrder: 1, options: ["ATX", "Micro-ATX", "Mini-ITX", "E-ATX"] });
  const caseGpuLenAttr = await createAttr({ categoryCode: "CASE", key: "max_gpu_length", label: "Max GPU Length", type: AttributeInputType.number, filterType: FilterType.range, sortOrder: 2, unit: "mm" });
  const caseCoolerHAttr = await createAttr({ categoryCode: "CASE", key: "max_cooler_height", label: "Max Cooler Height", type: AttributeInputType.number, filterType: FilterType.range, sortOrder: 3, unit: "mm" });
  const caseRgbAttr = await createAttr({ categoryCode: "CASE", key: "rgb", label: "RGB", type: AttributeInputType.boolean, filterType: FilterType.boolean, sortOrder: 4 });
  const caseWindowAttr = await createAttr({ categoryCode: "CASE", key: "side_window", label: "Side Window", type: AttributeInputType.boolean, filterType: FilterType.boolean, sortOrder: 5 });

  // ── Cooler Attributes ───
  const coolTypeAttr = await createAttr({ categoryCode: "COOL", key: "cooler_type", label: "Cooler Type", type: AttributeInputType.select, sortOrder: 0, options: ["Air Cooler", "120mm AIO", "240mm AIO", "280mm AIO", "360mm AIO"] });
  const coolSocketAttr = await createAttr({ categoryCode: "COOL", key: "socket_compat", label: "Socket Compatibility", type: AttributeInputType.multi_select, sortOrder: 1, options: ["LGA1700", "LGA1200", "AM5", "AM4"] });
  const coolTdpAttr = await createAttr({ categoryCode: "COOL", key: "tdp_rating", label: "TDP Rating", type: AttributeInputType.number, filterType: FilterType.range, sortOrder: 2, unit: "W" });
  const coolHeightAttr = await createAttr({ categoryCode: "COOL", key: "height", label: "Height", type: AttributeInputType.number, filterType: FilterType.range, sortOrder: 3, unit: "mm" });
  const coolRgbAttr = await createAttr({ categoryCode: "COOL", key: "rgb", label: "RGB", type: AttributeInputType.boolean, filterType: FilterType.boolean, sortOrder: 4 });

  // ── Monitor Attributes ───
  const monSizeAttr = await createAttr({ categoryCode: "MON", key: "screen_size", label: "Screen Size", type: AttributeInputType.select, sortOrder: 0, unit: "inch", options: ["24\"", "27\"", "32\"", "34\" Ultrawide", "49\" Super-Ultrawide"] });
  const monResAttr = await createAttr({ categoryCode: "MON", key: "resolution", label: "Resolution", type: AttributeInputType.select, sortOrder: 1, options: ["1920x1080 (FHD)", "2560x1440 (QHD)", "3840x2160 (4K)", "3440x1440 (UWQHD)"] });
  const monHzAttr = await createAttr({ categoryCode: "MON", key: "refresh_rate", label: "Refresh Rate", type: AttributeInputType.select, filterType: FilterType.checkbox, sortOrder: 2, unit: "Hz", options: ["60Hz", "75Hz", "144Hz", "165Hz", "240Hz", "360Hz"] });
  const monPanelAttr = await createAttr({ categoryCode: "MON", key: "panel_type", label: "Panel Type", type: AttributeInputType.select, sortOrder: 3, options: ["IPS", "VA", "TN", "OLED", "Mini LED"] });

  // ── 8. COMPATIBILITY RULES ───────────────────────────────
  console.log("  🔗 Compatibility rules…");

  // CPU socket must match Motherboard socket
  const cpuMbRule = await prisma.compatibilityRule.create({
    data: {
      sourceCategoryId: categories["CPU"].id,
      targetCategoryId: categories["MB"].id,
      name: "CPU–Motherboard Socket Match",
      message: "The CPU socket must match the motherboard socket.",
      severity: CompatibilityLevel.INCOMPATIBLE,
      isActive: true,
      sortOrder: 1,
    },
  });
  await prisma.compatibilityRuleClause.create({
    data: {
      ruleId: cpuMbRule.id,
      sourceAttributeId: cpuSocketAttr.id,
      targetAttributeId: mbSocketAttr.id,
      operator: "equals",
      sortOrder: 0,
    },
  });

  // RAM DDR gen must match Motherboard DDR gen
  const ramMbRule = await prisma.compatibilityRule.create({
    data: {
      sourceCategoryId: categories["RAM"].id,
      targetCategoryId: categories["MB"].id,
      name: "RAM–Motherboard DDR Generation Match",
      message: "RAM DDR generation must match the motherboard's supported DDR generation.",
      severity: CompatibilityLevel.INCOMPATIBLE,
      isActive: true,
      sortOrder: 2,
    },
  });
  await prisma.compatibilityRuleClause.create({
    data: {
      ruleId: ramMbRule.id,
      sourceAttributeId: ramTypeAttr.id,
      targetAttributeId: mbDdrAttr.id,
      operator: "equals",
      sortOrder: 0,
    },
  });

  // Cooler socket compat warning
  const coolCpuRule = await prisma.compatibilityRule.create({
    data: {
      sourceCategoryId: categories["COOL"].id,
      targetCategoryId: categories["CPU"].id,
      name: "Cooler–CPU Socket Compatibility",
      message: "Ensure your cooler supports the CPU socket.",
      severity: CompatibilityLevel.WARNING,
      isActive: true,
      sortOrder: 3,
    },
  });
  await prisma.compatibilityRuleClause.create({
    data: {
      ruleId: coolCpuRule.id,
      sourceAttributeId: coolSocketAttr.id,
      targetAttributeId: cpuSocketAttr.id,
      operator: "contains",
      sortOrder: 0,
    },
  });

  // ── 9. BUILD GUIDE (PC Builder) ──────────────────────────
  // Products must exist first, so we'll create guides after products.

  // ── 10. PRODUCTS ─────────────────────────────────────────
  console.log("  🖥  Products…");

  type SpecInput = { attrId: string; value: string; valueNumber?: number; valueBoolean?: boolean; optionId?: string };

  async function createProduct(params: {
    name: string;
    categoryCode: string;
    subcategoryName?: string;
    brandName: string;
    sku: string;
    price: number;
    compareAtPrice?: number;
    description?: string;
    specs?: SpecInput[];
    stock?: number;
    partNumber?: string;
  }) {
    const cat = categories[params.categoryCode];
    const brand = brands[params.brandName];
    const subcat = params.subcategoryName
      ? subcategories[`${params.categoryCode}:${params.subcategoryName}`]
      : undefined;

    const existing = await prisma.product.findUnique({ where: { sku: params.sku } });
    if (existing) return existing;

    const product = await prisma.product.create({
      data: {
        name: params.name,
        slug: slug(params.name) + "-" + params.sku.toLowerCase(),
        sku: params.sku,
        price: params.price,
        compareAtPrice: params.compareAtPrice,
        description: params.description ?? `High-performance ${params.name} for PC builds.`,
        status: ProductStatus.ACTIVE,
        categoryId: cat.id,
        subcategoryId: subcat?.id,
        brandId: brand?.id,
        stockStatus: "IN_STOCK",
      },
    });

    // Create inventory
    await prisma.inventoryItem.create({
      data: {
        productId: product.id,
        partNumber: params.partNumber ?? params.sku,
        quantity: params.stock ?? rand(5, 50),
        reserved: 0,
        reorderLevel: 3,
        costPrice: params.price * 0.75,
        location: pick(["SHELF-A1", "SHELF-A2", "SHELF-B1", "SHELF-B2", "SHELF-C1"]),
        lastUpdated: new Date(),
      },
    });

    // Create specs
    if (params.specs) {
      for (const spec of params.specs) {
        await prisma.productSpec.create({
          data: {
            productId: product.id,
            attributeId: spec.attrId,
            optionId: spec.optionId,
            value: spec.value,
            valueNumber: spec.valueNumber,
            valueBoolean: spec.valueBoolean,
          },
        });
      }
    }

    // Create a stock movement (INWARD)
    await prisma.stockMovement.create({
      data: {
        productId: product.id,
        type: StockMovementType.INWARD,
        quantity: params.stock ?? rand(5, 50),
        note: "Initial stock inward",
      },
    });

    return product;
  }

  // ── Helper to get option id by value ───
  async function optId(attrId: string, value: string) {
    const opt = await prisma.attributeOption.findFirst({ where: { attributeId: attrId, value } });
    return opt?.id;
  }

  // ─────────────────────────────────────────────────────────
  // CPUs
  // ─────────────────────────────────────────────────────────
  const cpu1 = await createProduct({
    name: "Intel Core i9-14900K", categoryCode: "CPU", subcategoryName: "Intel Core",
    brandName: "Intel", sku: "CPU-I9-14900K", price: 54999, compareAtPrice: 59999,
    description: "Intel's flagship 14th Gen processor with 24 cores (8P+16E) and 5.8GHz boost clock.",
    specs: [
      { attrId: cpuSocketAttr.id, value: "LGA1700", optionId: await optId(cpuSocketAttr.id, "LGA1700") },
      { attrId: cpuCoresAttr.id, value: "24", valueNumber: 24 },
      { attrId: cpuThreadsAttr.id, value: "32", valueNumber: 32 },
      { attrId: cpuBaseClockAttr.id, value: "3.2", valueNumber: 3.2 },
      { attrId: cpuBoostClkAttr.id, value: "5.8", valueNumber: 5.8 },
      { attrId: cpuTdpAttr.id, value: "125", valueNumber: 125 },
      { attrId: cpuIgpuAttr.id, value: "true", valueBoolean: true },
      { attrId: cpuGenAttr.id, value: "14th Gen", optionId: await optId(cpuGenAttr.id, "14th Gen") },
    ],
  });

  const cpu2 = await createProduct({
    name: "Intel Core i7-13700K", categoryCode: "CPU", subcategoryName: "Intel Core",
    brandName: "Intel", sku: "CPU-I7-13700K", price: 38999, compareAtPrice: 44999,
    description: "16-core 13th Gen Intel processor ideal for gaming and content creation.",
    specs: [
      { attrId: cpuSocketAttr.id, value: "LGA1700", optionId: await optId(cpuSocketAttr.id, "LGA1700") },
      { attrId: cpuCoresAttr.id, value: "16", valueNumber: 16 },
      { attrId: cpuThreadsAttr.id, value: "24", valueNumber: 24 },
      { attrId: cpuBaseClockAttr.id, value: "3.4", valueNumber: 3.4 },
      { attrId: cpuBoostClkAttr.id, value: "5.4", valueNumber: 5.4 },
      { attrId: cpuTdpAttr.id, value: "125", valueNumber: 125 },
      { attrId: cpuIgpuAttr.id, value: "true", valueBoolean: true },
      { attrId: cpuGenAttr.id, value: "13th Gen", optionId: await optId(cpuGenAttr.id, "13th Gen") ?? undefined },
    ],
  });

  const cpu3 = await createProduct({
    name: "AMD Ryzen 9 7950X", categoryCode: "CPU", subcategoryName: "AMD Ryzen",
    brandName: "AMD", sku: "CPU-R9-7950X", price: 57999, compareAtPrice: 64999,
    description: "AMD's 16-core Zen 4 flagship for workstation and enthusiast builds.",
    specs: [
      { attrId: cpuSocketAttr.id, value: "AM5", optionId: await optId(cpuSocketAttr.id, "AM5") },
      { attrId: cpuCoresAttr.id, value: "16", valueNumber: 16 },
      { attrId: cpuThreadsAttr.id, value: "32", valueNumber: 32 },
      { attrId: cpuBaseClockAttr.id, value: "4.5", valueNumber: 4.5 },
      { attrId: cpuBoostClkAttr.id, value: "5.7", valueNumber: 5.7 },
      { attrId: cpuTdpAttr.id, value: "170", valueNumber: 170 },
      { attrId: cpuIgpuAttr.id, value: "false", valueBoolean: false },
      { attrId: cpuGenAttr.id, value: "Ryzen 7000", optionId: await optId(cpuGenAttr.id, "Ryzen 7000") },
    ],
  });

  const cpu4 = await createProduct({
    name: "AMD Ryzen 5 7600X", categoryCode: "CPU", subcategoryName: "AMD Ryzen",
    brandName: "AMD", sku: "CPU-R5-7600X", price: 22999, compareAtPrice: 25999,
    description: "6-core Zen 4 CPU offering exceptional gaming performance at its price point.",
    specs: [
      { attrId: cpuSocketAttr.id, value: "AM5", optionId: await optId(cpuSocketAttr.id, "AM5") },
      { attrId: cpuCoresAttr.id, value: "6", valueNumber: 6 },
      { attrId: cpuThreadsAttr.id, value: "12", valueNumber: 12 },
      { attrId: cpuBaseClockAttr.id, value: "4.7", valueNumber: 4.7 },
      { attrId: cpuBoostClkAttr.id, value: "5.3", valueNumber: 5.3 },
      { attrId: cpuTdpAttr.id, value: "105", valueNumber: 105 },
      { attrId: cpuIgpuAttr.id, value: "false", valueBoolean: false },
      { attrId: cpuGenAttr.id, value: "Ryzen 7000", optionId: await optId(cpuGenAttr.id, "Ryzen 7000") },
    ],
  });

  const cpu5 = await createProduct({
    name: "AMD Ryzen 5 5600X", categoryCode: "CPU", subcategoryName: "AMD Ryzen",
    brandName: "AMD", sku: "CPU-R5-5600X", price: 14999, compareAtPrice: 17999,
    description: "Best-value 6-core AM4 CPU for budget-conscious builds.",
    specs: [
      { attrId: cpuSocketAttr.id, value: "AM4", optionId: await optId(cpuSocketAttr.id, "AM4") },
      { attrId: cpuCoresAttr.id, value: "6", valueNumber: 6 },
      { attrId: cpuThreadsAttr.id, value: "12", valueNumber: 12 },
      { attrId: cpuBaseClockAttr.id, value: "3.7", valueNumber: 3.7 },
      { attrId: cpuBoostClkAttr.id, value: "4.6", valueNumber: 4.6 },
      { attrId: cpuTdpAttr.id, value: "65", valueNumber: 65 },
      { attrId: cpuIgpuAttr.id, value: "false", valueBoolean: false },
      { attrId: cpuGenAttr.id, value: "Ryzen 5000", optionId: await optId(cpuGenAttr.id, "Ryzen 5000") },
    ],
  });

  // ─────────────────────────────────────────────────────────
  // MOTHERBOARDS
  // ─────────────────────────────────────────────────────────
  const mb1 = await createProduct({
    name: "ASUS ROG Maximus Z790 Hero", categoryCode: "MB", subcategoryName: "Intel LGA1700",
    brandName: "ASUS", sku: "MB-Z790-ROG-HERO", price: 74999, compareAtPrice: 79999,
    description: "Premium Z790 ATX board with PCIe 5.0, DDR5, and extensive overclocking features.",
    specs: [
      { attrId: mbSocketAttr.id, value: "LGA1700", optionId: await optId(mbSocketAttr.id, "LGA1700") },
      { attrId: mbChipsetAttr.id, value: "Z790", optionId: await optId(mbChipsetAttr.id, "Z790") },
      { attrId: mbFormAttr.id, value: "ATX", optionId: await optId(mbFormAttr.id, "ATX") },
      { attrId: mbRamSlotsAttr.id, value: "4", valueNumber: 4 },
      { attrId: mbMaxRamAttr.id, value: "128", valueNumber: 128 },
      { attrId: mbDdrAttr.id, value: "DDR5", optionId: await optId(mbDdrAttr.id, "DDR5") },
      { attrId: mbM2SlotsAttr.id, value: "5", valueNumber: 5 },
      { attrId: mbPcieAttr.id, value: "PCIe 5.0", optionId: await optId(mbPcieAttr.id, "PCIe 5.0") },
      { attrId: mbWifiAttr.id, value: "true", valueBoolean: true },
    ],
  });

  const mb2 = await createProduct({
    name: "MSI MAG B760M Mortar WiFi", categoryCode: "MB", subcategoryName: "Intel LGA1700",
    brandName: "MSI", sku: "MB-B760M-MAG-MORTAR", price: 18999, compareAtPrice: 21999,
    description: "Micro-ATX B760 board with DDR5 and Wi-Fi 6E for budget Intel builds.",
    specs: [
      { attrId: mbSocketAttr.id, value: "LGA1700", optionId: await optId(mbSocketAttr.id, "LGA1700") },
      { attrId: mbChipsetAttr.id, value: "B760", optionId: await optId(mbChipsetAttr.id, "B760") },
      { attrId: mbFormAttr.id, value: "Micro-ATX", optionId: await optId(mbFormAttr.id, "Micro-ATX") },
      { attrId: mbRamSlotsAttr.id, value: "4", valueNumber: 4 },
      { attrId: mbMaxRamAttr.id, value: "128", valueNumber: 128 },
      { attrId: mbDdrAttr.id, value: "DDR5", optionId: await optId(mbDdrAttr.id, "DDR5") },
      { attrId: mbM2SlotsAttr.id, value: "2", valueNumber: 2 },
      { attrId: mbPcieAttr.id, value: "PCIe 4.0", optionId: await optId(mbPcieAttr.id, "PCIe 4.0") },
      { attrId: mbWifiAttr.id, value: "true", valueBoolean: true },
    ],
  });

  const mb3 = await createProduct({
    name: "ASUS ProArt X670E-Creator WiFi", categoryCode: "MB", subcategoryName: "AMD AM5",
    brandName: "ASUS", sku: "MB-X670E-PROART", price: 52999, compareAtPrice: 57999,
    description: "Content creator-oriented X670E ATX board with Thunderbolt 4 and PCIe 5.0.",
    specs: [
      { attrId: mbSocketAttr.id, value: "AM5", optionId: await optId(mbSocketAttr.id, "AM5") },
      { attrId: mbChipsetAttr.id, value: "X670E", optionId: await optId(mbChipsetAttr.id, "X670E") },
      { attrId: mbFormAttr.id, value: "ATX", optionId: await optId(mbFormAttr.id, "ATX") },
      { attrId: mbRamSlotsAttr.id, value: "4", valueNumber: 4 },
      { attrId: mbMaxRamAttr.id, value: "128", valueNumber: 128 },
      { attrId: mbDdrAttr.id, value: "DDR5", optionId: await optId(mbDdrAttr.id, "DDR5") },
      { attrId: mbM2SlotsAttr.id, value: "4", valueNumber: 4 },
      { attrId: mbPcieAttr.id, value: "PCIe 5.0", optionId: await optId(mbPcieAttr.id, "PCIe 5.0") },
      { attrId: mbWifiAttr.id, value: "true", valueBoolean: true },
    ],
  });

  const mb4 = await createProduct({
    name: "Gigabyte B550M DS3H", categoryCode: "MB", subcategoryName: "AMD AM4",
    brandName: "Gigabyte", sku: "MB-B550M-DS3H", price: 8499, compareAtPrice: 9999,
    description: "Entry-level B550 Micro-ATX board with DDR4 for AM4 budget builds.",
    specs: [
      { attrId: mbSocketAttr.id, value: "AM4", optionId: await optId(mbSocketAttr.id, "AM4") },
      { attrId: mbChipsetAttr.id, value: "B550", optionId: await optId(mbChipsetAttr.id, "B550") },
      { attrId: mbFormAttr.id, value: "Micro-ATX", optionId: await optId(mbFormAttr.id, "Micro-ATX") },
      { attrId: mbRamSlotsAttr.id, value: "2", valueNumber: 2 },
      { attrId: mbMaxRamAttr.id, value: "64", valueNumber: 64 },
      { attrId: mbDdrAttr.id, value: "DDR4", optionId: await optId(mbDdrAttr.id, "DDR4") },
      { attrId: mbM2SlotsAttr.id, value: "2", valueNumber: 2 },
      { attrId: mbPcieAttr.id, value: "PCIe 4.0", optionId: await optId(mbPcieAttr.id, "PCIe 4.0") },
      { attrId: mbWifiAttr.id, value: "false", valueBoolean: false },
    ],
  });

  // ─────────────────────────────────────────────────────────
  // RAM
  // ─────────────────────────────────────────────────────────
  const ram1 = await createProduct({
    name: "Corsair Dominator Platinum RGB 32GB DDR5-6000", categoryCode: "RAM", subcategoryName: "DDR5",
    brandName: "Corsair", sku: "RAM-DDR5-6000-32GB-COR", price: 12999, compareAtPrice: 14999,
    specs: [
      { attrId: ramTypeAttr.id, value: "DDR5", optionId: await optId(ramTypeAttr.id, "DDR5") },
      { attrId: ramCapAttr.id, value: "32GB", optionId: await optId(ramCapAttr.id, "32GB") },
      { attrId: ramSpeedAttr.id, value: "6000MHz", optionId: await optId(ramSpeedAttr.id, "6000MHz") },
      { attrId: ramKitAttr.id, value: "2x16GB", optionId: await optId(ramKitAttr.id, "2x16GB") },
      { attrId: ramCasAttr.id, value: "30", valueNumber: 30 },
      { attrId: ramRgbAttr.id, value: "true", valueBoolean: true },
    ],
  });

  const ram2 = await createProduct({
    name: "G.Skill Trident Z5 RGB 64GB DDR5-6400", categoryCode: "RAM", subcategoryName: "DDR5",
    brandName: "G.Skill", sku: "RAM-DDR5-6400-64GB-GS", price: 24999, compareAtPrice: 27999,
    specs: [
      { attrId: ramTypeAttr.id, value: "DDR5", optionId: await optId(ramTypeAttr.id, "DDR5") },
      { attrId: ramCapAttr.id, value: "64GB", optionId: await optId(ramCapAttr.id, "64GB") },
      { attrId: ramSpeedAttr.id, value: "6400MHz", optionId: await optId(ramSpeedAttr.id, "6400MHz") },
      { attrId: ramKitAttr.id, value: "2x32GB", optionId: await optId(ramKitAttr.id, "2x32GB") },
      { attrId: ramCasAttr.id, value: "32", valueNumber: 32 },
      { attrId: ramRgbAttr.id, value: "true", valueBoolean: true },
    ],
  });

  const ram3 = await createProduct({
    name: "Corsair Vengeance 16GB DDR4-3600", categoryCode: "RAM", subcategoryName: "DDR4",
    brandName: "Corsair", sku: "RAM-DDR4-3600-16GB-COR", price: 4499, compareAtPrice: 5499,
    specs: [
      { attrId: ramTypeAttr.id, value: "DDR4", optionId: await optId(ramTypeAttr.id, "DDR4") },
      { attrId: ramCapAttr.id, value: "16GB", optionId: await optId(ramCapAttr.id, "16GB") },
      { attrId: ramSpeedAttr.id, value: "3600MHz", optionId: await optId(ramSpeedAttr.id, "3600MHz") },
      { attrId: ramKitAttr.id, value: "2x8GB", optionId: await optId(ramKitAttr.id, "2x8GB") },
      { attrId: ramCasAttr.id, value: "18", valueNumber: 18 },
      { attrId: ramRgbAttr.id, value: "false", valueBoolean: false },
    ],
  });

  const ram4 = await createProduct({
    name: "Kingston Fury Beast 32GB DDR4-3200", categoryCode: "RAM", subcategoryName: "DDR4",
    brandName: "Kingston", sku: "RAM-DDR4-3200-32GB-KIN", price: 7999, compareAtPrice: 8999,
    specs: [
      { attrId: ramTypeAttr.id, value: "DDR4", optionId: await optId(ramTypeAttr.id, "DDR4") },
      { attrId: ramCapAttr.id, value: "32GB", optionId: await optId(ramCapAttr.id, "32GB") },
      { attrId: ramSpeedAttr.id, value: "3200MHz", optionId: await optId(ramSpeedAttr.id, "3200MHz") },
      { attrId: ramKitAttr.id, value: "2x16GB", optionId: await optId(ramKitAttr.id, "2x16GB") },
      { attrId: ramCasAttr.id, value: "16", valueNumber: 16 },
      { attrId: ramRgbAttr.id, value: "false", valueBoolean: false },
    ],
  });

  // ─────────────────────────────────────────────────────────
  // GPUs
  // ─────────────────────────────────────────────────────────
  const gpu1 = await createProduct({
    name: "ASUS ROG Strix GeForce RTX 4090 OC 24GB", categoryCode: "GPU", subcategoryName: "NVIDIA GeForce",
    brandName: "ASUS", sku: "GPU-RTX4090-ROG-STRIX", price: 164999, compareAtPrice: 174999,
    description: "Flagship NVIDIA RTX 4090 with 24GB GDDR6X, triple-fan cooling, and factory overclock.",
    specs: [
      { attrId: gpuChipAttr.id, value: "RTX 4090", optionId: await optId(gpuChipAttr.id, "RTX 4090") },
      { attrId: gpuVramAttr.id, value: "24GB", optionId: await optId(gpuVramAttr.id, "24GB") },
      { attrId: gpuMemTypeAttr.id, value: "GDDR6X", optionId: await optId(gpuMemTypeAttr.id, "GDDR6X") },
      { attrId: gpuLengthAttr.id, value: "357", valueNumber: 357 },
      { attrId: gpuTdpAttr.id, value: "450", valueNumber: 450 },
      { attrId: gpuConnAttr.id, value: "16-pin (600W)", optionId: await optId(gpuConnAttr.id, "16-pin (600W)") },
    ],
  });

  const gpu2 = await createProduct({
    name: "MSI Gaming GeForce RTX 4070 Ti Super 16GB", categoryCode: "GPU", subcategoryName: "NVIDIA GeForce",
    brandName: "MSI", sku: "GPU-RTX4070TIS-MSI", price: 74999, compareAtPrice: 79999,
    specs: [
      { attrId: gpuChipAttr.id, value: "RTX 4070 Ti", optionId: await optId(gpuChipAttr.id, "RTX 4070 Ti") },
      { attrId: gpuVramAttr.id, value: "16GB", optionId: await optId(gpuVramAttr.id, "16GB") },
      { attrId: gpuMemTypeAttr.id, value: "GDDR6X", optionId: await optId(gpuMemTypeAttr.id, "GDDR6X") },
      { attrId: gpuLengthAttr.id, value: "336", valueNumber: 336 },
      { attrId: gpuTdpAttr.id, value: "285", valueNumber: 285 },
      { attrId: gpuConnAttr.id, value: "16-pin (450W)", optionId: await optId(gpuConnAttr.id, "16-pin (450W)") },
    ],
  });

  const gpu3 = await createProduct({
    name: "Gigabyte Radeon RX 7900 XTX Gaming OC 24GB", categoryCode: "GPU", subcategoryName: "AMD Radeon",
    brandName: "Gigabyte", sku: "GPU-RX7900XTX-GIB", price: 84999, compareAtPrice: 89999,
    specs: [
      { attrId: gpuChipAttr.id, value: "RX 7900 XTX", optionId: await optId(gpuChipAttr.id, "RX 7900 XTX") },
      { attrId: gpuVramAttr.id, value: "24GB", optionId: await optId(gpuVramAttr.id, "24GB") },
      { attrId: gpuMemTypeAttr.id, value: "GDDR6", optionId: await optId(gpuMemTypeAttr.id, "GDDR6") },
      { attrId: gpuLengthAttr.id, value: "337", valueNumber: 337 },
      { attrId: gpuTdpAttr.id, value: "355", valueNumber: 355 },
      { attrId: gpuConnAttr.id, value: "3x 8-pin", optionId: await optId(gpuConnAttr.id, "3x 8-pin") },
    ],
  });

  const gpu4 = await createProduct({
    name: "MSI Mech Radeon RX 7600 8GB", categoryCode: "GPU", subcategoryName: "AMD Radeon",
    brandName: "MSI", sku: "GPU-RX7600-MSI-MECH", price: 23999, compareAtPrice: 25999,
    specs: [
      { attrId: gpuChipAttr.id, value: "RX 7600", optionId: await optId(gpuChipAttr.id, "RX 7600") },
      { attrId: gpuVramAttr.id, value: "8GB", optionId: await optId(gpuVramAttr.id, "8GB") },
      { attrId: gpuMemTypeAttr.id, value: "GDDR6", optionId: await optId(gpuMemTypeAttr.id, "GDDR6") },
      { attrId: gpuLengthAttr.id, value: "209", valueNumber: 209 },
      { attrId: gpuTdpAttr.id, value: "165", valueNumber: 165 },
      { attrId: gpuConnAttr.id, value: "1x 8-pin", optionId: await optId(gpuConnAttr.id, "1x 8-pin") },
    ],
  });

  // ─────────────────────────────────────────────────────────
  // SSDs
  // ─────────────────────────────────────────────────────────
  const ssd1 = await createProduct({
    name: "Samsung 990 Pro 2TB NVMe SSD", categoryCode: "SSD", subcategoryName: "NVMe SSD",
    brandName: "Samsung", sku: "SSD-990PRO-2TB-SAM", price: 13999, compareAtPrice: 15999,
    specs: [
      { attrId: ssdTypeAttr.id, value: "NVMe SSD", optionId: await optId(ssdTypeAttr.id, "NVMe SSD") },
      { attrId: ssdCapAttr.id, value: "2TB", optionId: await optId(ssdCapAttr.id, "2TB") },
      { attrId: ssdInterfaceAttr.id, value: "PCIe 4.0 x4", optionId: await optId(ssdInterfaceAttr.id, "PCIe 4.0 x4") },
      { attrId: ssdFormAttr.id, value: "M.2 2280", optionId: await optId(ssdFormAttr.id, "M.2 2280") },
      { attrId: ssdReadAttr.id, value: "7450", valueNumber: 7450 },
      { attrId: ssdWriteAttr.id, value: "6900", valueNumber: 6900 },
    ],
  });

  const ssd2 = await createProduct({
    name: "WD Black SN850X 1TB NVMe SSD", categoryCode: "SSD", subcategoryName: "NVMe SSD",
    brandName: "Western Digital", sku: "SSD-SN850X-1TB-WD", price: 8499, compareAtPrice: 9999,
    specs: [
      { attrId: ssdTypeAttr.id, value: "NVMe SSD", optionId: await optId(ssdTypeAttr.id, "NVMe SSD") },
      { attrId: ssdCapAttr.id, value: "1TB", optionId: await optId(ssdCapAttr.id, "1TB") },
      { attrId: ssdInterfaceAttr.id, value: "PCIe 4.0 x4", optionId: await optId(ssdInterfaceAttr.id, "PCIe 4.0 x4") },
      { attrId: ssdFormAttr.id, value: "M.2 2280", optionId: await optId(ssdFormAttr.id, "M.2 2280") },
      { attrId: ssdReadAttr.id, value: "7300", valueNumber: 7300 },
      { attrId: ssdWriteAttr.id, value: "6600", valueNumber: 6600 },
    ],
  });

  const ssd3 = await createProduct({
    name: "Samsung 870 EVO 1TB SATA SSD", categoryCode: "SSD", subcategoryName: "SATA SSD",
    brandName: "Samsung", sku: "SSD-870EVO-1TB-SAM", price: 6999, compareAtPrice: 7999,
    specs: [
      { attrId: ssdTypeAttr.id, value: "SATA SSD", optionId: await optId(ssdTypeAttr.id, "SATA SSD") },
      { attrId: ssdCapAttr.id, value: "1TB", optionId: await optId(ssdCapAttr.id, "1TB") },
      { attrId: ssdInterfaceAttr.id, value: "SATA III", optionId: await optId(ssdInterfaceAttr.id, "SATA III") },
      { attrId: ssdFormAttr.id, value: "2.5\"", optionId: await optId(ssdFormAttr.id, "2.5\"") },
      { attrId: ssdReadAttr.id, value: "560", valueNumber: 560 },
      { attrId: ssdWriteAttr.id, value: "530", valueNumber: 530 },
    ],
  });

  const ssd4 = await createProduct({
    name: "Seagate Barracuda 4TB HDD", categoryCode: "SSD", subcategoryName: "HDD",
    brandName: "Seagate", sku: "HDD-BARCUDA-4TB-SEA", price: 5999, compareAtPrice: 6999,
    specs: [
      { attrId: ssdTypeAttr.id, value: "HDD", optionId: await optId(ssdTypeAttr.id, "HDD") },
      { attrId: ssdCapAttr.id, value: "4TB", optionId: await optId(ssdCapAttr.id, "4TB") },
      { attrId: ssdInterfaceAttr.id, value: "SATA III", optionId: await optId(ssdInterfaceAttr.id, "SATA III") },
      { attrId: ssdFormAttr.id, value: "3.5\"", optionId: await optId(ssdFormAttr.id, "3.5\"") },
      { attrId: ssdReadAttr.id, value: "190", valueNumber: 190 },
      { attrId: ssdWriteAttr.id, value: "190", valueNumber: 190 },
    ],
  });

  // ─────────────────────────────────────────────────────────
  // PSUs
  // ─────────────────────────────────────────────────────────
  const psu1 = await createProduct({
    name: "Seasonic PRIME TX-1000 Titanium", categoryCode: "PSU", subcategoryName: "Modular PSU",
    brandName: "Seasonic", sku: "PSU-TX1000-SEASONIC", price: 24999, compareAtPrice: 27999,
    specs: [
      { attrId: psuWattsAttr.id, value: "1000W", optionId: await optId(psuWattsAttr.id, "1000W") },
      { attrId: psuEffAttr.id, value: "80+ Titanium", optionId: await optId(psuEffAttr.id, "80+ Titanium") },
      { attrId: psuModAttr.id, value: "Fully Modular", optionId: await optId(psuModAttr.id, "Fully Modular") },
      { attrId: psuAtxAttr.id, value: "ATX 3.0", optionId: await optId(psuAtxAttr.id, "ATX 3.0") },
    ],
  });

  const psu2 = await createProduct({
    name: "Corsair RM850x Gold Fully Modular", categoryCode: "PSU", subcategoryName: "Modular PSU",
    brandName: "Corsair", sku: "PSU-RM850X-CORSAIR", price: 13999, compareAtPrice: 15999,
    specs: [
      { attrId: psuWattsAttr.id, value: "850W", optionId: await optId(psuWattsAttr.id, "850W") },
      { attrId: psuEffAttr.id, value: "80+ Gold", optionId: await optId(psuEffAttr.id, "80+ Gold") },
      { attrId: psuModAttr.id, value: "Fully Modular", optionId: await optId(psuModAttr.id, "Fully Modular") },
      { attrId: psuAtxAttr.id, value: "ATX 3.0", optionId: await optId(psuAtxAttr.id, "ATX 3.0") },
    ],
  });

  const psu3 = await createProduct({
    name: "be quiet! Pure Power 12 650W Gold", categoryCode: "PSU", subcategoryName: "Non-Modular PSU",
    brandName: "be quiet!", sku: "PSU-PP12-650W-BQ", price: 7499, compareAtPrice: 8499,
    specs: [
      { attrId: psuWattsAttr.id, value: "650W", optionId: await optId(psuWattsAttr.id, "650W") },
      { attrId: psuEffAttr.id, value: "80+ Gold", optionId: await optId(psuEffAttr.id, "80+ Gold") },
      { attrId: psuModAttr.id, value: "Non-Modular", optionId: await optId(psuModAttr.id, "Non-Modular") },
      { attrId: psuAtxAttr.id, value: "ATX 2.x", optionId: await optId(psuAtxAttr.id, "ATX 2.x") },
    ],
  });

  // ─────────────────────────────────────────────────────────
  // CASES
  // ─────────────────────────────────────────────────────────
  const case1 = await createProduct({
    name: "Lian Li O11 Dynamic EVO Mid Tower", categoryCode: "CASE", subcategoryName: "Mid Tower",
    brandName: "Cooler Master", sku: "CASE-O11EVO-LI", price: 14999, compareAtPrice: 16999,
    specs: [
      { attrId: caseFormAttr.id, value: "Mid Tower" },
      { attrId: caseMbAttr.id, value: "ATX" },
      { attrId: caseGpuLenAttr.id, value: "420", valueNumber: 420 },
      { attrId: caseCoolerHAttr.id, value: "167", valueNumber: 167 },
      { attrId: caseRgbAttr.id, value: "false", valueBoolean: false },
      { attrId: caseWindowAttr.id, value: "true", valueBoolean: true },
    ],
  });

  const case2 = await createProduct({
    name: "NZXT H510 Flow Mid Tower", categoryCode: "CASE", subcategoryName: "Mid Tower",
    brandName: "NZXT", sku: "CASE-H510FLOW-NZXT", price: 8999, compareAtPrice: 9999,
    specs: [
      { attrId: caseFormAttr.id, value: "Mid Tower" },
      { attrId: caseMbAttr.id, value: "ATX" },
      { attrId: caseGpuLenAttr.id, value: "381", valueNumber: 381 },
      { attrId: caseCoolerHAttr.id, value: "165", valueNumber: 165 },
      { attrId: caseRgbAttr.id, value: "false", valueBoolean: false },
      { attrId: caseWindowAttr.id, value: "true", valueBoolean: true },
    ],
  });

  const case3 = await createProduct({
    name: "Fractal Design Torrent Full Tower", categoryCode: "CASE", subcategoryName: "Full Tower",
    brandName: "Cooler Master", sku: "CASE-TORRENT-FD", price: 19999, compareAtPrice: 22999,
    specs: [
      { attrId: caseFormAttr.id, value: "Full Tower" },
      { attrId: caseMbAttr.id, value: "E-ATX" },
      { attrId: caseGpuLenAttr.id, value: "461", valueNumber: 461 },
      { attrId: caseCoolerHAttr.id, value: "190", valueNumber: 190 },
      { attrId: caseRgbAttr.id, value: "false", valueBoolean: false },
      { attrId: caseWindowAttr.id, value: "true", valueBoolean: true },
    ],
  });

  // ─────────────────────────────────────────────────────────
  // CPU COOLERS
  // ─────────────────────────────────────────────────────────
  const cool1 = await createProduct({
    name: "Noctua NH-D15 chromax.black Air Cooler", categoryCode: "COOL", subcategoryName: "Air Cooler",
    brandName: "Noctua", sku: "COOL-NHD15-NOC", price: 9999, compareAtPrice: 11999,
    specs: [
      { attrId: coolTypeAttr.id, value: "Air Cooler", optionId: await optId(coolTypeAttr.id, "Air Cooler") },
      { attrId: coolSocketAttr.id, value: "LGA1700" },
      { attrId: coolTdpAttr.id, value: "250", valueNumber: 250 },
      { attrId: coolHeightAttr.id, value: "165", valueNumber: 165 },
      { attrId: coolRgbAttr.id, value: "false", valueBoolean: false },
    ],
  });

  const cool2 = await createProduct({
    name: "Corsair iCUE H150i Elite LCD 360mm AIO", categoryCode: "COOL", subcategoryName: "AIO Liquid Cooler",
    brandName: "Corsair", sku: "COOL-H150I-360-COR", price: 17999, compareAtPrice: 19999,
    specs: [
      { attrId: coolTypeAttr.id, value: "360mm AIO", optionId: await optId(coolTypeAttr.id, "360mm AIO") },
      { attrId: coolSocketAttr.id, value: "LGA1700" },
      { attrId: coolTdpAttr.id, value: "350", valueNumber: 350 },
      { attrId: coolHeightAttr.id, value: "52", valueNumber: 52 },
      { attrId: coolRgbAttr.id, value: "true", valueBoolean: true },
    ],
  });

  const cool3 = await createProduct({
    name: "be quiet! Dark Rock Pro 4 Air Cooler", categoryCode: "COOL", subcategoryName: "Air Cooler",
    brandName: "be quiet!", sku: "COOL-DRP4-BQ", price: 6999, compareAtPrice: 7999,
    specs: [
      { attrId: coolTypeAttr.id, value: "Air Cooler", optionId: await optId(coolTypeAttr.id, "Air Cooler") },
      { attrId: coolSocketAttr.id, value: "AM4" },
      { attrId: coolTdpAttr.id, value: "250", valueNumber: 250 },
      { attrId: coolHeightAttr.id, value: "162", valueNumber: 162 },
      { attrId: coolRgbAttr.id, value: "false", valueBoolean: false },
    ],
  });

  // ─────────────────────────────────────────────────────────
  // MONITORS
  // ─────────────────────────────────────────────────────────
  await createProduct({
    name: "LG 27GP850-B 27\" QHD 165Hz IPS", categoryCode: "MON", subcategoryName: "Gaming Monitor",
    brandName: "LG", sku: "MON-27GP850-LG", price: 26999, compareAtPrice: 29999,
    specs: [
      { attrId: monSizeAttr.id, value: "27\"", optionId: await optId(monSizeAttr.id, "27\"") },
      { attrId: monResAttr.id, value: "2560x1440 (QHD)", optionId: await optId(monResAttr.id, "2560x1440 (QHD)") },
      { attrId: monHzAttr.id, value: "165Hz", optionId: await optId(monHzAttr.id, "165Hz") },
      { attrId: monPanelAttr.id, value: "IPS", optionId: await optId(monPanelAttr.id, "IPS") },
    ],
  });

  await createProduct({
    name: "Dell Alienware AW3423DWF 34\" OLED", categoryCode: "MON", subcategoryName: "Gaming Monitor",
    brandName: "Dell", sku: "MON-AW3423DWF-DELL", price: 84999, compareAtPrice: 89999,
    specs: [
      { attrId: monSizeAttr.id, value: "34\" Ultrawide", optionId: await optId(monSizeAttr.id, "34\" Ultrawide") },
      { attrId: monResAttr.id, value: "3440x1440 (UWQHD)", optionId: await optId(monResAttr.id, "3440x1440 (UWQHD)") },
      { attrId: monHzAttr.id, value: "165Hz", optionId: await optId(monHzAttr.id, "165Hz") },
      { attrId: monPanelAttr.id, value: "OLED", optionId: await optId(monPanelAttr.id, "OLED") },
    ],
  });

  // ── 11. TAGS ─────────────────────────────────────────────
  console.log("  🏷  Tags…");
  const tagNames = ["Gaming", "Workstation", "Budget", "RGB", "Flagship", "Overclocking", "Silent", "DDR5", "NVMe", "4K"];
  const tags: Record<string, { id: string }> = {};
  for (const name of tagNames) {
    tags[name] = await prisma.tag.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // Tag some products
  const tagLinks: [{ id: string }, string[]][] = [
    [cpu1, ["Gaming", "Overclocking", "Flagship"]],
    [cpu3, ["Workstation", "Flagship"]],
    [cpu4, ["Gaming"]],
    [cpu5, ["Budget", "Gaming"]],
    [gpu1, ["Gaming", "4K", "Flagship", "RGB"]],
    [gpu2, ["Gaming", "4K"]],
    [gpu4, ["Budget", "Gaming"]],
    [ram1, ["DDR5", "RGB", "Overclocking"]],
    [ram3, ["Budget"]],
    [ssd1, ["NVMe", "Flagship"]],
    [cool2, ["RGB"]],
    [cool1, ["Silent", "Overclocking"]],
  ];

  for (const [product, tagList] of tagLinks) {
    await prisma.product.update({
      where: { id: product.id },
      data: {
        tags: {
          connect: tagList.map((t) => ({ id: tags[t]?.id })).filter((x) => x.id),
        },
      },
    });
  }

  // ── 12. BILLING PROFILE ──────────────────────────────────
  console.log("  🏢 Billing profile…");
  await prisma.billingProfile.upsert({
    where: { id: "default-billing" },
    update: {},
    create: {
      id: "default-billing",
      companyName: "PCParts India Pvt. Ltd.",
      legalName: "PCParts India Private Limited",
      email: "billing@pcparts.in",
      phone: "+91-20-12345678",
      addressLine1: "Plot 42, IT Park, Hinjewadi Phase II",
      city: "Pune",
      state: "Maharashtra",
      postalCode: "411057",
      country: "India",
      gstin: "27AAAPL1234C1ZR",
      currency: Currency.INR,
    },
  });

  // ── 13. CUSTOMERS ────────────────────────────────────────
  console.log("  👥 Customers…");

  const customers = await Promise.all([
    prisma.customer.upsert({
      where: { email: "rahul.sharma@example.com" },
      update: {},
      create: { name: "Rahul Sharma", email: "rahul.sharma@example.com", phone: "9876543210", city: "Pune", state: "Maharashtra" },
    }),
    prisma.customer.upsert({
      where: { email: "priya.mehta@example.com" },
      update: {},
      create: { name: "Priya Mehta", email: "priya.mehta@example.com", phone: "9123456780", city: "Mumbai", state: "Maharashtra" },
    }),
    prisma.customer.upsert({
      where: { email: "arjun.nair@example.com" },
      update: {},
      create: { name: "Arjun Nair", email: "arjun.nair@example.com", phone: "9988776655", city: "Bangalore", state: "Karnataka" },
    }),
    prisma.customer.upsert({
      where: { email: "sneha.patel@example.com" },
      update: {},
      create: { name: "Sneha Patel", email: "sneha.patel@example.com", phone: "9765432109", city: "Ahmedabad", state: "Gujarat" },
    }),
  ]);

  // ── 14. ORDERS ───────────────────────────────────────────
  console.log("  🛒 Orders…");

  // Helper to generate a readable order ID
  let orderCounter = 1001;
  function nextOrderId() { return `ORD-${orderCounter++}`; }

  const orderDefs = [
    {
      customer: customers[0],
      items: [
        { product: cpu1, qty: 1 },
        { product: mb1, qty: 1 },
        { product: ram1, qty: 1 },
        { product: gpu1, qty: 1 },
        { product: ssd1, qty: 1 },
        { product: cool2, qty: 1 },
        { product: psu1, qty: 1 },
        { product: case1, qty: 1 },
      ],
      status: OrderStatus.DELIVERED,
    },
    {
      customer: customers[1],
      items: [
        { product: cpu4, qty: 1 },
        { product: mb4, qty: 1 },
        { product: ram3, qty: 1 },
        { product: gpu4, qty: 1 },
        { product: ssd2, qty: 1 },
        { product: psu3, qty: 1 },
        { product: case2, qty: 1 },
      ],
      status: OrderStatus.SHIPPED,
    },
    {
      customer: customers[2],
      items: [
        { product: cpu3, qty: 1 },
        { product: mb3, qty: 1 },
        { product: ram2, qty: 1 },
        { product: ssd1, qty: 2 },
      ],
      status: OrderStatus.PAID,
    },
    {
      customer: customers[3],
      items: [
        { product: ram4, qty: 2 },
        { product: ssd3, qty: 1 },
        { product: ssd4, qty: 1 },
      ],
      status: OrderStatus.PENDING,
    },
  ];

  const createdOrders = [];

  for (const def of orderDefs) {
    const orderId = nextOrderId();
    const subtotal = def.items.reduce((s, i) => s + (i.product.price ?? 0) * i.qty, 0);
    const gstAmount = Math.round(subtotal * 0.18);
    const total = subtotal + gstAmount;

    const order = await prisma.order.create({
      data: {
        id: orderId,
        channel: SalesChannel.ONLINE,
        customerId: def.customer.id,
        customerName: def.customer.name,
        email: def.customer.email,
        phone: def.customer.phone ?? undefined,
        subtotal,
        gstAmount,
        taxAmount: gstAmount,
        total,
        status: def.status,
        idempotencyKey: `idem-${orderId}`,
        shippingStreet: "123 Sample Street",
        shippingCity: def.customer.city ?? "Pune",
        shippingState: def.customer.state ?? "Maharashtra",
        shippingZip: "411001",
        shippingCountry: "India",
        paymentStatus:
          def.status === OrderStatus.DELIVERED || def.status === OrderStatus.SHIPPED
            ? "COMPLETED"
            : def.status === OrderStatus.PAID
              ? "COMPLETED"
              : "PENDING",
        items: {
          create: def.items.map((i) => ({
            productId: i.product.id,
            name: i.product.name,
            categoryId: i.product.categoryId,
            price: i.product.price ?? 0,
            quantity: i.qty,
            sku: i.product.sku,
          })),
        },
        logs: {
          create: [
            { status: OrderStatus.PENDING, timestamp: new Date(Date.now() - 86400000 * 3), note: "Order placed" },
            ...(def.status !== OrderStatus.PENDING
              ? [{ status: OrderStatus.PAID, timestamp: new Date(Date.now() - 86400000 * 2), note: "Payment confirmed" }]
              : []),
            ...(def.status === OrderStatus.SHIPPED || def.status === OrderStatus.DELIVERED
              ? [{ status: OrderStatus.SHIPPED, timestamp: new Date(Date.now() - 86400000 * 1), note: "Dispatched via Delhivery" }]
              : []),
            ...(def.status === OrderStatus.DELIVERED
              ? [{ status: OrderStatus.DELIVERED, timestamp: new Date(), note: "Delivered to customer" }]
              : []),
          ],
        },
      },
    });

    createdOrders.push({ order, customer: def.customer });

    // Stock outward movements
    for (const item of def.items) {
      await prisma.stockMovement.create({
        data: {
          orderId: order.id,
          productId: item.product.id,
          type: StockMovementType.OUTWARD,
          quantity: item.qty,
          note: `Sold via order ${orderId}`,
        },
      });
    }

    // Shipment tracking for shipped/delivered
    if (def.status === OrderStatus.SHIPPED || def.status === OrderStatus.DELIVERED) {
      await prisma.shipmentTracking.create({
        data: {
          orderId: order.id,
          trackingNumber: `DLVR${Math.floor(Math.random() * 9000000000) + 1000000000}`,
          carrier: "Delhivery",
          status: def.status === OrderStatus.DELIVERED ? "Delivered" : "In Transit",
          estimatedDelivery: new Date(Date.now() + 86400000 * 2),
        },
      });
    }

    // Invoice
    const invoiceNumber = `INV-2024-${String(orderCounter - 1).padStart(4, "0")}`;
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        orderId: order.id,
        customerId: def.customer.id,
        type: InvoiceType.STANDARD,
        status:
          def.status === OrderStatus.DELIVERED || def.status === OrderStatus.PAID || def.status === OrderStatus.SHIPPED
            ? InvoiceStatus.PAID
            : InvoiceStatus.PENDING,
        currency: Currency.INR,
        subtotal,
        taxTotal: gstAmount,
        total,
        amountPaid: def.status !== OrderStatus.PENDING ? total : 0,
        amountDue: def.status !== OrderStatus.PENDING ? 0 : total,
        dueDate: new Date(Date.now() + 86400000 * 7),
        paidAt: def.status !== OrderStatus.PENDING ? new Date() : null,
        lineItems: {
          create: def.items.map((i) => ({
            name: i.product.name,
            quantity: i.qty,
            unitPrice: i.product.price ?? 0,
            taxRatePct: 18,
          })),
        },
      },
    });

    // Payment transaction for paid orders
    if (def.status !== OrderStatus.PENDING) {
      await prisma.paymentTransaction.create({
        data: {
          orderId: order.id,
          method: PaymentMethodType.RAZORPAY,
          gatewayTxnId: `rzp_${Math.random().toString(36).slice(2, 14)}`,
          amount: total,
          currency: Currency.INR,
          status: PaymentStatus.COMPLETED,
          idempotencyKey: `pay-${orderId}`,
          metadata: { gateway: "Razorpay", mode: "UPI" },
        },
      });
    }
  }

  // ── 15. BUILD GUIDES (PC Builder presets) ────────────────
  console.log("  🔨 Build guides…");

  const buildGuides = [
    {
      title: "Budget Gaming PC Build",
      description: "A capable 1080p/1440p gaming PC under ₹80,000.",
      items: [
        { product: cpu5, qty: 1 },
        { product: mb4, qty: 1 },
        { product: ram3, qty: 1 },
        { product: gpu4, qty: 1 },
        { product: ssd2, qty: 1 },
        { product: psu3, qty: 1 },
        { product: case2, qty: 1 },
        { product: cool3, qty: 1 },
      ],
    },
    {
      title: "Mid-Range Gaming PC Build",
      description: "A solid 1440p gaming rig with DDR5 and NVMe storage.",
      items: [
        { product: cpu4, qty: 1 },
        { product: mb2, qty: 1 },
        { product: ram1, qty: 1 },
        { product: gpu2, qty: 1 },
        { product: ssd1, qty: 1 },
        { product: psu2, qty: 1 },
        { product: case1, qty: 1 },
        { product: cool1, qty: 1 },
      ],
    },
    {
      title: "Enthusiast 4K Gaming Build",
      description: "No-compromise 4K gaming and content creation beast.",
      items: [
        { product: cpu1, qty: 1 },
        { product: mb1, qty: 1 },
        { product: ram2, qty: 1 },
        { product: gpu1, qty: 1 },
        { product: ssd1, qty: 2 },
        { product: psu1, qty: 1 },
        { product: case3, qty: 1 },
        { product: cool2, qty: 1 },
      ],
    },
    {
      title: "AMD Workstation Build",
      description: "Ryzen 9 7950X workstation for 3D rendering and video editing.",
      items: [
        { product: cpu3, qty: 1 },
        { product: mb3, qty: 1 },
        { product: ram2, qty: 2 },
        { product: gpu3, qty: 1 },
        { product: ssd1, qty: 1 },
        { product: ssd4, qty: 1 },
        { product: psu1, qty: 1 },
        { product: case3, qty: 1 },
        { product: cool2, qty: 1 },
      ],
    },
  ];

  for (const guide of buildGuides) {
    const total = guide.items.reduce((s, i) => s + (i.product.price ?? 0) * i.qty, 0);
    const bg = await prisma.buildGuide.create({
      data: {
        title: guide.title,
        description: guide.description,
        total,
        categoryId: categories["CPU"].id,
      },
    });
    for (const item of guide.items) {
      await prisma.buildGuideItem.upsert({
        where: { buildGuideId_productId: { buildGuideId: bg.id, productId: item.product.id } },
        update: { quantity: item.qty },
        create: { buildGuideId: bg.id, productId: item.product.id, quantity: item.qty },
      });
    }
  }

  // ── 16. CATEGORY HIERARCHY (nav tree) ───────────────────
  console.log("  🌲 Category hierarchy…");

  const rootNode = await prisma.categoryHierarchy.create({
    data: { label: "All PC Parts", sortOrder: 0 },
  });

  const hierarchyGroups = [
    { label: "Processors & Boards", sortOrder: 1, children: ["CPU", "MB"] },
    { label: "Memory & Storage", sortOrder: 2, children: ["RAM", "SSD"] },
    { label: "Graphics & Display", sortOrder: 3, children: ["GPU", "MON"] },
    { label: "Cooling & Power", sortOrder: 4, children: ["COOL", "PSU"] },
    { label: "Chassis & Peripherals", sortOrder: 5, children: ["CASE", "PERIPH"] },
  ];

  for (const group of hierarchyGroups) {
    const parent = await prisma.categoryHierarchy.create({
      data: { label: group.label, parentId: rootNode.id, sortOrder: group.sortOrder },
    });
    for (let i = 0; i < group.children.length; i++) {
      const cat = categories[group.children[i]];
      await prisma.categoryHierarchy.create({
        data: { label: cat.name, categoryId: cat.id, parentId: parent.id, sortOrder: i },
      });
    }
  }

  // ── 17. SEARCH SUGGESTIONS ───────────────────────────────
  console.log("  🔎 Search suggestions…");

  const suggestions = [
    "RTX 4090", "Ryzen 9 7950X", "DDR5 RAM", "NVMe SSD", "Z790 motherboard",
    "gaming PC build", "budget GPU", "Intel i9", "1TB SSD", "360mm AIO cooler",
    "Corsair PSU", "Noctua cooler", "gaming monitor 144Hz", "4K monitor", "PC case mid tower",
  ];

  for (const term of suggestions) {
    const existing = await prisma.searchSuggestion.findFirst({ where: { term } });
    if (!existing) {
      await prisma.searchSuggestion.create({
        data: { term, frequency: rand(50, 500), lastSearched: new Date() },
      });
    }
  }

  // ── 18. CATEGORY PRODUCT CACHE ───────────────────────────
  console.log("  📊 Category product cache…");

  for (const [code, cat] of Object.entries(categories)) {
    const products = await prisma.product.findMany({
      where: { categoryId: cat.id, status: ProductStatus.ACTIVE },
      select: { price: true },
    });
    if (products.length === 0) continue;
    const prices = products.map((p) => p.price ?? 0).filter(Boolean);
    await prisma.categoryProductCache.upsert({
      where: { categoryId: cat.id },
      update: {
        productCount: products.length,
        minPrice: Math.min(...prices),
        maxPrice: Math.max(...prices),
        lastBuilt: new Date(),
      },
      create: {
        categoryId: cat.id,
        productCount: products.length,
        minPrice: Math.min(...prices),
        maxPrice: Math.max(...prices),
        lastBuilt: new Date(),
      },
    });
  }

  // ── 19. TAX SETTINGS ─────────────────────────────────────
  await prisma.taxSettings.upsert({
    where: { id: "tax_config" },
    update: {},
    create: {
      id: "tax_config",
      taxRatePct: 18,
      taxName: "GST",
      taxDescription: "Goods and Services Tax (India)",
      enabled: true,
    },
  });

  // ── 20. INVOICE SEQUENCE ─────────────────────────────────
  await prisma.invoiceSequence.upsert({
    where: { id: "invoice_seq" },
    update: {},
    create: { id: "invoice_seq", currentValue: 1004 },
  });

  // ── 21. AUDIT LOG ────────────────────────────────────────
  await prisma.auditLog.create({
    data: {
      entityType: "Database",
      entityId: "seed",
      action: "SEED",
      actor: "System",

      metadata: {
        categoriesCreated: Object.keys(categories).length,
        brandsCreated: brandNames.length,
      },
    },
  });

  console.log("✅ Seeding complete!");
  console.log(`   Categories  : ${Object.keys(categories).length}`);
  console.log(`   Brands      : ${brandNames.length}`);
  console.log(`   Products    : ~25`);
  console.log(`   Orders      : ${orderDefs.length}`);
  console.log(`   Build guides: ${buildGuides.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
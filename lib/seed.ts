/**
 * seed.ts — Full database seed for PC components store
 *
 * Schema-aligned with schema.prisma (no Category enum, no Warehouse, no ProductSpec table).
 * Uses: Category (model) → SubCategory → SpecDefinition → SpecOption
 *       Product → ProductVariant → VariantSpec
 *       CompatibilityScope → CompatibilityRule
 *       PartSlot → SubCategorySlot → SlotConstraint
 *       CategoryHierarchy (recursive)
 *       Customer → Order → OrderItem
 *       Invoice → InvoiceLineItem
 *       InventoryItem
 *       BillingProfile, InvoiceSequence, BuildGuide
 */

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import {

  FilterType,
  OrderStatus,
  InvoiceStatus,
  PaymentStatus,
  VariantStatus,
  ProductStatus,
  SpecValueType,
  CompatibilityOperator,
  CompatibilitySeverity,
  InventoryStatus,
  InventoryTrackingType,
} from "../generated/prisma/enums";
import { PrismaClient } from "@/generated/prisma/client";

const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

interface SeedSpecDef {
  name: string;
  valueType: SpecValueType;
  isFilterable?: boolean;
  isRange?: boolean;
  isMulti?: boolean;
  filterGroup?: string;
  options?: string[];
}

interface SeedSubCategory {
  name: string;
  description: string;
  slotName: string | null;
  specDefs: SeedSpecDef[];
}

interface SeedCategory {
  name: string;
  description: string;
  subCategories: SeedSubCategory[];
}

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. BRANDS
// ─────────────────────────────────────────────────────────────────────────────

const BRANDS = [
  "Intel", "AMD", "NVIDIA", "ASUS", "MSI", "Gigabyte", "ASRock",
  "Corsair", "G.Skill", "Kingston", "Samsung", "Western Digital",
  "Crucial", "Seagate", "DeepCool", "Noctua", "EKWB", "Lian Li",
  "Cooler Master", "NZXT", "Fractal Design", "Sapphire", "XFX",
  "PowerColor", "Zotac", "Palit", "LG", "BenQ", "Dell", "AOC",
  "Acer", "ViewSonic", "Keychron", "Logitech", "Razer", "HyperX",
  "SteelSeries", "TP-Link", "ASUS (Network)", "Netgear", "Ant Esports",
  "Thermaltake", "Seasonic", "be quiet!", "Phanteks",
];

// ─────────────────────────────────────────────────────────────────────────────
// 2. CATEGORIES & SUBCATEGORIES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Each SubCategory also lists:
 *   - specDefs: spec definitions (name, valueType, options, filterable, etc.)
 *   - slotName: the PartSlot name this subcategory maps to (optional)
 */
const CATEGORY_TREE: SeedCategory[] = [
  {
    name: "Processor",
    description: "Desktop and workstation central processing units",
    subCategories: [
      {
        name: "Desktop CPU",
        description: "Consumer desktop processors",
        slotName: "CPU",
        specDefs: [
          {
            name: "Socket", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Compatibility",
            options: ["LGA1700", "LGA1851", "AM4", "AM5", "sTR5", "LGA1200", "LGA1151"],
          },
          {
            name: "Core Count", valueType: SpecValueType.NUMBER, isFilterable: true, isRange: true, filterGroup: "Performance",
            options: [],
          },
          {
            name: "Thread Count", valueType: SpecValueType.NUMBER, isFilterable: false, options: [],
          },
          {
            name: "Base Clock (GHz)", valueType: SpecValueType.NUMBER, isFilterable: true, isRange: true, filterGroup: "Performance",
            options: [],
          },
          {
            name: "Boost Clock (GHz)", valueType: SpecValueType.NUMBER, isFilterable: true, isRange: true, filterGroup: "Performance",
            options: [],
          },
          {
            name: "TDP (W)", valueType: SpecValueType.NUMBER, isFilterable: true, isRange: true, filterGroup: "Power",
            options: [],
          },
          {
            name: "Memory Type", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Compatibility",
            options: ["DDR4", "DDR5", "DDR4/DDR5"],
          },
          {
            name: "Max Memory (GB)", valueType: SpecValueType.NUMBER, isFilterable: false, options: [],
          },
          {
            name: "Integrated Graphics", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Features",
            options: ["None", "Intel UHD 770", "Intel UHD 730", "Intel UHD 710", "Radeon Graphics", "Intel Arc"],
          },
          {
            name: "Architecture", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Specs",
            options: ["Raptor Lake", "Alder Lake", "Zen 4", "Zen 4 V-Cache", "Zen 3", "Zen 3+", "Zen 5", "Arrow Lake", "Meteor Lake"],
          },
          {
            name: "PCIe Version", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Compatibility",
            options: ["PCIe 4.0", "PCIe 5.0"],
          },
          {
            name: "Overclockable", valueType: SpecValueType.BOOLEAN, isFilterable: true, filterGroup: "Features",
            options: [],
          },
          {
            name: "Series", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Specs",
            options: ["Core i3", "Core i5", "Core i7", "Core i9", "Core Ultra 5", "Core Ultra 7", "Core Ultra 9",
              "Ryzen 5", "Ryzen 7", "Ryzen 9", "Threadripper", "Athlon"],
          },
          {
            name: "Process Node", valueType: SpecValueType.STRING, isFilterable: false,
            options: ["5nm", "6nm", "7nm", "10nm", "Intel 7", "Intel 4"],
          },
          {
            name: "L3 Cache (MB)", valueType: SpecValueType.NUMBER, isFilterable: false, options: [],
          },
        ],
      },
      {
        name: "HEDT CPU",
        description: "High-end desktop / workstation processors",
        slotName: "CPU",
        specDefs: [
          { name: "Socket", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Compatibility", options: ["sTR5", "LGA4677", "SP5"] },
          { name: "Core Count", valueType: SpecValueType.NUMBER, isFilterable: true, isRange: true, filterGroup: "Performance", options: [] },
          { name: "TDP (W)", valueType: SpecValueType.NUMBER, isFilterable: true, isRange: true, filterGroup: "Power", options: [] },
          { name: "Memory Type", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Compatibility", options: ["DDR5", "ECC DDR5"] },
          { name: "Memory Channels", valueType: SpecValueType.NUMBER, isFilterable: false, options: [] },
          { name: "Architecture", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Specs", options: ["Zen 4", "Zen 4c"] },
        ],
      },
    ],
  },
  {
    name: "Motherboard",
    description: "Desktop motherboards for AMD and Intel platforms",
    subCategories: [
      {
        name: "ATX Motherboard",
        description: "Full-size ATX motherboards",
        slotName: "MOTHERBOARD",
        specDefs: [
          {
            name: "Socket", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Compatibility",
            options: ["LGA1700", "LGA1851", "AM4", "AM5", "sTR5"],
          },
          {
            name: "Chipset", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Specs",
            options: ["X870E", "X870", "X670E", "X670", "B650E", "B650", "A620", "B550", "X570", "B450",
              "Z890", "Z790", "B760", "H770", "H610", "Z690", "Z590", "H570", "B560"],
          },
          {
            name: "Form Factor", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Specs",
            options: ["ATX"],
          },
          {
            name: "Memory Type", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Compatibility",
            options: ["DDR4", "DDR5"],
          },
          {
            name: "Memory Slots", valueType: SpecValueType.NUMBER, isFilterable: true, filterGroup: "Specs", options: [],
          },
          {
            name: "Max Memory (GB)", valueType: SpecValueType.NUMBER, isFilterable: false, options: [],
          },
          {
            name: "PCIe x16 Slots", valueType: SpecValueType.NUMBER, isFilterable: false, options: [],
          },
          {
            name: "M.2 Slots", valueType: SpecValueType.NUMBER, isFilterable: true, filterGroup: "Storage", options: [],
          },
          {
            name: "USB 3.2 Gen2 Ports", valueType: SpecValueType.NUMBER, isFilterable: false, options: [],
          },
          {
            name: "USB4/Thunderbolt", valueType: SpecValueType.BOOLEAN, isFilterable: true, filterGroup: "Features", options: [],
          },
          {
            name: "WiFi", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Features",
            options: ["None", "WiFi 6", "WiFi 6E", "WiFi 7"],
          },
          {
            name: "Bluetooth", valueType: SpecValueType.STRING, isFilterable: false,
            options: ["None", "5.2", "5.3"],
          },
          {
            name: "LAN Speed", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Features",
            options: ["1GbE", "2.5GbE", "5GbE", "10GbE"],
          },
          {
            name: "PCIe Gen (Primary)", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Compatibility",
            options: ["PCIe 3.0", "PCIe 4.0", "PCIe 5.0"],
          },
          {
            name: "VRM Phases", valueType: SpecValueType.NUMBER, isFilterable: false, options: [],
          },
          {
            name: "SATA Ports", valueType: SpecValueType.NUMBER, isFilterable: false, options: [],
          },
        ],
      },
      {
        name: "Micro-ATX Motherboard",
        description: "Compact Micro-ATX motherboards",
        slotName: "MOTHERBOARD",
        specDefs: [
          { name: "Socket", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Compatibility", options: ["LGA1700", "LGA1851", "AM4", "AM5"] },
          { name: "Chipset", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Specs", options: ["B650", "A620", "B550", "B450", "B760", "H610"] },
          { name: "Form Factor", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Specs", options: ["Micro-ATX"] },
          { name: "Memory Type", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Compatibility", options: ["DDR4", "DDR5"] },
          { name: "Memory Slots", valueType: SpecValueType.NUMBER, isFilterable: true, filterGroup: "Specs", options: [] },
          { name: "M.2 Slots", valueType: SpecValueType.NUMBER, isFilterable: true, filterGroup: "Storage", options: [] },
          { name: "WiFi", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Features", options: ["None", "WiFi 6", "WiFi 6E"] },
          { name: "LAN Speed", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Features", options: ["1GbE", "2.5GbE"] },
          { name: "SATA Ports", valueType: SpecValueType.NUMBER, isFilterable: false, options: [] },
        ],
      },
      {
        name: "Mini-ITX Motherboard",
        description: "Small form factor Mini-ITX motherboards",
        slotName: "MOTHERBOARD",
        specDefs: [
          { name: "Socket", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Compatibility", options: ["LGA1700", "AM5", "AM4"] },
          { name: "Chipset", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Specs", options: ["B650", "B760", "Z790", "Z690"] },
          { name: "Form Factor", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Specs", options: ["Mini-ITX"] },
          { name: "Memory Type", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Compatibility", options: ["DDR4", "DDR5"] },
          { name: "Memory Slots", valueType: SpecValueType.NUMBER, isFilterable: false, options: [] },
          { name: "M.2 Slots", valueType: SpecValueType.NUMBER, isFilterable: true, filterGroup: "Storage", options: [] },
          { name: "WiFi", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Features", options: ["WiFi 6", "WiFi 6E", "WiFi 7"] },
        ],
      },
    ],
  },
  {
    name: "Graphics Card",
    description: "Discrete graphics cards for gaming and professional workloads",
    subCategories: [
      {
        name: "NVIDIA GPU",
        description: "NVIDIA GeForce and Quadro GPUs",
        slotName: "GPU",
        specDefs: [
          {
            name: "GPU Chip", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Specs",
            options: ["RTX 5090", "RTX 5080", "RTX 5070 Ti", "RTX 5070", "RTX 5060 Ti", "RTX 5060",
              "RTX 4090", "RTX 4080 Super", "RTX 4080", "RTX 4070 Ti Super", "RTX 4070 Ti",
              "RTX 4070 Super", "RTX 4070", "RTX 4060 Ti", "RTX 4060",
              "RTX 3090 Ti", "RTX 3090", "RTX 3080 Ti", "RTX 3080", "RTX 3070 Ti", "RTX 3070"],
          },
          {
            name: "VRAM (GB)", valueType: SpecValueType.NUMBER, isFilterable: true, isRange: true, filterGroup: "Performance",
            options: [],
          },
          {
            name: "Memory Type", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Specs",
            options: ["GDDR6", "GDDR6X", "GDDR7"],
          },
          {
            name: "Memory Bus (bit)", valueType: SpecValueType.NUMBER, isFilterable: false, options: [],
          },
          {
            name: "TDP (W)", valueType: SpecValueType.NUMBER, isFilterable: true, isRange: true, filterGroup: "Power",
            options: [],
          },
          {
            name: "Card Length (mm)", valueType: SpecValueType.NUMBER, isFilterable: true, isRange: true, filterGroup: "Physical",
            options: [],
          },
          {
            name: "PCIe Interface", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Compatibility",
            options: ["PCIe 4.0 x16", "PCIe 5.0 x16"],
          },
          {
            name: "Power Connector", valueType: SpecValueType.STRING, isFilterable: false,
            options: ["2x 8-pin", "3x 8-pin", "16-pin (12VHPWR)", "2x 16-pin"],
          },
          {
            name: "DisplayPort Outputs", valueType: SpecValueType.NUMBER, isFilterable: false, options: [],
          },
          {
            name: "HDMI Version", valueType: SpecValueType.STRING, isFilterable: false,
            options: ["HDMI 2.0", "HDMI 2.1", "HDMI 2.1a"],
          },
          {
            name: "Base Clock (MHz)", valueType: SpecValueType.NUMBER, isFilterable: false, options: [],
          },
          {
            name: "Boost Clock (MHz)", valueType: SpecValueType.NUMBER, isFilterable: false, options: [],
          },
          {
            name: "Cooling Solution", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Cooling",
            options: ["Dual Fan", "Triple Fan", "Founders Edition", "Single Fan"],
          },
          {
            name: "Slot Width", valueType: SpecValueType.STRING, isFilterable: false,
            options: ["2-slot", "2.5-slot", "3-slot", "3.5-slot"],
          },
        ],
      },
      {
        name: "AMD GPU",
        description: "AMD Radeon RX GPUs",
        slotName: "GPU",
        specDefs: [
          {
            name: "GPU Chip", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Specs",
            options: ["RX 9070 XT", "RX 9070", "RX 7900 XTX", "RX 7900 XT", "RX 7900 GRE",
              "RX 7800 XT", "RX 7700 XT", "RX 7600 XT", "RX 7600",
              "RX 6950 XT", "RX 6900 XT", "RX 6800 XT", "RX 6800", "RX 6750 XT", "RX 6700 XT"],
          },
          { name: "VRAM (GB)", valueType: SpecValueType.NUMBER, isFilterable: true, isRange: true, filterGroup: "Performance", options: [] },
          {
            name: "Memory Type", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Specs",
            options: ["GDDR6", "GDDR6 ECC"],
          },
          { name: "Memory Bus (bit)", valueType: SpecValueType.NUMBER, isFilterable: false, options: [] },
          { name: "TDP (W)", valueType: SpecValueType.NUMBER, isFilterable: true, isRange: true, filterGroup: "Power", options: [] },
          { name: "Card Length (mm)", valueType: SpecValueType.NUMBER, isFilterable: true, isRange: true, filterGroup: "Physical", options: [] },
          {
            name: "PCIe Interface", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Compatibility",
            options: ["PCIe 4.0 x16", "PCIe 5.0 x16"],
          },
          {
            name: "Cooling Solution", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Cooling",
            options: ["Dual Fan", "Triple Fan", "Reference"],
          },
        ],
      },
      {
        name: "Intel Arc GPU",
        description: "Intel Arc discrete graphics cards",
        slotName: "GPU",
        specDefs: [
          {
            name: "GPU Chip", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Specs",
            options: ["Arc B580", "Arc B770", "Arc A770", "Arc A750", "Arc A380"],
          },
          { name: "VRAM (GB)", valueType: SpecValueType.NUMBER, isFilterable: true, isRange: true, filterGroup: "Performance", options: [] },
          { name: "Memory Type", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Specs", options: ["GDDR6"] },
          { name: "TDP (W)", valueType: SpecValueType.NUMBER, isFilterable: true, isRange: true, filterGroup: "Power", options: [] },
          { name: "PCIe Interface", valueType: SpecValueType.STRING, isFilterable: false, options: ["PCIe 4.0 x16", "PCIe 5.0 x16"] },
        ],
      },
    ],
  },
  {
    name: "RAM",
    description: "Desktop and laptop memory modules",
    subCategories: [
      {
        name: "DDR5 RAM",
        description: "DDR5 memory for modern platforms",
        slotName: "RAM",
        specDefs: [
          { name: "Memory Type", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Compatibility", options: ["DDR5"] },
          {
            name: "Capacity", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Specs",
            options: ["16GB (8GBx2)", "32GB (16GBx2)", "48GB (24GBx2)", "64GB (32GBx2)", "96GB (48GBx2)", "16GB", "32GB", "64GB"],
          },
          {
            name: "Speed (MT/s)", valueType: SpecValueType.NUMBER, isFilterable: true, isRange: true, filterGroup: "Performance",
            options: [],
          },
          {
            name: "CAS Latency", valueType: SpecValueType.NUMBER, isFilterable: false, options: [],
          },
          {
            name: "Timings", valueType: SpecValueType.STRING, isFilterable: false, options: [],
          },
          {
            name: "Voltage", valueType: SpecValueType.NUMBER, isFilterable: false, options: [],
          },
          {
            name: "RGB", valueType: SpecValueType.BOOLEAN, isFilterable: true, filterGroup: "Features", options: [],
          },
          {
            name: "Heat Spreader", valueType: SpecValueType.STRING, isFilterable: false,
            options: ["Standard", "Low Profile", "Tall Heatsink"],
          },
          {
            name: "XMP/EXPO Profile", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Features",
            options: ["XMP 3.0", "EXPO", "XMP 3.0 & EXPO", "None"],
          },
          {
            name: "ECC", valueType: SpecValueType.BOOLEAN, isFilterable: true, filterGroup: "Features", options: [],
          },
        ],
      },
      {
        name: "DDR4 RAM",
        description: "DDR4 memory for existing platforms",
        slotName: "RAM",
        specDefs: [
          { name: "Memory Type", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Compatibility", options: ["DDR4"] },
          {
            name: "Capacity", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Specs",
            options: ["8GB (4GBx2)", "16GB (8GBx2)", "32GB (16GBx2)", "64GB (32GBx2)", "8GB", "16GB", "32GB"],
          },
          { name: "Speed (MT/s)", valueType: SpecValueType.NUMBER, isFilterable: true, isRange: true, filterGroup: "Performance", options: [] },
          { name: "CAS Latency", valueType: SpecValueType.NUMBER, isFilterable: false, options: [] },
          { name: "Voltage", valueType: SpecValueType.NUMBER, isFilterable: false, options: [] },
          { name: "RGB", valueType: SpecValueType.BOOLEAN, isFilterable: true, filterGroup: "Features", options: [] },
          {
            name: "XMP Profile", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Features",
            options: ["XMP 2.0", "None"],
          },
          { name: "ECC", valueType: SpecValueType.BOOLEAN, isFilterable: true, filterGroup: "Features", options: [] },
        ],
      },
    ],
  },
  {
    name: "Storage",
    description: "Solid state drives, hard disk drives, and external storage",
    subCategories: [
      {
        name: "NVMe SSD",
        description: "M.2 NVMe solid state drives",
        slotName: "STORAGE",
        specDefs: [
          {
            name: "Form Factor", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Specs",
            options: ["M.2 2280", "M.2 2242", "M.2 22110"],
          },
          {
            name: "Interface", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Compatibility",
            options: ["PCIe 3.0 x4 NVMe", "PCIe 4.0 x4 NVMe", "PCIe 5.0 x4 NVMe"],
          },
          {
            name: "Capacity", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Specs",
            options: ["250GB", "500GB", "1TB", "2TB", "4TB"],
          },
          { name: "Sequential Read (MB/s)", valueType: SpecValueType.NUMBER, isFilterable: true, isRange: true, filterGroup: "Performance", options: [] },
          { name: "Sequential Write (MB/s)", valueType: SpecValueType.NUMBER, isFilterable: true, isRange: true, filterGroup: "Performance", options: [] },
          { name: "TBW", valueType: SpecValueType.NUMBER, isFilterable: false, options: [] },
          {
            name: "NAND Type", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Specs",
            options: ["TLC", "QLC", "MLC", "SLC"],
          },
          { name: "DRAM Cache", valueType: SpecValueType.BOOLEAN, isFilterable: true, filterGroup: "Features", options: [] },
          {
            name: "Heatsink Included", valueType: SpecValueType.BOOLEAN, isFilterable: true, filterGroup: "Features", options: [],
          },
        ],
      },
      {
        name: "SATA SSD",
        description: "2.5-inch SATA solid state drives",
        slotName: "STORAGE",
        specDefs: [
          { name: "Form Factor", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Specs", options: ["2.5-inch"] },
          { name: "Interface", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Compatibility", options: ["SATA III (6Gb/s)"] },
          {
            name: "Capacity", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Specs",
            options: ["120GB", "240GB", "480GB", "500GB", "960GB", "1TB", "2TB"],
          },
          { name: "Sequential Read (MB/s)", valueType: SpecValueType.NUMBER, isFilterable: false, options: [] },
          { name: "Sequential Write (MB/s)", valueType: SpecValueType.NUMBER, isFilterable: false, options: [] },
          { name: "NAND Type", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Specs", options: ["TLC", "QLC", "MLC"] },
        ],
      },
      {
        name: "HDD",
        description: "Internal mechanical hard disk drives",
        slotName: "STORAGE",
        specDefs: [
          {
            name: "Form Factor", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Specs",
            options: ["3.5-inch", "2.5-inch"],
          },
          { name: "Interface", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Compatibility", options: ["SATA III (6Gb/s)"] },
          {
            name: "Capacity", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Specs",
            options: ["1TB", "2TB", "4TB", "6TB", "8TB", "12TB", "16TB", "18TB"],
          },
          {
            name: "RPM", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Performance",
            options: ["5400 RPM", "7200 RPM", "10000 RPM"],
          },
          { name: "Cache (MB)", valueType: SpecValueType.NUMBER, isFilterable: false, options: [] },
        ],
      },
    ],
  },
  {
    name: "Cooler",
    description: "CPU coolers, case fans, and thermal solutions",
    subCategories: [
      {
        name: "AIO Liquid Cooler",
        description: "All-in-one closed-loop liquid coolers",
        slotName: "COOLER",
        specDefs: [
          {
            name: "Radiator Size", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Specs",
            options: ["120mm", "240mm", "280mm", "360mm", "420mm"],
          },
          {
            name: "Socket Compatibility", valueType: SpecValueType.STRING, isFilterable: true, isMulti: true, filterGroup: "Compatibility",
            options: ["LGA1700", "LGA1851", "AM4", "AM5", "LGA2066", "sTR5"],
          },
          { name: "Fan Count", valueType: SpecValueType.NUMBER, isFilterable: false, options: [] },
          { name: "Fan Size (mm)", valueType: SpecValueType.NUMBER, isFilterable: false, options: [] },
          { name: "Fan Speed (RPM)", valueType: SpecValueType.STRING, isFilterable: false, options: [] },
          { name: "Pump Speed (RPM)", valueType: SpecValueType.STRING, isFilterable: false, options: [] },
          { name: "Noise (dBA)", valueType: SpecValueType.NUMBER, isFilterable: false, options: [] },
          { name: "ARGB", valueType: SpecValueType.BOOLEAN, isFilterable: true, filterGroup: "Features", options: [] },
          { name: "LCD Display", valueType: SpecValueType.BOOLEAN, isFilterable: true, filterGroup: "Features", options: [] },
          { name: "Tubing Length (mm)", valueType: SpecValueType.NUMBER, isFilterable: false, options: [] },
        ],
      },
      {
        name: "Air Cooler",
        description: "Air cooling tower heatsink solutions",
        slotName: "COOLER",
        specDefs: [
          {
            name: "Socket Compatibility", valueType: SpecValueType.STRING, isFilterable: true, isMulti: true, filterGroup: "Compatibility",
            options: ["LGA1700", "LGA1851", "AM4", "AM5"],
          },
          { name: "Height (mm)", valueType: SpecValueType.NUMBER, isFilterable: true, isRange: true, filterGroup: "Physical", options: [] },
          {
            name: "Type", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Specs",
            options: ["Single Tower", "Dual Tower", "Low Profile"],
          },
          { name: "Fan Count", valueType: SpecValueType.NUMBER, isFilterable: false, options: [] },
          { name: "Fan Size (mm)", valueType: SpecValueType.NUMBER, isFilterable: false, options: [] },
          { name: "Noise (dBA)", valueType: SpecValueType.NUMBER, isFilterable: false, options: [] },
          { name: "Heat Pipes", valueType: SpecValueType.NUMBER, isFilterable: false, options: [] },
          { name: "TDP Rating (W)", valueType: SpecValueType.NUMBER, isFilterable: true, isRange: true, filterGroup: "Performance", options: [] },
          { name: "ARGB", valueType: SpecValueType.BOOLEAN, isFilterable: true, filterGroup: "Features", options: [] },
        ],
      },
      {
        name: "Case Fan",
        description: "120mm and 140mm case fans",
        slotName: null,
        specDefs: [
          { name: "Fan Size (mm)", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Specs", options: ["80mm", "92mm", "120mm", "140mm", "200mm"] },
          { name: "Max Speed (RPM)", valueType: SpecValueType.NUMBER, isFilterable: false, options: [] },
          { name: "Airflow (CFM)", valueType: SpecValueType.NUMBER, isFilterable: false, options: [] },
          { name: "Static Pressure (mmH2O)", valueType: SpecValueType.NUMBER, isFilterable: false, options: [] },
          { name: "Noise (dBA)", valueType: SpecValueType.NUMBER, isFilterable: false, options: [] },
          { name: "Connector", valueType: SpecValueType.STRING, isFilterable: false, options: ["3-pin", "4-pin PWM"] },
          { name: "ARGB", valueType: SpecValueType.BOOLEAN, isFilterable: true, filterGroup: "Features", options: [] },
          { name: "Pack Quantity", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Specs", options: ["1-pack", "3-pack", "5-pack"] },
        ],
      },
      {
        name: "Thermal Paste",
        description: "Thermal interface materials",
        slotName: null,
        specDefs: [
          { name: "Thermal Conductivity (W/mK)", valueType: SpecValueType.NUMBER, isFilterable: true, isRange: true, filterGroup: "Performance", options: [] },
          { name: "Weight (g)", valueType: SpecValueType.NUMBER, isFilterable: false, options: [] },
          { name: "Type", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Specs", options: ["Carbon", "Metal", "Ceramic", "Liquid Metal"] },
        ],
      },
    ],
  },
  {
    name: "Power Supply",
    description: "ATX power supply units for desktop systems",
    subCategories: [
      {
        name: "ATX PSU",
        description: "Standard ATX power supply units",
        slotName: "PSU",
        specDefs: [
          {
            name: "Wattage", valueType: SpecValueType.NUMBER, isFilterable: true, isRange: true, filterGroup: "Specs",
            options: [],
          },
          {
            name: "Efficiency Rating", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Specs",
            options: ["80+ White", "80+ Bronze", "80+ Silver", "80+ Gold", "80+ Platinum", "80+ Titanium"],
          },
          {
            name: "Modular", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Features",
            options: ["Non-Modular", "Semi-Modular", "Fully Modular"],
          },
          { name: "PCIe 12VHPWR Connector", valueType: SpecValueType.BOOLEAN, isFilterable: true, filterGroup: "Features", options: [] },
          { name: "Fan Size (mm)", valueType: SpecValueType.NUMBER, isFilterable: false, options: [] },
          { name: "Fan Bearing", valueType: SpecValueType.STRING, isFilterable: false, options: ["Sleeve", "Ball", "Fluid Dynamic", "FDB"] },
          { name: "Form Factor", valueType: SpecValueType.STRING, isFilterable: false, options: ["ATX", "SFX", "SFX-L"] },
          { name: "PCIe 6+2 Connectors", valueType: SpecValueType.NUMBER, isFilterable: false, options: [] },
          { name: "SATA Connectors", valueType: SpecValueType.NUMBER, isFilterable: false, options: [] },
          { name: "Molex Connectors", valueType: SpecValueType.NUMBER, isFilterable: false, options: [] },
          { name: "ATX 3.0 Compatible", valueType: SpecValueType.BOOLEAN, isFilterable: true, filterGroup: "Features", options: [] },
          { name: "Zero RPM Mode", valueType: SpecValueType.BOOLEAN, isFilterable: true, filterGroup: "Features", options: [] },
          {
            name: "Warranty (years)", valueType: SpecValueType.NUMBER, isFilterable: true, isRange: true, filterGroup: "Specs",
            options: [],
          },
        ],
      },
      {
        name: "SFX PSU",
        description: "Small form factor SFX/SFX-L power supplies",
        slotName: "PSU",
        specDefs: [
          { name: "Wattage", valueType: SpecValueType.NUMBER, isFilterable: true, isRange: true, filterGroup: "Specs", options: [] },
          { name: "Efficiency Rating", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Specs", options: ["80+ Gold", "80+ Platinum"] },
          { name: "Form Factor", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Specs", options: ["SFX", "SFX-L"] },
          { name: "Modular", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Features", options: ["Fully Modular", "Semi-Modular"] },
        ],
      },
    ],
  },
  {
    name: "Cabinet",
    description: "PC cases and chassis",
    subCategories: [
      {
        name: "Mid Tower Case",
        description: "Standard mid tower PC cases",
        slotName: "CASE",
        specDefs: [
          { name: "Form Factor", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Specs", options: ["Mid Tower"] },
          {
            name: "Motherboard Support", valueType: SpecValueType.STRING, isFilterable: true, isMulti: true, filterGroup: "Compatibility",
            options: ["Mini-ITX", "Micro-ATX", "ATX", "E-ATX"],
          },
          {
            name: "Max CPU Cooler Height (mm)", valueType: SpecValueType.NUMBER, isFilterable: true, isRange: true, filterGroup: "Compatibility",
            options: [],
          },
          {
            name: "Max GPU Length (mm)", valueType: SpecValueType.NUMBER, isFilterable: true, isRange: true, filterGroup: "Compatibility",
            options: [],
          },
          {
            name: "Max PSU Length (mm)", valueType: SpecValueType.NUMBER, isFilterable: false, options: [],
          },
          {
            name: "Front I/O", valueType: SpecValueType.STRING, isFilterable: false,
            options: ["USB 3.0 x2", "USB 3.0 x2, USB-C", "USB 3.2 Gen 2 Type-C"],
          },
          { name: "Drive Bays (3.5-inch)", valueType: SpecValueType.NUMBER, isFilterable: false, options: [] },
          { name: "Drive Bays (2.5-inch)", valueType: SpecValueType.NUMBER, isFilterable: false, options: [] },
          { name: "Radiator Support (Top)", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Cooling", options: ["None", "120/240mm", "240/360mm", "280/360mm", "360mm"] },
          { name: "Radiator Support (Front)", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Cooling", options: ["120/240mm", "240/280/360mm", "360mm", "420mm"] },
          { name: "Included Fans", valueType: SpecValueType.STRING, isFilterable: false, options: [] },
          { name: "Tempered Glass Panel", valueType: SpecValueType.BOOLEAN, isFilterable: true, filterGroup: "Features", options: [] },
          { name: "ARGB Controller", valueType: SpecValueType.BOOLEAN, isFilterable: true, filterGroup: "Features", options: [] },
          { name: "Color", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Appearance", options: ["Black", "White", "Grey"] },
        ],
      },
      {
        name: "Full Tower Case",
        description: "Large full tower PC cases",
        slotName: "CASE",
        specDefs: [
          { name: "Form Factor", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Specs", options: ["Full Tower", "Super Tower"] },
          { name: "Motherboard Support", valueType: SpecValueType.STRING, isFilterable: true, isMulti: true, filterGroup: "Compatibility", options: ["ATX", "E-ATX", "XL-ATX"] },
          { name: "Max GPU Length (mm)", valueType: SpecValueType.NUMBER, isFilterable: false, options: [] },
          { name: "Radiator Support (Top)", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Cooling", options: ["360mm", "420mm", "480mm"] },
          { name: "Tempered Glass Panel", valueType: SpecValueType.BOOLEAN, isFilterable: true, filterGroup: "Features", options: [] },
          { name: "Color", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Appearance", options: ["Black", "White"] },
        ],
      },
      {
        name: "Mini-ITX Case",
        description: "Small form factor cases",
        slotName: "CASE",
        specDefs: [
          { name: "Form Factor", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Specs", options: ["Mini-ITX"] },
          { name: "Volume (L)", valueType: SpecValueType.NUMBER, isFilterable: true, isRange: true, filterGroup: "Physical", options: [] },
          { name: "Max GPU Length (mm)", valueType: SpecValueType.NUMBER, isFilterable: false, options: [] },
          { name: "Max CPU Cooler Height (mm)", valueType: SpecValueType.NUMBER, isFilterable: false, options: [] },
          { name: "PSU Type", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Compatibility", options: ["ATX", "SFX", "SFX-L"] },
        ],
      },
    ],
  },
  {
    name: "Monitor",
    description: "Desktop monitors for gaming, professional, and general use",
    subCategories: [
      {
        name: "Gaming Monitor",
        description: "High refresh rate gaming monitors",
        slotName: null,
        specDefs: [
          {
            name: "Panel Size (inch)", valueType: SpecValueType.NUMBER, isFilterable: true, isRange: true, filterGroup: "Display",
            options: [],
          },
          {
            name: "Resolution", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Display",
            options: ["1920x1080 (FHD)", "2560x1440 (QHD)", "3440x1440 (UWQHD)", "3840x2160 (4K UHD)", "5120x1440 (DQHD)"],
          },
          {
            name: "Panel Type", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Display",
            options: ["IPS", "VA", "TN", "OLED", "QD-OLED", "WOLED"],
          },
          {
            name: "Refresh Rate (Hz)", valueType: SpecValueType.NUMBER, isFilterable: true, isRange: true, filterGroup: "Performance",
            options: [],
          },
          {
            name: "Response Time (ms)", valueType: SpecValueType.NUMBER, isFilterable: true, isRange: true, filterGroup: "Performance",
            options: [],
          },
          {
            name: "Adaptive Sync", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Features",
            options: ["G-Sync", "FreeSync Premium", "FreeSync Premium Pro", "G-Sync Compatible", "None"],
          },
          { name: "HDR", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Features", options: ["None", "HDR10", "HDR400", "HDR600", "HDR1000", "True HDR"] },
          { name: "Brightness (nits)", valueType: SpecValueType.NUMBER, isFilterable: false, options: [] },
          { name: "Color Gamut (sRGB %)", valueType: SpecValueType.NUMBER, isFilterable: false, options: [] },
          { name: "Curved", valueType: SpecValueType.BOOLEAN, isFilterable: true, filterGroup: "Display", options: [] },
          { name: "HDMI Ports", valueType: SpecValueType.NUMBER, isFilterable: false, options: [] },
          { name: "DisplayPort Ports", valueType: SpecValueType.NUMBER, isFilterable: false, options: [] },
          { name: "USB Hub", valueType: SpecValueType.BOOLEAN, isFilterable: true, filterGroup: "Features", options: [] },
          { name: "Height Adjustable", valueType: SpecValueType.BOOLEAN, isFilterable: true, filterGroup: "Features", options: [] },
        ],
      },
      {
        name: "Professional Monitor",
        description: "Color-accurate monitors for creative work",
        slotName: null,
        specDefs: [
          { name: "Panel Size (inch)", valueType: SpecValueType.NUMBER, isFilterable: true, isRange: true, filterGroup: "Display", options: [] },
          { name: "Resolution", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Display", options: ["1920x1080 (FHD)", "2560x1440 (QHD)", "3840x2160 (4K UHD)", "5120x2880 (5K)"] },
          { name: "Panel Type", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Display", options: ["IPS", "OLED", "Nano IPS"] },
          { name: "Color Gamut (DCI-P3 %)", valueType: SpecValueType.NUMBER, isFilterable: true, isRange: true, filterGroup: "Color", options: [] },
          { name: "Color Gamut (sRGB %)", valueType: SpecValueType.NUMBER, isFilterable: false, options: [] },
          { name: "Delta E", valueType: SpecValueType.NUMBER, isFilterable: false, options: [] },
          { name: "HDR", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Features", options: ["None", "HDR10", "DisplayHDR 400", "DisplayHDR 600", "DisplayHDR 1000"] },
          { name: "USB-C PD (W)", valueType: SpecValueType.NUMBER, isFilterable: true, isRange: true, filterGroup: "Features", options: [] },
          { name: "Thunderbolt", valueType: SpecValueType.BOOLEAN, isFilterable: true, filterGroup: "Features", options: [] },
          { name: "Height Adjustable", valueType: SpecValueType.BOOLEAN, isFilterable: true, filterGroup: "Features", options: [] },
          { name: "Refresh Rate (Hz)", valueType: SpecValueType.NUMBER, isFilterable: false, options: [] },
        ],
      },
    ],
  },
  {
    name: "Peripheral",
    description: "Keyboards, mice, headsets, and other peripherals",
    subCategories: [
      {
        name: "Keyboard",
        description: "Mechanical, membrane, and gaming keyboards",
        slotName: null,
        specDefs: [
          { name: "Type", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Specs", options: ["Mechanical", "Membrane", "Optical-Mechanical", "Hall Effect"] },
          { name: "Connectivity", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Features", options: ["Wired", "Wireless (2.4GHz)", "Bluetooth", "Wired/Wireless", "Tri-mode"] },
          { name: "Layout", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Specs", options: ["Full-size (100%)", "TKL (80%)", "75%", "65%", "60%", "40%", "Numpad"] },
          { name: "Switch Type", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Specs", options: ["Cherry MX Red", "Cherry MX Blue", "Cherry MX Brown", "Gateron Red", "Gateron Yellow", "Kailh Box Red", "Optical Red", "Proprietary"] },
          { name: "Hot-Swap", valueType: SpecValueType.BOOLEAN, isFilterable: true, filterGroup: "Features", options: [] },
          { name: "RGB Backlight", valueType: SpecValueType.BOOLEAN, isFilterable: true, filterGroup: "Features", options: [] },
          { name: "Per-key RGB", valueType: SpecValueType.BOOLEAN, isFilterable: false, options: [] },
          { name: "Polling Rate (Hz)", valueType: SpecValueType.NUMBER, isFilterable: false, options: [] },
          { name: "Battery Life (hrs)", valueType: SpecValueType.NUMBER, isFilterable: false, options: [] },
          { name: "NKRO", valueType: SpecValueType.BOOLEAN, isFilterable: false, options: [] },
          { name: "Gasket Mount", valueType: SpecValueType.BOOLEAN, isFilterable: true, filterGroup: "Features", options: [] },
        ],
      },
      {
        name: "Mouse",
        description: "Gaming and productivity mice",
        slotName: null,
        specDefs: [
          { name: "Connectivity", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Features", options: ["Wired", "Wireless (2.4GHz)", "Bluetooth", "Wired/Wireless"] },
          { name: "Sensor", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Specs", options: ["PixArt PAW3395", "PixArt PAW3370", "PixArt PAW3950", "Hero 25K", "Focus Pro 30K", "TrueMove Pro"] },
          { name: "Max DPI", valueType: SpecValueType.NUMBER, isFilterable: true, isRange: true, filterGroup: "Performance", options: [] },
          { name: "Polling Rate (Hz)", valueType: SpecValueType.NUMBER, isFilterable: true, filterGroup: "Performance", options: [] },
          { name: "Weight (g)", valueType: SpecValueType.NUMBER, isFilterable: true, isRange: true, filterGroup: "Physical", options: [] },
          { name: "Buttons", valueType: SpecValueType.NUMBER, isFilterable: false, options: [] },
          { name: "RGB", valueType: SpecValueType.BOOLEAN, isFilterable: true, filterGroup: "Features", options: [] },
          { name: "Battery Life (hrs)", valueType: SpecValueType.NUMBER, isFilterable: false, options: [] },
          { name: "Grip Style", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Specs", options: ["Palm", "Claw", "Fingertip", "Ambidextrous"] },
        ],
      },
      {
        name: "Headset",
        description: "Gaming and audio headsets",
        slotName: null,
        specDefs: [
          { name: "Connectivity", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Features", options: ["Wired (3.5mm)", "Wired (USB)", "Wireless (2.4GHz)", "Bluetooth", "Dual Wireless"] },
          { name: "Driver Size (mm)", valueType: SpecValueType.NUMBER, isFilterable: false, options: [] },
          { name: "Frequency Response", valueType: SpecValueType.STRING, isFilterable: false, options: [] },
          { name: "Microphone Type", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Features", options: ["Detachable", "Retractable", "Built-in", "None"] },
          { name: "Surround Sound", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Features", options: ["Stereo", "Virtual 7.1", "True 7.1", "360 Spatial"] },
          { name: "Noise Cancellation", valueType: SpecValueType.BOOLEAN, isFilterable: true, filterGroup: "Features", options: [] },
          { name: "Battery Life (hrs)", valueType: SpecValueType.NUMBER, isFilterable: false, options: [] },
          { name: "Weight (g)", valueType: SpecValueType.NUMBER, isFilterable: false, options: [] },
        ],
      },
      {
        name: "Mouse Pad",
        description: "Desk mats and mouse pads",
        slotName: null,
        specDefs: [
          { name: "Size", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Specs", options: ["Small (250x210mm)", "Medium (350x250mm)", "Large (450x400mm)", "XL (800x300mm)", "XXL (900x400mm)", "Desk Mat (900x400mm+)"] },
          { name: "Surface Type", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Specs", options: ["Soft Cloth", "Hard", "Hybrid"] },
          { name: "Thickness (mm)", valueType: SpecValueType.NUMBER, isFilterable: false, options: [] },
          { name: "RGB Edge Lighting", valueType: SpecValueType.BOOLEAN, isFilterable: true, filterGroup: "Features", options: [] },
        ],
      },
    ],
  },
  {
    name: "Networking",
    description: "Routers, switches, network adapters, and cables",
    subCategories: [
      {
        name: "Wi-Fi Router",
        description: "Wireless home and gaming routers",
        slotName: null,
        specDefs: [
          { name: "WiFi Standard", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Specs", options: ["WiFi 5 (802.11ac)", "WiFi 6 (802.11ax)", "WiFi 6E", "WiFi 7 (802.11be)"] },
          { name: "Max Speed (Mbps)", valueType: SpecValueType.NUMBER, isFilterable: true, isRange: true, filterGroup: "Performance", options: [] },
          { name: "Bands", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Specs", options: ["Dual-band", "Tri-band", "Quad-band"] },
          { name: "LAN Ports", valueType: SpecValueType.NUMBER, isFilterable: false, options: [] },
          { name: "WAN Port Speed", valueType: SpecValueType.STRING, isFilterable: false, options: ["1GbE", "2.5GbE", "10GbE"] },
          { name: "USB Port", valueType: SpecValueType.BOOLEAN, isFilterable: false, options: [] },
          { name: "MU-MIMO", valueType: SpecValueType.BOOLEAN, isFilterable: true, filterGroup: "Features", options: [] },
          { name: "OFDMA", valueType: SpecValueType.BOOLEAN, isFilterable: false, options: [] },
          { name: "Antennas", valueType: SpecValueType.NUMBER, isFilterable: false, options: [] },
        ],
      },
      {
        name: "Network Switch",
        description: "Unmanaged and managed Ethernet switches",
        slotName: null,
        specDefs: [
          { name: "Ports", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Specs", options: ["5-port", "8-port", "16-port", "24-port", "48-port"] },
          { name: "Port Speed", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Specs", options: ["100Mbps", "1GbE", "2.5GbE", "10GbE"] },
          { name: "Managed", valueType: SpecValueType.BOOLEAN, isFilterable: true, filterGroup: "Features", options: [] },
          { name: "PoE", valueType: SpecValueType.BOOLEAN, isFilterable: true, filterGroup: "Features", options: [] },
          { name: "SFP Ports", valueType: SpecValueType.NUMBER, isFilterable: false, options: [] },
        ],
      },
      {
        name: "Network Adapter",
        description: "PCIe and USB Wi-Fi/LAN adapters",
        slotName: null,
        specDefs: [
          { name: "Interface", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Compatibility", options: ["PCIe x1", "USB 3.0", "USB-C", "M.2"] },
          { name: "WiFi Standard", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Specs", options: ["WiFi 6", "WiFi 6E", "WiFi 7", "N/A (LAN only)"] },
          { name: "LAN Speed", valueType: SpecValueType.STRING, isFilterable: true, filterGroup: "Specs", options: ["1GbE", "2.5GbE", "5GbE", "10GbE"] },
          { name: "Bluetooth", valueType: SpecValueType.STRING, isFilterable: false, options: ["None", "5.0", "5.2", "5.3", "5.4"] },
          { name: "Antenna", valueType: SpecValueType.STRING, isFilterable: false, options: ["None", "External", "Internal"] },
        ],
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 3. PART SLOTS
// ─────────────────────────────────────────────────────────────────────────────

const PART_SLOTS = [
  { name: "CPU",         minItems: 1, maxItems: 1 },
  { name: "MOTHERBOARD", minItems: 1, maxItems: 1 },
  { name: "GPU",         minItems: 0, maxItems: 2 },
  { name: "RAM",         minItems: 1, maxItems: 4 },
  { name: "STORAGE",     minItems: 1, maxItems: 6 },
  { name: "COOLER",      minItems: 1, maxItems: 1 },
  { name: "PSU",         minItems: 1, maxItems: 1 },
  { name: "CASE",        minItems: 1, maxItems: 1 },
];

// ─────────────────────────────────────────────────────────────────────────────
// 4. PRODUCTS
// ─────────────────────────────────────────────────────────────────────────────
// Each product references { subCategoryName, brandName } for dynamic ID lookup.
// Spec values reference { specName, value (string/number/bool), optionValue }

type SpecValue =
  | { specName: string; valueString: string; optionValue?: string }
  | { specName: string; valueNumber: number }
  | { specName: string; valueBool: boolean };

interface ProductSeed {
  id: string;
  sku: string;
  name: string;
  description: string;
  subCategoryName: string;
  brandName: string;
  price: number;
  compareAtPrice?: number;
  image: string;
  stock: number;
  specs: SpecValue[];
}

const PRODUCTS: ProductSeed[] = [
  // ── DESKTOP CPUs ────────────────────────────────────────────────────────────
  {
    id: "cpu-01", sku: "CPU-AMD-7800X3D",
    name: "AMD Ryzen 7 7800X3D",
    description: "The ultimate gaming processor featuring 96MB AMD 3D V-Cache, 8 cores/16 threads on AM5, delivering unmatched 1080p gaming performance.",
    subCategoryName: "Desktop CPU", brandName: "AMD", price: 36000, image: "https://cdn.amd.com/System/Placeholder/prd_ryzen_7700x.jpg", stock: 15,
    specs: [
      { specName: "Socket", valueString: "AM5", optionValue: "AM5" },
      { specName: "Core Count", valueNumber: 8 },
      { specName: "Thread Count", valueNumber: 16 },
      { specName: "Base Clock (GHz)", valueNumber: 4.2 },
      { specName: "Boost Clock (GHz)", valueNumber: 5.0 },
      { specName: "TDP (W)", valueNumber: 120 },
      { specName: "Memory Type", valueString: "DDR5", optionValue: "DDR5" },
      { specName: "Max Memory (GB)", valueNumber: 128 },
      { specName: "Integrated Graphics", valueString: "Radeon Graphics", optionValue: "Radeon Graphics" },
      { specName: "Architecture", valueString: "Zen 4 V-Cache", optionValue: "Zen 4 V-Cache" },
      { specName: "PCIe Version", valueString: "PCIe 5.0", optionValue: "PCIe 5.0" },
      { specName: "Overclockable", valueBool: false },
      { specName: "Series", valueString: "Ryzen 7", optionValue: "Ryzen 7" },
      { specName: "Process Node", valueString: "5nm" },
      { specName: "L3 Cache (MB)", valueNumber: 96 },
    ],
  },
  {
    id: "cpu-02", sku: "CPU-INT-14900K",
    name: "Intel Core i9-14900K",
    description: "Intel's 14th Gen flagship with 24 cores (8P+16E), up to 6.0GHz boost, ideal for gaming and demanding workloads on LGA1700.",
    subCategoryName: "Desktop CPU", brandName: "Intel", price: 54000, image: "https://www.intel.com/content/dam/products/placeholder.png", stock: 8,
    specs: [
      { specName: "Socket", valueString: "LGA1700", optionValue: "LGA1700" },
      { specName: "Core Count", valueNumber: 24 },
      { specName: "Thread Count", valueNumber: 32 },
      { specName: "Base Clock (GHz)", valueNumber: 3.2 },
      { specName: "Boost Clock (GHz)", valueNumber: 6.0 },
      { specName: "TDP (W)", valueNumber: 253 },
      { specName: "Memory Type", valueString: "DDR5", optionValue: "DDR5" },
      { specName: "Max Memory (GB)", valueNumber: 192 },
      { specName: "Integrated Graphics", valueString: "Intel UHD 770", optionValue: "Intel UHD 770" },
      { specName: "Architecture", valueString: "Raptor Lake", optionValue: "Raptor Lake" },
      { specName: "PCIe Version", valueString: "PCIe 5.0", optionValue: "PCIe 5.0" },
      { specName: "Overclockable", valueBool: true },
      { specName: "Series", valueString: "Core i9", optionValue: "Core i9" },
      { specName: "Process Node", valueString: "Intel 7" },
      { specName: "L3 Cache (MB)", valueNumber: 36 },
    ],
  },
  {
    id: "cpu-03", sku: "CPU-AMD-7600X",
    name: "AMD Ryzen 5 7600X",
    description: "Fast Zen 4 6-core processor on AM5, excellent for budget gaming builds with strong IPC and DDR5 support.",
    subCategoryName: "Desktop CPU", brandName: "AMD", price: 22500, image: "https://cdn.amd.com/System/Placeholder/prd_ryzen_5600x.jpg", stock: 24,
    specs: [
      { specName: "Socket", valueString: "AM5", optionValue: "AM5" },
      { specName: "Core Count", valueNumber: 6 },
      { specName: "Thread Count", valueNumber: 12 },
      { specName: "Base Clock (GHz)", valueNumber: 4.7 },
      { specName: "Boost Clock (GHz)", valueNumber: 5.3 },
      { specName: "TDP (W)", valueNumber: 105 },
      { specName: "Memory Type", valueString: "DDR5", optionValue: "DDR5" },
      { specName: "Max Memory (GB)", valueNumber: 128 },
      { specName: "Integrated Graphics", valueString: "Radeon Graphics", optionValue: "Radeon Graphics" },
      { specName: "Architecture", valueString: "Zen 4", optionValue: "Zen 4" },
      { specName: "PCIe Version", valueString: "PCIe 5.0", optionValue: "PCIe 5.0" },
      { specName: "Overclockable", valueBool: true },
      { specName: "Series", valueString: "Ryzen 5", optionValue: "Ryzen 5" },
      { specName: "Process Node", valueString: "5nm" },
      { specName: "L3 Cache (MB)", valueNumber: 32 },
    ],
  },
  {
    id: "cpu-04", sku: "CPU-INT-13600K",
    name: "Intel Core i5-13600K",
    description: "14-core (6P+8E) 13th Gen powerhouse, the best mid-range gaming CPU with unlocked multiplier and PCIe 5.0 on LGA1700.",
    subCategoryName: "Desktop CPU", brandName: "Intel", price: 28000, image: "https://www.intel.com/content/dam/products/placeholder.png", stock: 20,
    specs: [
      { specName: "Socket", valueString: "LGA1700", optionValue: "LGA1700" },
      { specName: "Core Count", valueNumber: 14 },
      { specName: "Thread Count", valueNumber: 20 },
      { specName: "Base Clock (GHz)", valueNumber: 3.5 },
      { specName: "Boost Clock (GHz)", valueNumber: 5.1 },
      { specName: "TDP (W)", valueNumber: 125 },
      { specName: "Memory Type", valueString: "DDR5", optionValue: "DDR5" },
      { specName: "Max Memory (GB)", valueNumber: 192 },
      { specName: "Integrated Graphics", valueString: "Intel UHD 770", optionValue: "Intel UHD 770" },
      { specName: "Architecture", valueString: "Raptor Lake", optionValue: "Raptor Lake" },
      { specName: "PCIe Version", valueString: "PCIe 5.0", optionValue: "PCIe 5.0" },
      { specName: "Overclockable", valueBool: true },
      { specName: "Series", valueString: "Core i5", optionValue: "Core i5" },
      { specName: "Process Node", valueString: "Intel 7" },
      { specName: "L3 Cache (MB)", valueNumber: 24 },
    ],
  },
  {
    id: "cpu-05", sku: "CPU-AMD-5600X",
    name: "AMD Ryzen 5 5600X",
    description: "Zen 3 6-core 12-thread AM4 CPU, legendary budget gaming processor still very capable for 1080p and 1440p gaming.",
    subCategoryName: "Desktop CPU", brandName: "AMD", price: 13500, image: "https://cdn.amd.com/System/Placeholder/prd_ryzen_5600x.jpg", stock: 30,
    specs: [
      { specName: "Socket", valueString: "AM4", optionValue: "AM4" },
      { specName: "Core Count", valueNumber: 6 },
      { specName: "Thread Count", valueNumber: 12 },
      { specName: "Base Clock (GHz)", valueNumber: 3.7 },
      { specName: "Boost Clock (GHz)", valueNumber: 4.6 },
      { specName: "TDP (W)", valueNumber: 65 },
      { specName: "Memory Type", valueString: "DDR4", optionValue: "DDR4" },
      { specName: "Max Memory (GB)", valueNumber: 128 },
      { specName: "Integrated Graphics", valueString: "None", optionValue: "None" },
      { specName: "Architecture", valueString: "Zen 3", optionValue: "Zen 3" },
      { specName: "PCIe Version", valueString: "PCIe 4.0", optionValue: "PCIe 4.0" },
      { specName: "Overclockable", valueBool: true },
      { specName: "Series", valueString: "Ryzen 5", optionValue: "Ryzen 5" },
      { specName: "Process Node", valueString: "7nm" },
      { specName: "L3 Cache (MB)", valueNumber: 32 },
    ],
  },
  {
    id: "cpu-06", sku: "CPU-AMD-9950X",
    name: "AMD Ryzen 9 9950X",
    description: "AMD's flagship Zen 5 processor with 16 cores and 32 threads, offering tremendous performance for gaming and professional content creation on AM5.",
    subCategoryName: "Desktop CPU", brandName: "AMD", price: 68000, image: "https://cdn.amd.com/System/Placeholder/prd_ryzen_9950x.jpg", stock: 5,
    specs: [
      { specName: "Socket", valueString: "AM5", optionValue: "AM5" },
      { specName: "Core Count", valueNumber: 16 },
      { specName: "Thread Count", valueNumber: 32 },
      { specName: "Base Clock (GHz)", valueNumber: 4.3 },
      { specName: "Boost Clock (GHz)", valueNumber: 5.7 },
      { specName: "TDP (W)", valueNumber: 170 },
      { specName: "Memory Type", valueString: "DDR5", optionValue: "DDR5" },
      { specName: "Max Memory (GB)", valueNumber: 256 },
      { specName: "Integrated Graphics", valueString: "Radeon Graphics", optionValue: "Radeon Graphics" },
      { specName: "Architecture", valueString: "Zen 5", optionValue: "Zen 5" },
      { specName: "PCIe Version", valueString: "PCIe 5.0", optionValue: "PCIe 5.0" },
      { specName: "Overclockable", valueBool: true },
      { specName: "Series", valueString: "Ryzen 9", optionValue: "Ryzen 9" },
      { specName: "Process Node", valueString: "5nm" },
      { specName: "L3 Cache (MB)", valueNumber: 64 },
    ],
  },
  {
    id: "cpu-07", sku: "CPU-INT-12400F",
    name: "Intel Core i5-12400F",
    description: "Budget-friendly 12th Gen Alder Lake 6P-core processor without iGPU, excellent value for gaming paired with a discrete GPU.",
    subCategoryName: "Desktop CPU", brandName: "Intel", price: 12000, image: "https://www.intel.com/content/dam/products/placeholder.png", stock: 35,
    specs: [
      { specName: "Socket", valueString: "LGA1700", optionValue: "LGA1700" },
      { specName: "Core Count", valueNumber: 6 },
      { specName: "Thread Count", valueNumber: 12 },
      { specName: "Base Clock (GHz)", valueNumber: 2.5 },
      { specName: "Boost Clock (GHz)", valueNumber: 4.4 },
      { specName: "TDP (W)", valueNumber: 65 },
      { specName: "Memory Type", valueString: "DDR4", optionValue: "DDR4" },
      { specName: "Max Memory (GB)", valueNumber: 128 },
      { specName: "Integrated Graphics", valueString: "None", optionValue: "None" },
      { specName: "Architecture", valueString: "Alder Lake", optionValue: "Alder Lake" },
      { specName: "PCIe Version", valueString: "PCIe 5.0", optionValue: "PCIe 5.0" },
      { specName: "Overclockable", valueBool: false },
      { specName: "Series", valueString: "Core i5", optionValue: "Core i5" },
      { specName: "Process Node", valueString: "Intel 7" },
      { specName: "L3 Cache (MB)", valueNumber: 18 },
    ],
  },
  {
    id: "cpu-08", sku: "CPU-AMD-7950X3D",
    name: "AMD Ryzen 9 7950X3D",
    description: "The ultimate dual-CCD processor combining 3D V-Cache on one CCD for gaming and raw compute power on the other, perfect for streaming-gaming workstations.",
    subCategoryName: "Desktop CPU", brandName: "AMD", price: 64000, image: "https://cdn.amd.com/System/Placeholder/prd_ryzen_9_7950x3d.jpg", stock: 4,
    specs: [
      { specName: "Socket", valueString: "AM5", optionValue: "AM5" },
      { specName: "Core Count", valueNumber: 16 },
      { specName: "Thread Count", valueNumber: 32 },
      { specName: "Base Clock (GHz)", valueNumber: 4.2 },
      { specName: "Boost Clock (GHz)", valueNumber: 5.7 },
      { specName: "TDP (W)", valueNumber: 120 },
      { specName: "Memory Type", valueString: "DDR5", optionValue: "DDR5" },
      { specName: "Max Memory (GB)", valueNumber: 128 },
      { specName: "Integrated Graphics", valueString: "Radeon Graphics", optionValue: "Radeon Graphics" },
      { specName: "Architecture", valueString: "Zen 4 V-Cache", optionValue: "Zen 4 V-Cache" },
      { specName: "PCIe Version", valueString: "PCIe 5.0", optionValue: "PCIe 5.0" },
      { specName: "Overclockable", valueBool: false },
      { specName: "Series", valueString: "Ryzen 9", optionValue: "Ryzen 9" },
      { specName: "Process Node", valueString: "5nm" },
      { specName: "L3 Cache (MB)", valueNumber: 128 },
    ],
  },

  // ── HEDT CPUs ───────────────────────────────────────────────────────────────
  {
    id: "cpu-09", sku: "CPU-AMD-7960X",
    name: "AMD Ryzen Threadripper 7960X",
    description: "24-core 48-thread HEDT workstation processor on sTR5 socket with massive 152MB L3, quad-channel DDR5 and 88 PCIe lanes.",
    subCategoryName: "HEDT CPU", brandName: "AMD", price: 135000, image: "https://cdn.amd.com/System/Placeholder/prd_threadripper.jpg", stock: 2,
    specs: [
      { specName: "Socket", valueString: "sTR5", optionValue: "sTR5" },
      { specName: "Core Count", valueNumber: 24 },
      { specName: "TDP (W)", valueNumber: 350 },
      { specName: "Memory Type", valueString: "DDR5", optionValue: "DDR5" },
      { specName: "Memory Channels", valueNumber: 4 },
      { specName: "Architecture", valueString: "Zen 4", optionValue: "Zen 4" },
    ],
  },

  // ── MOTHERBOARDS ────────────────────────────────────────────────────────────
  {
    id: "mobo-01", sku: "MB-ASUS-X670E-ROG",
    name: "ASUS ROG Strix X670E-E Gaming WiFi",
    description: "Premium AM5 ATX motherboard with X670E chipset, PCIe 5.0 x16 and M.2, DDR5-6000+, WiFi 6E, 2.5GbE and robust 18+2 power delivery for Ryzen 7000 overclocking.",
    subCategoryName: "ATX Motherboard", brandName: "ASUS", price: 42000, image: "https://placeholder.asus.com/rog-strix-x670e.jpg", stock: 10,
    specs: [
      { specName: "Socket", valueString: "AM5", optionValue: "AM5" },
      { specName: "Chipset", valueString: "X670E", optionValue: "X670E" },
      { specName: "Form Factor", valueString: "ATX", optionValue: "ATX" },
      { specName: "Memory Type", valueString: "DDR5", optionValue: "DDR5" },
      { specName: "Memory Slots", valueNumber: 4 },
      { specName: "Max Memory (GB)", valueNumber: 192 },
      { specName: "PCIe x16 Slots", valueNumber: 2 },
      { specName: "M.2 Slots", valueNumber: 4 },
      { specName: "USB 3.2 Gen2 Ports", valueNumber: 6 },
      { specName: "USB4/Thunderbolt", valueBool: false },
      { specName: "WiFi", valueString: "WiFi 6E", optionValue: "WiFi 6E" },
      { specName: "Bluetooth", valueString: "5.3" },
      { specName: "LAN Speed", valueString: "2.5GbE", optionValue: "2.5GbE" },
      { specName: "PCIe Gen (Primary)", valueString: "PCIe 5.0", optionValue: "PCIe 5.0" },
      { specName: "VRM Phases", valueNumber: 18 },
      { specName: "SATA Ports", valueNumber: 6 },
    ],
  },
  {
    id: "mobo-02", sku: "MB-MSI-Z790-TOMAHAWK",
    name: "MSI MAG Z790 Tomahawk WiFi",
    description: "Solid Z790 ATX motherboard for Intel 12th/13th/14th Gen, featuring DDR5, PCIe 5.0, WiFi 6E, and 16+1+1 power stages.",
    subCategoryName: "ATX Motherboard", brandName: "MSI", price: 28000, image: "https://placeholder.msi.com/z790-tomahawk.jpg", stock: 12,
    specs: [
      { specName: "Socket", valueString: "LGA1700", optionValue: "LGA1700" },
      { specName: "Chipset", valueString: "Z790", optionValue: "Z790" },
      { specName: "Form Factor", valueString: "ATX", optionValue: "ATX" },
      { specName: "Memory Type", valueString: "DDR5", optionValue: "DDR5" },
      { specName: "Memory Slots", valueNumber: 4 },
      { specName: "Max Memory (GB)", valueNumber: 192 },
      { specName: "PCIe x16 Slots", valueNumber: 2 },
      { specName: "M.2 Slots", valueNumber: 5 },
      { specName: "USB 3.2 Gen2 Ports", valueNumber: 4 },
      { specName: "USB4/Thunderbolt", valueBool: false },
      { specName: "WiFi", valueString: "WiFi 6E", optionValue: "WiFi 6E" },
      { specName: "Bluetooth", valueString: "5.3" },
      { specName: "LAN Speed", valueString: "2.5GbE", optionValue: "2.5GbE" },
      { specName: "PCIe Gen (Primary)", valueString: "PCIe 5.0", optionValue: "PCIe 5.0" },
      { specName: "VRM Phases", valueNumber: 16 },
      { specName: "SATA Ports", valueNumber: 6 },
    ],
  },
  {
    id: "mobo-03", sku: "MB-GIG-B550M-DS3H",
    name: "Gigabyte B550M DS3H",
    description: "Budget Micro-ATX board for AMD AM4 Ryzen 3000/5000 series, DDR4 support, PCIe 4.0, and dual M.2 slots.",
    subCategoryName: "Micro-ATX Motherboard", brandName: "Gigabyte", price: 8500, image: "https://placeholder.gigabyte.com/b550m-ds3h.jpg", stock: 30,
    specs: [
      { specName: "Socket", valueString: "AM4", optionValue: "AM4" },
      { specName: "Chipset", valueString: "B550", optionValue: "B550" },
      { specName: "Form Factor", valueString: "Micro-ATX", optionValue: "Micro-ATX" },
      { specName: "Memory Type", valueString: "DDR4", optionValue: "DDR4" },
      { specName: "Memory Slots", valueNumber: 4 },
      { specName: "M.2 Slots", valueNumber: 2 },
      { specName: "WiFi", valueString: "None", optionValue: "None" },
      { specName: "LAN Speed", valueString: "1GbE", optionValue: "1GbE" },
      { specName: "SATA Ports", valueNumber: 4 },
    ],
  },
  {
    id: "mobo-04", sku: "MB-ASR-B650M-PRO",
    name: "ASRock B650M Pro RS",
    description: "Great value AM5 Micro-ATX board with B650 chipset, DDR5, PCIe 4.0 M.2, and 2.5GbE LAN.",
    subCategoryName: "Micro-ATX Motherboard", brandName: "ASRock", price: 13500, image: "https://placeholder.asrock.com/b650m-pro.jpg", stock: 18,
    specs: [
      { specName: "Socket", valueString: "AM5", optionValue: "AM5" },
      { specName: "Chipset", valueString: "B650", optionValue: "B650" },
      { specName: "Form Factor", valueString: "Micro-ATX", optionValue: "Micro-ATX" },
      { specName: "Memory Type", valueString: "DDR5", optionValue: "DDR5" },
      { specName: "Memory Slots", valueNumber: 4 },
      { specName: "M.2 Slots", valueNumber: 2 },
      { specName: "WiFi", valueString: "None", optionValue: "None" },
      { specName: "LAN Speed", valueString: "2.5GbE", optionValue: "2.5GbE" },
      { specName: "SATA Ports", valueNumber: 4 },
    ],
  },
  {
    id: "mobo-05", sku: "MB-ASUS-B650-TUF",
    name: "ASUS TUF Gaming B650-Plus WiFi",
    description: "Durable ATX AM5 board with B650 chipset, DDR5-6000 support, 3x M.2, WiFi 6, and military-grade components.",
    subCategoryName: "ATX Motherboard", brandName: "ASUS", price: 19000, image: "https://placeholder.asus.com/tuf-b650-plus.jpg", stock: 16,
    specs: [
      { specName: "Socket", valueString: "AM5", optionValue: "AM5" },
      { specName: "Chipset", valueString: "B650", optionValue: "B650" },
      { specName: "Form Factor", valueString: "ATX", optionValue: "ATX" },
      { specName: "Memory Type", valueString: "DDR5", optionValue: "DDR5" },
      { specName: "Memory Slots", valueNumber: 4 },
      { specName: "Max Memory (GB)", valueNumber: 192 },
      { specName: "PCIe x16 Slots", valueNumber: 2 },
      { specName: "M.2 Slots", valueNumber: 3 },
      { specName: "USB 3.2 Gen2 Ports", valueNumber: 2 },
      { specName: "USB4/Thunderbolt", valueBool: false },
      { specName: "WiFi", valueString: "WiFi 6", optionValue: "WiFi 6" },
      { specName: "Bluetooth", valueString: "5.2" },
      { specName: "LAN Speed", valueString: "2.5GbE", optionValue: "2.5GbE" },
      { specName: "PCIe Gen (Primary)", valueString: "PCIe 4.0", optionValue: "PCIe 4.0" },
      { specName: "VRM Phases", valueNumber: 12 },
      { specName: "SATA Ports", valueNumber: 4 },
    ],
  },
  {
    id: "mobo-06", sku: "MB-GIG-X670-AORUS",
    name: "Gigabyte X670 Aorus Elite AX",
    description: "High-end X670 ATX motherboard for AMD Ryzen 7000, with 16+2+2 VRM, PCIe 5.0 x16, 4x M.2, WiFi 6E, and 2.5GbE.",
    subCategoryName: "ATX Motherboard", brandName: "Gigabyte", price: 29000, image: "https://placeholder.gigabyte.com/x670-aorus-elite.jpg", stock: 9,
    specs: [
      { specName: "Socket", valueString: "AM5", optionValue: "AM5" },
      { specName: "Chipset", valueString: "X670", optionValue: "X670" },
      { specName: "Form Factor", valueString: "ATX", optionValue: "ATX" },
      { specName: "Memory Type", valueString: "DDR5", optionValue: "DDR5" },
      { specName: "Memory Slots", valueNumber: 4 },
      { specName: "Max Memory (GB)", valueNumber: 192 },
      { specName: "PCIe x16 Slots", valueNumber: 2 },
      { specName: "M.2 Slots", valueNumber: 4 },
      { specName: "USB 3.2 Gen2 Ports", valueNumber: 4 },
      { specName: "USB4/Thunderbolt", valueBool: false },
      { specName: "WiFi", valueString: "WiFi 6E", optionValue: "WiFi 6E" },
      { specName: "Bluetooth", valueString: "5.3" },
      { specName: "LAN Speed", valueString: "2.5GbE", optionValue: "2.5GbE" },
      { specName: "PCIe Gen (Primary)", valueString: "PCIe 5.0", optionValue: "PCIe 5.0" },
      { specName: "VRM Phases", valueNumber: 16 },
      { specName: "SATA Ports", valueNumber: 4 },
    ],
  },

  // ── GPUs — NVIDIA ────────────────────────────────────────────────────────────
  {
    id: "gpu-01", sku: "GPU-ASUS-4090-ROG",
    name: "ASUS ROG Strix GeForce RTX 4090 24GB OC",
    description: "NVIDIA's flagship Ada Lovelace GPU with 24GB GDDR6X, triple 80mm fans, and top-of-class rasterization and ray-tracing performance for 4K gaming.",
    subCategoryName: "NVIDIA GPU", brandName: "ASUS", price: 175000, image: "https://placeholder.asus.com/rog-strix-4090.jpg", stock: 3,
    specs: [
      { specName: "GPU Chip", valueString: "RTX 4090", optionValue: "RTX 4090" },
      { specName: "VRAM (GB)", valueNumber: 24 },
      { specName: "Memory Type", valueString: "GDDR6X", optionValue: "GDDR6X" },
      { specName: "Memory Bus (bit)", valueNumber: 384 },
      { specName: "TDP (W)", valueNumber: 450 },
      { specName: "Card Length (mm)", valueNumber: 357 },
      { specName: "PCIe Interface", valueString: "PCIe 4.0 x16", optionValue: "PCIe 4.0 x16" },
      { specName: "Power Connector", valueString: "16-pin (12VHPWR)" },
      { specName: "DisplayPort Outputs", valueNumber: 3 },
      { specName: "HDMI Version", valueString: "HDMI 2.1" },
      { specName: "Base Clock (MHz)", valueNumber: 2235 },
      { specName: "Boost Clock (MHz)", valueNumber: 2640 },
      { specName: "Cooling Solution", valueString: "Triple Fan", optionValue: "Triple Fan" },
      { specName: "Slot Width", valueString: "3.5-slot" },
    ],
  },
  {
    id: "gpu-02", sku: "GPU-MSI-4080S-SLIM",
    name: "MSI GeForce RTX 4080 Super 16GB Gaming X Slim",
    description: "NVIDIA RTX 4080 Super with 16GB GDDR6X, 10240 CUDA cores, exceptional 4K gaming performance in a sleek dual-fan design.",
    subCategoryName: "NVIDIA GPU", brandName: "MSI", price: 95000, image: "https://placeholder.msi.com/rtx-4080-super.jpg", stock: 6,
    specs: [
      { specName: "GPU Chip", valueString: "RTX 4080 Super", optionValue: "RTX 4080 Super" },
      { specName: "VRAM (GB)", valueNumber: 16 },
      { specName: "Memory Type", valueString: "GDDR6X", optionValue: "GDDR6X" },
      { specName: "Memory Bus (bit)", valueNumber: 256 },
      { specName: "TDP (W)", valueNumber: 320 },
      { specName: "Card Length (mm)", valueNumber: 336 },
      { specName: "PCIe Interface", valueString: "PCIe 4.0 x16", optionValue: "PCIe 4.0 x16" },
      { specName: "Power Connector", valueString: "16-pin (12VHPWR)" },
      { specName: "DisplayPort Outputs", valueNumber: 3 },
      { specName: "HDMI Version", valueString: "HDMI 2.1" },
      { specName: "Base Clock (MHz)", valueNumber: 2295 },
      { specName: "Boost Clock (MHz)", valueNumber: 2610 },
      { specName: "Cooling Solution", valueString: "Dual Fan", optionValue: "Dual Fan" },
      { specName: "Slot Width", valueString: "2.5-slot" },
    ],
  },
  {
    id: "gpu-03", sku: "GPU-ZOTAC-4070S-TWIN",
    name: "Zotac GeForce RTX 4070 Super 12GB Twin Edge OC",
    description: "High-performance RTX 4070 Super with 12GB GDDR6X, 7168 CUDA cores and IceStorm 2.0 cooling for 1440p gaming excellence.",
    subCategoryName: "NVIDIA GPU", brandName: "Zotac", price: 56000, image: "https://placeholder.zotac.com/rtx-4070-super.jpg", stock: 10,
    specs: [
      { specName: "GPU Chip", valueString: "RTX 4070 Super", optionValue: "RTX 4070 Super" },
      { specName: "VRAM (GB)", valueNumber: 12 },
      { specName: "Memory Type", valueString: "GDDR6X", optionValue: "GDDR6X" },
      { specName: "Memory Bus (bit)", valueNumber: 192 },
      { specName: "TDP (W)", valueNumber: 220 },
      { specName: "Card Length (mm)", valueNumber: 302 },
      { specName: "PCIe Interface", valueString: "PCIe 4.0 x16", optionValue: "PCIe 4.0 x16" },
      { specName: "Power Connector", valueString: "16-pin (12VHPWR)" },
      { specName: "DisplayPort Outputs", valueNumber: 3 },
      { specName: "HDMI Version", valueString: "HDMI 2.1" },
      { specName: "Base Clock (MHz)", valueNumber: 1980 },
      { specName: "Boost Clock (MHz)", valueNumber: 2505 },
      { specName: "Cooling Solution", valueString: "Dual Fan", optionValue: "Dual Fan" },
      { specName: "Slot Width", valueString: "2-slot" },
    ],
  },
  {
    id: "gpu-04", sku: "GPU-ASUS-4060-DUAL",
    name: "ASUS Dual GeForce RTX 4060 8GB OC",
    description: "RTX 4060 featuring 8GB GDDR6, 3072 CUDA cores, DLSS 3, and AV1 encoding — a great 1080p gaming GPU for mainstream builds.",
    subCategoryName: "NVIDIA GPU", brandName: "ASUS", price: 32000, image: "https://placeholder.asus.com/dual-rtx-4060.jpg", stock: 18,
    specs: [
      { specName: "GPU Chip", valueString: "RTX 4060", optionValue: "RTX 4060" },
      { specName: "VRAM (GB)", valueNumber: 8 },
      { specName: "Memory Type", valueString: "GDDR6", optionValue: "GDDR6" },
      { specName: "Memory Bus (bit)", valueNumber: 128 },
      { specName: "TDP (W)", valueNumber: 115 },
      { specName: "Card Length (mm)", valueNumber: 251 },
      { specName: "PCIe Interface", valueString: "PCIe 4.0 x16", optionValue: "PCIe 4.0 x16" },
      { specName: "Power Connector", valueString: "2x 8-pin" },
      { specName: "DisplayPort Outputs", valueNumber: 3 },
      { specName: "HDMI Version", valueString: "HDMI 2.1" },
      { specName: "Base Clock (MHz)", valueNumber: 1830 },
      { specName: "Boost Clock (MHz)", valueNumber: 2505 },
      { specName: "Cooling Solution", valueString: "Dual Fan", optionValue: "Dual Fan" },
      { specName: "Slot Width", valueString: "2-slot" },
    ],
  },

  // ── GPUs — AMD ──────────────────────────────────────────────────────────────
  {
    id: "gpu-05", sku: "GPU-SAP-7900XTX-NITRO",
    name: "Sapphire Nitro+ RX 7900 XTX 24GB",
    description: "AMD's flagship RDNA 3 GPU with 24GB GDDR6, massive 384-bit bus, superb 4K gaming and professional workloads at competitive pricing.",
    subCategoryName: "AMD GPU", brandName: "Sapphire", price: 85000, image: "https://placeholder.sapphire.com/nitro-7900xtx.jpg", stock: 4,
    specs: [
      { specName: "GPU Chip", valueString: "RX 7900 XTX", optionValue: "RX 7900 XTX" },
      { specName: "VRAM (GB)", valueNumber: 24 },
      { specName: "Memory Type", valueString: "GDDR6", optionValue: "GDDR6" },
      { specName: "Memory Bus (bit)", valueNumber: 384 },
      { specName: "TDP (W)", valueNumber: 355 },
      { specName: "Card Length (mm)", valueNumber: 336 },
      { specName: "PCIe Interface", valueString: "PCIe 4.0 x16", optionValue: "PCIe 4.0 x16" },
      { specName: "Cooling Solution", valueString: "Triple Fan", optionValue: "Triple Fan" },
    ],
  },
  {
    id: "gpu-06", sku: "GPU-XFX-7800XT-QUICK",
    name: "XFX Speedster QICK RX 7800 XT 16GB",
    description: "AMD RX 7800 XT with 16GB GDDR6, 60 RDNA 3 compute units, excellent 1440p performance and DisplayPort 2.1 support.",
    subCategoryName: "AMD GPU", brandName: "XFX", price: 42000, image: "https://placeholder.xfx.com/7800xt.jpg", stock: 12,
    specs: [
      { specName: "GPU Chip", valueString: "RX 7800 XT", optionValue: "RX 7800 XT" },
      { specName: "VRAM (GB)", valueNumber: 16 },
      { specName: "Memory Type", valueString: "GDDR6", optionValue: "GDDR6" },
      { specName: "Memory Bus (bit)", valueNumber: 256 },
      { specName: "TDP (W)", valueNumber: 263 },
      { specName: "Card Length (mm)", valueNumber: 310 },
      { specName: "PCIe Interface", valueString: "PCIe 4.0 x16", optionValue: "PCIe 4.0 x16" },
      { specName: "Cooling Solution", valueString: "Triple Fan", optionValue: "Triple Fan" },
    ],
  },
  {
    id: "gpu-07", sku: "GPU-POW-9070XT-RED",
    name: "PowerColor Red Devil RX 9070 XT 16GB",
    description: "AMD's latest RDNA 4 flagship consumer GPU with 16GB GDDR6, 64 CUs, hardware ray-tracing acceleration, and AV1 encoding at phenomenal 1440p/4K speeds.",
    subCategoryName: "AMD GPU", brandName: "PowerColor", price: 55000, image: "https://placeholder.powercolor.com/rx-9070xt.jpg", stock: 8,
    specs: [
      { specName: "GPU Chip", valueString: "RX 9070 XT", optionValue: "RX 9070 XT" },
      { specName: "VRAM (GB)", valueNumber: 16 },
      { specName: "Memory Type", valueString: "GDDR6", optionValue: "GDDR6" },
      { specName: "Memory Bus (bit)", valueNumber: 256 },
      { specName: "TDP (W)", valueNumber: 304 },
      { specName: "Card Length (mm)", valueNumber: 325 },
      { specName: "PCIe Interface", valueString: "PCIe 5.0 x16", optionValue: "PCIe 5.0 x16" },
      { specName: "Cooling Solution", valueString: "Triple Fan", optionValue: "Triple Fan" },
    ],
  },

  // ── RAM ─────────────────────────────────────────────────────────────────────
  {
    id: "ram-01", sku: "RAM-GSK-TZ5-32DDR5",
    name: "G.Skill Trident Z5 RGB 32GB DDR5-6000 (2x16GB)",
    description: "High-performance DDR5-6000 kit with XMP 3.0 and EXPO dual-profile support, CL30 timings, and vibrant RGB lighting for enthusiast builds.",
    subCategoryName: "DDR5 RAM", brandName: "G.Skill", price: 12500, image: "https://placeholder.gskill.com/tz5-ddr5.jpg", stock: 50,
    specs: [
      { specName: "Memory Type", valueString: "DDR5", optionValue: "DDR5" },
      { specName: "Capacity", valueString: "32GB (16GBx2)", optionValue: "32GB (16GBx2)" },
      { specName: "Speed (MT/s)", valueNumber: 6000 },
      { specName: "CAS Latency", valueNumber: 30 },
      { specName: "Timings", valueString: "30-38-38-96" },
      { specName: "Voltage", valueNumber: 1.35 },
      { specName: "RGB", valueBool: true },
      { specName: "Heat Spreader", valueString: "Tall Heatsink" },
      { specName: "XMP/EXPO Profile", valueString: "XMP 3.0 & EXPO", optionValue: "XMP 3.0 & EXPO" },
      { specName: "ECC", valueBool: false },
    ],
  },
  {
    id: "ram-02", sku: "RAM-COR-VEN-16DDR4",
    name: "Corsair Vengeance LPX 16GB DDR4-3200 (2x8GB)",
    description: "Reliable DDR4-3200 kit with XMP 2.0 support, low-profile heatspreader for tight clearances, and proven compatibility across all platforms.",
    subCategoryName: "DDR4 RAM", brandName: "Corsair", price: 4500, image: "https://placeholder.corsair.com/vengeance-lpx.jpg", stock: 80,
    specs: [
      { specName: "Memory Type", valueString: "DDR4", optionValue: "DDR4" },
      { specName: "Capacity", valueString: "16GB (8GBx2)", optionValue: "16GB (8GBx2)" },
      { specName: "Speed (MT/s)", valueNumber: 3200 },
      { specName: "CAS Latency", valueNumber: 16 },
      { specName: "Timings", valueString: "16-18-18-36" },
      { specName: "Voltage", valueNumber: 1.35 },
      { specName: "RGB", valueBool: false },
      { specName: "XMP Profile", valueString: "XMP 2.0", optionValue: "XMP 2.0" },
      { specName: "ECC", valueBool: false },
    ],
  },
  {
    id: "ram-03", sku: "RAM-KIN-FUR-8DDR4",
    name: "Kingston Fury Beast 8GB DDR4-3200",
    description: "Single-stick DDR4-3200 entry module with plug-and-play XMP, low-profile design, ideal for budget single-channel or channel pairing.",
    subCategoryName: "DDR4 RAM", brandName: "Kingston", price: 2200, image: "https://placeholder.kingston.com/fury-beast.jpg", stock: 100,
    specs: [
      { specName: "Memory Type", valueString: "DDR4", optionValue: "DDR4" },
      { specName: "Capacity", valueString: "8GB", optionValue: "8GB" },
      { specName: "Speed (MT/s)", valueNumber: 3200 },
      { specName: "CAS Latency", valueNumber: 16 },
      { specName: "Timings", valueString: "16-18-18-36" },
      { specName: "Voltage", valueNumber: 1.35 },
      { specName: "RGB", valueBool: false },
      { specName: "XMP Profile", valueString: "XMP 2.0", optionValue: "XMP 2.0" },
      { specName: "ECC", valueBool: false },
    ],
  },
  {
    id: "ram-04", sku: "RAM-COR-DOM-64DDR5",
    name: "Corsair Dominator Titanium 64GB DDR5-6400 (2x32GB)",
    description: "Premium 64GB DDR5-6400 RGB kit with Corsair's DHX+ cooling and iCUE integration, targeting extreme overclockers and content creation workstations.",
    subCategoryName: "DDR5 RAM", brandName: "Corsair", price: 28000, image: "https://placeholder.corsair.com/dominator-titanium.jpg", stock: 8,
    specs: [
      { specName: "Memory Type", valueString: "DDR5", optionValue: "DDR5" },
      { specName: "Capacity", valueString: "64GB (32GBx2)", optionValue: "64GB (32GBx2)" },
      { specName: "Speed (MT/s)", valueNumber: 6400 },
      { specName: "CAS Latency", valueNumber: 32 },
      { specName: "Timings", valueString: "32-40-40-102" },
      { specName: "Voltage", valueNumber: 1.4 },
      { specName: "RGB", valueBool: true },
      { specName: "Heat Spreader", valueString: "Tall Heatsink" },
      { specName: "XMP/EXPO Profile", valueString: "XMP 3.0", optionValue: "XMP 3.0" },
      { specName: "ECC", valueBool: false },
    ],
  },
  {
    id: "ram-05", sku: "RAM-GSK-RIP-32DDR4",
    name: "G.Skill Ripjaws V 32GB DDR4-3600 (2x16GB)",
    description: "High-speed DDR4-3600 dual kit with tight CL16 timings, ideal for AMD Zen 3 platforms where DDR4 sweet spot is 3600MHz.",
    subCategoryName: "DDR4 RAM", brandName: "G.Skill", price: 9000, image: "https://placeholder.gskill.com/ripjaws-v.jpg", stock: 40,
    specs: [
      { specName: "Memory Type", valueString: "DDR4", optionValue: "DDR4" },
      { specName: "Capacity", valueString: "32GB (16GBx2)", optionValue: "32GB (16GBx2)" },
      { specName: "Speed (MT/s)", valueNumber: 3600 },
      { specName: "CAS Latency", valueNumber: 16 },
      { specName: "Timings", valueString: "16-19-19-39" },
      { specName: "Voltage", valueNumber: 1.35 },
      { specName: "RGB", valueBool: false },
      { specName: "XMP Profile", valueString: "XMP 2.0", optionValue: "XMP 2.0" },
      { specName: "ECC", valueBool: false },
    ],
  },

  // ── STORAGE — NVMe SSDs ─────────────────────────────────────────────────────
  {
    id: "ssd-01", sku: "SSD-SAM-990PRO-1T",
    name: "Samsung 990 Pro 1TB NVMe Gen4",
    description: "Samsung's flagship consumer Gen4 NVMe SSD, 7450/6900 MB/s sequential r/w, optimized for gaming load times and PS5 storage expansion.",
    subCategoryName: "NVMe SSD", brandName: "Samsung", price: 9500, image: "https://placeholder.samsung.com/990pro.jpg", stock: 40,
    specs: [
      { specName: "Form Factor", valueString: "M.2 2280", optionValue: "M.2 2280" },
      { specName: "Interface", valueString: "PCIe 4.0 x4 NVMe", optionValue: "PCIe 4.0 x4 NVMe" },
      { specName: "Capacity", valueString: "1TB", optionValue: "1TB" },
      { specName: "Sequential Read (MB/s)", valueNumber: 7450 },
      { specName: "Sequential Write (MB/s)", valueNumber: 6900 },
      { specName: "TBW", valueNumber: 600 },
      { specName: "NAND Type", valueString: "TLC", optionValue: "TLC" },
      { specName: "DRAM Cache", valueBool: true },
      { specName: "Heatsink Included", valueBool: false },
    ],
  },
  {
    id: "ssd-02", sku: "SSD-CRU-P3-500",
    name: "Crucial P3 500GB NVMe Gen3",
    description: "Budget-friendly Gen3 NVMe SSD offering a massive upgrade from HDD, 3500/1900 MB/s sequential, for entry-level to mainstream builds.",
    subCategoryName: "NVMe SSD", brandName: "Crucial", price: 3000, image: "https://placeholder.crucial.com/p3-500gb.jpg", stock: 60,
    specs: [
      { specName: "Form Factor", valueString: "M.2 2280", optionValue: "M.2 2280" },
      { specName: "Interface", valueString: "PCIe 3.0 x4 NVMe", optionValue: "PCIe 3.0 x4 NVMe" },
      { specName: "Capacity", valueString: "500GB", optionValue: "500GB" },
      { specName: "Sequential Read (MB/s)", valueNumber: 3500 },
      { specName: "Sequential Write (MB/s)", valueNumber: 1900 },
      { specName: "TBW", valueNumber: 110 },
      { specName: "NAND Type", valueString: "QLC", optionValue: "QLC" },
      { specName: "DRAM Cache", valueBool: false },
      { specName: "Heatsink Included", valueBool: false },
    ],
  },
  {
    id: "ssd-03", sku: "SSD-SAM-990PRO-2T",
    name: "Samsung 990 Pro 2TB NVMe Gen4",
    description: "2TB capacity Gen4 NVMe flagship, 7450/6900 MB/s, 1200 TBW endurance, the definitive primary drive for high-capacity storage needs.",
    subCategoryName: "NVMe SSD", brandName: "Samsung", price: 17000, image: "https://placeholder.samsung.com/990pro-2tb.jpg", stock: 20,
    specs: [
      { specName: "Form Factor", valueString: "M.2 2280", optionValue: "M.2 2280" },
      { specName: "Interface", valueString: "PCIe 4.0 x4 NVMe", optionValue: "PCIe 4.0 x4 NVMe" },
      { specName: "Capacity", valueString: "2TB", optionValue: "2TB" },
      { specName: "Sequential Read (MB/s)", valueNumber: 7450 },
      { specName: "Sequential Write (MB/s)", valueNumber: 6900 },
      { specName: "TBW", valueNumber: 1200 },
      { specName: "NAND Type", valueString: "TLC", optionValue: "TLC" },
      { specName: "DRAM Cache", valueBool: true },
      { specName: "Heatsink Included", valueBool: false },
    ],
  },

  // ── STORAGE — HDD ───────────────────────────────────────────────────────────
  {
    id: "hdd-01", sku: "HDD-WD-BLUE-2T",
    name: "Western Digital Blue 2TB 3.5-inch HDD",
    description: "Reliable 7200RPM SATA HDD for mass storage, 256MB cache, ideal for media libraries and bulk data backup in desktop systems.",
    subCategoryName: "HDD", brandName: "Western Digital", price: 4800, image: "https://placeholder.wd.com/blue-2tb.jpg", stock: 60,
    specs: [
      { specName: "Form Factor", valueString: "3.5-inch", optionValue: "3.5-inch" },
      { specName: "Interface", valueString: "SATA III (6Gb/s)", optionValue: "SATA III (6Gb/s)" },
      { specName: "Capacity", valueString: "2TB", optionValue: "2TB" },
      { specName: "RPM", valueString: "7200 RPM", optionValue: "7200 RPM" },
      { specName: "Cache (MB)", valueNumber: 256 },
    ],
  },
  {
    id: "hdd-02", sku: "HDD-SEA-BAR-4T",
    name: "Seagate Barracuda 4TB 3.5-inch HDD",
    description: "High-capacity 5400RPM Seagate Barracuda drive with 256MB cache, excellent cost-per-GB for cold storage and media archiving.",
    subCategoryName: "HDD", brandName: "Seagate", price: 7500, image: "https://placeholder.seagate.com/barracuda-4tb.jpg", stock: 35,
    specs: [
      { specName: "Form Factor", valueString: "3.5-inch", optionValue: "3.5-inch" },
      { specName: "Interface", valueString: "SATA III (6Gb/s)", optionValue: "SATA III (6Gb/s)" },
      { specName: "Capacity", valueString: "4TB", optionValue: "4TB" },
      { specName: "RPM", valueString: "5400 RPM", optionValue: "5400 RPM" },
      { specName: "Cache (MB)", valueNumber: 256 },
    ],
  },

  // ── COOLERS ─────────────────────────────────────────────────────────────────
  {
    id: "cool-01", sku: "COOL-DEP-LS720",
    name: "DeepCool LS720 360mm ARGB AIO",
    description: "360mm all-in-one liquid cooler with 3x 120mm ARGB fans, anti-leak pump, and broad socket support including AM5 and LGA1700.",
    subCategoryName: "AIO Liquid Cooler", brandName: "DeepCool", price: 10500, image: "https://placeholder.deepcool.com/ls720.jpg", stock: 20,
    specs: [
      { specName: "Radiator Size", valueString: "360mm", optionValue: "360mm" },
      { specName: "Socket Compatibility", valueString: "LGA1700", optionValue: "LGA1700" },
      { specName: "Fan Count", valueNumber: 3 },
      { specName: "Fan Size (mm)", valueNumber: 120 },
      { specName: "Fan Speed (RPM)", valueString: "500-1850 RPM" },
      { specName: "Pump Speed (RPM)", valueString: "800-3200 RPM" },
      { specName: "Noise (dBA)", valueNumber: 31 },
      { specName: "ARGB", valueBool: true },
      { specName: "LCD Display", valueBool: false },
      { specName: "Tubing Length (mm)", valueNumber: 400 },
    ],
  },
  {
    id: "cool-02", sku: "COOL-NOC-NH-D15",
    name: "Noctua NH-D15 Dual Tower Air Cooler",
    description: "The legendary dual-tower air cooler with two NF-A15 140mm fans, 250W TDP rating, compatible with AM5 and LGA1700 via included mounting kits.",
    subCategoryName: "Air Cooler", brandName: "Noctua", price: 9000, image: "https://placeholder.noctua.com/nh-d15.jpg", stock: 15,
    specs: [
      { specName: "Socket Compatibility", valueString: "LGA1700", optionValue: "LGA1700" },
      { specName: "Height (mm)", valueNumber: 165 },
      { specName: "Type", valueString: "Dual Tower", optionValue: "Dual Tower" },
      { specName: "Fan Count", valueNumber: 2 },
      { specName: "Fan Size (mm)", valueNumber: 140 },
      { specName: "Noise (dBA)", valueNumber: 24.6 },
      { specName: "Heat Pipes", valueNumber: 6 },
      { specName: "TDP Rating (W)", valueNumber: 250 },
      { specName: "ARGB", valueBool: false },
    ],
  },
  {
    id: "cool-03", sku: "COOL-NZXT-KRAKEN-360",
    name: "NZXT Kraken Elite 360 RGB AIO",
    description: "360mm AIO with a 2.36-inch LCD pump head display, 3x 120mm Infinity Mirror fans, and premium braided tubing for flagship builds.",
    subCategoryName: "AIO Liquid Cooler", brandName: "NZXT", price: 18000, image: "https://placeholder.nzxt.com/kraken-elite-360.jpg", stock: 8,
    specs: [
      { specName: "Radiator Size", valueString: "360mm", optionValue: "360mm" },
      { specName: "Socket Compatibility", valueString: "AM5", optionValue: "AM5" },
      { specName: "Fan Count", valueNumber: 3 },
      { specName: "Fan Size (mm)", valueNumber: 120 },
      { specName: "Fan Speed (RPM)", valueString: "500-2000 RPM" },
      { specName: "Pump Speed (RPM)", valueString: "800-3000 RPM" },
      { specName: "Noise (dBA)", valueNumber: 36 },
      { specName: "ARGB", valueBool: true },
      { specName: "LCD Display", valueBool: true },
      { specName: "Tubing Length (mm)", valueNumber: 400 },
    ],
  },
  {
    id: "cool-04", sku: "COOL-CM-HYPER-212",
    name: "Cooler Master Hyper 212 Halo Black",
    description: "Affordable single-tower air cooler with 4 direct contact heat pipes, 120mm ARGB fan, and broad socket support for budget/mid-range builds.",
    subCategoryName: "Air Cooler", brandName: "Cooler Master", price: 3500, image: "https://placeholder.coolermaster.com/hyper-212.jpg", stock: 45,
    specs: [
      { specName: "Socket Compatibility", valueString: "LGA1700", optionValue: "LGA1700" },
      { specName: "Height (mm)", valueNumber: 158 },
      { specName: "Type", valueString: "Single Tower", optionValue: "Single Tower" },
      { specName: "Fan Count", valueNumber: 1 },
      { specName: "Fan Size (mm)", valueNumber: 120 },
      { specName: "Noise (dBA)", valueNumber: 27 },
      { specName: "Heat Pipes", valueNumber: 4 },
      { specName: "TDP Rating (W)", valueNumber: 150 },
      { specName: "ARGB", valueBool: true },
    ],
  },

  // ── PSU ─────────────────────────────────────────────────────────────────────
  {
    id: "psu-01", sku: "PSU-COR-RM850E",
    name: "Corsair RM850e 850W 80+ Gold Fully Modular",
    description: "850W 80 Plus Gold fully modular ATX 3.0 PSU with native 12VHPWR connector for RTX 40-series GPUs, zero-RPM mode, and Japanese capacitors.",
    subCategoryName: "ATX PSU", brandName: "Corsair", price: 11000, image: "https://placeholder.corsair.com/rm850e.jpg", stock: 15,
    specs: [
      { specName: "Wattage", valueNumber: 850 },
      { specName: "Efficiency Rating", valueString: "80+ Gold", optionValue: "80+ Gold" },
      { specName: "Modular", valueString: "Fully Modular", optionValue: "Fully Modular" },
      { specName: "PCIe 12VHPWR Connector", valueBool: true },
      { specName: "Fan Size (mm)", valueNumber: 120 },
      { specName: "Fan Bearing", valueString: "Fluid Dynamic" },
      { specName: "Form Factor", valueString: "ATX" },
      { specName: "PCIe 6+2 Connectors", valueNumber: 4 },
      { specName: "SATA Connectors", valueNumber: 12 },
      { specName: "Molex Connectors", valueNumber: 4 },
      { specName: "ATX 3.0 Compatible", valueBool: true },
      { specName: "Zero RPM Mode", valueBool: true },
      { specName: "Warranty (years)", valueNumber: 10 },
    ],
  },
  {
    id: "psu-02", sku: "PSU-CM-MWE-550",
    name: "Cooler Master MWE 550W 80+ Bronze",
    description: "Budget 550W 80+ Bronze non-modular PSU, reliable for entry-level gaming and workstation builds without a high-end GPU.",
    subCategoryName: "ATX PSU", brandName: "Cooler Master", price: 4200, image: "https://placeholder.coolermaster.com/mwe-550.jpg", stock: 25,
    specs: [
      { specName: "Wattage", valueNumber: 550 },
      { specName: "Efficiency Rating", valueString: "80+ Bronze", optionValue: "80+ Bronze" },
      { specName: "Modular", valueString: "Non-Modular", optionValue: "Non-Modular" },
      { specName: "PCIe 12VHPWR Connector", valueBool: false },
      { specName: "Fan Size (mm)", valueNumber: 120 },
      { specName: "Form Factor", valueString: "ATX" },
      { specName: "PCIe 6+2 Connectors", valueNumber: 2 },
      { specName: "SATA Connectors", valueNumber: 6 },
      { specName: "Molex Connectors", valueNumber: 4 },
      { specName: "ATX 3.0 Compatible", valueBool: false },
      { specName: "Zero RPM Mode", valueBool: false },
      { specName: "Warranty (years)", valueNumber: 5 },
    ],
  },
  {
    id: "psu-03", sku: "PSU-MSI-MPG-1000G",
    name: "MSI MPG A1000G PCIE5 1000W 80+ Gold",
    description: "1000W 80+ Gold fully modular PSU with ATX 3.0 compliance, native 12VHPWR connector, and PCIe 5.0 readiness for the most demanding systems.",
    subCategoryName: "ATX PSU", brandName: "MSI", price: 14500, image: "https://placeholder.msi.com/mpg-a1000g.jpg", stock: 10,
    specs: [
      { specName: "Wattage", valueNumber: 1000 },
      { specName: "Efficiency Rating", valueString: "80+ Gold", optionValue: "80+ Gold" },
      { specName: "Modular", valueString: "Fully Modular", optionValue: "Fully Modular" },
      { specName: "PCIe 12VHPWR Connector", valueBool: true },
      { specName: "Fan Size (mm)", valueNumber: 135 },
      { specName: "Form Factor", valueString: "ATX" },
      { specName: "PCIe 6+2 Connectors", valueNumber: 6 },
      { specName: "SATA Connectors", valueNumber: 12 },
      { specName: "Molex Connectors", valueNumber: 4 },
      { specName: "ATX 3.0 Compatible", valueBool: true },
      { specName: "Zero RPM Mode", valueBool: true },
      { specName: "Warranty (years)", valueNumber: 7 },
    ],
  },
  {
    id: "psu-04", sku: "PSU-BEQ-DARK-750",
    name: "be quiet! Dark Power 13 750W 80+ Titanium",
    description: "Exceptional 750W Titanium PSU from be quiet! with >94% efficiency, ultra-silent 135mm fan, fully modular cables, and 10-year warranty.",
    subCategoryName: "ATX PSU", brandName: "be quiet!", price: 18000, image: "https://placeholder.bequiet.com/dark-power-13.jpg", stock: 6,
    specs: [
      { specName: "Wattage", valueNumber: 750 },
      { specName: "Efficiency Rating", valueString: "80+ Titanium", optionValue: "80+ Titanium" },
      { specName: "Modular", valueString: "Fully Modular", optionValue: "Fully Modular" },
      { specName: "PCIe 12VHPWR Connector", valueBool: true },
      { specName: "Fan Size (mm)", valueNumber: 135 },
      { specName: "Form Factor", valueString: "ATX" },
      { specName: "PCIe 6+2 Connectors", valueNumber: 4 },
      { specName: "SATA Connectors", valueNumber: 8 },
      { specName: "ATX 3.0 Compatible", valueBool: true },
      { specName: "Zero RPM Mode", valueBool: true },
      { specName: "Warranty (years)", valueNumber: 10 },
    ],
  },

  // ── CASES ───────────────────────────────────────────────────────────────────
  {
    id: "case-01", sku: "CASE-LIA-O11-EVO",
    name: "Lian Li O11 Dynamic EVO Mid Tower",
    description: "Iconic dual-chamber mid tower case with full tempered glass on three sides, 360mm triple-radiator support on three positions, and excellent cable management.",
    subCategoryName: "Mid Tower Case", brandName: "Lian Li", price: 14000, image: "https://placeholder.lianli.com/o11-evo.jpg", stock: 12,
    specs: [
      { specName: "Form Factor", valueString: "Mid Tower", optionValue: "Mid Tower" },
      { specName: "Motherboard Support", valueString: "ATX", optionValue: "ATX" },
      { specName: "Max CPU Cooler Height (mm)", valueNumber: 167 },
      { specName: "Max GPU Length (mm)", valueNumber: 420 },
      { specName: "Max PSU Length (mm)", valueNumber: 270 },
      { specName: "Front I/O", valueString: "USB 3.0 x2, USB-C" },
      { specName: "Drive Bays (3.5-inch)", valueNumber: 2 },
      { specName: "Drive Bays (2.5-inch)", valueNumber: 4 },
      { specName: "Radiator Support (Top)", valueString: "240/280/360mm" },
      { specName: "Radiator Support (Front)", valueString: "240/280/360mm" },
      { specName: "Included Fans", valueString: "3x 120mm" },
      { specName: "Tempered Glass Panel", valueBool: true },
      { specName: "ARGB Controller", valueBool: false },
      { specName: "Color", valueString: "Black", optionValue: "Black" },
    ],
  },
  {
    id: "case-02", sku: "CASE-COR-4000D",
    name: "Corsair 4000D Airflow Mid Tower",
    description: "Airflow-optimized mid tower with mesh front panel, dual 120mm fans included, support for 360mm radiators and E-ATX boards, with magnetic filter on top.",
    subCategoryName: "Mid Tower Case", brandName: "Corsair", price: 7000, image: "https://placeholder.corsair.com/4000d.jpg", stock: 25,
    specs: [
      { specName: "Form Factor", valueString: "Mid Tower", optionValue: "Mid Tower" },
      { specName: "Motherboard Support", valueString: "ATX", optionValue: "ATX" },
      { specName: "Max CPU Cooler Height (mm)", valueNumber: 170 },
      { specName: "Max GPU Length (mm)", valueNumber: 360 },
      { specName: "Front I/O", valueString: "USB 3.0 x2, USB-C" },
      { specName: "Drive Bays (3.5-inch)", valueNumber: 2 },
      { specName: "Drive Bays (2.5-inch)", valueNumber: 2 },
      { specName: "Radiator Support (Top)", valueString: "240/360mm" },
      { specName: "Radiator Support (Front)", valueString: "240/280/360mm" },
      { specName: "Included Fans", valueString: "2x 120mm" },
      { specName: "Tempered Glass Panel", valueBool: true },
      { specName: "ARGB Controller", valueBool: false },
      { specName: "Color", valueString: "Black", optionValue: "Black" },
    ],
  },
  {
    id: "case-03", sku: "CASE-FRA-DEFINE-7",
    name: "Fractal Design Define 7 Mid Tower",
    description: "Sound-dampened mid tower with modular interior, universal fan hub, support for up to 420mm radiators, and two-chamber design with dust filtration.",
    subCategoryName: "Mid Tower Case", brandName: "Fractal Design", price: 12000, image: "https://placeholder.fractaldesign.com/define-7.jpg", stock: 10,
    specs: [
      { specName: "Form Factor", valueString: "Mid Tower", optionValue: "Mid Tower" },
      { specName: "Motherboard Support", valueString: "ATX", optionValue: "ATX" },
      { specName: "Max CPU Cooler Height (mm)", valueNumber: 185 },
      { specName: "Max GPU Length (mm)", valueNumber: 491 },
      { specName: "Front I/O", valueString: "USB 3.0 x2, USB-C" },
      { specName: "Drive Bays (3.5-inch)", valueNumber: 5 },
      { specName: "Drive Bays (2.5-inch)", valueNumber: 3 },
      { specName: "Radiator Support (Front)", valueString: "360mm" },
      { specName: "Included Fans", valueString: "2x 140mm" },
      { specName: "Tempered Glass Panel", valueBool: true },
      { specName: "ARGB Controller", valueBool: false },
      { specName: "Color", valueString: "Black", optionValue: "Black" },
    ],
  },
  {
    id: "case-04", sku: "CASE-CM-HAF700",
    name: "Cooler Master HAF 700 EVO Full Tower",
    description: "Massive full tower with E-ATX support, twin 200mm ARGB mesh fans, comprehensive radiator support, and modular internal design for extreme enthusiast builds.",
    subCategoryName: "Full Tower Case", brandName: "Cooler Master", price: 35000, image: "https://placeholder.coolermaster.com/haf700.jpg", stock: 3,
    specs: [
      { specName: "Form Factor", valueString: "Full Tower", optionValue: "Full Tower" },
      { specName: "Motherboard Support", valueString: "E-ATX", optionValue: "E-ATX" },
      { specName: "Max GPU Length (mm)", valueNumber: 490 },
      { specName: "Radiator Support (Top)", valueString: "360mm" },
      { specName: "Tempered Glass Panel", valueBool: true },
      { specName: "Color", valueString: "Black", optionValue: "Black" },
    ],
  },

  // ── MONITORS ────────────────────────────────────────────────────────────────
  {
    id: "mon-01", sku: "MON-LG-27GN950",
    name: "LG UltraGear 27GN950 27-inch 4K 144Hz",
    description: "Premium 27-inch 4K Nano IPS gaming monitor with 144Hz, 1ms response, G-Sync Compatible, HDR600, 98% DCI-P3 coverage for elite 4K gaming.",
    subCategoryName: "Gaming Monitor", brandName: "LG", price: 45000, image: "https://placeholder.lg.com/27gn950.jpg", stock: 6,
    specs: [
      { specName: "Panel Size (inch)", valueNumber: 27 },
      { specName: "Resolution", valueString: "3840x2160 (4K UHD)", optionValue: "3840x2160 (4K UHD)" },
      { specName: "Panel Type", valueString: "IPS", optionValue: "IPS" },
      { specName: "Refresh Rate (Hz)", valueNumber: 144 },
      { specName: "Response Time (ms)", valueNumber: 1 },
      { specName: "Adaptive Sync", valueString: "G-Sync Compatible", optionValue: "G-Sync Compatible" },
      { specName: "HDR", valueString: "HDR600", optionValue: "HDR600" },
      { specName: "Brightness (nits)", valueNumber: 600 },
      { specName: "Color Gamut (sRGB %)", valueNumber: 135 },
      { specName: "Curved", valueBool: false },
      { specName: "HDMI Ports", valueNumber: 2 },
      { specName: "DisplayPort Ports", valueNumber: 1 },
      { specName: "USB Hub", valueBool: true },
      { specName: "Height Adjustable", valueBool: true },
    ],
  },
  {
    id: "mon-02", sku: "MON-SAM-G7-32",
    name: "Samsung Odyssey G7 32-inch 2K 240Hz",
    description: "32-inch curved QLED 2K monitor with 240Hz, 1ms MPRT, G-Sync Compatible, DisplayHDR 600, and 2500R curvature for immersive gaming.",
    subCategoryName: "Gaming Monitor", brandName: "Samsung", price: 38000, image: "https://placeholder.samsung.com/odyssey-g7.jpg", stock: 8,
    specs: [
      { specName: "Panel Size (inch)", valueNumber: 32 },
      { specName: "Resolution", valueString: "2560x1440 (QHD)", optionValue: "2560x1440 (QHD)" },
      { specName: "Panel Type", valueString: "VA", optionValue: "VA" },
      { specName: "Refresh Rate (Hz)", valueNumber: 240 },
      { specName: "Response Time (ms)", valueNumber: 1 },
      { specName: "Adaptive Sync", valueString: "FreeSync Premium Pro", optionValue: "FreeSync Premium Pro" },
      { specName: "HDR", valueString: "HDR600", optionValue: "HDR600" },
      { specName: "Brightness (nits)", valueNumber: 600 },
      { specName: "Color Gamut (sRGB %)", valueNumber: 125 },
      { specName: "Curved", valueBool: true },
      { specName: "HDMI Ports", valueNumber: 2 },
      { specName: "DisplayPort Ports", valueNumber: 1 },
      { specName: "USB Hub", valueBool: true },
      { specName: "Height Adjustable", valueBool: true },
    ],
  },
  {
    id: "mon-03", sku: "MON-BEN-GW2480",
    name: "BenQ GW2480 24-inch 1080p Professional",
    description: "24-inch 1080p IPS eye-care monitor with flicker-free, low blue light mode, and B.I. sensor for ergonomic professional and office use.",
    subCategoryName: "Professional Monitor", brandName: "BenQ", price: 10000, image: "https://placeholder.benq.com/gw2480.jpg", stock: 35,
    specs: [
      { specName: "Panel Size (inch)", valueNumber: 24 },
      { specName: "Resolution", valueString: "1920x1080 (FHD)", optionValue: "1920x1080 (FHD)" },
      { specName: "Panel Type", valueString: "IPS", optionValue: "IPS" },
      { specName: "Color Gamut (DCI-P3 %)", valueNumber: 72 },
      { specName: "Color Gamut (sRGB %)", valueNumber: 99 },
      { specName: "Delta E", valueNumber: 2 },
      { specName: "HDR", valueString: "None" },
      { specName: "USB-C PD (W)", valueNumber: 0 },
      { specName: "Thunderbolt", valueBool: false },
      { specName: "Height Adjustable", valueBool: true },
      { specName: "Refresh Rate (Hz)", valueNumber: 60 },
    ],
  },

  // ── PERIPHERALS ─────────────────────────────────────────────────────────────
  {
    id: "kb-01", sku: "KB-KEY-K2-V2",
    name: "Keychron K2 V2 75% Wireless Mechanical",
    description: "Compact 75% wireless mechanical keyboard with multi-device Bluetooth 5.1, hot-swap PCB, RGB backlight, and available in multiple switch options.",
    subCategoryName: "Keyboard", brandName: "Keychron", price: 7500, image: "https://placeholder.keychron.com/k2.jpg", stock: 20,
    specs: [
      { specName: "Type", valueString: "Mechanical", optionValue: "Mechanical" },
      { specName: "Connectivity", valueString: "Tri-mode", optionValue: "Tri-mode" },
      { specName: "Layout", valueString: "75%", optionValue: "75%" },
      { specName: "Switch Type", valueString: "Gateron Red", optionValue: "Gateron Red" },
      { specName: "Hot-Swap", valueBool: true },
      { specName: "RGB Backlight", valueBool: true },
      { specName: "Per-key RGB", valueBool: true },
      { specName: "Polling Rate (Hz)", valueNumber: 1000 },
      { specName: "Battery Life (hrs)", valueNumber: 4000 },
      { specName: "NKRO", valueBool: true },
      { specName: "Gasket Mount", valueBool: false },
    ],
  },
  {
    id: "kb-02", sku: "KB-LOG-G915-TKL",
    name: "Logitech G915 TKL Wireless Mechanical",
    description: "Premium tenkeyless wireless keyboard with LIGHTSPEED 2.4GHz, Bluetooth, ultra-thin GL tactile switches, per-key RGB, and 40-hour battery life.",
    subCategoryName: "Keyboard", brandName: "Logitech", price: 15000, image: "https://placeholder.logitech.com/g915-tkl.jpg", stock: 12,
    specs: [
      { specName: "Type", valueString: "Mechanical", optionValue: "Mechanical" },
      { specName: "Connectivity", valueString: "Wired/Wireless", optionValue: "Wired/Wireless" },
      { specName: "Layout", valueString: "TKL (80%)", optionValue: "TKL (80%)" },
      { specName: "Switch Type", valueString: "Proprietary", optionValue: "Proprietary" },
      { specName: "Hot-Swap", valueBool: false },
      { specName: "RGB Backlight", valueBool: true },
      { specName: "Per-key RGB", valueBool: true },
      { specName: "Polling Rate (Hz)", valueNumber: 1000 },
      { specName: "Battery Life (hrs)", valueNumber: 40 },
      { specName: "NKRO", valueBool: true },
      { specName: "Gasket Mount", valueBool: false },
    ],
  },
  {
    id: "ms-01", sku: "MS-LOG-GPX2-SL",
    name: "Logitech G Pro X Superlight 2",
    description: "Ultra-lightweight 60g wireless gaming mouse with HERO 25K sensor, 300-hour battery, zero-latency LIGHTSPEED, and Logitech's best optical tracking.",
    subCategoryName: "Mouse", brandName: "Logitech", price: 14000, image: "https://placeholder.logitech.com/gpx2.jpg", stock: 10,
    specs: [
      { specName: "Connectivity", valueString: "Wireless (2.4GHz)", optionValue: "Wireless (2.4GHz)" },
      { specName: "Sensor", valueString: "Hero 25K", optionValue: "Hero 25K" },
      { specName: "Max DPI", valueNumber: 25600 },
      { specName: "Polling Rate (Hz)", valueNumber: 2000 },
      { specName: "Weight (g)", valueNumber: 60 },
      { specName: "Buttons", valueNumber: 5 },
      { specName: "RGB", valueBool: false },
      { specName: "Battery Life (hrs)", valueNumber: 95 },
      { specName: "Grip Style", valueString: "Ambidextrous", optionValue: "Ambidextrous" },
    ],
  },
  {
    id: "ms-02", sku: "MS-RAZ-DW-V3-HB",
    name: "Razer DeathAdder V3 HyperSpeed Wireless",
    description: "Ergonomic right-handed wireless mouse with Focus Pro 30K optical sensor, 121g weight, and Razer HyperSpeed wireless for up to 300-hour battery.",
    subCategoryName: "Mouse", brandName: "Razer", price: 7500, image: "https://placeholder.razer.com/deathadder-v3.jpg", stock: 22,
    specs: [
      { specName: "Connectivity", valueString: "Wireless (2.4GHz)", optionValue: "Wireless (2.4GHz)" },
      { specName: "Sensor", valueString: "Focus Pro 30K", optionValue: "Focus Pro 30K" },
      { specName: "Max DPI", valueNumber: 30000 },
      { specName: "Polling Rate (Hz)", valueNumber: 1000 },
      { specName: "Weight (g)", valueNumber: 81 },
      { specName: "Buttons", valueNumber: 6 },
      { specName: "RGB", valueBool: false },
      { specName: "Battery Life (hrs)", valueNumber: 300 },
      { specName: "Grip Style", valueString: "Palm", optionValue: "Palm" },
    ],
  },
  {
    id: "hs-01", sku: "HS-HYP-CLOUD-II",
    name: "HyperX Cloud II Wired Gaming Headset",
    description: "Legendary wired gaming headset with 53mm drivers, memory foam ear cushions, detachable cardioid microphone, and virtual 7.1 surround via USB mixer.",
    subCategoryName: "Headset", brandName: "HyperX", price: 7000, image: "https://placeholder.hyperx.com/cloud-ii.jpg", stock: 25,
    specs: [
      { specName: "Connectivity", valueString: "Wired (3.5mm)", optionValue: "Wired (3.5mm)" },
      { specName: "Driver Size (mm)", valueNumber: 53 },
      { specName: "Frequency Response", valueString: "15Hz–25,000Hz" },
      { specName: "Microphone Type", valueString: "Detachable", optionValue: "Detachable" },
      { specName: "Surround Sound", valueString: "Virtual 7.1", optionValue: "Virtual 7.1" },
      { specName: "Noise Cancellation", valueBool: false },
      { specName: "Battery Life (hrs)", valueNumber: 0 },
      { specName: "Weight (g)", valueNumber: 309 },
    ],
  },
  {
    id: "hs-02", sku: "HS-STL-ARC-NOVA-7",
    name: "SteelSeries Arctis Nova 7 Wireless",
    description: "Premium wireless gaming headset with dual-wireless (2.4GHz + Bluetooth), ClearCast Gen2 mic, 38-hour battery, and 360° spatial audio.",
    subCategoryName: "Headset", brandName: "SteelSeries", price: 18000, image: "https://placeholder.steelseries.com/arctis-nova-7.jpg", stock: 10,
    specs: [
      { specName: "Connectivity", valueString: "Dual Wireless", optionValue: "Dual Wireless" },
      { specName: "Driver Size (mm)", valueNumber: 40 },
      { specName: "Frequency Response", valueString: "20Hz–20,000Hz" },
      { specName: "Microphone Type", valueString: "Retractable", optionValue: "Retractable" },
      { specName: "Surround Sound", valueString: "360 Spatial", optionValue: "360 Spatial" },
      { specName: "Noise Cancellation", valueBool: false },
      { specName: "Battery Life (hrs)", valueNumber: 38 },
      { specName: "Weight (g)", valueNumber: 338 },
    ],
  },

  // ── NETWORKING ──────────────────────────────────────────────────────────────
  {
    id: "net-01", sku: "NET-TPLINK-AXE75",
    name: "TP-Link Archer AXE75 Wi-Fi 6E Tri-Band Router",
    description: "Tri-band Wi-Fi 6E router with 6GHz band support for up to 6600Mbps total throughput, 4x Gigabit LAN, MU-MIMO, and OFDMA for low-latency gaming.",
    subCategoryName: "Wi-Fi Router", brandName: "TP-Link", price: 12000, image: "https://placeholder.tplink.com/axe75.jpg", stock: 12,
    specs: [
      { specName: "WiFi Standard", valueString: "WiFi 6E", optionValue: "WiFi 6E" },
      { specName: "Max Speed (Mbps)", valueNumber: 6600 },
      { specName: "Bands", valueString: "Tri-band", optionValue: "Tri-band" },
      { specName: "LAN Ports", valueNumber: 4 },
      { specName: "WAN Port Speed", valueString: "1GbE" },
      { specName: "USB Port", valueBool: true },
      { specName: "MU-MIMO", valueBool: true },
      { specName: "OFDMA", valueBool: true },
      { specName: "Antennas", valueNumber: 4 },
    ],
  },
  {
    id: "net-02", sku: "NET-DLINK-8P-GIG",
    name: "D-Link 8-Port Gigabit Unmanaged Switch",
    description: "Compact plug-and-play 8-port Gigabit Ethernet desktop switch for home and small office wired networking, fanless silent operation.",
    subCategoryName: "Network Switch", brandName: "D-Link", price: 1500, image: "https://placeholder.dlink.com/8port.jpg", stock: 50,
    specs: [
      { specName: "Ports", valueString: "8-port", optionValue: "8-port" },
      { specName: "Port Speed", valueString: "1GbE", optionValue: "1GbE" },
      { specName: "Managed", valueBool: false },
      { specName: "PoE", valueBool: false },
      { specName: "SFP Ports", valueNumber: 0 },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 5. CATEGORY HIERARCHY (nav tree)
// ─────────────────────────────────────────────────────────────────────────────

interface HierarchyNode {
  label: string;
  categoryName?: string;
  query?: string;
  brand?: string;
  children?: HierarchyNode[];
}

const HIERARCHY_TREE: HierarchyNode[] = [
  {
    label: "Processor", categoryName: "Processor",
    children: [
      { label: "Intel Processor", brand: "Intel" },
      { label: "AMD Processor", brand: "AMD" },
      { label: "Desktop CPU", query: "Desktop" },
      { label: "HEDT / Workstation CPU", query: "Threadripper" },
      { label: "Entry-level CPU", query: "Budget" },
      { label: "Mid-Range CPU", query: "Mid" },
      { label: "High-end CPU", query: "High" },
    ],
  },
  {
    label: "Motherboard", categoryName: "Motherboard",
    children: [
      {
        label: "AMD Chipset",
        children: [
          { label: "X870E / X870", query: "X870" },
          { label: "X670E / X670", query: "X670" },
          { label: "B650", query: "B650" },
          { label: "B550", query: "B550" },
          { label: "B450", query: "B450" },
          { label: "A620", query: "A620" },
        ],
      },
      {
        label: "Intel Chipset",
        children: [
          { label: "Z890", query: "Z890" },
          { label: "Z790", query: "Z790" },
          { label: "B760", query: "B760" },
          { label: "H610", query: "H610" },
          { label: "Z690", query: "Z690" },
        ],
      },
      { label: "ATX", query: "ATX" },
      { label: "Micro-ATX", query: "Micro-ATX" },
      { label: "Mini-ITX", query: "Mini-ITX" },
    ],
  },
  {
    label: "Graphics Card", categoryName: "Graphics Card",
    children: [
      {
        label: "NVIDIA GeForce",
        children: [
          { label: "RTX 50 Series", query: "RTX 50" },
          { label: "RTX 40 Series", query: "RTX 40" },
          { label: "RTX 30 Series", query: "RTX 30" },
        ],
      },
      {
        label: "AMD Radeon",
        children: [
          { label: "RX 9000 Series", query: "RX 9" },
          { label: "RX 7000 Series", query: "RX 7" },
          { label: "RX 6000 Series", query: "RX 6" },
        ],
      },
      { label: "Intel Arc", query: "Arc" },
    ],
  },
  {
    label: "RAM", categoryName: "RAM",
    children: [
      { label: "DDR5 RAM", query: "DDR5" },
      { label: "DDR4 RAM", query: "DDR4" },
      { label: "Desktop RAM", query: "Desktop" },
      { label: "Dual Channel Kit", query: "2x" },
      { label: "32GB Kit", query: "32GB" },
      { label: "64GB Kit", query: "64GB" },
    ],
  },
  {
    label: "Storage", categoryName: "Storage",
    children: [
      {
        label: "NVMe SSD",
        children: [
          { label: "PCIe Gen 5", query: "Gen5" },
          { label: "PCIe Gen 4", query: "Gen4" },
          { label: "PCIe Gen 3", query: "Gen3" },
        ],
      },
      { label: "SATA SSD", query: "SATA" },
      {
        label: "HDD",
        children: [
          { label: "Internal HDD", query: "Internal" },
          { label: "External HDD", query: "External" },
        ],
      },
    ],
  },
  {
    label: "CPU Cooler", categoryName: "Cooler",
    children: [
      { label: "AIO Liquid Cooler", query: "AIO" },
      { label: "Air Cooler", query: "Air" },
      { label: "360mm AIO", query: "360mm" },
      { label: "280mm AIO", query: "280mm" },
      { label: "240mm AIO", query: "240mm" },
      { label: "Case Fans", query: "Case Fan" },
      { label: "Thermal Paste", query: "Thermal Paste" },
    ],
  },
  {
    label: "Power Supply (SMPS)", categoryName: "Power Supply",
    children: [
      { label: "Fully Modular", query: "Fully Modular" },
      { label: "Semi Modular", query: "Semi Modular" },
      { label: "Non Modular", query: "Non Modular" },
      { label: "Titanium / Platinum", query: "Titanium" },
      { label: "Gold", query: "Gold" },
      { label: "Bronze", query: "Bronze" },
      { label: "650W", query: "650W" },
      { label: "750W", query: "750W" },
      { label: "850W", query: "850W" },
      { label: "1000W+", query: "1000W" },
    ],
  },
  {
    label: "Cabinet", categoryName: "Cabinet",
    children: [
      { label: "Mid Tower", query: "Mid Tower" },
      { label: "Full Tower", query: "Full Tower" },
      { label: "Mini-ITX Case", query: "Mini-ITX" },
      { label: "ARGB Cabinet", query: "ARGB" },
      { label: "Tempered Glass", query: "Tempered Glass" },
      { label: "Airflow Case", query: "Airflow" },
    ],
  },
  {
    label: "Monitor", categoryName: "Monitor",
    children: [
      { label: "24 inch", query: "24" },
      { label: "27 inch", query: "27" },
      { label: "32 inch", query: "32" },
      { label: "4K Monitor", query: "4K" },
      { label: "2K / 1440p", query: "1440p" },
      { label: "Gaming Monitor", query: "Gaming" },
      { label: "Curved Monitor", query: "Curved" },
      { label: "144Hz+", query: "144Hz" },
      { label: "240Hz+", query: "240Hz" },
      { label: "Professional Monitor", query: "Professional" },
      { label: "Ultra-Wide", query: "Ultrawide" },
    ],
  },
  {
    label: "Peripherals", categoryName: "Peripheral",
    children: [
      {
        label: "Keyboard",
        children: [
          { label: "Mechanical Keyboard", query: "Mechanical" },
          { label: "Wireless Keyboard", query: "Wireless" },
          { label: "Wired Keyboard", query: "Wired" },
          { label: "60% / 65%", query: "60%" },
          { label: "TKL", query: "TKL" },
          { label: "Full-size", query: "Full-size" },
        ],
      },
      {
        label: "Mouse",
        children: [
          { label: "Wireless Mouse", query: "Wireless" },
          { label: "Wired Mouse", query: "Wired" },
          { label: "Gaming Mouse", query: "Gaming" },
          { label: "Ergonomic Mouse", query: "Ergonomic" },
        ],
      },
      { label: "Headset", query: "Headset" },
      { label: "Mouse Pad", query: "Mouse Pad" },
      { label: "Webcam", query: "Webcam" },
      { label: "Speakers", query: "Speaker" },
    ],
  },
  {
    label: "Networking", categoryName: "Networking",
    children: [
      { label: "WiFi 6E Router", query: "WiFi 6E" },
      { label: "WiFi 7 Router", query: "WiFi 7" },
      { label: "Gigabit Switch", query: "Switch" },
      { label: "Network Adapter", query: "Adapter" },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 6. COMPATIBILITY RULES
// ─────────────────────────────────────────────────────────────────────────────

interface CompatRuleSeed {
  name: string;
  sourceSubCategory: string;
  targetSubCategory: string;
  sourceSpec: string;
  targetSpec: string;
  operator: CompatibilityOperator;
  message: string;
  severity: CompatibilitySeverity;
}

const COMPAT_RULES: CompatRuleSeed[] = [
  // CPU socket ↔ Motherboard socket
  {
    name: "CPU-MB Socket Match (Desktop)",
    sourceSubCategory: "Desktop CPU", targetSubCategory: "ATX Motherboard",
    sourceSpec: "Socket", targetSpec: "Socket",
    operator: CompatibilityOperator.EQUAL,
    message: "CPU socket must match motherboard socket (e.g. AM5 CPU with AM5 motherboard).",
    severity: CompatibilitySeverity.ERROR,
  },
  {
    name: "CPU-MB Socket Match (Desktop → mATX)",
    sourceSubCategory: "Desktop CPU", targetSubCategory: "Micro-ATX Motherboard",
    sourceSpec: "Socket", targetSpec: "Socket",
    operator: CompatibilityOperator.EQUAL,
    message: "CPU socket must match motherboard socket.",
    severity: CompatibilitySeverity.ERROR,
  },
  {
    name: "CPU-MB Socket Match (HEDT)",
    sourceSubCategory: "HEDT CPU", targetSubCategory: "ATX Motherboard",
    sourceSpec: "Socket", targetSpec: "Socket",
    operator: CompatibilityOperator.EQUAL,
    message: "HEDT CPU socket must match motherboard socket.",
    severity: CompatibilitySeverity.ERROR,
  },
  // CPU Memory Type ↔ Motherboard Memory Type
  {
    name: "CPU-MB RAM Type Match (Desktop→ATX)",
    sourceSubCategory: "Desktop CPU", targetSubCategory: "ATX Motherboard",
    sourceSpec: "Memory Type", targetSpec: "Memory Type",
    operator: CompatibilityOperator.EQUAL,
    message: "CPU supports a different memory type than the motherboard (DDR4 vs DDR5 mismatch).",
    severity: CompatibilitySeverity.ERROR,
  },
  // RAM Memory Type ↔ Motherboard Memory Type
  {
    name: "RAM-MB DDR Type Match (DDR5→ATX)",
    sourceSubCategory: "DDR5 RAM", targetSubCategory: "ATX Motherboard",
    sourceSpec: "Memory Type", targetSpec: "Memory Type",
    operator: CompatibilityOperator.EQUAL,
    message: "RAM memory type must match the motherboard's supported memory type.",
    severity: CompatibilitySeverity.ERROR,
  },
  {
    name: "RAM-MB DDR Type Match (DDR4→ATX)",
    sourceSubCategory: "DDR4 RAM", targetSubCategory: "ATX Motherboard",
    sourceSpec: "Memory Type", targetSpec: "Memory Type",
    operator: CompatibilityOperator.EQUAL,
    message: "RAM memory type must match the motherboard's supported memory type.",
    severity: CompatibilitySeverity.ERROR,
  },
  {
    name: "RAM-MB DDR Type Match (DDR4→mATX)",
    sourceSubCategory: "DDR4 RAM", targetSubCategory: "Micro-ATX Motherboard",
    sourceSpec: "Memory Type", targetSpec: "Memory Type",
    operator: CompatibilityOperator.EQUAL,
    message: "RAM memory type must match the motherboard's supported memory type.",
    severity: CompatibilitySeverity.ERROR,
  },
  // GPU TDP warning for PSU wattage
  {
    name: "GPU TDP vs PSU Wattage Headroom",
    sourceSubCategory: "NVIDIA GPU", targetSubCategory: "ATX PSU",
    sourceSpec: "TDP (W)", targetSpec: "Wattage",
    operator: CompatibilityOperator.LESS_THAN,
    message: "PSU wattage may be insufficient for this GPU. Ensure at least 150W headroom above GPU TDP.",
    severity: CompatibilitySeverity.WARNING,
  },
  {
    name: "AMD GPU TDP vs PSU Wattage Headroom",
    sourceSubCategory: "AMD GPU", targetSubCategory: "ATX PSU",
    sourceSpec: "TDP (W)", targetSpec: "Wattage",
    operator: CompatibilityOperator.LESS_THAN,
    message: "PSU wattage may be insufficient for this GPU. Ensure at least 150W headroom above GPU TDP.",
    severity: CompatibilitySeverity.WARNING,
  },
  // Case GPU length clearance warning
  {
    name: "GPU Length vs Case Clearance",
    sourceSubCategory: "NVIDIA GPU", targetSubCategory: "Mid Tower Case",
    sourceSpec: "Card Length (mm)", targetSpec: "Max GPU Length (mm)",
    operator: CompatibilityOperator.LESS_OR_EQUAL,
    message: "GPU may be too long to fit in this case. Check maximum GPU length clearance.",
    severity: CompatibilitySeverity.WARNING,
  },
  {
    name: "AMD GPU Length vs Case Clearance",
    sourceSubCategory: "AMD GPU", targetSubCategory: "Mid Tower Case",
    sourceSpec: "Card Length (mm)", targetSpec: "Max GPU Length (mm)",
    operator: CompatibilityOperator.LESS_OR_EQUAL,
    message: "AMD GPU may be too long for this case.",
    severity: CompatibilitySeverity.WARNING,
  },
  // Air Cooler height vs case clearance
  {
    name: "Air Cooler Height vs Case Clearance",
    sourceSubCategory: "Air Cooler", targetSubCategory: "Mid Tower Case",
    sourceSpec: "Height (mm)", targetSpec: "Max CPU Cooler Height (mm)",
    operator: CompatibilityOperator.LESS_OR_EQUAL,
    message: "CPU air cooler may be too tall for this case. Check maximum cooler height.",
    severity: CompatibilitySeverity.WARNING,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 7. SAMPLE DATA — Customers, Orders, Invoices
// ─────────────────────────────────────────────────────────────────────────────

const CUSTOMERS_DATA = [
  {
    id: "cust-01", name: "Arjun Kapoor", email: "arjun.kapoor@gmail.com",
    phone: "+91-9876543210", company: null,
    addressLine1: "14A, Sector 15", city: "Noida", state: "Uttar Pradesh",
    postalCode: "201301", country: "India",
  },
  {
    id: "cust-02", name: "Meera Nair", email: "meera.nair@outlook.com",
    phone: "+91-9845123456", company: null,
    addressLine1: "22, Kaloor Junction", city: "Kochi", state: "Kerala",
    postalCode: "682017", country: "India",
  },
  {
    id: "cust-03", name: "Infosys Procurement", email: "procurement@infosys.com",
    phone: "+91-8022741234", company: "Infosys Ltd",
    addressLine1: "44, Electronics City Phase 1", city: "Bengaluru", state: "Karnataka",
    postalCode: "560100", country: "India",
  },
  {
    id: "cust-04", name: "Vikram Desai", email: "vikram.desai@company.in",
    phone: "+91-9920123456", company: "DesignLab Studio",
    addressLine1: "A-403, Powai Heights", city: "Mumbai", state: "Maharashtra",
    postalCode: "400076", country: "India",
  },
  {
    id: "cust-05", name: "Priya Sharma", email: "priya.sharma@techcorp.io",
    phone: "+91-9818012345", company: "TechCorp India",
    addressLine1: "F-12, DLF City Phase 2", city: "Gurugram", state: "Haryana",
    postalCode: "122002", country: "India",
  },
];

interface OrderSeed {
  id: string;
  customerName: string;
  email: string;
  phone?: string;
  date: Date;
  status: OrderStatus;
  subtotal: number;
  gstAmount: number;
  total: number;
  shippingStreet: string;
  shippingCity: string;
  shippingState: string;
  shippingZip: string;
  shippingCountry: string;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  customerId?: string;
  items: { productId: string; quantity: number }[];
  logs: { status: OrderStatus; timestamp: Date; note?: string }[];
}

const ORDERS_DATA: OrderSeed[] = [
  {
    id: "ORD-2501",
    customerName: "Arjun Kapoor", email: "arjun.kapoor@gmail.com",
    phone: "+91-9876543210",
    date: new Date("2025-01-14T08:22:00Z"),
    status: OrderStatus.PENDING,
    subtotal: 78000, gstAmount: 14040, total: 92040,
    shippingStreet: "14A, Sector 15", shippingCity: "Noida", shippingState: "Uttar Pradesh",
    shippingZip: "201301", shippingCountry: "India",
    paymentMethod: "Net Banking", paymentStatus: PaymentStatus.PENDING,
    customerId: "cust-01",
    items: [
      { productId: "cpu-01", quantity: 1 },
      { productId: "mobo-01", quantity: 1 },
      { productId: "ram-01", quantity: 1 },
    ],
    logs: [
      { status: OrderStatus.PENDING, timestamp: new Date("2025-01-14T08:22:00Z"), note: "Order placed. Awaiting Net Banking payment." },
    ],
  },
  {
    id: "ORD-2502",
    customerName: "Meera Nair", email: "meera.nair@outlook.com",
    phone: "+91-9845123456",
    date: new Date("2025-01-13T14:05:00Z"),
    status: OrderStatus.PAID,
    subtotal: 175000, gstAmount: 31500, total: 206500,
    shippingStreet: "22, Kaloor Junction", shippingCity: "Kochi", shippingState: "Kerala",
    shippingZip: "682017", shippingCountry: "India",
    paymentMethod: "Credit Card", paymentStatus: PaymentStatus.COMPLETED,
    customerId: "cust-02",
    items: [
      { productId: "gpu-01", quantity: 1 },
      { productId: "psu-03", quantity: 1 },
    ],
    logs: [
      { status: OrderStatus.PENDING, timestamp: new Date("2025-01-13T14:05:00Z"), note: "Order placed via website." },
      { status: OrderStatus.PAID, timestamp: new Date("2025-01-13T14:07:30Z"), note: "Credit card payment authorised. TXN-CC-20250113-5821." },
    ],
  },
  {
    id: "ORD-2503",
    customerName: "Vikram Desai", email: "vikram.desai@company.in",
    phone: "+91-9920123456",
    date: new Date("2025-01-12T11:30:00Z"),
    status: OrderStatus.PROCESSING,
    subtotal: 120800, gstAmount: 21744, total: 142544,
    shippingStreet: "A-403, Powai Heights", shippingCity: "Mumbai", shippingState: "Maharashtra",
    shippingZip: "400076", shippingCountry: "India",
    paymentMethod: "UPI", paymentStatus: PaymentStatus.COMPLETED,
    customerId: "cust-04",
    items: [
      { productId: "cpu-02", quantity: 1 },
      { productId: "mobo-02", quantity: 1 },
      { productId: "gpu-02", quantity: 1 },
      { productId: "ssd-01", quantity: 2 },
      { productId: "cool-01", quantity: 1 },
    ],
    logs: [
      { status: OrderStatus.PENDING, timestamp: new Date("2025-01-12T11:30:00Z") },
      { status: OrderStatus.PAID, timestamp: new Date("2025-01-12T11:31:00Z"), note: "UPI payment confirmed. Ref: UPI-20250112-VD-7391." },
      { status: OrderStatus.PROCESSING, timestamp: new Date("2025-01-12T14:00:00Z"), note: "Picked and packing in progress." },
    ],
  },
  {
    id: "ORD-2504",
    customerName: "Priya Sharma", email: "priya.sharma@techcorp.io",
    date: new Date("2025-01-10T09:15:00Z"),
    status: OrderStatus.SHIPPED,
    subtotal: 65000, gstAmount: 11700, total: 76700,
    shippingStreet: "F-12, DLF City Phase 2", shippingCity: "Gurugram", shippingState: "Haryana",
    shippingZip: "122002", shippingCountry: "India",
    paymentMethod: "Credit Card", paymentStatus: PaymentStatus.COMPLETED,
    customerId: "cust-05",
    items: [
      { productId: "cpu-01", quantity: 1 },
      { productId: "mobo-02", quantity: 1 },
      { productId: "ram-01", quantity: 1 },
      { productId: "ssd-01", quantity: 1 },
    ],
    logs: [
      { status: OrderStatus.PENDING, timestamp: new Date("2025-01-10T09:15:00Z") },
      { status: OrderStatus.PAID, timestamp: new Date("2025-01-10T09:16:00Z"), note: "Card payment confirmed." },
      { status: OrderStatus.PROCESSING, timestamp: new Date("2025-01-10T11:00:00Z"), note: "Items picked and packed." },
      { status: OrderStatus.SHIPPED, timestamp: new Date("2025-01-11T10:00:00Z"), note: "Shipped via BlueDart. AWB: BD-2025-44192." },
    ],
  },
  {
    id: "ORD-2505",
    customerName: "Infosys Procurement", email: "procurement@infosys.com",
    date: new Date("2025-01-13T10:00:00Z"),
    status: OrderStatus.PROCESSING,
    subtotal: 365000, gstAmount: 65700, total: 430700,
    shippingStreet: "44, Electronics City Phase 1", shippingCity: "Bengaluru", shippingState: "Karnataka",
    shippingZip: "560100", shippingCountry: "India",
    paymentMethod: "Net Banking", paymentStatus: PaymentStatus.COMPLETED,
    customerId: "cust-03",
    items: [
      { productId: "cpu-04", quantity: 10 },
      { productId: "ram-02", quantity: 10 },
      { productId: "ssd-02", quantity: 10 },
    ],
    logs: [
      { status: OrderStatus.PENDING, timestamp: new Date("2025-01-13T10:00:00Z"), note: "Bulk B2B order. PO: PO-INFY-2025-0041." },
      { status: OrderStatus.PAID, timestamp: new Date("2025-01-13T14:00:00Z"), note: "NEFT received. Ref: NEFT-20250113-INFOSYS-0099." },
      { status: OrderStatus.PROCESSING, timestamp: new Date("2025-01-14T09:00:00Z"), note: "Bulk picking started. Team B." },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 8. BILLING PROFILE
// ─────────────────────────────────────────────────────────────────────────────

const BILLING_PROFILE = {
  companyName: "PCStore India Pvt. Ltd.",
  legalName: "PCStore India Private Limited",
  email: "billing@pcstore.in",
  phone: "+91-80-12345678",
  addressLine1: "42, Residency Road",
  addressLine2: "Ashok Nagar",
  city: "Bengaluru",
  state: "Karnataka",
  postalCode: "560025",
  country: "India",
  gstin: "29AABCP1234F1ZS",
  logoUrl: "https://pcstore.in/logo.png",
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SEED FUNCTION
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Starting seed...");

  // ── 1. Admin User ────────────────────────────────────────────────────────
  console.log("  → Seeding admin user...");
  await prisma.user.upsert({
    where: { email: "admin@pcstore.in" },
    update: {},
    create: {
      email: "admin@pcstore.in",
      name: "PCStore Admin",
      password: "$2b$10$examplehash", // bcrypt hash placeholder
      role: "ADMIN",
    },
  });

  // ── 2. Brands ────────────────────────────────────────────────────────────
  console.log("  → Seeding brands...");
  const brandMap = new Map<string, string>(); // name → id
  for (const name of BRANDS) {
    const brand = await prisma.brand.upsert({
      where: { name },
      update: {},
      create: { name, slug: slug(name) },
    });
    brandMap.set(name, brand.id);
  }
  // Extra brand aliases used in PRODUCTS
  for (const [alias, canonical] of [
    ["Sapphire", "Sapphire"],
    ["XFX", "XFX"],
    ["PowerColor", "PowerColor"],
    ["Palit", "Palit"],
    ["be quiet!", "be quiet!"],
    ["Fractal Design", "Fractal Design"],
    ["Phanteks", "Phanteks"],
    ["Thermaltake", "Thermaltake"],
    ["Seasonic", "Seasonic"],
    ["Razer", "Razer"],
    ["SteelSeries", "SteelSeries"],
    ["D-Link", "D-Link"],
  ] as const) {
    if (!brandMap.has(alias)) {
      const b = await prisma.brand.upsert({
        where: { name: alias },
        update: {},
        create: { name: alias, slug: slug(alias) },
      });
      brandMap.set(alias, b.id);
    }
  }

  // ── 3. Part Slots ─────────────────────────────────────────────────────────
  console.log("  → Seeding part slots...");
  const partSlotMap = new Map<string, string>(); // name → id
  for (const ps of PART_SLOTS) {
    const existing = await prisma.partSlot.findUnique({ where: { name: ps.name } });
    let slot = existing;
    if (!slot) {
      slot = await prisma.partSlot.create({
        data: { name: ps.name, minItems: ps.minItems, maxItems: ps.maxItems },
      });
    }
    partSlotMap.set(ps.name, slot.id);

    // SlotConstraint
    const scExists = await prisma.slotConstraint.findUnique({ where: { slotId: slot.id } });
    if (!scExists) {
      await prisma.slotConstraint.create({
        data: { slotId: slot.id, minItems: ps.minItems, maxItems: ps.maxItems },
      });
    }
  }

  // ── 4. Categories + SubCategories + SpecDefinitions ──────────────────────
  console.log("  → Seeding categories, subcategories, and spec definitions...");
  const categoryMap = new Map<string, string>();      // categoryName → id
  const subCategoryMap = new Map<string, string>();   // subCategoryName → id
  const specDefMap = new Map<string, string>();        // "subCatId::specName" → specDef.id
  const specOptionMap = new Map<string, string>();     // "specDefId::value" → option.id

  for (const cat of CATEGORY_TREE) {
    const dbCat = await prisma.category.upsert({
      where: { name: cat.name },
      update: { description: cat.description },
      create: { name: cat.name, description: cat.description },
    });
    categoryMap.set(cat.name, dbCat.id);

    for (const sub of cat.subCategories) {
      // SubCategory unique on [categoryId, name]
      let dbSub = await prisma.subCategory.findFirst({
        where: { categoryId: dbCat.id, name: sub.name },
      });
      if (!dbSub) {
        dbSub = await prisma.subCategory.create({
          data: { name: sub.name, description: sub.description, categoryId: dbCat.id },
        });
      }
      subCategoryMap.set(sub.name, dbSub.id);

      // SubCategorySlot link
      if (sub.slotName && partSlotMap.has(sub.slotName)) {
        const slotId = partSlotMap.get(sub.slotName)!;
        const scSlotExists = await prisma.subCategorySlot.findUnique({
          where: { subCategoryId_slotId: { subCategoryId: dbSub.id, slotId } },
        });
        if (!scSlotExists) {
          await prisma.subCategorySlot.create({
            data: { subCategoryId: dbSub.id, slotId },
          });
        }
      }

      // SpecDefinitions
      for (const sd of sub.specDefs) {
        let dbSpec = await prisma.specDefinition.findUnique({
          where: { subCategoryId_name: { subCategoryId: dbSub.id, name: sd.name } },
        });
        if (!dbSpec) {
          dbSpec = await prisma.specDefinition.create({
            data: {
              subCategoryId: dbSub.id,
              name: sd.name,
              valueType: sd.valueType,
              isFilterable: sd.isFilterable ?? true,
              isRange: sd.isRange ?? false,
              isMulti: sd.isMulti ?? false,
              filterGroup: sd.filterGroup ?? null,
            },
          });
        }
        specDefMap.set(`${dbSub.id}::${sd.name}`, dbSpec.id);

        // SpecOptions (for STRING type)
        if (sd.options && sd.options.length > 0) {
          for (let i = 0; i < sd.options.length; i++) {
            const optVal = sd.options[i];
            const optKey = `${dbSpec.id}::${optVal}`;
            if (!specOptionMap.has(optKey)) {
              const existing = await prisma.specOption.findFirst({
                where: { specId: dbSpec.id, value: optVal },
              });
              let opt = existing;
              if (!opt) {
                opt = await prisma.specOption.create({
                  data: { specId: dbSpec.id, value: optVal, label: optVal, order: i },
                });
              }
              specOptionMap.set(optKey, opt.id);
            }
          }
        }
      }
    }
  }

  // ── 5. Products + Variants + VariantSpecs + Inventory ─────────────────────
  console.log("  → Seeding products, variants, specs, and inventory...");
  const variantMap = new Map<string, string>(); // productId → variantId

  for (const p of PRODUCTS) {
    const subCatId = subCategoryMap.get(p.subCategoryName);
    if (!subCatId) {
      console.warn(`    ⚠ SubCategory not found: ${p.subCategoryName} for ${p.name}`);
      continue;
    }
    const brandId = brandMap.get(p.brandName) ?? null;

    // Product
    let product = await prisma.product.findUnique({ where: { id: p.id }, include: { variants: true } });
    if (!product) {
      product = await prisma.product.create({
        data: {
          id: p.id,
          slug: p.id,
          name: p.name,
          description: p.description,
          status: ProductStatus.ACTIVE,
          subCategoryId: subCatId,
          brandId,
          media: { create: [{ url: p.image, altText: p.name, sortOrder: 0 }] },
          variants: {
            create: [{
              sku: p.sku,
              price: p.price,
              compareAtPrice: p.compareAtPrice ?? null,
              status: VariantStatus.IN_STOCK,
            }],
          },
        },
        include: { variants: true },
      });
    }

    const variant = product.variants[0];
    variantMap.set(p.id, variant.id);

    // VariantSpecs
    for (const sv of p.specs) {
      const specKey = `${subCatId}::${sv.specName}`;
      const specDefId = specDefMap.get(specKey);
      if (!specDefId) {
        console.warn(`    ⚠ SpecDef not found: ${sv.specName} in ${p.subCategoryName}`);
        continue;
      }

      const existing = await prisma.variantSpec.findUnique({
        where: { variantId_specId: { variantId: variant.id, specId: specDefId } },
      });
      if (existing) continue;

      let optionId: string | null = null;
      let valueString: string | null = null;
      let valueNumber: number | null = null;
      let valueBool: boolean | null = null;

      if ("valueString" in sv) {
        valueString = sv.valueString;
        if (sv.optionValue) {
          const optKey = `${specDefId}::${sv.optionValue}`;
          optionId = specOptionMap.get(optKey) ?? null;
        }
      } else if ("valueNumber" in sv) {
        valueNumber = sv.valueNumber;
      } else if ("valueBool" in sv) {
        valueBool = sv.valueBool;
      }

      await prisma.variantSpec.create({
        data: {
          variantId: variant.id,
          specId: specDefId,
          optionId,
          valueString,
          valueNumber,
          valueBool,
        },
      });
    }

    // Inventory
    const existingInv = await prisma.inventoryItem.findFirst({ where: { variantId: variant.id } });
    if (!existingInv) {
      await prisma.inventoryItem.create({
        data: {
          variantId: variant.id,
          trackingType: InventoryTrackingType.BULK,
          quantityOnHand: p.stock,
          quantityReserved: 0,
          status: p.stock > 0 ? InventoryStatus.IN_STOCK : InventoryStatus.IN_TRANSIT,
          costPrice: Math.round(p.price * 0.65),
          receivedAt: new Date(),
          notes: "Initial seed stock",
        },
      });
    }
  }

  // ── 6. Compatibility Scopes + Rules ───────────────────────────────────────
  console.log("  → Seeding compatibility scopes and rules...");
  for (const rule of COMPAT_RULES) {
    const sourceSCId = subCategoryMap.get(rule.sourceSubCategory);
    const targetSCId = subCategoryMap.get(rule.targetSubCategory);
    if (!sourceSCId || !targetSCId) {
      console.warn(`    ⚠ SubCategory not found for compat rule: ${rule.name}`);
      continue;
    }

    let scope = await prisma.compatibilityScope.findUnique({
      where: { sourceSubCategoryId_targetSubCategoryId: { sourceSubCategoryId: sourceSCId, targetSubCategoryId: targetSCId } },
    });
    if (!scope) {
      scope = await prisma.compatibilityScope.create({
        data: { sourceSubCategoryId: sourceSCId, targetSubCategoryId: targetSCId },
      });
    }

    const sourceSpecId = specDefMap.get(`${sourceSCId}::${rule.sourceSpec}`);
    const targetSpecId = specDefMap.get(`${targetSCId}::${rule.targetSpec}`);
    if (!sourceSpecId || !targetSpecId) {
      console.warn(`    ⚠ Spec not found for compat rule: ${rule.name}`);
      continue;
    }

    const existingRule = await prisma.compatibilityRule.findFirst({
      where: { name: rule.name, scopeId: scope.id },
    });
    if (!existingRule) {
      await prisma.compatibilityRule.create({
        data: {
          name: rule.name,
          sourceSpecId,
          targetSpecId,
          operator: rule.operator,
          message: rule.message,
          severity: rule.severity,
          scopeId: scope.id,
        },
      });
    }
  }

  // ── 7. Category Hierarchy ─────────────────────────────────────────────────
  console.log("  → Seeding category hierarchy...");

  async function seedNode(
    node: HierarchyNode,
    parentId: string | null,
    order: number,
  ): Promise<void> {
    const categoryId = node.categoryName ? categoryMap.get(node.categoryName) ?? null : null;

    const existing = await prisma.categoryHierarchy.findFirst({
      where: { label: node.label, parentId: parentId ?? undefined },
    });

    let nodeId: string;
    if (existing) {
      nodeId = existing.id;
    } else {
      const created = await prisma.categoryHierarchy.create({
        data: {
          label: node.label,
          categoryId,
          query: node.query ?? null,
          brand: node.brand ?? null,
          parentId,
          sortOrder: order,
        },
      });
      nodeId = created.id;
    }

    if (node.children) {
      for (let i = 0; i < node.children.length; i++) {
        await seedNode(node.children[i], nodeId, i);
      }
    }
  }

  for (let i = 0; i < HIERARCHY_TREE.length; i++) {
    await seedNode(HIERARCHY_TREE[i], null, i);
  }

  // ── 8. Customers ──────────────────────────────────────────────────────────
  console.log("  → Seeding customers...");
  for (const c of CUSTOMERS_DATA) {
    await prisma.customer.upsert({
      where: { id: c.id },
      update: { name: c.name, phone: c.phone ?? null },
      create: c,
    });
  }

  // ── 9. Orders ─────────────────────────────────────────────────────────────
  console.log("  → Seeding orders...");
  for (const o of ORDERS_DATA) {
    const order = await prisma.order.upsert({
      where: { id: o.id },
      update: { status: o.status },
      create: {
        id: o.id,
        customerName: o.customerName,
        email: o.email,
        phone: o.phone ?? null,
        date: o.date,
        status: o.status,
        subtotal: o.subtotal,
        gstAmount: o.gstAmount,
        taxAmount: o.gstAmount,
        total: o.total,
        shippingStreet: o.shippingStreet,
        shippingCity: o.shippingCity,
        shippingState: o.shippingState,
        shippingZip: o.shippingZip,
        shippingCountry: o.shippingCountry,
        paymentMethod: o.paymentMethod,
        paymentStatus: o.paymentStatus,
        customerId: o.customerId ?? null,
      },
    });

    // Order items
    const existingItems = await prisma.orderItem.count({ where: { orderId: order.id } });
    if (existingItems === 0) {
      for (const item of o.items) {
        const prod = PRODUCTS.find(p => p.id === item.productId);
        const variantId = variantMap.get(item.productId);
        if (!prod || !variantId) continue;

        await prisma.orderItem.create({
          data: {
            orderId: order.id,
            variantId,
            name: prod.name,
            category: prod.subCategoryName,
            price: prod.price,
            quantity: item.quantity,
            image: prod.image,
            sku: prod.sku,
          },
        });
      }
    }

    // Order logs
    const existingLogs = await prisma.orderLog.count({ where: { orderId: order.id } });
    if (existingLogs === 0) {
      for (const log of o.logs) {
        await prisma.orderLog.create({
          data: {
            orderId: order.id,
            status: log.status,
            timestamp: log.timestamp,
            note: log.note ?? null,
          },
        });
      }
    }
  }

  // ── 10. InvoiceSequence ───────────────────────────────────────────────────
  console.log("  → Seeding invoice sequence...");
  await prisma.invoiceSequence.upsert({
    where: { id: "invoice_seq" },
    update: {},
    create: { id: "invoice_seq", currentValue: 3 },
  });

  // ── 11. Invoices ──────────────────────────────────────────────────────────
  console.log("  → Seeding invoices...");
  const INVOICES = [
    {
      id: "inv-001",
      invoiceNumber: "INV-2025-0001",
      status: InvoiceStatus.PAID,
      customerId: "cust-01",
      orderId: "ORD-2501",
      subtotal: 78000,
      taxTotal: 14040,
      discountPct: 0,
      shipping: 0,
      total: 92040,
      amountPaid: 92040,
      amountDue: 0,
      notes: "Gaming build components — AMD + ASUS X670E.",
      paidAt: new Date("2025-01-14T09:00:00Z"),
      dueDate: new Date("2025-01-28T00:00:00Z"),
      createdAt: new Date("2025-01-14T08:30:00Z"),
      lineItems: [
        { name: "AMD Ryzen 7 7800X3D", quantity: 1, unitPrice: 36000, taxRatePct: 18, hsnCode: "8471" },
        { name: "ASUS ROG Strix X670E-E Gaming WiFi", quantity: 1, unitPrice: 42000, taxRatePct: 18, hsnCode: "8473" },
      ],
      audit: [
        { type: "created", actor: "Admin", message: "Invoice created for order ORD-2501." },
        { type: "paid", actor: "System", message: "Payment received via Net Banking." },
      ],
    },
    {
      id: "inv-002",
      invoiceNumber: "INV-2025-0002",
      status: InvoiceStatus.PENDING,
      customerId: "cust-02",
      orderId: "ORD-2502",
      subtotal: 175000,
      taxTotal: 31500,
      discountPct: 0,
      shipping: 500,
      total: 207000,
      amountPaid: 0,
      amountDue: 207000,
      notes: "NVIDIA RTX 4090 + MSI 1000W PSU.",
      paidAt: null,
      dueDate: new Date("2025-01-27T00:00:00Z"),
      createdAt: new Date("2025-01-13T14:10:00Z"),
      lineItems: [
        { name: "ASUS ROG Strix RTX 4090 24GB OC", quantity: 1, unitPrice: 175000, taxRatePct: 18, hsnCode: "8471" },
        { name: "MSI MPG A1000G PCIE5 1000W PSU", quantity: 1, unitPrice: 14500, taxRatePct: 18, hsnCode: "8504" },
      ],
      audit: [
        { type: "created", actor: "Admin", message: "Invoice created for ORD-2502." },
        { type: "sent", actor: "Admin", message: "Invoice emailed to customer." },
      ],
    },
    {
      id: "inv-003",
      invoiceNumber: "INV-2025-0003",
      status: InvoiceStatus.OVERDUE,
      customerId: "cust-03",
      orderId: "ORD-2505",
      subtotal: 365000,
      taxTotal: 65700,
      discountPct: 5,
      shipping: 2000,
      total: 428950,
      amountPaid: 0,
      amountDue: 428950,
      notes: "Bulk B2B order — Net-30 payment terms. Infosys PO: PO-INFY-2025-0041.",
      paidAt: null,
      dueDate: new Date("2025-01-13T00:00:00Z"),
      createdAt: new Date("2025-01-13T10:00:00Z"),
      lineItems: [
        { name: "Intel Core i5-13600K (x10)", quantity: 10, unitPrice: 28000, taxRatePct: 18, hsnCode: "8471" },
        { name: "Corsair Vengeance LPX 16GB DDR4 (x10)", quantity: 10, unitPrice: 4500, taxRatePct: 18, hsnCode: "8473" },
        { name: "Crucial P3 500GB NVMe (x10)", quantity: 10, unitPrice: 3000, taxRatePct: 18, hsnCode: "8471" },
      ],
      audit: [
        { type: "created", actor: "Admin", message: "Invoice created for bulk B2B order ORD-2505." },
        { type: "sent", actor: "Admin", message: "Invoice sent to procurement@infosys.com." },
        { type: "note", actor: "System", message: "Invoice overdue — payment not received by due date." },
      ],
    },
  ];

  for (const inv of INVOICES) {
    const existing = await prisma.invoice.findUnique({ where: { invoiceNumber: inv.invoiceNumber } });
    if (!existing) {
      await prisma.invoice.create({
        data: {
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          status: inv.status,
          customerId: inv.customerId,
          orderId: inv.orderId,
          subtotal: inv.subtotal,
          taxTotal: inv.taxTotal,
          discountPct: inv.discountPct,
          shipping: inv.shipping,
          total: inv.total,
          amountPaid: inv.amountPaid,
          amountDue: inv.amountDue,
          notes: inv.notes ?? null,
          paidAt: inv.paidAt ?? null,
          dueDate: inv.dueDate,
          createdAt: inv.createdAt,
          lineItems: {
            create: inv.lineItems.map(li => ({
              name: li.name,
              quantity: li.quantity,
              unitPrice: li.unitPrice,
              taxRatePct: li.taxRatePct,
              hsnCode: li.hsnCode,
            })),
          },
          audit: {
            create: inv.audit.map(a => ({
              type: a.type,
              actor: a.actor,
              message: a.message,
            })),
          },
        },
      });
    }
  }

  // ── 12. Build Guides ──────────────────────────────────────────────────────
  console.log("  → Seeding build guides...");
  const BUILD_GUIDES = [
    {
      id: "build-001",
      title: "Budget Gaming PC — AMD Ryzen 5 + RTX 4060",
      description: "Great 1080p gaming build under ₹90,000 with excellent price-to-performance ratio.",
      category: "Gaming",
      items: [
        { productId: "cpu-03", quantity: 1 },  // Ryzen 5 7600X
        { productId: "mobo-04", quantity: 1 },  // ASRock B650M
        { productId: "ram-01", quantity: 1 },   // G.Skill DDR5-6000
        { productId: "gpu-04", quantity: 1 },   // RTX 4060
        { productId: "ssd-01", quantity: 1 },   // Samsung 990 Pro 1TB
        { productId: "psu-01", quantity: 1 },   // Corsair RM850e
        { productId: "case-02", quantity: 1 },  // Corsair 4000D
        { productId: "cool-04", quantity: 1 },  // CM Hyper 212
      ],
    },
    {
      id: "build-002",
      title: "High-End Gaming Build — Ryzen 7 7800X3D + RTX 4080 Super",
      description: "Top-tier 1440p/4K gaming rig leveraging AMD 3D V-Cache and NVIDIA Ada Lovelace.",
      category: "Gaming",
      items: [
        { productId: "cpu-01", quantity: 1 },  // Ryzen 7 7800X3D
        { productId: "mobo-01", quantity: 1 },  // ASUS ROG X670E
        { productId: "ram-01", quantity: 2 },   // G.Skill DDR5-6000 x2
        { productId: "gpu-02", quantity: 1 },   // RTX 4080 Super
        { productId: "ssd-03", quantity: 1 },   // Samsung 990 Pro 2TB
        { productId: "psu-03", quantity: 1 },   // MSI MPG 1000W
        { productId: "case-01", quantity: 1 },  // Lian Li O11 EVO
        { productId: "cool-01", quantity: 1 },  // DeepCool LS720 AIO
      ],
    },
    {
      id: "build-003",
      title: "Content Creator Workstation — i9-14900K + RTX 4090",
      description: "Professional video editing and 3D rendering workstation for demanding creative workflows.",
      category: "Workstation",
      items: [
        { productId: "cpu-02", quantity: 1 },   // i9-14900K
        { productId: "mobo-02", quantity: 1 },  // MSI Z790 Tomahawk
        { productId: "ram-04", quantity: 1 },   // Corsair Dominator 64GB DDR5
        { productId: "gpu-01", quantity: 1 },   // RTX 4090
        { productId: "ssd-03", quantity: 2 },   // Samsung 990 Pro 2TB x2
        { productId: "hdd-02", quantity: 1 },   // Seagate 4TB HDD
        { productId: "psu-03", quantity: 1 },   // MSI MPG 1000W
        { productId: "case-04", quantity: 1 },  // CM HAF 700
        { productId: "cool-03", quantity: 1 },  // NZXT Kraken Elite 360
      ],
    },
  ];

  for (const bg of BUILD_GUIDES) {
    const existingBG = await prisma.buildGuide.findUnique({ where: { id: bg.id } });
    if (!existingBG) {
      const total = bg.items.reduce((sum, item) => {
        const prod = PRODUCTS.find(p => p.id === item.productId);
        return sum + (prod?.price ?? 0) * item.quantity;
      }, 0);
      await prisma.buildGuide.create({
        data: {
          id: bg.id,
          title: bg.title,
          description: bg.description,
          category: bg.category,
          total,
          items: {
            create: bg.items
              .filter(i => variantMap.has(i.productId))
              .map(item => ({
                variantId: variantMap.get(item.productId)!,
                quantity: item.quantity,
              })),
          },
        },
      });
    }
  }

  // ── 13. Billing Profile ───────────────────────────────────────────────────
  console.log("  → Seeding billing profile...");
  const existingProfile = await prisma.billingProfile.findFirst();
  if (!existingProfile) {
    await prisma.billingProfile.create({ data: BILLING_PROFILE });
  }

  console.log("✅ Seed complete.");
  console.log(`   Brands: ${brandMap.size}`);
  console.log(`   Categories: ${categoryMap.size}`);
  console.log(`   SubCategories: ${subCategoryMap.size}`);
  console.log(`   Products: ${PRODUCTS.length}`);
  console.log(`   PartSlots: ${partSlotMap.size}`);
  console.log(`   Customers: ${CUSTOMERS_DATA.length}`);
  console.log(`   Orders: ${ORDERS_DATA.length}`);
}

main()
  .catch(e => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
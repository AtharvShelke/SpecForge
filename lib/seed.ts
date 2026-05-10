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

type SeedAttribute = {
  key: string;
  label: string;
  type: "text" | "number" | "boolean" | "select" | "multi_select";
  required?: boolean;
  isFilterable?: boolean;
  filterType?: "checkbox" | "range" | "boolean" | "search" | "dropdown";
  unit?: string;
  sortOrder: number;
  options?: string[];
  dependencyKey?: string;
  dependencyValue?: string;
};

type SeedCategory = {
  code: string;
  name: string;
  shortLabel: string;
  icon: string;
  displayOrder: number;
  featuredOrder?: number;
  showInFeatured?: boolean;
  description: string;
  image?: string;
  subcategories: string[];
  attributes: SeedAttribute[];
};

type SeedProduct = {
  sku: string;
  name: string;
  categoryCode: string;
  subcategory?: string;
  brand: string;
  price: number;
  stock: number;
  description: string;
  image: string;
  specs: Record<string, string>;
};

const CATEGORIES: SeedCategory[] = [
  {
    code: "PROCESSOR",
    name: "Processors",
    shortLabel: "CPU",
    icon: "cpu",
    displayOrder: 1,
    featuredOrder: 1,
    showInFeatured: true,
    description: "Desktop CPUs for AMD and Intel platforms.",
    subcategories: ["AMD", "Intel"],
    attributes: [
      { key: "manufacturer", label: "Manufacturer", type: "select", required: true, isFilterable: true, filterType: "dropdown", sortOrder: 1, options: ["AMD", "Intel"] },
      { key: "family", label: "Family", type: "select", required: true, isFilterable: true, filterType: "dropdown", sortOrder: 2, options: ["Ryzen 5", "Ryzen 7", "Ryzen 9", "Core i5", "Core i7", "Core i9"] },
      { key: "socket", label: "Socket", type: "select", required: true, isFilterable: true, filterType: "dropdown", sortOrder: 3, options: ["AM4", "AM5", "LGA1200", "LGA1700"] },
      { key: "cores", label: "Cores", type: "number", required: true, isFilterable: true, filterType: "range", sortOrder: 4, unit: "cores" },
      { key: "threads", label: "Threads", type: "number", required: true, isFilterable: true, filterType: "range", sortOrder: 5, unit: "threads" },
      { key: "baseClock", label: "Base Clock", type: "number", required: false, isFilterable: true, filterType: "range", sortOrder: 6, unit: "GHz" },
      { key: "boostClock", label: "Boost Clock", type: "number", required: false, isFilterable: true, filterType: "range", sortOrder: 7, unit: "GHz" },
      { key: "tdp", label: "TDP", type: "number", required: true, isFilterable: true, filterType: "range", sortOrder: 8, unit: "W" },
      { key: "integratedGraphics", label: "Integrated Graphics", type: "boolean", required: false, isFilterable: true, filterType: "boolean", sortOrder: 9 },
    ],
  },
  {
    code: "MOTHERBOARD",
    name: "Motherboards",
    shortLabel: "Mobo",
    icon: "layers",
    displayOrder: 2,
    featuredOrder: 2,
    showInFeatured: true,
    description: "Motherboards aligned to CPU socket and platform.",
    subcategories: ["AM4", "AM5", "LGA1200", "LGA1700"],
    attributes: [
      { key: "manufacturer", label: "Manufacturer", type: "select", required: true, isFilterable: true, filterType: "dropdown", sortOrder: 1, options: ["ASUS", "MSI", "Gigabyte", "ASRock"] },
      { key: "socket", label: "Socket", type: "select", required: true, isFilterable: true, filterType: "dropdown", sortOrder: 2, options: ["AM4", "AM5", "LGA1200", "LGA1700"] },
      { key: "chipset", label: "Chipset", type: "select", required: true, isFilterable: true, filterType: "dropdown", sortOrder: 3, options: ["B550", "X570", "B650", "X670", "B660", "Z690", "B760", "Z790"] },
      { key: "ramType", label: "RAM Type", type: "select", required: true, isFilterable: true, filterType: "dropdown", sortOrder: 4, options: ["DDR4", "DDR5"] },
      { key: "ramSlots", label: "RAM Slots", type: "number", required: true, isFilterable: true, filterType: "range", sortOrder: 5 },
      { key: "formFactor", label: "Form Factor", type: "select", required: true, isFilterable: true, filterType: "dropdown", sortOrder: 6, options: ["ATX", "Micro-ATX", "Mini-ITX"] },
      { key: "wifi", label: "WiFi Included", type: "boolean", required: false, isFilterable: true, filterType: "boolean", sortOrder: 7 },
    ],
  },
  {
    code: "RAM",
    name: "RAM",
    shortLabel: "RAM",
    icon: "memory-stick",
    displayOrder: 3,
    featuredOrder: 3,
    showInFeatured: true,
    description: "Memory kits grouped by generation and speed.",
    subcategories: ["DDR4", "DDR5"],
    attributes: [
      { key: "manufacturer", label: "Manufacturer", type: "select", required: true, isFilterable: true, filterType: "dropdown", sortOrder: 1, options: ["Corsair", "G.Skill", "Kingston", "Teamgroup", "Crucial"] },
      { key: "ramType", label: "RAM Type", type: "select", required: true, isFilterable: true, filterType: "dropdown", sortOrder: 2, options: ["DDR4", "DDR5"] },
      { key: "capacity", label: "Capacity", type: "select", required: true, isFilterable: true, filterType: "dropdown", sortOrder: 3, options: ["8GB", "16GB", "32GB", "64GB"] },
      { key: "speed", label: "Speed", type: "number", required: true, isFilterable: true, filterType: "range", sortOrder: 4, unit: "MHz" },
      { key: "modules", label: "Modules", type: "number", required: true, isFilterable: true, filterType: "range", sortOrder: 5, unit: "sticks" },
      { key: "color", label: "Color", type: "select", required: false, isFilterable: true, filterType: "dropdown", sortOrder: 6, options: ["Black", "White", "RGB"] },
    ],
  },
  {
    code: "GPU",
    name: "Graphics Cards",
    shortLabel: "GPU",
    icon: "monitor",
    displayOrder: 4,
    featuredOrder: 4,
    showInFeatured: true,
    description: "Discrete GPUs for gaming and workstation builds.",
    subcategories: ["NVIDIA", "AMD Radeon", "Intel Arc"],
    attributes: [
      { key: "manufacturer", label: "Manufacturer", type: "select", required: true, isFilterable: true, filterType: "dropdown", sortOrder: 1, options: ["ASUS", "MSI", "Gigabyte", "ZOTAC", "Sapphire", "EVGA"] },
      { key: "series", label: "Series", type: "select", required: true, isFilterable: true, filterType: "dropdown", sortOrder: 2, options: ["RTX 3060", "RTX 4060", "RTX 4070", "RTX 4080", "RTX 4090", "RX 6700 XT", "RX 7800 XT", "RX 7900 XTX"] },
      { key: "vram", label: "VRAM", type: "select", required: true, isFilterable: true, filterType: "dropdown", sortOrder: 3, options: ["8GB", "12GB", "16GB", "24GB"] },
      { key: "length", label: "Length", type: "number", required: true, isFilterable: true, filterType: "range", sortOrder: 4, unit: "mm" },
      { key: "tdp", label: "TDP", type: "number", required: true, isFilterable: true, filterType: "range", sortOrder: 5, unit: "W" },
      { key: "minPSU", label: "Min PSU Wattage", type: "number", required: true, isFilterable: true, filterType: "range", sortOrder: 6, unit: "W" },
    ],
  },
  {
    code: "STORAGE",
    name: "Storage",
    shortLabel: "SSD",
    icon: "hard-drive",
    displayOrder: 5,
    description: "NVMe and SATA storage options.",
    subcategories: ["NVMe SSD", "SATA SSD", "HDD"],
    attributes: [
      { key: "manufacturer", label: "Manufacturer", type: "select", required: true, isFilterable: true, filterType: "dropdown", sortOrder: 1, options: ["Samsung", "Western Digital", "Crucial", "Seagate", "Kingston"] },
      { key: "type", label: "Type", type: "select", required: true, isFilterable: true, filterType: "dropdown", sortOrder: 2, options: ["NVMe SSD", "SATA SSD", "HDD"] },
      { key: "capacity", label: "Capacity", type: "select", required: true, isFilterable: true, filterType: "dropdown", sortOrder: 3, options: ["500GB", "1TB", "2TB", "4TB"] },
      { key: "interface", label: "Interface", type: "select", required: true, isFilterable: true, filterType: "dropdown", sortOrder: 4, options: ["PCIe 3.0 x4", "PCIe 4.0 x4", "PCIe 5.0 x4", "SATA III"] },
      { key: "readSpeed", label: "Read Speed", type: "number", required: false, isFilterable: true, filterType: "range", sortOrder: 5, unit: "MB/s" },
    ],
  },
  {
    code: "PSU",
    name: "Power Supplies",
    shortLabel: "PSU",
    icon: "zap",
    displayOrder: 6,
    description: "Reliable power delivery for your build.",
    subcategories: ["80+ Bronze", "80+ Gold", "80+ Platinum"],
    attributes: [
      { key: "manufacturer", label: "Manufacturer", type: "select", required: true, isFilterable: true, filterType: "dropdown", sortOrder: 1, options: ["Corsair", "EVGA", "Seasonic", "Cooler Master", "Thermaltake"] },
      { key: "wattage", label: "Wattage", type: "number", required: true, isFilterable: true, filterType: "range", sortOrder: 2, unit: "W" },
      { key: "efficiency", label: "Efficiency Rating", type: "select", required: true, isFilterable: true, filterType: "dropdown", sortOrder: 3, options: ["80+ White", "80+ Bronze", "80+ Gold", "80+ Platinum", "80+ Titanium"] },
      { key: "modularity", label: "Modularity", type: "select", required: true, isFilterable: true, filterType: "dropdown", sortOrder: 4, options: ["Non-Modular", "Semi-Modular", "Full-Modular"] },
      { key: "formFactor", label: "Form Factor", type: "select", required: true, isFilterable: true, filterType: "dropdown", sortOrder: 5, options: ["ATX", "SFX"] },
    ],
  },
  {
    code: "CASE",
    name: "Cases",
    shortLabel: "Case",
    icon: "box",
    displayOrder: 7,
    description: "The chassis for your components.",
    subcategories: ["Mid Tower", "Full Tower", "Mini ITX Case"],
    attributes: [
      { key: "manufacturer", label: "Manufacturer", type: "select", required: true, isFilterable: true, filterType: "dropdown", sortOrder: 1, options: ["NZXT", "Fractal Design", "Corsair", "Lian Li", "Phanteks", "Cooler Master"] },
      { key: "formFactor", label: "Form Factor", type: "select", required: true, isFilterable: true, filterType: "dropdown", sortOrder: 2, options: ["Mid Tower", "Full Tower", "Mini ITX Tower", "Micro ATX Tower"] },
      { key: "moboSupport", label: "Motherboard Support", type: "multi_select", required: true, isFilterable: true, filterType: "checkbox", sortOrder: 3, options: ["ATX", "Micro-ATX", "Mini-ITX", "E-ATX"] },
      { key: "maxGpuLength", label: "Max GPU Length", type: "number", required: true, isFilterable: true, filterType: "range", sortOrder: 4, unit: "mm" },
      { key: "maxCpuCoolerHeight", label: "Max CPU Cooler Height", type: "number", required: true, isFilterable: true, filterType: "range", sortOrder: 5, unit: "mm" },
      { key: "color", label: "Color", type: "select", required: false, isFilterable: true, filterType: "dropdown", sortOrder: 6, options: ["Black", "White", "Grey"] },
    ],
  },
  {
    code: "COOLER",
    name: "CPU Coolers",
    shortLabel: "Cooler",
    icon: "wind",
    displayOrder: 8,
    description: "Air and liquid cooling solutions.",
    subcategories: ["Air Cooler", "Liquid Cooler (AIO)"],
    attributes: [
      { key: "manufacturer", label: "Manufacturer", type: "select", required: true, isFilterable: true, filterType: "dropdown", sortOrder: 1, options: ["Noctua", "be quiet!", "Cooler Master", "NZXT", "Corsair", "Arctic"] },
      { key: "type", label: "Cooler Type", type: "select", required: true, isFilterable: true, filterType: "dropdown", sortOrder: 2, options: ["Air Cooler", "Liquid Cooler (AIO)"] },
      { key: "socketSupport", label: "Socket Support", type: "multi_select", required: true, isFilterable: true, filterType: "checkbox", sortOrder: 3, options: ["AM4", "AM5", "LGA1200", "LGA1700"] },
      { key: "height", label: "Height (Air Only)", type: "number", required: false, isFilterable: true, filterType: "range", sortOrder: 4, unit: "mm" },
      { key: "radiatorSize", label: "Radiator Size (AIO Only)", type: "select", required: false, isFilterable: true, filterType: "dropdown", sortOrder: 5, options: ["120mm", "240mm", "280mm", "360mm"] },
    ],
  },
];

const PRODUCTS: SeedProduct[] = [
  // PROCESSORS
  {
    sku: "CPU-AMD-7600",
    name: "AMD Ryzen 5 7600",
    categoryCode: "PROCESSOR",
    subcategory: "AMD",
    brand: "AMD",
    price: 18999,
    stock: 15,
    description: "6-core, 12-thread desktop processor for the AM5 platform. Includes AMD Wraith Stealth cooler.",
    image: "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=1200&q=80",
    specs: { manufacturer: "AMD", family: "Ryzen 5", socket: "AM5", cores: "6", threads: "12", baseClock: "3.8", boostClock: "5.1", tdp: "65", integratedGraphics: "true" },
  },
  {
    sku: "CPU-AMD-7800X3D",
    name: "AMD Ryzen 7 7800X3D",
    categoryCode: "PROCESSOR",
    subcategory: "AMD",
    brand: "AMD",
    price: 38999,
    stock: 5,
    description: "The ultimate gaming processor with AMD 3D V-Cache technology.",
    image: "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=1200&q=80",
    specs: { manufacturer: "AMD", family: "Ryzen 7", socket: "AM5", cores: "8", threads: "16", baseClock: "4.2", boostClock: "5.0", tdp: "120", integratedGraphics: "true" },
  },
  {
    sku: "CPU-INTEL-13600K",
    name: "Intel Core i5-13600K",
    categoryCode: "PROCESSOR",
    subcategory: "Intel",
    brand: "Intel",
    price: 29999,
    stock: 10,
    description: "14-core (6P + 8E) desktop processor for high-performance gaming and productivity.",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
    specs: { manufacturer: "Intel", family: "Core i5", socket: "LGA1700", cores: "14", threads: "20", baseClock: "3.5", boostClock: "5.1", tdp: "125", integratedGraphics: "true" },
  },
  {
    sku: "CPU-INTEL-14900K",
    name: "Intel Core i9-14900K",
    categoryCode: "PROCESSOR",
    subcategory: "Intel",
    brand: "Intel",
    price: 54999,
    stock: 4,
    description: "The fastest desktop processor for enthusiasts, featuring 24 cores and up to 6.0 GHz boost.",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
    specs: { manufacturer: "Intel", family: "Core i9", socket: "LGA1700", cores: "24", threads: "32", baseClock: "3.2", boostClock: "6.0", tdp: "125", integratedGraphics: "true" },
  },

  // MOTHERBOARDS
  {
    sku: "MOBO-ASUS-B650E",
    name: "ASUS ROG Strix B650E-F Gaming WiFi",
    categoryCode: "MOTHERBOARD",
    subcategory: "AM5",
    brand: "ASUS",
    price: 24999,
    stock: 8,
    description: "Premium B650E motherboard with PCIe 5.0 support and robust power delivery.",
    image: "https://images.unsplash.com/photo-1555617778-02518510b9fa?auto=format&fit=crop&w=1200&q=80",
    specs: { manufacturer: "ASUS", socket: "AM5", chipset: "B650E", ramType: "DDR5", ramSlots: "4", formFactor: "ATX", wifi: "true" },
  },
  {
    sku: "MOBO-MSI-Z790",
    name: "MSI MAG Z790 Tomahawk WiFi",
    categoryCode: "MOTHERBOARD",
    subcategory: "LGA1700",
    brand: "MSI",
    price: 27999,
    stock: 6,
    description: "Solid Z790 board for Intel enthusiasts, featuring excellent VRM cooling.",
    image: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=1200&q=80",
    specs: { manufacturer: "MSI", socket: "LGA1700", chipset: "Z790", ramType: "DDR5", ramSlots: "4", formFactor: "ATX", wifi: "true" },
  },
  {
    sku: "MOBO-GIGABYTE-B760M",
    name: "Gigabyte B760M DS3H AX",
    categoryCode: "MOTHERBOARD",
    subcategory: "LGA1700",
    brand: "Gigabyte",
    price: 13999,
    stock: 12,
    description: "Budget-friendly B760 Micro-ATX motherboard with built-in WiFi.",
    image: "https://images.unsplash.com/photo-1555617778-02518510b9fa?auto=format&fit=crop&w=1200&q=80",
    specs: { manufacturer: "Gigabyte", socket: "LGA1700", chipset: "B760", ramType: "DDR5", ramSlots: "4", formFactor: "Micro-ATX", wifi: "true" },
  },

  // RAM
  {
    sku: "RAM-CORSAIR-VENG-32-6000",
    name: "Corsair Vengeance 32GB (2x16GB) DDR5 6000MHz",
    categoryCode: "RAM",
    subcategory: "DDR5",
    brand: "Corsair",
    price: 10499,
    stock: 25,
    description: "High-performance DDR5 memory optimized for Intel and AMD systems.",
    image: "https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&w=1200&q=80",
    specs: { manufacturer: "Corsair", ramType: "DDR5", capacity: "32GB", speed: "6000", modules: "2", color: "Black" },
  },
  {
    sku: "RAM-GSKILL-TRID-32-6400",
    name: "G.Skill Trident Z5 RGB 32GB (2x16GB) DDR5 6400MHz",
    categoryCode: "RAM",
    subcategory: "DDR5",
    brand: "G.Skill",
    price: 12999,
    stock: 15,
    description: "Premium RGB DDR5 memory with aggressive styling and high speeds.",
    image: "https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&w=1200&q=80",
    specs: { manufacturer: "G.Skill", ramType: "DDR5", capacity: "32GB", speed: "6400", modules: "2", color: "RGB" },
  },

  // GPU
  {
    sku: "GPU-ASUS-RTX4070-DUAL",
    name: "ASUS Dual GeForce RTX 4070 OC Edition",
    categoryCode: "GPU",
    subcategory: "NVIDIA",
    brand: "ASUS",
    price: 58999,
    stock: 7,
    description: "Compact dual-fan RTX 4070 with efficient cooling and great 1440p performance.",
    image: "https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=1200&q=80",
    specs: { manufacturer: "ASUS", series: "RTX 4070", vram: "12GB", length: "267", tdp: "200", minPSU: "650" },
  },
  {
    sku: "GPU-MSI-RTX4080-SUPRIM",
    name: "MSI GeForce RTX 4080 Suprim X",
    categoryCode: "GPU",
    subcategory: "NVIDIA",
    brand: "MSI",
    price: 115999,
    stock: 3,
    description: "High-end RTX 4080 with premium brushed metal shroud and superior cooling.",
    image: "https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=1200&q=80",
    specs: { manufacturer: "MSI", series: "RTX 4080", vram: "16GB", length: "336", tdp: "320", minPSU: "750" },
  },
  {
    sku: "GPU-SAPPHIRE-RX7800XT-NITRO",
    name: "Sapphire Nitro+ Radeon RX 7800 XT",
    categoryCode: "GPU",
    subcategory: "AMD Radeon",
    brand: "Sapphire",
    price: 52999,
    stock: 10,
    description: "AMD's value king for 1440p gaming with excellent thermal performance.",
    image: "https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=1200&q=80",
    specs: { manufacturer: "Sapphire", series: "RX 7800 XT", vram: "16GB", length: "320", tdp: "263", minPSU: "700" },
  },

  // STORAGE
  {
    sku: "SSD-SAMSUNG-980PRO-1TB",
    name: "Samsung 980 Pro 1TB NVMe SSD",
    categoryCode: "STORAGE",
    subcategory: "NVMe SSD",
    brand: "Samsung",
    price: 8999,
    stock: 30,
    description: "PCIe 4.0 NVMe SSD with speeds up to 7,000 MB/s.",
    image: "https://images.unsplash.com/photo-1628557117038-f9db9f4f7058?auto=format&fit=crop&w=1200&q=80",
    specs: { manufacturer: "Samsung", type: "NVMe SSD", capacity: "1TB", interface: "PCIe 4.0 x4", readSpeed: "7000" },
  },
  {
    sku: "SSD-WD-BLACK-SN850X-2TB",
    name: "WD Black SN850X 2TB NVMe SSD",
    categoryCode: "STORAGE",
    subcategory: "NVMe SSD",
    brand: "Western Digital",
    price: 15999,
    stock: 20,
    description: "Top-tier gaming SSD with optimized performance and game mode 2.0.",
    image: "https://images.unsplash.com/photo-1628557117038-f9db9f4f7058?auto=format&fit=crop&w=1200&q=80",
    specs: { manufacturer: "Western Digital", type: "NVMe SSD", capacity: "2TB", interface: "PCIe 4.0 x4", readSpeed: "7300" },
  },

  // PSU
  {
    sku: "PSU-CORSAIR-RM850X",
    name: "Corsair RM850x (2021) 850W 80+ Gold",
    categoryCode: "PSU",
    subcategory: "80+ Gold",
    brand: "Corsair",
    price: 12499,
    stock: 15,
    description: "Fully modular, low-noise power supply with magnetic levitation fan.",
    image: "https://images.unsplash.com/photo-1591489378430-ef2f4c626b35?auto=format&fit=crop&w=1200&q=80",
    specs: { manufacturer: "Corsair", wattage: "850", efficiency: "80+ Gold", modularity: "Full-Modular", formFactor: "ATX" },
  },
  {
    sku: "PSU-EVGA-600W-BR",
    name: "EVGA 600 BR, 80+ Bronze 600W",
    categoryCode: "PSU",
    subcategory: "80+ Bronze",
    brand: "EVGA",
    price: 4999,
    stock: 20,
    description: "Budget-friendly 600W power supply for entry-level builds.",
    image: "https://images.unsplash.com/photo-1591489378430-ef2f4c626b35?auto=format&fit=crop&w=1200&q=80",
    specs: { manufacturer: "EVGA", wattage: "600", efficiency: "80+ Bronze", modularity: "Non-Modular", formFactor: "ATX" },
  },

  // CASE
  {
    sku: "CASE-NZXT-H5-FLOW",
    name: "NZXT H5 Flow Compact ATX Mid-Tower",
    categoryCode: "CASE",
    subcategory: "Mid Tower",
    brand: "NZXT",
    price: 8499,
    stock: 15,
    description: "High-airflow case with perforated front panel and dedicated GPU cooling fan.",
    image: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=1200&q=80",
    specs: { manufacturer: "NZXT", formFactor: "Mid Tower", moboSupport: "ATX, Micro-ATX, Mini-ITX", maxGpuLength: "365", maxCpuCoolerHeight: "165", color: "Black" },
  },
  {
    sku: "CASE-LIAN-LI-O11D-EVO",
    name: "Lian Li PC-O11 Dynamic EVO",
    categoryCode: "CASE",
    subcategory: "Mid Tower",
    brand: "Lian Li",
    price: 15999,
    stock: 10,
    description: "Iconic dual-chamber design with modularity and excellent water-cooling support.",
    image: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=1200&q=80",
    specs: { manufacturer: "Lian Li", formFactor: "Mid Tower", moboSupport: "E-ATX, ATX, Micro-ATX, Mini-ITX", maxGpuLength: "426", maxCpuCoolerHeight: "167", color: "White" },
  },

  // COOLER
  {
    sku: "COOLER-NOCTUA-NH-D15",
    name: "Noctua NH-D15 chromax.black",
    categoryCode: "COOLER",
    subcategory: "Air Cooler",
    brand: "Noctua",
    price: 9999,
    stock: 12,
    description: "The gold standard for air cooling, now in an all-black finish.",
    image: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=1200&q=80",
    specs: { manufacturer: "Noctua", type: "Air Cooler", socketSupport: "AM4, AM5, LGA1200, LGA1700", height: "165" },
  },
  {
    sku: "COOLER-NZXT-KRAKEN-360",
    name: "NZXT Kraken 360 RGB",
    categoryCode: "COOLER",
    subcategory: "Liquid Cooler (AIO)",
    brand: "NZXT",
    price: 18999,
    stock: 8,
    description: "High-performance AIO with a customisable LCD display on the pump block.",
    image: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=1200&q=80",
    specs: { manufacturer: "NZXT", type: "Liquid Cooler (AIO)", socketSupport: "AM4, AM5, LGA1200, LGA1700", radiatorSize: "360mm" },
  },
];

async function resetCatalog() {
  // Clear all data before seeding
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

async function seedCategories() {
  const categoryMap = new Map<string, number>();
  const subcategoryMap = new Map<string, number>();
  const attributeMap = new Map<string, string>();
  const optionMap = new Map<string, string>();

  for (const category of CATEGORIES) {
    const created = await prisma.category.create({
      data: {
        code: category.code,
        name: category.name,
        slug: slugify(category.name),
        shortLabel: category.shortLabel,
        description: category.description,
        image: category.image ?? null,
        icon: category.icon,
        displayOrder: category.displayOrder,
        featuredOrder: category.featuredOrder ?? null,
        showInFeatured: category.showInFeatured ?? false,
        isActive: true,
      },
    });

    categoryMap.set(category.code, created.id);

    for (const subcategory of category.subcategories) {
      const createdSubcategory = await prisma.subcategory.create({
        data: {
          categoryId: created.id,
          name: subcategory,
          slug: `${slugify(category.code)}-${slugify(subcategory)}`,
          description: `${subcategory} options for ${category.name}`,
          isActive: true,
        },
      });

      subcategoryMap.set(`${category.code}:${subcategory}`, createdSubcategory.id);
    }

    for (const attribute of category.attributes) {
      const createdAttribute = await prisma.categoryAttribute.create({
        data: {
          categoryId: created.id,
          key: attribute.key,
          label: attribute.label,
          type: attribute.type,
          isRequired: attribute.required ?? false,
          isFilterable: attribute.isFilterable ?? true,
          isComparable: true,
          filterType: attribute.filterType ?? null,
          unit: attribute.unit ?? null,
          sortOrder: attribute.sortOrder,
        },
      });

      attributeMap.set(`${category.code}:${attribute.key}`, createdAttribute.id);

      for (const [index, option] of (attribute.options ?? []).entries()) {
        const createdOption = await prisma.attributeOption.create({
          data: {
            attributeId: createdAttribute.id,
            value: option,
            slug: slugify(option),
            sortOrder: index,
          },
        });

        optionMap.set(`${category.code}:${attribute.key}:${option}`, createdOption.id);
      }
    }
  }

  // Set up dependencies
  for (const category of CATEGORIES) {
    for (const attribute of category.attributes) {
      if (!attribute.dependencyKey || !attribute.dependencyValue) continue;

      const attrId = attributeMap.get(`${category.code}:${attribute.key}`);
      if (!attrId) continue;

      await prisma.categoryAttribute.update({
        where: { id: attrId },
        data: {
          dependencyAttributeId: attributeMap.get(`${category.code}:${attribute.dependencyKey}`) ?? null,
          dependencyOptionId: optionMap.get(`${category.code}:${attribute.dependencyKey}:${attribute.dependencyValue}`) ?? null,
        },
      });
    }
  }

  return { categoryMap, subcategoryMap, attributeMap, optionMap };
}

async function seedBrands(categoryMap: Map<string, number>) {
  const brands = [
    { name: "AMD", categories: ["PROCESSOR"] },
    { name: "Intel", categories: ["PROCESSOR"] },
    { name: "ASUS", categories: ["MOTHERBOARD", "GPU"] },
    { name: "MSI", categories: ["MOTHERBOARD", "GPU"] },
    { name: "Gigabyte", categories: ["MOTHERBOARD", "GPU"] },
    { name: "ASRock", categories: ["MOTHERBOARD"] },
    { name: "Corsair", categories: ["RAM", "PSU", "CASE", "COOLER"] },
    { name: "G.Skill", categories: ["RAM"] },
    { name: "Kingston", categories: ["RAM", "STORAGE"] },
    { name: "Samsung", categories: ["STORAGE"] },
    { name: "Western Digital", categories: ["STORAGE"] },
    { name: "ZOTAC", categories: ["GPU"] },
    { name: "Sapphire", categories: ["GPU"] },
    { name: "EVGA", categories: ["GPU", "PSU"] },
    { name: "Seasonic", categories: ["PSU"] },
    { name: "NZXT", categories: ["CASE", "COOLER"] },
    { name: "Fractal Design", categories: ["CASE"] },
    { name: "Lian Li", categories: ["CASE"] },
    { name: "Noctua", categories: ["COOLER"] },
    { name: "be quiet!", categories: ["COOLER", "PSU", "CASE"] },
  ];

  const brandMap = new Map<string, string>();

  for (const b of brands) {
    const brand = await prisma.brand.create({
      data: {
        name: b.name,
        brandCategories: {
          create: b.categories
            .filter(code => categoryMap.has(code))
            .map((code) => ({
              categoryId: categoryMap.get(code)!,
            })),
        },
      },
    });

    brandMap.set(b.name, brand.id);
  }

  return brandMap;
}

async function seedProducts(
  categoryMap: Map<string, number>,
  attributeMap: Map<string, string>,
  optionMap: Map<string, string>,
  brandMap: Map<string, string>
) {
  for (const product of PRODUCTS) {
    const categoryId = categoryMap.get(product.categoryCode)!;
    const subcategory = product.subcategory
      ? await prisma.subcategory.findFirst({
          where: {
            categoryId,
            name: product.subcategory,
          },
          select: { id: true },
        })
      : null;

    const created = await prisma.product.create({
      data: {
        slug: slugify(product.sku),
        sku: product.sku,
        name: product.name,
        description: product.description,
        status: ProductStatus.ACTIVE,
        price: product.price,
        stockStatus: product.stock > 0 ? "IN_STOCK" : "OUT_OF_STOCK",
        categoryId,
        subcategoryId: subcategory?.id ?? null,
        brandId: brandMap.get(product.brand) ?? null,
        media: {
          create: [
            {
              url: product.image,
              altText: product.name,
              sortOrder: 0,
            },
          ],
        },
      },
    });

    await prisma.inventoryItem.create({
      data: {
        productId: created.id,
        quantity: product.stock,
        reserved: 0,
        reorderLevel: 3,
        costPrice: Math.round(product.price * 0.8),
        location: "MAIN-WH",
      },
    });

    if (product.stock > 0) {
      await prisma.stockMovement.create({
        data: {
          productId: created.id,
          type: "INWARD",
          quantity: product.stock,
          note: "Initial seed stock",
        },
      });
    }

    for (const [key, rawValue] of Object.entries(product.specs)) {
      const attributeId = attributeMap.get(`${product.categoryCode}:${key}`);
      if (!attributeId) continue;

      const optionId = optionMap.get(`${product.categoryCode}:${key}:${rawValue}`) ?? null;
      const categoryAttribute = await prisma.categoryAttribute.findUniqueOrThrow({
        where: { id: attributeId },
        select: { type: true },
      });

      await prisma.productSpec.create({
        data: {
          productId: created.id,
          attributeId,
          optionId,
          value: rawValue,
          valueNumber: categoryAttribute.type === "number" ? Number(rawValue) : null,
          valueBoolean: categoryAttribute.type === "boolean" ? rawValue.toLowerCase() === "true" : null,
          isHighlighted: ["socket", "chipset", "ramType", "formFactor", "wattage", "series"].includes(key),
        },
      });
    }
  }
}

async function seedBuildMetadata(categoryMap: Map<string, number>, attributeMap: Map<string, string>) {
  const buildSequenceCodes = ["PROCESSOR", "COOLER", "MOTHERBOARD", "RAM", "GPU", "STORAGE", "PSU", "CASE"];

  for (const [index, code] of buildSequenceCodes.entries()) {
    if (categoryMap.has(code)) {
      await prisma.buildSequence.create({
        data: {
          categoryId: categoryMap.get(code)!,
          stepOrder: index + 1,
        },
      });
    }
  }

  const hierarchyRootId = crypto.randomUUID();
  await prisma.categoryHierarchy.create({
    data: {
      id: hierarchyRootId,
      label: "PC Components",
      sortOrder: 0,
    }
  });

  for (const [index, category] of CATEGORIES.entries()) {
    await prisma.categoryHierarchy.create({
      data: {
        id: crypto.randomUUID(),
        label: category.name,
        categoryId: categoryMap.get(category.code)!,
        query: category.code,
        parentId: hierarchyRootId,
        sortOrder: index + 1,
      },
    });
  }

  // Basic Compatibility Rules
  const rules = [
    {
      source: "PROCESSOR",
      target: "MOTHERBOARD",
      name: "CPU socket must match motherboard socket",
      sourceAttr: "socket",
      targetAttr: "socket",
      operator: "EQUALS",
    },
    {
      source: "MOTHERBOARD",
      target: "RAM",
      name: "RAM type must match motherboard support",
      sourceAttr: "ramType",
      targetAttr: "ramType",
      operator: "EQUALS",
    },
    {
      source: "COOLER",
      target: "PROCESSOR",
      name: "Cooler must support CPU socket",
      sourceAttr: "socketSupport",
      targetAttr: "socket",
      operator: "CONTAINS",
    }
  ];

  for (const r of rules) {
    if (categoryMap.has(r.source) && categoryMap.has(r.target)) {
      await prisma.compatibilityRule.create({
        data: {
          sourceCategoryId: categoryMap.get(r.source)!,
          targetCategoryId: categoryMap.get(r.target)!,
          name: r.name,
          message: r.name,
          severity: CompatibilityLevel.INCOMPATIBLE,
          clauses: {
            create: [
              {
                sourceAttributeId: attributeMap.get(`${r.source}:${r.sourceAttr}`)!,
                targetAttributeId: attributeMap.get(`${r.target}:${r.targetAttr}`)!,
                operator: r.operator,
                sortOrder: 1,
              },
            ],
          },
        },
      });
    }
  }

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
}

async function main() {
  console.log("Starting seed...");
  await resetCatalog();
  console.log("Catalog reset complete.");
  
  await upsertCoreRows();
  console.log("Core rows upserted.");

  const { categoryMap, attributeMap, optionMap } = await seedCategories();
  console.log("Categories seeded.");

  const brandMap = await seedBrands(categoryMap);
  console.log("Brands seeded.");

  await seedProducts(categoryMap, attributeMap, optionMap, brandMap);
  console.log("Products seeded.");

  await seedBuildMetadata(categoryMap, attributeMap);
  console.log("Build metadata and rules seeded.");

  await seedSearchAndCache(categoryMap);
  console.log("Search and cache seeded.");

  console.log("Seeding finished successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

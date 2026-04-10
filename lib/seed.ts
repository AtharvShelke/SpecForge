import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  Category,
  Currency,
  FilterType,
  InvoiceStatus,
  InvoiceType,
  InventoryUnitStatus,
  MarketingEventType,
  OrderStatus,
  PaymentMethodType,
  PaymentStatus,
  PrismaClient,
  PurchaseOrderStatus,
  Role,
  SalesChannel,
  StockMovementType,
} from "../generated/prisma/client";

const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function categoryToEnum(cat: string): Category {
  const map: Record<string, Category> = {
    Processor: Category.PROCESSOR,
    "Graphics Card": Category.GPU,
    Motherboard: Category.MOTHERBOARD,
    RAM: Category.RAM,
    Storage: Category.STORAGE,
    "Power Supply": Category.PSU,
    Cabinet: Category.CABINET,
    Cooler: Category.COOLER,
    Monitor: Category.MONITOR,
    Peripheral: Category.PERIPHERAL,
    Networking: Category.NETWORKING,
    Laptop: Category.LAPTOP,
  };
  const result = map[cat];
  if (!result) throw new Error(`Unknown category string: "${cat}"`);
  return result;
}

function normaliseSpec(key: string, value: string): string {
  if (key === "formFactor" && value === "mATX") return "Micro-ATX";
  return value;
}

// ─────────────────────────────────────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────────────────────────────────────

const USERS_DATA = [
  {
    id: "user-super-1",
    email: "superadmin@bitkart.in",
    name: "Super Admin",
    // bcrypt hash of "Admin@1234" — replace with a real hash in production
    password: "$2b$10$abcdefghijklmnopqrstuuXzYwVtSrQpOnMlKjIhGfEdCbA987654",
    role: Role.SUPER_ADMIN,
  },
  {
    id: "user-admin-1",
    email: "admin@bitkart.in",
    name: "BitKart Admin",
    password: "$2b$10$abcdefghijklmnopqrstuuXzYwVtSrQpOnMlKjIhGfEdCbA987654",
    role: Role.ADMIN,
  },
  {
    id: "user-wh-1",
    email: "warehouse@bitkart.in",
    name: "Warehouse Staff",
    password: "$2b$10$abcdefghijklmnopqrstuuXzYwVtSrQpOnMlKjIhGfEdCbA987654",
    role: Role.WAREHOUSE_STAFF,
  },
  {
    id: "user-fin-1",
    email: "finance@bitkart.in",
    name: "Finance Team",
    password: "$2b$10$abcdefghijklmnopqrstuuXzYwVtSrQpOnMlKjIhGfEdCbA987654",
    role: Role.FINANCE,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// BRANDS
// ─────────────────────────────────────────────────────────────────────────────

const BRANDS_DATA = [
  { name: "Intel", categories: [Category.PROCESSOR, Category.GPU, Category.NETWORKING] },
  { name: "AMD", categories: [Category.PROCESSOR, Category.GPU, Category.MOTHERBOARD] },
  { name: "NVIDIA", categories: [Category.GPU] },
  { name: "ASUS", categories: [Category.MOTHERBOARD, Category.GPU, Category.MONITOR, Category.PSU, Category.PERIPHERAL] },
  { name: "MSI", categories: [Category.MOTHERBOARD, Category.GPU, Category.MONITOR, Category.PSU] },
  { name: "Gigabyte", categories: [Category.MOTHERBOARD, Category.GPU] },
  { name: "ASRock", categories: [Category.MOTHERBOARD, Category.GPU] },
  { name: "Corsair", categories: [Category.RAM, Category.PSU, Category.CABINET, Category.COOLER, Category.PERIPHERAL] },
  { name: "G.Skill", categories: [Category.RAM] },
  { name: "Kingston", categories: [Category.RAM, Category.STORAGE] },
  { name: "Samsung", categories: [Category.STORAGE, Category.MONITOR] },
  { name: "Western Digital", categories: [Category.STORAGE] },
  { name: "Crucial", categories: [Category.STORAGE] },
  { name: "DeepCool", categories: [Category.COOLER, Category.PSU] },
  { name: "Noctua", categories: [Category.COOLER] },
  { name: "EKWB", categories: [Category.COOLER] },
  { name: "Lian Li", categories: [Category.CABINET, Category.COOLER] },
  { name: "Cooler Master", categories: [Category.COOLER, Category.PSU, Category.CABINET] },
  { name: "Sapphire", categories: [Category.GPU] },
  { name: "Zotac", categories: [Category.GPU] },
  { name: "LG", categories: [Category.MONITOR] },
  { name: "BenQ", categories: [Category.MONITOR] },
  { name: "Keychron", categories: [Category.PERIPHERAL] },
  { name: "Logitech", categories: [Category.PERIPHERAL] },
  { name: "HyperX", categories: [Category.PERIPHERAL] },
  { name: "TP-Link", categories: [Category.NETWORKING] },
  { name: "D-Link", categories: [Category.NETWORKING] },
];

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCTS
// ─────────────────────────────────────────────────────────────────────────────

const PRODUCTS_DATA = [
  // ── PROCESSORS ──────────────────────────────────────────────────────────────
  {
    id: "cpu-1", sku: "CPU-AMD-7800X3D",
    name: "AMD Ryzen 7 7800X3D", category: "Processor", price: 36000, stock: 15,
    image: "https://www.amd.com/content/dam/amd/en/images/products/processors/ryzen/2505503-ryzen-7-7800x3d-og.jpg",
    description: "The ultimate gaming processor with 3D V-Cache technology.",
    brandName: "AMD",
    specs: { brand: "AMD", socket: "AM5", wattage: "120", ramType: "DDR5", series: "7000 Series", cores: "8" },
  },
  {
    id: "cpu-2", sku: "CPU-INT-14900K",
    name: "Intel Core i9-14900K", category: "Processor", price: 55000, stock: 8,
    image: "https://m.media-amazon.com/images/I/619ytLAytAL.jpg",
    description: "14th Gen High performance for creators and gamers.",
    brandName: "Intel",
    specs: { brand: "Intel", socket: "LGA1700", wattage: "253", ramType: "DDR5", generation: "14th Gen", cores: "24" },
  },
  {
    id: "cpu-3", sku: "CPU-AMD-5600X",
    name: "AMD Ryzen 5 5600X", category: "Processor", price: 14000, stock: 25,
    image: "https://www.amd.com/content/dam/amd/en/images/products/processors/ryzen/2505503-ryzen-5-5600x-og.jpg",
    description: "Budget king for gaming.",
    brandName: "AMD",
    specs: { brand: "AMD", socket: "AM4", wattage: "65", ramType: "DDR4", series: "5000 Series", cores: "6" },
  },
  {
    id: "cpu-4", sku: "CPU-INT-13600K",
    name: "Intel Core i5-13600K", category: "Processor", price: 28500, stock: 20,
    image: "https://m.media-amazon.com/images/I/61lNEpDfdcL.jpg",
    description: "13th Gen mid-range beast.",
    brandName: "Intel",
    specs: { brand: "Intel", socket: "LGA1700", wattage: "125", ramType: "DDR5", generation: "13th Gen", cores: "14" },
  },
  {
    id: "cpu-5", sku: "CPU-AMD-7950X",
    name: "AMD Ryzen 9 7950X", category: "Processor", price: 52000, stock: 5,
    image: "https://www.amd.com/content/dam/amd/en/images/products/processors/ryzen/2505503-ryzen-9-7900x-og.jpg",
    description: "Top tier productivity powerhouse.",
    brandName: "AMD",
    specs: { brand: "AMD", socket: "AM5", wattage: "170", ramType: "DDR5", series: "7000 Series", cores: "16" },
  },
  {
    id: "cpu-6", sku: "CPU-AMD-7960X",
    name: "AMD Ryzen Threadripper 7960X", category: "Processor", price: 135000, stock: 2,
    image: "https://m.media-amazon.com/images/I/71Gyox1aqRL.jpg",
    description: "HEDT processor for extreme workstations.",
    brandName: "AMD",
    specs: { brand: "AMD", socket: "sTR5", wattage: "350", ramType: "DDR5", series: "Threadripper", cores: "24" },
  },
  {
    id: "cpu-7", sku: "CPU-AMD-7700X",
    name: "AMD Ryzen 7 7700X", category: "Processor", price: 32500, stock: 14,
    image: "https://m.media-amazon.com/images/I/71fZgV7KzBL.jpg",
    description: "High performance Zen4 gaming CPU.",
    brandName: "AMD",
    specs: { brand: "AMD", socket: "AM5", wattage: "105", ramType: "DDR5", series: "7000 Series", cores: "8" },
  },
  {
    id: "cpu-8", sku: "CPU-INT-14700K",
    name: "Intel Core i7-14700K", category: "Processor", price: 43000, stock: 10,
    image: "https://m.media-amazon.com/images/I/61lNEpDfdcL.jpg",
    description: "High-end gaming + productivity CPU.",
    brandName: "Intel",
    specs: { brand: "Intel", socket: "LGA1700", wattage: "253", ramType: "DDR5", generation: "14th Gen", cores: "20" },
  },
  {
    id: "cpu-9", sku: "CPU-AMD-7600",
    name: "AMD Ryzen 5 7600", category: "Processor", price: 21000, stock: 28,
    image: "https://m.media-amazon.com/images/I/61C2H9V3yDL.jpg",
    description: "Efficient midrange Zen4 chip.",
    brandName: "AMD",
    specs: { brand: "AMD", socket: "AM5", wattage: "65", ramType: "DDR5", series: "7000 Series", cores: "6" },
  },
  {
    id: "cpu-10", sku: "CPU-INT-13400F",
    name: "Intel Core i5-13400F", category: "Processor", price: 18000, stock: 30,
    image: "https://m.media-amazon.com/images/I/71Tz1lS3TAL.jpg",
    description: "Budget gaming champion.",
    brandName: "Intel",
    specs: { brand: "Intel", socket: "LGA1700", wattage: "148", ramType: "DDR5", generation: "13th Gen", cores: "10" },
  },
  {
    id: "cpu-11", sku: "CPU-AMD-5800X",
    name: "AMD Ryzen 7 5800X", category: "Processor", price: 22500, stock: 18,
    image: "https://m.media-amazon.com/images/I/61mYyJ6gH0L.jpg",
    description: "High performance AM4 processor.",
    brandName: "AMD",
    specs: { brand: "AMD", socket: "AM4", wattage: "105", ramType: "DDR4", series: "5000 Series", cores: "8" },
  },
  {
    id: "cpu-12", sku: "CPU-INT-12100F",
    name: "Intel Core i3-12100F", category: "Processor", price: 9000, stock: 40,
    image: "https://m.media-amazon.com/images/I/61p7FZ7m4DL.jpg",
    description: "Entry-level gaming CPU.",
    brandName: "Intel",
    specs: { brand: "Intel", socket: "LGA1700", wattage: "89", ramType: "DDR5", generation: "12th Gen", cores: "4" },
  },
  {
    id: "cpu-13", sku: "CPU-AMD-5900X",
    name: "AMD Ryzen 9 5900X", category: "Processor", price: 34000, stock: 9,
    image: "https://m.media-amazon.com/images/I/71u7V9iK9xL.jpg",
    description: "High core productivity chip.",
    brandName: "AMD",
    specs: { brand: "AMD", socket: "AM4", wattage: "105", ramType: "DDR4", series: "5000 Series", cores: "12" },
  },
  {
    id: "cpu-14", sku: "CPU-INT-12900K",
    name: "Intel Core i9-12900K", category: "Processor", price: 36000, stock: 12,
    image: "https://m.media-amazon.com/images/I/61mYyJ6gH0L.jpg",
    description: "Flagship 12th Gen CPU.",
    brandName: "Intel",
    specs: { brand: "Intel", socket: "LGA1700", wattage: "241", ramType: "DDR5", generation: "12th Gen", cores: "16" },
  },
  {
    id: "cpu-15", sku: "CPU-AMD-7500F",
    name: "AMD Ryzen 5 7500F", category: "Processor", price: 16500, stock: 26,
    image: "https://m.media-amazon.com/images/I/71fZgV7KzBL.jpg",
    description: "Budget Zen4 performer.",
    brandName: "AMD",
    specs: { brand: "AMD", socket: "AM5", wattage: "65", ramType: "DDR5", series: "7000 Series", cores: "6" },
  },
  {
    id: "cpu-16", sku: "CPU-INT-14600K",
    name: "Intel Core i5-14600K", category: "Processor", price: 31000, stock: 16,
    image: "https://m.media-amazon.com/images/I/61lNEpDfdcL.jpg",
    description: "Best value performance CPU.",
    brandName: "Intel",
    specs: { brand: "Intel", socket: "LGA1700", wattage: "181", ramType: "DDR5", generation: "14th Gen", cores: "14" },
  },
  {
    id: "cpu-17", sku: "CPU-AMD-7950X3D",
    name: "AMD Ryzen 9 7950X3D", category: "Processor", price: 62000, stock: 6,
    image: "https://m.media-amazon.com/images/I/71Gyox1aqRL.jpg",
    description: "Ultimate gaming + workstation CPU.",
    brandName: "AMD",
    specs: { brand: "AMD", socket: "AM5", wattage: "120", ramType: "DDR5", series: "7000 Series", cores: "16" },
  },
  {
    id: "cpu-18", sku: "CPU-INT-13700K",
    name: "Intel Core i7-13700K", category: "Processor", price: 39500, stock: 11,
    image: "https://m.media-amazon.com/images/I/61lNEpDfdcL.jpg",
    description: "Balanced performance CPU.",
    brandName: "Intel",
    specs: { brand: "Intel", socket: "LGA1700", wattage: "253", ramType: "DDR5", generation: "13th Gen", cores: "16" },
  },
  {
    id: "cpu-19", sku: "CPU-AMD-5600",
    name: "AMD Ryzen 5 5600", category: "Processor", price: 12500, stock: 33,
    image: "https://m.media-amazon.com/images/I/61C2H9V3yDL.jpg",
    description: "Budget AM4 gaming CPU.",
    brandName: "AMD",
    specs: { brand: "AMD", socket: "AM4", wattage: "65", ramType: "DDR4", series: "5000 Series", cores: "6" },
  },
  {
    id: "cpu-20", sku: "CPU-INT-12400F",
    name: "Intel Core i5-12400F", category: "Processor", price: 14000, stock: 29,
    image: "https://m.media-amazon.com/images/I/71Tz1lS3TAL.jpg",
    description: "Great value midrange CPU.",
    brandName: "Intel",
    specs: { brand: "Intel", socket: "LGA1700", wattage: "117", ramType: "DDR5", generation: "12th Gen", cores: "6" },
  },
  {
    id: "cpu-21", sku: "CPU-AMD-5700X",
    name: "AMD Ryzen 7 5700X", category: "Processor", price: 21000, stock: 19,
    image: "https://m.media-amazon.com/images/I/61mYyJ6gH0L.jpg",
    description: "Efficient 8-core CPU.",
    brandName: "AMD",
    specs: { brand: "AMD", socket: "AM4", wattage: "65", ramType: "DDR4", series: "5000 Series", cores: "8" },
  },
  {
    id: "cpu-22", sku: "CPU-INT-12600K",
    name: "Intel Core i5-12600K", category: "Processor", price: 24500, stock: 17,
    image: "https://m.media-amazon.com/images/I/61lNEpDfdcL.jpg",
    description: "Popular enthusiast CPU.",
    brandName: "Intel",
    specs: { brand: "Intel", socket: "LGA1700", wattage: "150", ramType: "DDR5", generation: "12th Gen", cores: "10" },
  },
  {
    id: "cpu-23", sku: "CPU-AMD-7600X",
    name: "AMD Ryzen 5 7600X", category: "Processor", price: 23500, stock: 23,
    image: "https://m.media-amazon.com/images/I/71fZgV7KzBL.jpg",
    description: "High clock gaming CPU.",
    brandName: "AMD",
    specs: { brand: "AMD", socket: "AM5", wattage: "105", ramType: "DDR5", series: "7000 Series", cores: "6" },
  },
  {
    id: "cpu-24", sku: "CPU-INT-14700",
    name: "Intel Core i7-14700", category: "Processor", price: 38000, stock: 13,
    image: "https://m.media-amazon.com/images/I/61lNEpDfdcL.jpg",
    description: "Non-K high performance CPU.",
    brandName: "Intel",
    specs: { brand: "Intel", socket: "LGA1700", wattage: "219", ramType: "DDR5", generation: "14th Gen", cores: "20" },
  },
  {
    id: "cpu-25", sku: "CPU-AMD-7900",
    name: "AMD Ryzen 9 7900", category: "Processor", price: 41000, stock: 8,
    image: "https://m.media-amazon.com/images/I/71Gyox1aqRL.jpg",
    description: "Efficient 12-core Zen4 CPU.",
    brandName: "AMD",
    specs: { brand: "AMD", socket: "AM5", wattage: "65", ramType: "DDR5", series: "7000 Series", cores: "12" },
  },
  {
    id: "cpu-26", sku: "CPU-INT-13900KS",
    name: "Intel Core i9-13900KS", category: "Processor", price: 65000, stock: 4,
    image: "https://m.media-amazon.com/images/I/61lNEpDfdcL.jpg",
    description: "Extreme flagship processor.",
    brandName: "Intel",
    specs: { brand: "Intel", socket: "LGA1700", wattage: "253", ramType: "DDR5", generation: "13th Gen", cores: "24" },
  },

  // ── MOTHERBOARDS ────────────────────────────────────────────────────────────
  {
    id: "mobo-1", sku: "MB-ROG-X670E",
    name: "ASUS ROG Strix X670E-E Gaming WiFi", category: "Motherboard", price: 42000, stock: 10,
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSog2RHpDaYyq58a4pnux9TyvzNBUFhYM2ZQA&s",
    description: "Premium AM5 motherboard with PCIe 5.0.",
    brandName: "ASUS",
    specs: { brand: "ASUS", socket: "AM5", ramType: "DDR5", formFactor: "ATX", chipset: "X670" },
  },
  {
    id: "mobo-2", sku: "MB-MSI-Z790",
    name: "MSI MAG Z790 Tomahawk WiFi", category: "Motherboard", price: 28000, stock: 12,
    image: "https://asset.msi.com/resize/image/global/product/product_1664265391459c76c55d481a806150407f1b07a6bb.png62405b38c58fe0f07fcef2367d8a9ba1/1024.png",
    description: "Reliable foundation for Intel 12th/13th/14th Gen.",
    brandName: "MSI",
    specs: { brand: "MSI", socket: "LGA1700", ramType: "DDR5", formFactor: "ATX", chipset: "Z790" },
  },
  {
    id: "mobo-3", sku: "MB-GIG-B550M",
    name: "Gigabyte B550M DS3H", category: "Motherboard", price: 9000, stock: 30,
    image: "https://m.media-amazon.com/images/I/71ZMMyOQfOL.jpg",
    description: "Solid budget board for AM4.",
    brandName: "Gigabyte",
    specs: { brand: "Gigabyte", socket: "AM4", ramType: "DDR4", formFactor: "Micro-ATX", chipset: "B550" },
  },
  {
    id: "mobo-4", sku: "MB-ASR-B650M",
    name: "ASRock B650M Pro RS", category: "Motherboard", price: 13500, stock: 18,
    image: "https://www.asrock.com/mb/photo/B650M%20Pro%20RS(M1).png",
    description: "Great value AM5 Micro ATX board.",
    brandName: "ASRock",
    specs: { brand: "ASRock", socket: "AM5", ramType: "DDR5", formFactor: "Micro-ATX", chipset: "B650" },
  },
  {
    id: "mobo-5", sku: "MB-MSI-B760",
    name: "MSI PRO B760-P DDR4", category: "Motherboard", price: 15500, stock: 15,
    image: "https://m.media-amazon.com/images/I/91ZPVQjJ7kL.jpg",
    description: "Cost effective Intel board supporting DDR4.",
    brandName: "MSI",
    specs: { brand: "MSI", socket: "LGA1700", ramType: "DDR4", formFactor: "ATX", chipset: "B760" },
  },
  {
    id: "mobo-6", sku: "MB-ASUS-B650",
    name: "ASUS TUF B650-PLUS", category: "Motherboard", price: 19000, stock: 18,
    image: "https://m.media-amazon.com/images/I/71M9yG3R7XL.jpg",
    description: "Durable AM5 board.",
    brandName: "ASUS",
    specs: { brand: "ASUS", socket: "AM5", ramType: "DDR5", formFactor: "ATX", chipset: "B650" },
  },
  {
    id: "mobo-7", sku: "MB-MSI-B650",
    name: "MSI B650 Gaming Plus", category: "Motherboard", price: 17500, stock: 20,
    image: "https://m.media-amazon.com/images/I/81zK8VZxZPL.jpg",
    description: "Balanced AM5 motherboard.",
    brandName: "MSI",
    specs: { brand: "MSI", socket: "AM5", ramType: "DDR5", formFactor: "ATX", chipset: "B650" },
  },
  {
    id: "mobo-8", sku: "MB-GIG-X670",
    name: "Gigabyte X670 Aorus Elite", category: "Motherboard", price: 29000, stock: 9,
    image: "https://m.media-amazon.com/images/I/81E6R7Y6dPL.jpg",
    description: "Premium AM5 board.",
    brandName: "Gigabyte",
    specs: { brand: "Gigabyte", socket: "AM5", ramType: "DDR5", formFactor: "ATX", chipset: "X670" },
  },
  {
    id: "mobo-9", sku: "MB-ASR-A620",
    name: "ASRock A620M-HDV", category: "Motherboard", price: 9000, stock: 32,
    image: "https://m.media-amazon.com/images/I/71L+O+6N0AL.jpg",
    description: "Entry AM5 board.",
    brandName: "ASRock",
    specs: { brand: "ASRock", socket: "AM5", ramType: "DDR5", formFactor: "Micro-ATX", chipset: "A620" },
  },
  {
    id: "mobo-10", sku: "MB-MSI-Z690",
    name: "MSI Z690 Tomahawk", category: "Motherboard", price: 26000, stock: 14,
    image: "https://m.media-amazon.com/images/I/81zK8VZxZPL.jpg",
    description: "High-end Intel board.",
    brandName: "MSI",
    specs: { brand: "MSI", socket: "LGA1700", ramType: "DDR5", formFactor: "ATX", chipset: "Z690" },
  },
  {
    id: "mobo-11", sku: "MB-ASUS-B760",
    name: "ASUS Prime B760M-A", category: "Motherboard", price: 15500, stock: 21,
    image: "https://m.media-amazon.com/images/I/71M9yG3R7XL.jpg",
    description: "Reliable Intel board.",
    brandName: "ASUS",
    specs: { brand: "ASUS", socket: "LGA1700", ramType: "DDR5", formFactor: "Micro-ATX", chipset: "B760" },
  },
  {
    id: "mobo-12", sku: "MB-GIG-H610",
    name: "Gigabyte H610M S2H", category: "Motherboard", price: 7000, stock: 40,
    image: "https://m.media-amazon.com/images/I/71ZMMyOQfOL.jpg",
    description: "Budget Intel board.",
    brandName: "Gigabyte",
    specs: { brand: "Gigabyte", socket: "LGA1700", ramType: "DDR4", formFactor: "Micro-ATX", chipset: "H610" },
  },
  {
    id: "mobo-13", sku: "MB-ASUS-X570",
    name: "ASUS ROG Strix X570-E", category: "Motherboard", price: 24000, stock: 11,
    image: "https://m.media-amazon.com/images/I/71M9yG3R7XL.jpg",
    description: "Premium AM4 board.",
    brandName: "ASUS",
    specs: { brand: "ASUS", socket: "AM4", ramType: "DDR4", formFactor: "ATX", chipset: "X570" },
  },
  {
    id: "mobo-14", sku: "MB-MSI-B550",
    name: "MSI B550 Tomahawk", category: "Motherboard", price: 14500, stock: 22,
    image: "https://m.media-amazon.com/images/I/81zK8VZxZPL.jpg",
    description: "Popular AM4 board.",
    brandName: "MSI",
    specs: { brand: "MSI", socket: "AM4", ramType: "DDR4", formFactor: "ATX", chipset: "B550" },
  },
  {
    id: "mobo-15", sku: "MB-GIG-A520",
    name: "Gigabyte A520M", category: "Motherboard", price: 6000, stock: 35,
    image: "https://m.media-amazon.com/images/I/71ZMMyOQfOL.jpg",
    description: "Entry AM4 motherboard.",
    brandName: "Gigabyte",
    specs: { brand: "Gigabyte", socket: "AM4", ramType: "DDR4", formFactor: "Micro-ATX", chipset: "A520" },
  },
  {
    id: "mobo-16", sku: "MB-ASR-Z790",
    name: "ASRock Z790 Steel Legend", category: "Motherboard", price: 30500, stock: 8,
    image: "https://m.media-amazon.com/images/I/81E6R7Y6dPL.jpg",
    description: "High-end Intel board.",
    brandName: "ASRock",
    specs: { brand: "ASRock", socket: "LGA1700", ramType: "DDR5", formFactor: "ATX", chipset: "Z790" },
  },
  {
    id: "mobo-17", sku: "MB-MSI-H610",
    name: "MSI Pro H610M", category: "Motherboard", price: 7200, stock: 37,
    image: "https://m.media-amazon.com/images/I/71ZMMyOQfOL.jpg",
    description: "Budget Intel motherboard.",
    brandName: "MSI",
    specs: { brand: "MSI", socket: "LGA1700", ramType: "DDR4", formFactor: "Micro-ATX", chipset: "H610" },
  },
  {
    id: "mobo-18", sku: "MB-ASUS-Z790",
    name: "ASUS TUF Z790-Plus", category: "Motherboard", price: 31000, stock: 10,
    image: "https://m.media-amazon.com/images/I/71M9yG3R7XL.jpg",
    description: "Enthusiast Intel board.",
    brandName: "ASUS",
    specs: { brand: "ASUS", socket: "LGA1700", ramType: "DDR5", formFactor: "ATX", chipset: "Z790" },
  },
  {
    id: "mobo-19", sku: "MB-GIG-B760",
    name: "Gigabyte B760 Gaming X", category: "Motherboard", price: 17000, stock: 19,
    image: "https://m.media-amazon.com/images/I/81E6R7Y6dPL.jpg",
    description: "Balanced Intel board.",
    brandName: "Gigabyte",
    specs: { brand: "Gigabyte", socket: "LGA1700", ramType: "DDR5", formFactor: "ATX", chipset: "B760" },
  },
  {
    id: "mobo-20", sku: "MB-ASR-B450",
    name: "ASRock B450M Pro4", category: "Motherboard", price: 8000, stock: 29,
    image: "https://m.media-amazon.com/images/I/71ZMMyOQfOL.jpg",
    description: "Affordable AM4 board.",
    brandName: "ASRock",
    specs: { brand: "ASRock", socket: "AM4", ramType: "DDR4", formFactor: "Micro-ATX", chipset: "B450" },
  },
  {
    id: "mobo-21", sku: "MB-MSI-X570",
    name: "MSI X570 Gaming Edge", category: "Motherboard", price: 20500, stock: 12,
    image: "https://m.media-amazon.com/images/I/81zK8VZxZPL.jpg",
    description: "AM4 enthusiast board.",
    brandName: "MSI",
    specs: { brand: "MSI", socket: "AM4", ramType: "DDR4", formFactor: "ATX", chipset: "X570" },
  },
  {
    id: "mobo-22", sku: "MB-ASUS-A520",
    name: "ASUS Prime A520M-K", category: "Motherboard", price: 6500, stock: 42,
    image: "https://m.media-amazon.com/images/I/71ZMMyOQfOL.jpg",
    description: "Budget AM4 motherboard.",
    brandName: "ASUS",
    specs: { brand: "ASUS", socket: "AM4", ramType: "DDR4", formFactor: "Micro-ATX", chipset: "A520" },
  },
  {
    id: "mobo-23", sku: "MB-GIG-B650M",
    name: "Gigabyte B650M DS3H", category: "Motherboard", price: 13500, stock: 17,
    image: "https://m.media-amazon.com/images/I/81E6R7Y6dPL.jpg",
    description: "Compact AM5 board.",
    brandName: "Gigabyte",
    specs: { brand: "Gigabyte", socket: "AM5", ramType: "DDR5", formFactor: "Micro-ATX", chipset: "B650" },
  },
  {
    id: "mobo-24", sku: "MB-MSI-X670E",
    name: "MSI X670E Carbon", category: "Motherboard", price: 46000, stock: 6,
    image: "https://m.media-amazon.com/images/I/81zK8VZxZPL.jpg",
    description: "Ultra premium AM5 board.",
    brandName: "MSI",
    specs: { brand: "MSI", socket: "AM5", ramType: "DDR5", formFactor: "ATX", chipset: "X670" },
  },
  {
    id: "mobo-25", sku: "MB-ASR-H610",
    name: "ASRock H610M-HDV", category: "Motherboard", price: 6800, stock: 38,
    image: "https://m.media-amazon.com/images/I/71ZMMyOQfOL.jpg",
    description: "Entry Intel motherboard.",
    brandName: "ASRock",
    specs: { brand: "ASRock", socket: "LGA1700", ramType: "DDR4", formFactor: "Micro-ATX", chipset: "H610" },
  },

  // ── GRAPHICS CARDS ──────────────────────────────────────────────────────────
  {
    id: "gpu-1", sku: "GPU-NV-4090",
    name: "NVIDIA RTX 4090 Founders Edition", category: "Graphics Card", price: 185000, stock: 3,
    image: "https://m.media-amazon.com/images/I/71RgD3MP-hL._AC_UF1000,1000_QL80_.jpg",
    description: "The absolute best performance for 4K gaming and AI.",
    brandName: "NVIDIA",
    specs: { brand: "NVIDIA", wattage: "450", memory: "24GB", series: "40 Series" },
  },
  {
    id: "gpu-2", sku: "GPU-SAP-7800XT",
    name: "Sapphire Nitro+ AMD Radeon RX 7800 XT", category: "Graphics Card", price: 52000, stock: 20,
    image: "https://m.media-amazon.com/images/I/81zdqJr2TYL.jpg",
    description: "Great value for 1440p gaming.",
    brandName: "Sapphire",
    specs: { brand: "Sapphire", wattage: "263", memory: "16GB", series: "7000 Series" },
  },
  {
    id: "gpu-3", sku: "GPU-ZOT-4070",
    name: "Zotac Gaming GeForce RTX 4070 Twin Edge", category: "Graphics Card", price: 56000, stock: 25,
    image: "https://m.media-amazon.com/images/I/61KZsTaMtcL._AC_UF1000,1000_QL80_FMwebp_.jpg",
    description: "Compact 1440p card.",
    brandName: "Zotac",
    specs: { brand: "Zotac", wattage: "200", memory: "12GB", series: "40 Series" },
  },
  {
    id: "gpu-4", sku: "GPU-ASUS-3060",
    name: "ASUS Dual GeForce RTX 3060 V2 OC", category: "Graphics Card", price: 26000, stock: 40,
    image: "https://m.media-amazon.com/images/I/71hoPufXoDL._AC_UF1000,1000_QL80_.jpg",
    description: "The budget king for 1080p gaming.",
    brandName: "ASUS",
    specs: { brand: "ASUS", wattage: "170", memory: "12GB", series: "30 Series" },
  },
  {
    id: "gpu-5", sku: "GPU-GIG-6600",
    name: "Gigabyte Radeon RX 6600 Eagle", category: "Graphics Card", price: 19500, stock: 15,
    image: "https://m.media-amazon.com/images/I/6121pomHteL.jpg",
    description: "Entry level 1080p performer.",
    brandName: "Gigabyte",
    specs: { brand: "Gigabyte", wattage: "132", memory: "8GB", series: "6000 Series" },
  },

  // ── RAM ─────────────────────────────────────────────────────────────────────
  {
    id: "ram-1", sku: "RAM-GSK-32",
    name: "G.Skill Trident Z5 RGB 32GB (16GBx2)", category: "RAM", price: 12500, stock: 50,
    image: "https://m.media-amazon.com/images/I/61bc6zvEIIL.jpg",
    description: "High speed DDR5 6000MHz memory for enthusiasts.",
    brandName: "G.Skill",
    specs: { brand: "G.Skill", ramType: "DDR5", frequency: "6000MHz", capacity: "32GB" },
  },
  {
    id: "ram-2", sku: "RAM-COR-16",
    name: "Corsair Vengeance LPX 16GB (8GBx2)", category: "RAM", price: 4500, stock: 100,
    image: "https://m.media-amazon.com/images/I/51W4+1Da0IL._AC_UF1000,1000_QL80_.jpg",
    description: "Reliable DDR4 3200MHz memory.",
    brandName: "Corsair",
    specs: { brand: "Corsair", ramType: "DDR4", frequency: "3200MHz", capacity: "16GB" },
  },
  {
    id: "ram-3", sku: "RAM-KIN-8",
    name: "Kingston Fury Beast 8GB", category: "RAM", price: 2200, stock: 80,
    image: "https://m.media-amazon.com/images/I/71+pGDyVzrL.jpg",
    description: "Single stick DDR4 module.",
    brandName: "Kingston",
    specs: { brand: "Kingston", ramType: "DDR4", frequency: "3200MHz", capacity: "8GB" },
  },

  // ── COOLING ─────────────────────────────────────────────────────────────────
  {
    id: "cool-1", sku: "COOL-DEP-LS720",
    name: "DeepCool LS720 ARGB AIO", category: "Cooler", price: 11000, stock: 20,
    image: "https://cdn.deepcool.com/public/ProductFile/DEEPCOOL/Cooling/CPULiquidCoolers/LS720_WH/Overview/01.png?fm=webp&q=60",
    description: "360mm ARGB AIO Liquid Cooler.",
    brandName: "DeepCool",
    specs: { brand: "DeepCool", type: "AIO Liquid Cooler", size: "360mm" },
  },
  {
    id: "cool-2", sku: "COOL-NOC-D15",
    name: "Noctua NH-D15", category: "Cooler", price: 8500, stock: 15,
    image: "https://m.media-amazon.com/images/I/91Hw1zcAIjL.jpg",
    description: "Premium Air Cooler, dual tower design.",
    brandName: "Noctua",
    specs: { brand: "Noctua", type: "Air Cooler" },
  },
  {
    id: "cool-3", sku: "COOL-EK-WB",
    name: "EKWB Quantum Velocity CPU Water Block", category: "Cooler", price: 9500, stock: 5,
    image: "https://m.media-amazon.com/images/I/51w8kD-Y+2L._AC_UF1000,1000_QL80_.jpg",
    description: "High-end custom loop CPU Water Block.",
    brandName: "EKWB",
    specs: { brand: "EKWB", type: "Water Block", socket: "AM5/LGA1700" },
  },
  {
    id: "cool-4", sku: "COOL-COR-XD5",
    name: "Corsair Hydro X Series XD5 Pump", category: "Cooler", price: 14500, stock: 8,
    image: "https://m.media-amazon.com/images/I/61CL70frlAL._AC_UF1000,1000_QL80_.jpg",
    description: "RGB Pump and Reservoir Combo for custom loops.",
    brandName: "Corsair",
    specs: { brand: "Corsair", type: "Pump & Reservoir" },
  },

  // ── STORAGE ─────────────────────────────────────────────────────────────────
  {
    id: "stg-1", sku: "SSD-SAM-990",
    name: "Samsung 990 Pro 1TB", category: "Storage", price: 10500, stock: 40,
    image: "https://m.media-amazon.com/images/I/71XHEQZZW+L.jpg",
    description: "Blazing fast NVMe Gen4 SSD.",
    brandName: "Samsung",
    specs: { brand: "Samsung", type: "SSD", interface: "NVMe Gen4", capacity: "1TB" },
  },
  {
    id: "stg-2", sku: "HDD-WD-2TB",
    name: "Western Digital Blue 2TB HDD", category: "Storage", price: 4800, stock: 60,
    image: "https://m.media-amazon.com/images/I/71pzrrdIS2L.jpg",
    description: "Reliable storage for mass data.",
    brandName: "Western Digital",
    specs: { brand: "Western Digital", type: "HDD", interface: "SATA", capacity: "2TB" },
  },
  {
    id: "stg-3", sku: "SSD-CRU-500",
    name: "Crucial P3 500GB", category: "Storage", price: 3500, stock: 35,
    image: "https://m.media-amazon.com/images/I/51pMg25AthL.jpg",
    description: "Budget NVMe Gen3 SSD.",
    brandName: "Crucial",
    specs: { brand: "Crucial", type: "SSD", interface: "NVMe Gen3", capacity: "500GB" },
  },

  // ── PSU ─────────────────────────────────────────────────────────────────────
  {
    id: "psu-1", sku: "PSU-COR-850",
    name: "Corsair RM850e", category: "Power Supply", price: 11000, stock: 15,
    image: "https://m.media-amazon.com/images/I/61J0tIvkBYL.jpg",
    description: "850W 80 Plus Gold Rated Modular PSU.",
    brandName: "Corsair",
    specs: { brand: "Corsair", wattage: "850", efficiency: "Gold" },
  },
  {
    id: "psu-2", sku: "PSU-CM-550",
    name: "Cooler Master MWE 550 V2", category: "Power Supply", price: 4500, stock: 22,
    image: "https://m.media-amazon.com/images/I/81zTChlbPHL._AC_UF1000,1000_QL80_.jpg",
    description: "550W 80 Plus Bronze Rated PSU.",
    brandName: "Cooler Master",
    specs: { brand: "Cooler Master", wattage: "550", efficiency: "Bronze" },
  },
  {
    id: "psu-3", sku: "PSU-MSI-1000",
    name: "MSI MPG A1000G", category: "Power Supply", price: 16000, stock: 10,
    image: "https://m.media-amazon.com/images/I/719fJ78WuEL.jpg",
    description: "1000W PCIe 5.0 Ready Gold PSU.",
    brandName: "MSI",
    specs: { brand: "MSI", wattage: "1000", efficiency: "Gold" },
  },

  // ── CABINETS ────────────────────────────────────────────────────────────────
  {
    id: "cab-1", sku: "CAB-LIA-O11",
    name: "Lian Li O11 Dynamic Evo", category: "Cabinet", price: 14000, stock: 12,
    image: "https://m.media-amazon.com/images/I/61KmNQhuxvL._AC_UF1000,1000_QL80_.jpg",
    description: "The classic showcase Mid Tower chassis.",
    brandName: "Lian Li",
    specs: { brand: "Lian Li", formFactor: "Mid Tower", color: "Black" },
  },
  {
    id: "cab-2", sku: "CAB-COR-4000",
    name: "Corsair 4000D Airflow", category: "Cabinet", price: 7000, stock: 30,
    image: "https://m.media-amazon.com/images/I/71J4iohAlaL.jpg",
    description: "High airflow Mid Tower case.",
    brandName: "Corsair",
    specs: { brand: "Corsair", formFactor: "Mid Tower", color: "White" },
  },
  {
    id: "cab-3", sku: "CAB-CM-HAF",
    name: "Cooler Master HAF 700 Evo", category: "Cabinet", price: 35000, stock: 4,
    image: "https://m.media-amazon.com/images/I/61hC6R08S+L._AC_UF1000,1000_QL80_.jpg",
    description: "Massive Full Tower for extreme builds.",
    brandName: "Cooler Master",
    specs: { brand: "Cooler Master", formFactor: "Full Tower", color: "Titanium" },
  },

  // ── MONITORS ────────────────────────────────────────────────────────────────
  {
    id: "mon-1", sku: "MON-LG-27",
    name: "LG UltraGear 27GN950", category: "Monitor", price: 45000, stock: 5,
    image: "https://media.us.lg.com/transform/6747bdf5-28d0-4caa-a288-ba854a3c6553/Monitor_SYNC_mnt-27gn950-09_features_900x600?io=transform:fill,width:1536",
    description: "27 Inch 4K 144Hz Nano IPS Gaming Monitor.",
    brandName: "LG",
    specs: { brand: "LG", size: "27 Inch", resolution: "4K", type: "Gaming" },
  },
  {
    id: "mon-2", sku: "MON-BEN-24",
    name: "BenQ GW2480", category: "Monitor", price: 10000, stock: 40,
    image: "https://image.benq.com/is/image/benqco/gw2480l-left45?$ResponsivePreset$&fmt=png-alpha",
    description: "24 Inch Eye Care Monitor.",
    brandName: "BenQ",
    specs: { brand: "BenQ", size: "24 Inch", resolution: "1080p", type: "Professional" },
  },
  {
    id: "mon-3", sku: "MON-SAM-32",
    name: "Samsung Odyssey G7", category: "Monitor", price: 38000, stock: 8,
    image: "https://m.media-amazon.com/images/I/81UUzgE+FIL._AC_UF1000,1000_QL80_.jpg",
    description: "32 Inch Curved 240Hz Gaming Monitor.",
    brandName: "Samsung",
    specs: { brand: "Samsung", size: "32 Inch", resolution: "2K", type: "Gaming" },
  },

  // ── PERIPHERALS ─────────────────────────────────────────────────────────────
  {
    id: "per-1", sku: "PER-KEY-K2",
    name: "Keychron K2 V2", category: "Peripheral", price: 8000, stock: 10,
    image: "https://picsum.photos/300/300?random=15",
    description: "Wireless Mechanical Keyboard.",
    brandName: "Keychron",
    specs: { brand: "Keychron", type: "Mechanical Keyboard", connectivity: "Wireless" },
  },
  {
    id: "per-2", sku: "PER-LOG-GPX",
    name: "Logitech G Pro X Superlight", category: "Peripheral", price: 13000, stock: 8,
    image: "https://picsum.photos/300/300?random=16",
    description: "Ultra-lightweight wireless gaming mouse.",
    brandName: "Logitech",
    specs: { brand: "Logitech", type: "Gaming Mouse", connectivity: "Wireless" },
  },
  {
    id: "per-3", sku: "PER-HYP-CL2",
    name: "HyperX Cloud II", category: "Peripheral", price: 7500, stock: 25,
    image: "https://picsum.photos/300/300?random=38",
    description: "Legendary wired gaming headset.",
    brandName: "HyperX",
    specs: { brand: "HyperX", type: "Headset", connectivity: "Wired" },
  },

  // ── NETWORKING ──────────────────────────────────────────────────────────────
  {
    id: "net-1", sku: "NET-TP-AX73",
    name: "TP-Link Archer AX73", category: "Networking", price: 9000, stock: 12,
    image: "https://picsum.photos/300/300?random=39",
    description: "AX5400 Dual-Band Gigabit Wi-Fi 6 Router.",
    brandName: "TP-Link",
    specs: { brand: "TP-Link", type: "Router", standard: "WiFi 6" },
  },
  {
    id: "net-2", sku: "NET-DL-8P",
    name: "D-Link 8 Port Gigabit Switch", category: "Networking", price: 1500, stock: 50,
    image: "https://picsum.photos/300/300?random=40",
    description: "Unmanaged Gigabit Desktop Switch.",
    brandName: "D-Link",
    specs: { brand: "D-Link", type: "Switch", ports: "8" },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// TAGS
// ─────────────────────────────────────────────────────────────────────────────

const TAGS_DATA = [
  { name: "Gaming", productIds: ["cpu-1", "cpu-2", "cpu-7", "gpu-1", "gpu-2", "gpu-3", "gpu-4", "gpu-5", "mon-1", "mon-3"] },
  { name: "Workstation", productIds: ["cpu-5", "cpu-6", "cpu-17", "gpu-1", "ram-1"] },
  { name: "Budget", productIds: ["cpu-3", "cpu-10", "cpu-12", "cpu-19", "mobo-3", "mobo-9", "mobo-15", "ram-2", "ram-3", "stg-3", "psu-2", "cab-2", "gpu-4", "gpu-5"] },
  { name: "High-End", productIds: ["cpu-2", "cpu-5", "cpu-6", "cpu-8", "cpu-17", "gpu-1", "mobo-1", "mobo-24", "ram-1"] },
  { name: "AMD", productIds: ["cpu-1", "cpu-3", "cpu-5", "cpu-6", "cpu-7", "cpu-9", "cpu-11", "cpu-13", "cpu-15", "cpu-17", "cpu-19", "cpu-21", "cpu-23", "cpu-25", "gpu-2", "gpu-5"] },
  { name: "Intel", productIds: ["cpu-2", "cpu-4", "cpu-8", "cpu-10", "cpu-12", "cpu-14", "cpu-16", "cpu-18", "cpu-20", "cpu-22", "cpu-24", "cpu-26"] },
  { name: "DDR5", productIds: ["ram-1", "mobo-1", "mobo-2", "mobo-4", "mobo-6", "mobo-7", "mobo-8", "mobo-10", "mobo-16", "mobo-18", "mobo-19", "mobo-24"] },
  { name: "NVMe", productIds: ["stg-1", "stg-3"] },
  { name: "RGB", productIds: ["ram-1", "cool-1", "cab-1", "cab-2"] },
  { name: "WiFi", productIds: ["mobo-1", "mobo-2", "net-1"] },
];

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────

interface SeedAttributeDef {
  key: string;
  label: string;
  type: string;
  required: boolean;
  sortOrder: number;
  options?: string[];
  unit?: string;
  dependencyKey?: string;
  dependencyValue?: string;
}

const CATEGORY_SCHEMAS_DATA: { category: Category; attributes: SeedAttributeDef[] }[] = [
  {
    category: Category.PROCESSOR,
    attributes: [
      { key: "socket", label: "Intel Socket", type: "select", required: true, options: ["LGA1151", "LGA1200", "LGA1700", "LGA1851"], sortOrder: 0, dependencyKey: "brand", dependencyValue: "Intel" },
      { key: "socket", label: "AMD Socket", type: "select", required: true, options: ["AM4", "AM5", "sTR5"], sortOrder: 1, dependencyKey: "brand", dependencyValue: "AMD" },
      { key: "cores", label: "Cores", type: "number", required: true, sortOrder: 2 },
      { key: "generation", label: "Generation", type: "select", required: false, options: ["9th Gen", "10th Gen", "11th Gen", "12th Gen", "13th Gen", "14th Gen"], sortOrder: 3, dependencyKey: "brand", dependencyValue: "Intel" },
      { key: "series", label: "Series", type: "select", required: false, options: ["3000 Series", "5000 Series", "7000 Series", "8000 Series", "9000 Series", "Threadripper"], sortOrder: 4, dependencyKey: "brand", dependencyValue: "AMD" },
      { key: "wattage", label: "TDP (Watts)", type: "number", required: true, unit: "W", sortOrder: 5 },
      { key: "ramType", label: "RAM Support", type: "select", required: true, options: ["DDR4", "DDR5"], sortOrder: 6 },
      { key: "family", label: "CPU Family", type: "select", required: false, options: ["Athlon", "Ryzen 3", "Ryzen 5", "Ryzen 7", "Ryzen 9"], sortOrder: 7, dependencyKey: "brand", dependencyValue: "AMD" },
      { key: "family", label: "CPU Line", type: "select", required: false, options: ["Core i3", "Core i5", "Core i7", "Core i9", "Core Ultra 5", "Core Ultra 7", "Core Ultra 9"], sortOrder: 8, dependencyKey: "brand", dependencyValue: "Intel" },
      { key: "maxMemory", label: "Max Memory", type: "select", required: false, options: ["64 GB", "128 GB", "192 GB", "256 GB"], sortOrder: 9 },
      { key: "integratedGraphics", label: "Integrated Graphics", type: "select", required: false, options: ["No", "Intel UHD Graphics 630", "Intel UHD Graphics 730", "Intel UHD Graphics 770", "Radeon Graphics"], sortOrder: 10 },
    ],
  },
  {
    category: Category.MOTHERBOARD,
    attributes: [
      { key: "platform", label: "Platform", type: "select", required: true, options: ["AMD", "Intel"], sortOrder: 0 },
      { key: "socket", label: "Socket", type: "select", required: true, options: ["AM4", "AM5", "sTR5", "LGA1151", "LGA1200", "LGA1700", "LGA1851"], sortOrder: 1 },
      { key: "chipset", label: "Chipset", type: "select", required: true, options: ["A520", "B450", "B550", "B650", "B760", "X570", "X670", "X870", "H510", "H610", "Z690", "Z790", "Z890"], sortOrder: 2 },
      { key: "formFactor", label: "Form Factor", type: "select", required: true, options: ["ATX", "Micro-ATX", "E-ATX", "Mini-ITX"], sortOrder: 3 },
      { key: "ramType", label: "Memory Type", type: "select", required: true, options: ["DDR4", "DDR5"], sortOrder: 4 },
    ],
  },
  {
    category: Category.GPU,
    attributes: [
      { key: "chipset", label: "Chipset", type: "select", required: true, options: ["AMD RADEON", "NVIDIA GEFORCE", "NVIDIA QUADRO", "Intel Arc"], sortOrder: 0 },
      { key: "model", label: "GPU Model", type: "text", required: true, sortOrder: 1 },
      { key: "memory", label: "VRAM", type: "text", required: true, sortOrder: 2 },
      { key: "memoryType", label: "Memory Type", type: "select", required: true, options: ["DDR3", "GDDR5", "GDDR6", "GDDR6X", "GDDR7"], sortOrder: 3 },
      { key: "pcie", label: "PCI Express", type: "select", required: false, options: ["2.0", "3.0", "4.0", "5.0"], sortOrder: 4 },
      { key: "wattage", label: "TDP (W)", type: "number", required: true, unit: "W", sortOrder: 5 },
      { key: "length", label: "Length", type: "number", required: false, unit: "mm", sortOrder: 6 },
    ],
  },
  {
    category: Category.RAM,
    attributes: [
      { key: "ramType", label: "Memory Type", type: "select", required: true, options: ["DDR3", "DDR4", "DDR5"], sortOrder: 0 },
      { key: "capacity", label: "Capacity", type: "text", required: true, sortOrder: 1 },
      { key: "frequency", label: "Speed", type: "text", required: true, sortOrder: 2 },
      { key: "kit", label: "Kit Type", type: "select", required: false, options: ["4x1", "8x1", "16x1", "16x2", "24x2", "32x2"], sortOrder: 3 },
      { key: "series", label: "Product Series", type: "text", required: false, sortOrder: 4 },
    ],
  },
  {
    category: Category.STORAGE,
    attributes: [
      { key: "type", label: "Category", type: "select", required: true, options: ["Internal SSD", "Internal HDD", "External SSD", "External HDD", "Enterprise SSD", "Pen Drive"], sortOrder: 0 },
      { key: "capacity", label: "Capacity", type: "text", required: true, sortOrder: 1 },
      { key: "interface", label: "Interface", type: "text", required: false, sortOrder: 2 },
      { key: "series", label: "Series", type: "text", required: false, sortOrder: 3 },
    ],
  },
  {
    category: Category.PSU,
    attributes: [
      { key: "wattage", label: "Wattage", type: "number", required: true, unit: "W", sortOrder: 0 },
      { key: "efficiency", label: "Certification", type: "select", required: true, options: ["Bronze", "Gold", "Platinum", "Silver", "Titanium"], sortOrder: 1 },
      { key: "modular", label: "Modular", type: "select", required: true, options: ["Fully", "Non", "Semi"], sortOrder: 2 },
      { key: "series", label: "Series", type: "text", required: false, sortOrder: 3 },
      { key: "pcie62", label: "PCIe 6+2 Connectors", type: "number", required: false, sortOrder: 4 },
      { key: "sata", label: "SATA Connectors", type: "number", required: false, sortOrder: 5 },
      { key: "peripheral4pin", label: "Peripheral 4-Pin", type: "number", required: false, sortOrder: 6 },
      { key: "formFactor", label: "Form Factor", type: "select", required: false, options: ["ATX", "SFX", "SFX-L", "TFX"], sortOrder: 7 },
    ],
  },
  {
    category: Category.CABINET,
    attributes: [
      { key: "formFactor", label: "Cabinet Size", type: "select", required: true, options: ["Full", "Mid", "Mini", "Super", "SFF"], sortOrder: 0 },
      { key: "motherboardSupport", label: "Motherboard Size", type: "select", required: true, options: ["ATX", "E-ATX", "ITX", "M-ATX", "M-ITX"], sortOrder: 1 },
      { key: "radiatorSupport", label: "Radiator Support", type: "text", required: false, sortOrder: 2 },
      { key: "color", label: "Color", type: "text", required: false, sortOrder: 3 },
      { key: "maxGpuLength", label: "Max GPU Length", type: "number", required: false, unit: "mm", sortOrder: 4 },
      { key: "maxCoolerHeight", label: "Max Cooler Height", type: "number", required: false, unit: "mm", sortOrder: 5 },
      { key: "psuFormFactorSupport", label: "PSU Support", type: "multi-select", required: false, options: ["ATX", "SFX", "SFX-L", "TFX"], sortOrder: 6 },
    ],
  },
  {
    category: Category.COOLER,
    attributes: [
      { key: "type", label: "Cooling Type", type: "select", required: true, options: ["AIR COOLER", "LIQUID AIO COOLER", "Water Block", "Pump & Reservoir"], sortOrder: 0 },
      { key: "socket", label: "Socket Support", type: "multi-select", required: false, options: ["AM2", "AM2+", "AM3", "AM3+", "AM4", "AM5", "LGA1151", "LGA1200", "LGA1700"], sortOrder: 1 },
      { key: "radiatorSize", label: "Radiator Size", type: "select", required: false, options: ["240mm", "280mm", "360mm", "420mm"], sortOrder: 2 },
      { key: "fanSize", label: "Fan Size", type: "select", required: false, options: ["40mm", "60mm", "90mm", "92mm", "120mm", "140mm"], sortOrder: 3 },
      { key: "pwm", label: "PWM Controller", type: "select", required: false, options: ["NA", "YES"], sortOrder: 4 },
      { key: "height", label: "Cooler Height", type: "number", required: false, unit: "mm", sortOrder: 5 },
    ],
  },
  {
    category: Category.MONITOR,
    attributes: [
      { key: "size", label: "Screen Size", type: "select", required: true, options: ["22 Inch", "24 Inch", "27 Inch", "32 Inch", "34 Inch", "49 Inch"], sortOrder: 0 },
      { key: "displayType", label: "Display Type", type: "select", required: false, options: ["FHD", "QHD", "UHD", "DQHD", "5K HDR"], sortOrder: 1 },
      { key: "panel", label: "Panel Type", type: "select", required: false, options: ["IPS", "OLED", "QD-OLED", "TN", "VA"], sortOrder: 2 },
      { key: "resolution", label: "Resolution", type: "select", required: true, options: ["1080p", "1440p", "2K", "4K", "5K"], sortOrder: 3 },
      { key: "responseTime", label: "Response Time", type: "text", required: false, sortOrder: 4 },
      { key: "refreshRate", label: "Refresh Rate", type: "select", required: false, options: ["60Hz", "75Hz", "144Hz", "165Hz", "240Hz", "360Hz"], sortOrder: 5 },
      { key: "surface", label: "Screen Surface", type: "select", required: false, options: ["CURVED", "FLAT"], sortOrder: 6 },
      { key: "connectivity", label: "Connectivity", type: "multi-select", required: false, options: ["D-SUB", "DISPLAY PORT", "DVI", "HDMI", "USB-C"], sortOrder: 7 },
      { key: "type", label: "Type", type: "select", required: false, options: ["Gaming", "Professional", "Curved"], sortOrder: 8 },
    ],
  },
  {
    category: Category.PERIPHERAL,
    attributes: [
      { key: "type", label: "Type", type: "select", required: true, options: ["Headset", "Keyboard", "Mouse", "Mouse Pad", "Speaker", "Headphone", "Webcam", "Software"], sortOrder: 0 },
      { key: "connectivity", label: "Connectivity", type: "select", required: false, options: ["Wired", "Wireless", "Bluetooth"], sortOrder: 1 },
    ],
  },
  {
    category: Category.NETWORKING,
    attributes: [
      { key: "type", label: "Device Type", type: "select", required: true, options: ["Router", "Switch", "Adapter", "Cable"], sortOrder: 0 },
    ],
  },
  {
    category: Category.LAPTOP,
    attributes: [
      { key: "processor", label: "Processor", type: "select", required: true, options: ["AMD Ryzen 3", "AMD Ryzen 5", "AMD Ryzen 7", "Intel Core 5", "Intel Core i3", "Intel Core i5", "Intel Core i7"], sortOrder: 0 },
      { key: "processorSeries", label: "Processor Series", type: "select", required: false, options: ["Intel 12th Gen", "Intel 13th Gen", "Intel 14th Gen", "Ryzen 5000 Series", "Ryzen 7000 Series"], sortOrder: 1 },
      { key: "memorySize", label: "Memory Size", type: "select", required: true, options: ["8GB", "16GB", "32GB"], sortOrder: 2 },
      { key: "memoryType", label: "Memory Type", type: "select", required: true, options: ["DDR4", "DDR5", "LPDDR5"], sortOrder: 3 },
      { key: "ssd", label: "SSD", type: "select", required: false, options: ["256GB NVMe", "512GB NVMe", "1TB NVMe"], sortOrder: 4 },
      { key: "graphics", label: "Graphics", type: "select", required: false, options: ["AMD Radeon", "Integrated", "Intel Graphics", "Iris Xe", "UHD", "NVIDIA RTX 3050", "NVIDIA RTX 4050", "NVIDIA RTX 4060"], sortOrder: 5 },
      { key: "screenResolution", label: "Screen Resolution", type: "select", required: false, options: ["1080p", "1440p", "2K", "4K"], sortOrder: 6 },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// FILTER CONFIG
// ─────────────────────────────────────────────────────────────────────────────

interface SeedFilterDef {
  key: string;
  label: string;
  type: FilterType;
  options?: string[];
  min?: number;
  max?: number;
  dependencyKey?: string;
  dependencyValue?: string;
  sortOrder: number;
}

const FILTER_CONFIG_DATA: { category: Category; filters: SeedFilterDef[] }[] = [
  {
    category: Category.PROCESSOR,
    filters: [
      { key: "search_description", label: "Search in Descriptions", type: FilterType.search, sortOrder: 0 },
      { key: "search_subcategory", label: "Search in Subcategories", type: FilterType.search, sortOrder: 1 },
      { key: "specs.brand", label: "Manufacturer", type: FilterType.checkbox, options: ["AMD", "Intel"], sortOrder: 2 },
      { key: "stock_status", label: "Stock Status", type: FilterType.checkbox, options: ["In Stock", "Out of Stock"], sortOrder: 3 },
      { key: "specs.family", label: "CPU", type: FilterType.checkbox, options: ["Athlon", "Ryzen 3", "Ryzen 5", "Ryzen 7", "Ryzen 9"], sortOrder: 4, dependencyKey: "specs.brand", dependencyValue: "AMD" },
      { key: "specs.cores", label: "Cores", type: FilterType.checkbox, options: ["2", "4", "6", "8", "12", "16", "24"], sortOrder: 5, dependencyKey: "specs.brand", dependencyValue: "AMD" },
      { key: "specs.series", label: "Series", type: FilterType.checkbox, options: ["3000 Series", "5000 Series", "7000 Series", "8000 Series", "9000 Series"], sortOrder: 6, dependencyKey: "specs.brand", dependencyValue: "AMD" },
      { key: "specs.socket", label: "Socket", type: FilterType.checkbox, options: ["AM4", "AM5"], sortOrder: 7, dependencyKey: "specs.brand", dependencyValue: "AMD" },
      { key: "specs.maxMemory", label: "Max Memory Support", type: FilterType.checkbox, options: ["64 GB", "128 GB", "192 GB", "256 GB"], sortOrder: 8, dependencyKey: "specs.brand", dependencyValue: "AMD" },
      { key: "specs.integratedGraphics", label: "Integrated Graphics", type: FilterType.checkbox, options: ["No", "Radeon Graphics", "Radeon Vega 3", "Radeon Vega 8", "Radeon Vega 11"], sortOrder: 9, dependencyKey: "specs.brand", dependencyValue: "AMD" },
      { key: "specs.family", label: "CPU", type: FilterType.checkbox, options: ["Core Ultra 5", "Core Ultra 7", "Core Ultra 9", "Core i3", "Core i5", "Core i7", "Core i9"], sortOrder: 10, dependencyKey: "specs.brand", dependencyValue: "Intel" },
      { key: "specs.cores", label: "Cores", type: FilterType.checkbox, options: ["2", "4", "6", "8", "10", "12", "14", "20", "24"], sortOrder: 11, dependencyKey: "specs.brand", dependencyValue: "Intel" },
      { key: "specs.generation", label: "Series", type: FilterType.checkbox, options: ["9th Gen", "10th Gen", "11th Gen", "12th Gen", "13th Gen", "14th Gen"], sortOrder: 12, dependencyKey: "specs.brand", dependencyValue: "Intel" },
      { key: "specs.socket", label: "Socket", type: FilterType.checkbox, options: ["LGA1151", "LGA1200", "LGA1700", "LGA1851"], sortOrder: 13, dependencyKey: "specs.brand", dependencyValue: "Intel" },
      { key: "specs.maxMemory", label: "Max Memory Support", type: FilterType.checkbox, options: ["64 GB", "128 GB", "192 GB", "256 GB"], sortOrder: 14, dependencyKey: "specs.brand", dependencyValue: "Intel" },
      { key: "specs.integratedGraphics", label: "Integrated Graphics", type: FilterType.checkbox, options: ["No", "Intel UHD Graphics 630", "Intel UHD Graphics 730", "Intel UHD Graphics 770"], sortOrder: 15, dependencyKey: "specs.brand", dependencyValue: "Intel" },
    ],
  },
  {
    category: Category.COOLER,
    filters: [
      { key: "specs.brand", label: "Manufacturer", type: FilterType.checkbox, options: ["AEROCOOL", "ALSEYE", "Ant Esports", "ANTEC", "ARCTIC", "Cooler Master", "Corsair", "DeepCool", "Lian Li", "Noctua", "NZXT"], sortOrder: 0 },
      { key: "stock_status", label: "Stock Status", type: FilterType.checkbox, options: ["In Stock", "Out of Stock"], sortOrder: 1 },
      { key: "specs.type", label: "Cooling Type", type: FilterType.checkbox, options: ["AIR COOLER", "LIQUID AIO COOLER"], sortOrder: 2 },
      { key: "specs.socket", label: "Socket Support", type: FilterType.checkbox, options: ["AM2", "AM2+", "AM3", "AM3+", "AM4", "AM5", "LGA1151", "LGA1200", "LGA1700"], sortOrder: 3 },
      { key: "specs.radiatorSize", label: "Radiator Size", type: FilterType.checkbox, options: ["240mm", "280mm", "360mm", "420mm"], sortOrder: 4 },
      { key: "specs.fanSize", label: "Fan Size", type: FilterType.checkbox, options: ["40mm", "60mm", "90mm", "92mm", "120mm", "140mm"], sortOrder: 5 },
      { key: "specs.pwm", label: "PWM Controller", type: FilterType.checkbox, options: ["NA", "YES"], sortOrder: 6 },
    ],
  },
  {
    category: Category.MOTHERBOARD,
    filters: [
      { key: "specs.brand", label: "Manufacturer", type: FilterType.checkbox, options: ["ASROCK", "ASUS", "GIGABYTE", "MSI"], sortOrder: 0 },
      { key: "stock_status", label: "Stock Status", type: FilterType.checkbox, options: ["In Stock", "Out of Stock"], sortOrder: 1 },
      { key: "specs.platform", label: "Platform", type: FilterType.checkbox, options: ["AMD", "Intel"], sortOrder: 2 },
      { key: "specs.socket", label: "Socket", type: FilterType.checkbox, options: ["AM4", "AM5"], sortOrder: 3, dependencyKey: "specs.platform", dependencyValue: "AMD" },
      { key: "specs.chipset", label: "Chipset", type: FilterType.checkbox, options: ["A520", "B450", "B550", "B650", "X570", "X670", "X870"], sortOrder: 4, dependencyKey: "specs.platform", dependencyValue: "AMD" },
      { key: "specs.ramType", label: "Supported Memory Type", type: FilterType.checkbox, options: ["DDR4", "DDR5"], sortOrder: 5, dependencyKey: "specs.platform", dependencyValue: "AMD" },
      { key: "specs.formFactor", label: "Form Factor", type: FilterType.checkbox, options: ["ATX", "Micro-ATX", "Mini-ITX", "E-ATX"], sortOrder: 6, dependencyKey: "specs.platform", dependencyValue: "AMD" },
      { key: "specs.socket", label: "Socket", type: FilterType.checkbox, options: ["LGA1151", "LGA1200", "LGA1700", "LGA1851"], sortOrder: 7, dependencyKey: "specs.platform", dependencyValue: "Intel" },
      { key: "specs.chipset", label: "Chipset", type: FilterType.checkbox, options: ["B760", "H510", "H610", "Z690", "Z790", "Z890"], sortOrder: 8, dependencyKey: "specs.platform", dependencyValue: "Intel" },
      { key: "specs.ramType", label: "Supported Memory Type", type: FilterType.checkbox, options: ["DDR4", "DDR5"], sortOrder: 9, dependencyKey: "specs.platform", dependencyValue: "Intel" },
      { key: "specs.formFactor", label: "Form Factor", type: FilterType.checkbox, options: ["ATX", "Micro-ATX", "Mini-ITX", "E-ATX"], sortOrder: 10, dependencyKey: "specs.platform", dependencyValue: "Intel" },
    ],
  },
  {
    category: Category.GPU,
    filters: [
      { key: "specs.brand", label: "Manufacturer", type: FilterType.checkbox, options: ["ASROCK", "ASUS", "GALAX", "GIGABYTE", "INNO3D", "MSI", "Sapphire", "Zotac"], sortOrder: 0 },
      { key: "stock_status", label: "Stock Status", type: FilterType.checkbox, options: ["In Stock", "Out of Stock"], sortOrder: 1 },
      { key: "specs.chipset", label: "Chipset", type: FilterType.checkbox, options: ["AMD RADEON", "NVIDIA GEFORCE", "NVIDIA QUADRO", "Intel Arc"], sortOrder: 2 },
      { key: "specs.model", label: "GPU", type: FilterType.checkbox, options: ["A400", "A1000", "GT 710", "GT 730", "GT 1030", "GTX 1650", "GTX 1660", "RTX 3060", "RTX 4060", "RTX 4070", "RTX 4080", "RTX 4090", "RX 7600", "RX 7800 XT"], sortOrder: 3 },
      { key: "specs.pcie", label: "PCI EXPRESS", type: FilterType.checkbox, options: ["2.0", "3.0", "4.0", "5.0"], sortOrder: 4 },
      { key: "specs.memory", label: "Memory Size", type: FilterType.checkbox, options: ["2GB", "4GB", "6GB", "8GB", "12GB", "16GB", "20GB", "24GB"], sortOrder: 5 },
      { key: "specs.memoryType", label: "Memory Type", type: FilterType.checkbox, options: ["DDR3", "GDDR5", "GDDR6", "GDDR6X", "GDDR7"], sortOrder: 6 },
    ],
  },
  {
    category: Category.RAM,
    filters: [
      { key: "specs.brand", label: "Manufacturer", type: FilterType.checkbox, options: ["ACER", "ADATA", "CORSAIR", "CRUCIAL", "EVM", "G.Skill", "Kingston", "TeamGroup"], sortOrder: 0 },
      { key: "stock_status", label: "Stock Status", type: FilterType.checkbox, options: ["In Stock", "Out of Stock"], sortOrder: 1 },
      { key: "specs.series", label: "Product Series", type: FilterType.checkbox, options: ["AEGIS", "DOMINATOR PLATINUM RGB", "DOMINATOR RGB DDR5", "DOMINATOR TITANIUM RGB DDR5", "FURY BEAST", "TRIDENT Z5", "VENGEANCE"], sortOrder: 2 },
      { key: "specs.ramType", label: "Memory Type", type: FilterType.checkbox, options: ["DDR4", "DDR5"], sortOrder: 3 },
      { key: "specs.capacity", label: "Capacity", type: FilterType.checkbox, options: ["4GB", "8GB", "16GB", "32GB", "48GB", "64GB"], sortOrder: 4 },
      { key: "specs.kit", label: "Kit Type", type: FilterType.checkbox, options: ["4x1", "8x1", "16x1", "16x2", "24x2", "32x2"], sortOrder: 5 },
      { key: "specs.frequency", label: "Speed", type: FilterType.checkbox, options: ["2666 MHz", "3200 MHz", "4800 MHz", "5200 MHz", "5600 MHz", "6000 MHz"], sortOrder: 6 },
    ],
  },
  {
    category: Category.STORAGE,
    filters: [
      { key: "specs.brand", label: "Manufacturer", type: FilterType.checkbox, options: ["ACER", "ADATA", "ADDLINK", "Ant Esports", "ASUS", "Crucial", "Kingston", "Samsung", "Seagate", "Western Digital"], sortOrder: 0 },
      { key: "stock_status", label: "Stock Status", type: FilterType.checkbox, options: ["In Stock", "Out of Stock"], sortOrder: 1 },
      { key: "specs.type", label: "Category", type: FilterType.checkbox, options: ["Enterprise SSD", "External HDD", "External SSD", "Internal HDD", "Internal SSD", "Pen Drive"], sortOrder: 2 },
      { key: "specs.series", label: "Series", type: FilterType.checkbox, options: ["690 NEO", "870 EVO", "990 EVO", "990 PRO", "9100 PRO"], sortOrder: 3 },
      { key: "specs.capacity", label: "Capacity", type: FilterType.checkbox, options: ["500GB", "1TB", "1.92TB", "2TB", "3.84TB", "4TB", "8TB"], sortOrder: 4 },
    ],
  },
  {
    category: Category.PSU,
    filters: [
      { key: "specs.brand", label: "Manufacturer", type: FilterType.checkbox, options: ["Ant Esports", "ANTEC", "ASUS", "COOLER MASTER", "CORSAIR", "DeepCool", "MSI", "Seasonic"], sortOrder: 0 },
      { key: "stock_status", label: "Stock Status", type: FilterType.checkbox, options: ["In Stock", "Out of Stock"], sortOrder: 1 },
      { key: "specs.wattage", label: "Wattage", type: FilterType.checkbox, options: ["400", "450", "500", "520", "550", "650", "750", "850", "1000", "1200"], sortOrder: 2 },
      { key: "specs.series", label: "Series", type: FilterType.checkbox, options: ["ATOM", "AURA", "AXi", "C", "CSK", "HX", "RM", "RMx"], sortOrder: 3 },
      { key: "specs.efficiency", label: "Certification", type: FilterType.checkbox, options: ["Bronze", "Gold", "Platinum", "Silver", "Titanium"], sortOrder: 4 },
      { key: "specs.modular", label: "Modular", type: FilterType.checkbox, options: ["Fully", "Non", "Semi"], sortOrder: 5 },
      { key: "specs.pcie62", label: "PCIe Connector (6+2)", type: FilterType.checkbox, options: ["1", "2", "3", "4", "5"], sortOrder: 6 },
      { key: "specs.sata", label: "SATA Connector", type: FilterType.checkbox, options: ["2", "3", "4", "5", "6"], sortOrder: 7 },
      { key: "specs.peripheral4pin", label: "Peripheral 4-Pin", type: FilterType.checkbox, options: ["1", "2", "3", "4", "5"], sortOrder: 8 },
    ],
  },
  {
    category: Category.CABINET,
    filters: [
      { key: "specs.brand", label: "Manufacturer", type: FilterType.checkbox, options: ["AEROCOOL", "Ant Esports", "ANTEC", "ARCTIC", "ASUS", "Cooler Master", "Corsair", "Lian Li", "NZXT"], sortOrder: 0 },
      { key: "stock_status", label: "Stock Status", type: FilterType.checkbox, options: ["In Stock", "Out of Stock"], sortOrder: 1 },
      { key: "specs.formFactor", label: "Cabinet Size", type: FilterType.checkbox, options: ["Full", "Mid", "Mini", "Super", "SFF"], sortOrder: 2 },
      { key: "specs.motherboardSupport", label: "Motherboard Size", type: FilterType.checkbox, options: ["ATX", "E-ATX", "ITX", "M-ATX", "M-ITX"], sortOrder: 3 },
      { key: "specs.radiatorSupport", label: "Radiator Support", type: FilterType.checkbox, options: ["120mm", "140mm", "240mm", "280mm", "360mm"], sortOrder: 4 },
    ],
  },
  {
    category: Category.MONITOR,
    filters: [
      { key: "specs.brand", label: "Manufacturer", type: FilterType.checkbox, options: ["AOC", "ASUS", "BENQ", "COOLER MASTER", "DELL", "LG", "MSI", "Samsung", "ViewSonic"], sortOrder: 0 },
      { key: "stock_status", label: "Stock Status", type: FilterType.checkbox, options: ["In Stock", "Out of Stock"], sortOrder: 1 },
      { key: "specs.size", label: "Screen Size", type: FilterType.checkbox, options: ["22 Inch", "24 Inch", "27 Inch", "32 Inch", "34 Inch", "49 Inch"], sortOrder: 2 },
      { key: "specs.displayType", label: "Display Type", type: FilterType.checkbox, options: ["FHD", "QHD", "UHD", "DQHD", "5K HDR"], sortOrder: 3 },
      { key: "specs.panel", label: "Panel Type", type: FilterType.checkbox, options: ["IPS", "OLED", "QD-OLED", "TN", "VA"], sortOrder: 4 },
      { key: "specs.resolution", label: "Resolution", type: FilterType.checkbox, options: ["1080p", "1440p", "2K", "4K", "5K"], sortOrder: 5 },
      { key: "specs.responseTime", label: "Response Time", type: FilterType.checkbox, options: ["0.5ms", "1ms", "2ms", "4ms", "5ms"], sortOrder: 6 },
      { key: "specs.refreshRate", label: "Refresh Rate", type: FilterType.checkbox, options: ["60Hz", "75Hz", "144Hz", "165Hz", "240Hz", "360Hz"], sortOrder: 7 },
      { key: "specs.surface", label: "Screen Surface", type: FilterType.checkbox, options: ["CURVED", "FLAT"], sortOrder: 8 },
      { key: "specs.connectivity", label: "Connectivity", type: FilterType.checkbox, options: ["D-SUB", "DISPLAY PORT", "DVI", "HDMI", "USB-C"], sortOrder: 9 },
    ],
  },
  {
    category: Category.PERIPHERAL,
    filters: [
      { key: "specs.brand", label: "Manufacturer", type: FilterType.checkbox, options: [], sortOrder: 0 },
      { key: "stock_status", label: "Stock Status", type: FilterType.checkbox, options: ["In Stock", "Out of Stock"], sortOrder: 1 },
      { key: "specs.type", label: "Type", type: FilterType.checkbox, options: ["Headset", "Keyboard", "Mouse", "Mouse Pad", "Speaker", "Headphone", "Webcam", "Software"], sortOrder: 2 },
      { key: "specs.connectivity", label: "Connectivity", type: FilterType.checkbox, options: ["Wired", "Wireless", "Bluetooth"], sortOrder: 3 },
    ],
  },
  {
    category: Category.NETWORKING,
    filters: [
      { key: "specs.brand", label: "Manufacturer", type: FilterType.checkbox, options: [], sortOrder: 0 },
      { key: "stock_status", label: "Stock Status", type: FilterType.checkbox, options: ["In Stock", "Out of Stock"], sortOrder: 1 },
      { key: "specs.type", label: "Device Type", type: FilterType.checkbox, options: ["Router", "Switch", "Adapter", "Cable"], sortOrder: 2 },
    ],
  },
  {
    category: Category.LAPTOP,
    filters: [
      { key: "specs.brand", label: "Manufacturer", type: FilterType.checkbox, options: ["ACER", "ASUS", "HP", "MSI", "Lenovo", "Dell"], sortOrder: 0 },
      { key: "stock_status", label: "Stock Status", type: FilterType.checkbox, options: ["In Stock", "Out of Stock"], sortOrder: 1 },
      { key: "specs.processor", label: "Processor", type: FilterType.checkbox, options: ["AMD Ryzen 3", "AMD Ryzen 5", "AMD Ryzen 7", "Intel Core 5", "Intel Core i3", "Intel Core i5", "Intel Core i7"], sortOrder: 2 },
      { key: "specs.processorSeries", label: "Processor Series", type: FilterType.checkbox, options: ["Intel 12th Gen", "Intel 13th Gen", "Intel 14th Gen", "Ryzen 5000 Series", "Ryzen 7000 Series"], sortOrder: 3 },
      { key: "specs.memorySize", label: "Memory Size", type: FilterType.checkbox, options: ["8GB", "16GB", "32GB"], sortOrder: 4 },
      { key: "specs.memoryType", label: "Memory Type", type: FilterType.checkbox, options: ["DDR4", "DDR5", "LPDDR5"], sortOrder: 5 },
      { key: "specs.ssd", label: "SSD", type: FilterType.checkbox, options: ["256GB NVMe", "512GB NVMe", "1TB NVMe"], sortOrder: 6 },
      { key: "specs.graphics", label: "Graphics", type: FilterType.checkbox, options: ["AMD Radeon", "Integrated", "Intel Graphics", "Iris Xe", "UHD", "NVIDIA RTX 3050", "NVIDIA RTX 4050", "NVIDIA RTX 4060"], sortOrder: 7 },
      { key: "specs.screenResolution", label: "Screen Resolution", type: FilterType.checkbox, options: ["1080p", "1440p", "2K", "4K"], sortOrder: 8 },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMERS
// ─────────────────────────────────────────────────────────────────────────────

const CUSTOMERS_DATA = [
  {
    id: "cust-1",
    name: "Arjun Kapoor",
    email: "arjun.kapoor@gmail.com",
    phone: "+91-98765-10001",
    company: null,
    addressLine1: "14A, Sector 15",
    city: "Noida", state: "Uttar Pradesh", postalCode: "201301", country: "India",
  },
  {
    id: "cust-2",
    name: "Meera Nair",
    email: "meera.nair@outlook.com",
    phone: "+91-98765-10002",
    company: null,
    addressLine1: "22, Kaloor Junction",
    city: "Kochi", state: "Kerala", postalCode: "682017", country: "India",
  },
  {
    id: "cust-3",
    name: "Infosys Procurement",
    email: "procurement@infosys.com",
    phone: "+91-80-4116-4100",
    company: "Infosys Ltd.",
    addressLine1: "44, Electronics City Phase 1",
    city: "Bengaluru", state: "Karnataka", postalCode: "560100", country: "India",
  },
  {
    id: "cust-4",
    name: "Vikram Desai",
    email: "vikram.desai@company.in",
    phone: "+91-98765-10004",
    company: null,
    addressLine1: "A-403, Powai Heights",
    city: "Mumbai", state: "Maharashtra", postalCode: "400076", country: "India",
  },
  {
    id: "cust-5",
    name: "Priya Sharma",
    email: "priya.sharma@techcorp.io",
    phone: "+91-98765-10005",
    company: "TechCorp",
    addressLine1: "F-12, DLF City Phase 2",
    city: "Gurugram", state: "Haryana", postalCode: "122002", country: "India",
  },
  {
    id: "cust-6",
    name: "Rahul Mehta",
    email: "rahul.mehta@freelance.dev",
    phone: "+91-98765-10006",
    company: null,
    addressLine1: "78, MG Road",
    city: "Bengaluru", state: "Karnataka", postalCode: "560001", country: "India",
  },
  {
    id: "cust-7",
    name: "Ananya Bose",
    email: "ananya.bose@student.edu",
    phone: "+91-98765-10007",
    company: null,
    addressLine1: "5, Lake Town",
    city: "Kolkata", state: "West Bengal", postalCode: "700089", country: "India",
  },
  {
    id: "cust-8",
    name: "Sameer Khan",
    email: "sameer.khan@retailshop.in",
    phone: "+91-98765-10008",
    company: "RetailShop Electronics",
    addressLine1: "Shop 12, Electronics Market",
    city: "Hyderabad", state: "Telangana", postalCode: "500003", country: "India",
  },
  {
    id: "cust-9",
    name: "Riya Joshi",
    email: "riya.joshi@startuplab.io",
    phone: "+91-98765-10009",
    company: "StartupLab",
    addressLine1: "B-12, Startup Village",
    city: "Kozhikode", state: "Kerala", postalCode: "673016", country: "India",
  },
  {
    id: "cust-10",
    name: "Deepak Chawla",
    email: "deepak.chawla@3dstudio.in",
    phone: "+91-98765-10010",
    company: "3D Studio",
    addressLine1: "Studio 3, Film City Road",
    city: "Hyderabad", state: "Telangana", postalCode: "500032", country: "India",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// ORDERS
// ─────────────────────────────────────────────────────────────────────────────

const productById = (id: string) => PRODUCTS_DATA.find((p) => p.id === id)!;

const ORDERS_DATA = [
  {
    id: "ORD-2501",
    customerId: "cust-1",
    customerName: "Arjun Kapoor",
    email: "arjun.kapoor@gmail.com",
    channel: SalesChannel.ONLINE,
    date: new Date("2025-01-14T08:22:00Z"),
    status: OrderStatus.PENDING,
    subtotal: 36000 + 42000 + 12500,
    gstAmount: 16290,
    taxAmount: 0,
    discountAmount: 0,
    total: 36000 + 42000 + 12500 + 16290,
    shippingStreet: "14A, Sector 15", shippingCity: "Noida", shippingState: "Uttar Pradesh", shippingZip: "201301", shippingCountry: "India",
    paymentMethod: "Net Banking", paymentStatus: "Pending", paymentTransactionId: null,
    idempotencyKey: "idem-ord-2501",
    items: [
      { productId: "cpu-1", quantity: 2 },
      { productId: "mobo-1", quantity: 1 },
      { productId: "ram-1", quantity: 2 },
    ],
    logs: [
      { status: OrderStatus.PENDING, timestamp: new Date("2025-01-14T08:22:00Z"), note: "Order placed. Awaiting Net Banking payment confirmation." },
    ],
    payments: [],
    shipments: [],
  },
  {
    id: "ORD-2502",
    customerId: "cust-2",
    customerName: "Meera Nair",
    email: "meera.nair@outlook.com",
    channel: SalesChannel.ONLINE,
    date: new Date("2025-01-13T14:05:00Z"),
    status: OrderStatus.PAID,
    subtotal: 185000 + 16000,
    gstAmount: 36180,
    taxAmount: 0,
    discountAmount: 0,
    total: 185000 + 16000 + 36180,
    shippingStreet: "22, Kaloor Junction", shippingCity: "Kochi", shippingState: "Kerala", shippingZip: "682017", shippingCountry: "India",
    paymentMethod: "Credit Card", paymentStatus: "Success", paymentTransactionId: "TXN-CC-20250113-5821",
    idempotencyKey: "idem-ord-2502",
    items: [
      { productId: "gpu-1", quantity: 1 },
      { productId: "psu-3", quantity: 1 },
    ],
    logs: [
      { status: OrderStatus.PENDING, timestamp: new Date("2025-01-13T14:05:00Z"), note: "Order placed via website." },
      { status: OrderStatus.PAID, timestamp: new Date("2025-01-13T14:07:30Z"), note: "Credit card payment authorised. TXN-CC-20250113-5821." },
    ],
    payments: [
      { method: PaymentMethodType.CARD, gatewayTxnId: "TXN-CC-20250113-5821", amount: 237180, status: PaymentStatus.COMPLETED, idempotencyKey: "pay-idem-2502-1" },
    ],
    shipments: [],
  },
  {
    id: "ORD-2503",
    customerId: "cust-4",
    customerName: "Vikram Desai",
    email: "vikram.desai@company.in",
    channel: SalesChannel.ONLINE,
    date: new Date("2025-01-12T11:30:00Z"),
    status: OrderStatus.PROCESSING,
    subtotal: 55000 + 42000 + 52000 + 21000 + 11000,
    gstAmount: 32580,
    taxAmount: 0,
    discountAmount: 0,
    total: 55000 + 42000 + 52000 + 21000 + 11000 + 32580,
    shippingStreet: "A-403, Powai Heights", shippingCity: "Mumbai", shippingState: "Maharashtra", shippingZip: "400076", shippingCountry: "India",
    paymentMethod: "UPI", paymentStatus: "Success", paymentTransactionId: "UPI-20250112-VD-7391",
    idempotencyKey: "idem-ord-2503",
    items: [
      { productId: "cpu-2", quantity: 1 },
      { productId: "mobo-1", quantity: 1 },
      { productId: "gpu-2", quantity: 1 },
      { productId: "stg-1", quantity: 2 },
      { productId: "cool-1", quantity: 1 },
    ],
    logs: [
      { status: OrderStatus.PENDING, timestamp: new Date("2025-01-12T11:30:00Z"), note: "Order placed via website." },
      { status: OrderStatus.PAID, timestamp: new Date("2025-01-12T11:31:00Z"), note: "UPI payment confirmed. Ref: UPI-20250112-VD-7391." },
      { status: OrderStatus.PROCESSING, timestamp: new Date("2025-01-12T14:00:00Z"), note: "Picked and packing in progress." },
    ],
    payments: [
      { method: PaymentMethodType.UPI, gatewayTxnId: "UPI-20250112-VD-7391", amount: 213580, status: PaymentStatus.COMPLETED, idempotencyKey: "pay-idem-2503-1" },
    ],
    shipments: [],
  },
  {
    id: "ORD-2504",
    customerId: "cust-5",
    customerName: "Priya Sharma",
    email: "priya.sharma@techcorp.io",
    channel: SalesChannel.ONLINE,
    date: new Date("2025-01-10T09:15:00Z"),
    status: OrderStatus.SHIPPED,
    subtotal: 36000 + 28000 + 12500 + 10500,
    gstAmount: 15660,
    taxAmount: 0,
    discountAmount: 0,
    total: 36000 + 28000 + 12500 + 10500 + 15660,
    shippingStreet: "F-12, DLF City Phase 2", shippingCity: "Gurugram", shippingState: "Haryana", shippingZip: "122002", shippingCountry: "India",
    paymentMethod: "Credit Card", paymentStatus: "Success", paymentTransactionId: "TXN-CC-20250110-4421",
    idempotencyKey: "idem-ord-2504",
    items: [
      { productId: "cpu-1", quantity: 1 },
      { productId: "mobo-2", quantity: 1 },
      { productId: "ram-1", quantity: 1 },
      { productId: "stg-1", quantity: 1 },
    ],
    logs: [
      { status: OrderStatus.PENDING, timestamp: new Date("2025-01-10T09:15:00Z"), note: null },
      { status: OrderStatus.PAID, timestamp: new Date("2025-01-10T09:16:00Z"), note: "Card payment confirmed." },
      { status: OrderStatus.PROCESSING, timestamp: new Date("2025-01-10T11:00:00Z"), note: "Items picked and packed." },
      { status: OrderStatus.SHIPPED, timestamp: new Date("2025-01-11T10:00:00Z"), note: "Shipped via BlueDart. AWB: BD-2025-44192." },
    ],
    payments: [
      { method: PaymentMethodType.CARD, gatewayTxnId: "TXN-CC-20250110-4421", amount: 102660, status: PaymentStatus.COMPLETED, idempotencyKey: "pay-idem-2504-1" },
    ],
    shipments: [
      { trackingNumber: "BD-2025-44192", carrier: "BlueDart", status: "In Transit", estimatedDelivery: new Date("2025-01-13T18:00:00Z") },
    ],
  },
  {
    id: "ORD-2505",
    customerId: "cust-6",
    customerName: "Rahul Mehta",
    email: "rahul.mehta@freelance.dev",
    channel: SalesChannel.ONLINE,
    date: new Date("2025-01-08T20:00:00Z"),
    status: OrderStatus.DELIVERED,
    subtotal: 56000 + 4500 + 14000 + 11000,
    gstAmount: 15390,
    taxAmount: 0,
    discountAmount: 0,
    total: 56000 + 4500 + 14000 + 11000 + 15390,
    shippingStreet: "78, MG Road", shippingCity: "Bengaluru", shippingState: "Karnataka", shippingZip: "560001", shippingCountry: "India",
    paymentMethod: "UPI", paymentStatus: "Success", paymentTransactionId: "UPI-20250108-RM-5544",
    idempotencyKey: "idem-ord-2505",
    items: [
      { productId: "gpu-3", quantity: 1 },
      { productId: "ram-2", quantity: 1 },
      { productId: "cab-1", quantity: 1 },
      { productId: "cool-1", quantity: 1 },
    ],
    logs: [
      { status: OrderStatus.PENDING, timestamp: new Date("2025-01-08T20:00:00Z"), note: null },
      { status: OrderStatus.PAID, timestamp: new Date("2025-01-08T20:01:00Z"), note: "UPI payment instant." },
      { status: OrderStatus.PROCESSING, timestamp: new Date("2025-01-09T10:00:00Z"), note: null },
      { status: OrderStatus.SHIPPED, timestamp: new Date("2025-01-09T15:00:00Z"), note: "Shipped via DTDC." },
      { status: OrderStatus.DELIVERED, timestamp: new Date("2025-01-11T13:00:00Z"), note: "Delivered and signed by customer." },
    ],
    payments: [
      { method: PaymentMethodType.UPI, gatewayTxnId: "UPI-20250108-RM-5544", amount: 100890, status: PaymentStatus.COMPLETED, idempotencyKey: "pay-idem-2505-1" },
    ],
    shipments: [
      { trackingNumber: "DTDC-2025-55441", carrier: "DTDC", status: "Delivered", estimatedDelivery: new Date("2025-01-11T18:00:00Z") },
    ],
  },
  {
    id: "ORD-2506",
    customerId: "cust-7",
    customerName: "Ananya Bose",
    email: "ananya.bose@student.edu",
    channel: SalesChannel.ONLINE,
    date: new Date("2025-01-07T16:30:00Z"),
    status: OrderStatus.CANCELLED,
    subtotal: 9000 + 2200 + 3500,
    gstAmount: 2646,
    taxAmount: 0,
    discountAmount: 0,
    total: 9000 + 2200 + 3500 + 2646,
    shippingStreet: "5, Lake Town", shippingCity: "Kolkata", shippingState: "West Bengal", shippingZip: "700089", shippingCountry: "India",
    paymentMethod: "UPI", paymentStatus: "Failed", paymentTransactionId: null,
    idempotencyKey: "idem-ord-2506",
    items: [
      { productId: "cpu-12", quantity: 1 },
      { productId: "ram-3", quantity: 1 },
      { productId: "stg-3", quantity: 1 },
    ],
    logs: [
      { status: OrderStatus.PENDING, timestamp: new Date("2025-01-07T16:30:00Z"), note: "Order placed." },
      { status: OrderStatus.CANCELLED, timestamp: new Date("2025-01-07T18:00:00Z"), note: "Cancelled due to UPI payment failure. Stock released." },
    ],
    payments: [
      { method: PaymentMethodType.UPI, gatewayTxnId: null, amount: 17346, status: PaymentStatus.FAILED, idempotencyKey: "pay-idem-2506-1" },
    ],
    shipments: [],
  },
  {
    id: "ORD-2507",
    customerId: "cust-8",
    customerName: "Sameer Khan",
    email: "sameer.khan@retailshop.in",
    channel: SalesChannel.ONLINE,
    date: new Date("2025-01-05T10:00:00Z"),
    status: OrderStatus.RETURNED,
    subtotal: 26000,
    gstAmount: 4680,
    taxAmount: 0,
    discountAmount: 0,
    total: 26000 + 4680,
    shippingStreet: "Shop 12, Electronics Market", shippingCity: "Hyderabad", shippingState: "Telangana", shippingZip: "500003", shippingCountry: "India",
    paymentMethod: "Net Banking", paymentStatus: "Success", paymentTransactionId: "NEFT-20250105-SK-0032",
    idempotencyKey: "idem-ord-2507",
    items: [
      { productId: "gpu-4", quantity: 1 },
    ],
    logs: [
      { status: OrderStatus.PENDING, timestamp: new Date("2025-01-05T10:00:00Z"), note: null },
      { status: OrderStatus.PAID, timestamp: new Date("2025-01-05T10:30:00Z"), note: "NEFT confirmed." },
      { status: OrderStatus.SHIPPED, timestamp: new Date("2025-01-05T14:00:00Z"), note: "Shipped via Delhivery." },
      { status: OrderStatus.DELIVERED, timestamp: new Date("2025-01-06T12:00:00Z"), note: null },
      { status: OrderStatus.RETURNED, timestamp: new Date("2025-01-07T11:00:00Z"), note: "Customer reported DOA. Return pickup scheduled." },
    ],
    payments: [
      { method: PaymentMethodType.BANK_TRANSFER, gatewayTxnId: "NEFT-20250105-SK-0032", amount: 30680, status: PaymentStatus.REFUNDED, idempotencyKey: "pay-idem-2507-1" },
    ],
    shipments: [
      { trackingNumber: "DEL-2025-00032", carrier: "Delhivery", status: "Returned", estimatedDelivery: new Date("2025-01-06T18:00:00Z") },
    ],
  },
  {
    id: "ORD-2508",
    customerId: "cust-3",
    customerName: "Infosys Procurement Team",
    email: "procurement@infosys.com",
    channel: SalesChannel.MANUAL,
    date: new Date("2025-01-13T10:00:00Z"),
    status: OrderStatus.PROCESSING,
    subtotal: (28500 + 4500 + 3500) * 10,
    gstAmount: 65700,
    taxAmount: 0,
    discountAmount: 18250,
    total: (28500 + 4500 + 3500) * 10 + 65700 - 18250,
    shippingStreet: "44, Electronics City Phase 1", shippingCity: "Bengaluru", shippingState: "Karnataka", shippingZip: "560100", shippingCountry: "India",
    paymentMethod: "Net Banking", paymentStatus: "Success", paymentTransactionId: "NEFT-20250113-INFOSYS-0099",
    idempotencyKey: "idem-ord-2508",
    items: [
      { productId: "cpu-4", quantity: 10 },
      { productId: "ram-2", quantity: 10 },
      { productId: "stg-3", quantity: 10 },
    ],
    logs: [
      { status: OrderStatus.PENDING, timestamp: new Date("2025-01-13T10:00:00Z"), note: "Bulk B2B order received. PO: PO-INFY-2025-0041." },
      { status: OrderStatus.PAID, timestamp: new Date("2025-01-13T14:00:00Z"), note: "NEFT payment received. Ref: NEFT-20250113-INFOSYS-0099." },
      { status: OrderStatus.PROCESSING, timestamp: new Date("2025-01-14T09:00:00Z"), note: "Bulk picking started. Assigned to Warehouse Team B." },
    ],
    payments: [
      { method: PaymentMethodType.BANK_TRANSFER, gatewayTxnId: "NEFT-20250113-INFOSYS-0099", amount: 365000 + 65700 - 18250, status: PaymentStatus.COMPLETED, idempotencyKey: "pay-idem-2508-1" },
    ],
    shipments: [],
  },
  {
    id: "ORD-2509",
    customerId: "cust-9",
    customerName: "Riya Joshi",
    email: "riya.joshi@startuplab.io",
    channel: SalesChannel.ONLINE,
    date: new Date("2025-01-14T06:55:00Z"),
    status: OrderStatus.SHIPPED,
    subtotal: 10500 + 8500,
    gstAmount: 3420,
    taxAmount: 0,
    discountAmount: 0,
    total: 10500 + 8500 + 3420,
    shippingStreet: "B-12, Startup Village", shippingCity: "Kozhikode", shippingState: "Kerala", shippingZip: "673016", shippingCountry: "India",
    paymentMethod: "UPI", paymentStatus: "Success", paymentTransactionId: "UPI-20250114-RJOSHI-1182",
    idempotencyKey: "idem-ord-2509",
    items: [
      { productId: "stg-1", quantity: 1 },
      { productId: "cool-2", quantity: 1 },
    ],
    logs: [
      { status: OrderStatus.PENDING, timestamp: new Date("2025-01-14T06:55:00Z"), note: null },
      { status: OrderStatus.PAID, timestamp: new Date("2025-01-14T06:56:10Z"), note: "Instant UPI payment." },
      { status: OrderStatus.PROCESSING, timestamp: new Date("2025-01-14T07:30:00Z"), note: "Express order. Packed in 20 mins." },
      { status: OrderStatus.SHIPPED, timestamp: new Date("2025-01-14T09:00:00Z"), note: "Shipped via FedEx Express. AWB: FE20250114-7741." },
    ],
    payments: [
      { method: PaymentMethodType.UPI, gatewayTxnId: "UPI-20250114-RJOSHI-1182", amount: 22420, status: PaymentStatus.COMPLETED, idempotencyKey: "pay-idem-2509-1" },
    ],
    shipments: [
      { trackingNumber: "FE20250114-7741", carrier: "FedEx", status: "In Transit", estimatedDelivery: new Date("2025-01-16T18:00:00Z") },
    ],
  },
  {
    id: "ORD-2510",
    customerId: "cust-10",
    customerName: "Deepak Chawla",
    email: "deepak.chawla@3dstudio.in",
    channel: SalesChannel.PHONE,
    date: new Date("2025-01-03T16:00:00Z"),
    status: OrderStatus.DELIVERED,
    subtotal: 135000 + 370000 + 50000 + 21000 + 16000 + 35000,
    gstAmount: 113940,
    taxAmount: 0,
    discountAmount: 0,
    total: 135000 + 370000 + 50000 + 21000 + 16000 + 35000 + 113940,
    shippingStreet: "Studio 3, Film City Road", shippingCity: "Hyderabad", shippingState: "Telangana", shippingZip: "500032", shippingCountry: "India",
    paymentMethod: "Net Banking", paymentStatus: "Success", paymentTransactionId: "RTGS-20250103-DCHAWLA-7712",
    idempotencyKey: "idem-ord-2510",
    items: [
      { productId: "cpu-6", quantity: 1 },
      { productId: "gpu-1", quantity: 2 },
      { productId: "ram-1", quantity: 4 },
      { productId: "stg-1", quantity: 2 },
      { productId: "psu-3", quantity: 1 },
      { productId: "cab-3", quantity: 1 },
    ],
    logs: [
      { status: OrderStatus.PENDING, timestamp: new Date("2025-01-03T16:00:00Z"), note: null },
      { status: OrderStatus.PAID, timestamp: new Date("2025-01-03T16:45:00Z"), note: "RTGS confirmed. High-value order flagged for priority handling." },
      { status: OrderStatus.PROCESSING, timestamp: new Date("2025-01-04T09:00:00Z"), note: "Senior warehouse staff assigned. Bubble-wrapped each GPU separately." },
      { status: OrderStatus.SHIPPED, timestamp: new Date("2025-01-05T10:00:00Z"), note: "Shipped via Safexpress Cargo. Docket: SX2025010500321." },
      { status: OrderStatus.DELIVERED, timestamp: new Date("2025-01-08T14:00:00Z"), note: "Delivered and unpacked by customer. All items verified OK." },
    ],
    payments: [
      { method: PaymentMethodType.BANK_TRANSFER, gatewayTxnId: "RTGS-20250103-DCHAWLA-7712", amount: 741940, status: PaymentStatus.COMPLETED, idempotencyKey: "pay-idem-2510-1" },
    ],
    shipments: [
      { trackingNumber: "SX2025010500321", carrier: "Safexpress", status: "Delivered", estimatedDelivery: new Date("2025-01-08T18:00:00Z") },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// INVOICES
// ─────────────────────────────────────────────────────────────────────────────

const INVOICES_DATA = [
  {
    id: "inv-001",
    invoiceNumber: "INV-2025-0001",
    orderId: "ORD-2501",
    type: InvoiceType.STANDARD,
    status: InvoiceStatus.PAID,
    customerId: "cust-1",
    currency: Currency.INR,
    subtotal: 78000,
    taxTotal: 14040,
    discountPct: 0,
    shipping: 0,
    total: 92040,
    amountPaid: 92040,
    amountDue: 0,
    notes: "High-end gaming build components.",
    paidAt: new Date("2025-01-14T09:00:00Z"),
    dueDate: new Date("2025-01-28T00:00:00Z"),
    createdAt: new Date("2025-01-14T08:30:00Z"),
    lineItems: [
      { name: "AMD Ryzen 7 7800X3D", quantity: 1, unitPrice: 36000, taxRatePct: 18 },
      { name: "ASUS ROG Strix X670E-E Gaming", quantity: 1, unitPrice: 42000, taxRatePct: 18 },
    ],
    audit: [
      { type: "created", actor: "Admin", message: "Invoice created for order ORD-2501." },
      { type: "paid", actor: "System", message: "Payment received via Net Banking." },
    ],
  },
  {
    id: "inv-002",
    invoiceNumber: "INV-2025-0002",
    orderId: "ORD-2502",
    type: InvoiceType.STANDARD,
    status: InvoiceStatus.PENDING,
    customerId: "cust-2",
    currency: Currency.INR,
    subtotal: 201000,
    taxTotal: 36180,
    discountPct: 0,
    shipping: 500,
    total: 237680,
    amountPaid: 0,
    amountDue: 237680,
    notes: "High-performance GPU order.",
    paidAt: null,
    dueDate: new Date("2025-01-27T00:00:00Z"),
    createdAt: new Date("2025-01-13T14:10:00Z"),
    lineItems: [
      { name: "NVIDIA RTX 4090 Founders Edition", quantity: 1, unitPrice: 185000, taxRatePct: 18 },
      { name: "MSI MPG A1000G", quantity: 1, unitPrice: 16000, taxRatePct: 18 },
    ],
    audit: [
      { type: "created", actor: "Admin", message: "Invoice created for ORD-2502." },
      { type: "sent", actor: "Admin", message: "Invoice emailed to customer." },
    ],
  },
  {
    id: "inv-003",
    invoiceNumber: "INV-2025-0003",
    orderId: "ORD-2508",
    type: InvoiceType.STANDARD,
    status: InvoiceStatus.OVERDUE,
    customerId: "cust-3",
    currency: Currency.INR,
    subtotal: 365000,
    taxTotal: 65700,
    discountPct: 5,
    shipping: 2000,
    total: 413950,
    amountPaid: 0,
    amountDue: 413950,
    notes: "Bulk B2B order — Net-30 payment terms.",
    paidAt: null,
    dueDate: new Date("2025-01-13T00:00:00Z"),
    createdAt: new Date("2025-01-13T10:00:00Z"),
    lineItems: [
      { name: "Intel Core i5-13600K", quantity: 10, unitPrice: 28500, taxRatePct: 18 },
      { name: "Corsair Vengeance 16GB", quantity: 10, unitPrice: 4500, taxRatePct: 18 },
      { name: "Crucial P3 500GB", quantity: 10, unitPrice: 3500, taxRatePct: 18 },
    ],
    audit: [
      { type: "created", actor: "Admin", message: "Invoice created for bulk B2B order ORD-2508." },
      { type: "sent", actor: "Admin", message: "Invoice sent to procurement@infosys.com." },
      { type: "note", actor: "System", message: "Invoice overdue — payment not received by due date." },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SAVED BUILDS
// ─────────────────────────────────────────────────────────────────────────────

const SAVED_BUILDS_DATA = [
  {
    id: "build-gaming-1",
    name: "High-End Gaming Build (1440p / 4K)",
    total: 36000 + 42000 + 52000 + 12500 + 10500 + 16000 + 14000 + 11000,
    createdAt: new Date("2024-12-10"),
    items: [
      { productId: "cpu-1", quantity: 1 },
      { productId: "mobo-1", quantity: 1 },
      { productId: "gpu-2", quantity: 1 },
      { productId: "ram-1", quantity: 1 },
      { productId: "stg-1", quantity: 1 },
      { productId: "psu-3", quantity: 1 },
      { productId: "cab-1", quantity: 1 },
      { productId: "cool-1", quantity: 1 },
    ],
  },
  {
    id: "build-budget-1",
    name: "Budget 1080p Gaming Build",
    total: 12500 + 9000 + 19500 + 4500 + 3500 + 4500 + 7000,
    createdAt: new Date("2024-11-22"),
    items: [
      { productId: "cpu-19", quantity: 1 },
      { productId: "mobo-3", quantity: 1 },
      { productId: "gpu-5", quantity: 1 },
      { productId: "ram-2", quantity: 1 },
      { productId: "stg-3", quantity: 1 },
      { productId: "psu-2", quantity: 1 },
      { productId: "cab-2", quantity: 1 },
    ],
  },
  {
    id: "build-workstation-1",
    name: "Content Creation / Workstation Build",
    total: 135000 + 46000 + 185000 + 25000 + 21000 + 16000 + 35000 + 14500,
    createdAt: new Date("2024-10-05"),
    items: [
      { productId: "cpu-6", quantity: 1 },
      { productId: "mobo-24", quantity: 1 },
      { productId: "gpu-1", quantity: 1 },
      { productId: "ram-1", quantity: 2 },
      { productId: "stg-1", quantity: 2 },
      { productId: "psu-3", quantity: 1 },
      { productId: "cab-3", quantity: 1 },
      { productId: "cool-4", quantity: 1 },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// BILLING PROFILE
// ─────────────────────────────────────────────────────────────────────────────

const BILLING_PROFILE_DATA = {
  companyName: "BitKart Technologies Pvt. Ltd.",
  legalName: "BitKart Technologies Private Limited",
  email: "billing@bitkart.in",
  phone: "+91-80-4567-8900",
  addressLine1: "42, Tech Park, Whitefield",
  addressLine2: "Electronic City Phase 2",
  city: "Bengaluru",
  state: "Karnataka",
  postalCode: "560066",
  country: "India",
  gstin: "29AABCT1234F1Z5",
  currency: Currency.INR,
};

// ─────────────────────────────────────────────────────────────────────────────
// SUPPLIER + PURCHASE ORDER DATA
// ─────────────────────────────────────────────────────────────────────────────

const SUPPLIERS_DATA = [
  {
    id: "sup-1",
    name: "Redington India Ltd.",
    email: "supply@redington.co.in",
    phone: "+91-44-4224-3353",
    address: "SPL Guindy House, 95 Mount Road, Chennai - 600032",
  },
  {
    id: "sup-2",
    name: "Ingram Micro India",
    email: "procurement@ingrammicro.in",
    phone: "+91-22-6148-4000",
    address: "Tower B, 5th Floor, Infinity IT Park, Mumbai - 400093",
  },
];

// PURCHASE_ORDERS_DATA references suppliers, warehouse, and variants (by product id mapped at runtime)
const PURCHASE_ORDERS_DATA = [
  {
    id: "po-001",
    supplierId: "sup-1",
    // warehouseId resolved at runtime from MAIN warehouse
    status: PurchaseOrderStatus.COMPLETED,
    expectedDelivery: new Date("2025-01-05T00:00:00Z"),
    items: [
      { productId: "cpu-1", quantityOrdered: 20, quantityReceived: 20, unitCost: 23400 },
      { productId: "gpu-2", quantityOrdered: 30, quantityReceived: 30, unitCost: 33800 },
      { productId: "ram-1", quantityOrdered: 60, quantityReceived: 60, unitCost: 8125 },
      { productId: "stg-1", quantityOrdered: 50, quantityReceived: 50, unitCost: 6825 },
    ],
  },
  {
    id: "po-002",
    supplierId: "sup-2",
    status: PurchaseOrderStatus.PARTIAL,
    expectedDelivery: new Date("2025-01-20T00:00:00Z"),
    items: [
      { productId: "mobo-1", quantityOrdered: 15, quantityReceived: 10, unitCost: 27300 },
      { productId: "psu-3", quantityOrdered: 20, quantityReceived: 15, unitCost: 10400 },
      { productId: "cool-1", quantityOrdered: 25, quantityReceived: 20, unitCost: 7150 },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MARKETING DATA
// ─────────────────────────────────────────────────────────────────────────────

const MARKETING_CAMPAIGNS_DATA = [
  {
    id: "camp-1",
    name: "Abandoned Cart Recovery",
    description: "Sends a reminder email 2 hours after a cart is abandoned with a 5% discount code.",
    isActive: true,
    triggerType: MarketingEventType.CART_ABANDONED,
    rulesConfig: { delayHours: 2, condition: "cart_value > 5000", templateId: "abandoned_cart_v1" },
  },
  {
    id: "camp-2",
    name: "New Subscriber Welcome",
    description: "Sends a welcome email immediately after newsletter signup.",
    isActive: true,
    triggerType: MarketingEventType.NEWSLETTER_SIGNUP,
    rulesConfig: { delayHours: 0, templateId: "welcome_newsletter_v1" },
  },
];

const LEADS_DATA = [
  {
    id: "lead-1",
    email: "arjun.kapoor@gmail.com",
    name: "Arjun Kapoor",
    source: "Footer Newsletter",
    customerId: "cust-1",
    unsubscribed: false,
  },
  {
    id: "lead-2",
    email: "priya.sharma@techcorp.io",
    name: "Priya Sharma",
    source: "Exit Popup",
    customerId: "cust-5",
    unsubscribed: false,
  },
  {
    id: "lead-3",
    email: "newsletter.subscriber@email.com",
    name: "Newsletter Subscriber",
    source: "Footer Newsletter",
    customerId: null,
    unsubscribed: false,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SEED FUNCTION
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Starting seed...");

  // ── 1. Invoice Sequence (singleton) ────────────────────────────────────────
  console.log("  → Seeding invoice sequence...");
  await prisma.invoiceSequence.upsert({
    where: { id: "invoice_seq" },
    update: {},
    create: { id: "invoice_seq", currentValue: 3 }, // 3 invoices seeded
  });

  // ── 2. Users ────────────────────────────────────────────────────────────────
  console.log("  → Seeding users...");
  for (const u of USERS_DATA) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role },
      create: u,
    });
  }

  // ── 3. Brands ───────────────────────────────────────────────────────────────
  console.log("  → Seeding brands...");
  const brandMap: Record<string, string> = {}; // name → id

  for (const b of BRANDS_DATA) {
    const brand = await prisma.brand.upsert({
      where: { name: b.name },
      update: { categories: b.categories },
      create: { name: b.name, categories: b.categories },
    });
    brandMap[b.name] = brand.id;
  }

  // ── 4. Products, Specs, Media, Variants ────────────────────────────────────
  console.log("  → Seeding products, specs, and variants...");
  const variantMap = new Map<string, string>(); // productId → variantId

  for (const p of PRODUCTS_DATA) {
    const cat = categoryToEnum(p.category);
    const brandId = p.brandName ? brandMap[p.brandName] : undefined;

    let prod = await prisma.product.findUnique({
      where: { id: p.id },
      include: { variants: true },
    });

    if (!prod) {
      prod = await prisma.product.create({
        data: {
          id: p.id,
          slug: p.id,
          name: p.name,
          category: cat,
          description: p.description,
          brandId: brandId ?? null,
          media: {
            create: [{ url: p.image, altText: p.name, sortOrder: 0 }],
          },
          variants: {
            create: [{
              sku: p.sku,
              price: p.price,
              status: "IN_STOCK",
            }],
          },
        },
        include: { variants: true },
      });
    }

    variantMap.set(p.id, prod.variants[0].id);

    // Refresh specs
    await prisma.productSpec.deleteMany({ where: { productId: p.id } });
    for (const [key, rawValue] of Object.entries(p.specs)) {
      const values = Array.isArray(rawValue) ? rawValue : [rawValue];
      for (const val of values) {
        const value = normaliseSpec(key, String(val));
        await prisma.productSpec.create({ data: { productId: p.id, key, value } });
      }
    }
  }

  // ── 5. Tags ─────────────────────────────────────────────────────────────────
  console.log("  → Seeding tags...");
  for (const t of TAGS_DATA) {
    const validProductIds = t.productIds.filter((id) => variantMap.has(id));
    await prisma.tag.upsert({
      where: { name: t.name },
      update: {
        products: { set: validProductIds.map((id) => ({ id })) },
      },
      create: {
        name: t.name,
        products: { connect: validProductIds.map((id) => ({ id })) },
      },
    });
  }

  // ── 6. Warehouse ─────────────────────────────────────────────────────────────
  console.log("  → Seeding warehouse...");
  let mainWarehouse = await prisma.warehouse.findFirst({ where: { code: "MAIN" } });
  if (!mainWarehouse) {
    mainWarehouse = await prisma.warehouse.create({
      data: { name: "Main Warehouse", code: "MAIN", isActive: true, address: "42, Tech Park, Whitefield, Bengaluru - 560066" },
    });
  }

  // ── 7. Suppliers ─────────────────────────────────────────────────────────────
  console.log("  → Seeding suppliers...");
  for (const s of SUPPLIERS_DATA) {
    await prisma.supplier.upsert({
      where: { name: s.name },
      update: { email: s.email, phone: s.phone, address: s.address },
      create: s,
    });
  }

  // ── 8. Warehouse Inventory + Initial Stock Movements ──────────────────────
  console.log("  → Seeding warehouse inventory...");
  for (const p of PRODUCTS_DATA) {
    const variantId = variantMap.get(p.id);
    if (!variantId) continue;

    const existing = await prisma.warehouseInventory.findFirst({
      where: { variantId, warehouseId: mainWarehouse.id },
    });
    if (!existing) {
      const inv = await prisma.warehouseInventory.create({
        data: {
          variantId,
          warehouseId: mainWarehouse.id,
          quantity: p.stock,
          reserved: 0,
          reorderLevel: Math.max(2, Math.floor(p.stock * 0.15)),
          costPrice: Math.round(p.price * 0.65),
          location: "Aisle 1",
          lastUpdated: new Date(),
        },
      });
      await prisma.stockMovement.create({
        data: {
          warehouseInventoryId: inv.id,
          warehouseId: mainWarehouse.id,
          type: StockMovementType.INWARD,
          quantity: p.stock,
          previousQuantity: 0,
          newQuantity: p.stock,
          reason: "Initial stock from seed",
          performedBy: "System",
        },
      });
    }
  }

  // ── 9. Purchase Orders + PO Items + Inventory Units (inward) ──────────────
  console.log("  → Seeding purchase orders...");
  for (const po of PURCHASE_ORDERS_DATA) {
    const supplier = await prisma.supplier.findFirst({ where: { id: po.id.startsWith("po") ? undefined : po.supplierId } })
      ?? await prisma.supplier.findFirst({ where: { name: po.supplierId === "sup-1" ? "Redington India Ltd." : "Ingram Micro India" } });

    if (!supplier) continue;

    const existingPO = await prisma.purchaseOrder.findUnique({ where: { id: po.id } });
    if (existingPO) continue;

    const createdPO = await prisma.purchaseOrder.create({
      data: {
        id: po.id,
        supplierId: supplier.id,
        warehouseId: mainWarehouse.id,
        status: po.status,
        expectedDelivery: po.expectedDelivery,
      },
    });

    for (const item of po.items) {
      const variantId = variantMap.get(item.productId);
      if (!variantId) continue;

      const poItem = await prisma.purchaseOrderItem.create({
        data: {
          purchaseOrderId: createdPO.id,
          variantId,
          quantityOrdered: item.quantityOrdered,
          quantityReceived: item.quantityReceived,
          unitCost: item.unitCost,
        },
      });

      // Create InventoryUnits for received quantities and record PURCHASE stock movement
      const warehouseInv = await prisma.warehouseInventory.findFirst({
        where: { variantId, warehouseId: mainWarehouse.id },
      });
      if (!warehouseInv) continue;

      for (let i = 0; i < item.quantityReceived; i++) {
        await prisma.inventoryUnit.create({
          data: {
            variantId,
            warehouseId: mainWarehouse.id,
            warehouseInventoryId: warehouseInv.id,
            purchaseOrderItemId: poItem.id,
            status: InventoryUnitStatus.AVAILABLE,
          },
        });
      }

      await prisma.stockMovement.create({
        data: {
          warehouseInventoryId: warehouseInv.id,
          warehouseId: mainWarehouse.id,
          type: StockMovementType.PURCHASE,
          quantity: item.quantityReceived,
          previousQuantity: 0,
          newQuantity: item.quantityReceived,
          reason: `Purchase order ${createdPO.id} — inward`,
          performedBy: "System",
          purchaseOrderId: createdPO.id,
          vendorId: supplier.id,
        },
      });
    }
  }

  // ── 10. Category Schemas ───────────────────────────────────────────────────
  console.log("  → Seeding category schemas...");
  for (const s of CATEGORY_SCHEMAS_DATA) {
    const schema = await prisma.categorySchema.upsert({
      where: { category: s.category },
      update: {},
      create: { category: s.category },
    });

    for (const attr of s.attributes) {
      await prisma.attributeDefinition.upsert({
        where: { categorySchemaId_key: { categorySchemaId: schema.id, key: attr.key } },
        update: {
          label: attr.label,
          type: attr.type,
          required: attr.required,
          options: attr.options ?? [],
          unit: attr.unit ?? null,
          sortOrder: attr.sortOrder,
          dependencyKey: attr.dependencyKey ?? null,
          dependencyValue: attr.dependencyValue ?? null,
        },
        create: {
          categorySchemaId: schema.id,
          key: attr.key,
          label: attr.label,
          type: attr.type,
          required: attr.required,
          options: attr.options ?? [],
          unit: attr.unit ?? null,
          sortOrder: attr.sortOrder,
          dependencyKey: attr.dependencyKey ?? null,
          dependencyValue: attr.dependencyValue ?? null,
        },
      });
    }
  }

  // ── 11. Filter Config ──────────────────────────────────────────────────────
  console.log("  → Seeding filter configurations...");
  for (const fc of FILTER_CONFIG_DATA) {
    const config = await prisma.categoryFilterConfig.upsert({
      where: { category: fc.category },
      update: {},
      create: { category: fc.category },
    });

    for (const f of fc.filters) {
      await prisma.filterDefinition.upsert({
        where: { categoryFilterConfigId_key: { categoryFilterConfigId: config.id, key: f.key } },
        update: {
          label: f.label,
          type: f.type,
          options: f.options ?? [],
          min: f.min ?? null,
          max: f.max ?? null,
          dependencyKey: f.dependencyKey ?? null,
          dependencyValue: f.dependencyValue ?? null,
          sortOrder: f.sortOrder,
        },
        create: {
          categoryFilterConfigId: config.id,
          key: f.key,
          label: f.label,
          type: f.type,
          options: f.options ?? [],
          min: f.min ?? null,
          max: f.max ?? null,
          dependencyKey: f.dependencyKey ?? null,
          dependencyValue: f.dependencyValue ?? null,
          sortOrder: f.sortOrder,
        },
      });
    }
  }

  // ── 12. Category Hierarchy ─────────────────────────────────────────────────
  console.log("  → Seeding category hierarchy...");

  async function seedNode(
    node: { label: string; category?: Category; query?: string; brand?: string; children?: typeof node[] },
    parentId: string | null,
    order: number,
  ): Promise<void> {
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
          category: node.category ?? null,
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

  const TOP_LEVEL_NODES = [
    {
      label: "Custom Liquid Cooling", category: Category.COOLER,
      children: [
        { label: "CPU Water Block", query: "Water Block" },
        { label: "GPU Water Block", query: "GPU Block" },
        { label: "Pump And Reservoir", query: "Pump" },
        { label: "Radiator", query: "Radiator" },
        { label: "Tubing", query: "Tubing" },
        { label: "Fitting Adapters", query: "Fitting" },
        { label: "Coolant", query: "Coolant" },
        { label: "Distro Plate", query: "Distro" },
        { label: "DIY Accessories", query: "Accessory" },
      ],
    },
    {
      label: "Processor", category: Category.PROCESSOR,
      children: [
        { label: "Intel Processor", brand: "Intel" },
        { label: "AMD Processor", brand: "AMD" },
        { label: "Extreme-level Processor", query: "Extreme" },
        { label: "High-end Processor", query: "High-end" },
        { label: "Mid-Range Processor", query: "Mid-Range" },
        { label: "Entry-level Processor", query: "Entry" },
        { label: "Server CPU", query: "Server" },
      ],
    },
    {
      label: "CPU Cooler", category: Category.COOLER,
      children: [
        { label: "Liquid Cooler", query: "Liquid" },
        { label: "Thermal Paste", query: "Paste" },
        { label: "Air Cooler", query: "Air Cooler" },
        { label: "Cooling Accessories", query: "Accessory" },
      ],
    },
    {
      label: "Motherboard", category: Category.MOTHERBOARD,
      children: [
        {
          label: "AMD Chipset", children: [
            { label: "X870", query: "X870" }, { label: "X670", query: "X670" },
            { label: "B650", query: "B650" }, { label: "B550", query: "B550" },
            { label: "B450", query: "B450" }, { label: "A620", query: "A620" },
            { label: "A520", query: "A520" },
          ],
        },
        {
          label: "Intel Chipset", children: [
            { label: "Z890", query: "Z890" }, { label: "Z790", query: "Z790" },
            { label: "B760", query: "B760" }, { label: "H610", query: "H610" },
            { label: "H510", query: "H510" },
          ],
        },
        { label: "Overclocking Motherboard", query: "Overclocking" },
        { label: "Workstation Motherboard", query: "Workstation" },
      ],
    },
    {
      label: "Graphics Card", category: Category.GPU,
      children: [
        { label: "Intel Arc Graphics Card", query: "Arc" },
        {
          label: "Nvidia", children: [
            { label: "RTX 50 Series", query: "50 Series" },
            { label: "RTX 40 Series", query: "40 Series" },
            { label: "RTX 30 Series", query: "30 Series" },
            { label: "Quadro", query: "Quadro" },
          ],
        },
        { label: "Graphics Card Accessories", query: "Accessory" },
        {
          label: "Amd Radeon", children: [
            { label: "RX 9000 Series", query: "9000" },
            { label: "RX 7000 Series", query: "7000" },
            { label: "RX 6000 Series", query: "6000" },
          ],
        },
      ],
    },
    {
      label: "RAM", category: Category.RAM,
      children: [
        { label: "Desktop Ram", query: "Desktop" },
        { label: "Laptop Ram", query: "Laptop" },
        { label: "DDR4 Ram", query: "DDR4" },
        { label: "DDR3 Ram", query: "DDR3" },
        { label: "DDR5 Ram", query: "DDR5" },
        { label: "Single Channel Ram", query: "Single" },
        { label: "Dual Channel Ram", query: "Dual" },
        { label: "Quad Channel Ram", query: "Quad" },
      ],
    },
    {
      label: "Storage", category: Category.STORAGE,
      children: [
        {
          label: "HDD", children: [
            { label: "Internal HDD", query: "Internal" },
            { label: "External HDD", query: "External" },
            { label: "Enterprise HDD", query: "Enterprise" },
          ],
        },
        {
          label: "SSD", children: [
            { label: "NVMe Gen5", query: "Gen5" },
            { label: "NVMe Gen4", query: "Gen4" },
            { label: "NVMe Gen3", query: "Gen3" },
            { label: 'SATA 2.5"', query: "SATA" },
            { label: "External SSD", query: "External" },
          ],
        },
        { label: "Pen Drive", query: "Pen Drive" },
      ],
    },
    {
      label: "SMPS (PSU)", category: Category.PSU,
      children: [
        { label: "Non Modular", query: "Non Modular" },
        { label: "Fully Modular", query: "Fully Modular" },
        { label: "Semi Modular", query: "Semi Modular" },
        { label: "Platinum", query: "Platinum" },
        { label: "Gold", query: "Gold" },
        { label: "Bronze", query: "Bronze" },
      ],
    },
    {
      label: "Cabinet", category: Category.CABINET,
      children: [
        { label: "Full Tower", query: "Full Tower" },
        { label: "ARGB", query: "ARGB" },
        { label: "Mid Tower", query: "Mid Tower" },
        { label: "Case Accessories", query: "Accessory" },
        { label: "Mini Tower", query: "Mini Tower" },
        { label: "With RGB Fan", query: "RGB Fan" },
        { label: "DIY", query: "DIY" },
        { label: "With SMPS", query: "SMPS" },
        { label: "Under INR 3500", query: "Budget" },
        { label: "Small Form Factor", query: "SFF" },
      ],
    },
    {
      label: "Monitor", category: Category.MONITOR,
      children: [
        { label: "22 inch", query: "22" },
        { label: "24 inch", query: "24" },
        { label: "27 inch", query: "27" },
        { label: "2K", query: "2K" },
        { label: "32 inch", query: "32" },
        { label: "34 inch", query: "34" },
        { label: "4K", query: "4K" },
        { label: "Gaming", query: "Gaming" },
        { label: "Curved", query: "Curved" },
        { label: "Professional", query: "Professional" },
      ],
    },
    {
      label: "Peripherals", category: Category.PERIPHERAL,
      children: [
        { label: "Headset", query: "Headset" },
        {
          label: "Keyboard", children: [
            { label: "Mechanical", query: "Mechanical" },
            { label: "Gaming", query: "Gaming" },
            { label: "Wireless", query: "Wireless" },
            { label: "Wired", query: "Wired" },
            { label: "Combos", query: "Combo" },
          ],
        },
        {
          label: "Mouse", children: [
            { label: "Gaming", query: "Gaming" },
            { label: "RGB", query: "RGB" },
            { label: "Wired", query: "Wired" },
            { label: "Wireless", query: "Wireless" },
            { label: "Combos", query: "Combo" },
          ],
        },
        { label: "Mouse Pad", query: "Mouse Pad" },
        {
          label: "Networking", category: Category.NETWORKING, children: [
            { label: "Router", query: "Router" },
            { label: "Switch", query: "Switch" },
            { label: "Cable", query: "Cable" },
            { label: "Adapter", query: "Adapter" },
          ],
        },
        {
          label: "Printer & Scanner", children: [
            { label: "Printer", query: "Printer" },
            { label: "Scanner", query: "Scanner" },
            { label: "Cartridge", query: "Cartridge" },
            { label: "Toner", query: "Toner" },
          ],
        },
        { label: "Software", query: "Software" },
        { label: "Speaker", query: "Speaker" },
        { label: "Headphone", query: "Headphone" },
        { label: "Webcam", query: "Webcam" },
      ],
    },
    { label: "Laptop", category: Category.LAPTOP },
  ];

  for (let i = 0; i < TOP_LEVEL_NODES.length; i++) {
    await seedNode(TOP_LEVEL_NODES[i] as any, null, i);
  }

  // ── 13. Customers ──────────────────────────────────────────────────────────
  console.log("  → Seeding customers...");
  for (const c of CUSTOMERS_DATA) {
    await prisma.customer.upsert({
      where: { id: c.id },
      update: { name: c.name, phone: c.phone },
      create: c,
    });
  }

  // ── 14. Orders + Items + Logs + Payments + Shipments + Stock Movements ─────
  console.log("  → Seeding orders...");
  for (const o of ORDERS_DATA) {
    const order = await prisma.order.upsert({
      where: { id: o.id },
      update: { status: o.status },
      create: {
        id: o.id,
        channel: o.channel,
        customerId: o.customerId,
        customerName: o.customerName,
        email: o.email,
        date: o.date,
        status: o.status,
        subtotal: o.subtotal,
        gstAmount: o.gstAmount,
        taxAmount: o.taxAmount,
        discountAmount: o.discountAmount,
        total: o.total,
        shippingStreet: o.shippingStreet,
        shippingCity: o.shippingCity,
        shippingState: o.shippingState,
        shippingZip: o.shippingZip,
        shippingCountry: o.shippingCountry,
        paymentMethod: o.paymentMethod,
        paymentStatus: o.paymentStatus,
        paymentTransactionId: o.paymentTransactionId,
        idempotencyKey: o.idempotencyKey,
      },
    });

    // Order Items
    const existingItems = await prisma.orderItem.count({ where: { orderId: order.id } });
    if (existingItems === 0) {
      for (const item of o.items) {
        const prod = productById(item.productId);
        const variantId = variantMap.get(item.productId);
        if (!variantId) continue;

        const orderItem = await prisma.orderItem.create({
          data: {
            orderId: order.id,
            variantId,
            name: prod.name,
            category: categoryToEnum(prod.category),
            price: prod.price,
            quantity: item.quantity,
            image: prod.image,
            sku: prod.sku,
          },
        });

        // Link InventoryUnits to this OrderItem for delivered/shipped orders
        const FULFILLMENT_STATUSES: OrderStatus[] = [OrderStatus.SHIPPED, OrderStatus.DELIVERED, OrderStatus.RETURNED];
        if (FULFILLMENT_STATUSES.includes(o.status as OrderStatus)) {
          const warehouseInv = await prisma.warehouseInventory.findFirst({
            where: { variantId, warehouseId: mainWarehouse.id },
          });
          if (warehouseInv) {
            const availableUnits = await prisma.inventoryUnit.findMany({
              where: { variantId, warehouseId: mainWarehouse.id, status: InventoryUnitStatus.AVAILABLE, orderItemId: null },
              take: item.quantity,
            });

            const soldStatus = o.status === OrderStatus.RETURNED
              ? InventoryUnitStatus.RETURNED
              : InventoryUnitStatus.SOLD;

            for (const unit of availableUnits) {
              await prisma.inventoryUnit.update({
                where: { id: unit.id },
                data: {
                  orderItemId: orderItem.id,
                  status: soldStatus,
                  soldAt: o.status !== OrderStatus.RETURNED ? new Date(o.date) : null,
                },
              });
            }

            // Stock OUTWARD movement
            await prisma.stockMovement.create({
              data: {
                warehouseInventoryId: warehouseInv.id,
                warehouseId: mainWarehouse.id,
                type: StockMovementType.SALE,
                quantity: item.quantity,
                previousQuantity: warehouseInv.quantity,
                newQuantity: Math.max(0, warehouseInv.quantity - item.quantity),
                reason: `Sale — Order ${order.id}`,
                performedBy: "System",
                orderId: order.id,
              },
            });
          }
        }
      }
    }

    // Order Logs
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

    // Payment Transactions
    const existingPayments = await prisma.paymentTransaction.count({ where: { orderId: order.id } });
    if (existingPayments === 0) {
      for (const pay of o.payments) {
        await prisma.paymentTransaction.create({
          data: {
            orderId: order.id,
            method: pay.method,
            gatewayTxnId: pay.gatewayTxnId ?? null,
            amount: pay.amount,
            currency: Currency.INR,
            status: pay.status,
            idempotencyKey: pay.idempotencyKey,
          },
        });
      }
    }

    // Shipment Tracking
    const existingShipments = await prisma.shipmentTracking.count({ where: { orderId: order.id } });
    if (existingShipments === 0) {
      for (const ship of o.shipments) {
        await prisma.shipmentTracking.create({
          data: {
            orderId: order.id,
            trackingNumber: ship.trackingNumber,
            carrier: ship.carrier,
            status: ship.status,
            estimatedDelivery: ship.estimatedDelivery ?? null,
          },
        });
      }
    }
  }

  // ── 15. Build Guides ────────────────────────────────────────────────────────
  console.log("  → Seeding build guides...");
  for (const b of SAVED_BUILDS_DATA) {
    const existingBuild = await prisma.buildGuide.findUnique({ where: { id: b.id } });
    if (!existingBuild) {
      await prisma.buildGuide.create({
        data: {
          id: b.id,
          title: b.name,
          description: "Pre-configured build guide based on popular choices.",
          category: "Gaming",
          total: b.total,
          createdAt: b.createdAt,
          items: {
            create: b.items
              .filter((i) => variantMap.has(i.productId))
              .map((item) => ({
                variantId: variantMap.get(item.productId)!,
                quantity: item.quantity,
              })),
          },
        },
      });
    }
  }

  // ── 16. Billing Profile ─────────────────────────────────────────────────────
  console.log("  → Seeding billing profile...");
  const existingProfile = await prisma.billingProfile.findFirst();
  if (!existingProfile) {
    await prisma.billingProfile.create({ data: BILLING_PROFILE_DATA });
  }

  // ── 17. Invoices ────────────────────────────────────────────────────────────
  console.log("  → Seeding invoices...");
  for (const inv of INVOICES_DATA) {
    const existing = await prisma.invoice.findUnique({ where: { invoiceNumber: inv.invoiceNumber } });
    if (!existing) {
      await prisma.invoice.create({
        data: {
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          orderId: inv.orderId,
          type: inv.type,
          status: inv.status,
          customerId: inv.customerId,
          currency: inv.currency,
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
            create: inv.lineItems.map((li) => ({
              name: li.name,
              quantity: li.quantity,
              unitPrice: li.unitPrice,
              taxRatePct: li.taxRatePct,
            })),
          },
          audit: {
            create: inv.audit.map((a) => ({
              type: a.type,
              actor: a.actor,
              message: a.message,
            })),
          },
        },
      });
    }
  }

  // ── 18. Marketing Campaigns ─────────────────────────────────────────────────
  console.log("  → Seeding marketing campaigns...");
  for (const camp of MARKETING_CAMPAIGNS_DATA) {
    await prisma.marketingCampaign.upsert({
      where: { name: camp.name },
      update: { isActive: camp.isActive, rulesConfig: camp.rulesConfig },
      create: {
        id: camp.id,
        name: camp.name,
        description: camp.description,
        isActive: camp.isActive,
        triggerType: camp.triggerType,
        rulesConfig: camp.rulesConfig,
      },
    });
  }

  // ── 19. Leads + Marketing Events + Email Logs ──────────────────────────────
  console.log("  → Seeding leads, marketing events, and email logs...");
  for (const lead of LEADS_DATA) {
    const upsertedLead = await prisma.lead.upsert({
      where: { email: lead.email },
      update: { name: lead.name, source: lead.source, customerId: lead.customerId },
      create: {
        id: lead.id,
        email: lead.email,
        name: lead.name,
        source: lead.source,
        customerId: lead.customerId,
        unsubscribed: lead.unsubscribed,
      },
    });

    // Seed a NEWSLETTER_SIGNUP event per lead
    const existingEvent = await prisma.marketingEvent.findFirst({
      where: { leadId: upsertedLead.id, type: MarketingEventType.NEWSLETTER_SIGNUP },
    });
    if (!existingEvent) {
      await prisma.marketingEvent.create({
        data: {
          leadId: upsertedLead.id,
          type: MarketingEventType.NEWSLETTER_SIGNUP,
          metadata: { source: lead.source },
        },
      });
    }

    // Seed welcome email log linked to the welcome campaign
    const welcomeCampaign = await prisma.marketingCampaign.findFirst({ where: { name: "New Subscriber Welcome" } });
    const existingEmailLog = await prisma.emailLog.findFirst({ where: { leadId: upsertedLead.id } });
    if (!existingEmailLog && welcomeCampaign) {
      await prisma.emailLog.create({
        data: {
          leadId: upsertedLead.id,
          campaignId: welcomeCampaign.id,
          subject: "Welcome to BitKart — Your PC Building HQ",
          status: "DELIVERED",
        },
      });
    }
  }

  // ── 20. Audit Log ───────────────────────────────────────────────────────────
  console.log("  → Seeding audit log entries...");
  const auditEntries = [
    { entityType: "Order", entityId: "ORD-2501", action: "CREATE", actor: "System", after: { status: "PENDING" } },
    { entityType: "Order", entityId: "ORD-2502", action: "STATUS_CHANGE", actor: "System", before: { status: "PENDING" }, after: { status: "PAID" } },
    { entityType: "Order", entityId: "ORD-2505", action: "STATUS_CHANGE", actor: "System", before: { status: "SHIPPED" }, after: { status: "DELIVERED" } },
    { entityType: "Invoice", entityId: "inv-001", action: "CREATE", actor: "Admin", after: { invoiceNumber: "INV-2025-0001" } },
    { entityType: "Invoice", entityId: "inv-001", action: "MARK_PAID", actor: "System", after: { amountPaid: 92040, amountDue: 0 } },
    { entityType: "Invoice", entityId: "inv-003", action: "OVERDUE", actor: "System", after: { status: "OVERDUE" } },
    { entityType: "Product", entityId: "cpu-1", action: "CREATE", actor: "Admin", after: { name: "AMD Ryzen 7 7800X3D" } },
    { entityType: "PurchaseOrder", entityId: "po-001", action: "CREATE", actor: "Admin", after: { status: "COMPLETED" } },
  ];

  for (const entry of auditEntries) {
    const exists = await prisma.auditLog.findFirst({
      where: { entityType: entry.entityType, entityId: entry.entityId, action: entry.action },
    });
    if (!exists) {
      await prisma.auditLog.create({
        data: {
          entityType: entry.entityType,
          entityId: entry.entityId,
          action: entry.action,
          actor: entry.actor,
          before: (entry as any).before ?? null,
          after: (entry as any).after ?? null,
        },
      });
    }
  }

  console.log("✅ Seed complete.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
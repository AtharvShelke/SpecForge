

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Category, Currency, FilterType, InvoiceStatus, OrderStatus, ReviewStatus, PrismaClient } from "../generated/prisma/client";

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });


// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Maps TypeScript enum string values to Prisma schema enum keys */
function categoryToEnum(cat: string): Category {
  const map: Record<string, Category> = {
    'Processor': Category.PROCESSOR,
    'Graphics Card': Category.GPU,
    'Motherboard': Category.MOTHERBOARD,
    'RAM': Category.RAM,
    'Storage': Category.STORAGE,
    'Power Supply': Category.PSU,
    'Cabinet': Category.CABINET,
    'Cooler': Category.COOLER,
    'Monitor': Category.MONITOR,
    'Peripheral': Category.PERIPHERAL,
    'Networking': Category.NETWORKING,
  };
  const result = map[cat];
  if (!result) throw new Error(`Unknown category string: "${cat}"`);
  return result;
}

/** Normalise formFactor values across mockData ('mATX' → 'Micro-ATX') */
function normaliseSpec(key: string, value: string): string {
  if (key === 'formFactor' && value === 'mATX') return 'Micro-ATX';
  return value;
}

// ─────────────────────────────────────────────────────────────────────────────
// BRANDS
// ─────────────────────────────────────────────────────────────────────────────

const BRANDS_DATA = [
  { name: 'Intel', categories: [Category.PROCESSOR, Category.GPU, Category.NETWORKING] },
  { name: 'AMD', categories: [Category.PROCESSOR, Category.GPU, Category.MOTHERBOARD] },
  { name: 'NVIDIA', categories: [Category.GPU] },
  { name: 'ASUS', categories: [Category.MOTHERBOARD, Category.GPU, Category.MONITOR, Category.PSU, Category.PERIPHERAL] },
  { name: 'MSI', categories: [Category.MOTHERBOARD, Category.GPU, Category.MONITOR, Category.PSU] },
  { name: 'Gigabyte', categories: [Category.MOTHERBOARD, Category.GPU] },
  { name: 'ASRock', categories: [Category.MOTHERBOARD, Category.GPU] },
  { name: 'Corsair', categories: [Category.RAM, Category.PSU, Category.CABINET, Category.COOLER, Category.PERIPHERAL] },
  { name: 'G.Skill', categories: [Category.RAM] },
  { name: 'Kingston', categories: [Category.RAM, Category.STORAGE] },
  { name: 'Samsung', categories: [Category.STORAGE, Category.MONITOR] },
  { name: 'Western Digital', categories: [Category.STORAGE] },
  { name: 'Crucial', categories: [Category.STORAGE] },
  { name: 'DeepCool', categories: [Category.COOLER, Category.PSU] },
  { name: 'Noctua', categories: [Category.COOLER] },
  { name: 'EKWB', categories: [Category.COOLER] },
  { name: 'Lian Li', categories: [Category.CABINET, Category.COOLER] },
  { name: 'Cooler Master', categories: [Category.COOLER, Category.PSU, Category.CABINET] },
  { name: 'Sapphire', categories: [Category.GPU] },
  { name: 'Zotac', categories: [Category.GPU] },
  { name: 'LG', categories: [Category.MONITOR] },
  { name: 'BenQ', categories: [Category.MONITOR] },
  { name: 'Keychron', categories: [Category.PERIPHERAL] },
  { name: 'Logitech', categories: [Category.PERIPHERAL] },
  { name: 'HyperX', categories: [Category.PERIPHERAL] },
  { name: 'TP-Link', categories: [Category.NETWORKING] },
  { name: 'D-Link', categories: [Category.NETWORKING] },
];

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCTS
// ─────────────────────────────────────────────────────────────────────────────

const PRODUCTS_DATA = [
  // ── PROCESSORS ─────────────────────────────────────────────────────────────
  {
    id: 'cpu-1', sku: 'CPU-AMD-7800X3D',
    name: 'AMD Ryzen 7 7800X3D', category: 'Processor', price: 36000, stock: 15,
    image: 'https://www.amd.com/content/dam/amd/en/images/products/processors/ryzen/2505503-ryzen-7-7800x3d-og.jpg',
    description: 'The ultimate gaming processor with 3D V-Cache technology.',
    brandName: 'AMD',
    specs: { brand: 'AMD', socket: 'AM5', wattage: '120', ramType: 'DDR5', series: '7000 Series', cores: '8' }
  },
  {
    id: 'cpu-2', sku: 'CPU-INT-14900K',
    name: 'Intel Core i9-14900K', category: 'Processor', price: 55000, stock: 8,
    image: 'https://m.media-amazon.com/images/I/619ytLAytAL.jpg',
    description: '14th Gen High performance for creators and gamers.',
    brandName: 'Intel',
    specs: { brand: 'Intel', socket: 'LGA1700', wattage: '253', ramType: 'DDR5', generation: '14th Gen', cores: '24' }
  },
  {
    id: 'cpu-3', sku: 'CPU-AMD-5600X',
    name: 'AMD Ryzen 5 5600X', category: 'Processor', price: 14000, stock: 25,
    image: 'https://www.amd.com/content/dam/amd/en/images/products/processors/ryzen/2505503-ryzen-5-5600x-og.jpg',
    description: 'Budget king for gaming.',
    brandName: 'AMD',
    specs: { brand: 'AMD', socket: 'AM4', wattage: '65', ramType: 'DDR4', series: '5000 Series', cores: '6' }
  },
  {
    id: 'cpu-4', sku: 'CPU-INT-13600K',
    name: 'Intel Core i5-13600K', category: 'Processor', price: 28500, stock: 20,
    image: 'https://m.media-amazon.com/images/I/61lNEpDfdcL.jpg',
    description: '13th Gen mid-range beast.',
    brandName: 'Intel',
    specs: { brand: 'Intel', socket: 'LGA1700', wattage: '125', ramType: 'DDR5', generation: '13th Gen', cores: '14' }
  },
  {
    id: 'cpu-5', sku: 'CPU-AMD-7950X',
    name: 'AMD Ryzen 9 7950X', category: 'Processor', price: 52000, stock: 5,
    image: 'https://www.amd.com/content/dam/amd/en/images/products/processors/ryzen/2505503-ryzen-9-7900x-og.jpg',
    description: 'Top tier productivity powerhouse.',
    brandName: 'AMD',
    specs: { brand: 'AMD', socket: 'AM5', wattage: '170', ramType: 'DDR5', series: '7000 Series', cores: '16' }
  },
  {
    id: 'cpu-6', sku: 'CPU-AMD-7960X',
    name: 'AMD Ryzen Threadripper 7960X', category: 'Processor', price: 135000, stock: 2,
    image: 'https://m.media-amazon.com/images/I/71Gyox1aqRL.jpg',
    description: 'HEDT processor for extreme workstations.',
    brandName: 'AMD',
    specs: { brand: 'AMD', socket: 'sTR5', wattage: '350', ramType: 'DDR5', series: 'Threadripper', cores: '24' }
  },
  {
    id: 'cpu-7', sku: 'CPU-AMD-7700X',
    name: 'AMD Ryzen 7 7700X', category: 'Processor', price: 32500, stock: 14,
    image: 'https://m.media-amazon.com/images/I/71fZgV7KzBL.jpg',
    description: 'High performance Zen4 gaming CPU.',
    brandName: 'AMD',
    specs: { brand: 'AMD', socket: 'AM5', wattage: '105', ramType: 'DDR5', series: '7000 Series', cores: '8' }
  },
  {
    id: 'cpu-8', sku: 'CPU-INT-14700K',
    name: 'Intel Core i7-14700K', category: 'Processor', price: 43000, stock: 10,
    image: 'https://m.media-amazon.com/images/I/61lNEpDfdcL.jpg',
    description: 'High-end gaming + productivity CPU.',
    brandName: 'Intel',
    specs: { brand: 'Intel', socket: 'LGA1700', wattage: '253', ramType: 'DDR5', generation: '14th Gen', cores: '20' }
  },
  {
    id: 'cpu-9', sku: 'CPU-AMD-7600',
    name: 'AMD Ryzen 5 7600', category: 'Processor', price: 21000, stock: 28,
    image: 'https://m.media-amazon.com/images/I/61C2H9V3yDL.jpg',
    description: 'Efficient midrange Zen4 chip.',
    brandName: 'AMD',
    specs: { brand: 'AMD', socket: 'AM5', wattage: '65', ramType: 'DDR5', series: '7000 Series', cores: '6' }
  },
  {
    id: 'cpu-10', sku: 'CPU-INT-13400F',
    name: 'Intel Core i5-13400F', category: 'Processor', price: 18000, stock: 30,
    image: 'https://m.media-amazon.com/images/I/71Tz1lS3TAL.jpg',
    description: 'Budget gaming champion.',
    brandName: 'Intel',
    specs: { brand: 'Intel', socket: 'LGA1700', wattage: '148', ramType: 'DDR5', generation: '13th Gen', cores: '10' }
  },
  {
    id: 'cpu-11', sku: 'CPU-AMD-5800X',
    name: 'AMD Ryzen 7 5800X', category: 'Processor', price: 22500, stock: 18,
    image: 'https://m.media-amazon.com/images/I/61mYyJ6gH0L.jpg',
    description: 'High performance AM4 processor.',
    brandName: 'AMD',
    specs: { brand: 'AMD', socket: 'AM4', wattage: '105', ramType: 'DDR4', series: '5000 Series', cores: '8' }
  },
  {
    id: 'cpu-12', sku: 'CPU-INT-12100F',
    name: 'Intel Core i3-12100F', category: 'Processor', price: 9000, stock: 40,
    image: 'https://m.media-amazon.com/images/I/61p7FZ7m4DL.jpg',
    description: 'Entry-level gaming CPU.',
    brandName: 'Intel',
    specs: { brand: 'Intel', socket: 'LGA1700', wattage: '89', ramType: 'DDR5', generation: '12th Gen', cores: '4' }
  },
  {
    id: 'cpu-13', sku: 'CPU-AMD-5900X',
    name: 'AMD Ryzen 9 5900X', category: 'Processor', price: 34000, stock: 9,
    image: 'https://m.media-amazon.com/images/I/71u7V9iK9xL.jpg',
    description: 'High core productivity chip.',
    brandName: 'AMD',
    specs: { brand: 'AMD', socket: 'AM4', wattage: '105', ramType: 'DDR4', series: '5000 Series', cores: '12' }
  },
  {
    id: 'cpu-14', sku: 'CPU-INT-12900K',
    name: 'Intel Core i9-12900K', category: 'Processor', price: 36000, stock: 12,
    image: 'https://m.media-amazon.com/images/I/61mYyJ6gH0L.jpg',
    description: 'Flagship 12th Gen CPU.',
    brandName: 'Intel',
    specs: { brand: 'Intel', socket: 'LGA1700', wattage: '241', ramType: 'DDR5', generation: '12th Gen', cores: '16' }
  },
  {
    id: 'cpu-15', sku: 'CPU-AMD-7500F',
    name: 'AMD Ryzen 5 7500F', category: 'Processor', price: 16500, stock: 26,
    image: 'https://m.media-amazon.com/images/I/71fZgV7KzBL.jpg',
    description: 'Budget Zen4 performer.',
    brandName: 'AMD',
    specs: { brand: 'AMD', socket: 'AM5', wattage: '65', ramType: 'DDR5', series: '7000 Series', cores: '6' }
  },
  {
    id: 'cpu-16', sku: 'CPU-INT-14600K',
    name: 'Intel Core i5-14600K', category: 'Processor', price: 31000, stock: 16,
    image: 'https://m.media-amazon.com/images/I/61lNEpDfdcL.jpg',
    description: 'Best value performance CPU.',
    brandName: 'Intel',
    specs: { brand: 'Intel', socket: 'LGA1700', wattage: '181', ramType: 'DDR5', generation: '14th Gen', cores: '14' }
  },
  {
    id: 'cpu-17', sku: 'CPU-AMD-7950X3D',
    name: 'AMD Ryzen 9 7950X3D', category: 'Processor', price: 62000, stock: 6,
    image: 'https://m.media-amazon.com/images/I/71Gyox1aqRL.jpg',
    description: 'Ultimate gaming + workstation CPU.',
    brandName: 'AMD',
    specs: { brand: 'AMD', socket: 'AM5', wattage: '120', ramType: 'DDR5', series: '7000 Series', cores: '16' }
  },
  {
    id: 'cpu-18', sku: 'CPU-INT-13700K',
    name: 'Intel Core i7-13700K', category: 'Processor', price: 39500, stock: 11,
    image: 'https://m.media-amazon.com/images/I/61lNEpDfdcL.jpg',
    description: 'Balanced performance CPU.',
    brandName: 'Intel',
    specs: { brand: 'Intel', socket: 'LGA1700', wattage: '253', ramType: 'DDR5', generation: '13th Gen', cores: '16' }
  },
  {
    id: 'cpu-19', sku: 'CPU-AMD-5600',
    name: 'AMD Ryzen 5 5600', category: 'Processor', price: 12500, stock: 33,
    image: 'https://m.media-amazon.com/images/I/61C2H9V3yDL.jpg',
    description: 'Budget AM4 gaming CPU.',
    brandName: 'AMD',
    specs: { brand: 'AMD', socket: 'AM4', wattage: '65', ramType: 'DDR4', series: '5000 Series', cores: '6' }
  },
  {
    id: 'cpu-20', sku: 'CPU-INT-12400F',
    name: 'Intel Core i5-12400F', category: 'Processor', price: 14000, stock: 29,
    image: 'https://m.media-amazon.com/images/I/71Tz1lS3TAL.jpg',
    description: 'Great value midrange CPU.',
    brandName: 'Intel',
    specs: { brand: 'Intel', socket: 'LGA1700', wattage: '117', ramType: 'DDR5', generation: '12th Gen', cores: '6' }
  },
  {
    id: 'cpu-21', sku: 'CPU-AMD-5700X',
    name: 'AMD Ryzen 7 5700X', category: 'Processor', price: 21000, stock: 19,
    image: 'https://m.media-amazon.com/images/I/61mYyJ6gH0L.jpg',
    description: 'Efficient 8-core CPU.',
    brandName: 'AMD',
    specs: { brand: 'AMD', socket: 'AM4', wattage: '65', ramType: 'DDR4', series: '5000 Series', cores: '8' }
  },
  {
    id: 'cpu-22', sku: 'CPU-INT-12600K',
    name: 'Intel Core i5-12600K', category: 'Processor', price: 24500, stock: 17,
    image: 'https://m.media-amazon.com/images/I/61lNEpDfdcL.jpg',
    description: 'Popular enthusiast CPU.',
    brandName: 'Intel',
    specs: { brand: 'Intel', socket: 'LGA1700', wattage: '150', ramType: 'DDR5', generation: '12th Gen', cores: '10' }
  },
  {
    id: 'cpu-23', sku: 'CPU-AMD-7600X',
    name: 'AMD Ryzen 5 7600X', category: 'Processor', price: 23500, stock: 23,
    image: 'https://m.media-amazon.com/images/I/71fZgV7KzBL.jpg',
    description: 'High clock gaming CPU.',
    brandName: 'AMD',
    specs: { brand: 'AMD', socket: 'AM5', wattage: '105', ramType: 'DDR5', series: '7000 Series', cores: '6' }
  },
  {
    id: 'cpu-24', sku: 'CPU-INT-14700',
    name: 'Intel Core i7-14700', category: 'Processor', price: 38000, stock: 13,
    image: 'https://m.media-amazon.com/images/I/61lNEpDfdcL.jpg',
    description: 'Non-K high performance CPU.',
    brandName: 'Intel',
    specs: { brand: 'Intel', socket: 'LGA1700', wattage: '219', ramType: 'DDR5', generation: '14th Gen', cores: '20' }
  },
  {
    id: 'cpu-25', sku: 'CPU-AMD-7900',
    name: 'AMD Ryzen 9 7900', category: 'Processor', price: 41000, stock: 8,
    image: 'https://m.media-amazon.com/images/I/71Gyox1aqRL.jpg',
    description: 'Efficient 12-core Zen4 CPU.',
    brandName: 'AMD',
    specs: { brand: 'AMD', socket: 'AM5', wattage: '65', ramType: 'DDR5', series: '7000 Series', cores: '12' }
  },
  {
    id: 'cpu-26', sku: 'CPU-INT-13900KS',
    name: 'Intel Core i9-13900KS', category: 'Processor', price: 65000, stock: 4,
    image: 'https://m.media-amazon.com/images/I/61lNEpDfdcL.jpg',
    description: 'Extreme flagship processor.',
    brandName: 'Intel',
    specs: { brand: 'Intel', socket: 'LGA1700', wattage: '253', ramType: 'DDR5', generation: '13th Gen', cores: '24' }
  },

  // ── MOTHERBOARDS ────────────────────────────────────────────────────────────
  {
    id: 'mobo-1', sku: 'MB-ROG-X670E',
    name: 'ASUS ROG Strix X670E-E Gaming WiFi', category: 'Motherboard', price: 42000, stock: 10,
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSog2RHpDaYyq58a4pnux9TyvzNBUFhYM2ZQA&s',
    description: 'Premium AM5 motherboard with PCIe 5.0.',
    brandName: 'ASUS',
    specs: { brand: 'ASUS', socket: 'AM5', ramType: 'DDR5', formFactor: 'ATX', chipset: 'X670' }
  },
  {
    id: 'mobo-2', sku: 'MB-MSI-Z790',
    name: 'MSI MAG Z790 Tomahawk WiFi', category: 'Motherboard', price: 28000, stock: 12,
    image: 'https://asset.msi.com/resize/image/global/product/product_1664265391459c76c55d481a806150407f1b07a6bb.png62405b38c58fe0f07fcef2367d8a9ba1/1024.png',
    description: 'Reliable foundation for Intel 12th/13th/14th Gen.',
    brandName: 'MSI',
    specs: { brand: 'MSI', socket: 'LGA1700', ramType: 'DDR5', formFactor: 'ATX', chipset: 'Z790' }
  },
  {
    id: 'mobo-3', sku: 'MB-GIG-B550M',
    name: 'Gigabyte B550M DS3H', category: 'Motherboard', price: 9000, stock: 30,
    image: 'https://m.media-amazon.com/images/I/71ZMMyOQfOL.jpg',
    description: 'Solid budget board for AM4.',
    brandName: 'Gigabyte',
    // 'mATX' → normalised to 'Micro-ATX' to match filter config options
    specs: { brand: 'Gigabyte', socket: 'AM4', ramType: 'DDR4', formFactor: 'Micro-ATX', chipset: 'B550' }
  },
  {
    id: 'mobo-4', sku: 'MB-ASR-B650M',
    name: 'ASRock B650M Pro RS', category: 'Motherboard', price: 13500, stock: 18,
    image: 'https://www.asrock.com/mb/photo/B650M%20Pro%20RS(M1).png',
    description: 'Great value AM5 Micro ATX board.',
    brandName: 'ASRock',
    specs: { brand: 'ASRock', socket: 'AM5', ramType: 'DDR5', formFactor: 'Micro-ATX', chipset: 'B650' }
  },
  {
    id: 'mobo-5', sku: 'MB-MSI-B760',
    name: 'MSI PRO B760-P DDR4', category: 'Motherboard', price: 15500, stock: 15,
    image: 'https://m.media-amazon.com/images/I/91ZPVQjJ7kL.jpg',
    description: 'Cost effective Intel board supporting DDR4.',
    brandName: 'MSI',
    specs: { brand: 'MSI', socket: 'LGA1700', ramType: 'DDR4', formFactor: 'ATX', chipset: 'B760' }
  },
  {
    id: 'mobo-6', sku: 'MB-ASUS-B650',
    name: 'ASUS TUF B650-PLUS', category: 'Motherboard', price: 19000, stock: 18,
    image: 'https://m.media-amazon.com/images/I/71M9yG3R7XL.jpg',
    description: 'Durable AM5 board.',
    brandName: 'ASUS',
    specs: { brand: 'ASUS', socket: 'AM5', ramType: 'DDR5', formFactor: 'ATX', chipset: 'B650' }
  },
  {
    id: 'mobo-7', sku: 'MB-MSI-B650',
    name: 'MSI B650 Gaming Plus', category: 'Motherboard', price: 17500, stock: 20,
    image: 'https://m.media-amazon.com/images/I/81zK8VZxZPL.jpg',
    description: 'Balanced AM5 motherboard.',
    brandName: 'MSI',
    specs: { brand: 'MSI', socket: 'AM5', ramType: 'DDR5', formFactor: 'ATX', chipset: 'B650' }
  },
  {
    id: 'mobo-8', sku: 'MB-GIG-X670',
    name: 'Gigabyte X670 Aorus Elite', category: 'Motherboard', price: 29000, stock: 9,
    image: 'https://m.media-amazon.com/images/I/81E6R7Y6dPL.jpg',
    description: 'Premium AM5 board.',
    brandName: 'Gigabyte',
    specs: { brand: 'Gigabyte', socket: 'AM5', ramType: 'DDR5', formFactor: 'ATX', chipset: 'X670' }
  },
  {
    id: 'mobo-9', sku: 'MB-ASR-A620',
    name: 'ASRock A620M-HDV', category: 'Motherboard', price: 9000, stock: 32,
    image: 'https://m.media-amazon.com/images/I/71L+O+6N0AL.jpg',
    description: 'Entry AM5 board.',
    brandName: 'ASRock',
    specs: { brand: 'ASRock', socket: 'AM5', ramType: 'DDR5', formFactor: 'Micro-ATX', chipset: 'A620' }
  },
  {
    id: 'mobo-10', sku: 'MB-MSI-Z690',
    name: 'MSI Z690 Tomahawk', category: 'Motherboard', price: 26000, stock: 14,
    image: 'https://m.media-amazon.com/images/I/81zK8VZxZPL.jpg',
    description: 'High-end Intel board.',
    brandName: 'MSI',
    specs: { brand: 'MSI', socket: 'LGA1700', ramType: 'DDR5', formFactor: 'ATX', chipset: 'Z690' }
  },
  {
    id: 'mobo-11', sku: 'MB-ASUS-B760',
    name: 'ASUS Prime B760M-A', category: 'Motherboard', price: 15500, stock: 21,
    image: 'https://m.media-amazon.com/images/I/71M9yG3R7XL.jpg',
    description: 'Reliable Intel board.',
    brandName: 'ASUS',
    specs: { brand: 'ASUS', socket: 'LGA1700', ramType: 'DDR5', formFactor: 'Micro-ATX', chipset: 'B760' }
  },
  {
    id: 'mobo-12', sku: 'MB-GIG-H610',
    name: 'Gigabyte H610M S2H', category: 'Motherboard', price: 7000, stock: 40,
    image: 'https://m.media-amazon.com/images/I/71ZMMyOQfOL.jpg',
    description: 'Budget Intel board.',
    brandName: 'Gigabyte',
    specs: { brand: 'Gigabyte', socket: 'LGA1700', ramType: 'DDR4', formFactor: 'Micro-ATX', chipset: 'H610' }
  },
  {
    id: 'mobo-13', sku: 'MB-ASUS-X570',
    name: 'ASUS ROG Strix X570-E', category: 'Motherboard', price: 24000, stock: 11,
    image: 'https://m.media-amazon.com/images/I/71M9yG3R7XL.jpg',
    description: 'Premium AM4 board.',
    brandName: 'ASUS',
    specs: { brand: 'ASUS', socket: 'AM4', ramType: 'DDR4', formFactor: 'ATX', chipset: 'X570' }
  },
  {
    id: 'mobo-14', sku: 'MB-MSI-B550',
    name: 'MSI B550 Tomahawk', category: 'Motherboard', price: 14500, stock: 22,
    image: 'https://m.media-amazon.com/images/I/81zK8VZxZPL.jpg',
    description: 'Popular AM4 board.',
    brandName: 'MSI',
    specs: { brand: 'MSI', socket: 'AM4', ramType: 'DDR4', formFactor: 'ATX', chipset: 'B550' }
  },
  {
    id: 'mobo-15', sku: 'MB-GIG-A520',
    name: 'Gigabyte A520M', category: 'Motherboard', price: 6000, stock: 35,
    image: 'https://m.media-amazon.com/images/I/71ZMMyOQfOL.jpg',
    description: 'Entry AM4 motherboard.',
    brandName: 'Gigabyte',
    specs: { brand: 'Gigabyte', socket: 'AM4', ramType: 'DDR4', formFactor: 'Micro-ATX', chipset: 'A520' }
  },
  {
    id: 'mobo-16', sku: 'MB-ASR-Z790',
    name: 'ASRock Z790 Steel Legend', category: 'Motherboard', price: 30500, stock: 8,
    image: 'https://m.media-amazon.com/images/I/81E6R7Y6dPL.jpg',
    description: 'High-end Intel board.',
    brandName: 'ASRock',
    specs: { brand: 'ASRock', socket: 'LGA1700', ramType: 'DDR5', formFactor: 'ATX', chipset: 'Z790' }
  },
  {
    id: 'mobo-17', sku: 'MB-MSI-H610',
    name: 'MSI Pro H610M', category: 'Motherboard', price: 7200, stock: 37,
    image: 'https://m.media-amazon.com/images/I/71ZMMyOQfOL.jpg',
    description: 'Budget Intel motherboard.',
    brandName: 'MSI',
    specs: { brand: 'MSI', socket: 'LGA1700', ramType: 'DDR4', formFactor: 'Micro-ATX', chipset: 'H610' }
  },
  {
    id: 'mobo-18', sku: 'MB-ASUS-Z790',
    name: 'ASUS TUF Z790-Plus', category: 'Motherboard', price: 31000, stock: 10,
    image: 'https://m.media-amazon.com/images/I/71M9yG3R7XL.jpg',
    description: 'Enthusiast Intel board.',
    brandName: 'ASUS',
    specs: { brand: 'ASUS', socket: 'LGA1700', ramType: 'DDR5', formFactor: 'ATX', chipset: 'Z790' }
  },
  {
    id: 'mobo-19', sku: 'MB-GIG-B760',
    name: 'Gigabyte B760 Gaming X', category: 'Motherboard', price: 17000, stock: 19,
    image: 'https://m.media-amazon.com/images/I/81E6R7Y6dPL.jpg',
    description: 'Balanced Intel board.',
    brandName: 'Gigabyte',
    specs: { brand: 'Gigabyte', socket: 'LGA1700', ramType: 'DDR5', formFactor: 'ATX', chipset: 'B760' }
  },
  {
    id: 'mobo-20', sku: 'MB-ASR-B450',
    name: 'ASRock B450M Pro4', category: 'Motherboard', price: 8000, stock: 29,
    image: 'https://m.media-amazon.com/images/I/71ZMMyOQfOL.jpg',
    description: 'Affordable AM4 board.',
    brandName: 'ASRock',
    specs: { brand: 'ASRock', socket: 'AM4', ramType: 'DDR4', formFactor: 'Micro-ATX', chipset: 'B450' }
  },
  {
    id: 'mobo-21', sku: 'MB-MSI-X570',
    name: 'MSI X570 Gaming Edge', category: 'Motherboard', price: 20500, stock: 12,
    image: 'https://m.media-amazon.com/images/I/81zK8VZxZPL.jpg',
    description: 'AM4 enthusiast board.',
    brandName: 'MSI',
    specs: { brand: 'MSI', socket: 'AM4', ramType: 'DDR4', formFactor: 'ATX', chipset: 'X570' }
  },
  {
    id: 'mobo-22', sku: 'MB-ASUS-A520',
    name: 'ASUS Prime A520M-K', category: 'Motherboard', price: 6500, stock: 42,
    image: 'https://m.media-amazon.com/images/I/71ZMMyOQfOL.jpg',
    description: 'Budget AM4 motherboard.',
    brandName: 'ASUS',
    specs: { brand: 'ASUS', socket: 'AM4', ramType: 'DDR4', formFactor: 'Micro-ATX', chipset: 'A520' }
  },
  {
    id: 'mobo-23', sku: 'MB-GIG-B650M',
    name: 'Gigabyte B650M DS3H', category: 'Motherboard', price: 13500, stock: 17,
    image: 'https://m.media-amazon.com/images/I/81E6R7Y6dPL.jpg',
    description: 'Compact AM5 board.',
    brandName: 'Gigabyte',
    specs: { brand: 'Gigabyte', socket: 'AM5', ramType: 'DDR5', formFactor: 'Micro-ATX', chipset: 'B650' }
  },
  {
    id: 'mobo-24', sku: 'MB-MSI-X670E',
    name: 'MSI X670E Carbon', category: 'Motherboard', price: 46000, stock: 6,
    image: 'https://m.media-amazon.com/images/I/81zK8VZxZPL.jpg',
    description: 'Ultra premium AM5 board.',
    brandName: 'MSI',
    specs: { brand: 'MSI', socket: 'AM5', ramType: 'DDR5', formFactor: 'ATX', chipset: 'X670' }
  },
  {
    id: 'mobo-25', sku: 'MB-ASR-H610',
    name: 'ASRock H610M-HDV', category: 'Motherboard', price: 6800, stock: 38,
    image: 'https://m.media-amazon.com/images/I/71ZMMyOQfOL.jpg',
    description: 'Entry Intel motherboard.',
    brandName: 'ASRock',
    specs: { brand: 'ASRock', socket: 'LGA1700', ramType: 'DDR4', formFactor: 'Micro-ATX', chipset: 'H610' }
  },

  // ── GRAPHICS CARDS ──────────────────────────────────────────────────────────
  {
    id: 'gpu-1', sku: 'GPU-NV-4090',
    name: 'NVIDIA RTX 4090 Founders Edition', category: 'Graphics Card', price: 185000, stock: 3,
    image: 'https://m.media-amazon.com/images/I/71RgD3MP-hL._AC_UF1000,1000_QL80_.jpg',
    description: 'The absolute best performance for 4K gaming and AI.',
    brandName: 'NVIDIA',
    specs: { brand: 'NVIDIA', wattage: '450', memory: '24GB', series: '40 Series' }
  },
  {
    id: 'gpu-2', sku: 'GPU-SAP-7800XT',
    name: 'Sapphire Nitro+ AMD Radeon RX 7800 XT', category: 'Graphics Card', price: 52000, stock: 20,
    image: 'https://m.media-amazon.com/images/I/81zdqJr2TYL.jpg',
    description: 'Great value for 1440p gaming.',
    brandName: 'Sapphire',
    specs: { brand: 'Sapphire', wattage: '263', memory: '16GB', series: '7000 Series' }
  },
  {
    id: 'gpu-3', sku: 'GPU-ZOT-4070',
    name: 'Zotac Gaming GeForce RTX 4070 Twin Edge', category: 'Graphics Card', price: 56000, stock: 25,
    image: 'https://m.media-amazon.com/images/I/61KZsTaMtcL._AC_UF1000,1000_QL80_FMwebp_.jpg',
    description: 'Compact 1440p card.',
    brandName: 'Zotac',
    specs: { brand: 'Zotac', wattage: '200', memory: '12GB', series: '40 Series' }
  },
  {
    id: 'gpu-4', sku: 'GPU-ASUS-3060',
    name: 'ASUS Dual GeForce RTX 3060 V2 OC', category: 'Graphics Card', price: 26000, stock: 40,
    image: 'https://m.media-amazon.com/images/I/71hoPufXoDL._AC_UF1000,1000_QL80_.jpg',
    description: 'The budget king for 1080p gaming.',
    brandName: 'ASUS',
    specs: { brand: 'ASUS', wattage: '170', memory: '12GB', series: '30 Series' }
  },
  {
    id: 'gpu-5', sku: 'GPU-GIG-6600',
    name: 'Gigabyte Radeon RX 6600 Eagle', category: 'Graphics Card', price: 19500, stock: 15,
    image: 'https://m.media-amazon.com/images/I/6121pomHteL.jpg',
    description: 'Entry level 1080p performer.',
    brandName: 'Gigabyte',
    specs: { brand: 'Gigabyte', wattage: '132', memory: '8GB', series: '6000 Series' }
  },

  // ── RAM ─────────────────────────────────────────────────────────────────────
  {
    id: 'ram-1', sku: 'RAM-GSK-32',
    name: 'G.Skill Trident Z5 RGB 32GB (16GBx2)', category: 'RAM', price: 12500, stock: 50,
    image: 'https://m.media-amazon.com/images/I/61bc6zvEIIL.jpg',
    description: 'High speed DDR5 6000MHz memory for enthusiasts.',
    brandName: 'G.Skill',
    specs: { brand: 'G.Skill', ramType: 'DDR5', frequency: '6000MHz', capacity: '32GB' }
  },
  {
    id: 'ram-2', sku: 'RAM-COR-16',
    name: 'Corsair Vengeance LPX 16GB (8GBx2)', category: 'RAM', price: 4500, stock: 100,
    image: 'https://m.media-amazon.com/images/I/51W4+1Da0IL._AC_UF1000,1000_QL80_.jpg',
    description: 'Reliable DDR4 3200MHz memory.',
    brandName: 'Corsair',
    specs: { brand: 'Corsair', ramType: 'DDR4', frequency: '3200MHz', capacity: '16GB' }
  },
  {
    id: 'ram-3', sku: 'RAM-KIN-8',
    name: 'Kingston Fury Beast 8GB', category: 'RAM', price: 2200, stock: 80,
    image: 'https://m.media-amazon.com/images/I/71+pGDyVzrL.jpg',
    description: 'Single stick DDR4 module.',
    brandName: 'Kingston',
    specs: { brand: 'Kingston', ramType: 'DDR4', frequency: '3200MHz', capacity: '8GB' }
  },

  // ── COOLING ─────────────────────────────────────────────────────────────────
  {
    id: 'cool-1', sku: 'COOL-DEP-LS720',
    name: 'DeepCool LS720 ARGB AIO', category: 'Cooler', price: 11000, stock: 20,
    image: 'https://cdn.deepcool.com/public/ProductFile/DEEPCOOL/Cooling/CPULiquidCoolers/LS720_WH/Overview/01.png?fm=webp&q=60',
    description: '360mm ARGB AIO Liquid Cooler.',
    brandName: 'DeepCool',
    specs: { brand: 'DeepCool', type: 'AIO Liquid Cooler', size: '360mm' }
  },
  {
    id: 'cool-2', sku: 'COOL-NOC-D15',
    name: 'Noctua NH-D15', category: 'Cooler', price: 8500, stock: 15,
    image: 'https://m.media-amazon.com/images/I/91Hw1zcAIjL.jpg',
    description: 'Premium Air Cooler, dual tower design.',
    brandName: 'Noctua',
    specs: { brand: 'Noctua', type: 'Air Cooler' }
  },
  {
    id: 'cool-3', sku: 'COOL-EK-WB',
    name: 'EKWB Quantum Velocity CPU Water Block', category: 'Cooler', price: 9500, stock: 5,
    image: 'https://m.media-amazon.com/images/I/51w8kD-Y+2L._AC_UF1000,1000_QL80_.jpg',
    description: 'High-end custom loop CPU Water Block.',
    brandName: 'EKWB',
    specs: { brand: 'EKWB', type: 'Water Block', socket: 'AM5/LGA1700' }
  },
  {
    id: 'cool-4', sku: 'COOL-COR-XD5',
    name: 'Corsair Hydro X Series XD5 Pump', category: 'Cooler', price: 14500, stock: 8,
    image: 'https://m.media-amazon.com/images/I/61CL70frlAL._AC_UF1000,1000_QL80_.jpg',
    description: 'RGB Pump and Reservoir Combo for custom loops.',
    brandName: 'Corsair',
    specs: { brand: 'Corsair', type: 'Pump & Reservoir' }
  },

  // ── STORAGE ─────────────────────────────────────────────────────────────────
  {
    id: 'stg-1', sku: 'SSD-SAM-990',
    name: 'Samsung 990 Pro 1TB', category: 'Storage', price: 10500, stock: 40,
    image: 'https://m.media-amazon.com/images/I/71XHEQZZW+L.jpg',
    description: 'Blazing fast NVMe Gen4 SSD.',
    brandName: 'Samsung',
    specs: { brand: 'Samsung', type: 'SSD', interface: 'NVMe Gen4', capacity: '1TB' }
  },
  {
    id: 'stg-2', sku: 'HDD-WD-2TB',
    name: 'Western Digital Blue 2TB HDD', category: 'Storage', price: 4800, stock: 60,
    image: 'https://m.media-amazon.com/images/I/71pzrrdIS2L.jpg',
    description: 'Reliable storage for mass data.',
    brandName: 'Western Digital',
    specs: { brand: 'Western Digital', type: 'HDD', interface: 'SATA', capacity: '2TB' }
  },
  {
    id: 'stg-3', sku: 'SSD-CRU-500',
    name: 'Crucial P3 500GB', category: 'Storage', price: 3500, stock: 35,
    image: 'https://m.media-amazon.com/images/I/51pMg25AthL.jpg',
    description: 'Budget NVMe Gen3 SSD.',
    brandName: 'Crucial',
    specs: { brand: 'Crucial', type: 'SSD', interface: 'NVMe Gen3', capacity: '500GB' }
  },

  // ── PSU ─────────────────────────────────────────────────────────────────────
  {
    id: 'psu-1', sku: 'PSU-COR-850',
    name: 'Corsair RM850e', category: 'Power Supply', price: 11000, stock: 15,
    image: 'https://m.media-amazon.com/images/I/61J0tIvkBYL.jpg',
    description: '850W 80 Plus Gold Rated Modular PSU.',
    brandName: 'Corsair',
    specs: { brand: 'Corsair', wattage: '850', efficiency: 'Gold' }
  },
  {
    id: 'psu-2', sku: 'PSU-CM-550',
    name: 'Cooler Master MWE 550 V2', category: 'Power Supply', price: 4500, stock: 22,
    image: 'https://m.media-amazon.com/images/I/81zTChlbPHL._AC_UF1000,1000_QL80_.jpg',
    description: '550W 80 Plus Bronze Rated PSU.',
    brandName: 'Cooler Master',
    specs: { brand: 'Cooler Master', wattage: '550', efficiency: 'Bronze' }
  },
  {
    id: 'psu-3', sku: 'PSU-MSI-1000',
    name: 'MSI MPG A1000G', category: 'Power Supply', price: 16000, stock: 10,
    image: 'https://m.media-amazon.com/images/I/719fJ78WuEL.jpg',
    description: '1000W PCIe 5.0 Ready Gold PSU.',
    brandName: 'MSI',
    specs: { brand: 'MSI', wattage: '1000', efficiency: 'Gold' }
  },

  // ── CABINETS ────────────────────────────────────────────────────────────────
  {
    id: 'cab-1', sku: 'CAB-LIA-O11',
    name: 'Lian Li O11 Dynamic Evo', category: 'Cabinet', price: 14000, stock: 12,
    image: 'https://m.media-amazon.com/images/I/61KmNQhuxvL._AC_UF1000,1000_QL80_.jpg',
    description: 'The classic showcase Mid Tower chassis.',
    brandName: 'Lian Li',
    specs: { brand: 'Lian Li', formFactor: 'Mid Tower', color: 'Black' }
  },
  {
    id: 'cab-2', sku: 'CAB-COR-4000',
    name: 'Corsair 4000D Airflow', category: 'Cabinet', price: 7000, stock: 30,
    image: 'https://m.media-amazon.com/images/I/71J4iohAlaL.jpg',
    description: 'High airflow Mid Tower case.',
    brandName: 'Corsair',
    specs: { brand: 'Corsair', formFactor: 'Mid Tower', color: 'White' }
  },
  {
    id: 'cab-3', sku: 'CAB-CM-HAF',
    name: 'Cooler Master HAF 700 Evo', category: 'Cabinet', price: 35000, stock: 4,
    image: 'https://m.media-amazon.com/images/I/61hC6R08S+L._AC_UF1000,1000_QL80_.jpg',
    description: 'Massive Full Tower for extreme builds.',
    brandName: 'Cooler Master',
    specs: { brand: 'Cooler Master', formFactor: 'Full Tower', color: 'Titanium' }
  },

  // ── MONITORS ────────────────────────────────────────────────────────────────
  {
    id: 'mon-1', sku: 'MON-LG-27',
    name: 'LG UltraGear 27GN950', category: 'Monitor', price: 45000, stock: 5,
    image: 'https://media.us.lg.com/transform/6747bdf5-28d0-4caa-a288-ba854a3c6553/Monitor_SYNC_mnt-27gn950-09_features_900x600?io=transform:fill,width:1536',
    description: '27 Inch 4K 144Hz Nano IPS Gaming Monitor.',
    brandName: 'LG',
    specs: { brand: 'LG', size: '27 Inch', resolution: '4K', type: 'Gaming' }
  },
  {
    id: 'mon-2', sku: 'MON-BEN-24',
    name: 'BenQ GW2480', category: 'Monitor', price: 10000, stock: 40,
    image: 'https://image.benq.com/is/image/benqco/gw2480l-left45?$ResponsivePreset$&fmt=png-alpha',
    description: '24 Inch Eye Care Monitor.',
    brandName: 'BenQ',
    specs: { brand: 'BenQ', size: '24 Inch', resolution: '1080p', type: 'Professional' }
  },
  {
    id: 'mon-3', sku: 'MON-SAM-32',
    name: 'Samsung Odyssey G7', category: 'Monitor', price: 38000, stock: 8,
    image: 'https://m.media-amazon.com/images/I/81UUzgE+FIL._AC_UF1000,1000_QL80_.jpg',
    description: '32 Inch Curved 240Hz Gaming Monitor.',
    brandName: 'Samsung',
    specs: { brand: 'Samsung', size: '32 Inch', resolution: '2K', type: 'Gaming' }
  },

  // ── PERIPHERALS ─────────────────────────────────────────────────────────────
  {
    id: 'per-1', sku: 'PER-KEY-K2',
    name: 'Keychron K2 V2', category: 'Peripheral', price: 8000, stock: 10,
    image: 'https://picsum.photos/300/300?random=15',
    description: 'Wireless Mechanical Keyboard.',
    brandName: 'Keychron',
    specs: { brand: 'Keychron', type: 'Mechanical Keyboard', connectivity: 'Wireless' }
  },
  {
    id: 'per-2', sku: 'PER-LOG-GPX',
    name: 'Logitech G Pro X Superlight', category: 'Peripheral', price: 13000, stock: 8,
    image: 'https://picsum.photos/300/300?random=16',
    description: 'Ultra-lightweight wireless gaming mouse.',
    brandName: 'Logitech',
    specs: { brand: 'Logitech', type: 'Gaming Mouse', connectivity: 'Wireless' }
  },
  {
    id: 'per-3', sku: 'PER-HYP-CL2',
    name: 'HyperX Cloud II', category: 'Peripheral', price: 7500, stock: 25,
    image: 'https://picsum.photos/300/300?random=38',
    description: 'Legendary wired gaming headset.',
    brandName: 'HyperX',
    specs: { brand: 'HyperX', type: 'Headset', connectivity: 'Wired' }
  },

  // ── NETWORKING ──────────────────────────────────────────────────────────────
  {
    id: 'net-1', sku: 'NET-TP-AX73',
    name: 'TP-Link Archer AX73', category: 'Networking', price: 9000, stock: 12,
    image: 'https://picsum.photos/300/300?random=39',
    description: 'AX5400 Dual-Band Gigabit Wi-Fi 6 Router.',
    brandName: 'TP-Link',
    specs: { brand: 'TP-Link', type: 'Router', standard: 'WiFi 6' }
  },
  {
    id: 'net-2', sku: 'NET-DL-8P',
    name: 'D-Link 8 Port Gigabit Switch', category: 'Networking', price: 1500, stock: 50,
    image: 'https://picsum.photos/300/300?random=40',
    description: 'Unmanaged Gigabit Desktop Switch.',
    brandName: 'D-Link',
    specs: { brand: 'D-Link', type: 'Switch', ports: '8' }
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY SCHEMAS (from ShopContext INITIAL_SCHEMAS)
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
      { key: 'socket', label: 'Intel Socket', type: 'select', required: true, options: ['LGA1151', 'LGA1200', 'LGA1700', 'LGA1851'], sortOrder: 0, dependencyKey: 'brand', dependencyValue: 'Intel' },
      { key: 'socket', label: 'AMD Socket', type: 'select', required: true, options: ['AM4', 'AM5', 'sTR5'], sortOrder: 1, dependencyKey: 'brand', dependencyValue: 'AMD' },
      { key: 'cores', label: 'Cores', type: 'number', required: true, sortOrder: 2 },
      { key: 'generation', label: 'Generation', type: 'select', required: false, options: ['9th Gen', '10th Gen', '11th Gen', '12th Gen', '13th Gen', '14th Gen'], sortOrder: 3, dependencyKey: 'brand', dependencyValue: 'Intel' },
      { key: 'series', label: 'Series', type: 'select', required: false, options: ['3000 Series', '5000 Series', '7000 Series', '8000 Series', '9000 Series', 'Threadripper'], sortOrder: 4, dependencyKey: 'brand', dependencyValue: 'AMD' },
      { key: 'wattage', label: 'TDP (Watts)', type: 'number', required: true, unit: 'W', sortOrder: 5 },
      { key: 'ramType', label: 'RAM Support', type: 'select', required: true, options: ['DDR4', 'DDR5'], sortOrder: 6 },
      { key: 'family', label: 'CPU Family', type: 'select', required: false, options: ['Athlon', 'Ryzen 3', 'Ryzen 5', 'Ryzen 7', 'Ryzen 9'], sortOrder: 7, dependencyKey: 'brand', dependencyValue: 'AMD' },
      { key: 'family', label: 'CPU Line', type: 'select', required: false, options: ['Core i3', 'Core i5', 'Core i7', 'Core i9', 'Core Ultra 5', 'Core Ultra 7', 'Core Ultra 9'], sortOrder: 8, dependencyKey: 'brand', dependencyValue: 'Intel' },
      { key: 'maxMemory', label: 'Max Memory', type: 'select', required: false, options: ['64 GB', '128 GB', '192 GB', '256 GB'], sortOrder: 9 },
      { key: 'integratedGraphics', label: 'Integrated Graphics', type: 'select', required: false, options: ['No', 'Intel UHD Graphics 630', 'Intel UHD Graphics 730', 'Intel UHD Graphics 770', 'Radeon Graphics'], sortOrder: 10 },
    ]
  },
  {
    category: Category.MOTHERBOARD,
    attributes: [
      { key: 'platform', label: 'Platform', type: 'select', required: true, options: ['AMD', 'Intel'], sortOrder: 0 },
      { key: 'socket', label: 'Socket', type: 'select', required: true, options: ['AM4', 'AM5', 'sTR5', 'LGA1151', 'LGA1200', 'LGA1700', 'LGA1851'], sortOrder: 1 },
      { key: 'chipset', label: 'Chipset', type: 'select', required: true, options: ['A520', 'B450', 'B550', 'B650', 'B760', 'X570', 'X670', 'X870', 'H510', 'H610', 'Z690', 'Z790', 'Z890'], sortOrder: 2 },
      { key: 'formFactor', label: 'Form Factor', type: 'select', required: true, options: ['ATX', 'Micro-ATX', 'E-ATX', 'Mini-ITX'], sortOrder: 3 },
      { key: 'ramType', label: 'Memory Type', type: 'select', required: true, options: ['DDR4', 'DDR5'], sortOrder: 4 },
    ]
  },
  {
    category: Category.GPU,
    attributes: [
      { key: 'chipset', label: 'Chipset', type: 'select', required: true, options: ['AMD RADEON', 'NVIDIA GEFORCE', 'NVIDIA QUADRO', 'Intel Arc'], sortOrder: 0 },
      { key: 'model', label: 'GPU Model', type: 'text', required: true, sortOrder: 1 },
      { key: 'memory', label: 'VRAM', type: 'text', required: true, sortOrder: 2 },
      { key: 'memoryType', label: 'Memory Type', type: 'select', required: true, options: ['DDR3', 'GDDR5', 'GDDR6', 'GDDR6X', 'GDDR7'], sortOrder: 3 },
      { key: 'pcie', label: 'PCI Express', type: 'select', required: false, options: ['2.0', '3.0', '4.0', '5.0'], sortOrder: 4 },
      { key: 'wattage', label: 'TDP (W)', type: 'number', required: true, unit: 'W', sortOrder: 5 },
    ]
  },
  {
    category: Category.RAM,
    attributes: [
      { key: 'ramType', label: 'Memory Type', type: 'select', required: true, options: ['DDR3', 'DDR4', 'DDR5'], sortOrder: 0 },
      { key: 'capacity', label: 'Capacity', type: 'text', required: true, sortOrder: 1 },
      { key: 'frequency', label: 'Speed', type: 'text', required: true, sortOrder: 2 },
      { key: 'kit', label: 'Kit Type', type: 'select', required: false, options: ['4x1', '8x1', '16x1', '16x2', '24x2', '32x2'], sortOrder: 3 },
      { key: 'series', label: 'Product Series', type: 'text', required: false, sortOrder: 4 },
    ]
  },
  {
    category: Category.STORAGE,
    attributes: [
      { key: 'type', label: 'Category', type: 'select', required: true, options: ['Internal SSD', 'Internal HDD', 'External SSD', 'External HDD', 'Enterprise SSD', 'Pen Drive'], sortOrder: 0 },
      { key: 'capacity', label: 'Capacity', type: 'text', required: true, sortOrder: 1 },
      { key: 'interface', label: 'Interface', type: 'text', required: false, sortOrder: 2 },
      { key: 'series', label: 'Series', type: 'text', required: false, sortOrder: 3 },
    ]
  },
  {
    category: Category.PSU,
    attributes: [
      { key: 'wattage', label: 'Wattage', type: 'number', required: true, unit: 'W', sortOrder: 0 },
      { key: 'efficiency', label: 'Certification', type: 'select', required: true, options: ['Bronze', 'Gold', 'Platinum', 'Silver', 'Titanium'], sortOrder: 1 },
      { key: 'modular', label: 'Modular', type: 'select', required: true, options: ['Fully', 'Non', 'Semi'], sortOrder: 2 },
      { key: 'series', label: 'Series', type: 'text', required: false, sortOrder: 3 },
      { key: 'pcie62', label: 'PCIe 6+2 Connectors', type: 'number', required: false, sortOrder: 4 },
      { key: 'sata', label: 'SATA Connectors', type: 'number', required: false, sortOrder: 5 },
      { key: 'peripheral4pin', label: 'Peripheral 4-Pin', type: 'number', required: false, sortOrder: 6 },
    ]
  },
  {
    category: Category.CABINET,
    attributes: [
      { key: 'formFactor', label: 'Cabinet Size', type: 'select', required: true, options: ['Full', 'Mid', 'Mini', 'Super', 'SFF'], sortOrder: 0 },
      { key: 'motherboardSupport', label: 'Motherboard Size', type: 'select', required: true, options: ['ATX', 'E-ATX', 'ITX', 'M-ATX', 'M-ITX'], sortOrder: 1 },
      { key: 'radiatorSupport', label: 'Radiator Support', type: 'text', required: false, sortOrder: 2 },
      { key: 'color', label: 'Color', type: 'text', required: false, sortOrder: 3 },
    ]
  },
  {
    category: Category.COOLER,
    attributes: [
      { key: 'type', label: 'Cooling Type', type: 'select', required: true, options: ['AIR COOLER', 'LIQUID AIO COOLER', 'Water Block', 'Pump & Reservoir'], sortOrder: 0 },
      { key: 'socket', label: 'Socket Support', type: 'multi-select', required: false, options: ['AM2', 'AM2+', 'AM3', 'AM3+', 'AM4', 'AM5', 'LGA1151', 'LGA1200', 'LGA1700'], sortOrder: 1 },
      { key: 'radiatorSize', label: 'Radiator Size', type: 'select', required: false, options: ['240mm', '280mm', '360mm', '420mm'], sortOrder: 2 },
      { key: 'fanSize', label: 'Fan Size', type: 'select', required: false, options: ['40mm', '60mm', '90mm', '92mm', '120mm', '140mm'], sortOrder: 3 },
      { key: 'pwm', label: 'PWM Controller', type: 'select', required: false, options: ['NA', 'YES'], sortOrder: 4 },
    ]
  },
  {
    category: Category.MONITOR,
    attributes: [
      { key: 'size', label: 'Screen Size', type: 'select', required: true, options: ['22 Inch', '24 Inch', '27 Inch', '32 Inch', '34 Inch', '49 Inch'], sortOrder: 0 },
      { key: 'displayType', label: 'Display Type', type: 'select', required: false, options: ['FHD', 'QHD', 'UHD', 'DQHD', '5K HDR'], sortOrder: 1 },
      { key: 'panel', label: 'Panel Type', type: 'select', required: false, options: ['IPS', 'OLED', 'QD-OLED', 'TN', 'VA'], sortOrder: 2 },
      { key: 'resolution', label: 'Resolution', type: 'select', required: true, options: ['1080p', '1440p', '2K', '4K', '5K'], sortOrder: 3 },
      { key: 'responseTime', label: 'Response Time', type: 'text', required: false, sortOrder: 4 },
      { key: 'refreshRate', label: 'Refresh Rate', type: 'select', required: false, options: ['60Hz', '75Hz', '144Hz', '165Hz', '240Hz', '360Hz'], sortOrder: 5 },
      { key: 'surface', label: 'Screen Surface', type: 'select', required: false, options: ['CURVED', 'FLAT'], sortOrder: 6 },
      { key: 'connectivity', label: 'Connectivity', type: 'multi-select', required: false, options: ['D-SUB', 'DISPLAY PORT', 'DVI', 'HDMI', 'USB-C'], sortOrder: 7 },
      { key: 'type', label: 'Type', type: 'select', required: false, options: ['Gaming', 'Professional', 'Curved'], sortOrder: 8 },
    ]
  },
  {
    category: Category.PERIPHERAL,
    attributes: [
      { key: 'type', label: 'Type', type: 'select', required: true, options: ['Headset', 'Keyboard', 'Mouse', 'Mouse Pad', 'Speaker', 'Headphone', 'Webcam', 'Software'], sortOrder: 0 },
      { key: 'connectivity', label: 'Connectivity', type: 'select', required: false, options: ['Wired', 'Wireless', 'Bluetooth'], sortOrder: 1 },
    ]
  },
  {
    category: Category.NETWORKING,
    attributes: [
      { key: 'type', label: 'Device Type', type: 'select', required: true, options: ['Router', 'Switch', 'Adapter', 'Cable'], sortOrder: 0 },
    ]
  },
  {
    category: Category.LAPTOP,
    attributes: [
      { key: 'processor', label: 'Processor', type: 'select', required: true, options: ['AMD Ryzen 3', 'AMD Ryzen 5', 'AMD Ryzen 7', 'Intel Core 5', 'Intel Core i3', 'Intel Core i5', 'Intel Core i7'], sortOrder: 0 },
      { key: 'processorSeries', label: 'Processor Series', type: 'select', required: false, options: ['Intel 12th Gen', 'Intel 13th Gen', 'Intel 14th Gen', 'Ryzen 5000 Series', 'Ryzen 7000 Series'], sortOrder: 1 },
      { key: 'memorySize', label: 'Memory Size', type: 'select', required: true, options: ['8GB', '16GB', '32GB'], sortOrder: 2 },
      { key: 'memoryType', label: 'Memory Type', type: 'select', required: true, options: ['DDR4', 'DDR5', 'LPDDR5'], sortOrder: 3 },
      { key: 'ssd', label: 'SSD', type: 'select', required: false, options: ['256GB NVMe', '512GB NVMe', '1TB NVMe'], sortOrder: 4 },
      { key: 'graphics', label: 'Graphics', type: 'select', required: false, options: ['AMD Radeon', 'Integrated', 'Intel Graphics', 'Iris Xe', 'UHD', 'NVIDIA RTX 3050', 'NVIDIA RTX 4050', 'NVIDIA RTX 4060'], sortOrder: 5 },
      { key: 'screenResolution', label: 'Screen Resolution', type: 'select', required: false, options: ['1080p', '1440p', '2K', '4K'], sortOrder: 6 },
    ]
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
  // ── PROCESSOR ──────────────────────────────────────────────────────────────
  {
    category: Category.PROCESSOR,
    filters: [
      { key: 'search_description', label: 'Search in Descriptions', type: FilterType.search, sortOrder: 0 },
      { key: 'search_subcategory', label: 'Search in Subcategories', type: FilterType.search, sortOrder: 1 },
      { key: 'specs.brand', label: 'Manufacturer', type: FilterType.checkbox, options: ['AMD', 'Intel'], sortOrder: 2 },
      { key: 'stock_status', label: 'Stock Status', type: FilterType.checkbox, options: ['In Stock', 'Out of Stock'], sortOrder: 3 },
      // AMD
      { key: 'specs.family', label: 'CPU', type: FilterType.checkbox, options: ['Athlon', 'Ryzen 3', 'Ryzen 5', 'Ryzen 7', 'Ryzen 9'], sortOrder: 4, dependencyKey: 'specs.brand', dependencyValue: 'AMD' },
      { key: 'specs.cores', label: 'Cores', type: FilterType.checkbox, options: ['2', '4', '6', '8', '12', '16', '24'], sortOrder: 5, dependencyKey: 'specs.brand', dependencyValue: 'AMD' },
      { key: 'specs.series', label: 'Series', type: FilterType.checkbox, options: ['3000 Series', '5000 Series', '7000 Series', '8000 Series', '9000 Series'], sortOrder: 6, dependencyKey: 'specs.brand', dependencyValue: 'AMD' },
      { key: 'specs.socket', label: 'Socket', type: FilterType.checkbox, options: ['AM4', 'AM5'], sortOrder: 7, dependencyKey: 'specs.brand', dependencyValue: 'AMD' },
      { key: 'specs.maxMemory', label: 'Max Memory Support', type: FilterType.checkbox, options: ['64 GB', '128 GB', '192 GB', '256 GB'], sortOrder: 8, dependencyKey: 'specs.brand', dependencyValue: 'AMD' },
      { key: 'specs.integratedGraphics', label: 'Integrated Graphics', type: FilterType.checkbox, options: ['No', 'Radeon Graphics', 'Radeon Vega 3', 'Radeon Vega 8', 'Radeon Vega 11'], sortOrder: 9, dependencyKey: 'specs.brand', dependencyValue: 'AMD' },
      // Intel
      { key: 'specs.family', label: 'CPU', type: FilterType.checkbox, options: ['Core Ultra 5', 'Core Ultra 7', 'Core Ultra 9', 'Core i3', 'Core i5', 'Core i7', 'Core i9'], sortOrder: 10, dependencyKey: 'specs.brand', dependencyValue: 'Intel' },
      { key: 'specs.cores', label: 'Cores', type: FilterType.checkbox, options: ['2', '4', '6', '8', '10', '12', '14', '20', '24'], sortOrder: 11, dependencyKey: 'specs.brand', dependencyValue: 'Intel' },
      { key: 'specs.generation', label: 'Series', type: FilterType.checkbox, options: ['9th Gen', '10th Gen', '11th Gen', '12th Gen', '13th Gen', '14th Gen'], sortOrder: 12, dependencyKey: 'specs.brand', dependencyValue: 'Intel' },
      { key: 'specs.socket', label: 'Socket', type: FilterType.checkbox, options: ['LGA1151', 'LGA1200', 'LGA1700', 'LGA1851'], sortOrder: 13, dependencyKey: 'specs.brand', dependencyValue: 'Intel' },
      { key: 'specs.maxMemory', label: 'Max Memory Support', type: FilterType.checkbox, options: ['64 GB', '128 GB', '192 GB', '256 GB'], sortOrder: 14, dependencyKey: 'specs.brand', dependencyValue: 'Intel' },
      { key: 'specs.integratedGraphics', label: 'Integrated Graphics', type: FilterType.checkbox, options: ['No', 'Intel UHD Graphics 630', 'Intel UHD Graphics 730', 'Intel UHD Graphics 770'], sortOrder: 15, dependencyKey: 'specs.brand', dependencyValue: 'Intel' },
    ]
  },
  // ── CPU COOLER ─────────────────────────────────────────────────────────────
  {
    category: Category.COOLER,
    filters: [
      { key: 'specs.brand', label: 'Manufacturer', type: FilterType.checkbox, options: ['AEROCOOL', 'ALSEYE', 'Ant Esports', 'ANTEC', 'ARCTIC', 'Cooler Master', 'Corsair', 'DeepCool', 'Lian Li', 'Noctua', 'NZXT'], sortOrder: 0 },
      { key: 'stock_status', label: 'Stock Status', type: FilterType.checkbox, options: ['In Stock', 'Out of Stock'], sortOrder: 1 },
      { key: 'specs.type', label: 'Cooling Type', type: FilterType.checkbox, options: ['AIR COOLER', 'LIQUID AIO COOLER'], sortOrder: 2 },
      { key: 'specs.socket', label: 'Socket Support', type: FilterType.checkbox, options: ['AM2', 'AM2+', 'AM3', 'AM3+', 'AM4', 'AM5', 'LGA1151', 'LGA1200', 'LGA1700'], sortOrder: 3 },
      { key: 'specs.radiatorSize', label: 'Radiator Size', type: FilterType.checkbox, options: ['240mm', '280mm', '360mm', '420mm'], sortOrder: 4 },
      { key: 'specs.fanSize', label: 'Fan Size', type: FilterType.checkbox, options: ['40mm', '60mm', '90mm', '92mm', '120mm', '140mm'], sortOrder: 5 },
      { key: 'specs.pwm', label: 'PWM Controller', type: FilterType.checkbox, options: ['NA', 'YES'], sortOrder: 6 },
    ]
  },
  // ── MOTHERBOARD ────────────────────────────────────────────────────────────
  {
    category: Category.MOTHERBOARD,
    filters: [
      { key: 'specs.brand', label: 'Manufacturer', type: FilterType.checkbox, options: ['ASROCK', 'ASUS', 'GIGABYTE', 'MSI'], sortOrder: 0 },
      { key: 'stock_status', label: 'Stock Status', type: FilterType.checkbox, options: ['In Stock', 'Out of Stock'], sortOrder: 1 },
      { key: 'specs.platform', label: 'Platform', type: FilterType.checkbox, options: ['AMD', 'Intel'], sortOrder: 2 },
      // AMD Platform
      { key: 'specs.socket', label: 'Socket', type: FilterType.checkbox, options: ['AM4', 'AM5'], sortOrder: 3, dependencyKey: 'specs.platform', dependencyValue: 'AMD' },
      { key: 'specs.chipset', label: 'Chipset', type: FilterType.checkbox, options: ['A520', 'B450', 'B550', 'B650', 'X570', 'X670', 'X870'], sortOrder: 4, dependencyKey: 'specs.platform', dependencyValue: 'AMD' },
      { key: 'specs.ramType', label: 'Supported Memory Type', type: FilterType.checkbox, options: ['DDR4', 'DDR5'], sortOrder: 5, dependencyKey: 'specs.platform', dependencyValue: 'AMD' },
      { key: 'specs.formFactor', label: 'Form Factor', type: FilterType.checkbox, options: ['ATX', 'Micro-ATX', 'Mini-ITX', 'E-ATX'], sortOrder: 6, dependencyKey: 'specs.platform', dependencyValue: 'AMD' },
      // Intel Platform
      { key: 'specs.socket', label: 'Socket', type: FilterType.checkbox, options: ['LGA1151', 'LGA1200', 'LGA1700', 'LGA1851'], sortOrder: 7, dependencyKey: 'specs.platform', dependencyValue: 'Intel' },
      { key: 'specs.chipset', label: 'Chipset', type: FilterType.checkbox, options: ['B760', 'H510', 'H610', 'Z690', 'Z790', 'Z890'], sortOrder: 8, dependencyKey: 'specs.platform', dependencyValue: 'Intel' },
      { key: 'specs.ramType', label: 'Supported Memory Type', type: FilterType.checkbox, options: ['DDR4', 'DDR5'], sortOrder: 9, dependencyKey: 'specs.platform', dependencyValue: 'Intel' },
      { key: 'specs.formFactor', label: 'Form Factor', type: FilterType.checkbox, options: ['ATX', 'Micro-ATX', 'Mini-ITX', 'E-ATX'], sortOrder: 10, dependencyKey: 'specs.platform', dependencyValue: 'Intel' },
    ]
  },
  // ── GRAPHICS CARD ──────────────────────────────────────────────────────────
  {
    category: Category.GPU,
    filters: [
      { key: 'specs.brand', label: 'Manufacturer', type: FilterType.checkbox, options: ['ASROCK', 'ASUS', 'GALAX', 'GIGABYTE', 'INNO3D', 'MSI', 'Sapphire', 'Zotac'], sortOrder: 0 },
      { key: 'stock_status', label: 'Stock Status', type: FilterType.checkbox, options: ['In Stock', 'Out of Stock'], sortOrder: 1 },
      { key: 'specs.chipset', label: 'Chipset', type: FilterType.checkbox, options: ['AMD RADEON', 'NVIDIA GEFORCE', 'NVIDIA QUADRO', 'Intel Arc'], sortOrder: 2 },
      { key: 'specs.model', label: 'GPU', type: FilterType.checkbox, options: ['A400', 'A1000', 'GT 710', 'GT 730', 'GT 1030', 'GTX 1650', 'GTX 1660', 'RTX 3060', 'RTX 4060', 'RTX 4070', 'RTX 4080', 'RTX 4090', 'RX 7600', 'RX 7800 XT'], sortOrder: 3 },
      { key: 'specs.pcie', label: 'PCI EXPRESS', type: FilterType.checkbox, options: ['2.0', '3.0', '4.0', '5.0'], sortOrder: 4 },
      { key: 'specs.memory', label: 'Memory Size', type: FilterType.checkbox, options: ['2GB', '4GB', '6GB', '8GB', '12GB', '16GB', '20GB', '24GB'], sortOrder: 5 },
      { key: 'specs.memoryType', label: 'Memory Type', type: FilterType.checkbox, options: ['DDR3', 'GDDR5', 'GDDR6', 'GDDR6X', 'GDDR7'], sortOrder: 6 },
    ]
  },
  // ── RAM ────────────────────────────────────────────────────────────────────
  {
    category: Category.RAM,
    filters: [
      { key: 'specs.brand', label: 'Manufacturer', type: FilterType.checkbox, options: ['ACER', 'ADATA', 'CORSAIR', 'CRUCIAL', 'EVM', 'G.Skill', 'Kingston', 'TeamGroup'], sortOrder: 0 },
      { key: 'stock_status', label: 'Stock Status', type: FilterType.checkbox, options: ['In Stock', 'Out of Stock'], sortOrder: 1 },
      { key: 'specs.series', label: 'Product Series', type: FilterType.checkbox, options: ['AEGIS', 'DOMINATOR PLATINUM RGB', 'DOMINATOR RGB DDR5', 'DOMINATOR TITANIUM RGB DDR5', 'FURY BEAST', 'TRIDENT Z5', 'VENGEANCE'], sortOrder: 2 },
      { key: 'specs.ramType', label: 'Memory Type', type: FilterType.checkbox, options: ['DDR4', 'DDR5'], sortOrder: 3 },
      { key: 'specs.capacity', label: 'Capacity', type: FilterType.checkbox, options: ['4GB', '8GB', '16GB', '32GB', '48GB', '64GB'], sortOrder: 4 },
      { key: 'specs.kit', label: 'Kit Type', type: FilterType.checkbox, options: ['4x1', '8x1', '16x1', '16x2', '24x2', '32x2'], sortOrder: 5 },
      { key: 'specs.frequency', label: 'Speed', type: FilterType.checkbox, options: ['2666 MHz', '3200 MHz', '4800 MHz', '5200 MHz', '5600 MHz', '6000 MHz'], sortOrder: 6 },
    ]
  },
  // ── STORAGE ────────────────────────────────────────────────────────────────
  {
    category: Category.STORAGE,
    filters: [
      { key: 'specs.brand', label: 'Manufacturer', type: FilterType.checkbox, options: ['ACER', 'ADATA', 'ADDLINK', 'Ant Esports', 'ASUS', 'Crucial', 'Kingston', 'Samsung', 'Seagate', 'Western Digital'], sortOrder: 0 },
      { key: 'stock_status', label: 'Stock Status', type: FilterType.checkbox, options: ['In Stock', 'Out of Stock'], sortOrder: 1 },
      { key: 'specs.type', label: 'Category', type: FilterType.checkbox, options: ['Enterprise SSD', 'External HDD', 'External SSD', 'Internal HDD', 'Internal SSD', 'Pen Drive'], sortOrder: 2 },
      { key: 'specs.series', label: 'Series', type: FilterType.checkbox, options: ['690 NEO', '870 EVO', '990 EVO', '990 PRO', '9100 PRO'], sortOrder: 3 },
      { key: 'specs.capacity', label: 'Capacity', type: FilterType.checkbox, options: ['500GB', '1TB', '1.92TB', '2TB', '3.84TB', '4TB', '8TB'], sortOrder: 4 },
    ]
  },
  // ── SMPS (PSU) ─────────────────────────────────────────────────────────────
  {
    category: Category.PSU,
    filters: [
      { key: 'specs.brand', label: 'Manufacturer', type: FilterType.checkbox, options: ['Ant Esports', 'ANTEC', 'ASUS', 'COOLER MASTER', 'CORSAIR', 'DeepCool', 'MSI', 'Seasonic'], sortOrder: 0 },
      { key: 'stock_status', label: 'Stock Status', type: FilterType.checkbox, options: ['In Stock', 'Out of Stock'], sortOrder: 1 },
      { key: 'specs.wattage', label: 'Wattage', type: FilterType.checkbox, options: ['400', '450', '500', '520', '550', '650', '750', '850', '1000', '1200'], sortOrder: 2 },
      { key: 'specs.series', label: 'Series', type: FilterType.checkbox, options: ['ATOM', 'AURA', 'AXi', 'C', 'CSK', 'HX', 'RM', 'RMx'], sortOrder: 3 },
      { key: 'specs.efficiency', label: 'Certification', type: FilterType.checkbox, options: ['Bronze', 'Gold', 'Platinum', 'Silver', 'Titanium'], sortOrder: 4 },
      { key: 'specs.modular', label: 'Modular', type: FilterType.checkbox, options: ['Fully', 'Non', 'Semi'], sortOrder: 5 },
      { key: 'specs.pcie62', label: 'PCIe Connector (6+2)', type: FilterType.checkbox, options: ['1', '2', '3', '4', '5'], sortOrder: 6 },
      { key: 'specs.sata', label: 'SATA Connector', type: FilterType.checkbox, options: ['2', '3', '4', '5', '6'], sortOrder: 7 },
      { key: 'specs.peripheral4pin', label: 'Peripheral 4-Pin', type: FilterType.checkbox, options: ['1', '2', '3', '4', '5'], sortOrder: 8 },
    ]
  },
  // ── CABINET ────────────────────────────────────────────────────────────────
  {
    category: Category.CABINET,
    filters: [
      { key: 'specs.brand', label: 'Manufacturer', type: FilterType.checkbox, options: ['AEROCOOL', 'Ant Esports', 'ANTEC', 'ARCTIC', 'ASUS', 'Cooler Master', 'Corsair', 'Lian Li', 'NZXT'], sortOrder: 0 },
      { key: 'stock_status', label: 'Stock Status', type: FilterType.checkbox, options: ['In Stock', 'Out of Stock'], sortOrder: 1 },
      { key: 'specs.formFactor', label: 'Cabinet Size', type: FilterType.checkbox, options: ['Full', 'Mid', 'Mini', 'Super', 'SFF'], sortOrder: 2 },
      { key: 'specs.motherboardSupport', label: 'Motherboard Size', type: FilterType.checkbox, options: ['ATX', 'E-ATX', 'ITX', 'M-ATX', 'M-ITX'], sortOrder: 3 },
      { key: 'specs.radiatorSupport', label: 'Radiator Support', type: FilterType.checkbox, options: ['120mm', '140mm', '240mm', '280mm', '360mm'], sortOrder: 4 },
    ]
  },
  // ── MONITOR ────────────────────────────────────────────────────────────────
  {
    category: Category.MONITOR,
    filters: [
      { key: 'specs.brand', label: 'Manufacturer', type: FilterType.checkbox, options: ['AOC', 'ASUS', 'BENQ', 'COOLER MASTER', 'DELL', 'LG', 'MSI', 'Samsung', 'ViewSonic'], sortOrder: 0 },
      { key: 'stock_status', label: 'Stock Status', type: FilterType.checkbox, options: ['In Stock', 'Out of Stock'], sortOrder: 1 },
      { key: 'specs.size', label: 'Screen Size', type: FilterType.checkbox, options: ['22 Inch', '24 Inch', '27 Inch', '32 Inch', '34 Inch', '49 Inch'], sortOrder: 2 },
      { key: 'specs.displayType', label: 'Display Type', type: FilterType.checkbox, options: ['FHD', 'QHD', 'UHD', 'DQHD', '5K HDR'], sortOrder: 3 },
      { key: 'specs.panel', label: 'Panel Type', type: FilterType.checkbox, options: ['IPS', 'OLED', 'QD-OLED', 'TN', 'VA'], sortOrder: 4 },
      { key: 'specs.resolution', label: 'Resolution', type: FilterType.checkbox, options: ['1080p', '1440p', '2K', '4K', '5K'], sortOrder: 5 },
      { key: 'specs.responseTime', label: 'Response Time', type: FilterType.checkbox, options: ['0.5ms', '1ms', '2ms', '4ms', '5ms'], sortOrder: 6 },
      { key: 'specs.refreshRate', label: 'Refresh Rate', type: FilterType.checkbox, options: ['60Hz', '75Hz', '144Hz', '165Hz', '240Hz', '360Hz'], sortOrder: 7 },
      { key: 'specs.surface', label: 'Screen Surface', type: FilterType.checkbox, options: ['CURVED', 'FLAT'], sortOrder: 8 },
      { key: 'specs.connectivity', label: 'Connectivity', type: FilterType.checkbox, options: ['D-SUB', 'DISPLAY PORT', 'DVI', 'HDMI', 'USB-C'], sortOrder: 9 },
    ]
  },
  // ── PERIPHERALS ────────────────────────────────────────────────────────────
  {
    category: Category.PERIPHERAL,
    filters: [
      { key: 'specs.brand', label: 'Manufacturer', type: FilterType.checkbox, options: [], sortOrder: 0 },
      { key: 'stock_status', label: 'Stock Status', type: FilterType.checkbox, options: ['In Stock', 'Out of Stock'], sortOrder: 1 },
      { key: 'specs.type', label: 'Type', type: FilterType.checkbox, options: ['Headset', 'Keyboard', 'Mouse', 'Mouse Pad', 'Speaker', 'Headphone', 'Webcam', 'Software'], sortOrder: 2 },
      { key: 'specs.connectivity', label: 'Connectivity', type: FilterType.checkbox, options: ['Wired', 'Wireless', 'Bluetooth'], sortOrder: 3 },
    ]
  },
  // ── NETWORKING ─────────────────────────────────────────────────────────────
  {
    category: Category.NETWORKING,
    filters: [
      { key: 'specs.brand', label: 'Manufacturer', type: FilterType.checkbox, options: [], sortOrder: 0 },
      { key: 'stock_status', label: 'Stock Status', type: FilterType.checkbox, options: ['In Stock', 'Out of Stock'], sortOrder: 1 },
      { key: 'specs.type', label: 'Device Type', type: FilterType.checkbox, options: ['Router', 'Switch', 'Adapter', 'Cable'], sortOrder: 2 },
    ]
  },
  // ── LAPTOP ─────────────────────────────────────────────────────────────────
  {
    category: Category.LAPTOP,
    filters: [
      { key: 'specs.brand', label: 'Manufacturer', type: FilterType.checkbox, options: ['ACER', 'ASUS', 'HP', 'MSI', 'Lenovo', 'Dell'], sortOrder: 0 },
      { key: 'stock_status', label: 'Stock Status', type: FilterType.checkbox, options: ['In Stock', 'Out of Stock'], sortOrder: 1 },
      { key: 'specs.processor', label: 'Processor', type: FilterType.checkbox, options: ['AMD Ryzen 3', 'AMD Ryzen 5', 'AMD Ryzen 7', 'Intel Core 5', 'Intel Core i3', 'Intel Core i5', 'Intel Core i7'], sortOrder: 2 },
      { key: 'specs.processorSeries', label: 'Processor Series', type: FilterType.checkbox, options: ['Intel 12th Gen', 'Intel 13th Gen', 'Intel 14th Gen', 'Ryzen 5000 Series', 'Ryzen 7000 Series'], sortOrder: 3 },
      { key: 'specs.memorySize', label: 'Memory Size', type: FilterType.checkbox, options: ['8GB', '16GB', '32GB'], sortOrder: 4 },
      { key: 'specs.memoryType', label: 'Memory Type', type: FilterType.checkbox, options: ['DDR4', 'DDR5', 'LPDDR5'], sortOrder: 5 },
      { key: 'specs.ssd', label: 'SSD', type: FilterType.checkbox, options: ['256GB NVMe', '512GB NVMe', '1TB NVMe'], sortOrder: 6 },
      { key: 'specs.graphics', label: 'Graphics', type: FilterType.checkbox, options: ['AMD Radeon', 'Integrated', 'Intel Graphics', 'Iris Xe', 'UHD', 'NVIDIA RTX 3050', 'NVIDIA RTX 4050', 'NVIDIA RTX 4060'], sortOrder: 7 },
      { key: 'specs.screenResolution', label: 'Screen Resolution', type: FilterType.checkbox, options: ['1080p', '1440p', '2K', '4K'], sortOrder: 8 },
    ]
  },
];



// ─────────────────────────────────────────────────────────────────────────────
// ORDERS
// ─────────────────────────────────────────────────────────────────────────────

// Helper to find product data inline (without importing TS frontend module)
const productById = (id: string) => PRODUCTS_DATA.find(p => p.id === id)!;

const ORDERS_DATA = [
  {
    id: 'ORD-2501',
    customerName: 'Arjun Kapoor',
    email: 'arjun.kapoor@gmail.com',
    date: new Date('2025-01-14T08:22:00Z'),
    status: OrderStatus.PENDING,
    total: 36000 + 42000 + 25000,
    shippingStreet: '14A, Sector 15', shippingCity: 'Noida', shippingState: 'Uttar Pradesh', shippingZip: '201301', shippingCountry: 'India',
    paymentMethod: 'Net Banking', paymentStatus: 'Pending', paymentTransactionId: null,
    items: [
      { productId: 'cpu-1', quantity: 2 },
      { productId: 'mobo-1', quantity: 1 },
      { productId: 'ram-1', quantity: 2 },
    ],
    logs: [
      { status: OrderStatus.PENDING, timestamp: new Date('2025-01-14T08:22:00Z'), note: 'Order placed. Awaiting Net Banking payment confirmation.' },
    ],
  },
  {
    id: 'ORD-2502',
    customerName: 'Meera Nair',
    email: 'meera.nair@outlook.com',
    date: new Date('2025-01-13T14:05:00Z'),
    status: OrderStatus.PAID,
    total: 185000 + 16000,
    shippingStreet: '22, Kaloor Junction', shippingCity: 'Kochi', shippingState: 'Kerala', shippingZip: '682017', shippingCountry: 'India',
    paymentMethod: 'Credit Card', paymentStatus: 'Success', paymentTransactionId: 'TXN-CC-20250113-5821',
    items: [
      { productId: 'gpu-1', quantity: 1 },
      { productId: 'psu-3', quantity: 1 },
    ],
    logs: [
      { status: OrderStatus.PENDING, timestamp: new Date('2025-01-13T14:05:00Z'), note: 'Order placed via website.' },
      { status: OrderStatus.PAID, timestamp: new Date('2025-01-13T14:07:30Z'), note: 'Credit card payment authorised. TXN-CC-20250113-5821.' },
    ],
  },
  {
    id: 'ORD-2503',
    customerName: 'Vikram Desai',
    email: 'vikram.desai@company.in',
    date: new Date('2025-01-12T11:30:00Z'),
    status: OrderStatus.PROCESSING,
    total: 55000 + 42000 + 52000 + 21000 + 11000,
    shippingStreet: 'A-403, Powai Heights', shippingCity: 'Mumbai', shippingState: 'Maharashtra', shippingZip: '400076', shippingCountry: 'India',
    paymentMethod: 'UPI', paymentStatus: 'Success', paymentTransactionId: 'UPI-20250112-VD-7391',
    items: [
      { productId: 'cpu-2', quantity: 1 },
      { productId: 'mobo-1', quantity: 1 },
      { productId: 'gpu-2', quantity: 1 },
      { productId: 'stg-1', quantity: 2 },
      { productId: 'cool-1', quantity: 1 },
    ],
    logs: [
      { status: OrderStatus.PENDING, timestamp: new Date('2025-01-12T11:30:00Z'), note: 'Order placed via website.' },
      { status: OrderStatus.PAID, timestamp: new Date('2025-01-12T11:31:00Z'), note: 'UPI payment confirmed. Ref: UPI-20250112-VD-7391.' },
      { status: OrderStatus.PROCESSING, timestamp: new Date('2025-01-12T14:00:00Z'), note: 'Picked and packing in progress.' },
    ],
  },
  {
    id: 'ORD-2504',
    customerName: 'Priya Sharma',
    email: 'priya.sharma@techcorp.io',
    date: new Date('2025-01-10T09:15:00Z'),
    status: OrderStatus.SHIPPED,
    total: 36000 + 28000 + 12500 + 10500,
    shippingStreet: 'F-12, DLF City Phase 2', shippingCity: 'Gurugram', shippingState: 'Haryana', shippingZip: '122002', shippingCountry: 'India',
    paymentMethod: 'Credit Card', paymentStatus: 'Success', paymentTransactionId: 'TXN-CC-20250110-4421',
    items: [
      { productId: 'cpu-1', quantity: 1 },
      { productId: 'mobo-2', quantity: 1 },
      { productId: 'ram-1', quantity: 1 },
      { productId: 'stg-1', quantity: 1 },
    ],
    logs: [
      { status: OrderStatus.PENDING, timestamp: new Date('2025-01-10T09:15:00Z') },
      { status: OrderStatus.PAID, timestamp: new Date('2025-01-10T09:16:00Z'), note: 'Card payment confirmed.' },
      { status: OrderStatus.PROCESSING, timestamp: new Date('2025-01-10T11:00:00Z'), note: 'Items picked and packed.' },
      { status: OrderStatus.SHIPPED, timestamp: new Date('2025-01-11T10:00:00Z'), note: 'Shipped via BlueDart. AWB: BD-2025-44192.' },
    ],
  },
  {
    id: 'ORD-2505',
    customerName: 'Rahul Mehta',
    email: 'rahul.mehta@freelance.dev',
    date: new Date('2025-01-08T20:00:00Z'),
    status: OrderStatus.DELIVERED,
    total: 56000 + 4500 + 14000 + 11000,
    shippingStreet: '78, MG Road', shippingCity: 'Bengaluru', shippingState: 'Karnataka', shippingZip: '560001', shippingCountry: 'India',
    paymentMethod: 'UPI', paymentStatus: 'Success', paymentTransactionId: 'UPI-20250108-RM-5544',
    items: [
      { productId: 'gpu-3', quantity: 1 },
      { productId: 'ram-2', quantity: 1 },
      { productId: 'cab-1', quantity: 1 },
      { productId: 'cool-1', quantity: 1 },
    ],
    logs: [
      { status: OrderStatus.PENDING, timestamp: new Date('2025-01-08T20:00:00Z') },
      { status: OrderStatus.PAID, timestamp: new Date('2025-01-08T20:01:00Z'), note: 'UPI payment instant.' },
      { status: OrderStatus.PROCESSING, timestamp: new Date('2025-01-09T10:00:00Z') },
      { status: OrderStatus.SHIPPED, timestamp: new Date('2025-01-09T15:00:00Z'), note: 'Shipped via DTDC.' },
      { status: OrderStatus.DELIVERED, timestamp: new Date('2025-01-11T13:00:00Z'), note: 'Delivered and signed by customer.' },
    ],
  },
  {
    id: 'ORD-2506',
    customerName: 'Ananya Bose',
    email: 'ananya.bose@student.edu',
    date: new Date('2025-01-07T16:30:00Z'),
    status: OrderStatus.CANCELLED,
    total: 9000 + 2200 + 3500,
    shippingStreet: '5, Lake Town', shippingCity: 'Kolkata', shippingState: 'West Bengal', shippingZip: '700089', shippingCountry: 'India',
    paymentMethod: 'UPI', paymentStatus: 'Failed', paymentTransactionId: null,
    items: [
      { productId: 'cpu-12', quantity: 1 },
      { productId: 'ram-3', quantity: 1 },
      { productId: 'stg-3', quantity: 1 },
    ],
    logs: [
      { status: OrderStatus.PENDING, timestamp: new Date('2025-01-07T16:30:00Z'), note: 'Order placed.' },
      { status: OrderStatus.CANCELLED, timestamp: new Date('2025-01-07T18:00:00Z'), note: 'Cancelled due to UPI payment failure. Stock released.' },
    ],
  },
  {
    id: 'ORD-2507',
    customerName: 'Sameer Khan',
    email: 'sameer.khan@retailshop.in',
    date: new Date('2025-01-05T10:00:00Z'),
    status: OrderStatus.RETURNED,
    total: 26000,
    shippingStreet: 'Shop 12, Electronics Market', shippingCity: 'Hyderabad', shippingState: 'Telangana', shippingZip: '500003', shippingCountry: 'India',
    paymentMethod: 'Net Banking', paymentStatus: 'Success', paymentTransactionId: 'NEFT-20250105-SK-0032',
    items: [
      { productId: 'gpu-4', quantity: 1 },
    ],
    logs: [
      { status: OrderStatus.PENDING, timestamp: new Date('2025-01-05T10:00:00Z') },
      { status: OrderStatus.PAID, timestamp: new Date('2025-01-05T10:30:00Z'), note: 'NEFT confirmed.' },
      { status: OrderStatus.SHIPPED, timestamp: new Date('2025-01-05T14:00:00Z'), note: 'Shipped via Delhivery.' },
      { status: OrderStatus.DELIVERED, timestamp: new Date('2025-01-06T12:00:00Z') },
      { status: OrderStatus.RETURNED, timestamp: new Date('2025-01-07T11:00:00Z'), note: 'Customer reported DOA. Return pickup scheduled.' },
    ],
  },
  {
    id: 'ORD-2508',
    customerName: 'Infosys Procurement Team',
    email: 'procurement@infosys.com',
    date: new Date('2025-01-13T10:00:00Z'),
    status: OrderStatus.PROCESSING,
    total: (28500 + 4500 + 3500) * 10,
    shippingStreet: '44, Electronics City Phase 1', shippingCity: 'Bengaluru', shippingState: 'Karnataka', shippingZip: '560100', shippingCountry: 'India',
    paymentMethod: 'Net Banking', paymentStatus: 'Success', paymentTransactionId: 'NEFT-20250113-INFOSYS-0099',
    items: [
      { productId: 'cpu-4', quantity: 10 },
      { productId: 'ram-2', quantity: 10 },
      { productId: 'stg-3', quantity: 10 },
    ],
    logs: [
      { status: OrderStatus.PENDING, timestamp: new Date('2025-01-13T10:00:00Z'), note: 'Bulk B2B order received. PO: PO-INFY-2025-0041.' },
      { status: OrderStatus.PAID, timestamp: new Date('2025-01-13T14:00:00Z'), note: 'NEFT payment received. Ref: NEFT-20250113-INFOSYS-0099.' },
      { status: OrderStatus.PROCESSING, timestamp: new Date('2025-01-14T09:00:00Z'), note: 'Bulk picking started. Assigned to Warehouse Team B.' },
    ],
  },
  {
    id: 'ORD-2509',
    customerName: 'Riya Joshi',
    email: 'riya.joshi@startuplab.io',
    date: new Date('2025-01-14T06:55:00Z'),
    status: OrderStatus.SHIPPED,
    total: 10500 + 4500,
    shippingStreet: 'B-12, Startup Village', shippingCity: 'Kozhikode', shippingState: 'Kerala', shippingZip: '673016', shippingCountry: 'India',
    paymentMethod: 'UPI', paymentStatus: 'Success', paymentTransactionId: 'UPI-20250114-RJOSHI-1182',
    items: [
      { productId: 'stg-1', quantity: 1 },
      { productId: 'cool-2', quantity: 1 },
    ],
    logs: [
      { status: OrderStatus.PENDING, timestamp: new Date('2025-01-14T06:55:00Z') },
      { status: OrderStatus.PAID, timestamp: new Date('2025-01-14T06:56:10Z'), note: 'Instant UPI payment.' },
      { status: OrderStatus.PROCESSING, timestamp: new Date('2025-01-14T07:30:00Z'), note: 'Express order. Packed in 20 mins.' },
      { status: OrderStatus.SHIPPED, timestamp: new Date('2025-01-14T09:00:00Z'), note: 'Shipped via FedEx Express. AWB: FE20250114-7741.' },
    ],
  },
  {
    id: 'ORD-2510',
    customerName: 'Deepak Chawla',
    email: 'deepak.chawla@3dstudio.in',
    date: new Date('2025-01-03T16:00:00Z'),
    status: OrderStatus.DELIVERED,
    total: 135000 + 370000 + 50000 + 21000 + 16000 + 35000,
    shippingStreet: 'Studio 3, Film City Road', shippingCity: 'Hyderabad', shippingState: 'Telangana', shippingZip: '500032', shippingCountry: 'India',
    paymentMethod: 'Net Banking', paymentStatus: 'Success', paymentTransactionId: 'RTGS-20250103-DCHAWLA-7712',
    items: [
      { productId: 'cpu-6', quantity: 1 },
      { productId: 'gpu-1', quantity: 2 },
      { productId: 'ram-1', quantity: 4 },
      { productId: 'stg-1', quantity: 2 },
      { productId: 'psu-3', quantity: 1 },
      { productId: 'cab-3', quantity: 1 },
    ],
    logs: [
      { status: OrderStatus.PENDING, timestamp: new Date('2025-01-03T16:00:00Z') },
      { status: OrderStatus.PAID, timestamp: new Date('2025-01-03T16:45:00Z'), note: 'RTGS confirmed. High-value order flagged for priority handling.' },
      { status: OrderStatus.PROCESSING, timestamp: new Date('2025-01-04T09:00:00Z'), note: 'Senior warehouse staff assigned. Bubble-wrapped each GPU separately.' },
      { status: OrderStatus.SHIPPED, timestamp: new Date('2025-01-05T10:00:00Z'), note: 'Shipped via Safexpress Cargo. Docket: SX2025010500321.' },
      { status: OrderStatus.DELIVERED, timestamp: new Date('2025-01-08T14:00:00Z'), note: 'Delivered and unpacked by customer. All items verified OK.' },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// REVIEWS
// ─────────────────────────────────────────────────────────────────────────────

const REVIEWS_DATA = [
  { productId: 'cpu-1', customerName: 'Gamer123', rating: 5, comment: 'Absolute beast for gaming!', status: ReviewStatus.APPROVED, createdAt: new Date('2023-10-10') },
  { productId: 'gpu-1', customerName: 'ProEditor', rating: 5, comment: 'Renders 4K video in seconds. Expensive but worth it.', status: ReviewStatus.APPROVED, createdAt: new Date('2023-10-12') },
  { productId: 'mobo-3', customerName: 'BudgetBuilder', rating: 4, comment: 'Good value, but bios flashback was tricky.', status: ReviewStatus.APPROVED, createdAt: new Date('2023-10-15') },
  { productId: 'cpu-1', customerName: 'Hater', rating: 1, comment: 'Overheats too much.', status: ReviewStatus.PENDING, createdAt: new Date('2023-10-28') },
];

// ─────────────────────────────────────────────────────────────────────────────
// SAVED BUILDS
// ─────────────────────────────────────────────────────────────────────────────

const SAVED_BUILDS_DATA = [
  {
    id: 'build-gaming-1',
    name: 'High-End Gaming Build (1440p / 4K)',
    total: 36000 + 42000 + 52000 + 12500 + 10500 + 16000 + 14000 + 11000,
    createdAt: new Date('2024-12-10'),
    items: [
      { productId: 'cpu-1', quantity: 1 },
      { productId: 'mobo-1', quantity: 1 },
      { productId: 'gpu-2', quantity: 1 },
      { productId: 'ram-1', quantity: 1 },
      { productId: 'stg-1', quantity: 1 },
      { productId: 'psu-3', quantity: 1 },
      { productId: 'cab-1', quantity: 1 },
      { productId: 'cool-1', quantity: 1 },
    ],
  },
  {
    id: 'build-budget-1',
    name: 'Budget 1080p Gaming Build',
    total: 12500 + 9000 + 19500 + 4500 + 3500 + 4500 + 7000,
    createdAt: new Date('2024-11-22'),
    items: [
      { productId: 'cpu-19', quantity: 1 },
      { productId: 'mobo-3', quantity: 1 },
      { productId: 'gpu-5', quantity: 1 },
      { productId: 'ram-2', quantity: 1 },
      { productId: 'stg-3', quantity: 1 },
      { productId: 'psu-2', quantity: 1 },
      { productId: 'cab-2', quantity: 1 },
    ],
  },
  {
    id: 'build-workstation-1',
    name: 'Content Creation / Workstation Build',
    total: 135000 + 46000 + 185000 + 25000 + 21000 + 16000 + 35000 + 14500,
    createdAt: new Date('2024-10-05'),
    items: [
      { productId: 'cpu-6', quantity: 1 },
      { productId: 'mobo-24', quantity: 1 },
      { productId: 'gpu-1', quantity: 1 },
      { productId: 'ram-1', quantity: 2 },
      { productId: 'stg-1', quantity: 2 },
      { productId: 'psu-3', quantity: 1 },
      { productId: 'cab-3', quantity: 1 },
      { productId: 'cool-4', quantity: 1 },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// CMS LANDING PAGE CONTENT
// ─────────────────────────────────────────────────────────────────────────────

const CMS_LANDING_PAGE_CONTENT = {
  id: 'landing-v1',
  version: 1,
  lastUpdated: new Date().toISOString(),
  publishedAt: new Date().toISOString(),
  status: 'published',
  sections: {
    hero: {
      badge: { icon: true, text: 'Premium PC Components' },
      headline: { line1: 'Build Without', line2: 'Compromise', line2Gradient: true },
      subheadline: 'Curated components from world-class manufacturers. Every part selected for performance, reliability, and value.',
      primaryCTA: { text: 'Explore Catalog', link: '/catalog' },
      secondaryCTA: { text: 'View Builds', link: '/saved-builds' },
      stats: [
        { value: '900+', label: 'Components' },
        { value: '15k+', label: 'Builds' },
        { value: '24/7', label: 'Support' }
      ],
      heroImage: {
        url: 'https://bitkart.com/cdn/shop/files/H9Flowwhite_83af798d-a30c-4498-8756-40feba6935e3.png?v=1759604552',
        alt: 'Featured Component'
      },
      floatingBadge: { title: 'Authorized Dealer', subtitle: 'Full warranty coverage' }
    },
    categories: {
      sectionTitle: 'Shop by Category',
      categories: [
        { id: 'cat-1', name: 'Processors', icon: 'Cpu', categoryKey: 'Processor', order: 1 },
        { id: 'cat-2', name: 'Graphics', icon: 'Monitor', categoryKey: 'Graphics Card', order: 2 },
        { id: 'cat-3', name: 'Boards', icon: 'Cpu', categoryKey: 'Motherboard', order: 3 },
        { id: 'cat-4', name: 'Memory', icon: 'Zap', categoryKey: 'RAM', order: 4 },
        { id: 'cat-5', name: 'Storage', icon: 'Package', categoryKey: 'Storage', order: 5 },
        { id: 'cat-6', name: 'Cooling', icon: 'Cpu', categoryKey: 'Cooler', order: 6 },
      ]
    },
    featuredProducts: {
      sectionTitle: 'Featured Products',
      sectionSubtitle: 'Hand-selected components for exceptional performance',
      productIds: ['cpu-1', 'gpu-1', 'gpu-2', 'ram-1', 'stg-1', 'mobo-1'],
      ctaText: 'View All Products',
      ctaLink: '/catalog'
    },
    trustIndicators: {
      features: [
        { id: 'trust-1', icon: 'Shield', title: 'Authentic Products', description: 'All components sourced directly from authorized distributors with genuine warranties', order: 1 },
        { id: 'trust-2', icon: 'Zap', title: 'Fast Shipping', description: 'Same-day dispatch for orders before 2PM with real-time tracking', order: 2 },
        { id: 'trust-3', icon: 'Headphones', title: 'Expert Support', description: 'Dedicated PC building specialists available 24/7 for consultation', order: 3 },
        { id: 'trust-4', icon: 'TrendingUp', title: 'Best Value', description: 'Competitive pricing with exclusive bundle discounts and deals', order: 4 },
      ]
    },
    finalCTA: {
      headline: 'Ready to Build?',
      subheadline: 'Start configuring your dream PC with our comprehensive catalog of premium components',
      ctaText: 'Browse Catalog',
      ctaLink: '/catalog',
      backgroundStyle: 'gradient'
    }
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// BILLING PROFILE (store fixture)
// ─────────────────────────────────────────────────────────────────────────────

const BILLING_PROFILE_DATA = {
  companyName: 'BitKart Technologies Pvt. Ltd.',
  legalName: 'BitKart Technologies Private Limited',
  email: 'billing@bitkart.in',
  phone: '+91-80-4567-8900',
  addressLine1: '42, Tech Park, Whitefield',
  addressLine2: 'Electronic City Phase 2',
  city: 'Bengaluru',
  state: 'Karnataka',
  postalCode: '560066',
  country: 'India',
  gstin: '29AABCT1234F1Z5',
  currency: Currency.INR,
};

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMERS & INVOICES
// ─────────────────────────────────────────────────────────────────────────────

const CUSTOMERS_DATA = [
  {
    id: 'cust-1',
    name: 'Arjun Kapoor',
    email: 'arjun.kapoor@gmail.com',
    phone: '+91-98765-10001',
    company: null,
    addressLine1: '14A, Sector 15',
    city: 'Noida', state: 'Uttar Pradesh', postalCode: '201301', country: 'India',
  },
  {
    id: 'cust-2',
    name: 'Meera Nair',
    email: 'meera.nair@outlook.com',
    phone: '+91-98765-10002',
    company: null,
    addressLine1: '22, Kaloor Junction',
    city: 'Kochi', state: 'Kerala', postalCode: '682017', country: 'India',
  },
  {
    id: 'cust-3',
    name: 'Infosys Procurement',
    email: 'procurement@infosys.com',
    phone: '+91-80-4116-4100',
    company: 'Infosys Ltd.',
    addressLine1: '44, Electronics City Phase 1',
    city: 'Bengaluru', state: 'Karnataka', postalCode: '560100', country: 'India',
  },
];

const INVOICES_DATA = [
  {
    id: 'inv-001',
    invoiceNumber: 'INV-2025-0001',
    status: InvoiceStatus.PAID,
    customerId: 'cust-1',
    currency: Currency.INR,
    subtotal: 78000,
    taxTotal: 14040,
    discountPct: 0,
    shipping: 0,
    total: 92040,
    amountPaid: 92040,
    amountDue: 0,
    notes: 'High-end gaming build components.',
    paidAt: new Date('2025-01-14T09:00:00Z'),
    dueDate: new Date('2025-01-28T00:00:00Z'),
    createdAt: new Date('2025-01-14T08:30:00Z'),
    lineItems: [
      { name: 'AMD Ryzen 7 7800X3D', quantity: 1, unitPrice: 36000, taxRatePct: 18 },
      { name: 'ASUS ROG Strix X670E-E Gaming', quantity: 1, unitPrice: 42000, taxRatePct: 18 },
    ],
    audit: [
      { type: 'created', actor: 'Admin', message: 'Invoice created for order ORD-2501.' },
      { type: 'paid', actor: 'System', message: 'Payment received via Net Banking.' },
    ],
  },
  {
    id: 'inv-002',
    invoiceNumber: 'INV-2025-0002',
    status: InvoiceStatus.PENDING,
    customerId: 'cust-2',
    currency: Currency.INR,
    subtotal: 201000,
    taxTotal: 36180,
    discountPct: 0,
    shipping: 500,
    total: 237680,
    amountPaid: 0,
    amountDue: 237680,
    notes: 'High-performance GPU order.',
    dueDate: new Date('2025-01-27T00:00:00Z'),
    createdAt: new Date('2025-01-13T14:10:00Z'),
    lineItems: [
      { name: 'NVIDIA RTX 4090 Founders Edition', quantity: 1, unitPrice: 185000, taxRatePct: 18 },
      { name: 'MSI MPG A1000G', quantity: 1, unitPrice: 16000, taxRatePct: 18 },
    ],
    audit: [
      { type: 'created', actor: 'Admin', message: 'Invoice created for ORD-2502.' },
      { type: 'sent', actor: 'Admin', message: 'Invoice emailed to customer.' },
    ],
  },
  {
    id: 'inv-003',
    invoiceNumber: 'INV-2025-0003',
    status: InvoiceStatus.OVERDUE,
    customerId: 'cust-3',
    currency: Currency.INR,
    subtotal: 365000,
    taxTotal: 65700,
    discountPct: 5,
    shipping: 2000,
    total: 413950,
    amountPaid: 0,
    amountDue: 413950,
    notes: 'Bulk B2B order — Net-30 payment terms.',
    dueDate: new Date('2025-01-13T00:00:00Z'), // past due
    createdAt: new Date('2025-01-13T10:00:00Z'),
    lineItems: [
      { name: 'Intel Core i5-13600K', quantity: 10, unitPrice: 28500, taxRatePct: 18 },
      { name: 'Corsair Vengeance 16GB', quantity: 10, unitPrice: 4500, taxRatePct: 18 },
      { name: 'Crucial P3 500GB', quantity: 10, unitPrice: 3500, taxRatePct: 18 },
    ],
    audit: [
      { type: 'created', actor: 'Admin', message: 'Invoice created for bulk B2B order ORD-2508.' },
      { type: 'sent', actor: 'Admin', message: 'Invoice sent to procurement@infosys.com.' },
      { type: 'note', actor: 'System', message: 'Invoice overdue — payment not received by due date.' },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SEED FUNCTION
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Starting seed...');


  // ── 2. Brands ──────────────────────────────────────────────────────────────
  console.log('  → Seeding brands...');
  const brandMap: Record<string, string> = {}; // name → id

  for (const b of BRANDS_DATA) {
    const brand = await prisma.brand.upsert({
      where: { name: b.name },
      update: { categories: b.categories },
      create: { name: b.name, categories: b.categories },
    });
    brandMap[b.name] = brand.id;
  }

  // ── 3. Products + Specs ────────────────────────────────────────────────────
  console.log('  → Seeding products and specs...');
  const variantMap = new Map<string, string>();

  for (const p of PRODUCTS_DATA) {
    const cat = categoryToEnum(p.category);
    const brandId = p.brandName ? brandMap[p.brandName] : undefined;

    let prod = await prisma.product.findUnique({
      where: { id: p.id },
      include: { variants: true }
    });

    if (!prod) {
      prod = await prisma.product.create({
        data: {
          id: p.id,
          slug: p.id, // using id as slug for seeding
          name: p.name,
          category: cat,
          description: p.description,
          brandId: brandId ?? null,
          media: {
            create: [{ url: p.image, sortOrder: 0 }]
          },
          variants: {
            create: [{
              sku: p.sku,
              price: p.price,
              status: 'IN_STOCK'
            }]
          }
        },
        include: { variants: true }
      });
    }

    variantMap.set(p.id, prod.variants[0].id);

    // Clear existing specs
    await prisma.productSpec.deleteMany({
      where: { productId: p.id },
    });

    for (const [key, rawValue] of Object.entries(p.specs)) {
      const values = Array.isArray(rawValue) ? rawValue : [rawValue];
      for (const val of values) {
        const value = normaliseSpec(key, String(val));
        await prisma.productSpec.create({
          data: { productId: p.id, key, value },
        });
      }
    }
  }

  // ── 4. Inventory ───────────────────────────────────────────────────────────
  console.log('  → Seeding inventory...');
  let defaultWarehouse = await prisma.warehouse.findFirst();
  if (!defaultWarehouse) {
    defaultWarehouse = await prisma.warehouse.create({
      data: { name: 'Main Warehouse', code: 'MAIN', isActive: true, address: 'Bengaluru, India' }
    });
  }

  for (const p of PRODUCTS_DATA) {
    const variantId = variantMap.get(p.id);
    if (!variantId) continue;

    const existing = await prisma.warehouseInventory.findFirst({ where: { variantId: variantId } });
    if (!existing) {
      const inv = await prisma.warehouseInventory.create({
        data: {
          variantId: variantId,
          warehouseId: defaultWarehouse.id,
          quantity: p.stock,
          reserved: 0,
          reorderLevel: Math.max(2, Math.floor(p.stock * 0.15)), // ~15% of stock
          costPrice: Math.round(p.price * 0.65),              // assumed 65% of retail
          location: 'Aisle 1',
          lastUpdated: new Date(),
        },
      });
      // Record initial inward stock movement
      await prisma.stockMovement.create({
        data: {
          warehouseInventoryId: inv.id,
          warehouseId: defaultWarehouse.id,
          type: 'INWARD',
          quantity: p.stock,
          previousQuantity: 0,
          newQuantity: p.stock,
          reason: 'Initial stock from seed',
          performedBy: 'System',
        },
      });
    }
  }

  // ── 5. Category Schemas ────────────────────────────────────────────────────
  console.log('  → Seeding category schemas...');
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

  // ── 6. Filter Config ───────────────────────────────────────────────────────
  console.log('  → Seeding filter configurations...');
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

  // ── 7. Category Hierarchy ──────────────────────────────────────────────────
  console.log('  → Seeding category hierarchy...');

  // Recursive upsert via label path (label is unique enough within seed context)
  async function seedNode(
    node: { label: string; category?: Category; query?: string; brand?: string; children?: typeof node[] },
    parentId: string | null,
    order: number,
  ): Promise<void> {
    // Use a composite "path" as a stable identifier
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
          parentId: parentId,
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

  // Top-level nodes from categoryTree.ts (condensed — full tree is represented)
  const TOP_LEVEL_NODES = [
    // ── Custom Liquid Cooling ──
    {
      label: 'Custom Liquid Cooling', category: Category.COOLER,
      children: [
        { label: 'CPU Water Block', query: 'Water Block' },
        { label: 'GPU Water Block', query: 'GPU Block' },
        { label: 'Pump And Reservoir', query: 'Pump' },
        { label: 'Radiator', query: 'Radiator' },
        { label: 'Tubing', query: 'Tubing' },
        { label: 'Fitting Adapters', query: 'Fitting' },
        { label: 'Coolant', query: 'Coolant' },
        { label: 'Distro Plate', query: 'Distro' },
        { label: 'DIY Accessories', query: 'Accessory' },
      ]
    },
    // ── Processor ──
    {
      label: 'Processor', category: Category.PROCESSOR,
      children: [
        { label: 'Intel Processor', brand: 'Intel' },
        { label: 'AMD Processor', brand: 'AMD' },
        { label: 'Extreme-level Processor', query: 'Extreme' },
        { label: 'High-end Processor', query: 'High-end' },
        { label: 'Mid-Range Processor', query: 'Mid-Range' },
        { label: 'Entry-level Processor', query: 'Entry' },
        { label: 'Server CPU', query: 'Server' },
      ]
    },
    // ── CPU Cooler ──
    {
      label: 'CPU Cooler', category: Category.COOLER,
      children: [
        { label: 'Liquid Cooler', query: 'Liquid' },
        { label: 'Thermal Paste', query: 'Paste' },
        { label: 'Air Cooler', query: 'Air Cooler' },
        { label: 'Cooling Accessories', query: 'Accessory' },
      ]
    },
    // ── Motherboard ──
    {
      label: 'Motherboard', category: Category.MOTHERBOARD,
      children: [
        {
          label: 'AMD Chipset', children: [
            { label: 'X870', query: 'X870' }, { label: 'X670', query: 'X670' },
            { label: 'B650', query: 'B650' }, { label: 'B550', query: 'B550' },
            { label: 'B450', query: 'B450' }, { label: 'A620', query: 'A620' },
            { label: 'A520', query: 'A520' },
          ]
        },
        {
          label: 'Intel Chipset', children: [
            { label: 'Z890', query: 'Z890' }, { label: 'Z790', query: 'Z790' },
            { label: 'B760', query: 'B760' }, { label: 'H610', query: 'H610' },
            { label: 'H510', query: 'H510' },
          ]
        },
        { label: 'Overclocking Motherboard', query: 'Overclocking' },
        { label: 'Workstation Motherboard', query: 'Workstation' },
      ],
    },
    // ── Graphics Card ──
    {
      label: 'Graphics Card', category: Category.GPU,
      children: [
        { label: 'Intel Arc Graphics Card', query: 'Arc' },
        {
          label: 'Nvidia', children: [
            { label: 'RTX 50 Series', query: '50 Series' },
            { label: 'RTX 40 Series', query: '40 Series' },
            { label: 'RTX 30 Series', query: '30 Series' },
            { label: 'Quadro', query: 'Quadro' },
          ]
        },
        { label: 'Graphics Card Accessories', query: 'Accessory' },
        {
          label: 'Amd Radeon', children: [
            { label: 'RX 9000 Series', query: '9000' },
            { label: 'RX 7000 Series', query: '7000' },
            { label: 'RX 6000 Series', query: '6000' },
          ]
        },
      ],
    },
    // ── RAM ──
    {
      label: 'RAM', category: Category.RAM,
      children: [
        { label: 'Desktop Ram', query: 'Desktop' },
        { label: 'Laptop Ram', query: 'Laptop' },
        { label: 'DDR4 Ram', query: 'DDR4' },
        { label: 'DDR3 Ram', query: 'DDR3' },
        { label: 'DDR5 Ram', query: 'DDR5' },
        { label: 'Single Channel Ram', query: 'Single' },
        { label: 'Dual Channel Ram', query: 'Dual' },
        { label: 'Quad Channel Ram', query: 'Quad' },
      ],
    },
    // ── Storage ──
    {
      label: 'Storage', category: Category.STORAGE,
      children: [
        {
          label: 'HDD', children: [
            { label: 'Internal HDD', query: 'Internal' },
            { label: 'External HDD', query: 'External' },
            { label: 'Enterprise HDD', query: 'Enterprise' },
          ]
        },
        {
          label: 'SSD', children: [
            { label: 'NVMe Gen5', query: 'Gen5' },
            { label: 'NVMe Gen4', query: 'Gen4' },
            { label: 'NVMe Gen3', query: 'Gen3' },
            { label: 'SATA 2.5"', query: 'SATA' },
            { label: 'External SSD', query: 'External' },
          ]
        },
        { label: 'Pen Drive', query: 'Pen Drive' },
      ],
    },
    // ── SMPS (PSU) ──
    {
      label: 'SMPS (PSU)', category: Category.PSU,
      children: [
        { label: 'Non Modular', query: 'Non Modular' },
        { label: 'Fully Modular', query: 'Fully Modular' },
        { label: 'Semi Modular', query: 'Semi Modular' },
        { label: 'Platinum', query: 'Platinum' },
        { label: 'Gold', query: 'Gold' },
        { label: 'Bronze', query: 'Bronze' },
      ],
    },
    // ── Cabinet ──
    {
      label: 'Cabinet', category: Category.CABINET,
      children: [
        { label: 'Full Tower', query: 'Full Tower' },
        { label: 'ARGB', query: 'ARGB' },
        { label: 'Mid Tower', query: 'Mid Tower' },
        { label: 'Case Accessories', query: 'Accessory' },
        { label: 'Mini Tower', query: 'Mini Tower' },
        { label: 'With RGB Fan', query: 'RGB Fan' },
        { label: 'DIY', query: 'DIY' },
        { label: 'With SMPS', query: 'SMPS' },
        { label: 'Under INR 3500', query: 'Budget' },
        { label: 'Small Form Factor', query: 'SFF' },
      ],
    },
    // ── Monitor ──
    {
      label: 'Monitor', category: Category.MONITOR,
      children: [
        { label: '22 inch', query: '22' },
        { label: '24 inch', query: '24' },
        { label: '27 inch', query: '27' },
        { label: '2K', query: '2K' },
        { label: '32 inch', query: '32' },
        { label: '34 inch', query: '34' },
        { label: '4K', query: '4K' },
        { label: 'Gaming', query: 'Gaming' },
        { label: 'Curved', query: 'Curved' },
        { label: 'Professional', query: 'Professional' },
      ],
    },
    // ── Peripherals ──
    {
      label: 'Peripherals', category: Category.PERIPHERAL,
      children: [
        { label: 'Headset', query: 'Headset' },
        {
          label: 'Keyboard', children: [
            { label: 'Mechanical', query: 'Mechanical' },
            { label: 'Gaming', query: 'Gaming' },
            { label: 'Wireless', query: 'Wireless' },
            { label: 'Wired', query: 'Wired' },
            { label: 'Combos', query: 'Combo' },
          ]
        },
        {
          label: 'Mouse', children: [
            { label: 'Gaming', query: 'Gaming' },
            { label: 'RGB', query: 'RGB' },
            { label: 'Wired', query: 'Wired' },
            { label: 'Wireless', query: 'Wireless' },
            { label: 'Combos', query: 'Combo' },
          ]
        },
        { label: 'Mouse Pad', query: 'Mouse Pad' },
        {
          label: 'Networking', category: Category.NETWORKING, children: [
            { label: 'Router', query: 'Router' },
            { label: 'Switch', query: 'Switch' },
            { label: 'Cable', query: 'Cable' },
            { label: 'Adapter', query: 'Adapter' },
          ]
        },
        {
          label: 'Printer & Scanner', children: [
            { label: 'Printer', query: 'Printer' },
            { label: 'Scanner', query: 'Scanner' },
            { label: 'Cartridge', query: 'Cartridge' },
            { label: 'Toner', query: 'Toner' },
          ]
        },
        { label: 'Software', query: 'Software' },
        { label: 'Speaker', query: 'Speaker' },
        { label: 'Headphone', query: 'Headphone' },
        { label: 'Webcam', query: 'Webcam' },
      ],
    },
    // ── Laptop ──
    {
      label: 'Laptop', category: Category.LAPTOP,
    },
  ];

  for (let i = 0; i < TOP_LEVEL_NODES.length; i++) {
    await seedNode(TOP_LEVEL_NODES[i] as any, null, i);
  }

  // ── 8. Orders ──────────────────────────────────────────────────────────────
  console.log('  → Seeding orders...');
  for (const o of ORDERS_DATA) {
    const order = await prisma.order.upsert({
      where: { id: o.id },
      update: { status: o.status },
      create: {
        id: o.id,
        customerName: o.customerName,
        email: o.email,
        date: o.date,
        status: o.status,
        total: o.total,
        shippingStreet: o.shippingStreet,
        shippingCity: o.shippingCity,
        shippingState: o.shippingState,
        shippingZip: o.shippingZip,
        shippingCountry: o.shippingCountry,
        paymentMethod: o.paymentMethod,
        paymentStatus: o.paymentStatus,
        paymentTransactionId: o.paymentTransactionId,
      },
    });

    // Order items — skip if already exist
    const existingItems = await prisma.orderItem.count({ where: { orderId: order.id } });
    if (existingItems === 0) {
      for (const item of o.items) {
        const prod = productById(item.productId);
        const variantId = variantMap.get(item.productId);
        if (!variantId) continue;

        await prisma.orderItem.create({
          data: {
            orderId: order.id,
            variantId: variantId,
            name: prod.name,
            category: categoryToEnum(prod.category),
            price: prod.price,
            quantity: item.quantity,
            image: prod.image,
            sku: prod.sku,
          },
        });
      }
    }

    // Order logs — skip if already exist
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

  // ── 9. Reviews ─────────────────────────────────────────────────────────────
  console.log('  → Seeding reviews...');
  for (const r of REVIEWS_DATA) {
    await prisma.review.create({
      data: {
        productId: r.productId,
        customerName: r.customerName,
        rating: r.rating,
        comment: r.comment,
        status: r.status as ReviewStatus,
        createdAt: r.createdAt,
      },
    }).catch(() => { /* idempotent — skip if already exists */ });
  }

  // ── 10. Build Guides ───────────────────────────────────────────────────────
  console.log('  → Seeding build guides...');
  for (const b of SAVED_BUILDS_DATA) {
    const existingBuild = await prisma.buildGuide.findUnique({ where: { id: b.id } });
    if (!existingBuild) {
      await prisma.buildGuide.create({
        data: {
          id: b.id,
          title: b.name,
          description: "Pre-configured build guide based on popular choices.",
          category: "Gaming",
          createdAt: b.createdAt,
          items: {
            create: b.items.filter(i => variantMap.has(i.productId)).map(item => ({
              variantId: variantMap.get(item.productId)!,
              quantity: item.quantity,
            })),
          },
        },
      });
    }
  }

  // ── 11. Billing Profile ────────────────────────────────────────────────────
  console.log('  → Seeding billing profile...');
  const existingProfile = await prisma.billingProfile.findFirst();
  if (!existingProfile) {
    await prisma.billingProfile.create({ data: BILLING_PROFILE_DATA });
  }

  // ── 12. Customers ──────────────────────────────────────────────────────────
  console.log('  → Seeding customers...');
  for (const c of CUSTOMERS_DATA) {
    await prisma.customer.upsert({
      where: { id: c.id },
      update: { name: c.name, phone: c.phone },
      create: c,
    });
  }

  // ── 13. Invoices ───────────────────────────────────────────────────────────
  console.log('  → Seeding invoices...');
  for (const inv of INVOICES_DATA) {
    const existing = await prisma.invoice.findUnique({ where: { invoiceNumber: inv.invoiceNumber } });
    if (!existing) {
      await prisma.invoice.create({
        data: {
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
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
            create: inv.lineItems.map(li => ({
              name: li.name,
              quantity: li.quantity,
              unitPrice: li.unitPrice,
              taxRatePct: li.taxRatePct,
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

  // ── 14. CMS Landing Page ───────────────────────────────────────────────────
  console.log('  → Seeding CMS landing page...');
  const existingCMS = await prisma.cMSLandingPage.findFirst({ where: { isPublished: true } });
  if (!existingCMS) {
    const cmsPage = await prisma.cMSLandingPage.create({
      data: {
        content: CMS_LANDING_PAGE_CONTENT,
        isPublished: true,
        publishedAt: new Date(),
      },
    });
    // Seed first version
    await prisma.cMSLandingPageVersion.create({
      data: {
        pageId: cmsPage.id,
        content: CMS_LANDING_PAGE_CONTENT,
        label: 'v1 — Initial seed',
        actor: 'System',
      },
    });
  }

  console.log('✅ Seed complete.');
}

main()
  .catch(e => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
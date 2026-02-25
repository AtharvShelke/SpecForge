import { Category, Product, Order, OrderStatus, Review, SavedBuild } from '../types';

export const PRODUCTS: Product[] = [
  // --- PROCESSORS ---
  {
    id: 'cpu-1',
    sku: 'CPU-AMD-7800X3D',
    name: 'AMD Ryzen 7 7800X3D',
    category: Category.PROCESSOR,
    price: 36000,
    stock: 15,
    image: 'https://www.amd.com/content/dam/amd/en/images/products/processors/ryzen/2505503-ryzen-7-7800x3d-og.jpg',
    description: 'The ultimate gaming processor with 3D V-Cache technology.',
    specs: { brand: 'AMD', socket: 'AM5', wattage: 120, ramType: 'DDR5', series: '7000 Series', cores: '8' }
  },
  {
    id: 'cpu-2',
    sku: 'CPU-INT-14900K',
    name: 'Intel Core i9-14900K',
    category: Category.PROCESSOR,
    price: 55000,
    stock: 8,
    image: 'https://m.media-amazon.com/images/I/619ytLAytAL.jpg',
    description: '14th Gen High performance for creators and gamers.',
    specs: { brand: 'Intel', socket: 'LGA1700', wattage: 253, ramType: 'DDR5', generation: '14th Gen', cores: '24' }
  },
  {
    id: 'cpu-3',
    sku: 'CPU-AMD-5600X',
    name: 'AMD Ryzen 5 5600X',
    category: Category.PROCESSOR,
    price: 14000,
    stock: 25,
    image: 'https://www.amd.com/content/dam/amd/en/images/products/processors/ryzen/2505503-ryzen-5-5600x-og.jpg',
    description: 'Budget king for gaming.',
    specs: { brand: 'AMD', socket: 'AM4', wattage: 65, ramType: 'DDR4', series: '5000 Series', cores: '6' }
  },
  {
    id: 'cpu-4',
    sku: 'CPU-INT-13600K',
    name: 'Intel Core i5-13600K',
    category: Category.PROCESSOR,
    price: 28500,
    stock: 20,
    image: 'https://m.media-amazon.com/images/I/61lNEpDfdcL.jpg',
    description: '13th Gen mid-range beast.',
    specs: { brand: 'Intel', socket: 'LGA1700', wattage: 125, ramType: 'DDR5', generation: '13th Gen', cores: '14' }
  },
  {
    id: 'cpu-5',
    sku: 'CPU-AMD-7950X',
    name: 'AMD Ryzen 9 7950X',
    category: Category.PROCESSOR,
    price: 52000,
    stock: 5,
    image: 'https://www.amd.com/content/dam/amd/en/images/products/processors/ryzen/2505503-ryzen-9-7900x-og.jpg',
    description: 'Top tier productivity powerhouse.',
    specs: { brand: 'AMD', socket: 'AM5', wattage: 170, ramType: 'DDR5', series: '7000 Series', cores: '16' }
  },
  {
    id: 'cpu-6',
    sku: 'CPU-AMD-7960X',
    name: 'AMD Ryzen Threadripper 7960X',
    category: Category.PROCESSOR,
    price: 135000,
    stock: 2,
    image: 'https://m.media-amazon.com/images/I/71Gyox1aqRL.jpg',
    description: 'HEDT processor for extreme workstations.',
    specs: { brand: 'AMD', socket: 'sTR5', wattage: 350, ramType: 'DDR5', series: 'Threadripper', cores: '24' }
  },
  {
    id: 'cpu-7',
    sku: 'CPU-AMD-7700X',
    name: 'AMD Ryzen 7 7700X',
    category: Category.PROCESSOR,
    price: 32500,
    stock: 14,
    image: 'https://m.media-amazon.com/images/I/71fZgV7KzBL.jpg',
    description: 'High performance Zen4 gaming CPU.',
    specs: { brand: 'AMD', socket: 'AM5', wattage: 105, ramType: 'DDR5', series: '7000 Series', cores: '8' }
  },
  {
    id: 'cpu-8',
    sku: 'CPU-INT-14700K',
    name: 'Intel Core i7-14700K',
    category: Category.PROCESSOR,
    price: 43000,
    stock: 10,
    image: 'https://m.media-amazon.com/images/I/61lNEpDfdcL.jpg',
    description: 'High-end gaming + productivity CPU.',
    specs: { brand: 'Intel', socket: 'LGA1700', wattage: 253, ramType: 'DDR5', generation: '14th Gen', cores: '20' }
  },
  {
    id: 'cpu-9',
    sku: 'CPU-AMD-7600',
    name: 'AMD Ryzen 5 7600',
    category: Category.PROCESSOR,
    price: 21000,
    stock: 28,
    image: 'https://m.media-amazon.com/images/I/61C2H9V3yDL.jpg',
    description: 'Efficient midrange Zen4 chip.',
    specs: { brand: 'AMD', socket: 'AM5', wattage: 65, ramType: 'DDR5', series: '7000 Series', cores: '6' }
  },
  {
    id: 'cpu-10',
    sku: 'CPU-INT-13400F',
    name: 'Intel Core i5-13400F',
    category: Category.PROCESSOR,
    price: 18000,
    stock: 30,
    image: 'https://m.media-amazon.com/images/I/71Tz1lS3TAL.jpg',
    description: 'Budget gaming champion.',
    specs: { brand: 'Intel', socket: 'LGA1700', wattage: 148, ramType: 'DDR5', generation: '13th Gen', cores: '10' }
  },
  {
    id: 'cpu-11',
    sku: 'CPU-AMD-5800X',
    name: 'AMD Ryzen 7 5800X',
    category: Category.PROCESSOR,
    price: 22500,
    stock: 18,
    image: 'https://m.media-amazon.com/images/I/61mYyJ6gH0L.jpg',
    description: 'High performance AM4 processor.',
    specs: { brand: 'AMD', socket: 'AM4', wattage: 105, ramType: 'DDR4', series: '5000 Series', cores: '8' }
  },
  {
    id: 'cpu-12',
    sku: 'CPU-INT-12100F',
    name: 'Intel Core i3-12100F',
    category: Category.PROCESSOR,
    price: 9000,
    stock: 40,
    image: 'https://m.media-amazon.com/images/I/61p7FZ7m4DL.jpg',
    description: 'Entry-level gaming CPU.',
    specs: { brand: 'Intel', socket: 'LGA1700', wattage: 89, ramType: 'DDR5', generation: '12th Gen', cores: '4' }
  },
  {
    id: 'cpu-13',
    sku: 'CPU-AMD-5900X',
    name: 'AMD Ryzen 9 5900X',
    category: Category.PROCESSOR,
    price: 34000,
    stock: 9,
    image: 'https://m.media-amazon.com/images/I/71u7V9iK9xL.jpg',
    description: 'High core productivity chip.',
    specs: { brand: 'AMD', socket: 'AM4', wattage: 105, ramType: 'DDR4', series: '5000 Series', cores: '12' }
  },
  {
    id: 'cpu-14',
    sku: 'CPU-INT-12900K',
    name: 'Intel Core i9-12900K',
    category: Category.PROCESSOR,
    price: 36000,
    stock: 12,
    image: 'https://m.media-amazon.com/images/I/61mYyJ6gH0L.jpg',
    description: 'Flagship 12th Gen CPU.',
    specs: { brand: 'Intel', socket: 'LGA1700', wattage: 241, ramType: 'DDR5', generation: '12th Gen', cores: '16' }
  },
  {
    id: 'cpu-15',
    sku: 'CPU-AMD-7500F',
    name: 'AMD Ryzen 5 7500F',
    category: Category.PROCESSOR,
    price: 16500,
    stock: 26,
    image: 'https://m.media-amazon.com/images/I/71fZgV7KzBL.jpg',
    description: 'Budget Zen4 performer.',
    specs: { brand: 'AMD', socket: 'AM5', wattage: 65, ramType: 'DDR5', series: '7000 Series', cores: '6' }
  },
  {
    id: 'cpu-16',
    sku: 'CPU-INT-14600K',
    name: 'Intel Core i5-14600K',
    category: Category.PROCESSOR,
    price: 31000,
    stock: 16,
    image: 'https://m.media-amazon.com/images/I/61lNEpDfdcL.jpg',
    description: 'Best value performance CPU.',
    specs: { brand: 'Intel', socket: 'LGA1700', wattage: 181, ramType: 'DDR5', generation: '14th Gen', cores: '14' }
  },
  {
    id: 'cpu-17',
    sku: 'CPU-AMD-7950X3D',
    name: 'AMD Ryzen 9 7950X3D',
    category: Category.PROCESSOR,
    price: 62000,
    stock: 6,
    image: 'https://m.media-amazon.com/images/I/71Gyox1aqRL.jpg',
    description: 'Ultimate gaming + workstation CPU.',
    specs: { brand: 'AMD', socket: 'AM5', wattage: 120, ramType: 'DDR5', series: '7000 Series', cores: '16' }
  },
  {
    id: 'cpu-18',
    sku: 'CPU-INT-13700K',
    name: 'Intel Core i7-13700K',
    category: Category.PROCESSOR,
    price: 39500,
    stock: 11,
    image: 'https://m.media-amazon.com/images/I/61lNEpDfdcL.jpg',
    description: 'Balanced performance CPU.',
    specs: { brand: 'Intel', socket: 'LGA1700', wattage: 253, ramType: 'DDR5', generation: '13th Gen', cores: '16' }
  },
  {
    id: 'cpu-19',
    sku: 'CPU-AMD-5600',
    name: 'AMD Ryzen 5 5600',
    category: Category.PROCESSOR,
    price: 12500,
    stock: 33,
    image: 'https://m.media-amazon.com/images/I/61C2H9V3yDL.jpg',
    description: 'Budget AM4 gaming CPU.',
    specs: { brand: 'AMD', socket: 'AM4', wattage: 65, ramType: 'DDR4', series: '5000 Series', cores: '6' }
  },
  {
    id: 'cpu-20',
    sku: 'CPU-INT-12400F',
    name: 'Intel Core i5-12400F',
    category: Category.PROCESSOR,
    price: 14000,
    stock: 29,
    image: 'https://m.media-amazon.com/images/I/71Tz1lS3TAL.jpg',
    description: 'Great value midrange CPU.',
    specs: { brand: 'Intel', socket: 'LGA1700', wattage: 117, ramType: 'DDR5', generation: '12th Gen', cores: '6' }
  },
  {
    id: 'cpu-21',
    sku: 'CPU-AMD-5700X',
    name: 'AMD Ryzen 7 5700X',
    category: Category.PROCESSOR,
    price: 21000,
    stock: 19,
    image: 'https://m.media-amazon.com/images/I/61mYyJ6gH0L.jpg',
    description: 'Efficient 8-core CPU.',
    specs: { brand: 'AMD', socket: 'AM4', wattage: 65, ramType: 'DDR4', series: '5000 Series', cores: '8' }
  },
  {
    id: 'cpu-22',
    sku: 'CPU-INT-12600K',
    name: 'Intel Core i5-12600K',
    category: Category.PROCESSOR,
    price: 24500,
    stock: 17,
    image: 'https://m.media-amazon.com/images/I/61lNEpDfdcL.jpg',
    description: 'Popular enthusiast CPU.',
    specs: { brand: 'Intel', socket: 'LGA1700', wattage: 150, ramType: 'DDR5', generation: '12th Gen', cores: '10' }
  },
  {
    id: 'cpu-23',
    sku: 'CPU-AMD-7600X',
    name: 'AMD Ryzen 5 7600X',
    category: Category.PROCESSOR,
    price: 23500,
    stock: 23,
    image: 'https://m.media-amazon.com/images/I/71fZgV7KzBL.jpg',
    description: 'High clock gaming CPU.',
    specs: { brand: 'AMD', socket: 'AM5', wattage: 105, ramType: 'DDR5', series: '7000 Series', cores: '6' }
  },
  {
    id: 'cpu-24',
    sku: 'CPU-INT-14700',
    name: 'Intel Core i7-14700',
    category: Category.PROCESSOR,
    price: 38000,
    stock: 13,
    image: 'https://m.media-amazon.com/images/I/61lNEpDfdcL.jpg',
    description: 'Non-K high performance CPU.',
    specs: { brand: 'Intel', socket: 'LGA1700', wattage: 219, ramType: 'DDR5', generation: '14th Gen', cores: '20' }
  },
  {
    id: 'cpu-25',
    sku: 'CPU-AMD-7900',
    name: 'AMD Ryzen 9 7900',
    category: Category.PROCESSOR,
    price: 41000,
    stock: 8,
    image: 'https://m.media-amazon.com/images/I/71Gyox1aqRL.jpg',
    description: 'Efficient 12-core Zen4 CPU.',
    specs: { brand: 'AMD', socket: 'AM5', wattage: 65, ramType: 'DDR5', series: '7000 Series', cores: '12' }
  },
  {
    id: 'cpu-26',
    sku: 'CPU-INT-13900KS',
    name: 'Intel Core i9-13900KS',
    category: Category.PROCESSOR,
    price: 65000,
    stock: 4,
    image: 'https://m.media-amazon.com/images/I/61lNEpDfdcL.jpg',
    description: 'Extreme flagship processor.',
    specs: { brand: 'Intel', socket: 'LGA1700', wattage: 253, ramType: 'DDR5', generation: '13th Gen', cores: '24' }
  },

  // --- MOTHERBOARDS ---
  {
    id: 'mobo-1',
    sku: 'MB-ROG-X670E',
    name: 'ASUS ROG Strix X670E-E Gaming WiFi',
    category: Category.MOTHERBOARD,
    price: 42000,
    stock: 10,
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSog2RHpDaYyq58a4pnux9TyvzNBUFhYM2ZQA&s',
    description: 'Premium AM5 motherboard with PCIe 5.0.',
    specs: { brand: 'ASUS', socket: 'AM5', ramType: 'DDR5', formFactor: 'ATX', chipset: 'X670' }
  },
  {
    id: 'mobo-2',
    sku: 'MB-MSI-Z790',
    name: 'MSI MAG Z790 Tomahawk WiFi',
    category: Category.MOTHERBOARD,
    price: 28000,
    stock: 12,
    image: 'https://asset.msi.com/resize/image/global/product/product_1664265391459c76c55d481a806150407f1b07a6bb.png62405b38c58fe0f07fcef2367d8a9ba1/1024.png',
    description: 'Reliable foundation for Intel 12th/13th/14th Gen.',
    specs: { brand: 'MSI', socket: 'LGA1700', ramType: 'DDR5', formFactor: 'ATX', chipset: 'Z790' }
  },
  {
    id: 'mobo-3',
    sku: 'MB-GIG-B550M',
    name: 'Gigabyte B550M DS3H',
    category: Category.MOTHERBOARD,
    price: 9000,
    stock: 30,
    image: 'https://m.media-amazon.com/images/I/71ZMMyOQfOL.jpg',
    description: 'Solid budget board for AM4.',
    specs: { brand: 'Gigabyte', socket: 'AM4', ramType: 'DDR4', formFactor: 'Micro-ATX', chipset: 'B550' }
  },
  {
    id: 'mobo-4',
    sku: 'MB-ASR-B650M',
    name: 'ASRock B650M Pro RS',
    category: Category.MOTHERBOARD,
    price: 13500,
    stock: 18,
    image: 'https://www.asrock.com/mb/photo/B650M%20Pro%20RS(M1).png',
    description: 'Great value AM5 Micro ATX board.',
    specs: { brand: 'ASRock', socket: 'AM5', ramType: 'DDR5', formFactor: 'Micro-ATX', chipset: 'B650' }
  },
  {
    id: 'mobo-5',
    sku: 'MB-MSI-B760',
    name: 'MSI PRO B760-P DDR4',
    category: Category.MOTHERBOARD,
    price: 15500,
    stock: 15,
    image: 'https://m.media-amazon.com/images/I/91ZPVQjJ7kL.jpg',
    description: 'Cost effective Intel board supporting DDR4.',
    specs: { brand: 'MSI', socket: 'LGA1700', ramType: 'DDR4', formFactor: 'ATX', chipset: 'B760' }
  },

  {
    id: 'mobo-6',
    sku: 'MB-ASUS-B650',
    name: 'ASUS TUF B650-PLUS',
    category: Category.MOTHERBOARD,
    price: 19000,
    stock: 18,
    image: 'https://m.media-amazon.com/images/I/71M9yG3R7XL.jpg',
    description: 'Durable AM5 board.',
    specs: { brand: 'ASUS', socket: 'AM5', ramType: 'DDR5', formFactor: 'ATX', chipset: 'B650' }
  },
  {
    id: 'mobo-7',
    sku: 'MB-MSI-B650',
    name: 'MSI B650 Gaming Plus',
    category: Category.MOTHERBOARD,
    price: 17500,
    stock: 20,
    image: 'https://m.media-amazon.com/images/I/81zK8VZxZPL.jpg',
    description: 'Balanced AM5 motherboard.',
    specs: { brand: 'MSI', socket: 'AM5', ramType: 'DDR5', formFactor: 'ATX', chipset: 'B650' }
  },
  {
    id: 'mobo-8',
    sku: 'MB-GIG-X670',
    name: 'Gigabyte X670 Aorus Elite',
    category: Category.MOTHERBOARD,
    price: 29000,
    stock: 9,
    image: 'https://m.media-amazon.com/images/I/81E6R7Y6dPL.jpg',
    description: 'Premium AM5 board.',
    specs: { brand: 'Gigabyte', socket: 'AM5', ramType: 'DDR5', formFactor: 'ATX', chipset: 'X670' }
  },
  {
    id: 'mobo-9',
    sku: 'MB-ASR-A620',
    name: 'ASRock A620M-HDV',
    category: Category.MOTHERBOARD,
    price: 9000,
    stock: 32,
    image: 'https://m.media-amazon.com/images/I/71L+O+6N0AL.jpg',
    description: 'Entry AM5 board.',
    specs: { brand: 'ASRock', socket: 'AM5', ramType: 'DDR5', formFactor: 'Micro-ATX', chipset: 'A620' }
  },
  {
    id: 'mobo-10',
    sku: 'MB-MSI-Z690',
    name: 'MSI Z690 Tomahawk',
    category: Category.MOTHERBOARD,
    price: 26000,
    stock: 14,
    image: 'https://m.media-amazon.com/images/I/81zK8VZxZPL.jpg',
    description: 'High-end Intel board.',
    specs: { brand: 'MSI', socket: 'LGA1700', ramType: 'DDR5', formFactor: 'ATX', chipset: 'Z690' }
  },
  {
    id: 'mobo-11',
    sku: 'MB-ASUS-B760',
    name: 'ASUS Prime B760M-A',
    category: Category.MOTHERBOARD,
    price: 15500,
    stock: 21,
    image: 'https://m.media-amazon.com/images/I/71M9yG3R7XL.jpg',
    description: 'Reliable Intel board.',
    specs: { brand: 'ASUS', socket: 'LGA1700', ramType: 'DDR5', formFactor: 'Micro-ATX', chipset: 'B760' }
  },
  {
    id: 'mobo-12',
    sku: 'MB-GIG-H610',
    name: 'Gigabyte H610M S2H',
    category: Category.MOTHERBOARD,
    price: 7000,
    stock: 40,
    image: 'https://m.media-amazon.com/images/I/71ZMMyOQfOL.jpg',
    description: 'Budget Intel board.',
    specs: { brand: 'Gigabyte', socket: 'LGA1700', ramType: 'DDR4', formFactor: 'Micro-ATX', chipset: 'H610' }
  },
  {
    id: 'mobo-13',
    sku: 'MB-ASUS-X570',
    name: 'ASUS ROG Strix X570-E',
    category: Category.MOTHERBOARD,
    price: 24000,
    stock: 11,
    image: 'https://m.media-amazon.com/images/I/71M9yG3R7XL.jpg',
    description: 'Premium AM4 board.',
    specs: { brand: 'ASUS', socket: 'AM4', ramType: 'DDR4', formFactor: 'ATX', chipset: 'X570' }
  },
  {
    id: 'mobo-14',
    sku: 'MB-MSI-B550',
    name: 'MSI B550 Tomahawk',
    category: Category.MOTHERBOARD,
    price: 14500,
    stock: 22,
    image: 'https://m.media-amazon.com/images/I/81zK8VZxZPL.jpg',
    description: 'Popular AM4 board.',
    specs: { brand: 'MSI', socket: 'AM4', ramType: 'DDR4', formFactor: 'ATX', chipset: 'B550' }
  },
  {
    id: 'mobo-15',
    sku: 'MB-GIG-A520',
    name: 'Gigabyte A520M',
    category: Category.MOTHERBOARD,
    price: 6000,
    stock: 35,
    image: 'https://m.media-amazon.com/images/I/71ZMMyOQfOL.jpg',
    description: 'Entry AM4 motherboard.',
    specs: { brand: 'Gigabyte', socket: 'AM4', ramType: 'DDR4', formFactor: 'Micro-ATX', chipset: 'A520' }
  },
  {
    id: 'mobo-16',
    sku: 'MB-ASR-Z790',
    name: 'ASRock Z790 Steel Legend',
    category: Category.MOTHERBOARD,
    price: 30500,
    stock: 8,
    image: 'https://m.media-amazon.com/images/I/81E6R7Y6dPL.jpg',
    description: 'High-end Intel board.',
    specs: { brand: 'ASRock', socket: 'LGA1700', ramType: 'DDR5', formFactor: 'ATX', chipset: 'Z790' }
  },
  {
    id: 'mobo-17',
    sku: 'MB-MSI-H610',
    name: 'MSI Pro H610M',
    category: Category.MOTHERBOARD,
    price: 7200,
    stock: 37,
    image: 'https://m.media-amazon.com/images/I/71ZMMyOQfOL.jpg',
    description: 'Budget Intel motherboard.',
    specs: { brand: 'MSI', socket: 'LGA1700', ramType: 'DDR4', formFactor: 'Micro-ATX', chipset: 'H610' }
  },
  {
    id: 'mobo-18',
    sku: 'MB-ASUS-Z790',
    name: 'ASUS TUF Z790-Plus',
    category: Category.MOTHERBOARD,
    price: 31000,
    stock: 10,
    image: 'https://m.media-amazon.com/images/I/71M9yG3R7XL.jpg',
    description: 'Enthusiast Intel board.',
    specs: { brand: 'ASUS', socket: 'LGA1700', ramType: 'DDR5', formFactor: 'ATX', chipset: 'Z790' }
  },
  {
    id: 'mobo-19',
    sku: 'MB-GIG-B760',
    name: 'Gigabyte B760 Gaming X',
    category: Category.MOTHERBOARD,
    price: 17000,
    stock: 19,
    image: 'https://m.media-amazon.com/images/I/81E6R7Y6dPL.jpg',
    description: 'Balanced Intel board.',
    specs: { brand: 'Gigabyte', socket: 'LGA1700', ramType: 'DDR5', formFactor: 'ATX', chipset: 'B760' }
  },
  {
    id: 'mobo-20',
    sku: 'MB-ASR-B450',
    name: 'ASRock B450M Pro4',
    category: Category.MOTHERBOARD,
    price: 8000,
    stock: 29,
    image: 'https://m.media-amazon.com/images/I/71ZMMyOQfOL.jpg',
    description: 'Affordable AM4 board.',
    specs: { brand: 'ASRock', socket: 'AM4', ramType: 'DDR4', formFactor: 'Micro-ATX', chipset: 'B450' }
  },
  {
    id: 'mobo-21',
    sku: 'MB-MSI-X570',
    name: 'MSI X570 Gaming Edge',
    category: Category.MOTHERBOARD,
    price: 20500,
    stock: 12,
    image: 'https://m.media-amazon.com/images/I/81zK8VZxZPL.jpg',
    description: 'AM4 enthusiast board.',
    specs: { brand: 'MSI', socket: 'AM4', ramType: 'DDR4', formFactor: 'ATX', chipset: 'X570' }
  },
  {
    id: 'mobo-22',
    sku: 'MB-ASUS-A520',
    name: 'ASUS Prime A520M-K',
    category: Category.MOTHERBOARD,
    price: 6500,
    stock: 42,
    image: 'https://m.media-amazon.com/images/I/71ZMMyOQfOL.jpg',
    description: 'Budget AM4 motherboard.',
    specs: { brand: 'ASUS', socket: 'AM4', ramType: 'DDR4', formFactor: 'Micro-ATX', chipset: 'A520' }
  },
  {
    id: 'mobo-23',
    sku: 'MB-GIG-B650M',
    name: 'Gigabyte B650M DS3H',
    category: Category.MOTHERBOARD,
    price: 13500,
    stock: 17,
    image: 'https://m.media-amazon.com/images/I/81E6R7Y6dPL.jpg',
    description: 'Compact AM5 board.',
    specs: { brand: 'Gigabyte', socket: 'AM5', ramType: 'DDR5', formFactor: 'Micro-ATX', chipset: 'B650' }
  },
  {
    id: 'mobo-24',
    sku: 'MB-MSI-X670E',
    name: 'MSI X670E Carbon',
    category: Category.MOTHERBOARD,
    price: 46000,
    stock: 6,
    image: 'https://m.media-amazon.com/images/I/81zK8VZxZPL.jpg',
    description: 'Ultra premium AM5 board.',
    specs: { brand: 'MSI', socket: 'AM5', ramType: 'DDR5', formFactor: 'ATX', chipset: 'X670' }
  },
  {
    id: 'mobo-25',
    sku: 'MB-ASR-H610',
    name: 'ASRock H610M-HDV',
    category: Category.MOTHERBOARD,
    price: 6800,
    stock: 38,
    image: 'https://m.media-amazon.com/images/I/71ZMMyOQfOL.jpg',
    description: 'Entry Intel motherboard.',
    specs: { brand: 'ASRock', socket: 'LGA1700', ramType: 'DDR4', formFactor: 'Micro-ATX', chipset: 'H610' }
  },

  // --- GRAPHICS CARDS ---
  {
    id: 'gpu-1',
    sku: 'GPU-NV-4090',
    name: 'NVIDIA RTX 4090 Founders Edition',
    category: Category.GPU,
    price: 185000,
    stock: 3,
    image: 'https://m.media-amazon.com/images/I/71RgD3MP-hL._AC_UF1000,1000_QL80_.jpg',
    description: 'The absolute best performance for 4K gaming and AI.',
    specs: { brand: 'NVIDIA', wattage: 450, memory: '24GB', series: '40 Series' }
  },
  {
    id: 'gpu-2',
    sku: 'GPU-SAP-7800XT',
    name: 'Sapphire Nitro+ AMD Radeon RX 7800 XT',
    category: Category.GPU,
    price: 52000,
    stock: 20,
    image: 'https://m.media-amazon.com/images/I/81zdqJr2TYL.jpg',
    description: 'Great value for 1440p gaming.',
    specs: { brand: 'Sapphire', wattage: 263, memory: '16GB', series: '7000 Series' }
  },
  {
    id: 'gpu-3',
    sku: 'GPU-ZOT-4070',
    name: 'Zotac Gaming GeForce RTX 4070 Twin Edge',
    category: Category.GPU,
    price: 56000,
    stock: 25,
    image: 'https://m.media-amazon.com/images/I/61KZsTaMtcL._AC_UF1000,1000_QL80_FMwebp_.jpg',
    description: 'Compact 1440p card.',
    specs: { brand: 'Zotac', wattage: 200, memory: '12GB', series: '40 Series' }
  },
  {
    id: 'gpu-4',
    sku: 'GPU-ASUS-3060',
    name: 'ASUS Dual GeForce RTX 3060 V2 OC',
    category: Category.GPU,
    price: 26000,
    stock: 40,
    image: 'https://m.media-amazon.com/images/I/71hoPufXoDL._AC_UF1000,1000_QL80_.jpg',
    description: 'The budget king for 1080p gaming.',
    specs: { brand: 'ASUS', wattage: 170, memory: '12GB', series: '30 Series' }
  },
  {
    id: 'gpu-5',
    sku: 'GPU-GIG-6600',
    name: 'Gigabyte Radeon RX 6600 Eagle',
    category: Category.GPU,
    price: 19500,
    stock: 15,
    image: 'https://m.media-amazon.com/images/I/6121pomHteL.jpg',
    description: 'Entry level 1080p performer.',
    specs: { brand: 'Gigabyte', wattage: 132, memory: '8GB', series: '6000 Series' }
  },

  // --- RAM ---
  {
    id: 'ram-1',
    sku: 'RAM-GSK-32',
    name: 'G.Skill Trident Z5 RGB 32GB (16GBx2)',
    category: Category.RAM,
    price: 12500,
    stock: 50,
    image: 'https://m.media-amazon.com/images/I/61bc6zvEIIL.jpg',
    description: 'High speed DDR5 6000MHz memory for enthusiasts.',
    specs: { brand: 'G.Skill', ramType: 'DDR5', frequency: '6000MHz', capacity: '32GB' }
  },
  {
    id: 'ram-2',
    sku: 'RAM-COR-16',
    name: 'Corsair Vengeance LPX 16GB (8GBx2)',
    category: Category.RAM,
    price: 4500,
    stock: 100,
    image: 'https://m.media-amazon.com/images/I/51W4+1Da0IL._AC_UF1000,1000_QL80_.jpg',
    description: 'Reliable DDR4 3200MHz memory.',
    specs: { brand: 'Corsair', ramType: 'DDR4', frequency: '3200MHz', capacity: '16GB' }
  },
  {
    id: 'ram-3',
    sku: 'RAM-KIN-8',
    name: 'Kingston Fury Beast 8GB',
    category: Category.RAM,
    price: 2200,
    stock: 80,
    image: 'https://m.media-amazon.com/images/I/71+pGDyVzrL.jpg',
    description: 'Single stick DDR4 module.',
    specs: { brand: 'Kingston', ramType: 'DDR4', frequency: '3200MHz', capacity: '8GB' }
  },

  // --- COOLING ---
  {
    id: 'cool-1',
    sku: 'COOL-DEP-LS720',
    name: 'DeepCool LS720 ARGB AIO',
    category: Category.COOLER,
    price: 11000,
    stock: 20,
    image: 'https://cdn.deepcool.com/public/ProductFile/DEEPCOOL/Cooling/CPULiquidCoolers/LS720_WH/Overview/01.png?fm=webp&q=60',
    description: '360mm ARGB AIO Liquid Cooler.',
    specs: { brand: 'DeepCool', type: 'AIO Liquid Cooler', size: '360mm' }
  },
  {
    id: 'cool-2',
    sku: 'COOL-NOC-D15',
    name: 'Noctua NH-D15',
    category: Category.COOLER,
    price: 8500,
    stock: 15,
    image: 'https://m.media-amazon.com/images/I/91Hw1zcAIjL.jpg',
    description: 'Premium Air Cooler, dual tower design.',
    specs: { brand: 'Noctua', type: 'Air Cooler' }
  },
  {
    id: 'cool-3',
    sku: 'COOL-EK-WB',
    name: 'EKWB Quantum Velocity CPU Water Block',
    category: Category.COOLER,
    price: 9500,
    stock: 5,
    image: 'https://m.media-amazon.com/images/I/51w8kD-Y+2L._AC_UF1000,1000_QL80_.jpg',
    description: 'High-end custom loop CPU Water Block.',
    specs: { brand: 'EKWB', type: 'Water Block', socket: 'AM5/LGA1700' }
  },
  {
    id: 'cool-4',
    sku: 'COOL-COR-XD5',
    name: 'Corsair Hydro X Series XD5 Pump',
    category: Category.COOLER,
    price: 14500,
    stock: 8,
    image: 'https://m.media-amazon.com/images/I/61CL70frlAL._AC_UF1000,1000_QL80_.jpg',
    description: 'RGB Pump and Reservoir Combo for custom loops.',
    specs: { brand: 'Corsair', type: 'Pump & Reservoir' }
  },

  // --- STORAGE ---
  {
    id: 'stg-1',
    sku: 'SSD-SAM-990',
    name: 'Samsung 990 Pro 1TB',
    category: Category.STORAGE,
    price: 10500,
    stock: 40,
    image: 'https://m.media-amazon.com/images/I/71XHEQZZW+L.jpg',
    description: 'Blazing fast NVMe Gen4 SSD.',
    specs: { brand: 'Samsung', type: 'SSD', interface: 'NVMe Gen4', capacity: '1TB' }
  },
  {
    id: 'stg-2',
    sku: 'HDD-WD-2TB',
    name: 'Western Digital Blue 2TB HDD',
    category: Category.STORAGE,
    price: 4800,
    stock: 60,
    image: 'https://m.media-amazon.com/images/I/71pzrrdIS2L.jpg',
    description: 'Reliable storage for mass data.',
    specs: { brand: 'Western Digital', type: 'HDD', interface: 'SATA', capacity: '2TB' }
  },
  {
    id: 'stg-3',
    sku: 'SSD-CRU-500',
    name: 'Crucial P3 500GB',
    category: Category.STORAGE,
    price: 3500,
    stock: 35,
    image: 'https://m.media-amazon.com/images/I/51pMg25AthL.jpg',
    description: 'Budget NVMe Gen3 SSD.',
    specs: { brand: 'Crucial', type: 'SSD', interface: 'NVMe Gen3', capacity: '500GB' }
  },

  // --- PSU ---
  {
    id: 'psu-1',
    sku: 'PSU-COR-850',
    name: 'Corsair RM850e',
    category: Category.PSU,
    price: 11000,
    stock: 15,
    image: 'https://m.media-amazon.com/images/I/61J0tIvkBYL.jpg',
    description: '850W 80 Plus Gold Rated Modular PSU.',
    specs: { brand: 'Corsair', wattage: 850, efficiency: 'Gold' }
  },
  {
    id: 'psu-2',
    sku: 'PSU-CM-550',
    name: 'Cooler Master MWE 550 V2',
    category: Category.PSU,
    price: 4500,
    stock: 22,
    image: 'https://m.media-amazon.com/images/I/81zTChlbPHL._AC_UF1000,1000_QL80_.jpg',
    description: '550W 80 Plus Bronze Rated PSU.',
    specs: { brand: 'Cooler Master', wattage: 550, efficiency: 'Bronze' }
  },
  {
    id: 'psu-3',
    sku: 'PSU-MSI-1000',
    name: 'MSI MPG A1000G',
    category: Category.PSU,
    price: 16000,
    stock: 10,
    image: 'https://m.media-amazon.com/images/I/719fJ78WuEL.jpg',
    description: '1000W PCIe 5.0 Ready Gold PSU.',
    specs: { brand: 'MSI', wattage: 1000, efficiency: 'Gold' }
  },

  // --- CABINETS ---
  {
    id: 'cab-1',
    sku: 'CAB-LIA-O11',
    name: 'Lian Li O11 Dynamic Evo',
    category: Category.CABINET,
    price: 14000,
    stock: 12,
    image: 'https://m.media-amazon.com/images/I/61KmNQhuxvL._AC_UF1000,1000_QL80_.jpg',
    description: 'The classic showcase Mid Tower chassis.',
    specs: { brand: 'Lian Li', formFactor: 'Mid Tower', color: 'Black' }
  },
  {
    id: 'cab-2',
    sku: 'CAB-COR-4000',
    name: 'Corsair 4000D Airflow',
    category: Category.CABINET,
    price: 7000,
    stock: 30,
    image: 'https://m.media-amazon.com/images/I/71J4iohAlaL.jpg',
    description: 'High airflow Mid Tower case.',
    specs: { brand: 'Corsair', formFactor: 'Mid Tower', color: 'White' }
  },
  {
    id: 'cab-3',
    sku: 'CAB-CM-HAF',
    name: 'Cooler Master HAF 700 Evo',
    category: Category.CABINET,
    price: 35000,
    stock: 4,
    image: 'https://m.media-amazon.com/images/I/61hC6R08S+L._AC_UF1000,1000_QL80_.jpg',
    description: 'Massive Full Tower for extreme builds.',
    specs: { brand: 'Cooler Master', formFactor: 'Full Tower', color: 'Titanium' }
  },

  // --- MONITORS ---
  {
    id: 'mon-1',
    sku: 'MON-LG-27',
    name: 'LG UltraGear 27GN950',
    category: Category.MONITOR,
    price: 45000,
    stock: 5,
    image: 'https://media.us.lg.com/transform/6747bdf5-28d0-4caa-a288-ba854a3c6553/Monitor_SYNC_mnt-27gn950-09_features_900x600?io=transform:fill,width:1536',
    description: '27 Inch 4K 144Hz Nano IPS Gaming Monitor.',
    specs: { brand: 'LG', size: '27 Inch', resolution: '4K', type: 'Gaming' }
  },
  {
    id: 'mon-2',
    sku: 'MON-BEN-24',
    name: 'BenQ GW2480',
    category: Category.MONITOR,
    price: 10000,
    stock: 40,
    image: 'https://image.benq.com/is/image/benqco/gw2480l-left45?$ResponsivePreset$&fmt=png-alpha',
    description: '24 Inch Eye Care Monitor.',
    specs: { brand: 'BenQ', size: '24 Inch', resolution: '1080p', type: 'Professional' }
  },
  {
    id: 'mon-3',
    sku: 'MON-SAM-32',
    name: 'Samsung Odyssey G7',
    category: Category.MONITOR,
    price: 38000,
    stock: 8,
    image: 'https://m.media-amazon.com/images/I/81UUzgE+FIL._AC_UF1000,1000_QL80_.jpg',
    description: '32 Inch Curved 240Hz Gaming Monitor.',
    specs: { brand: 'Samsung', size: '32 Inch', resolution: '2K', type: 'Gaming' }
  },

  // --- PERIPHERALS ---
  {
    id: 'per-1',
    sku: 'PER-KEY-K2',
    name: 'Keychron K2 V2',
    category: Category.PERIPHERAL,
    price: 8000,
    stock: 10,
    image: 'https://picsum.photos/300/300?random=15',
    description: 'Wireless Mechanical Keyboard.',
    specs: { brand: 'Keychron', type: 'Mechanical Keyboard', connectivity: 'Wireless' }
  },
  {
    id: 'per-2',
    sku: 'PER-LOG-GPX',
    name: 'Logitech G Pro X Superlight',
    category: Category.PERIPHERAL,
    price: 13000,
    stock: 8,
    image: 'https://picsum.photos/300/300?random=16',
    description: 'Ultra-lightweight wireless gaming mouse.',
    specs: { brand: 'Logitech', type: 'Gaming Mouse', connectivity: 'Wireless' }
  },
  {
    id: 'per-3',
    sku: 'PER-HYP-CL2',
    name: 'HyperX Cloud II',
    category: Category.PERIPHERAL,
    price: 7500,
    stock: 25,
    image: 'https://picsum.photos/300/300?random=38',
    description: 'Legendary wired gaming headset.',
    specs: { brand: 'HyperX', type: 'Headset', connectivity: 'Wired' }
  },

  // --- NETWORKING ---
  {
    id: 'net-1',
    sku: 'NET-TP-AX73',
    name: 'TP-Link Archer AX73',
    category: Category.NETWORKING,
    price: 9000,
    stock: 12,
    image: 'https://picsum.photos/300/300?random=39',
    description: 'AX5400 Dual-Band Gigabit Wi-Fi 6 Router.',
    specs: { brand: 'TP-Link', type: 'Router', standard: 'WiFi 6' }
  },
  {
    id: 'net-2',
    sku: 'NET-DL-8P',
    name: 'D-Link 8 Port Gigabit Switch',
    category: Category.NETWORKING,
    price: 1500,
    stock: 50,
    image: 'https://picsum.photos/300/300?random=40',
    description: 'Unmanaged Gigabit Desktop Switch.',
    specs: { brand: 'D-Link', type: 'Switch', ports: '8' }
  }
];

export const MOCK_ORDERS: Order[] = [
  // ─────────────────────────────────────────────────────────────
  // ORD-2501 | PENDING — Awaiting Payment Confirmation
  // ─────────────────────────────────────────────────────────────
  {
    id: 'ORD-2501',
    customerName: 'Arjun Kapoor',
    email: 'arjun.kapoor@gmail.com',
    date: '2025-01-14T08:22:00Z',
    status: OrderStatus.PENDING,
    items: [
      { ...PRODUCTS.find(p => p.id === 'cpu-1')!, quantity: 1 },   // Ryzen 7 7800X3D
      { ...PRODUCTS.find(p => p.id === 'mobo-1')!, quantity: 1 },  // X670E Motherboard
      { ...PRODUCTS.find(p => p.id === 'ram-1')!, quantity: 2 },   // 32GB DDR5 x2
    ],
    total: 36000 + 42000 + 25000,
    shippingAddress: {
      street: '14A, Sector 15',
      city: 'Noida',
      state: 'Uttar Pradesh',
      zip: '201301',
      country: 'India',
    },
    payment: {
      method: 'Net Banking',
      status: 'Pending',
    },
    logs: [
      {
        status: OrderStatus.PENDING,
        timestamp: '2025-01-14T08:22:00Z',
        note: 'Order placed. Awaiting Net Banking payment confirmation.',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // ORD-2502 | PAID — Payment received, not yet picked for packing
  // ─────────────────────────────────────────────────────────────
  {
    id: 'ORD-2502',
    customerName: 'Meera Nair',
    email: 'meera.nair@outlook.com',
    date: '2025-01-13T14:05:00Z',
    status: OrderStatus.PAID,
    items: [
      { ...PRODUCTS.find(p => p.id === 'gpu-1')!, quantity: 1 },   // RTX 4090
      { ...PRODUCTS.find(p => p.id === 'psu-3')!, quantity: 1 },   // 1000W Gold PSU
    ],
    total: 185000 + 16000,
    shippingAddress: {
      street: '22, Kaloor Junction',
      city: 'Kochi',
      state: 'Kerala',
      zip: '682017',
      country: 'India',
    },
    payment: {
      method: 'Credit Card',
      status: 'Success',
      transactionId: 'TXN-CC-20250113-5821',
    },
    logs: [
      {
        status: OrderStatus.PENDING,
        timestamp: '2025-01-13T14:05:00Z',
        note: 'Order placed via website.',
      },
      {
        status: OrderStatus.PAID,
        timestamp: '2025-01-13T14:07:30Z',
        note: 'Credit card payment authorised. TXN-CC-20250113-5821.',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // ORD-2503 | PROCESSING — Being packed at warehouse
  // ─────────────────────────────────────────────────────────────
  {
    id: 'ORD-2503',
    customerName: 'Vikram Desai',
    email: 'vikram.desai@company.in',
    date: '2025-01-12T11:30:00Z',
    status: OrderStatus.PROCESSING,
    items: [
      { ...PRODUCTS.find(p => p.id === 'cpu-2')!, quantity: 1 },   // i9-14900K
      { ...PRODUCTS.find(p => p.id === 'mobo-1')!, quantity: 1 },  // X670E
      { ...PRODUCTS.find(p => p.id === 'gpu-2')!, quantity: 1 },   // RX 7800 XT
      { ...PRODUCTS.find(p => p.id === 'stg-1')!, quantity: 2 },   // 990 Pro 1TB x2
      { ...PRODUCTS.find(p => p.id === 'cool-1')!, quantity: 1 },  // 360mm AIO
    ],
    total: 55000 + 42000 + 52000 + 21000 + 11000,
    shippingAddress: {
      street: '67, Baner Road',
      city: 'Pune',
      state: 'Maharashtra',
      zip: '411045',
      country: 'India',
    },
    payment: {
      method: 'UPI',
      status: 'Success',
      transactionId: 'UPI-20250112-VIKDESAI-7741',
    },
    logs: [
      {
        status: OrderStatus.PENDING,
        timestamp: '2025-01-12T11:30:00Z',
        note: 'Order placed by returning customer.',
      },
      {
        status: OrderStatus.PAID,
        timestamp: '2025-01-12T11:31:45Z',
        note: 'UPI payment confirmed instantly.',
      },
      {
        status: OrderStatus.PROCESSING,
        timestamp: '2025-01-12T13:00:00Z',
        note: 'Assigned to Warehouse A for picking and packing. 5 items to pack.',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // ORD-2504 | SHIPPED — In transit with BlueDart
  // ─────────────────────────────────────────────────────────────
  {
    id: 'ORD-2504',
    customerName: 'Rahul Sharma',
    email: 'rahul.sharma@example.com',
    date: '2025-01-10T09:00:00Z',
    status: OrderStatus.SHIPPED,
    items: [
      { ...PRODUCTS.find(p => p.id === 'cpu-1')!, quantity: 1 },   // Ryzen 7 7800X3D
      { ...PRODUCTS.find(p => p.id === 'ram-1')!, quantity: 1 },   // 32GB DDR5
      { ...PRODUCTS.find(p => p.id === 'stg-1')!, quantity: 1 },   // 990 Pro 1TB
      { ...PRODUCTS.find(p => p.id === 'cab-1')!, quantity: 1 },   // Lian Li O11
    ],
    total: 36000 + 12500 + 10500 + 14000,
    shippingAddress: {
      street: '123, MG Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      zip: '560001',
      country: 'India',
    },
    payment: {
      method: 'Credit Card',
      status: 'Success',
      transactionId: 'TXN-CC-20250110-1023',
    },
    logs: [
      {
        status: OrderStatus.PENDING,
        timestamp: '2025-01-10T09:00:00Z',
        note: 'Order placed.',
      },
      {
        status: OrderStatus.PAID,
        timestamp: '2025-01-10T09:02:00Z',
        note: 'Payment confirmed via Credit Card.',
      },
      {
        status: OrderStatus.PROCESSING,
        timestamp: '2025-01-10T10:30:00Z',
        note: 'Packed by: Suresh K. QC passed.',
      },
      {
        status: OrderStatus.SHIPPED,
        timestamp: '2025-01-11T08:45:00Z',
        note: 'Handed to BlueDart. AWB: BD2025011182345. ETA: 3-5 business days.',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // ORD-2505 | DELIVERED — Complete
  // ─────────────────────────────────────────────────────────────
  {
    id: 'ORD-2505',
    customerName: 'Priya Patel',
    email: 'priya.patel@example.com',
    date: '2025-01-05T14:30:00Z',
    status: OrderStatus.DELIVERED,
    items: [
      { ...PRODUCTS.find(p => p.id === 'mon-1')!, quantity: 1 },   // 4K Monitor
      { ...PRODUCTS.find(p => p.id === 'per-1')!, quantity: 1 },   // Keyboard
    ],
    total: 45000 + 8500,
    shippingAddress: {
      street: '45, Park Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      zip: '400001',
      country: 'India',
    },
    payment: {
      method: 'UPI',
      status: 'Success',
      transactionId: 'UPI-20250105-PPATEL-3391',
    },
    logs: [
      { status: OrderStatus.PENDING, timestamp: '2025-01-05T14:30:00Z' },
      { status: OrderStatus.PAID, timestamp: '2025-01-05T14:31:20Z', note: 'UPI confirmed.' },
      { status: OrderStatus.PROCESSING, timestamp: '2025-01-06T09:00:00Z', note: 'Picked from shelf. Packed.' },
      { status: OrderStatus.SHIPPED, timestamp: '2025-01-06T15:00:00Z', note: 'Shipped via Delhivery. AWB: DL20250106-98712.' },
      { status: OrderStatus.DELIVERED, timestamp: '2025-01-09T11:20:00Z', note: 'Delivered. Signed by: Priya Patel.' },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // ORD-2506 | CANCELLED — EMI declined
  // ─────────────────────────────────────────────────────────────
  {
    id: 'ORD-2506',
    customerName: 'Sneha Gupta',
    email: 'sneha.gupta@example.com',
    date: '2025-01-08T11:15:00Z',
    status: OrderStatus.CANCELLED,
    items: [
      { ...PRODUCTS.find(p => p.id === 'cpu-2')!, quantity: 1 },   // i9-14900K
      { ...PRODUCTS.find(p => p.id === 'mobo-1')!, quantity: 1 },  // X670E
    ],
    total: 55000 + 42000,
    shippingAddress: {
      street: '90, Jubilee Hills',
      city: 'Hyderabad',
      state: 'Telangana',
      zip: '500033',
      country: 'India',
    },
    payment: {
      method: 'EMI',
      status: 'Failed',
    },
    logs: [
      { status: OrderStatus.PENDING, timestamp: '2025-01-08T11:15:00Z', note: 'Order placed via EMI.' },
      {
        status: OrderStatus.CANCELLED,
        timestamp: '2025-01-08T11:58:00Z',
        note: 'EMI eligibility check failed by bank. Order auto-cancelled. Reserved stock released.',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // ORD-2507 | RETURNED — DOA claim
  // ─────────────────────────────────────────────────────────────
  {
    id: 'ORD-2507',
    customerName: 'Karan Mehta',
    email: 'karan.mehta@example.com',
    date: '2024-12-28T09:10:00Z',
    status: OrderStatus.RETURNED,
    items: [
      { ...PRODUCTS.find(p => p.id === 'gpu-1')!, quantity: 1 },   // RTX 4090
    ],
    total: 185000,
    shippingAddress: {
      street: '12, Business Bay',
      city: 'Pune',
      state: 'Maharashtra',
      zip: '411001',
      country: 'India',
    },
    payment: {
      method: 'Credit Card',
      status: 'Success',
      transactionId: 'TXN-CC-20241228-9981',
    },
    logs: [
      { status: OrderStatus.PENDING, timestamp: '2024-12-28T09:10:00Z' },
      { status: OrderStatus.PAID, timestamp: '2024-12-28T09:12:00Z', note: 'Payment authorised.' },
      { status: OrderStatus.PROCESSING, timestamp: '2024-12-28T11:00:00Z', note: 'Packed. QC passed.' },
      { status: OrderStatus.SHIPPED, timestamp: '2024-12-29T10:00:00Z', note: 'Shipped via BlueDart. AWB: BD2024122991234.' },
      { status: OrderStatus.DELIVERED, timestamp: '2025-01-02T14:20:00Z', note: 'Delivered.' },
      {
        status: OrderStatus.RETURNED,
        timestamp: '2025-01-05T11:00:00Z',
        note: 'Customer reported DOA. Return pickup scheduled. Stock to be inspected before re-shelving.',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // ORD-2508 | PROCESSING — Large B2B Order
  // ─────────────────────────────────────────────────────────────
  {
    id: 'ORD-2508',
    customerName: 'Infosys Procurement Team',
    email: 'procurement@infosys.com',
    date: '2025-01-13T10:00:00Z',
    status: OrderStatus.PROCESSING,
    items: [
      { ...PRODUCTS.find(p => p.id === 'cpu-4')!, quantity: 10 },  // i5-13600K x10
      { ...PRODUCTS.find(p => p.id === 'ram-2')!, quantity: 10 },  // 16GB DDR4 x10
      { ...PRODUCTS.find(p => p.id === 'stg-3')!, quantity: 10 },  // 500GB SSD x10
    ],
    total: (28500 + 4500 + 3500) * 10,
    shippingAddress: {
      street: '44, Electronics City Phase 1',
      city: 'Bengaluru',
      state: 'Karnataka',
      zip: '560100',
      country: 'India',
    },
    payment: {
      method: 'Net Banking',
      status: 'Success',
      transactionId: 'NEFT-20250113-INFOSYS-0099',
    },
    logs: [
      {
        status: OrderStatus.PENDING,
        timestamp: '2025-01-13T10:00:00Z',
        note: 'Bulk B2B order received. PO: PO-INFY-2025-0041.',
      },
      {
        status: OrderStatus.PAID,
        timestamp: '2025-01-13T14:00:00Z',
        note: 'NEFT payment received and confirmed. Ref: NEFT-20250113-INFOSYS-0099.',
      },
      {
        status: OrderStatus.PROCESSING,
        timestamp: '2025-01-14T09:00:00Z',
        note: 'Bulk picking started. Assigned to Warehouse Team B. Expected pack completion: Jan 15.',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // ORD-2509 | SHIPPED — Express delivery
  // ─────────────────────────────────────────────────────────────
  {
    id: 'ORD-2509',
    customerName: 'Riya Joshi',
    email: 'riya.joshi@startuplab.io',
    date: '2025-01-14T06:55:00Z',
    status: OrderStatus.SHIPPED,
    items: [
      { ...PRODUCTS.find(p => p.id === 'stg-1')!, quantity: 1 },   // Samsung 990 Pro
      { ...PRODUCTS.find(p => p.id === 'cool-2')!, quantity: 1 },  // Air Cooler
    ],
    total: 10500 + 4500,
    shippingAddress: {
      street: 'B-12, Startup Village',
      city: 'Kozhikode',
      state: 'Kerala',
      zip: '673016',
      country: 'India',
    },
    payment: {
      method: 'UPI',
      status: 'Success',
      transactionId: 'UPI-20250114-RJOSHI-1182',
    },
    logs: [
      { status: OrderStatus.PENDING, timestamp: '2025-01-14T06:55:00Z' },
      { status: OrderStatus.PAID, timestamp: '2025-01-14T06:56:10Z', note: 'Instant UPI payment.' },
      { status: OrderStatus.PROCESSING, timestamp: '2025-01-14T07:30:00Z', note: 'Express order. Packed in 20 mins.' },
      {
        status: OrderStatus.SHIPPED,
        timestamp: '2025-01-14T09:00:00Z',
        note: 'Shipped via FedEx Express. AWB: FE20250114-7741. ETA: Jan 15.',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // ORD-2510 | DELIVERED — Workstation build
  // ─────────────────────────────────────────────────────────────
  {
    id: 'ORD-2510',
    customerName: 'Deepak Chawla',
    email: 'deepak.chawla@3dstudio.in',
    date: '2025-01-03T16:00:00Z',
    status: OrderStatus.DELIVERED,
    items: [
      { ...PRODUCTS.find(p => p.id === 'cpu-6')!, quantity: 1 },   // Threadripper
      { ...PRODUCTS.find(p => p.id === 'gpu-1')!, quantity: 2 },   // RTX 4090 x2
      { ...PRODUCTS.find(p => p.id === 'ram-1')!, quantity: 4 },   // 32GB DDR5 x4
      { ...PRODUCTS.find(p => p.id === 'stg-1')!, quantity: 2 },   // 1TB NVMe x2
      { ...PRODUCTS.find(p => p.id === 'psu-3')!, quantity: 1 },   // 1000W Gold
      { ...PRODUCTS.find(p => p.id === 'cab-3')!, quantity: 1 },   // Full Tower
    ],
    total: 135000 + 370000 + 50000 + 21000 + 16000 + 35000,
    shippingAddress: {
      street: 'Studio 3, Film City Road',
      city: 'Hyderabad',
      state: 'Telangana',
      zip: '500032',
      country: 'India',
    },
    payment: {
      method: 'Net Banking',
      status: 'Success',
      transactionId: 'RTGS-20250103-DCHAWLA-7712',
    },
    logs: [
      { status: OrderStatus.PENDING, timestamp: '2025-01-03T16:00:00Z' },
      { status: OrderStatus.PAID, timestamp: '2025-01-03T16:45:00Z', note: 'RTGS confirmed. High-value order flagged for priority handling.' },
      { status: OrderStatus.PROCESSING, timestamp: '2025-01-04T09:00:00Z', note: 'Senior warehouse staff assigned. Bubble-wrapped and foam-packed each GPU separately.' },
      { status: OrderStatus.SHIPPED, timestamp: '2025-01-05T10:00:00Z', note: 'Shipped via Safexpress Cargo. Docket: SX2025010500321. Fragile label applied.' },
      { status: OrderStatus.DELIVERED, timestamp: '2025-01-08T14:00:00Z', note: 'Delivered and unpacked by customer. All items verified OK.' },
    ],
  },
];


export const MOCK_REVIEWS: Review[] = [
  {
    id: 'rev-1',
    productId: 'cpu-1',
    customerName: 'Gamer123',
    rating: 5,
    comment: 'Absolute beast for gaming!',
    status: 'approved',
    date: '2023-10-10'
  },
  {
    id: 'rev-2',
    productId: 'gpu-1',
    customerName: 'ProEditor',
    rating: 5,
    comment: 'Renders 4K video in seconds. Expensive but worth it.',
    status: 'approved',
    date: '2023-10-12'
  },
  {
    id: 'rev-3',
    productId: 'mobo-3',
    customerName: 'BudgetBuilder',
    rating: 4,
    comment: 'Good value, but bios flashback was tricky.',
    status: 'approved',
    date: '2023-10-15'
  },
  {
    id: 'rev-4',
    productId: 'cpu-1',
    customerName: 'Hater',
    rating: 1,
    comment: 'Overheats too much.',
    status: 'pending',
    date: '2023-10-28'
  }
];

export const MOCK_SAVED_BUILDS: SavedBuild[] = [
  {
    id: 'build-gaming-1',
    name: 'High-End Gaming Build (1440p / 4K)',
    date: '2024-12-10',
    items: [
      { ...PRODUCTS.find(p => p.id === 'cpu-1')!, quantity: 1 }, // 7800X3D
      { ...PRODUCTS.find(p => p.id === 'mobo-1')!, quantity: 1 }, // X670E
      { ...PRODUCTS.find(p => p.id === 'gpu-2')!, quantity: 1 }, // RX 7800 XT
      { ...PRODUCTS.find(p => p.id === 'ram-1')!, quantity: 1 }, // 32GB DDR5
      { ...PRODUCTS.find(p => p.id === 'stg-1')!, quantity: 1 }, // 990 Pro 1TB
      { ...PRODUCTS.find(p => p.id === 'psu-3')!, quantity: 1 }, // 1000W Gold
      { ...PRODUCTS.find(p => p.id === 'cab-1')!, quantity: 1 }, // Lian Li O11
      { ...PRODUCTS.find(p => p.id === 'cool-1')!, quantity: 1 }, // 360mm AIO
    ],
    total: 36000 + 42000 + 52000 + 12500 + 10500 + 16000 + 14000 + 11000,
  },
  {
    id: 'build-budget-1',
    name: 'Budget 1080p Gaming Build',
    date: '2024-11-22',
    items: [
      { ...PRODUCTS.find(p => p.id === 'cpu-19')!, quantity: 1 }, // Ryzen 5 5600
      { ...PRODUCTS.find(p => p.id === 'mobo-3')!, quantity: 1 }, // B550M
      { ...PRODUCTS.find(p => p.id === 'gpu-5')!, quantity: 1 }, // RX 6600
      { ...PRODUCTS.find(p => p.id === 'ram-2')!, quantity: 1 }, // 16GB DDR4
      { ...PRODUCTS.find(p => p.id === 'stg-3')!, quantity: 1 }, // 500GB SSD
      { ...PRODUCTS.find(p => p.id === 'psu-2')!, quantity: 1 }, // 550W
      { ...PRODUCTS.find(p => p.id === 'cab-2')!, quantity: 1 }, // Corsair 4000D
    ],
    total: 12500 + 9000 + 19500 + 4500 + 3500 + 4500 + 7000,
  },

  {
    id: 'build-workstation-1',
    name: 'Content Creation / Workstation Build',
    date: '2024-10-05',
    items: [
      { ...PRODUCTS.find(p => p.id === 'cpu-6')!, quantity: 1 }, // Threadripper
      { ...PRODUCTS.find(p => p.id === 'mobo-24')!, quantity: 1 }, // X670E Carbon
      { ...PRODUCTS.find(p => p.id === 'gpu-1')!, quantity: 1 }, // RTX 4090
      { ...PRODUCTS.find(p => p.id === 'ram-1')!, quantity: 2 }, // 64GB DDR5
      { ...PRODUCTS.find(p => p.id === 'stg-1')!, quantity: 2 }, // 2TB NVMe
      { ...PRODUCTS.find(p => p.id === 'psu-3')!, quantity: 1 }, // 1000W
      { ...PRODUCTS.find(p => p.id === 'cab-3')!, quantity: 1 }, // Full Tower
      { ...PRODUCTS.find(p => p.id === 'cool-4')!, quantity: 1 }, // Custom loop
    ],
    total: 135000 + 46000 + 185000 + 25000 + 21000 + 16000 + 35000 + 14500,
  },
];

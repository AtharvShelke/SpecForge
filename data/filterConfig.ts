
import { Category, CategoryFilterConfig } from '../types';

export const FILTER_CONFIG: CategoryFilterConfig[] = [
  // ─── PROCESSOR ─────────────────────────────────────────────────────────────
  {
    category: Category.PROCESSOR,
    filters: [
      // Universal filters
      { key: 'specs.brand', label: 'Manufacturer', type: 'checkbox', options: ['AMD', 'Intel'] },
      { key: 'stock_status', label: 'Stock Status', type: 'checkbox', options: ['In Stock', 'Out of Stock'] },

      // ── AMD-specific filters ──
      { key: 'specs.family', label: 'CPU', type: 'checkbox', options: ['Athlon', 'Ryzen 3', 'Ryzen 5', 'Ryzen 7', 'Ryzen 9'], dependency: { key: 'specs.brand', value: 'AMD' } },
      { key: 'specs.cores', label: 'Cores', type: 'checkbox', options: ['2', '4', '6', '8', '12', '16', '24'], dependency: { key: 'specs.brand', value: 'AMD' } },
      { key: 'specs.series', label: 'Series', type: 'checkbox', options: ['3000 Series', '5000 Series', '7000 Series', '8000 Series', '9000 Series'], dependency: { key: 'specs.brand', value: 'AMD' } },
      { key: 'specs.socket', label: 'Socket', type: 'checkbox', options: ['AM4', 'AM5'], dependency: { key: 'specs.brand', value: 'AMD' } },
      { key: 'specs.maxMemory', label: 'Max Memory Support', type: 'checkbox', options: ['64 GB', '128 GB', '192 GB', '256 GB'], dependency: { key: 'specs.brand', value: 'AMD' } },
      { key: 'specs.integratedGraphics', label: 'Integrated Graphics', type: 'checkbox', options: ['No', 'Radeon Graphics', 'Radeon Vega 3', 'Radeon Vega 8', 'Radeon Vega 11'], dependency: { key: 'specs.brand', value: 'AMD' } },

      // ── Intel-specific filters ──
      { key: 'specs.family', label: 'CPU', type: 'checkbox', options: ['Core Ultra 5', 'Core Ultra 7', 'Core Ultra 9', 'Core i3', 'Core i5', 'Core i7', 'Core i9'], dependency: { key: 'specs.brand', value: 'Intel' } },
      { key: 'specs.cores', label: 'Cores', type: 'checkbox', options: ['2', '4', '6', '8', '10', '12', '14', '20', '24'], dependency: { key: 'specs.brand', value: 'Intel' } },
      { key: 'specs.generation', label: 'Series', type: 'checkbox', options: ['9th Gen', '10th Gen', '11th Gen', '12th Gen', '13th Gen', '14th Gen'], dependency: { key: 'specs.brand', value: 'Intel' } },
      { key: 'specs.socket', label: 'Socket', type: 'checkbox', options: ['LGA1151', 'LGA1200', 'LGA1700', 'LGA1851'], dependency: { key: 'specs.brand', value: 'Intel' } },
      { key: 'specs.maxMemory', label: 'Max Memory Support', type: 'checkbox', options: ['64 GB', '128 GB', '192 GB', '256 GB'], dependency: { key: 'specs.brand', value: 'Intel' } },
      { key: 'specs.integratedGraphics', label: 'Integrated Graphics', type: 'checkbox', options: ['No', 'Intel UHD Graphics 630', 'Intel UHD Graphics 730', 'Intel UHD Graphics 770'], dependency: { key: 'specs.brand', value: 'Intel' } },
    ]
  },

  // ─── CPU COOLER ────────────────────────────────────────────────────────────
  {
    category: Category.COOLER,
    filters: [
      { key: 'specs.brand', label: 'Manufacturer', type: 'checkbox', options: ['AEROCOOL', 'ALSEYE', 'Ant Esports', 'ANTEC', 'ARCTIC', 'Cooler Master', 'Corsair', 'DeepCool', 'Lian Li', 'Noctua', 'NZXT'] },
      { key: 'stock_status', label: 'Stock Status', type: 'checkbox', options: ['In Stock', 'Out of Stock'] },
      { key: 'specs.type', label: 'Cooling Type', type: 'checkbox', options: ['AIR COOLER', 'LIQUID AIO COOLER'] },
      { key: 'specs.socket', label: 'Socket Support', type: 'checkbox', options: ['AM2', 'AM2+', 'AM3', 'AM3+', 'AM4', 'AM5', 'LGA1151', 'LGA1200', 'LGA1700'] },
      { key: 'specs.radiatorSize', label: 'Radiator Size', type: 'checkbox', options: ['240mm', '280mm', '360mm', '420mm'] },
      { key: 'specs.fanSize', label: 'Fan Size', type: 'checkbox', options: ['40mm', '60mm', '90mm', '92mm', '120mm', '140mm'] },
      { key: 'specs.pwm', label: 'PWM Controller', type: 'checkbox', options: ['NA', 'YES'] },
    ]
  },

  // ─── MOTHERBOARD ───────────────────────────────────────────────────────────
  {
    category: Category.MOTHERBOARD,
    filters: [
      { key: 'specs.brand', label: 'Manufacturer', type: 'checkbox', options: ['ASROCK', 'ASUS', 'GIGABYTE', 'MSI'] },
      { key: 'stock_status', label: 'Stock Status', type: 'checkbox', options: ['In Stock', 'Out of Stock'] },
      { key: 'specs.platform', label: 'Platform', type: 'checkbox', options: ['AMD', 'Intel'] },

      // ── AMD Platform-specific ──
      { key: 'specs.socket', label: 'Socket', type: 'checkbox', options: ['AM4', 'AM5'], dependency: { key: 'specs.platform', value: 'AMD' } },
      { key: 'specs.chipset', label: 'Chipset', type: 'checkbox', options: ['A520', 'B450', 'B550', 'B650', 'X570', 'X670', 'X870'], dependency: { key: 'specs.platform', value: 'AMD' } },
      { key: 'specs.ramType', label: 'Supported Memory Type', type: 'checkbox', options: ['DDR4', 'DDR5'], dependency: { key: 'specs.platform', value: 'AMD' } },
      { key: 'specs.formFactor', label: 'Form Factor', type: 'checkbox', options: ['ATX', 'Micro-ATX', 'Mini-ITX', 'E-ATX'], dependency: { key: 'specs.platform', value: 'AMD' } },

      // ── Intel Platform-specific ──
      { key: 'specs.socket', label: 'Socket', type: 'checkbox', options: ['LGA1151', 'LGA1200', 'LGA1700', 'LGA1851'], dependency: { key: 'specs.platform', value: 'Intel' } },
      { key: 'specs.chipset', label: 'Chipset', type: 'checkbox', options: ['B760', 'H510', 'H610', 'Z690', 'Z790', 'Z890'], dependency: { key: 'specs.platform', value: 'Intel' } },
      { key: 'specs.ramType', label: 'Supported Memory Type', type: 'checkbox', options: ['DDR4', 'DDR5'], dependency: { key: 'specs.platform', value: 'Intel' } },
      { key: 'specs.formFactor', label: 'Form Factor', type: 'checkbox', options: ['ATX', 'Micro-ATX', 'Mini-ITX', 'E-ATX'], dependency: { key: 'specs.platform', value: 'Intel' } },
    ]
  },

  // ─── GRAPHICS CARD ─────────────────────────────────────────────────────────
  {
    category: Category.GPU,
    filters: [
      { key: 'specs.brand', label: 'Manufacturer', type: 'checkbox', options: ['ASROCK', 'ASUS', 'GALAX', 'GIGABYTE', 'INNO3D', 'MSI', 'Sapphire', 'Zotac'] },
      { key: 'stock_status', label: 'Stock Status', type: 'checkbox', options: ['In Stock', 'Out of Stock'] },
      { key: 'specs.chipset', label: 'Chipset', type: 'checkbox', options: ['AMD RADEON', 'NVIDIA GEFORCE', 'NVIDIA QUADRO', 'Intel Arc'] },
      { key: 'specs.model', label: 'GPU', type: 'checkbox', options: ['A400', 'A1000', 'GT 710', 'GT 730', 'GT 1030', 'GTX 1650', 'GTX 1660', 'RTX 3060', 'RTX 3070', 'RTX 4060', 'RTX 4070', 'RTX 4080', 'RTX 4090', 'RX 6600', 'RX 7600', 'RX 7800 XT', 'RX 7900 XTX'] },
      { key: 'specs.pcie', label: 'PCI EXPRESS', type: 'checkbox', options: ['2.0', '3.0', '4.0', '5.0'] },
      { key: 'specs.memory', label: 'Memory Size', type: 'checkbox', options: ['2GB', '4GB', '6GB', '8GB', '12GB', '16GB', '20GB', '24GB'] },
      { key: 'specs.memoryType', label: 'Memory Type', type: 'checkbox', options: ['DDR3', 'GDDR5', 'GDDR6', 'GDDR6X', 'GDDR7'] },
    ]
  },

  // ─── RAM ───────────────────────────────────────────────────────────────────
  {
    category: Category.RAM,
    filters: [
      { key: 'specs.brand', label: 'Manufacturer', type: 'checkbox', options: ['ACER', 'ADATA', 'CORSAIR', 'CRUCIAL', 'EVM', 'G.Skill', 'Kingston', 'TeamGroup'] },
      { key: 'stock_status', label: 'Stock Status', type: 'checkbox', options: ['In Stock', 'Out of Stock'] },
      { key: 'specs.series', label: 'Product Series', type: 'checkbox', options: ['AEGIS', 'DOMINATOR PLATINUM RGB', 'DOMINATOR RGB DDR5', 'DOMINATOR TITANIUM RGB DDR5', 'FURY BEAST', 'TRIDENT Z5', 'VENGEANCE'] },
      { key: 'specs.ramType', label: 'Memory Type', type: 'checkbox', options: ['DDR4', 'DDR5'] },
      { key: 'specs.capacity', label: 'Capacity', type: 'checkbox', options: ['4GB', '8GB', '16GB', '32GB', '48GB', '64GB'] },
      { key: 'specs.kit', label: 'Kit Type', type: 'checkbox', options: ['4x1', '8x1', '16x1', '16x2', '24x2', '32x2'] },
      { key: 'specs.frequency', label: 'Speed', type: 'checkbox', options: ['2666 MHz', '3200 MHz', '4800 MHz', '5200 MHz', '5600 MHz', '6000 MHz', '6400 MHz'] },
    ]
  },

  // ─── STORAGE ───────────────────────────────────────────────────────────────
  {
    category: Category.STORAGE,
    filters: [
      { key: 'specs.brand', label: 'Manufacturer', type: 'checkbox', options: ['ACER', 'ADATA', 'ADDLINK', 'Ant Esports', 'ASUS', 'Crucial', 'Kingston', 'Samsung', 'Seagate', 'Western Digital'] },
      { key: 'stock_status', label: 'Stock Status', type: 'checkbox', options: ['In Stock', 'Out of Stock'] },
      { key: 'specs.type', label: 'Category', type: 'checkbox', options: ['Enterprise SSD', 'External HDD', 'External SSD', 'Internal HDD', 'Internal SSD', 'Pen Drive'] },
      { key: 'specs.series', label: 'Series', type: 'checkbox', options: ['690 NEO', '870 EVO', '990 EVO', '990 PRO', '9100 PRO'] },
      { key: 'specs.capacity', label: 'Capacity', type: 'checkbox', options: ['500GB', '1TB', '1.92TB', '2TB', '3.84TB', '4TB', '8TB'] },
    ]
  },

  // ─── SMPS (PSU) ────────────────────────────────────────────────────────────
  {
    category: Category.PSU,
    filters: [
      { key: 'specs.brand', label: 'Manufacturer', type: 'checkbox', options: ['Ant Esports', 'ANTEC', 'ASUS', 'COOLER MASTER', 'CORSAIR', 'DeepCool', 'MSI', 'Seasonic'] },
      { key: 'stock_status', label: 'Stock Status', type: 'checkbox', options: ['In Stock', 'Out of Stock'] },
      { key: 'specs.wattage', label: 'Wattage', type: 'checkbox', options: ['400', '450', '500', '520', '550', '650', '750', '850', '1000', '1200'] },
      { key: 'specs.series', label: 'Series', type: 'checkbox', options: ['ATOM', 'AURA', 'AXi', 'C', 'CSK', 'HX', 'RM', 'RMx'] },
      { key: 'specs.efficiency', label: 'Certification', type: 'checkbox', options: ['Bronze', 'Gold', 'Platinum', 'Silver', 'Titanium'] },
      { key: 'specs.modular', label: 'Modular', type: 'checkbox', options: ['Fully', 'Non', 'Semi'] },
      { key: 'specs.pcie62', label: 'PCIe Connector (6+2)', type: 'checkbox', options: ['1', '2', '3', '4', '5'] },
      { key: 'specs.sata', label: 'SATA Connector', type: 'checkbox', options: ['2', '3', '4', '5', '6'] },
      { key: 'specs.peripheral4pin', label: 'Peripheral 4-Pin', type: 'checkbox', options: ['1', '2', '3', '4', '5'] },
    ]
  },

  // ─── CABINET ───────────────────────────────────────────────────────────────
  {
    category: Category.CABINET,
    filters: [
      { key: 'specs.brand', label: 'Manufacturer', type: 'checkbox', options: ['AEROCOOL', 'Ant Esports', 'ANTEC', 'ARCTIC', 'ASUS', 'Cooler Master', 'Corsair', 'Lian Li', 'NZXT'] },
      { key: 'stock_status', label: 'Stock Status', type: 'checkbox', options: ['In Stock', 'Out of Stock'] },
      { key: 'specs.formFactor', label: 'Cabinet Size', type: 'checkbox', options: ['Full', 'Mid', 'Mini', 'Super', 'SFF'] },
      { key: 'specs.motherboardSupport', label: 'Motherboard Size', type: 'checkbox', options: ['ATX', 'E-ATX', 'ITX', 'M-ATX', 'M-ITX'] },
      { key: 'specs.radiatorSupport', label: 'Radiator Support', type: 'checkbox', options: ['120mm', '140mm', '240mm', '280mm', '360mm'] },
    ]
  },

  // ─── MONITOR ───────────────────────────────────────────────────────────────
  {
    category: Category.MONITOR,
    filters: [
      { key: 'specs.brand', label: 'Manufacturer', type: 'checkbox', options: ['AOC', 'ASUS', 'BENQ', 'COOLER MASTER', 'DELL', 'LG', 'MSI', 'Samsung', 'ViewSonic'] },
      { key: 'stock_status', label: 'Stock Status', type: 'checkbox', options: ['In Stock', 'Out of Stock'] },
      { key: 'specs.size', label: 'Screen Size', type: 'checkbox', options: ['22 Inch', '24 Inch', '27 Inch', '32 Inch', '34 Inch', '49 Inch'] },
      { key: 'specs.displayType', label: 'Display Type', type: 'checkbox', options: ['FHD', 'QHD', 'UHD', 'DQHD', '5K HDR'] },
      { key: 'specs.panel', label: 'Panel Type', type: 'checkbox', options: ['IPS', 'OLED', 'QD-OLED', 'TN', 'VA'] },
      { key: 'specs.resolution', label: 'Resolution', type: 'checkbox', options: ['1080p', '1440p', '2K', '4K', '5K'] },
      { key: 'specs.responseTime', label: 'Response Time', type: 'checkbox', options: ['0.5ms', '1ms', '2ms', '4ms', '5ms'] },
      { key: 'specs.refreshRate', label: 'Refresh Rate', type: 'checkbox', options: ['60Hz', '75Hz', '144Hz', '165Hz', '240Hz', '360Hz'] },
      { key: 'specs.surface', label: 'Screen Surface', type: 'checkbox', options: ['CURVED', 'FLAT'] },
      { key: 'specs.connectivity', label: 'Connectivity', type: 'checkbox', options: ['D-SUB', 'DISPLAY PORT', 'DVI', 'HDMI', 'USB-C'] },
    ]
  },

  // ─── PERIPHERALS ───────────────────────────────────────────────────────────
  {
    category: Category.PERIPHERAL,
    filters: [
      { key: 'specs.brand', label: 'Manufacturer', type: 'checkbox' },
      { key: 'stock_status', label: 'Stock Status', type: 'checkbox', options: ['In Stock', 'Out of Stock'] },
      { key: 'specs.type', label: 'Type', type: 'checkbox', options: ['Headset', 'Keyboard', 'Mouse', 'Mouse Pad', 'Speaker', 'Headphone', 'Webcam', 'Software'] },
      { key: 'specs.connectivity', label: 'Connectivity', type: 'checkbox', options: ['Wired', 'Wireless', 'Bluetooth'] },
    ]
  },

  // ─── NETWORKING ────────────────────────────────────────────────────────────
  {
    category: Category.NETWORKING,
    filters: [
      { key: 'specs.brand', label: 'Manufacturer', type: 'checkbox' },
      { key: 'stock_status', label: 'Stock Status', type: 'checkbox', options: ['In Stock', 'Out of Stock'] },
      { key: 'specs.type', label: 'Device Type', type: 'checkbox', options: ['Router', 'Switch', 'Adapter', 'Cable'] },
    ]
  },

  // ─── LAPTOP ────────────────────────────────────────────────────────────────
  {
    category: Category.LAPTOP,
    filters: [
      { key: 'specs.brand', label: 'Manufacturer', type: 'checkbox', options: ['ACER', 'ASUS', 'HP', 'MSI', 'Lenovo', 'Dell'] },
      { key: 'stock_status', label: 'Stock Status', type: 'checkbox', options: ['In Stock', 'Out of Stock'] },
      { key: 'specs.processor', label: 'Processor', type: 'checkbox', options: ['AMD Ryzen 3', 'AMD Ryzen 5', 'AMD Ryzen 7', 'Intel Core 5', 'Intel Core i3', 'Intel Core i5', 'Intel Core i7'] },
      { key: 'specs.processorSeries', label: 'Processor Series', type: 'checkbox', options: ['Intel 12th Gen', 'Intel 13th Gen', 'Intel 14th Gen', 'Ryzen 5000 Series', 'Ryzen 7000 Series'] },
      { key: 'specs.memorySize', label: 'Memory Size', type: 'checkbox', options: ['8GB', '16GB', '32GB'] },
      { key: 'specs.memoryType', label: 'Memory Type', type: 'checkbox', options: ['DDR4', 'DDR5', 'LPDDR5'] },
      { key: 'specs.ssd', label: 'SSD', type: 'checkbox', options: ['256GB NVMe', '512GB NVMe', '1TB NVMe'] },
      { key: 'specs.graphics', label: 'Graphics', type: 'checkbox', options: ['AMD Radeon', 'Integrated', 'Intel Graphics', 'Iris Xe', 'UHD', 'NVIDIA RTX 3050', 'NVIDIA RTX 4050', 'NVIDIA RTX 4060'] },
      { key: 'specs.screenResolution', label: 'Screen Resolution', type: 'checkbox', options: ['1080p', '1440p', '2K', '4K'] },
    ]
  },
];

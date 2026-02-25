
import { Category, CategoryFilterConfig } from '../types';

export const FILTER_CONFIG: CategoryFilterConfig[] = [
  {
    category: Category.PROCESSOR,
    filters: [
      { key: 'specs.brand', label: 'Manufacturer', type: 'checkbox', options: ['AMD', 'Intel'] },
      { key: 'stock_status', label: 'Stock Status', type: 'checkbox', options: ['In Stock', 'Out of Stock'] },
      
      // AMD Filters
      { key: 'specs.family', label: 'CPU Family', type: 'checkbox', options: ['Athlon', 'Ryzen 3', 'Ryzen 5', 'Ryzen 7', 'Ryzen 9'], dependency: { key: 'specs.brand', value: 'AMD' } },
      { key: 'specs.cores', label: 'Cores', type: 'checkbox', options: ['2', '4', '6', '8', '12', '16', '24'], dependency: { key: 'specs.brand', value: 'AMD' } },
      { key: 'specs.series', label: 'Series', type: 'checkbox', options: ['3000 Series', '5000 Series', '7000 Series', '8000 Series', '9000 Series'], dependency: { key: 'specs.brand', value: 'AMD' } },
      { key: 'specs.socket', label: 'Socket', type: 'checkbox', options: ['AM4', 'AM5'], dependency: { key: 'specs.brand', value: 'AMD' } },
      { key: 'specs.maxMemory', label: 'Max Memory Support', type: 'checkbox', options: ['128 GB', '192 GB', '256 GB'], dependency: { key: 'specs.brand', value: 'AMD' } },
      { key: 'specs.integratedGraphics', label: 'Integrated Graphics', type: 'checkbox', options: ['No', 'Radeon Graphics', 'Radeon Vega 3', 'Radeon Vega 8', 'Radeon Vega 11'], dependency: { key: 'specs.brand', value: 'AMD' } },

      // Intel Filters
      { key: 'specs.family', label: 'CPU Line', type: 'checkbox', options: ['Core i3', 'Core i5', 'Core i7', 'Core i9', 'Core Ultra 5', 'Core Ultra 7', 'Core Ultra 9'], dependency: { key: 'specs.brand', value: 'Intel' } },
      { key: 'specs.cores', label: 'Cores', type: 'checkbox', options: ['4', '6', '10', '12', '14', '20', '24'], dependency: { key: 'specs.brand', value: 'Intel' } },
      { key: 'specs.generation', label: 'Series', type: 'checkbox', options: ['9th Gen', '10th Gen', '11th Gen', '12th Gen', '13th Gen', '14th Gen'], dependency: { key: 'specs.brand', value: 'Intel' } },
      { key: 'specs.socket', label: 'Socket', type: 'checkbox', options: ['LGA1151', 'LGA1200', 'LGA1700', 'LGA1851'], dependency: { key: 'specs.brand', value: 'Intel' } },
      { key: 'specs.maxMemory', label: 'Max Memory Support', type: 'checkbox', options: ['64 GB', '128 GB', '192 GB', '256 GB'], dependency: { key: 'specs.brand', value: 'Intel' } },
      { key: 'specs.integratedGraphics', label: 'Integrated Graphics', type: 'checkbox', options: ['No', 'Yes', 'Intel UHD Graphics 630', 'Intel UHD Graphics 730', 'Intel UHD Graphics 770'], dependency: { key: 'specs.brand', value: 'Intel' } },
    ]
  },
  {
    category: Category.COOLER,
    filters: [
      { key: 'specs.brand', label: 'Manufacturer', type: 'checkbox', options: ['Aerocool', 'Alseye', 'Ant Esports', 'Antec', 'Arctic', 'Cooler Master', 'Corsair', 'DeepCool', 'Lian Li', 'Noctua', 'NZXT'] },
      { key: 'stock_status', label: 'Stock Status', type: 'checkbox', options: ['In Stock', 'Out of Stock'] },
      { key: 'specs.type', label: 'Cooling Type', type: 'checkbox', options: ['Air Cooler', 'AIO Liquid Cooler', 'Liquid Cooler'] },
      { key: 'specs.socket', label: 'Socket Support', type: 'checkbox', options: ['AM4', 'AM5', 'LGA1200', 'LGA1700'] },
      { key: 'specs.size', label: 'Radiator Size', type: 'checkbox', options: ['240mm', '280mm', '360mm', '420mm'] },
      { key: 'specs.fanSize', label: 'Fan Size', type: 'checkbox', options: ['120mm', '140mm'] },
      { key: 'specs.pwm', label: 'PWM Controller', type: 'checkbox', options: ['Yes', 'No'] },
    ]
  },
  {
    category: Category.MOTHERBOARD,
    filters: [
      { key: 'specs.brand', label: 'Manufacturer', type: 'checkbox', options: ['ASRock', 'ASUS', 'Gigabyte', 'MSI'] },
      { key: 'stock_status', label: 'Stock Status', type: 'checkbox', options: ['In Stock', 'Out of Stock'] },
      { key: 'specs.platform', label: 'Platform', type: 'checkbox', options: ['AMD', 'Intel'] },
      { key: 'specs.socket', label: 'Socket', type: 'checkbox', options: ['AM4', 'AM5', 'LGA1700', 'LGA1200'] },
      { key: 'specs.chipset', label: 'Chipset', type: 'checkbox', options: ['A520', 'B450', 'B550', 'B650', 'B760', 'X570', 'X670', 'Z690', 'Z790'] },
      { key: 'specs.ramType', label: 'Supported Memory', type: 'checkbox', options: ['DDR4', 'DDR5'] },
      { key: 'specs.formFactor', label: 'Form Factor', type: 'checkbox', options: ['ATX', 'E-ATX', 'Micro-ATX', 'Mini-ITX'] },
    ]
  },
  {
    category: Category.GPU,
    filters: [
      { key: 'specs.brand', label: 'Manufacturer', type: 'checkbox', options: ['ASRock', 'ASUS', 'Galax', 'Gigabyte', 'Inno3D', 'MSI', 'Zotac'] },
      { key: 'stock_status', label: 'Stock Status', type: 'checkbox', options: ['In Stock', 'Out of Stock'] },
      { key: 'specs.chipset', label: 'Chipset', type: 'checkbox', options: ['AMD Radeon', 'NVIDIA GeForce', 'NVIDIA Quadro', 'Intel Arc'] },
      { key: 'specs.model', label: 'GPU Model', type: 'checkbox' }, // Dynamically populated usually
      { key: 'specs.pcie', label: 'PCI Express', type: 'checkbox', options: ['3.0', '4.0', '5.0'] },
      { key: 'specs.memory', label: 'Memory Size', type: 'checkbox', options: ['4GB', '6GB', '8GB', '10GB', '12GB', '16GB', '20GB', '24GB'] },
      { key: 'specs.memoryType', label: 'Memory Type', type: 'checkbox', options: ['GDDR5', 'GDDR6', 'GDDR6X'] },
    ]
  },
  {
    category: Category.RAM,
    filters: [
      { key: 'specs.brand', label: 'Manufacturer', type: 'checkbox', options: ['ADATA', 'Corsair', 'Crucial', 'G.Skill', 'Kingston', 'TeamGroup'] },
      { key: 'stock_status', label: 'Stock Status', type: 'checkbox', options: ['In Stock', 'Out of Stock'] },
      { key: 'specs.series', label: 'Product Series', type: 'checkbox' },
      { key: 'specs.ramType', label: 'Memory Type', type: 'checkbox', options: ['DDR4', 'DDR5'] },
      { key: 'specs.capacity', label: 'Capacity', type: 'checkbox', options: ['8GB', '16GB', '32GB', '48GB', '64GB'] },
      { key: 'specs.kit', label: 'Kit Type', type: 'checkbox', options: ['Single Module', 'Dual Channel Kit', 'Quad Channel Kit'] },
      { key: 'specs.frequency', label: 'Speed', type: 'checkbox', options: ['3200MHz', '3600MHz', '4800MHz', '5200MHz', '5600MHz', '6000MHz', '6400MHz'] },
    ]
  },
  {
    category: Category.STORAGE,
    filters: [
      { key: 'specs.brand', label: 'Manufacturer', type: 'checkbox', options: ['ADATA', 'Crucial', 'Kingston', 'Samsung', 'Seagate', 'Western Digital'] },
      { key: 'stock_status', label: 'Stock Status', type: 'checkbox', options: ['In Stock', 'Out of Stock'] },
      { key: 'specs.type', label: 'Category', type: 'checkbox', options: ['Internal SSD', 'Internal HDD', 'External SSD', 'External HDD', 'Memory Card'] },
      { key: 'specs.interface', label: 'Interface', type: 'checkbox', options: ['SATA', 'NVMe Gen3', 'NVMe Gen4', 'NVMe Gen5'] },
      { key: 'specs.capacity', label: 'Capacity', type: 'checkbox', options: ['500GB', '1TB', '2TB', '4TB', '8TB'] },
    ]
  },
  {
    category: Category.PSU,
    filters: [
      { key: 'specs.brand', label: 'Manufacturer', type: 'checkbox', options: ['Antec', 'ASUS', 'Cooler Master', 'Corsair', 'DeepCool', 'MSI'] },
      { key: 'stock_status', label: 'Stock Status', type: 'checkbox', options: ['In Stock', 'Out of Stock'] },
      { key: 'specs.wattage', label: 'Wattage', type: 'range' }, // Treated as text options in sidebar for now based on prompt
      { key: 'specs.efficiency', label: 'Certification', type: 'checkbox', options: ['80 Plus Bronze', '80 Plus Gold', '80 Plus Platinum', '80 Plus Titanium'] },
      { key: 'specs.modular', label: 'Modular Type', type: 'checkbox', options: ['Fully Modular', 'Semi Modular', 'Non Modular'] },
    ]
  },
  {
    category: Category.CABINET,
    filters: [
      { key: 'specs.brand', label: 'Manufacturer', type: 'checkbox', options: ['Aerocool', 'Ant Esports', 'Antec', 'Cooler Master', 'Corsair', 'Lian Li', 'NZXT'] },
      { key: 'stock_status', label: 'Stock Status', type: 'checkbox', options: ['In Stock', 'Out of Stock'] },
      { key: 'specs.formFactor', label: 'Cabinet Size', type: 'checkbox', options: ['Full Tower', 'Mid Tower', 'Mini Tower'] },
      { key: 'specs.motherboardSupport', label: 'Motherboard Size', type: 'checkbox', options: ['ATX', 'E-ATX', 'Micro-ATX', 'Mini-ITX'] },
    ]
  },
  {
    category: Category.MONITOR,
    filters: [
      { key: 'specs.brand', label: 'Manufacturer', type: 'checkbox', options: ['Acer', 'ASUS', 'BenQ', 'Dell', 'LG', 'MSI', 'Samsung'] },
      { key: 'stock_status', label: 'Stock Status', type: 'checkbox', options: ['In Stock', 'Out of Stock'] },
      { key: 'specs.size', label: 'Screen Size', type: 'checkbox', options: ['24 Inch', '27 Inch', '32 Inch', '34 Inch'] },
      { key: 'specs.panel', label: 'Panel Type', type: 'checkbox', options: ['IPS', 'VA', 'TN', 'OLED'] },
      { key: 'specs.resolution', label: 'Resolution', type: 'checkbox', options: ['1080p', '1440p', '4K'] },
      { key: 'specs.refreshRate', label: 'Refresh Rate', type: 'checkbox', options: ['60Hz', '75Hz', '144Hz', '165Hz', '240Hz'] },
      { key: 'specs.surface', label: 'Screen Surface', type: 'checkbox', options: ['Flat', 'Curved'] },
    ]
  },
  {
    category: Category.PERIPHERAL,
    filters: [
        { key: 'specs.brand', label: 'Manufacturer', type: 'checkbox' },
        { key: 'stock_status', label: 'Stock Status', type: 'checkbox', options: ['In Stock', 'Out of Stock'] },
        { key: 'specs.type', label: 'Type', type: 'checkbox', options: ['Keyboard', 'Mouse', 'Headset'] },
        { key: 'specs.connectivity', label: 'Connectivity', type: 'checkbox', options: ['Wired', 'Wireless', 'Bluetooth'] },
    ]
  },
  {
    category: Category.NETWORKING,
    filters: [
        { key: 'specs.brand', label: 'Manufacturer', type: 'checkbox' },
        { key: 'stock_status', label: 'Stock Status', type: 'checkbox', options: ['In Stock', 'Out of Stock'] },
        { key: 'specs.type', label: 'Device Type', type: 'checkbox', options: ['Router', 'Switch', 'Adapter'] },
    ]
  }
];
